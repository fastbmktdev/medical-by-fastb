import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * Get Health Goals API
 * GET /api/users/goals
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('user_fitness_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get health goals error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to get health goals' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data || []
    });

  } catch (error) {
    console.error('Get health goals error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Create Health Goal API
 * POST /api/users/goals
 * 
 * Body:
 * {
 *   goal_type: 'appointment_frequency' | 'weight' | 'health_metric' | 'custom',
 *   title: string,
 *   description?: string,
 *   target_value?: number,
 *   unit?: string,
 *   target_date?: string (ISO date)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json() as {
      goal_type?: string;
      title?: string;
      description?: string;
      target_value?: number;
      unit?: string;
      target_date?: string;
    };
    const { goal_type, title, description, target_value, unit, target_date } = body;

    if (!goal_type || !title) {
      return NextResponse.json(
        { success: false, error: 'goal_type and title are required' },
        { status: 400 }
      );
    }

    // Valid goal types for health goals
    const validGoalTypes = [
      'appointment_frequency', // For hospital appointments
      'weight',
      'health_metric',         // Health metrics
      'custom'
    ];
    
    // Map to database constraint values (database constraint uses legacy values)
    const goalTypeMap: Record<string, string> = {
      'appointment_frequency': 'training_frequency', // Map to existing DB constraint (legacy)
      'health_metric': 'skill'                       // Map to existing DB constraint (legacy)
    };
    
    const dbGoalType = goalTypeMap[goal_type] || goal_type;
    
    if (!validGoalTypes.includes(goal_type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid goal_type' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('user_fitness_goals')
      .insert({
        user_id: user.id,
        goal_type: dbGoalType, // Use mapped type for database
        title,
        description,
        target_value,
        unit,
        target_date: target_date || null,
        current_value: 0,
        is_completed: false
      })
      .select()
      .single();

    if (error) {
      console.error('Create health goal error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create health goal' },
        { status: 500 }
      );
    }

    // Map back to original goal_type in response
    const responseData = {
      ...data,
      goal_type: goal_type // Return original goal_type, not mapped one
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Health goal created successfully'
    });

  } catch (error) {
    console.error('Create health goal error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

