/**
 * MSW handlers for /api/hospitals routes
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle GET /api/hospitals
 */
export const getHospitalsApiHandler = http.get('/api/hospitals', async ({ request }) => {
  await delay();

  const url = new URL(request.url);
  const status = url.searchParams.get('status');

  let hospitals = mockDataStore.getHospitals();

  if (status) {
    hospitals = hospitals.filter((h) => h.status === status);
  }

  return HttpResponse.json({
    success: true,
    data: hospitals,
  });
});

/**
 * Handle GET /api/hospitals/:id
 */
export const getHospitalByIdApiHandler = http.get(
  '/api/hospitals/:id',
  async ({ params }) => {
    await delay();

    const { id } = params;
    const hospital = mockDataStore.getHospitalById(id as string);

    if (!hospital) {
      return HttpResponse.json(
        { success: false, error: 'Hospital not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json({
      success: true,
      data: hospital,
    });
  }
);

export const hospitalsApiHandlers = [getHospitalsApiHandler, getHospitalByIdApiHandler];

