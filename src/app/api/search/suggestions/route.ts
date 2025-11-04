import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/search/suggestions
 * Get search suggestions/autocomplete
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
    
    const searchTerm = `%${query.trim()}%`;
    const suggestions: Array<{
      text: string;
      type: 'gym' | 'event' | 'article';
      id: string;
    }> = [];
    
    // Get gym suggestions
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id, gym_name')
      .ilike('gym_name', searchTerm)
      .eq('status', 'approved')
      .limit(limit);
    
    if (gyms) {
      for (const gym of gyms) {
        suggestions.push({
          text: gym.gym_name || '',
          type: 'gym',
          id: gym.id,
        });
      }
    }
    
    // Get event suggestions
    const { data: events } = await supabase
      .from('events')
      .select('id, name')
      .ilike('name', searchTerm)
      .eq('is_published', true)
      .limit(limit);
    
    if (events) {
      for (const event of events) {
        suggestions.push({
          text: event.name || '',
          type: 'event',
          id: event.id,
        });
      }
    }
    
    // Get article suggestions
    const { data: articles } = await supabase
      .from('articles')
      .select('id, title')
      .ilike('title', searchTerm)
      .eq('is_published', true)
      .limit(limit);
    
    if (articles) {
      for (const article of articles) {
        suggestions.push({
          text: article.title || '',
          type: 'article',
          id: article.id,
        });
      }
    }
    
    // Limit total suggestions and sort by relevance (simple: alphabetically for now)
    const limitedSuggestions = suggestions
      .slice(0, limit)
      .sort((a, b) => a.text.localeCompare(b.text));
    
    return NextResponse.json({
      success: true,
      query,
      suggestions: limitedSuggestions,
    });
    
  } catch (error) {
    console.error('Search suggestions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}
