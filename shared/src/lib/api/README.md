# API Error Handling

Error handling utilities สำหรับ API routes ที่ให้ standardized error responses และ error types

## การใช้งาน

### 1. Basic Error Handling

```typescript
import { errorResponse, successResponse } from '@/lib/api/error-handler';

export async function GET() {
  try {
    // Your logic here
    const data = await fetchData();
    return successResponse(data);
  } catch (error) {
    return errorResponse(error);
  }
}
```

### 2. Using Error Classes

```typescript
import { 
  NotFoundError, 
  ValidationError, 
  UnauthorizedError 
} from '@/lib/api/error-handler';

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');
  
  if (!id) {
    throw new ValidationError('ต้องระบุ ID');
  }
  
  const data = await findData(id);
  if (!data) {
    throw new NotFoundError('ไม่พบข้อมูล');
  }
  
  return successResponse(data);
}
```

### 3. Using withErrorHandler Wrapper

```typescript
import { withErrorHandler, successResponse } from '@/lib/api/error-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  // No need for try-catch, errors are automatically handled
  const data = await fetchData();
  return successResponse(data);
});
```

### 4. Authentication & Authorization

```typescript
import { 
  requireAuth, 
  requireAdmin, 
  requirePartner 
} from '@/lib/api/error-handler';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const supabase = await createClient();
  
  // Check authentication
  const user = await requireAuth(supabase);
  
  // Check admin role
  await requireAdmin(supabase, user.id);
  
  // Your logic here
  return successResponse({ data: 'admin data' });
});
```

### 5. Validation with Error Details

```typescript
import { ValidationError } from '@/lib/api/error-handler';

function validateData(data: unknown) {
  const errors: Record<string, string[]> = {};
  
  if (!data.name) {
    errors.name = ['ต้องระบุชื่อ'];
  }
  
  if (!data.email || !isValidEmail(data.email)) {
    errors.email = ['รูปแบบอีเมลไม่ถูกต้อง'];
  }
  
  if (Object.keys(errors).length > 0) {
    throw new ValidationError('ข้อมูลไม่ถูกต้อง', errors);
  }
}
```

## Error Types

### ApiError (Base Class)
- `statusCode`: HTTP status code
- `code`: Error code string
- `details`: Additional error details

### ValidationError (400)
ใช้เมื่อข้อมูลที่ส่งมาไม่ถูกต้อง

### NotFoundError (404)
ใช้เมื่อไม่พบข้อมูลที่ต้องการ

### UnauthorizedError (401)
ใช้เมื่อผู้ใช้ไม่ได้ login

### ForbiddenError (403)
ใช้เมื่อผู้ใช้ไม่มีสิทธิ์เข้าถึง

### ConflictError (409)
ใช้เมื่อข้อมูลซ้ำซ้อน

### RateLimitError (429)
ใช้เมื่อเกิน rate limit

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-11-06T10:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "errors": {
    "field": ["Error message"]
  },
  "details": { ... },
  "timestamp": "2025-11-06T10:00:00.000Z"
}
```

## ตัวอย่างการใช้งานจริง

ดูตัวอย่างใน:
- `src/app/api/contact/route.ts` - Contact form API
- `src/app/api/appointments/route.ts` - appointment API

