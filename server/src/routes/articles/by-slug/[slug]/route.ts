import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

// Helper function to check if user is admin
async function checkIsAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();
    
    return data?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * GET /api/articles/by-slug/[slug]
 * ดูบทความเดียวตาม slug (public route)
 * - Public: ดูได้เฉพาะบทความที่ published
 * - Admin: ดูได้ทุกบทความ
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createClient();
    const { slug } = await params;

    // Check if user is admin
    let isAdmin = false;
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!authError && user) {
        isAdmin = await checkIsAdmin(supabase, user.id);
      }
    } catch (authError) {
      // If auth check fails, continue as non-admin user
      console.warn('Auth check failed, continuing as non-admin:', authError);
    }

    // Get article
    let query = supabase
      .from('articles')
      .select('*')
      .eq('slug', slug);

    // If not admin, only show published articles
    if (!isAdmin) {
      query = query.eq('is_published', true);
    }

    const { data: article, error } = await query.maybeSingle();

    if (error) {
      console.error('Get article error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch article' },
        { status: 500 }
      );
    }

    if (!article) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Increment views count (non-blocking)
    try {
      await supabase
        .from('articles')
        .update({ views_count: (article.views_count || 0) + 1 })
        .eq('id', article.id);
    } catch (viewError) {
      console.warn('Error incrementing views count:', viewError);
      // Continue even if view count update fails
    }

    // Get author name if not set
    let authorName = article.author_name;
    if (!authorName && article.author_id) {
      try {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('display_name, full_name')
          .eq('user_id', article.author_id)
          .maybeSingle();
        
        authorName = profile?.display_name || profile?.full_name || 'Unknown';
      } catch (profileError) {
        console.warn('Error fetching author profile:', profileError);
        authorName = authorName || 'Unknown';
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        author_name: authorName,
        views_count: (article.views_count || 0) + 1, // Return incremented count
      },
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Get article error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

