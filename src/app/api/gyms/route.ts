/**
 * Gyms API Endpoint (Admin Only)
 * 
 * GET /api/gyms - List all gyms
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    const supabase = await createClient();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    // Check if user is admin
    if (roleData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all gyms with user info
    const { data: gyms, error } = await supabase
      .from('gyms')
      .select(`
        *,
        profiles:user_id (
          username,
          full_name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching gyms:', error);
      return NextResponse.json(
        { error: 'Failed to fetch gyms' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: gyms?.length || 0,
      gyms: gyms || [],
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

