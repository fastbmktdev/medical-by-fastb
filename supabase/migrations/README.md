# Migrations Directory

## สถานะปัจจุบัน

โปรเจคนี้ใช้ **`supabase/seed.sql`** ในการ setup database แทนการใช้ migrations

## ไฟล์ที่ถูกย้าย

Migration files ทั้งหมดได้ถูกย้ายไปยัง `migrations_backup/` เพื่อเก็บเป็น reference

## การใช้งาน Database

### Setup Database Local
```bash
supabase db reset --local
```

คำสั่งนี้จะ apply `supabase/seed.sql` อัตโนมัติ

### Setup Database Production
รัน SQL ใน `supabase/seed.sql` ใน Supabase Dashboard → SQL Editor

---

**หมายเหตุ**: ไฟล์ migrations จะถูก apply ก็ต่อเมื่อมีรูปแบบชื่อไฟล์: `<timestamp>_name.sql`

ตัวอย่าง: `20250118000000_initial_setup.sql`

