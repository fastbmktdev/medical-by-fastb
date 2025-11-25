/**
 * MSW handlers for /api/payments routes
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle GET /api/payments
 */
export const getPaymentsApiHandler = http.get('/api/payments', async ({ request }) => {
  await delay();

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');

  let payments = mockDataStore.getPayments();

  if (userId) {
    payments = payments.filter((p) => p.user_id === userId);
  }

  return HttpResponse.json({
    success: true,
    data: payments,
  });
});

export const paymentsApiHandlers = [getPaymentsApiHandler];

