/**
 * MSW handlers for Supabase appointments table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/appointments
 */
export const getAppointmentsHandler = http.get(
  `${SUPABASE_URL}/rest/v1/appointments`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let appointments = mockDataStore.getAppointments();

    // Apply filters
    appointments = filterArray(appointments, searchParams);

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      appointments = sortArray(appointments, orderParam);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(appointments, paginationParams);

    // Handle select parameter
    const selectParam = searchParams.get('select');
    if (selectParam) {
      const fields = selectParam.split(',');
      paginated.data = paginated.data.map((appointment) => {
        const selected: Record<string, unknown> = {};
        fields.forEach((field) => {
          const trimmed = field.trim();
          if (appointment[trimmed as keyof typeof appointment] !== undefined) {
            selected[trimmed] = appointment[trimmed as keyof typeof appointment];
          }
        });
        return selected as typeof appointment;
      });
    }

    return HttpResponse.json(paginated.data, {
      headers: {
        'Content-Range': `${paginationParams.offset || 0}-${(paginationParams.offset || 0) + paginated.data.length - 1}/${paginated.total}`,
        'X-Total-Count': paginated.total.toString(),
      },
    });
  }
);

/**
 * Handle GET /rest/v1/appointments/:id
 */
export const getAppointmentByIdHandler = http.get(
  `${SUPABASE_URL}/rest/v1/appointments/:id`,
  async ({ params }) => {
    await delay();

    const { id } = params;
    const appointment = mockDataStore.getAppointmentById(id as string);

    if (!appointment) {
      return HttpResponse.json(
        { message: 'Appointment not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(appointment);
  }
);

export const bookingsHandlers = [
  getAppointmentsHandler,
  getAppointmentByIdHandler,
];

