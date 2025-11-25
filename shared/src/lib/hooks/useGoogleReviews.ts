import { useCallback, useEffect, useMemo, useState } from "react";
import type { GooglePlaceReviewsResponse } from "@shared/lib/utils/googlePlaces";

interface UseGoogleReviewsOptions {
  language?: string;
  enabled?: boolean;
}

export function useGoogleReviews(placeId?: string | null, options?: UseGoogleReviewsOptions) {
  const { language, enabled = true } = options || {};
  const [data, setData] = useState<GooglePlaceReviewsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const url = useMemo(() => {
    if (!placeId) return null;
    const params = new URLSearchParams({ place_id: placeId });
    if (language) params.set("language", language);
    return `/api/hospitals/reviews?${params.toString()}`;
  }, [placeId, language]);

  const fetchReviews = useCallback(async () => {
    if (!url || !enabled) return;
    setIsLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal, cache: "no-store" });
      clearTimeout(timeout);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Failed to load reviews (${res.status})`);
      }
      const json = await res.json();
      setData(json.data as GooglePlaceReviewsResponse);
    } catch (e: unknown) {
      const error = e as { name?: string; message?: string };
      if (error?.name === "AbortError") {
        setError("Request timeout");
      } else {
        setError(error?.message || "Unknown error");
      }
    } finally {
      setIsLoading(false);
    }
  }, [url, enabled]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return { data, isLoading, error, refresh: fetchReviews };
}