"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { isValidReferralCodeFormat } from '@shared/lib/utils/affiliate';

const REFERRAL_STORAGE_KEY = "referralCode";
const STORAGE_TIMESTAMP_KEY = "referralCodeTimestamp";
const STORAGE_MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ReferralContextValue {
  referralCode: string | null;
  setReferralCode: (code: string | null) => void;
  clearReferralCode: () => void;
  isValid: boolean;
}

const ReferralContext = createContext<ReferralContextValue | undefined>(
  undefined
);

function normalizeReferralCode(code: string): string {
  return code.trim().toUpperCase();
}

/**
 * Check if stored referral code is still valid (not expired)
 */
function isStorageValid(): boolean {
  if (typeof window === "undefined") return false;

  try {
    const timestamp = window.sessionStorage.getItem(STORAGE_TIMESTAMP_KEY);
    if (!timestamp) return false;

    const storedTime = parseInt(timestamp, 10);
    if (isNaN(storedTime)) return false;

    const now = Date.now();
    return (now - storedTime) < STORAGE_MAX_AGE_MS;
  } catch {
    return false;
  }
}

/**
 * Clean up expired or invalid referral code from storage
 */
function cleanupStorage(): void {
  if (typeof window === "undefined") return;

  try {
    if (!isStorageValid()) {
      window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
      window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
    }
  } catch (error) {
    console.warn("[ReferralProvider] Error during cleanup:", error);
  }
}

export function ReferralProvider({ children }: { children: React.ReactNode }) {
  const [referralCode, setReferralCodeState] = useState<string | null>(null);
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial load and cleanup on mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Clean up expired storage first
    cleanupStorage();

    try {
      const storedCode = window.sessionStorage.getItem(REFERRAL_STORAGE_KEY);

      if (storedCode && isValidReferralCodeFormat(storedCode) && isStorageValid()) {
        setReferralCodeState(normalizeReferralCode(storedCode));
      } else if (storedCode) {
        // Clean up invalid or expired value
        window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      }
    } catch (error) {
      console.warn("[ReferralProvider] Unable to read referral code:", error);
      // Clean up on error
      try {
        window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
        window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
      } catch {
        // Ignore cleanup errors
      }
    }

    // Set up periodic cleanup (every hour)
    cleanupIntervalRef.current = setInterval(() => {
      cleanupStorage();
      // Check if current code in state is expired
      const currentCode = window.sessionStorage.getItem(REFERRAL_STORAGE_KEY);
      if (currentCode && !isStorageValid()) {
        setReferralCodeState(null);
      }
    }, 60 * 60 * 1000); // 1 hour

    // Cleanup on unmount
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, []); // Only run on mount

  // Update state if storage becomes invalid (check periodically)
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const checkInterval = setInterval(() => {
      if (referralCode && !isStorageValid()) {
        setReferralCodeState(null);
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(checkInterval);
  }, [referralCode]);

  const persistReferralCode = useCallback((code: string | null) => {
    if (typeof window === "undefined") return;

    try {
      if (code && isValidReferralCodeFormat(code)) {
        const normalized = normalizeReferralCode(code);
        const timestamp = Date.now().toString();

        // Use try-catch for each operation to handle quota exceeded errors
        try {
          window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
          window.sessionStorage.setItem(STORAGE_TIMESTAMP_KEY, timestamp);
          setReferralCodeState(normalized);
        } catch (storageError) {
          // Handle quota exceeded or other storage errors
          if (storageError instanceof DOMException && storageError.name === 'QuotaExceededError') {
            console.warn("[ReferralProvider] Storage quota exceeded, clearing old data");
            // Try to clear and retry
            try {
              window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
              window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
              window.sessionStorage.setItem(REFERRAL_STORAGE_KEY, normalized);
              window.sessionStorage.setItem(STORAGE_TIMESTAMP_KEY, timestamp);
              setReferralCodeState(normalized);
            } catch (retryError) {
              console.warn("[ReferralProvider] Unable to persist after cleanup:", retryError);
              // Fallback: keep in memory only
              setReferralCodeState(normalized);
            }
          } else {
            throw storageError;
          }
        }
      } else {
        // Clear storage
        try {
          window.sessionStorage.removeItem(REFERRAL_STORAGE_KEY);
          window.sessionStorage.removeItem(STORAGE_TIMESTAMP_KEY);
        } catch (error) {
          console.warn("[ReferralProvider] Unable to clear storage:", error);
        }
        setReferralCodeState(null);
      }
    } catch (error) {
      console.warn("[ReferralProvider] Unable to persist referral code:", error);
      // Fallback: keep in memory only (will be lost on refresh)
      setReferralCodeState(code && isValidReferralCodeFormat(code) ? normalizeReferralCode(code) : null);
    }
  }, []);

  const isValid = useMemo(() => {
    if (!referralCode) return false;
    return isValidReferralCodeFormat(referralCode) && isStorageValid();
  }, [referralCode]);

  const api = useMemo<ReferralContextValue>(
    () => ({
      referralCode: isValid ? referralCode : null,
      setReferralCode: (code: string | null) => {
        persistReferralCode(code);
      },
      clearReferralCode: () => {
        persistReferralCode(null);
      },
      isValid,
    }),
    [persistReferralCode, referralCode, isValid]
  );

  return (
    <ReferralContext.Provider value={api}>
      {children}
    </ReferralContext.Provider>
  );
}

export function useReferralCode() {
  const context = useContext(ReferralContext);

  if (!context) {
    throw new Error(
      "useReferralCode must be used within a ReferralProvider"
    );
  }

  return context;
}

