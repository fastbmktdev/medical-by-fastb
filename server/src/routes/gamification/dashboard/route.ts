import { NextRequest, NextResponse } from 'next/server';
import { createExpressClient } from "@shared/lib/database/supabase/express";
import { getGamificationDashboard } from '@shared/services/gamification.service';

export async function GET(request: NextRequest) {
  try {
    console.log('[Gamification Dashboard] Starting request...');
    
    const { supabase } = createExpressClient(request);
    console.log('[Gamification Dashboard] Created Supabase client');

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error('[Gamification Dashboard] Auth error:', authError);
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: authError.message,
          success: false 
        }, 
        { status: 401 }
      );
    }

    if (!user) {
      console.warn('[Gamification Dashboard] No user found');
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'User not authenticated',
          success: false 
        }, 
        { status: 401 }
      );
    }

    console.log('[Gamification Dashboard] User authenticated:', user.id);

    // Get complete gamification dashboard
    console.log('[Gamification Dashboard] Fetching dashboard data...');
    const dashboard = await getGamificationDashboard(user.id);
    console.log('[Gamification Dashboard] Dashboard data received:', dashboard ? 'success' : 'null');

    if (!dashboard) {
      console.error('[Gamification Dashboard] Dashboard data is null');
      return NextResponse.json(
        { 
          error: 'Failed to get gamification dashboard',
          message: 'Dashboard data is null',
          success: false 
        },
        { status: 500 }
      );
    }

    console.log('[Gamification Dashboard] Returning dashboard data');
    return NextResponse.json({
      data: dashboard,
      error: null,
      success: true,
    });
  } catch (error) {
    console.error('[Gamification Dashboard] Error:', error);
    
    // Provide more detailed error information in development
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error && process.env.NODE_ENV === 'development' 
      ? error.stack 
      : undefined;
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: errorStack,
        success: false 
      },
      { status: 500 }
    );
  }
}
