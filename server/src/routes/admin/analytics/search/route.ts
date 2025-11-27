import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from "@shared/lib/database/supabase/server";
import { withAdminAuth } from '@shared/lib/api/withAdminAuth';

/**
 * GET /api/admin/analytics/search
 * Get search analytics - popular search terms
 * Query params:
 * - startDate: ISO date string (optional, default: start of current month)
 * - endDate: ISO date string (optional, default: now)
 * - limit: number of top terms to return (default: 20)
 * - searchType: filter by search type - 'hospitals', 'articles', 'all' (optional)
 */
const getSearchAnalyticsHandler = withAdminAuth(async (
  request: NextRequest,
  _context,
  _user
) => {
  try {
    const supabase = await createServerClient();
    const { searchParams } = new URL(request.url);
    
    // Get date range from query params or default to current month
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const limit = parseInt(searchParams.get('limit') || '20');
    const searchType = searchParams.get('searchType'); // Optional filter
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const startDate = startDateParam 
      ? new Date(startDateParam) 
      : startOfMonth;
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : now;
    
    // Ensure dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }
    
    // Ensure endDate is after startDate
    if (endDate < startDate) {
      return NextResponse.json(
        { success: false, error: 'endDate must be after startDate' },
        { status: 400 }
      );
    }
    
    const startDateISO = startDate.toISOString();
    const endDateISO = endDate.toISOString();
    
    // Build query
    let query = supabase
      .from('search_history')
      .select('query, search_type, created_at, total_results')
      .gte('created_at', startDateISO)
      .lte('created_at', endDateISO);
    
    // Filter by search type if provided
    if (searchType) {
      query = query.eq('search_type', searchType);
    }
    
    query = query.order('created_at', { ascending: false });
    
    const { data: searchHistoryData, error: searchHistoryError } = await query;
    
    if (searchHistoryError) {
      console.error('Error fetching search history:', searchHistoryError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch search history' },
        { status: 500 }
      );
    }
    
    // Aggregate search queries
    const searchTermsMap: Record<string, {
      query: string;
      count: number;
      search_type: string | null;
      avg_results: number;
      last_searched: string;
      first_searched: string;
    }> = {};
    
    if (searchHistoryData) {
      for (const search of searchHistoryData) {
        const queryKey = search.query.trim().toLowerCase();
        
        if (!searchTermsMap[queryKey]) {
          searchTermsMap[queryKey] = {
            query: search.query.trim(),
            count: 0,
            search_type: search.search_type || null,
            avg_results: 0,
            last_searched: search.created_at,
            first_searched: search.created_at,
          };
        }
        
        searchTermsMap[queryKey].count += 1;
        searchTermsMap[queryKey].avg_results = 
          ((searchTermsMap[queryKey].avg_results * (searchTermsMap[queryKey].count - 1)) + 
           (search.total_results || 0)) / searchTermsMap[queryKey].count;
        
        // Update last_searched if this is more recent
        if (new Date(search.created_at) > new Date(searchTermsMap[queryKey].last_searched)) {
          searchTermsMap[queryKey].last_searched = search.created_at;
        }
        
        // Update first_searched if this is older
        if (new Date(search.created_at) < new Date(searchTermsMap[queryKey].first_searched)) {
          searchTermsMap[queryKey].first_searched = search.created_at;
        }
      }
    }
    
    // Convert to array and sort by count (most popular first)
    const popularSearchTerms = Object.values(searchTermsMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
    
    // Get statistics
    const totalSearches = searchHistoryData?.length || 0;
    const uniqueSearchQueries = Object.keys(searchTermsMap).length;
    
    // Calculate search trends by type
    const searchesByType: Record<string, number> = {};
    if (searchHistoryData) {
      for (const search of searchHistoryData) {
        const type = search.search_type || 'all';
        searchesByType[type] = (searchesByType[type] || 0) + 1;
      }
    }
    
    // Calculate searches by date (for charting)
    const searchesByDate: Record<string, number> = {};
    if (searchHistoryData) {
      for (const search of searchHistoryData) {
        const date = new Date(search.created_at).toISOString().split('T')[0];
        searchesByDate[date] = (searchesByDate[date] || 0) + 1;
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        period: {
          startDate: startDateISO,
          endDate: endDateISO,
        },
        statistics: {
          totalSearches,
          uniqueQueries: uniqueSearchQueries,
          searchesByType,
        },
        popularTerms: popularSearchTerms,
        charts: {
          searchesByDate,
        },
      },
    });
    
  } catch (error) {
    console.error('Search analytics error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch search analytics' },
      { status: 500 }
    );
  }
});

export { getSearchAnalyticsHandler as GET };
