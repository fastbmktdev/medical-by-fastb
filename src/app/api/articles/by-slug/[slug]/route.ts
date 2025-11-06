import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAdmin = !authError && user ? await checkIsAdmin(supabase, user.id) : false;

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

    // Increment views count
    await supabase
      .from('articles')
      .update({ views_count: (article.views_count || 0) + 1 })
      .eq('id', article.id);

    // Get author name if not set
    let authorName = article.author_name;
    if (!authorName && article.author_id) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('display_name, full_name')
        .eq('user_id', article.author_id)
        .maybeSingle();
      
      authorName = profile?.display_name || profile?.full_name || 'Unknown';
    }

    return NextResponse.json({
      success: true,
      data: {
        ...article,
        author_name: authorName,
        views_count: (article.views_count || 0) + 1, // Return incremented count
      },
    });

  } catch (error) {
    console.error('Get article error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user is admin
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

