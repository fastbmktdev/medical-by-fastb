import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';
import { User } from '@supabase/supabase-js';

type AuthenticatedApiHandler<T> = (
  request: NextRequest,
  context: { params: T },
  user: User
) => Promise<NextResponse> | NextResponse;

export function withAdminAuth<T>(handler: AuthenticatedApiHandler<T>) {
  return async (request: NextRequest, context: { params: T }) => {
    try {
      const supabase = await createClient();

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
      
      return handler(request, context, user);

    } catch (error) {
      console.error('API Auth Middleware Error:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error during authentication',
        },
        { status: 500 }
      );
    }
  };
}
