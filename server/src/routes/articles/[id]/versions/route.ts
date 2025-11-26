import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@shared/lib/database/supabase/server';
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/articles/[id]/versions
 * Get all versions of an article (Admin only)
 */
export const GET = withAdminAuth<{ id: string }>(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    _user
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await context.params;

      const { data: versions, error } = await supabase
        .from("article_versions")
        .select("*")
        .eq("article_id", id)
        .order("version_number", { ascending: false });

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data: versions || [],
      });
    } catch (error) {
      console.error("Get article versions error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to fetch versions" },
        { status: 500 }
      );
    }
  }
);

/**
 * POST /api/articles/[id]/versions
 * Create a new version of an article (Admin only)
 */
export const POST = withAdminAuth<{ id: string }>(
  async (
    request: NextRequest,
    context: { params: Promise<{ id: string }> },
    user
  ) => {
    try {
      const supabase = await createClient();
      const { id } = await context.params;
      const body = await request.json() as {
        change_summary?: string;
      };

      // Get current article
      const { data: article, error: articleError } = await supabase
        .from("articles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (articleError || !article) {
        return NextResponse.json(
          { success: false, error: "Article not found" },
          { status: 404 }
        );
      }

      // Get next version number
      const { data: maxVersion } = await supabase
        .from("article_versions")
        .select("version_number")
        .eq("article_id", id)
        .order("version_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextVersion = (maxVersion?.version_number || 0) + 1;

      // Create version record
      const { data: version, error: versionError } = await supabase
        .from("article_versions")
        .insert({
          article_id: id,
          version_number: nextVersion,
          title: article.title,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          image: article.image,
          tags: article.tags,
          meta_title: article.meta_title,
          meta_description: article.meta_description,
          meta_keywords: article.meta_keywords,
          created_by: user.id,
          change_summary: body.change_summary || null,
        })
        .select()
        .single();

      if (versionError) {
        throw versionError;
      }

      return NextResponse.json({
        success: true,
        data: version,
      });
    } catch (error) {
      console.error("Create article version error:", error);
      return NextResponse.json(
        { success: false, error: "Failed to create version" },
        { status: 500 }
      );
    }
  }
);
