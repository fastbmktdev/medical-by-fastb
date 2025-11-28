import { useState, useEffect, useCallback } from "react";
import { useRouter } from "@/navigation";
import { User } from "@supabase/supabase-js";
import { createClient } from '@shared/lib/database/supabase/client';
import { ApplicationStatus, HospitalData } from "../types";

/**
 * Hook to manage partner application state and authentication
 */
export const usePartnerApplication = () => {
  const router = useRouter();
  const supabase = createClient();
  
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [applicationStatus, setApplicationStatus] = useState<ApplicationStatus>("none");
  const [existingHospital, setExistingHospital] = useState<HospitalData | null>(null);

  const checkAuthAndRole = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Get current session from Supabase
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        // User is not logged in, redirect to login page
        router.push('/login?redirect=/partner/apply');
        return;
      }

      const currentUser = session.user; 
      setUser(currentUser);

      // Check if user already has a hospital application
      const { data: hospitalData, error: hospitalError } = await supabase
        .from("hospitals")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (hospitalError) {
        if (hospitalError.code === "42P01") {
          console.error("Database tables not set up. Please contact administrator.");
        }
        // Silently handle other errors
      } else if (hospitalData) {
        // User already has an application
        setExistingHospital(hospitalData);
        setApplicationStatus((hospitalData.status as ApplicationStatus) || "pending");
      }

    } catch {
      router.push('/login?redirect=/partner/apply');
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
    existingHospital,
    setExistingHospital,
    setApplicationStatus,
    supabase,
  };
};

