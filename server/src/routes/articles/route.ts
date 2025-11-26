import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';
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
 * GET /api/articles
 * ดูบทความทั้งหมด
 * Query params:
 * - category: หมวดหมู่
 * - published: true/false (default: true for public, false for all if admin)
 * - search: ค้นหาข้อความ
 * - limit: จำนวนที่ต้องการ
 * - offset: offset สำหรับ pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
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

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const publishedParam = searchParams.get('published');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Default: show only published articles for non-admin users
    const published = publishedParam === null 
      ? (!isAdmin ? true : undefined) 
      : publishedParam === 'true';

    let query = supabase
      .from('articles')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    // Apply published filter
    if (published !== undefined) {
      query = query.eq('is_published', published);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply search filter
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,excerpt.ilike.%${search}%,content.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) {
      console.error('Get articles error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch articles' },
        { status: 500 }
      );
    }

    // Get author names for articles
    let authors: Record<string, string> = {};
    try {
      const authorIds = data?.map(a => a.author_id).filter(Boolean) || [];
      
      if (authorIds.length > 0) {
        const { data: profiles, error: profilesError } = await supabase
          .from('user_profiles')
          .select('user_id, display_name, full_name')
          .in('user_id', authorIds);

        if (profilesError) {
          console.warn('Error fetching author profiles:', profilesError);
        } else {
          profiles?.forEach(profile => {
            authors[profile.user_id] = profile.display_name || profile.full_name || 'Unknown';
          });
        }
      }
    } catch (authorError) {
      console.warn('Error processing author names:', authorError);
      // Continue without author names if there's an error
    }

    // Add author names to articles
    const articlesWithAuthors = data?.map(article => ({
      ...article,
      author_name: article.author_name || authors[article.author_id] || 'Unknown',
    })) || [];

    return NextResponse.json({
      success: true,
      data: articlesWithAuthors,
      count: articlesWithAuthors.length,
    }, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Get articles error:', error);
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

/**
 * POST /api/articles
 * สร้างบทความใหม่ (Admin only)
 * Body: {
 *   slug: string (unique)
 *   title: string
 *   excerpt: string
 *   content: string
 *   category: string (must be one of valid categories)
 *   image?: string
 *   tags?: string[]
 *   is_new?: boolean
 *   date?: string (ISO date, default: today)
 * }
 */
const postArticleHandler = withAdminAuth(async (
  request,
  _context,
  user
) => {
  try {
    const supabase = await createClient();
    const body = await request.json() as {
      slug?: string;
      title?: string;
      excerpt?: string;
      content?: string;
      category?: string;
      image?: string;
      tags?: string[];
      is_new?: boolean;
      date?: string;
      meta_title?: string;
      meta_description?: string;
      meta_keywords?: string[];
      og_image?: string;
      og_title?: string;
      og_description?: string;
      twitter_card?: string;
      canonical_url?: string;
      scheduled_publish_at?: string;
    };
    
    const {
      slug,
      title,
      excerpt,
      content,
      category,
      image,
      tags = [],
      is_new = false,
      date,
      // SEO fields
      meta_title,
      meta_description,
      meta_keywords = [],
      og_image,
      og_title,
      og_description,
      twitter_card,
      canonical_url,
      // Scheduling
      scheduled_publish_at,
    } = body;

    // Validation
    if (!slug || !title || !excerpt || !content || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: slug, title, excerpt, content, category' },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = [
      'ประวัติศาสตร์',
      'เทคนิค',
      'สุขภาพ',
      'บุคคล',
      'อุปกรณ์',
      'โภชนาการ',
      'ข่าวสาร',
      'อื่นๆ'
    ];

    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { success: false, error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if slug already exists
    const { data: existing } = await supabase
      .from('articles')
      .select('id')
      .eq('slug', slug)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Get author name from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('display_name, full_name')
      .eq('user_id', user.id)
      .maybeSingle();

    const authorName = profile?.display_name || profile?.full_name || user.email || 'Admin';

    // Insert article
    const articleData: Record<string, unknown> = {
      slug,
      title,
      excerpt,
      content,
      category,
      image: image || null,
      tags: tags || [],
      is_new: is_new || false,
      author_id: user.id,
      author_name: authorName,
      date: date ? new Date(date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      is_published: false, // Default: not published
    };

    // Add SEO fields if provided
    if (meta_title) articleData.meta_title = meta_title;
    if (meta_description) articleData.meta_description = meta_description;
    if (meta_keywords && meta_keywords.length > 0) articleData.meta_keywords = meta_keywords;
    if (og_image) articleData.og_image = og_image;
    if (og_title) articleData.og_title = og_title;
    if (og_description) articleData.og_description = og_description;
    if (twitter_card) articleData.twitter_card = twitter_card;
    if (canonical_url) articleData.canonical_url = canonical_url;

    // Add scheduling if provided
    if (scheduled_publish_at) {
      articleData.scheduled_publish_at = new Date(scheduled_publish_at).toISOString();
    }

    const { data, error } = await supabase
      .from('articles')
      .insert(articleData)
      .select()
      .single();

    if (error) {
      console.error('Create article error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create article' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'สร้างบทความสำเร็จ',
    });

  } catch (error) {
    console.error('Create article error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { postArticleHandler as POST };

