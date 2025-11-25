/**
 * MSW handlers for Supabase reviews table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/hospital_reviews
 */
export const getReviewsHandler = http.get(
  `${SUPABASE_URL}/rest/v1/hospital_reviews`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let reviews = mockDataStore.getReviews();

    // Apply filters
    reviews = filterArray(reviews, searchParams);

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      reviews = sortArray(reviews, orderParam);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(reviews, paginationParams);

    return HttpResponse.json(paginated.data, {
      headers: {
        'Content-Range': `${paginationParams.offset || 0}-${(paginationParams.offset || 0) + paginated.data.length - 1}/${paginated.total}`,
        'X-Total-Count': paginated.total.toString(),
      },
    });
  }
);

export const reviewsHandlers = [getReviewsHandler];

