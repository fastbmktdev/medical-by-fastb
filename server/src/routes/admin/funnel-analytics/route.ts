/**
 * Funnel Analytics API
 * GET /api/admin/funnel-analytics
 * 
 * Returns conversion funnel analytics for the admin dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@shared/lib/database/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated and is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const funnelName = searchParams.get('funnelName');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query for funnel analytics
    let query = supabase
      .from('funnel_analytics')
      .select('*')
      .order('funnel_date', { ascending: false })
      .order('step_number', { ascending: true });

    if (funnelName) {
      query = query.eq('funnel_name', funnelName);
    }
    if (startDate) {
      query = query.gte('funnel_date', startDate);
    }
    if (endDate) {
      query = query.lte('funnel_date', endDate);
    }

    const { data: analytics, error: queryError } = await query;

    if (queryError) {
      console.error('Error fetching funnel analytics:', queryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch funnel analytics' },
        { status: 500 }
      );
    }

    // Get unique funnel names
    const { data: funnels } = await supabase
      .from('conversion_funnels')
      .select('funnel_name')
      .order('funnel_name', { ascending: true });

    const uniqueFunnels = Array.from(
      new Set(funnels?.map(f => f.funnel_name) || [])
    );

    // Calculate conversion rates for each funnel
    const funnelStats: Record<string, {
      totalStarted: number;
      totalCompleted: number;
      conversionRate: number;
      steps: Array<{
        stepNumber: number;
        stepName: string;
        entries: number;
        dropOffRate: number;
      }>;
    }> = {};

    analytics?.forEach((item) => {
      if (!funnelStats[item.funnel_name]) {
        funnelStats[item.funnel_name] = {
          totalStarted: 0,
          totalCompleted: 0,
          conversionRate: 0,
          steps: [],
        };
      }

      if (item.step_number === 1) {
        funnelStats[item.funnel_name].totalStarted = item.step_entries;
      }

      const lastStep = analytics
        ?.filter(a => a.funnel_name === item.funnel_name)
        .sort((a, b) => b.step_number - a.step_number)[0];

      if (lastStep && item.step_number === lastStep.step_number) {
        funnelStats[item.funnel_name].totalCompleted = item.completions;
      }

      const previousStep = analytics?.find(a => 
        a.funnel_name === item.funnel_name && 
        a.step_number === item.step_number - 1
      );
      const previousEntries = previousStep?.step_entries || 0;
      const currentEntries = item.step_entries;
      
      funnelStats[item.funnel_name].steps.push({
        stepNumber: item.step_number,
        stepName: item.step_name,
        entries: item.step_entries,
        dropOffRate: item.step_number > 1 && previousEntries > 0
          ? ((previousEntries - currentEntries) / previousEntries) * 100
          : 0,
      });
    });

    // Calculate conversion rates
    Object.keys(funnelStats).forEach((funnelName) => {
      const stats = funnelStats[funnelName];
      if (stats.totalStarted > 0) {
        stats.conversionRate = (stats.totalCompleted / stats.totalStarted) * 100;
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        analytics: analytics || [],
        funnels: uniqueFunnels,
        stats: funnelStats,
      },
    });

  } catch (error) {
    console.error('Funnel analytics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

