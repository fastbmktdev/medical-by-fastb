// Authentication Types
import type { User } from '@supabase/supabase-js';

export type { User };

export interface SignUpCredentials {
  email: string;
  password: string;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

