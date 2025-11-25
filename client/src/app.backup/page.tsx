import { 
  HeroSection, 
  QuickSearchBar, 
  FeaturedSection, 
  LatestProducts, 
  NewsBanner,
  StatsSection,
  ServicesSection
} from "@/components/features/homepage";
import { Marquee } from "@/components/shared/ui";
import { hospitals } from '@shared/lib/data';
import { logger } from '@shared/lib/utils';

export default async function HomePage({ params }: { params: Promise<{ locale?: string | undefined }> }) {
  const { locale } = await params;
  logger.debug('HomePage rendered', { locale });

  return (
    <>
      {/* Hero Section with Video */}
      <HeroSection />
      
      {/* Quick Search Bar */}
      <QuickSearchBar />

      {/* Stats Section */}
      <StatsSection />

      {/* Featured hospitals */}
      <FeaturedSection hospitals={hospitals} />

      {/* Services Section */}
      <ServicesSection />

      {/* News Banner */}
      <NewsBanner />

      {/* Latest Products */}
      <LatestProducts />

      <Marquee />
    </>
  );
}
