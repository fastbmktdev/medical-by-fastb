/**
 * MSW handlers for Supabase articles table
 */

import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';
import { filterArray, sortArray, paginate, extractPaginationParams } from '../../utils';
import { delay } from '../../utils/delay';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';

/**
 * Handle GET /rest/v1/articles
 */
export const getArticlesHandler = http.get(
  `${SUPABASE_URL}/rest/v1/articles`,
  async ({ request }) => {
    await delay();

    const url = new URL(request.url);
    const searchParams = url.searchParams;

    let articles = mockDataStore.getArticles();

    // Apply filters
    articles = filterArray(articles, searchParams);

    // Apply sorting
    const orderParam = searchParams.get('order');
    if (orderParam) {
      articles = sortArray(articles, orderParam);
    }

    // Apply pagination
    const paginationParams = extractPaginationParams(searchParams);
    const paginated = paginate(articles, paginationParams);

    return HttpResponse.json(paginated.data, {
      headers: {
        'Content-Range': `${paginationParams.offset || 0}-${(paginationParams.offset || 0) + paginated.data.length - 1}/${paginated.total}`,
        'X-Total-Count': paginated.total.toString(),
      },
    });
  }
);

export const articlesHandlers = [getArticlesHandler];

