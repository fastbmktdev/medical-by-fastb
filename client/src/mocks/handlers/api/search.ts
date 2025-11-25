/**
 * MSW handlers for /api/search route
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle POST /api/search
 */
export const searchApiHandler = http.post('/api/search', async ({ request }) => {
  await delay();

  const body = (await request.json()) as {
    query?: string;
    type?: string;
    filters?: Record<string, unknown>;
  };

  const { query, type } = body;

  let results: unknown[] = [];

  if (type === 'hospitals' || !type) {
    let hospitals = mockDataStore.getHospitals();

    if (query) {
      const lowerQuery = query.toLowerCase();
      hospitals = hospitals.filter(
        (h) =>
          h.hospital_name?.toLowerCase().includes(lowerQuery) ||
          h.hospital_name_english?.toLowerCase().includes(lowerQuery) ||
          h.address?.toLowerCase().includes(lowerQuery) ||
          h.location?.toLowerCase().includes(lowerQuery)
      );
    }

    results = hospitals;
  }

  return HttpResponse.json({
    success: true,
    data: results,
  });
});

export const searchApiHandlers = [searchApiHandler];

