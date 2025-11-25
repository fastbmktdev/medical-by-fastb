import { Metadata } from 'next';
import { createClient } from '@shared/lib/database/supabase/server';

/**
 * Generate metadata for article pages
 * This is a server component that generates SEO metadata
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  
  try {
    const supabase = await createClient();
    
    // Fetch article data
    const { data: article, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .maybeSingle();

    if (error || !article) {
      return {
        title: 'บทความไม่พบ',
        description: 'ไม่พบบทความที่คุณกำลังมองหา',
      };
    }

    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.medicalhospital.com';
    const articleUrl = `${baseUrl}/articles/${slug}`;
    
    // Get article image
    const getArticleImage = (category: string, image?: string | null) => {
      if (image) return image.startsWith('http') ? image : `${baseUrl}${image}`;
      
      const imageMap: { [key: string]: string } = {
        ประวัติศาสตร์: `${baseUrl}/assets/images/bg-main.jpg`,
        เทคนิค: `${baseUrl}/assets/images/fallback-img.jpg`,
        สุขภาพ: `${baseUrl}/assets/images/bg-main.jpg`,
        บุคคล: `${baseUrl}/assets/images/fallback-img.jpg`,
        อุปกรณ์: `${baseUrl}/assets/images/bg-main.jpg`,
        โภชนาการ: `${baseUrl}/assets/images/fallback-img.jpg`,
        ข่าวสาร: `${baseUrl}/assets/images/bg-main.jpg`,
      };
      return imageMap[category] || `${baseUrl}/assets/images/bg-main.jpg`;
    };

    // Use SEO fields if available, otherwise fallback to article fields
    const metaTitle = article.meta_title || article.title;
    const metaDescription = article.meta_description || article.excerpt;
    const ogTitle = article.og_title || article.title;
    const ogDescription = article.og_description || article.excerpt;
    const ogImage = article.og_image 
      ? (article.og_image.startsWith('http') ? article.og_image : `${baseUrl}${article.og_image}`)
      : getArticleImage(article.category, article.image);
    const canonicalUrl = article.canonical_url || articleUrl;

    // Build metadata
    const metadata: Metadata = {
      title: metaTitle,
      description: metaDescription,
      keywords: article.meta_keywords && article.meta_keywords.length > 0
        ? article.meta_keywords.join(', ')
        : undefined,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title: ogTitle,
        description: ogDescription,
        url: articleUrl,
        siteName: 'Medical Platform',
        images: [
          {
            url: ogImage,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
        locale: 'th_TH',
        type: 'article',
        publishedTime: article.published_at || article.date,
        authors: article.author_name ? [article.author_name] : undefined,
        tags: article.tags || undefined,
      },
      twitter: {
        card: (article.twitter_card as 'summary' | 'summary_large_image') || 'summary_large_image',
        title: ogTitle,
        description: ogDescription,
        images: [ogImage],
      },
    };

    return metadata;
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'บทความ',
      description: 'อ่านบทความเกี่ยวกับการแพทย์',
    };
  }
}

export default function ArticleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

