import { HeroSection, QuickSearchBar, FeaturedSection, LatestProducts, NewsBanner } from "@/components/features/homepage";
import { Marquee } from "@/components/shared/ui";
import { GYMS, EVENTS } from "@/lib/data";

export default function Home() {
  return (
    <>
      {/* Hero Section with Video */}
      <HeroSection />
      
      <Marquee />
      
      {/* News Banner */}
      <NewsBanner />
      

      {/* Quick Search Bar */}
      <QuickSearchBar />

      {/* Featured Gyms and Events */}
      <FeaturedSection gyms={GYMS} events={EVENTS} />

      {/* Latest Products */}
      <LatestProducts />
    </>
  );
}
