/**
 * MSW handlers for Supabase payments table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/payments
 */
export const getPaymentsHandler = http.get(
  `${SUPABASE_URL}/rest/v1/payments`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let payments = mockDataStore.getPayments();

    // Apply filters
    payments = filterArray(payments, searchParams);

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      payments = sortArray(payments, orderParam);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(payments, paginationParams);

    return HttpResponse.json(paginated.data, {
      headers: {
        'Content-Range': `${paginationParams.offset || 0}-${(paginationParams.offset || 0) + paginated.data.length - 1}/${paginated.total}`,
        'X-Total-Count': paginated.total.toString(),
      },
    });
  }
);

export const paymentsHandlers = [getPaymentsHandler];

