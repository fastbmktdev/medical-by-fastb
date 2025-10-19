"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/database/supabase/client";

/**
 * Interface for authentication context value
 */
interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Props for AuthProvider component
 */
interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider Component
 * Manages user authentication state using Supabase Auth
 * 
 * Features:
 * - Automatic session management
 * - Real-time auth state updates
 * - Sign out functionality
 * - Session refresh
 * - Loading state during initialization
 * 
 * @param children - Child components to wrap
 */
export function AuthProvider({ children }: AuthProviderProps) {
  // Supabase client instance
  const supabase = createClient();

  // Authentication state
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state and set up auth listener
   * Runs once on component mount
   */
  useEffect(() => {
    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();

        setSession(initialSession);
        setUser(initialSession?.user ?? null);
      } catch {
        // Silently handle auth initialization errors
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);

        // Handle specific auth events
        if (event === "SIGNED_OUT") {
          // Clear any local data if needed
          setUser(null);
          setSession(null);
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Update user and session
          setSession(currentSession);
          setUser(currentSession?.user ?? null);
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  /**
   * Sign out the current user
   * Clears session and redirects to home page
   */
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      // Clear state
      setUser(null);
      setSession(null);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Manually refresh the current session
   * Useful for keeping the session alive
   */
  const refreshSession = async () => {
    try {
      const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw error;
      }

      setSession(refreshedSession);
      setUser(refreshedSession?.user ?? null);
    } catch (error) {
      throw error;
    }
  };

  // Context value
  const value: AuthContextValue = {
    user,
    session,
    isLoading,
    signOut,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to use authentication context
 * Must be used within AuthProvider
 * 
 * @returns Authentication context value
 * @throws Error if used outside AuthProvider
 * 
 * @example
 * const { user, signOut } = useAuth();
 * 
 * if (user) {
 *   // User is logged in
 * }
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  return context;
}

/**
 * Hook to check if user is authenticated
 * Convenience wrapper around useAuth
 * 
 * @returns boolean indicating if user is authenticated
 * 
 * @example
 * const isAuthenticated = useIsAuthenticated();
 * 
 * if (!isAuthenticated) {
 *   router.push('/login');
 * }
 */
export function useIsAuthenticated(): boolean {
  const { user, isLoading } = useAuth();
  return !isLoading && user !== null;
}

/**
 * Hook to get current user
 * Convenience wrapper around useAuth
 * 
 * @returns Current user or null
 * 
 * @example
 * const user = useUser();
 * 
 * console.log(user?.email);
 */
export function useUser(): User | null {
  const { user } = useAuth();
  return user;
}

