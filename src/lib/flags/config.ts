export const GROWTHBOOK_API_HOST =
  process.env.NEXT_PUBLIC_GROWTHBOOK_API_HOST ?? "https://cdn.growthbook.io";

export const GROWTHBOOK_CLIENT_KEY =
  process.env.NEXT_PUBLIC_GROWTHBOOK_CLIENT_KEY ?? "";

export const DEFAULT_GROWTHBOOK_ATTRIBUTES = {
  id: "anonymous",
  locale: typeof navigator !== "undefined" ? navigator.language : "th-TH",
} as const;

