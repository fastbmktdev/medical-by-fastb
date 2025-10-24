# Database Scripts Directory

This directory contains consolidated database management utilities for the project. All scripts have been organized and consolidated to reduce complexity and improve maintainability.

## 📋 Overview

The scripts directory has been restructured from 12+ individual files to 4 comprehensive, well-documented scripts that handle all database management tasks.

### Consolidated Scripts Structure

```
scripts/
├── admin-management.sql          # Complete admin user management
├── database-utilities.js         # Database health checks and maintenance
├── development-setup.sh          # Development environment setup
├── storage-configuration.sql     # Storage bucket and policy setup
└── README.md                     # This documentation
```

## 🚀 Quick Start

### For New Developers

1. **Set up development environment:**
   ```bash
   ./scripts/development-setup.sh
   ```

2. **Create admin user:**
   ```sql
   -- Run in Supabase SQL Editor
   \i scripts/admin-management.sql
   SELECT public.promote_to_admin('your-email@example.com');
   ```

3. **Verify everything works:**
   ```bash
   node scripts/database-utilities.js all
   ```

### For Existing Projects

See the [Migration Guide](#migration-guide) section below.

## 📚 Script Documentation

### 1. `admin-management.sql`

**Purpose:** Complete admin user role management system

**Consolidates:**
- `create-admin.sql`
- `set-admin-by-email.sql`
- `set-admin-role.sql`
- `admin_helper_functions.sql` (from migrations_backup)

**Key Functions:**
- `promote_to_admin(email)` - Promote user to admin by email
- `promote_to_admin_by_id(user_id)` - Promote user to admin by ID
- `demote_from_admin(email)` - Demote admin to regular user
- `check_user_role(email)` - Check user's current role and details
- `list_all_admins()` - List all admin users
- `batch_promote_to_admin(emails[])` - Batch promote multiple users
- `validate_admin_setup()` - Validate admin system configuration

**Usage Examples:**
```sql
-- Promote single user
SELECT public.promote_to_admin('admin@example.com');

-- Check user role
SELECT * FROM public.check_user_role('user@example.com');

-- List all admins
SELECT * FROM public.list_all_admins();

-- Batch promote
SELECT * FROM public.batch_promote_to_admin(ARRAY['user1@example.com', 'user2@example.com']);
```

### 2. `database-utilities.js`

**Purpose:** Comprehensive database health checking and maintenance

**Consolidates:**
- `check-database.mjs`
- `check-partner-promotion.sql`
- `update-gym-slugs.sql`

**Features:**
- Database connectivity and table verification
- Partner role promotion checking
- Gym slug generation and updates
- Storage bucket verification
- Environment detection and configuration

**Usage:**
```bash
# Basic health check (default)
node scripts/database-utilities.js
node scripts/database-utilities.js check

# Specific utilities
node scripts/database-utilities.js partners  # Check partner promotions
node scripts/database-utilities.js slugs    # Update gym slugs
node scripts/database-utilities.js storage  # Verify storage buckets
node scripts/database-utilities.js all      # Run all utilities

# NPM shortcuts
npm run db:check      # Health check
npm run db:partners   # Partner verification
npm run db:slugs      # Slug updates
npm run db:utils      # All utilities
```

**Environment Variables:**
- `SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_ANON_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. `development-setup.sh`

**Purpose:** Complete development environment setup and user creation

**Consolidates:**
- `create-test-users.sh`
- Development environment validation
- Sample data seeding coordination

**Features:**
- Environment detection (local vs production)
- Dependency checking (curl, jq, psql, supabase CLI)
- Test user creation via Supabase Admin API
- Sample data seeding from seed.sql
- Development environment health checks
- Migration status verification

**Usage:**
```bash
# Full setup (recommended for new developers)
./scripts/development-setup.sh

# Specific operations
./scripts/development-setup.sh --users-only    # Create test users only
./scripts/development-setup.sh --seed-only     # Seed sample data only
./scripts/development-setup.sh --check-only    # Environment check only
./scripts/development-setup.sh --help          # Show help
```

**Test Users Created:**
- `admin@muaythai.com` / `password123` (Admin user)
- `user@muaythai.com` / `password123` (Regular user)
- `partner@muaythai.com` / `password123` (Partner user)
- `partner2@muaythai.com` / `password123` (Second partner)

### 4. `storage-configuration.sql`

**Purpose:** Complete storage bucket and policy configuration

**Consolidates:**
- `setup-storage.sql`
- `create_gym_images_bucket.sql` (from migrations_backup)
- `create_bucket_only.sql` (from migrations_backup)

**Features:**
- Gym images bucket creation with public access
- Comprehensive storage policies for access control
- Error handling for existing configurations
- Verification queries and health checks
- Rollback procedures for cleanup

**Key Policies Created:**
- Authenticated users can upload gym images
- Public read access for gym images
- Users can update/delete their own images
- Admins can manage all gym images

**Utility Functions:**
- `check_storage_bucket_health(bucket_name)` - Health check
- `recreate_storage_policies(bucket_name)` - Policy recreation

**Usage:**
```sql
-- Run entire script in Supabase SQL Editor
\i scripts/storage-configuration.sql

-- Check bucket health
SELECT * FROM check_storage_bucket_health();

-- Recreate policies if needed
SELECT recreate_storage_policies();
```

## 🔄 Migration Guide

### From Old Script Structure

If you're migrating from the previous scattered script structure, follow these steps:

#### 1. Backup Current Setup
```bash
# Create backup of current scripts
cp -r scripts scripts_backup_$(date +%Y%m%d)
```

#### 2. Script Migration Mapping

| **Old Script** | **New Script** | **Migration Action** |
|----------------|----------------|---------------------|
| `create-admin.sql` | `admin-management.sql` | Use `promote_to_admin()` function |
| `set-admin-by-email.sql` | `admin-management.sql` | Use `promote_to_admin()` function |
| `set-admin-role.sql` | `admin-management.sql` | Use `promote_to_admin()` function |
| `check-database.mjs` | `database-utilities.js` | Run `node scripts/database-utilities.js check` |
| `check-partner-promotion.sql` | `database-utilities.js` | Run `node scripts/database-utilities.js partners` |
| `update-gym-slugs.sql` | `database-utilities.js` | Run `node scripts/database-utilities.js slugs` |
| `create-test-users.sh` | `development-setup.sh` | Run `./scripts/development-setup.sh --users-only` |
| `setup-storage.sql` | `storage-configuration.sql` | Run entire script in SQL Editor |

#### 3. Verification Steps

1. **Test admin functions:**
   ```sql
   -- Run admin-management.sql first
   \i scripts/admin-management.sql
   
   -- Test admin promotion
   SELECT public.promote_to_admin('your-email@example.com');
   
   -- Verify admin list
   SELECT * FROM public.list_all_admins();
   ```

2. **Test database utilities:**
   ```bash
   # Test all utilities
   node scripts/database-utilities.js all
   ```

3. **Test development setup:**
   ```bash
   # Test environment check
   ./scripts/development-setup.sh --check-only
   ```

4. **Test storage configuration:**
   ```sql
   -- Check storage health
   SELECT * FROM check_storage_bucket_health();
   ```

#### 4. Clean Up Old Files

After verifying everything works:

```bash
# Remove old individual scripts (be careful!)
rm scripts/create-admin.sql
rm scripts/set-admin-by-email.sql
rm scripts/set-admin-role.sql
rm scripts/check-database.mjs
rm scripts/check-partner-promotion.sql
rm scripts/update-gym-slugs.sql
rm scripts/create-test-users.sh
rm scripts/setup-storage.sql

# Keep backup for safety
# rm -rf scripts_backup_YYYYMMDD  # Only after thorough testing
```

### NPM Scripts Update

Update your `package.json` scripts section:

```json
{
  "scripts": {
    "db:check": "node scripts/database-utilities.js check",
    "db:partners": "node scripts/database-utilities.js partners",
    "db:slugs": "node scripts/database-utilities.js slugs",
    "db:storage": "node scripts/database-utilities.js storage",
    "db:utils": "node scripts/database-utilities.js all",
    "dev:setup": "./scripts/development-setup.sh",
    "dev:users": "./scripts/development-setup.sh --users-only",
    "dev:seed": "./scripts/development-setup.sh --seed-only"
  }
}
```

## 🛠️ Troubleshooting

### Common Issues

#### Environment Variables Missing
```
❌ Missing Supabase credentials
```
**Solution:**
- Ensure `.env.local` exists with correct Supabase credentials
- Check variable names match expected format
- For local development, use default local Supabase URLs

#### Database Connection Failed
```
❌ Database connectivity check failed
```
**Solution:**
- Verify Supabase is running: `supabase status`
- Check network connectivity
- Validate API keys and project URL

#### Permission Denied Errors
```
⚠️ Table "tablename" exists but access denied
```
**Solution:**
- Check RLS policies in Supabase dashboard
- Verify user permissions and roles
- Ensure service role key is used for admin operations

#### Storage Bucket Issues
```
❌ Storage bucket "gym-images" does NOT exist
```
**Solution:**
- Run storage configuration script: `\i scripts/storage-configuration.sql`
- Check Supabase dashboard storage section
- Verify storage extension is enabled

#### Migration Errors
```
ERROR: relation "user_roles" does not exist
```
**Solution:**
- Ensure all migrations have been applied: `supabase db push`
- Check migration status: `supabase migration list`
- Reset and reapply if needed: `supabase db reset`

### Getting Help

1. **Check script help:**
   ```bash
   node scripts/database-utilities.js help
   ./scripts/development-setup.sh --help
   ```

2. **Run validation functions:**
   ```sql
   SELECT * FROM public.validate_admin_setup();
   SELECT * FROM check_storage_bucket_health();
   ```

3. **Check environment:**
   ```bash
   ./scripts/development-setup.sh --check-only
   ```

## 📖 Additional Resources

- **Migration Documentation:** See `supabase/migrations/README.md`
- **Project Setup:** See main project `README.md`
- **API Documentation:** Check Supabase dashboard
- **Support:** Contact the development team

## 🔒 Security Notes

- Admin functions require appropriate database permissions
- Service role keys should be kept secure and not committed to version control
- Storage policies are configured for secure access control
- All scripts include comprehensive error handling and validation

## 📝 Contributing

When adding new database scripts:

1. Follow the consolidated approach - group related functionality
2. Include comprehensive error handling and validation
3. Add usage examples and documentation
4. Test in both local and production environments
5. Update this README with new functionality