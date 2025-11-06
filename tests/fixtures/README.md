# Test Fixtures

## 📋 Overview

Static test data and fixtures used across all test types.

## 📁 Contents

- `users.json` - Test user data
- `gyms.json` - Test gym data
- `packages.json` - Test package data
- `bookings.json` - Test booking data
- `promotions.json` - Test promotion data

## 🚀 Usage

### Import fixtures in your tests
```typescript
import users from '@tests/fixtures/users.json';
import gyms from '@tests/fixtures/gyms.json';

const testUser = users.find(u => u.role === 'regular');
const testGym = gyms[0];
```

## 📝 Fixture Structure

### users.json
```json
[
  {
    "id": "test-user-1",
    "email": "test@example.com",
    "username": "testuser",
    "role": "regular"
  }
]
```

### gyms.json
```json
[
  {
    "id": "test-gym-1",
    "name": "Test Gym",
    "slug": "test-gym",
    "location": "Bangkok"
  }
]
```

## 🔒 Important

- **Do not use real data** - All fixtures should use test/mock data only
- **Use consistent IDs** - Use predictable IDs for easy reference
- **Keep it minimal** - Only include necessary fields for testing
