# Test Helpers

## 📋 Overview

Shared test utilities, helper functions, and mock data for all test types.

## 📁 Contents

- `test-utils.ts` - Common test utilities and helper functions
- `test-database.ts` - Database test helpers (setup, teardown, fixtures)
- `test-api.ts` - API testing helpers (auth, requests, responses)
- `mock-data.ts` - Mock data generators

## 🚀 Usage

### Import helpers in your tests
```typescript
import { createTestUser, cleanupTestData } from '@tests/helpers/test-database';
import { mockApiResponse } from '@tests/helpers/test-api';
import { generateMockBooking } from '@tests/helpers/mock-data';
```

## 📚 Available Helpers

### Database Helpers
- `createTestUser()` - Create a test user
- `createTestGym()` - Create a test gym
- `createTestBooking()` - Create a test booking
- `cleanupTestData()` - Clean up all test data
- `setupTestDatabase()` - Initialize test database
- `teardownTestDatabase()` - Close test database connections

### API Helpers
- `mockAuthRequest()` - Mock authenticated API request
- `mockApiResponse()` - Mock API response
- `createTestToken()` - Generate test JWT token

### Mock Data
- `generateMockUser()` - Generate mock user data
- `generateMockGym()` - Generate mock gym data
- `generateMockBooking()` - Generate mock booking data
- `generateMockPayment()` - Generate mock payment data
