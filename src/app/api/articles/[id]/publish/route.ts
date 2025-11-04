import { NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { withAdminAuth } from '@/lib/api/withAdminAuth';

/**
 * POST /api/articles/[id]/publish
 * เผยแพร่บทความ (Admin only)
 * Body: { is_published: boolean }
 */
const publishArticleHandler = withAdminAuth<{ id: string }>(async (
  request,
  context,
  _user
) => {
  try {
    const supabase = await createClient();
    const { id } = await context.params;

    const body = await request.json();
    const { is_published } = body;

    if (typeof is_published !== 'boolean') {
      return NextResponse.json(
        { success: false, error: 'is_published must be a boolean' },
        { status: 400 }
      );
    }

    // Check if article exists
    const { data: existingArticle, error: fetchError } = await supabase
      .from('articles')
      .select('id, title, published_at')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !existingArticle) {
      return NextResponse.json(
        { success: false, error: 'Article not found' },
        { status: 404 }
      );
    }

    // Update publish status
    const updateData: {
      is_published: boolean;
      published_at?: string;
    } = {
      is_published: is_published,
    };

    // Set published_at timestamp
    if (is_published && !existingArticle.published_at) {
      updateData.published_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('articles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Publish article error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update publish status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: is_published ? 'เผยแพร่บทความสำเร็จ' : 'ยกเลิกการเผยแพร่บทความสำเร็จ',
    });

  } catch (error) {
    console.error('Publish article error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
});

export { publishArticleHandler as POST };

