import {
  HeroSection,
  QuickSearchBar,
  FeaturedSection,
  StatsSection,
  ServicesSection,
} from "@/components/features/homepage";
import { hospitals } from "@shared/lib/data";
import dynamic from "next/dynamic";

// Lazy load components that are below the fold
const LatestProducts = dynamic(
  () =>
    import("@/components/features/homepage").then((mod) => ({
      default: mod.LatestProducts,
    })),
  {
    loading: () => (
      <div className="h-64 flex items-center justify-center">
        <div className="animate-spin  h-8 w-8 border-b-2 border-red-500"></div>
      </div>
    ),
    ssr: true,
  }
);

const NewsBanner = dynamic(
  () =>
    import("@/components/features/homepage").then((mod) => ({
      default: mod.NewsBanner,
    })),
  {
    loading: () => null,
    ssr: true,
  }
);

const Marquee = dynamic(
  () =>
    import("@/components/shared/ui").then((mod) => ({ default: mod.Marquee })),
  {
    loading: () => null,
    ssr: true,
  }
);

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale?: string | undefined }>;
}) {
  const { locale } = await params;

  // Only log in development to reduce overhead
  // Use console.log instead of logger to avoid bundling server-only dependencies
  if (process.env.NODE_ENV === "development") {
    console.debug("HomePage rendered", { locale });
  }

  return (
    <>
      {/* Hero Section with Video */}
      <HeroSection />

      {/* Marquee - Lazy loaded */}
      <Marquee />
      
      {/* Quick Search Bar */}
      <QuickSearchBar />

      {/* Stats Section */}
      <StatsSection />

      {/* Featured hospitals */}
      <FeaturedSection hospitals={hospitals} />

      {/* Services Section */}
      <ServicesSection />

      {/* News Banner - Lazy loaded */}
      <NewsBanner />

      {/* Latest Products - Lazy loaded */}
      <LatestProducts />
    </>
  );
}
