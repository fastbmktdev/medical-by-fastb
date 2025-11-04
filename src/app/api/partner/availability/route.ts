/**
 * Partner Availability Management API
 * GET /api/partner/availability - Get availability
 * POST /api/partner/availability - Create/update availability
 * DELETE /api/partner/availability - Delete availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

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

    // Check if user is partner
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get partner's gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'Gym not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    // Get regular availability
    const { data: regularAvailability, error: regularError } = await supabase
      .from('gym_availability')
      .select('*')
      .eq('gym_id', gym.id)
      .order('day_of_week');

    // Get special availability if date is provided
    let specialAvailability = null;
    if (date) {
      const { data: special, error: specialError } = await supabase
        .from('gym_special_availability')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('date', date)
        .maybeSingle();

      if (!specialError && special) {
        specialAvailability = special;
      }
    }

    // Get time slots if date is provided
    let timeSlots = null;
    if (date) {
      const { data: slots, error: slotsError } = await supabase
        .from('gym_time_slots')
        .select('*')
        .eq('gym_id', gym.id)
        .eq('date', date)
        .order('start_time');

      if (!slotsError && slots) {
        timeSlots = slots;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        regularAvailability: regularAvailability || [],
        specialAvailability,
        timeSlots: timeSlots || [],
      },
    });
    
  } catch (error) {
    console.error('Get availability error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch availability' },
      { status: 500 }
    );
  }
}

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

    // Check if user is partner
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Get partner's gym
    const { data: gym, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (gymError || !gym) {
      return NextResponse.json(
        { success: false, error: 'Gym not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { type, data: availabilityData } = body;

    if (type === 'regular') {
      // Upsert regular availability
      const { data, error } = await supabase
        .from('gym_availability')
        .upsert({
          gym_id: gym.id,
          day_of_week: availabilityData.day_of_week,
          is_open: availabilityData.is_open ?? true,
          open_time: availabilityData.open_time || null,
          close_time: availabilityData.close_time || null,
          max_capacity: availabilityData.max_capacity || null,
          notes: availabilityData.notes || null,
        }, {
          onConflict: 'gym_id,day_of_week',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } else if (type === 'special') {
      // Upsert special availability
      const { data, error } = await supabase
        .from('gym_special_availability')
        .upsert({
          gym_id: gym.id,
          date: availabilityData.date,
          is_open: availabilityData.is_open ?? false,
          open_time: availabilityData.open_time || null,
          close_time: availabilityData.close_time || null,
          max_capacity: availabilityData.max_capacity || null,
          reason: availabilityData.reason || null,
          notes: availabilityData.notes || null,
        }, {
          onConflict: 'gym_id,date',
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data,
      });
    } else if (type === 'time_slot') {
      // Create or update time slot
      const { data, error } = await supabase
        .from('gym_time_slots')
        .upsert({
          gym_id: gym.id,
          date: availabilityData.date,
          start_time: availabilityData.start_time,
          end_time: availabilityData.end_time,
          max_capacity: availabilityData.max_capacity || null,
          is_available: availabilityData.is_available ?? true,
          price_multiplier: availabilityData.price_multiplier || 1.0,
          notes: availabilityData.notes || null,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return NextResponse.json({
        success: true,
        data,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid type' },
      { status: 400 }
    );
    
  } catch (error) {
    console.error('Post availability error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save availability' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is partner
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json(
        { success: false, error: 'Missing type or id' },
        { status: 400 }
      );
    }

    let tableName = '';
    if (type === 'regular') {
      tableName = 'gym_availability';
    } else if (type === 'special') {
      tableName = 'gym_special_availability';
    } else if (type === 'time_slot') {
      tableName = 'gym_time_slots';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Deleted successfully',
    });
    
  } catch (error) {
    console.error('Delete availability error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete availability' },
      { status: 500 }
    );
  }
}

