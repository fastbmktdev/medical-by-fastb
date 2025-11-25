import { cache } from "react";

export interface GoogleReviewAuthor {
  author_name: string;
  profile_photo_url?: string;
  rating: number;
  relative_time_description?: string;
  time?: number;
  text?: string;
  language?: string;
}

export interface GooglePlaceReviewsResponse {
  rating?: number;
  user_ratings_total?: number;
  reviews?: GoogleReviewAuthor[];
}

type GoogleApiStatus =
  | "OK"
  | "ZERO_RESULTS"
  | "OVER_QUERY_LIMIT"
  | "REQUEST_DENIED"
  | "INVALID_REQUEST"
  | "UNKNOWN_ERROR";

interface GooglePlacesDetailsRaw {
  html_attributions?: string[];
  result?: {
    rating?: number;
    user_ratings_total?: number;
    reviews?: GoogleReviewAuthor[];
  };
  status: GoogleApiStatus;
  error_message?: string;
}

const GOOGLE_PLACES_DETAILS_URL =
  "https://maps.googleapis.com/maps/api/place/details/json";

export interface FetchPlaceReviewsParams {
  placeId: string;
  reviewsLanguage?: string;
}

/**
 * Fetch up to 5 public reviews from Google Places Details API.
 * Notes: Google returns max ~5 reviews and may omit text depending on locale/policy.
 */
export const fetchPlaceReviews = cache(
  async ({ placeId, reviewsLanguage }: FetchPlaceReviewsParams): Promise<GooglePlaceReviewsResponse> => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      throw Object.assign(new Error("Missing Google Maps API key"), { code: "CONFIG_MISSING" });
    }

    const params = new URLSearchParams({
      place_id: placeId,
      fields: ["rating", "user_ratings_total", "reviews"].join(","),
      key: apiKey,
    });

    if (reviewsLanguage) params.set("reviews_sort", "newest");
    if (reviewsLanguage) params.set("language", reviewsLanguage);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    let res: Response;
    try {
      res = await fetch(`${GOOGLE_PLACES_DETAILS_URL}?${params.toString()}`, {
        signal: controller.signal,
        // Prevent caching sensitive API responses in shared proxies
        headers: { "Cache-Control": "no-store" },
      });
    } catch (err: unknown) {
      clearTimeout(timeout);
      const error = err as { name?: string };
      if (error?.name === "AbortError") {
        throw Object.assign(new Error("Upstream timeout from Google Places"), { code: "UPSTREAM_TIMEOUT" });
      }
      throw Object.assign(new Error("Network error contacting Google Places"), { code: "UPSTREAM_NETWORK" });
    } finally {
      clearTimeout(timeout);
    }

    if (!res.ok) {
      throw Object.assign(new Error(`Google Places HTTP ${res.status}`), { code: "UPSTREAM_HTTP", status: res.status });
    }

    let data: GooglePlacesDetailsRaw;
    try {
      data = (await res.json()) as GooglePlacesDetailsRaw;
    } catch {
      throw Object.assign(new Error("Invalid JSON from Google Places"), { code: "UPSTREAM_PARSE" });
    }

    if (!data) {
      throw Object.assign(new Error("Empty response from Google Places"), { code: "UPSTREAM_EMPTY" });
    }

    switch (data.status) {
      case "OK": {
        return {
          rating: data.result?.rating,
          user_ratings_total: data.result?.user_ratings_total,
          reviews: data.result?.reviews ?? [],
        };
      }
      case "ZERO_RESULTS":
        return { rating: undefined, user_ratings_total: 0, reviews: [] };
      case "OVER_QUERY_LIMIT":
        throw Object.assign(new Error("Google Places quota exceeded"), { code: "RATE_LIMIT" });
      case "REQUEST_DENIED":
        throw Object.assign(new Error(data.error_message || "Request denied by Google"), { code: "REQUEST_DENIED" });
      case "INVALID_REQUEST":
        throw Object.assign(new Error("Invalid request sent to Google Places"), { code: "INVALID_REQUEST" });
      default:
        throw Object.assign(new Error("Unknown error from Google Places"), { code: "UPSTREAM_UNKNOWN" });
    }
  }
);


