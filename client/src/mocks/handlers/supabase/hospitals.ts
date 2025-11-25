/**
 * MSW handlers for Supabase hospitals table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/hospitals
 */
export const getHospitalsHandler = http.get(
  `${SUPABASE_URL}/rest/v1/hospitals`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Get all hospitals
    let hospitals = mockDataStore.getHospitals();

    // Apply filters
    hospitals = filterArray(hospitals, searchParams);

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      hospitals = sortArray(hospitals, orderParam);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(hospitals, paginationParams);

    // Handle select parameter (field selection)
    const selectParam = searchParams.get('select');
    if (selectParam) {
      const fields = selectParam.split(',');
      paginated.data = paginated.data.map((hospital) => {
        const selected: Record<string, unknown> = {};
        fields.forEach((field) => {
          const trimmed = field.trim();
          if (hospital[trimmed as keyof typeof hospital] !== undefined) {
            selected[trimmed] = hospital[trimmed as keyof typeof hospital];
          }
        });
        return selected as typeof hospital;
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
 * Handle GET /rest/v1/hospitals/:id
 */
export const getHospitalByIdHandler = http.get(
  `${SUPABASE_URL}/rest/v1/hospitals/:id`,
  async ({ params }) => {
    await delay();

    const { id } = params;
    const hospital = mockDataStore.getHospitalById(id as string);

    if (!hospital) {
      return HttpResponse.json(
        { message: 'Hospital not found' },
        { status: 404 }
      );
    }

    return HttpResponse.json(hospital);
  }
);

/**
 * Handle POST /rest/v1/hospitals
 */
export const createHospitalHandler = http.post(
  `${SUPABASE_URL}/rest/v1/hospitals`,
  async ({ request }) => {
    await delay();

    const body = await request.json();
    // In a real implementation, you would add the hospital to the store
    // For now, we'll just return the created hospital
    return HttpResponse.json(body, { status: 201 });
  }
);

/**
 * Handle PATCH /rest/v1/hospitals/:id
 */
export const updateHospitalHandler = http.patch(
  `${SUPABASE_URL}/rest/v1/hospitals/:id`,
  async ({ params, request }) => {
    await delay();

    const { id } = params;
    const body = await request.json();
    const hospital = mockDataStore.getHospitalById(id as string);

    if (!hospital) {
      return HttpResponse.json(
        { message: 'Hospital not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would update the hospital in the store
    const updated = { ...hospital, ...body, updated_at: new Date().toISOString() };
    return HttpResponse.json(updated);
  }
);

/**
 * Handle DELETE /rest/v1/hospitals/:id
 */
export const deleteHospitalHandler = http.delete(
  `${SUPABASE_URL}/rest/v1/hospitals/:id`,
  async ({ params }) => {
    await delay();

    const { id } = params;
    const hospital = mockDataStore.getHospitalById(id as string);

    if (!hospital) {
      return HttpResponse.json(
        { message: 'Hospital not found' },
        { status: 404 }
      );
    }

    // In a real implementation, you would remove the hospital from the store
    return HttpResponse.json({}, { status: 204 });
  }
);

export const hospitalsHandlers = [
  getHospitalsHandler,
  getHospitalByIdHandler,
  createHospitalHandler,
  updateHospitalHandler,
  deleteHospitalHandler,
];

