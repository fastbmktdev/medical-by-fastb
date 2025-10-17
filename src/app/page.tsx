import HeroSection from "@/components/sections/HeroSection";
import QuickSearchBar from "@/components/sections/QuickSearchBar";
import FeaturedSection from "@/components/sections/FeaturedSection";
import LatestProducts from "@/components/sections/LatestProducts";
import { GYMS, EVENTS, PRODUCTS } from "@/lib/data";

export default function Home() {
  return (
    <main>
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
