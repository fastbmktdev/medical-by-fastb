import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * POST /api/articles/[id]/versions/[versionId]/restore
 * Restore an article to a specific version (Admin only)
 */
export const POST = withAdminAuth<{ id: string; versionId: string }>(async (
  request: NextRequest,
  context: { params: Promise<{ id: string; versionId: string }> },
  user
) => {
  try {
    const supabase = await createClient();
    const { id, versionId } = await context.params;

    // Get version
    const { data: version, error: versionError } = await supabase
      .from('article_versions')
      .select('*')
      .eq('id', versionId)
      .eq('article_id', id)
      .maybeSingle();

    if (versionError || !version) {
      return NextResponse.json(
        { success: false, error: 'Version not found' },
        { status: 404 }
      );
    }

    // Create a new version of current article before restoring
    const { data: currentArticle } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (currentArticle) {
      // Get next version number
      const { data: maxVersion } = await supabase
        .from('article_versions')
        .select('version_number')
        .eq('article_id', id)
        .order('version_number', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      // Save current state as version
      await supabase
        .from('article_versions')
        .insert({
          article_id: id,
          version_number: nextVersion,
          title: currentArticle.title,
          excerpt: currentArticle.excerpt,
          content: currentArticle.content,
          category: currentArticle.category,
          image: currentArticle.image,
          tags: currentArticle.tags,
          meta_title: currentArticle.meta_title,
          meta_description: currentArticle.meta_description,
          meta_keywords: currentArticle.meta_keywords,
          created_by: user.id,
          change_summary: 'Auto-saved before restore',
        });
    }

    // Restore article from version
    const { data: restoredArticle, error: restoreError } = await supabase
      .from('articles')
      .update({
        title: version.title,
        excerpt: version.excerpt,
        content: version.content,
        category: version.category,
        image: version.image,
        tags: version.tags,
        meta_title: version.meta_title,
        meta_description: version.meta_description,
        meta_keywords: version.meta_keywords,
      })
      .eq('id', id)
      .select()
      .single();

    if (restoreError) {
      throw restoreError;
    }

    return NextResponse.json({
      success: true,
      data: restoredArticle,
    });
  } catch (error) {
    console.error('Restore article version error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to restore version' },
      { status: 500 }
    );
  }
});

