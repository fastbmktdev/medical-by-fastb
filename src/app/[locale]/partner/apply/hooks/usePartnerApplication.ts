import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/database/supabase/client";
import { ApplicationStatus, GymData } from "../types";

/**
 * Hook to manage partner application state and authentication
 */
export const usePartnerApplication = () => {
  const router = useRouter();
  const locale = useLocale();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("none");
  const [existingGym, setExistingGym] = useState<GymData | null>(null);

  const checkAuthAndRole = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // User is not logged in, redirect to login page
        router.push(`/${locale}/login?redirect=/${locale}/partner/apply`);
        return;
      }

      const currentUser = session.user;
      setUser(currentUser);

      // Check if user already has a gym application
      const { data: gymData, error: gymError } = await supabase
        .from("gyms")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (gymError) {
        if (gymError.code === "42P01") {
          console.error("Database tables not set up. Please contact administrator.");
        }
        // Silently handle other errors
      } else if (gymData) {
        // User already has an application
        setExistingGym(gymData);
        setApplicationStatus((gymData.status as ApplicationStatus) || "pending");
      }

    } catch {
      router.push(`/${locale}/login?redirect=/${locale}/partner/apply`);
    } finally {
      setIsLoading(false);
    }
  }, [router, supabase]);

  useEffect(() => {
    checkAuthAndRole();
  }, [checkAuthAndRole]);

  return {
    user,
    isLoading,
    applicationStatus,
    existingGym,
    setExistingGym,
    setApplicationStatus,
    supabase,
  };
};

