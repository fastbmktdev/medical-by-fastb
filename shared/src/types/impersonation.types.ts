/**
 * User Impersonation Types
 * Types for admin user impersonation feature
 */

export interface UserImpersonation {
  id: string;
  admin_user_id: string;
  impersonated_user_id: string;
  reason?: string | null;
  started_at: string;
  ended_at?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  session_id?: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ImpersonationContext {
  isImpersonating: boolean;
  adminUserId: string | null;
  adminEmail: string | null;
  impersonatedUserId: string | null;
  impersonatedEmail: string | null;
  impersonationId: string | null;
  startedAt: string | null;
}

export interface ImpersonateRequest {
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface ImpersonateResponse {
  success: boolean;
  impersonation?: UserImpersonation;
  sessionToken?: string;
  error?: string;
}

export interface StopImpersonationResponse {
  success: boolean;
  error?: string;
}

