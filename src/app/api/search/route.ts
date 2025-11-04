import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /api/search
 * Advanced search across multiple content types
 * Query params:
 * - q: search query (required)
 * - type: content type filter (gyms, events, articles, users) - optional
 * - limit: number of results per type (default: 10)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: q (search query)' },
        { status: 400 }
      );
    }
    
    const searchTerm = `%${query.trim()}%`;
    const results: {
      gyms?: unknown[];
      events?: unknown[];
      articles?: unknown[];
      users?: unknown[];
    } = {};
    
    // Search gyms
    if (!type || type === 'gyms') {
      const { data: gyms } = await supabase
        .from('gyms')
        .select('id, gym_name, location, status, created_at')
        .or(`gym_name.ilike.${searchTerm},location.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq('status', 'approved')
        .limit(limit);
      
      results.gyms = gyms || [];
    }
    
    // Search events
    if (!type || type === 'events') {
      const { data: events } = await supabase
        .from('events')
        .select('id, name, name_english, location, event_date, is_published')
        .or(`name.ilike.${searchTerm},name_english.ilike.${searchTerm},location.ilike.${searchTerm},description.ilike.${searchTerm}`)
        .eq('is_published', true)
        .limit(limit);
      
      results.events = events || [];
    }
    
    // Search articles
    if (!type || type === 'articles') {
      const { data: articles } = await supabase
        .from('articles')
        .select('id, title, excerpt, date, is_published')
        .or(`title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`)
        .eq('is_published', true)
        .limit(limit);
      
      results.articles = articles || [];
    }
    
    // Search users (admin only)
    if (!type || type === 'users') {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleData?.role === 'admin') {
          // Admin can search user emails
          const { data: users } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at')
            .limit(limit);
          
          // Note: In a full implementation, you'd join with auth.users
          // to search by email, but that requires special permissions
          results.users = users || [];
        }
      }
    }
    
    const totalResults = 
      (results.gyms?.length || 0) +
      (results.events?.length || 0) +
      (results.articles?.length || 0) +
      (results.users?.length || 0);
    
    return NextResponse.json({
      success: true,
      query,
      totalResults,
      results,
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
