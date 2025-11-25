# MSW Mock Data Setup

This directory contains Mock Service Worker (MSW) setup for frontend development without backend dependencies.

## Overview

MSW intercepts network requests and returns mock data, allowing frontend developers to work independently without waiting for backend APIs.

## Setup

### 1. Install Dependencies

Dependencies are already added to `package.json`:
- `msw` - Mock Service Worker library
- `@faker-js/faker` - Generate realistic mock data

### 2. Generate Service Worker

Run the following command to generate the MSW service worker:

```bash
npm run msw:init
```

This creates `public/mockServiceWorker.js` which is required for MSW to work in the browser.

### 3. Enable Mock Data

Add the following to your `.env.local` file:

```env
NEXT_PUBLIC_USE_MOCK_DATA=true
```

## Usage

### Development Mode

When `NEXT_PUBLIC_USE_MOCK_DATA=true` and `NODE_ENV=development`, MSW will automatically intercept:

- **Supabase REST API calls** (`/rest/v1/*`)
  - `hospitals` table
  - `appointments` table
  - `payments` table
  - `products` table
  - `articles` table
  - `hospital_reviews` table
  - `hospital_gallery` table

- **Next.js API routes** (`/api/*`)
  - `/api/hospitals`
  - `/api/bookings`
  - `/api/payments`
  - `/api/search`
  - `/api/analytics`

### Disable Mock Data

To use real backend data, either:
1. Remove `NEXT_PUBLIC_USE_MOCK_DATA` from `.env.local`
2. Set `NEXT_PUBLIC_USE_MOCK_DATA=false`
3. Run in production mode (`NODE_ENV=production`)

## Mock Data

### Generated Data

The mock data store includes:
- **15 hospitals** with various statuses (pending, approved, rejected)
- **45 hospital packages** (3 per hospital)
- **30 appointments** with various statuses
- **20 user profiles** with roles (authenticated, partner, admin)
- **25 products**
- **20 articles**
- **40 reviews**
- **75 gallery images** (5 per hospital)
- **50 payments**

### Data Relationships

Mock data maintains relationships:
- Hospitals → Packages
- Users → Appointments
- Hospitals → Reviews
- Hospitals → Gallery Images
- Users → Payments

## File Structure

```
client/src/mocks/
├── browser.ts              # MSW browser setup
├── handlers.ts             # Combined handlers
├── data/
│   ├── store.ts            # In-memory data store
│   └── generators/         # Mock data generators
│       ├── hospitals.ts
│       ├── bookings.ts
│       ├── payments.ts
│       ├── products.ts
│       ├── articles.ts
│       ├── reviews.ts
│       ├── gallery.ts
│       └── users.ts
├── handlers/
│   ├── supabase/           # Supabase REST API handlers
│   │   ├── hospitals.ts
│   │   ├── bookings.ts
│   │   ├── payments.ts
│   │   ├── products.ts
│   │   ├── articles.ts
│   │   ├── reviews.ts
│   │   └── gallery.ts
│   └── api/                # Next.js API route handlers
│       ├── hospitals.ts
│       ├── bookings.ts
│       ├── payments.ts
│       ├── search.ts
│       └── analytics.ts
└── utils/                  # Utility functions
    ├── delay.ts            # Network delay simulation
    ├── filter.ts           # Supabase query filtering
    └── pagination.ts       # Pagination support
```

## Adding New Mock Data

### 1. Create Generator

Create a new generator in `data/generators/`:

```typescript
import { faker } from '@faker-js/faker';
import type { YourType } from '@shared/types';

export function generateMockYourType(overrides?: Partial<YourType>): YourType {
  return {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    // ... other fields
    ...overrides,
  };
}
```

### 2. Add to Store

Update `data/store.ts` to include your new entity:

```typescript
private yourTypes: YourType[] = [];

// In initialize()
this.yourTypes = generateMockYourTypes(10);

// Add getter methods
getYourTypes(): YourType[] {
  return [...this.yourTypes];
}
```

### 3. Create Handler

Create a handler in `handlers/supabase/` or `handlers/api/`:

```typescript
import { http, HttpResponse } from 'msw';
import { mockDataStore } from '../../data/store';

export const getYourTypesHandler = http.get(
  '/rest/v1/your_types',
  async ({ request }) => {
    const yourTypes = mockDataStore.getYourTypes();
    return HttpResponse.json(yourTypes);
  }
);
```

### 4. Register Handler

Add your handler to `handlers.ts`:

```typescript
import { getYourTypesHandler } from './handlers/supabase/your-types';

export const handlers = [
  // ... existing handlers
  getYourTypesHandler,
];
```

## Query Support

MSW handlers support Supabase query syntax:

- **Filtering**: `?status=eq.approved`
- **Sorting**: `?order=created_at.desc`
- **Pagination**: `?limit=10&offset=0`
- **Field selection**: `?select=id,name,status`

## Network Delay

Mock responses include simulated network delay (100-500ms) for more realistic behavior.

## Troubleshooting

### MSW Not Working

1. Check that `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local`
2. Verify `public/mockServiceWorker.js` exists
3. Check browser console for MSW initialization messages
4. Ensure you're in development mode (`NODE_ENV=development`)

### Data Not Appearing

1. Check browser console for errors
2. Verify handlers are registered in `handlers.ts`
3. Check that data store is initialized correctly
4. Verify query parameters match handler expectations

### Service Worker Issues

If service worker fails to load:
1. Clear browser cache
2. Unregister old service workers in DevTools → Application → Service Workers
3. Regenerate service worker: `npm run msw:init`

## Notes

- Mock data resets on page refresh (in-memory storage)
- Data relationships are maintained
- All mock data uses realistic values via Faker.js
- Handlers support common Supabase query patterns
- Network delays simulate real API behavior

