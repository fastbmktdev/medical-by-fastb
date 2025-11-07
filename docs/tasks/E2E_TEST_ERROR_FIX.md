# E2E Test Error Fix - Auth Flow Internal Server Error

**วันที่**: 2025-11-06
**Test**: `tests/e2e/auth/auth-flow.spec.ts` - Step 6: Partner Application
**Error**: Internal Server Error (500)

---

## 🔍 ปัญหาที่พบ

### 1. Import Path Error ✅ แก้แล้ว
**ไฟล์**: `tests/e2e/auth/auth-flow.spec.ts:13`

**ปัญหา**:
```typescript
import { ... } from './helpers';  // ❌ Wrong - helpers.ts is in parent directory
```

**แก้ไข**:
```typescript
import { ... } from '../helpers';  // ✅ Correct
```

---

### 2. Error Handling ในการ Upload ไฟล์ ✅ แก้แล้ว
**ไฟล์**: `src/app/partner/apply/utils/fileUpload.ts:54`

**ปัญหา**:
```typescript
} catch {  // ❌ No error parameter
  throw new Error("การอัปโหลดรูปภาพล้มเหลว");
}
```

**แก้ไข**:
```typescript
} catch (error) {  // ✅ Proper error handling
  console.error('Image upload error:', error);
  const errorMessage = error instanceof Error ? error.message : "การอัปโหลดรูปภาพล้มเหลว";
  throw new Error(errorMessage);
}
```

---

### 3. Supabase Storage Bucket Missing ⚠️ ต้องแก้

**ปัญหา**: Storage bucket `gym-images` ยังไม่ถูกสร้างใน Supabase

**ผลกระทบ**:
- Partner application form submission ล้มเหลว
- E2E test Step 6 ล้มเหลวด้วย Internal Server Error

**วิธีแก้**:
1. สร้าง storage bucket ตาม [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md)
2. กำหนด RLS policies ที่ถูกต้อง
3. ตั้งค่า public access

---

## ✅ การแก้ไขที่ทำแล้ว

### 1. Fixed Import Path
```diff
- import { ... } from './helpers';
+ import { ... } from '../helpers';
```

### 2. Improved Error Handling
```diff
  } catch {
-   throw new Error("การอัปโหลดรูปภาพล้มเหลว");
+  } catch (error) {
+    console.error('Image upload error:', error);
+    const errorMessage = error instanceof Error ? error.message : "การอัปโหลดรูปภาพล้มเหลว";
+    throw new Error(errorMessage);
  }
```

### 3. Created Documentation
- ✅ `docs/SUPABASE_STORAGE_SETUP.md` - Storage setup guide
- ✅ `docs/E2E_TEST_ERROR_FIX.md` - This document

---

## 🚀 Next Steps

### ต้องทำเพื่อให้ E2E test ผ่าน:

1. **Create Supabase Storage Bucket** ⚠️ Required
   ```bash
   # Follow instructions in docs/SUPABASE_STORAGE_SETUP.md
   ```

2. **Re-run E2E Test**
   ```bash
   npm run test:e2e:auth
   ```

3. **Verify Partner Application Works**
   - Manual test: Go to `/partner/apply`
   - Fill form
   - Submit without images (should work)
   - Submit with images (should work after storage setup)

---

## 🐛 Root Cause Analysis

### Why did the test fail?

1. **Import Path Issue**
   - After reorganizing test structure, moved auth-flow.spec.ts to `tests/e2e/auth/`
   - helpers.ts remained in `tests/e2e/`
   - Import path needed to be updated from `./helpers` to `../helpers`

2. **Storage Upload Error**
   - Form submission tries to upload images
   - Storage bucket `gym-images` doesn't exist
   - Error handling was insufficient (no error parameter in catch)
   - Resulted in Internal Server Error

3. **E2E Test Coverage Gap**
   - Test doesn't upload actual files (no selectedFiles)
   - This is correct behavior, but storage bucket should still exist
   - Better would be to skip image upload in E2E tests or use mock files

---

## 📝 Lessons Learned

1. **Always update import paths** after moving files
2. **Proper error handling** - always capture error parameter in catch blocks
3. **Storage setup** should be part of initial setup documentation
4. **E2E tests** should not depend on optional features (images)
5. **Better error messages** help debug faster

---

## ✅ Testing Checklist

After fixes:
- [x] Import path fixed in auth-flow.spec.ts
- [x] Error handling improved in fileUpload.ts
- [x] Documentation created for storage setup
- [ ] Storage bucket created in Supabase
- [ ] E2E test re-run and passes
- [ ] Manual test of partner application form
- [ ] Images upload successfully

---

## 📚 Related Files

### Modified Files:
- `tests/e2e/auth/auth-flow.spec.ts` - Fixed import path
- `src/app/partner/apply/utils/fileUpload.ts` - Improved error handling

### Created Files:
- `docs/SUPABASE_STORAGE_SETUP.md` - Storage setup guide
- `docs/E2E_TEST_ERROR_FIX.md` - This document

### Related Files:
- `tests/e2e/helpers.ts` - Test helper functions
- `src/app/partner/apply/hooks/useFormSubmission.ts` - Form submission logic
- `src/app/partner/apply/page.tsx` - Partner application form

---

## 🎯 Summary

**Problem**: E2E test failed with Internal Server Error during partner application submission

**Root Causes**:
1. ✅ Wrong import path (fixed)
2. ✅ Poor error handling (fixed)
3. ⚠️ Missing storage bucket (needs manual setup)

**Status**:
- Code fixes: ✅ Complete
- Storage setup: ⏳ Pending (requires manual Supabase configuration)
- Testing: ⏳ Pending (waiting for storage setup)

**Next Action**:
Follow [SUPABASE_STORAGE_SETUP.md](./SUPABASE_STORAGE_SETUP.md) to create the storage bucket, then re-run tests.
