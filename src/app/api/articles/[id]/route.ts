import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * PUT /api/articles/[id]
 * แก้ไขบทความ
 * - Admin: แก้ไขได้ทุกบทความ
 * - Author: แก้ไขได้เฉพาะบทความของตัวเอง
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);

    // Get existing article
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Check permission: admin or author
    if (!isAdmin && existingArticle.author_id !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - You can only edit your own articles' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      slug,
      title,
      excerpt,
      content,
      category,
      image,
      tags,
      is_new,
      date,
    } = body;

    // Build update object
    const updateData: any = {};

    if (slug !== undefined) {
      // Check if new slug is unique (if different from current)
      if (slug !== existingArticle.slug) {
        const { data: slugExists } = await supabase
          .from('articles')
          .select('id')
          .eq('slug', slug)
          .maybeSingle();

        if (slugExists) {
          return NextResponse.json(
            { success: false, error: 'Slug already exists' },
            { status: 400 }
          );
        }
        updateData.slug = slug;
      }
    }

    if (title !== undefined) updateData.title = title;
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (content !== undefined) updateData.content = content;
    if (image !== undefined) updateData.image = image;
    if (tags !== undefined) updateData.tags = tags;
    if (is_new !== undefined) updateData.is_new = is_new;
    if (date !== undefined) updateData.date = new Date(date).toISOString().split('T')[0];

    // Validate category if provided
    if (category !== undefined) {
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
      updateData.category = category;
    }

    // Update article
    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update article error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update article' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'แก้ไขบทความสำเร็จ',
    });

  } catch (error) {
    console.error('Update article error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/articles/[id]
 * ลบบทความ (Admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const isAdmin = await checkIsAdmin(supabase, user.id);

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Check if article exists
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, title')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Delete article
    const { error } = await supabase
      .from('articles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Delete article error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete article' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'ลบบทความสำเร็จ',
    });

  } catch (error) {
    console.error('Delete article error:', error);
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

