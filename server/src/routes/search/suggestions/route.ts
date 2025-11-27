import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * GET /api/search/suggestions
 * Get search suggestions/autocomplete with relevance scoring
 * Query params:
 * - q: search query (required, at least 2 characters)
 * - limit: number of suggestions (default: 5)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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
      type: 'hospital' | 'article';
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
    
    // Get hospital suggestions (search both Thai and English names)
    const { data: hospitals } = await supabase
      .from('hospitals')
      .select('id, hospital_name, hospital_name_english')
      .or(`hospital_name.ilike.${searchTerm},hospital_name_english.ilike.${searchTerm}`)
      .eq('status', 'approved')
      .limit(limit * 2); // Fetch more to sort by relevance
    
    if (hospitals) {
      for (const hospital of hospitals) {
        const displayName = hospital.hospital_name_english || hospital.hospital_name || '';
        const relevance = Math.max(
          calculateRelevance(hospital.hospital_name || '', searchQuery),
          hospital.hospital_name_english ? calculateRelevance(hospital.hospital_name_english, searchQuery) : 0
        );
        
        if (relevance > 0) {
          suggestions.push({
            text: displayName,
            type: 'hospital',
            id: hospital.id,
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
        // Then by type priority (hospitals > articles)
        const typePriority: Record<string, number> = { hospital: 2, article: 1 };
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
