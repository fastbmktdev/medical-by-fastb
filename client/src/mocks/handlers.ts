/**
 * Combined MSW handlers
 */

import { hospitalsHandlers } from './handlers/supabase/hospitals';
import { bookingsHandlers } from './handlers/supabase/bookings';
import { paymentsHandlers } from './handlers/supabase/payments';
import { productsHandlers } from './handlers/supabase/products';
import { articlesHandlers } from './handlers/supabase/articles';
import { reviewsHandlers } from './handlers/supabase/reviews';
import { galleryHandlers } from './handlers/supabase/gallery';
import { hospitalsApiHandlers } from './handlers/api/hospitals';
import { bookingsApiHandlers } from './handlers/api/bookings';
import { paymentsApiHandlers } from './handlers/api/payments';
import { productsApiHandlers } from './handlers/api/products';
import { searchApiHandlers } from './handlers/api/search';
import { analyticsApiHandlers } from './handlers/api/analytics';

export const handlers = [
  // Supabase handlers
  ...hospitalsHandlers,
  ...bookingsHandlers,
  ...paymentsHandlers,
  ...productsHandlers,
  ...articlesHandlers,
  ...reviewsHandlers,
  ...galleryHandlers,
  // API handlers
  ...hospitalsApiHandlers,
  ...bookingsApiHandlers,
  ...paymentsApiHandlers,
  ...productsApiHandlers,
  ...searchApiHandlers,
  ...analyticsApiHandlers,
];

