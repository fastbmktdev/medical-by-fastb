/**
 * MSW handlers for /api/analytics routes
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { delay } from '../../utils/delay';

/**
 * Handle GET /api/analytics
 */
export const getAnalyticsApiHandler = http.get('/api/analytics', async () => {
  await delay();

  const hospitals = mockDataStore.getHospitals();
  const appointments = mockDataStore.getAppointments();
  const payments = mockDataStore.getPayments();

  const totalRevenue = payments
    .filter((p) => p.status === 'succeeded')
    .reduce((sum, p) => sum + p.amount, 0);

  return HttpResponse.json({
    success: true,
    data: {
      totalHospitals: hospitals.length,
      totalAppointments: appointments.length,
      totalRevenue: totalRevenue,
      totalUsers: mockDataStore.getProfiles().length,
    },
  });
});

export const analyticsApiHandlers = [getAnalyticsApiHandler];

