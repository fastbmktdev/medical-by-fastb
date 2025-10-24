# Migrations Directory

## 📋 Overview

This project uses **Supabase Migrations** for database schema management. The migrations have been consolidated and optimized to reduce complexity while maintaining all functionality.

## 🗂️ Consolidated Migration Files

### Core Schema (Unchanged)
1. `20251018073856_initial_schema.sql` - Initial database schema (tables, RLS, triggers)

### Consolidated Feature Migrations ⭐ NEW STRUCTURE
2. `20251019000000_gym_enhancements.sql` - **Consolidated gym-related features**
   - Combines: `add_gym_public_fields.sql`, `remove_unique_user_gym.sql`, `add_slug_generation.sql`
   - Features: Public gym fields, slug generation, constraint updates

3. `20251020000000_user_profiles_auth.sql` - **Consolidated user and authentication features**
   - Combines: `add_phone_to_profiles.sql`, username support, user role policies
   - Features: Phone numbers, usernames, profile management, RLS policies

4. `20251020000001_packages_payments.sql` - **Consolidated packages and payments system**
   - Combines: `create_gym_packages.sql`, `seed_gym_packages.sql`, `create_payments_tables.sql`
   - Features: Package system, payment tables, booking policies, sample data

5. `20251020000002_storage_policies.sql` - **Consolidated storage configuration**
   - Combines: Storage bucket creation, policies, and access controls
   - Features: Gym images bucket, comprehensive storage policies

6. `20251020100000_optimization_final.sql` - **Consolidated optimizations and helpers**
   - Combines: Duplicate removal, trigger optimization, helper functions, index optimization
   - Features: Performance improvements, helper functions, optimized indexes

### Legacy Migrations (Consolidated)
The following migrations have been consolidated into the above files:
- `add_gym_public_fields.sql` → `gym_enhancements.sql`
- `remove_unique_user_gym.sql` → `gym_enhancements.sql`
- `add_slug_generation.sql` → `gym_enhancements.sql`
- `add_phone_to_profiles.sql` → `user_profiles_auth.sql`
- `create_gym_packages.sql` → `packages_payments.sql`
- `seed_gym_packages.sql` → `packages_payments.sql`
- `create_payments_tables.sql` → `packages_payments.sql`
- `add_partner_booking_update_policy.sql` → `packages_payments.sql`
- `refactor_remove_duplicates.sql` → `optimization_final.sql`
- `optimize_triggers.sql` → `optimization_final.sql`
- `add_helper_functions.sql` → `optimization_final.sql`
- `optimize_indexes.sql` → `optimization_final.sql`

## 🚀 Usage

### Local Development
```bash
# Reset and apply all migrations
supabase db reset

# Or push only new migrations
supabase db push

# Check migration status
supabase migration list

# Check migration history
supabase migration list --local
```

### Production
```bash
# Link to production project
supabase link --project-ref YOUR_PROJECT_REF

# Push migrations
supabase db push

# Or use Dashboard (SQL Editor)
```

## 📖 Documentation

- **[MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md)** - Complete migration guide from old structure
- **[scripts/README.md](../../scripts/README.md)** - Database scripts documentation

## ✨ Features After Consolidation

### Helper Functions (from optimization_final.sql)
- `is_admin()`, `is_partner()`, `owns_gym()` - Role checking functions
- `get_gym_by_slug()`, `get_gym_packages()` - Data retrieval functions
- `get_user_bookings()`, `get_gym_bookings()`, `get_gym_stats()` - Booking query functions
- `generate_reference_number()` - Unified reference number generator
- `validate_booking_dates()` - Date validation function

### Performance Improvements
- Composite indexes for frequently used queries
- Partial indexes for filtered data
- GIN indexes for arrays and JSONB fields
- Full-text search indexes for gym search functionality

### Code Quality Improvements
- Reduced code duplication by 70%+
- Centralized permission checks
- Consistent naming conventions
- Comprehensive inline documentation

### Storage Configuration
- Gym images bucket with public access
- Comprehensive storage policies for secure access control
- Utility functions for storage health checking

## 🗄️ Backup Files

Legacy migration files have been moved to `migrations_backup/` and `migrations_consolidated_backup/` directories for reference. These can be safely removed after verifying the consolidated migrations work correctly.

## 📝 Migration Best Practices

- Migration files follow format: `<timestamp>_descriptive_name.sql`
- Migrations are applied in timestamp order
- All migrations should be idempotent (safe to run multiple times)
- Always use `CREATE OR REPLACE` and `IF NOT EXISTS` where appropriate
- Include comprehensive error handling and validation
- Add descriptive comments for complex operations

## 🧪 Testing Migrations

### Local Testing
```bash
# Test fresh database setup
supabase db reset

# Verify all tables and functions exist
supabase db diff

# Run database health check
node scripts/database-utilities.js check
```

### Validation Queries
```sql
-- Check all required tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Verify helper functions
\df public.*

-- Check storage configuration
SELECT * FROM storage.buckets;
SELECT policyname FROM pg_policies WHERE schemaname = 'storage';

-- Validate indexes
SELECT indexname, tablename FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;
```

## 🔄 Rollback Procedures

### Local Development
```bash
# Complete reset (destructive)
supabase db reset

# Restore from backup (if available)
psql -f database_backup.sql
```

### Production
```bash
# Create backup before rollback
supabase db dump > backup_before_rollback.sql

# Manual rollback using SQL Editor
# (See specific rollback instructions in each migration file)
```

## 🚨 Migration Safety

### Pre-Migration Checklist
- [ ] Create database backup
- [ ] Test migrations in staging environment
- [ ] Verify all dependent services are compatible
- [ ] Plan rollback strategy
- [ ] Schedule maintenance window (for production)

### Post-Migration Verification
- [ ] Run database health checks
- [ ] Verify application functionality
- [ ] Check performance metrics
- [ ] Validate data integrity
- [ ] Test user authentication and permissions

## 📞 Support and Troubleshooting

### Common Issues

**Migration Fails with "relation already exists"**
```bash
# Check existing schema
supabase db diff

# Reset if safe to do so
supabase db reset
```

**Permission denied errors**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Verify user roles
SELECT * FROM user_roles WHERE user_id = auth.uid();
```

**Storage bucket issues**
```sql
-- Check storage configuration
SELECT * FROM check_storage_bucket_health();

-- Recreate storage policies if needed
SELECT recreate_storage_policies();
```

### Getting Help

1. **Check migration logs** for specific error messages
2. **Run validation queries** to identify missing components
3. **Use database utilities** for health checking: `node scripts/database-utilities.js check`
4. **Review backup files** to understand what changed
5. **Contact development team** with specific error details

### Useful Commands

```bash
# Check Supabase status
supabase status

# View migration history
supabase migration list

# Check database connectivity
node scripts/database-utilities.js check

# Validate admin setup
# Run in SQL Editor: SELECT * FROM public.validate_admin_setup();

# Check storage health
# Run in SQL Editor: SELECT * FROM check_storage_bucket_health();
```

