import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * PUT /api/articles/[id]-admin
 * แก้ไขบทความ
 * - Admin: แก้ไขได้ทุกบทความ
 * - Author: แก้ไขได้เฉพาะบทความของตัวเอง
 * 
 * Note: Next.js 15 doesn't recognize dynamic params in [id]-admin route structure.
 * We extract the id from the URL path instead.
 */
export async function PUT(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> }
) {
  try {
    const supabase = await createServerClient();
    // Extract id from URL path since Next.js 15 doesn't recognize [id] in [id]-admin structure
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idIndex = pathParts.findIndex(part => part === 'articles') + 1;
    const id = pathParts[idIndex]?.replace('-admin', '') || '';
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      );
    }

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
      tags,
      is_new,
      date,
      // SEO fields
      meta_title,
      meta_description,
      meta_keywords,
      og_image,
      og_title,
      og_description,
      twitter_card,
      canonical_url,
      // Scheduling
      scheduled_publish_at,
    } = body;

    // Build update object
    const updateData: Record<string, unknown> = {};

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
    
    // SEO fields
    if (meta_title !== undefined) updateData.meta_title = meta_title;
    if (meta_description !== undefined) updateData.meta_description = meta_description;
    if (meta_keywords !== undefined) updateData.meta_keywords = meta_keywords;
    if (og_image !== undefined) updateData.og_image = og_image;
    if (og_title !== undefined) updateData.og_title = og_title;
    if (og_description !== undefined) updateData.og_description = og_description;
    if (twitter_card !== undefined) updateData.twitter_card = twitter_card;
    if (canonical_url !== undefined) updateData.canonical_url = canonical_url;
    
    // Scheduling
    if (scheduled_publish_at !== undefined) {
      updateData.scheduled_publish_at = scheduled_publish_at 
        ? new Date(scheduled_publish_at).toISOString() 
        : null;
    }

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
 * DELETE /api/articles/[id]-admin
 * ลบบทความ (Admin only)
 * 
 * Note: Next.js 15 doesn't recognize dynamic params in [id]-admin route structure.
 * We extract the id from the URL path instead.
 */
export async function DELETE(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> }
) {
  try {
    const supabase = await createServerClient();
    // Extract id from URL path since Next.js 15 doesn't recognize [id] in [id]-admin structure
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const idIndex = pathParts.findIndex(part => part === 'articles') + 1;
    const id = pathParts[idIndex]?.replace('-admin', '') || '';
    
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Article ID is required' },
        { status: 400 }
      );
    }

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
async function checkIsAdmin(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  return data?.role === 'admin';
}

