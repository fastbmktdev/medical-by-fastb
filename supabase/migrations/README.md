# Migrations Directory

## 📋 Overview

โปรเจคนี้ใช้ **Supabase Migrations** ในการจัดการ database schema

## 🗂️ Migration Files

### Initial Setup (2024-10-18 to 2024-10-20)
1. `20251018073856_initial_schema.sql` - Schema เริ่มต้น (tables, RLS, triggers)
2. `20251019000000_add_gym_public_fields.sql` - เพิ่มฟิลด์สาธารณะของยิม
3. `20251019000001_remove_unique_user_gym.sql` - ลบข้อจำกัด unique user-gym
4. `20251019000002_add_slug_generation.sql` - ระบบ slug อัตโนมัติ
5. `20251020000000_add_phone_to_profiles.sql` - เพิ่มเบอร์โทรในโปรไฟล์
6. `20251020000001_create_gym_packages.sql` - ระบบแพ็คเกจและการจอง
7. `20251020000002_seed_gym_packages.sql` - ข้อมูลตัวอย่างแพ็คเกจ
8. `20251020000003_create_payments_tables.sql` - ระบบชำระเงิน
9. `20251020000004_add_partner_booking_update_policy.sql` - Policy สำหรับ partner

### Refactoring (2024-10-20) ⭐ NEW
10. `20251020100000_refactor_remove_duplicates.sql` - ลบโค้ดซ้ำซ้อน
11. `20251020100001_optimize_triggers.sql` - ปรับปรุง triggers
12. `20251020100002_add_helper_functions.sql` - เพิ่ม helper functions
13. `20251020100003_optimize_indexes.sql` - ปรับปรุง indexes
14. `20251020100004_test_refactoring.sql` - ทดสอบ refactoring

## 🚀 การใช้งาน

### Local Development
```bash
# Reset และ apply migrations ทั้งหมด
supabase db reset

# หรือ push เฉพาะ migrations ใหม่
supabase db push

# ดู migration status
supabase migration list
```

### Production
```bash
# Link กับ production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# หรือใช้ Dashboard (SQL Editor)
```

## 📖 Documentation

- **[MIGRATION_GUIDE.md](../../docs/MIGRATION_GUIDE.md)** - คู่มือการ apply migrations
- **[REFACTORING_SUMMARY.md](../../docs/REFACTORING_SUMMARY.md)** - รายละเอียด refactoring

## ✨ Features หลังจาก Refactoring

### Helper Functions
- `is_admin()`, `is_partner()`, `owns_gym()` - Role checking
- `get_gym_by_slug()`, `get_gym_packages()` - Data retrieval
- `get_user_bookings()`, `get_gym_bookings()`, `get_gym_stats()` - Booking queries
- `generate_reference_number()` - Unified reference generator
- `validate_booking_dates()` - Date validation

### Performance Improvements
- Composite indexes สำหรับ queries ที่ใช้บ่อย
- Partial indexes สำหรับข้อมูลที่ filter บ่อย
- GIN indexes สำหรับ arrays และ JSONB
- Full-text search indexes สำหรับค้นหายิม

### Code Quality
- ลดโค้ดซ้ำซ้อน 70%+
- Centralized permission checks
- Consistent naming conventions
- Comprehensive comments

## 🗄️ Backup

Migration files เก่าที่ไม่ใช้แล้วถูกย้ายไปยัง `migrations_backup/` เพื่อเก็บเป็น reference

## 📝 Notes

- ไฟล์ migrations ต้องมีรูปแบบ: `<timestamp>_name.sql`
- Migrations จะถูก apply ตามลำดับ timestamp
- ทุก migration ควรเป็น idempotent (รันซ้ำได้)
- ใช้ `CREATE OR REPLACE` และ `IF NOT EXISTS` เสมอ

## 🧪 Testing

รัน test migration เพื่อตรวจสอบว่า refactoring สำเร็จ:

```bash
# Apply test migration
supabase db push

# ดู NOTICE messages ใน output
# ควรเห็น "All tests passed!" หรือ "Most tests passed"
```

## 🔄 Rollback

หากต้องการ rollback migrations:

```bash
# Rollback ไปยัง migration ก่อนหน้า
supabase db reset

# หรือ manual rollback ใน SQL Editor
# (ดูรายละเอียดใน REFACTORING_SUMMARY.md)
```

## 📞 Support

หากพบปัญหา:
1. ตรวจสอบ error messages
2. อ่าน documentation ใน `docs/`
3. ตรวจสอบ test results จาก `20251020100004_test_refactoring.sql`

