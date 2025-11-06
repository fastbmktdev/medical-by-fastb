import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

/**
 * GET /sitemap.xml
 * Generate sitemap.xml for SEO
 * Includes:
 * - Static pages
 * - Published articles
 * - Published events
 * - Published products
 */
export async function GET(request: NextRequest) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://thai-kick.com';
    const supabase = await createClient();

    const urls: string[] = [];

    // Static pages
    const staticPages = [
      { url: '/', changefreq: 'daily', priority: '1.0' },
      { url: '/articles', changefreq: 'daily', priority: '0.9' },
      { url: '/gyms', changefreq: 'weekly', priority: '0.9' },
      { url: '/shop', changefreq: 'weekly', priority: '0.8' },
      { url: '/events', changefreq: 'weekly', priority: '0.8' },
      { url: '/about', changefreq: 'monthly', priority: '0.7' },
      { url: '/contact', changefreq: 'monthly', priority: '0.7' },
      { url: '/faq', changefreq: 'monthly', priority: '0.6' },
      { url: '/privacy', changefreq: 'yearly', priority: '0.5' },
      { url: '/terms', changefreq: 'yearly', priority: '0.5' },
    ];

    // Add static pages
    for (const page of staticPages) {
      urls.push(`
    <url>
      <loc>${baseUrl}${page.url}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
    </url>`);
    }

    // Fetch published articles
    const { data: articles, error: articlesError } = await supabase
      .from('articles')
      .select('slug, updated_at, published_at, date')
      .eq('is_published', true)
      .order('published_at', { ascending: false });

    if (!articlesError && articles) {
      for (const article of articles) {
        const lastmod = article.updated_at || article.published_at || article.date || new Date().toISOString();
        urls.push(`
    <url>
      <loc>${baseUrl}/articles/${article.slug}</loc>
      <lastmod>${new Date(lastmod).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>`);
      }
    }

    // Fetch published events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('slug, updated_at, event_date')
      .eq('is_published', true)
      .order('event_date', { ascending: false });

    if (!eventsError && events) {
      for (const event of events) {
        const lastmod = event.updated_at || event.event_date || new Date().toISOString();
        urls.push(`
    <url>
      <loc>${baseUrl}/events/${event.slug}</loc>
      <lastmod>${new Date(lastmod).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`);
      }
    }

    // Fetch published products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('slug, updated_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (!productsError && products) {
      for (const product of products) {
        const lastmod = product.updated_at || new Date().toISOString();
        urls.push(`
    <url>
      <loc>${baseUrl}/shop/${product.slug}</loc>
      <lastmod>${new Date(lastmod).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
    </url>`);
      }
    }

    // Fetch published gyms
    const { data: gyms, error: gymsError } = await supabase
      .from('gyms')
      .select('slug, updated_at')
      .eq('is_approved', true)
      .order('created_at', { ascending: false });

    if (!gymsError && gyms) {
      for (const gym of gyms) {
        const lastmod = gym.updated_at || new Date().toISOString();
        urls.push(`
    <url>
      <loc>${baseUrl}/gyms/${gym.slug}</loc>
      <lastmod>${new Date(lastmod).toISOString()}</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.8</priority>
    </url>`);
      }
    }

    // Build sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${urls.join('')}
</urlset>`;

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate sitemap' },
      { status: 500 }
    );
  }
}

