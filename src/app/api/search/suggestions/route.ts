import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/search/suggestions
 * Get search suggestions/autocomplete with relevance scoring
 * Query params:
 * - q: search query (required, at least 2 characters)
 * - limit: number of suggestions (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '5');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        success: true,
        suggestions: [],
      });
    }
    
    const searchQuery = query.trim().toLowerCase();
    const searchTerm = `%${searchQuery}%`;
    const suggestions: Array<{
      text: string;
      type: 'gym' | 'event' | 'article';
      id: string;
      relevance: number;
    }> = [];
    
    // Calculate relevance score (higher = more relevant)
    const calculateRelevance = (text: string, query: string): number => {
      const lowerText = text.toLowerCase();
      const lowerQuery = query.toLowerCase();
      
      // Exact match gets highest score
      if (lowerText === lowerQuery) return 100;
      
      // Starts with query gets high score
      if (lowerText.startsWith(lowerQuery)) return 80;
      
      // Contains query at word boundary gets medium-high score
      const wordBoundaryRegex = new RegExp(`\\b${lowerQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i');
      if (wordBoundaryRegex.test(lowerText)) return 60;
      
      // Contains query anywhere gets lower score
      if (lowerText.includes(lowerQuery)) return 40;
      
      return 0;
    };
    
    // Get gym suggestions (search both Thai and English names)
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, gym_name, gym_name_english')
      .or(`gym_name.ilike.${searchTerm},gym_name_english.ilike.${searchTerm}`)
      .eq('status', 'approved')
      .limit(limit * 2); // Fetch more to sort by relevance
    
    if (gyms) {
      for (const gym of gyms) {
        const displayName = gym.gym_name_english || gym.gym_name || '';
        const relevance = Math.max(
          calculateRelevance(gym.gym_name || '', searchQuery),
          gym.gym_name_english ? calculateRelevance(gym.gym_name_english, searchQuery) : 0
        );
        
        if (relevance > 0) {
          suggestions.push({
            text: displayName,
            type: 'gym',
            id: gym.id,
            relevance,
          });
        }
      }
    }
    
    // Get event suggestions (search both Thai and English names)
    const { data: events } = await supabase
      .from('events')
      .select('id, name, name_english')
      .or(`name.ilike.${searchTerm},name_english.ilike.${searchTerm}`)
      .eq('is_published', true)
      .limit(limit * 2);
    
    if (events) {
      for (const event of events) {
        const displayName = event.name_english || event.name || '';
        const relevance = Math.max(
          calculateRelevance(event.name || '', searchQuery),
          event.name_english ? calculateRelevance(event.name_english, searchQuery) : 0
        );
        
        if (relevance > 0) {
          suggestions.push({
            text: displayName,
            type: 'event',
            id: event.id,
            relevance,
          });
        }
      }
    }
    
    // Get article suggestions
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', searchTerm)
      .eq('is_published', true)
      .limit(limit * 2);
    
    if (articles) {
      for (const article of articles) {
        const relevance = calculateRelevance(article.title || '', searchQuery);
        
        if (relevance > 0) {
          suggestions.push({
            text: article.title || '',
            type: 'article',
            id: article.id,
            relevance,
          });
        }
      }
    }
    
    // Sort by relevance (descending), then alphabetically, then limit
    const sortedSuggestions = suggestions
      .sort((a, b) => {
        // First sort by relevance
        if (b.relevance !== a.relevance) {
          return b.relevance - a.relevance;
        }
        // Then by type priority (gyms > events > articles)
        const typePriority: Record<string, number> = { gym: 3, event: 2, article: 1 };
        const typeDiff = typePriority[b.type] - typePriority[a.type];
        if (typeDiff !== 0) return typeDiff;
        // Finally alphabetically
        return a.text.localeCompare(b.text);
      })
      .slice(0, limit)
      .map(({ relevance, ...rest }) => rest); // Remove relevance from response
    
    return NextResponse.json({
      success: true,
      query,
      suggestions: sortedSuggestions,
    });
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
