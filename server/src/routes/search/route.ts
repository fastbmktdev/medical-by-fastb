import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";

interface HospitalWithFilters {
  id: string;
  hospital_name: string;
  hospital_name_english?: string | null;
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

interface HospitalPackage {
  price: string | number;
}

/**
 * GET /api/search
 * Advanced search across multiple content types with full-text search, filters, and sorting
 * Query params:
 * - q: search query (required)
 * - type: content type filter (hospitals, articles, users) - optional
 * - limit: number of results per type (default: 10)
 * - price_min: minimum price filter (for hospitals only)
 * - price_max: maximum price filter (for hospitals only)
 * - lat: latitude for location-based search (for hospitals only)
 * - lon: longitude for location-based search (for hospitals only)
 * - radius: radius in kilometers for location filter (default: 50)
 * - sort_by: sort option (relevance, price_asc, price_desc, popularity, distance) - default: relevance
 * - use_fulltext: use PostgreSQL full-text search (default: true)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
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
      hospitals?: unknown[];
      articles?: unknown[];
      users?: unknown[];
    } = {};
    
    // Search hospitals with advanced features
    if (!type || type === 'hospitals') {
      let hospitalQuery = supabase
        .from('hospitals')
        .select(`
          id,
          hospital_name,
          hospital_name_english,
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
          hospitalQuery = hospitalQuery.filter('search_vector', 'fts', tsQuery);
        }
      } else {
        // Fallback to ILIKE search
        const searchTerm = `%${searchQuery}%`;
        hospitalQuery = hospitalQuery.or(
          `hospital_name.ilike.${searchTerm},hospital_name_english.ilike.${searchTerm},location.ilike.${searchTerm},address.ilike.${searchTerm}`
        );
      }
      
      // Apply price filter (requires checking hospital_packages)
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
        hospitalQuery = hospitalQuery.order('created_at', { ascending: false }); // Temporary: use created_at as popularity proxy
      } else if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        // Price sorting would require joining with hospital_packages
        // For now, use created_at as fallback
        hospitalQuery = hospitalQuery.order('created_at', { ascending: sortBy === 'price_asc' });
      } else if (sortBy === 'distance' && lat !== null && lon !== null) {
        // Distance sorting would require calculating distance
        // For now, use created_at as fallback
        hospitalQuery = hospitalQuery.order('created_at', { ascending: false });
      } else {
        // Relevance: order by created_at for now (full-text search ranking would be better)
        hospitalQuery = hospitalQuery.order('created_at', { ascending: false });
      }
      
      hospitalQuery = hospitalQuery.limit(limit * 2); // Fetch more to filter by price
      
      const { data: hospitals, error: hospitalsError } = await hospitalQuery;
      
      if (hospitalsError) {
        console.error('hospitals search error:', hospitalsError);
      }
      
      let filteredHospitals: HospitalWithFilters[] = (hospitals || []) as HospitalWithFilters[];
      
      // Apply price filter (optimized - batch query all packages at once)
      if ((priceMin !== null || priceMax !== null) && filteredHospitals.length > 0) {
        // Get all hospital IDs
        const hospitalIds = filteredHospitals.map((h: HospitalWithFilters) => h.id);
        
        // Batch query all packages for all hospitals in one query
        const { data: allPackages } = await supabase
          .from('hospital_packages')
          .select('hospital_id, price')
          .in('hospital_id', hospitalIds)
          .eq('is_active', true);
        
        // Group packages by hospital_id
        const packagesByHospital = new Map<string, number[]>();
        allPackages?.forEach((pkg: { hospital_id: string; price: number }) => {
          const price = parseFloat(String(pkg.price));
          const existing = packagesByHospital.get(pkg.hospital_id) || [];
          existing.push(price);
          packagesByHospital.set(pkg.hospital_id, existing);
        });
        
        // Map prices to hospitals
        const hospitalsWithPrices = filteredHospitals.map((hospital: HospitalWithFilters) => {
          const prices = packagesByHospital.get(hospital.id) || [];
          const minPrice = prices.length > 0 ? Math.min(...prices) : null;
          const maxPrice = prices.length > 0 ? Math.max(...prices) : null;
          
          return {
            ...hospital,
            minPrice,
            maxPrice,
          };
        });
        
        filteredHospitals = hospitalsWithPrices.filter((hospital: HospitalWithFilters) => {
          if (priceMin !== null && hospital.maxPrice !== null && hospital.maxPrice !== undefined && hospital.maxPrice < priceMin) {
            return false;
          }
          if (priceMax !== null && hospital.minPrice !== null && hospital.minPrice !== undefined && hospital.minPrice > priceMax) {
            return false;
          }
          return true;
        });
      }
      
      // Apply distance filter
      if (lat !== null && lon !== null && filteredHospitals.length > 0) {
        const hospitalsWithDistance = await Promise.all(
          filteredHospitals.map(async (hospital: HospitalWithFilters) => {
            if (hospital.latitude && hospital.longitude) {
              const { data: distanceData } = await supabase.rpc('calculate_distance', {
                lat1: lat,
                lon1: lon,
                lat2: hospital.latitude,
                lon2: hospital.longitude,
              });
              
              return {
                ...hospital,
                distance: (distanceData as number) || null,
              };
            }
            return { ...hospital, distance: null };
          })
        );
        
        filteredHospitals = hospitalsWithDistance.filter((hospital: HospitalWithFilters) => {
          if (hospital.distance === null || hospital.distance === undefined) return true; // Include hospitals without coordinates
          return hospital.distance <= radius;
        });
        
        // Sort by distance if requested
        if (sortBy === 'distance') {
          filteredHospitals.sort((a: HospitalWithFilters, b: HospitalWithFilters) => {
            const distA = a.distance ?? Infinity;
            const distB = b.distance ?? Infinity;
            return distA - distB;
          });
        }
      }
      
      // Apply price sorting
      if (sortBy === 'price_asc' || sortBy === 'price_desc') {
        filteredHospitals.sort((a: HospitalWithFilters, b: HospitalWithFilters) => {
          const priceA = a.minPrice ?? Infinity;
          const priceB = b.minPrice ?? Infinity;
          return sortBy === 'price_asc' ? priceA - priceB : priceB - priceA;
        });
      }
      
      // Limit results
      filteredHospitals = filteredHospitals.slice(0, limit);
      
      // Remove helper fields before returning
      results.hospitals = filteredHospitals.map((hospital: HospitalWithFilters) => {
        const { minPrice, maxPrice, distance, ...rest } = hospital;
        return rest;
      });
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
      (results.hospitals?.length || 0) +
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
