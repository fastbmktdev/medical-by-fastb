import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

/**
 * POST /api/articles/[id]-admin/publish
 * เผยแพร่บทความ (Admin only)
 * Body: { is_published: boolean }
 * 
 * Note: Next.js 15 doesn't recognize dynamic params in [id]-admin route structure.
 * We extract the id from the URL path instead.
 */
export async function POST(
  request: NextRequest,
  _context: { params: Promise<Record<string, string>> }
): Promise<NextResponse> {
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
    
    // Check admin authorization
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Please log in' },
        { status: 401 }
      );
    }

    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleError || roleData?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json() as {
      is_published?: boolean;
    };
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
}

