import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * Update Health Goal API
 * PUT /api/users/goals/[id]
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const updateData: Partial<{
      title: string;
      description: string | null;
      target_value: number | null;
      current_value: number | null;
      unit: string | null;
      target_date: string | null;
      is_completed: boolean;
      completed_at: string | null;
    }> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.target_value !== undefined) updateData.target_value = body.target_value;
    if (body.current_value !== undefined) updateData.current_value = body.current_value;
    if (body.unit !== undefined) updateData.unit = body.unit;
    if (body.target_date !== undefined) updateData.target_date = body.target_date || null;
    if (body.is_completed !== undefined) {
      updateData.is_completed = body.is_completed;
      if (body.is_completed) {
        updateData.completed_at = new Date().toISOString();
      } else {
        updateData.completed_at = null;
      }
    }

    const { data, error } = await supabase
      .from('user_fitness_goals')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Update health goal error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update health goal' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Health goal not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Health goal updated successfully'
    });

  } catch (error) {
    console.error('Update health goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Delete Health Goal API
 * DELETE /api/users/goals/[id]
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { error } = await supabase
      .from('user_fitness_goals')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Delete health goal error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to delete health goal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Health goal deleted successfully'
    });

  } catch (error) {
    console.error('Delete health goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

