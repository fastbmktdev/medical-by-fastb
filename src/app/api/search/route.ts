import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/database/supabase/server';

interface GymWithFilters {
  id: string;
  gym_name: string;
  gym_name_english?: string | null;
  location: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
  created_at: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  distance?: number | null;
}

interface GymPackage {
  price: string | number;
}

/**
 * GET /api/search
 * Advanced search across multiple content types with full-text search, filters, and sorting
 * Query params:
 * - q: search query (required)
 * - type: content type filter (gyms, events, articles, users) - optional
 * - limit: number of results per type (default: 10)
 * - price_min: minimum price filter (for gyms only)
 * - price_max: maximum price filter (for gyms only)
 * - lat: latitude for location-based search (for gyms only)
 * - lon: longitude for location-based search (for gyms only)
 * - radius: radius in kilometers for location filter (default: 50)
 * - sort_by: sort option (relevance, price_asc, price_desc, popularity, distance) - default: relevance
 * - use_fulltext: use PostgreSQL full-text search (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const query = searchParams.get('q');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '10');
    const priceMin = searchParams.get('price_min') ? parseFloat(searchParams.get('price_min')!) : null;
    const priceMax = searchParams.get('price_max') ? parseFloat(searchParams.get('price_max')!) : null;
    const lat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : null;
    const lon = searchParams.get('lon') ? parseFloat(searchParams.get('lon')!) : null;
    const radius = parseFloat(searchParams.get('radius') || '50'); // Default 50km
    const sortBy = searchParams.get('sort_by') || 'relevance';
    const useFulltext = searchParams.get('use_fulltext') !== 'false'; // Default true
    
    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: q (search query)' },
        { status: 400 }
      );
    }
    
    const searchQuery = query.trim();
    const results: {
      gyms?: unknown[];
      events?: unknown[];
      articles?: unknown[];
      users?: unknown[];
    } = {};
    
    // Search gyms with advanced features
    if (!type || type === 'gyms') {
      let gymQuery = supabase
        .from('gyms')
        .select(`
          id,
          gym_name,
          gym_name_english,
          location,
          address,
          latitude,
          longitude,
          status,
          created_at
        `)
        .eq('status', 'approved');
      
      // Apply full-text search or ILIKE search
      if (useFulltext) {
        // Use PostgreSQL full-text search via filter
        const tsQuery = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 0)
          .map(term => `${term}:*`)
          .join(' & ');
        
        // Use filter with fts operator for full-text search
        if (tsQuery) {
          gymQuery = gymQuery.filter('search_vector', 'fts', tsQuery);
        }
      } else {
        // Fallback to ILIKE search
        const searchTerm = `%${searchQuery}%`;
        gymQuery = gymQuery.or(
          `gym_name.ilike.${searchTerm},gym_name_english.ilike.${searchTerm},location.ilike.${searchTerm},address.ilike.${searchTerm}`
        );
      }
      
      // Apply price filter (requires checking gym_packages)
      if (priceMin !== null || priceMax !== null) {
        // We'll need to filter by price after fetching, or use a subquery
        // For now, we'll fetch all and filter in application logic
        // This could be optimized with a JOIN or subquery in production
      }
      
      // Apply location filter (distance-based)
      if (lat !== null && lon !== null) {
        // We'll calculate distance after fetching
        // This could be optimized with a PostGIS function in production
      }
      
      // Apply sorting
      if (sortBy === 'popularity') {
        gymQuery = gymQuery.order('created_at', { ascending: false }); // Temporary: use created_at as popularity proxy
      } else if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        // Price sorting would require joining with gym_packages
        // For now, use created_at as fallback
        gymQuery = gymQuery.order('created_at', { ascending: sortBy === 'price_asc' });
      } else if (sortBy === 'distance' && lat !== null && lon !== null) {
        // Distance sorting would require calculating distance
        // For now, use created_at as fallback
        gymQuery = gymQuery.order('created_at', { ascending: false });
      } else {
        // Relevance: order by created_at for now (full-text search ranking would be better)
        gymQuery = gymQuery.order('created_at', { ascending: false });
      }
      
      gymQuery = gymQuery.limit(limit * 2); // Fetch more to filter by price
      
      const { data: gyms, error: gymsError } = await gymQuery;
      
      if (gymsError) {
        console.error('Gyms search error:', gymsError);
      }
      
      let filteredGyms: GymWithFilters[] = (gyms || []) as GymWithFilters[];
      
      // Apply price filter
      if ((priceMin !== null || priceMax !== null) && filteredGyms.length > 0) {
        // For now, we'll use a simpler approach: check if any package matches
        // In production, this should use a JOIN or subquery
        const gymsWithPrices = await Promise.all(
          filteredGyms.map(async (gym: GymWithFilters) => {
            const { data: packages } = await supabase
              .from('gym_packages')
              .select('price')
              .eq('gym_id', gym.id)
              .eq('is_active', true);
            
            const minPrice = packages && packages.length > 0 
              ? Math.min(...packages.map((p: GymPackage) => parseFloat(String(p.price))))
              : null;
            const maxPrice = packages && packages.length > 0
              ? Math.max(...packages.map((p: GymPackage) => parseFloat(String(p.price))))
              : null;
            
            return {
              ...gym,
              minPrice,
              maxPrice,
            };
          })
        );
        
        filteredGyms = gymsWithPrices.filter((gym: GymWithFilters) => {
          if (priceMin !== null && gym.maxPrice !== null && gym.maxPrice !== undefined && gym.maxPrice < priceMin) {
            return false;
          }
          if (priceMax !== null && gym.minPrice !== null && gym.minPrice !== undefined && gym.minPrice > priceMax) {
            return false;
          }
          return true;
        });
      }
      
      // Apply distance filter
      if (lat !== null && lon !== null && filteredGyms.length > 0) {
        const gymsWithDistance = await Promise.all(
          filteredGyms.map(async (gym: GymWithFilters) => {
            if (gym.latitude && gym.longitude) {
              const { data: distanceData } = await supabase.rpc('calculate_distance', {
                lat1: lat,
                lon1: lon,
                lat2: gym.latitude,
                lon2: gym.longitude,
              });
              
              return {
                ...gym,
                distance: (distanceData as number) || null,
              };
            }
            return { ...gym, distance: null };
          })
        );
        
        filteredGyms = gymsWithDistance.filter((gym: GymWithFilters) => {
          if (gym.distance === null || gym.distance === undefined) return true; // Include gyms without coordinates
          return gym.distance <= radius;
        });
        
        // Sort by distance if requested
        if (sortBy === 'distance') {
          filteredGyms.sort((a: GymWithFilters, b: GymWithFilters) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          });
        }
      }
      
      // Apply price sorting
      if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        filteredGyms.sort((a: GymWithFilters, b: GymWithFilters) => {
          const priceA = a.minPrice ?? Infinity;
          const priceB = b.minPrice ?? Infinity;
          return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
      }
      
      // Limit results
      filteredGyms = filteredGyms.slice(0, limit);
      
      // Remove helper fields before returning
      results.gyms = filteredGyms.map((gym: GymWithFilters) => {
        const { minPrice, maxPrice, distance, ...rest } = gym;
        return rest;
      });
    }
    
    // Search events with full-text search
    if (!type || type === 'events') {
      let eventQuery = supabase
        .from('events')
        .select('id, name, name_english, location, event_date, is_published')
        .eq('is_published', true);
      
      if (useFulltext) {
        const tsQuery = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 0)
          .map(term => `${term}:*`)
          .join(' & ');
        
        if (tsQuery) {
          eventQuery = eventQuery.filter('search_vector', 'fts', tsQuery);
        }
      } else {
        const searchTerm = `%${searchQuery}%`;
        eventQuery = eventQuery.or(
          `name.ilike.${searchTerm},name_english.ilike.${searchTerm},location.ilike.${searchTerm},description.ilike.${searchTerm}`
        );
      }
      
      eventQuery = eventQuery.order('event_date', { ascending: false }).limit(limit);
      
      const { data: events, error: eventsError } = await eventQuery;
      
      if (eventsError) {
        console.error('Events search error:', eventsError);
      }
      
      results.events = events || [];
    }
    
    // Search articles with full-text search
    if (!type || type === 'articles') {
      let articleQuery = supabase
        .from('articles')
        .select('id, title, excerpt, date, is_published')
        .eq('is_published', true);
      
      if (useFulltext) {
        const tsQuery = searchQuery
          .split(/\s+/)
          .filter(term => term.length > 0)
          .map(term => `${term}:*`)
          .join(' & ');
        
        if (tsQuery) {
          articleQuery = articleQuery.filter('search_vector', 'fts', tsQuery);
        }
      } else {
        const searchTerm = `%${searchQuery}%`;
        articleQuery = articleQuery.or(
          `title.ilike.${searchTerm},excerpt.ilike.${searchTerm},content.ilike.${searchTerm}`
        );
      }
      
      articleQuery = articleQuery.order('date', { ascending: false }).limit(limit);
      
      const { data: articles, error: articlesError } = await articleQuery;
      
      if (articlesError) {
        console.error('Articles search error:', articlesError);
      }
      
      results.articles = articles || [];
    }
    
    // Search users (admin only)
    if (!type || type === 'users') {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (roleData?.role === 'admin') {
          // Admin can search user emails
          const { data: users } = await supabase
            .from('user_roles')
            .select('user_id, role, created_at')
            .limit(limit);
          
          results.users = users || [];
        }
      }
    }
    
    const totalResults = 
      (results.gyms?.length || 0) +
      (results.events?.length || 0) +
      (results.articles?.length || 0) +
      (results.users?.length || 0);
    
    // Log search history (async, don't wait)
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Fire and forget - don't await
      (async () => {
        try {
          await supabase
            .from('search_history')
            .insert({
              user_id: user.id,
              query: searchQuery,
              search_type: type || 'all',
              filters: {
                price_min: priceMin,
                price_max: priceMax,
                lat,
                lon,
                radius,
                sort_by: sortBy,
              },
              total_results: totalResults,
            });
        } catch (err: unknown) {
          console.error('Failed to log search history:', err);
        }
      })();
    }
    
    return NextResponse.json({
      success: true,
      query: searchQuery,
      totalResults,
      results,
      filters: {
        price_min: priceMin,
        price_max: priceMax,
        location: lat && lon ? { lat, lon, radius } : null,
        sort_by: sortBy,
      },
    });
    
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}
