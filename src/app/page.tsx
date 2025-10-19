import { HeroSection, QuickSearchBar, FeaturedSection, LatestProducts } from "@/components/features/sections";
import { GYMS, EVENTS, PRODUCTS } from "@/lib/data";

export default function Home() {
  return (
    <main className="mt-16">
      {/* Hero Section with Video */}
      <HeroSection />

      {/* Quick Search Bar */}
      <QuickSearchBar />

      {/* Featured Gyms and Events */}
      <FeaturedSection gyms={GYMS} events={EVENTS} />

      {/* Latest Products */}
      <LatestProducts products={PRODUCTS} />
    </main>
  );
}
