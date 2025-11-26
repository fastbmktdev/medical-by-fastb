# Scripts Directory

This directory contains various utility scripts for development, security, and database management.

## Directory Structure

```
scripts/
├── security/       # Security-related scripts (secret detection, key management)
├── shell/          # Shell utility scripts (deployment, setup, etc.)
├── node/           # Node.js scripts (database utilities, testing)
└── sql/            # SQL scripts (migrations, user creation)
```

## Quick Reference

### Security Scripts (`security/`)
See [security/README.md](./security/README.md) for detailed documentation.

- `pre-commit-secret-check.sh` - Pre-commit hook for secret detection
- `install-pre-commit-hook.sh` - Install the pre-commit hook
- `cleanup-git-history.sh` - Remove secrets from git history
- `get-supabase-keys.sh` - Retrieve Supabase keys
- `update-env-from-keys.sh` - Update .env.local with keys
- `check-production-security.sh` - Security audit script
- `check-log-secrets.sh` - Check logs for exposed secrets

### Shell Scripts (`shell/`)

- `development-setup.sh` - Initial development environment setup
- `quick-deploy.sh` - Quick deployment script
- `fix-supabase-keys.sh` - Fix Supabase key configuration
- `check-security.sh` - Run security checks
- `run-create-user.sh` - Create user via CLI
- `connect-to-original-repo.sh` - Connect to upstream repository

### Node.js Scripts (`node/`)

- `create-user.js` - Create new user programmatically
- `create-test-users.js` - Create multiple test users
- `create-health-article.js` - Create health article about mental health
- `database-utilities.js` - Database helper functions
- `test-supabase-connection.js` - Test database connection
- `test-resend-emails.js` - Test email functionality
- `test-smtp.js` - Test SMTP configuration
- `check-env-production.js` - Verify production environment
- `get-supabase-keys.js` - Get keys via Node.js
- `optimize-migrations.js` - Optimize database migrations

### SQL Scripts (`sql/`)

- `create-user.sql` - SQL template for creating users
- `create-test-users.sql` - Create test users in database
- `create-production-admin.sql` - Create production admin user
- `production-deploy.sql` - Production deployment SQL
- `add-mock-hospitals.sql` - Add sample hospital data
- `admin-management.sql` - Admin user management queries

## Usage Examples

### Setup Development Environment
```bash
# Install pre-commit hook
./scripts/security/install-pre-commit-hook.sh

# Run development setup
./scripts/shell/development-setup.sh

# Get local Supabase keys
./scripts/security/get-supabase-keys.sh --local
```

### Create Users
```bash
# Create a single user
./scripts/shell/run-create-user.sh

# Create test users
node scripts/node/create-test-users.js

# Create production admin (use SQL directly)
psql -f scripts/sql/create-production-admin.sql
```

### Create Content
```bash
# Create health article about mental health (requires database)
node server/scripts/node/create-health-article.js

# Create static health articles (no database required)
node server/scripts/node/create-health-articles-static.js [count]
node server/scripts/node/create-health-articles-static.js 10  # Generate 10 articles
```

### Testing
```bash
# Test database connection
node scripts/node/test-supabase-connection.js

# Test email configuration
node scripts/node/test-resend-emails.js
node scripts/node/test-smtp.js
```

### Security
```bash
# Run security checks
./scripts/shell/check-security.sh

# Check for secrets in logs
./scripts/security/check-log-secrets.sh

# Check production security
./scripts/security/check-production-security.sh
```

### Deployment
```bash
# Quick deployment
./scripts/shell/quick-deploy.sh

# Run production SQL
psql -f scripts/sql/production-deploy.sql
```

## Important Notes

- Always run security scripts before committing
- Test scripts in development before using in production
- Keep .env.local file secure and never commit it
- Use SQL scripts with caution in production
- Review shell scripts before execution

## Contributing

When adding new scripts:
1. Choose appropriate subdirectory (security/shell/node/sql)
2. Add executable permission for shell scripts: `chmod +x script.sh`
3. Document script purpose and usage in this README
4. Add error handling and validation
5. Test thoroughly before committing

## Related Documentation

- [Security Scripts](./security/README.md) - Detailed security documentation
- [Project Documentation](../docs/) - General project docs
- [Testing Guide](../docs/TESTING_CHECKLIST.md) - Testing procedures
