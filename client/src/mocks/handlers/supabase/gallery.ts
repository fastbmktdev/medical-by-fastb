/**
 * MSW handlers for Supabase gallery table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';
import type { GalleryImage } from '@shared/types/gallery.types';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/hospital_gallery
 */
export const getGalleryHandler = http.get(
  `${SUPABASE_URL}/rest/v1/hospital_gallery`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let galleryImages: GalleryImage[] = mockDataStore.getGalleryImages();

    // Apply filters
    galleryImages = filterArray(galleryImages as unknown as Array<Record<string, unknown>>, searchParams) as unknown as GalleryImage[];

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      galleryImages = sortArray(galleryImages as unknown as Array<Record<string, unknown>>, orderParam) as unknown as GalleryImage[];
    } else {
      // Default sort by display_order
      galleryImages = galleryImages.sort((a, b) => a.display_order - b.display_order);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(galleryImages, paginationParams);

    return HttpResponse.json(paginated.data, {
      headers: {
        'Content-Range': `${paginationParams.offset || 0}-${(paginationParams.offset || 0) + paginated.data.length - 1}/${paginated.total}`,
        'X-Total-Count': paginated.total.toString(),
      },
    });
  }
);

export const galleryHandlers = [getGalleryHandler];

