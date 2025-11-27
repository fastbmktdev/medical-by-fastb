import type { NextRequest } from 'next/server';
import type { User } from '@supabase/supabase-js';
import type { AuditLog } from '@shared/types/database.types';
import { createServerClient } from '@shared/lib/database/supabase/server';

type SupabaseServerClient = Awaited<ReturnType<typeof createServerClient>>;

type AuditActionType = AuditLog['action_type'];
type AuditResourceType = AuditLog['resource_type'];
type AuditSeverity = AuditLog['severity'];

export interface AuditLogEventOptions {
  supabase: SupabaseServerClient;
  request?: NextRequest;
  user?: User | null;
  action: AuditActionType;
  resourceType: AuditResourceType;
  resourceId?: string | null;
  resourceName?: string | null;
  description?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  severity?: AuditSeverity;
  success?: boolean;
  errorMessage?: string | null;
  sessionId?: string | null;
}

interface RequestMetadata {
  ipAddress: string | null;
  userAgent: string | null;
  method: string | null;
  path: string | null;
  params: Record<string, string> | null;
  sessionId: string | null;
}

function extractRequestMetadata(request?: NextRequest): RequestMetadata {
  if (!request) {
    return {
      ipAddress: null,
      userAgent: null,
      method: null,
      path: null,
      params: null,
      sessionId: null,
    };
  }

  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const ipCandidate = forwardedFor?.split(',')[0]?.trim() || realIp || null;

  const userAgent = request.headers.get('user-agent') || null;
  const sessionId = request.headers.get('x-session-id') || request.headers.get('x-supabase-session') || null;

  let path: string | null = null;
  let params: Record<string, string> | null = null;

  try {
    const url = new URL(request.url);
    path = url.pathname;
    if (url.searchParams.size > 0) {
      params = Object.fromEntries(url.searchParams.entries());
    }
  } catch {
    // Ignore URL parsing errors
  }

  return {
    ipAddress: ipCandidate,
    userAgent,
    method: request.method || null,
    path,
    params,
    sessionId,
  };
}

/**
 * Helper for logging audit events from API routes.
 * Automatically captures request context and persists audit details via Supabase RPC.
 *
 * @returns The audit log ID when successful, otherwise null
 */
export async function logAuditEvent(options: AuditLogEventOptions): Promise<string | null> {
  const {
    supabase,
    request,
    user,
    action,
    resourceType,
    resourceId = null,
    resourceName = null,
    description = null,
    oldValues = null,
    newValues = null,
    metadata = null,
    severity = 'medium',
    success = true,
    errorMessage = null,
    sessionId,
  } = options;

  const { ipAddress, userAgent, method, path, params, sessionId: sessionFromHeaders } = extractRequestMetadata(request);

  try {
    const { data, error } = await supabase.rpc('log_audit_event', {
      p_user_id: user?.id ?? null,
      p_action_type: action,
      p_resource_type: resourceType,
      p_resource_id: resourceId,
      p_resource_name: resourceName,
      p_description: description,
      p_old_values: oldValues,
      p_new_values: newValues,
      p_metadata: metadata,
      p_severity: severity,
      p_ip_address: ipAddress,
      p_user_agent: userAgent,
      p_request_method: method,
      p_request_path: path,
      p_request_params: params,
      p_success: success,
      p_error_message: errorMessage,
      p_session_id: sessionId ?? sessionFromHeaders,
    });

    if (error) {
      console.warn('Failed to log audit event:', error);
      return null;
    }

    return typeof data === 'string' ? data : (data as { id?: string })?.id ?? null;
  } catch (auditError) {
    console.warn('Unexpected error when logging audit event:', auditError);
    return null;
  }
}

