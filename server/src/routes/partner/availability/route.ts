/**
 * Partner Availability Management API
 * GET /api/partner/availability - Get availability
 * POST /api/partner/availability - Create/update availability
 * DELETE /api/partner/availability - Delete availability
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

interface AvailabilityBody {
  type?: 'regular' | 'special' | 'time_slot';
  data?: {
    day_of_week?: number;
    is_open?: boolean;
    open_time?: string;
    close_time?: string;
    max_capacity?: number;
    notes?: string;
    date?: string;
    reason?: string;
    start_time?: string;
    end_time?: string;
    is_available?: boolean;
    price_multiplier?: number;
  };
}

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

    // Check if user is partner and get hospital
    const [roleResult, hospitalResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('hospitals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const { data: roleData } = roleResult;
    const { data: hospital, error: hospitalError } = hospitalResult;

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    const queries: any[] = [
      supabase
        .from('hospital_availability')
        .select('*')
        .eq('hospital_id', hospital.id)
        .order('day_of_week')
    ];

    if (date) {
      queries.push(
        supabase
          .from('hospital_special_availability')
          .select('*')
          .eq('hospital_id', hospital.id)
          .eq('date', date)
          .maybeSingle()
      );
      queries.push(
        supabase
          .from('hospital_time_slots')
          .select('*')
          .eq('hospital_id', hospital.id)
          .eq('date', date)
          .order('start_time')
      );
    }

    const [regularAvailabilityResult, specialAvailabilityResult, timeSlotsResult] = await Promise.all(queries as any);

    return NextResponse.json({
      success: true,
      data: {
        regularAvailability: regularAvailabilityResult.data || [],
        specialAvailability: specialAvailabilityResult?.data || null,
        timeSlots: timeSlotsResult?.data || [],
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

async function handleRegularAvailability(supabase: any, hospitalId: string, availabilityData: AvailabilityBody['data']) {
  const { data, error } = await supabase
    .from('hospital_availability')
    .upsert({
      hospital_id: hospitalId,
      day_of_week: availabilityData.day_of_week,
      is_open: availabilityData.is_open ?? true,
      open_time: availabilityData.open_time || null,
      close_time: availabilityData.close_time || null,
      max_capacity: availabilityData.max_capacity || null,
      notes: availabilityData.notes || null,
    }, {
      onConflict: 'hospital_id,day_of_week',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function handleSpecialAvailability(supabase: any, hospitalId: string, availabilityData: any) {
  const { data, error } = await supabase
    .from('hospital_special_availability')
    .upsert({
      hospital_id: hospitalId,
      date: availabilityData.date,
      is_open: availabilityData.is_open ?? false,
      open_time: availabilityData.open_time || null,
      close_time: availabilityData.close_time || null,
      max_capacity: availabilityData.max_capacity || null,
      reason: availabilityData.reason || null,
      notes: availabilityData.notes || null,
    }, {
      onConflict: 'hospital_id,date',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function handleTimeSlotAvailability(supabase: any, hospitalId: string, availabilityData: any) {
  const { data, error } = await supabase
    .from('hospital_time_slots')
    .upsert({
      hospital_id: hospitalId,
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

  return data;
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

    // Check if user is partner and get hospital
    const [roleResult, hospitalResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('hospitals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const { data: roleData } = roleResult;
    const { data: hospital, error: hospitalError } = hospitalResult;

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
      );
    }

    const body = await request.json() as AvailabilityBody;
    const { type, data: availabilityData = {} } = body;

    if (type === 'regular') {
      if (!availabilityData) {
        return NextResponse.json(
          { success: false, error: 'Availability data is required for regular type' },
          { status: 400 }
        );
      }
      const data = await handleRegularAvailability(supabase, hospital.id, availabilityData);
      return NextResponse.json({
        success: true,
        data,
      });
    } else if (type === 'special') {
      if (!availabilityData || Object.keys(availabilityData).length === 0) {
        return NextResponse.json(
          { success: false, error: 'Availability data is required for special type' },
          { status: 400 }
        );
      }
      const data = await handleSpecialAvailability(supabase, hospital.id, availabilityData);
      return NextResponse.json({
        success: true,
        data,
      });
    } else if (type === 'time_slot') {
      if (!availabilityData || Object.keys(availabilityData).length === 0) {
        return NextResponse.json(
          { success: false, error: 'Availability data is required for time_slot type' },
          { status: 400 }
        );
      }
      const data = await handleTimeSlotAvailability(supabase, hospital.id, availabilityData);
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

    // Check if user is partner and get hospital
    const [roleResult, hospitalResult] = await Promise.all([
      supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle(),
      supabase
        .from('hospitals')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const { data: roleData } = roleResult;
    const { data: hospital, error: hospitalError } = hospitalResult;

    if (!roleData || roleData.role !== 'partner') {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    if (hospitalError || !hospital) {
      return NextResponse.json(
        { success: false, error: 'hospital not found' },
        { status: 404 }
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
      tableName = 'hospital_availability';
    } else if (type === 'special') {
      tableName = 'hospital_special_availability';
    } else if (type === 'time_slot') {
      tableName = 'hospital_time_slots';
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid type' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)
      .eq('hospital_id', hospital.id);

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
