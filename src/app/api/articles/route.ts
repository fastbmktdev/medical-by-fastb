import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

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
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    const isAdmin = !authError && user ? await checkIsAdmin(supabase, user.id) : false;

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
    const authorIds = data?.map(a => a.author_id).filter(Boolean) || [];
    const authors: Record<string, string> = {};

    if (authorIds.length > 0) {
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, full_name')
        .in('user_id', authorIds);

      profiles?.forEach(profile => {
        authors[profile.user_id] = profile.display_name || profile.full_name || 'Unknown';
      });
    }

    // Add author names to articles
    const articlesWithAuthors = data?.map(article => ({
      ...article,
      author_name: article.author_name || authors[article.author_id] || 'Unknown',
    }));

    return NextResponse.json({
      success: true,
      data: articlesWithAuthors || [],
      count: articlesWithAuthors?.length || 0,
    });

  } catch (error) {
    console.error('Get articles error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
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
    const body = await request.json();
    
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
    const { data, error } = await supabase
      .from('articles')
      .insert({
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
      })
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

// Helper function to check if user is admin
async function checkIsAdmin(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

