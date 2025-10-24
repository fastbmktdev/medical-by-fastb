# Consolidated Scripts Validation Tests

This directory contains comprehensive validation tests for all consolidated database scripts. These tests ensure that the consolidated scripts work correctly and maintain all functionality from the original scattered scripts.

## Overview

The validation tests cover four main consolidated scripts:

1. **Admin Management Script** (`scripts/admin-management.sql`)
2. **Database Utilities Script** (`scripts/database-utilities.js`)
3. **Development Setup Script** (`scripts/development-setup.sh`)
4. **Storage Configuration Script** (`scripts/storage-configuration.sql`)

## Test Files

### Individual Test Files

- `admin-management.test.js` - Tests admin user promotion, role checking, and batch operations
- `database-utilities.test.js` - Tests database health checks, partner verification, and slug management
- `development-setup.test.js` - Tests environment validation, user creation, and data seeding
- `storage-configuration.test.js` - Tests storage bucket creation, policies, and access control

### Test Runner

- `run-all-tests.js` - Comprehensive test runner that executes all validation tests

## Requirements

### Environment Setup

1. **Supabase Credentials**: Ensure you have valid Supabase credentials in your environment:
   ```bash
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Recommended for testing
   ```

2. **Database Setup**: Your database should have:
   - Proper migrations applied
   - Required tables (profiles, user_roles, gyms, etc.)
   - Storage extension enabled (for storage tests)

3. **Dependencies**: Install required Node.js dependencies:
   ```bash
   npm install
   ```

### System Requirements

- Node.js 18+ with ES modules support
- Bash shell (for development setup script tests)
- curl and jq (for shell script functionality)
- Access to Supabase project with admin privileges

## Running Tests

### Run All Tests

```bash
# Using the test runner
node tests/scripts/run-all-tests.js

# Or using npm script (if configured)
npm run test:scripts
```

### Run Individual Test Suites

```bash
# Admin management tests only
node tests/scripts/run-all-tests.js --admin

# Database utilities tests only
node tests/scripts/run-all-tests.js --database

# Development setup tests only
node tests/scripts/run-all-tests.js --setup

# Storage configuration tests only
node tests/scripts/run-all-tests.js --storage
```

### Run Individual Test Files

```bash
# Run specific test file directly
node tests/scripts/admin-management.test.js
node tests/scripts/database-utilities.test.js
node tests/scripts/development-setup.test.js
node tests/scripts/storage-configuration.test.js
```

### Verbose Output

```bash
# Enable verbose output for debugging
node tests/scripts/run-all-tests.js --verbose
```

## Test Coverage

### Admin Management Tests

- ✅ Admin setup validation
- ✅ User promotion to admin (by email and ID)
- ✅ Batch admin promotion
- ✅ Admin role listing
- ✅ Admin demotion
- ✅ Error handling for invalid inputs
- ✅ Function availability and permissions

### Database Utilities Tests

- ✅ Script existence and permissions
- ✅ Environment detection and configuration
- ✅ Database connectivity validation
- ✅ Health check command execution
- ✅ Partner verification command
- ✅ Gym slug management command
- ✅ Storage verification command
- ✅ Comprehensive "all" command
- ✅ Help system functionality
- ✅ Invalid command handling

### Development Setup Tests

- ✅ Script existence and permissions
- ✅ Help and command-line options
- ✅ Environment detection (local vs production)
- ✅ Dependency checking (curl, jq, etc.)
- ✅ Database connectivity validation
- ✅ User creation functionality
- ✅ Data seeding capabilities
- ✅ Health check components
- ✅ Error handling and validation

### Storage Configuration Tests

- ✅ Script content validation
- ✅ Storage bucket existence and configuration
- ✅ Storage bucket access permissions
- ✅ Storage policies validation
- ✅ Health check function availability
- ✅ Policy recreation function
- ✅ File upload functionality
- ✅ File download functionality
- ✅ Public access configuration

## Test Results Interpretation

### Success Indicators

- ✅ **PASSED**: Test completed successfully
- ℹ️ **INFO**: Informational message
- ⚠️ **WARNING**: Non-critical issue detected

### Failure Indicators

- ❌ **FAILED**: Test failed - requires attention
- ❌ **ERROR**: Critical error occurred

### Common Warning Scenarios

Some warnings are expected in certain environments:

- **Missing optional dependencies**: psql, Supabase CLI
- **Existing test users**: Users already created in previous runs
- **Missing seed files**: Not all projects have seed.sql
- **Storage policies**: May not be queryable directly in all setups

## Troubleshooting

### Common Issues

1. **Missing Credentials**
   ```
   Error: Missing Supabase credentials for testing
   ```
   - Solution: Set SUPABASE_URL and SUPABASE_ANON_KEY in your environment

2. **Database Connection Failed**
   ```
   Error: Cannot connect to Supabase
   ```
   - Solution: Verify your Supabase URL and ensure the project is running

3. **Permission Denied**
   ```
   Error: Permission denied for table/function
   ```
   - Solution: Use SUPABASE_SERVICE_ROLE_KEY for admin operations

4. **Script Not Found**
   ```
   Error: Script not found at path
   ```
   - Solution: Ensure you're running tests from the project root directory

5. **Timeout Errors**
   ```
   Error: Script execution timeout
   ```
   - Solution: Check network connectivity and database performance

### Debug Mode

For detailed debugging, you can:

1. **Enable verbose logging**:
   ```bash
   node tests/scripts/run-all-tests.js --verbose
   ```

2. **Run individual tests**:
   ```bash
   node tests/scripts/admin-management.test.js
   ```

3. **Check environment variables**:
   ```bash
   echo $SUPABASE_URL
   echo $SUPABASE_ANON_KEY
   ```

4. **Test database connectivity manually**:
   ```bash
   node scripts/database-utilities.js check
   ```

## Continuous Integration

### GitHub Actions Example

```yaml
name: Script Validation Tests
on: [push, pull_request]

jobs:
  test-scripts:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: node tests/scripts/run-all-tests.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
```

### Local Pre-commit Hook

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "Running script validation tests..."
node tests/scripts/run-all-tests.js
if [ $? -ne 0 ]; then
  echo "Script validation tests failed. Commit aborted."
  exit 1
fi
```

## Maintenance

### Adding New Tests

1. **For new script functionality**:
   - Add test methods to the appropriate test file
   - Update the test runner if needed
   - Document new test coverage

2. **For new scripts**:
   - Create new test file following existing patterns
   - Add to the comprehensive test runner
   - Update this README

### Updating Tests

When scripts are modified:

1. Review and update corresponding tests
2. Ensure test coverage remains comprehensive
3. Update expected output patterns if needed
4. Test in both local and production-like environments

## Best Practices

### Test Development

- **Idempotent tests**: Tests should be able to run multiple times
- **Cleanup**: Always clean up test data after tests complete
- **Error handling**: Handle both expected and unexpected errors gracefully
- **Timeouts**: Set reasonable timeouts to prevent hanging tests

### Environment Safety

- **Production warnings**: Tests should warn before making changes in production
- **Test isolation**: Use unique identifiers for test data
- **Minimal impact**: Tests should have minimal impact on existing data
- **Rollback capability**: Provide ways to undo test changes if needed

## Contributing

When contributing to script validation tests:

1. Follow existing test patterns and naming conventions
2. Ensure comprehensive error handling
3. Add appropriate logging and status messages
4. Test in multiple environments (local, staging)
5. Update documentation for new test coverage
6. Consider edge cases and error scenarios

## License

These tests are part of the project and follow the same license as the main codebase.