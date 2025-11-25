import { createNavigation } from "next-intl/navigation";
import { locales } from "./i18n";

// Create navigation helpers for locale-aware routing
// This provides Link, redirect, usePathname, and useRouter that automatically handle locale prefixes
export const { Link, redirect, usePathname, useRouter } = createNavigation({
  locales,
});
