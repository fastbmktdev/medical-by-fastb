import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@shared/lib/database/supabase/server';
import { User } from '@supabase/supabase-js';
import { errorResponse, UnauthorizedError, ForbiddenError } from './error-handler';

type AuthenticatedApiHandler<T> = (
  request: NextRequest,
  context: { params: Promise<T> },
  user: User
) => Promise<NextResponse> | NextResponse;

export function withAdminAuth<T>(handler: AuthenticatedApiHandler<T>) {
  return async (request: NextRequest, context: { params: Promise<T> }) => {
    try {
      const supabase = await createServerClient();

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return errorResponse(new UnauthorizedError('Unauthorized - Please log in'));
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (roleError || roleData?.role !== 'admin') {
        return errorResponse(new ForbiddenError('Forbidden - Admin access required'));
      }
      
      return handler(request, context, user);

    } catch (error) {
      console.error('API Auth Middleware Error:', error);
      return errorResponse(error, 'Internal server error during authentication');
    }
  };
}
