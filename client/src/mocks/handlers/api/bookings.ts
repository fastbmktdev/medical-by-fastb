/**
 * MSW handlers for /api/bookings routes
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle GET /api/bookings
 */
export const getBookingsApiHandler = http.get('/api/bookings', async ({ request }) => {
  await delay();

  const url = new URL(request.url);
  const userId = url.searchParams.get('user_id');
  const hospitalId = url.searchParams.get('hospital_id');

  let appointments = mockDataStore.getAppointments();

  if (userId) {
    appointments = appointments.filter((a) => a.user_id === userId);
  }

  if (hospitalId) {
    appointments = appointments.filter((a) => a.hospital_id === hospitalId);
  }

  return HttpResponse.json({
    success: true,
    data: appointments,
  });
});

export const bookingsApiHandlers = [getBookingsApiHandler];

