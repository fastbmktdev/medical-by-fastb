import { NextRequest, NextResponse } from "next/server";
import { fetchPlaceReviews } from '@shared/lib/utils/googlePlaces';

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("place_id");
  const language = searchParams.get("language") || undefined;

  if (!placeId) {
    return badRequest("Missing required query param: place_id");
  }

  try {
    const data = await fetchPlaceReviews({ placeId, reviewsLanguage: language });

    // Cache successful results for a short period to reduce upstream hits
    const res = NextResponse.json({ data });
    res.headers.set("Cache-Control", "public, max-age=300, s-maxage=300");
    return res;
  } catch (err: unknown) {
    const error = err as { code?: string };
    const code = error?.code;

    // Map known error codes to HTTP responses
    const map: Record<string, { status: number; message: string }> = {
      CONFIG_MISSING: { status: 500, message: "Server configuration missing" },
      UPSTREAM_TIMEOUT: { status: 504, message: "Upstream timeout" },
      UPSTREAM_NETWORK: { status: 502, message: "Upstream network error" },
      UPSTREAM_HTTP: { status: 502, message: "Upstream HTTP error" },
      UPSTREAM_PARSE: { status: 502, message: "Upstream parse error" },
      UPSTREAM_EMPTY: { status: 502, message: "Upstream empty response" },
      RATE_LIMIT: { status: 429, message: "Rate limit from provider" },
      REQUEST_DENIED: { status: 403, message: "Request denied by provider" },
      INVALID_REQUEST: { status: 400, message: "Invalid request to provider" },
      UPSTREAM_UNKNOWN: { status: 502, message: "Unknown upstream error" },
    };

    const mapped = (code && map[code]) || { status: 500, message: "Unknown error" };

    return NextResponse.json(
      {
        error: mapped.message,
        code: code || "UNKNOWN",
      },
      { status: mapped.status }
    );
  }
}


