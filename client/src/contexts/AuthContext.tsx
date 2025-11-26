"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from '@shared/lib/database/supabase/client';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('⚠️  Auth initialization error (this is normal if Supabase is not configured):', error.message);
        }
        setSession(initialSession ?? null);
        setUser(initialSession?.user ?? null);
      } catch (error) {
        // Silently handle auth errors - this is normal if Supabase env vars are missing
        console.warn('⚠️  Auth initialization failed (this is normal if Supabase is not configured)');
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event: string, currentSession: any) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        try {
          subscription.unsubscribe();
        } catch {
          // Ignore unsubscribe errors
        }
      };
    } catch (error) {
      // Handle case where auth state change listener fails (e.g., placeholder client)
      console.warn('⚠️  Auth state listener failed (this is normal if Supabase is not configured)');
      return () => {};
    }
  }, [supabase]);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      // Error handled silently
    } finally {
      setUser(null);
      setSession(null);
    }
  };

  const refreshSession = async () => {
    const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    setSession(refreshedSession);
    setUser(refreshedSession?.user ?? null);
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function useIsAuthenticated(): boolean {
  const { user, isLoading } = useAuth();
  return !isLoading && user !== null;
}

export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

