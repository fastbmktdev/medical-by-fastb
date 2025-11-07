# 🚀 Database Migration & Deployment Guide

## 📋 Overview

โปรเจกต์นี้ใช้ **Supabase Migrations** สำหรับจัดการ database schema โดยอัตโนมัติ

## 🔄 Auto-Migration Workflow

### 1. **Git Push → GitHub Actions**

เมื่อคุณ push migrations ขึ้น Git:

```bash
git add supabase/migrations/
git commit -m "Add new migration: add_user_profile_table"
git push origin main
```

GitHub Actions จะ:
- ✅ Detect ว่ามี migrations ใหม่
- ✅ Run `supabase db push` อัตโนมัติ
- ✅ Verify การ deploy สำเร็จ
- ✅ Deploy Next.js app

### 2. **การตั้งค่า Secrets ใน GitHub**

ไปที่: **Settings → Secrets and variables → Actions**

เพิ่ม secrets ต่อไปนี้:

```
SUPABASE_PROJECT_REF          # Project reference ID
SUPABASE_ACCESS_TOKEN         # Personal access token
SUPABASE_DB_PASSWORD          # Database password
NEXT_PUBLIC_SUPABASE_URL      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY # Anonymous key
```

#### วิธีหา Access Token:

```bash
# Login to Supabase
supabase login

# หรือไปที่
https://app.supabase.com/account/tokens
```

### 3. **Manual Migration (ถ้าจำเป็น)**

#### สำหรับ Local Development:

```bash
# รีเซ็ต database และ apply migrations ทั้งหมด
npm run db:reset

# หรือ
npx supabase db reset
```

#### สำหรับ Production:

```bash
# Link to project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# หรือใช้ script
bash scripts/shell/quick-deploy.sh
```

### 4. **CI/CD Pipeline**

#### Branch Strategy:

- **`main/master`** → Auto deploy to Production
- **`develop`** → Auto deploy to Staging
- **`feature/*`** → Check migrations only

#### Workflow Files:

1. **`.github/workflows/deploy.yml`** - Deploy to production
2. **`.github/workflows/migration-check.yml`** - Validate migrations

## 🔍 การตรวจสอบ Migrations

### ดูว่า migrations ไหน run แล้ว:

```bash
# List migrations
npx supabase migration list

# Check migration status
npm run db:status
```

### สร้าง migration ใหม่:

```bash
# Create new migration
npx supabase migration new create_new_table

# Edit the generated file
# supabase/migrations/YYYYMMDDHHMMSS_create_new_table.sql
```

### Diff ระหว่าง local และ remote:

```bash
# See differences
npx supabase db diff

# Generate migration from diff
npx supabase db diff -f migration_name
```

## ⚠️ Best Practices

### 1. **Migration Naming**

ใช้ชื่อที่ชัดเจน:

```
✅ 20251020000000_add_user_avatar.sql
✅ 20251021000000_create_booking_table.sql
✅ 20251022000000_add_gamification_points.sql

❌ migration1.sql
❌ fix.sql
❌ update.sql
```

### 2. **Idempotency**

ทำให้ migrations สามารถ run ได้หลายครั้ง:

```sql
-- ✅ Good: Idempotent
CREATE TABLE IF NOT EXISTS users (...);
CREATE INDEX IF NOT EXISTS idx_user_email ON users(email);

-- ❌ Bad: Will fail on second run
CREATE TABLE users (...);
CREATE INDEX idx_user_email ON users(email);
```

### 3. **Ordering**

ตรวจสอบลำดับ migrations ให้ถูกต้อง:

```bash
# List migrations in order
ls -1 supabase/migrations/
```

### 4. **Testing**

ทดสอบ migrations ก่อน push:

```bash
# Test locally
npm run db:reset

# Check for errors
npm run db:check

# Verify data
npm run db:utils
```

## 🆘 Troubleshooting

### Migration conflict:

```bash
# Reset everything
npx supabase db reset

# หรือ reset specific migration
npx supabase migration repair --status applied --version TIMESTAMP
```

### Auto-migration failed:

1. ตรวจสอบ logs ใน GitHub Actions
2. Check Supabase dashboard → Logs
3. Run migration manually:

```bash
supabase db push
```

### Production sync issues:

```bash
# Force reset production (⚠️ ระวัง!)
supabase db reset --linked

# หรือ repair migration
supabase migration repair --status applied
```

## 📚 Resources

- [Supabase CLI Docs](https://supabase.com/docs/guides/cli)
- [Migration Guide](https://supabase.com/docs/guides/cli/local-development#database-migrations)
- [GitHub Actions](https://docs.github.com/en/actions)

## 🎯 Quick Reference

```bash
# Start local Supabase
npm run db:start

# Reset database
npm run db:reset

# Create migration
npx supabase migration new NAME

# Deploy migrations
npx supabase db push

# Check status
npm run db:status

# Get Supabase keys
npm run supabase:fix-keys

# Test connection
npm run supabase:test
```