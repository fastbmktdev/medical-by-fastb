#!/bin/bash

# ============================================================================
# CONSOLIDATED DEVELOPMENT SETUP SCRIPT
# ============================================================================
# This script consolidates development environment setup including:
# - Environment validation and detection
# - Test user creation via Supabase Admin API
# - Sample data seeding from seed.sql
# - Development environment health checks
# - Database migration status verification
#
# Usage:
#   Local:      ./development-setup.sh
#   Production: SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> ./development-setup.sh
#   Options:    ./development-setup.sh --users-only    (create users only)
#               ./development-setup.sh --seed-only     (seed data only)
#               ./development-setup.sh --check-only    (environment check only)
# ============================================================================

set -e  # Exit on any error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Parse command line arguments
USERS_ONLY=false
SEED_ONLY=false
CHECK_ONLY=false

for arg in "$@"; do
    case $arg in
        --users-only)
            USERS_ONLY=true
            shift
            ;;
        --seed-only)
            SEED_ONLY=true
            shift
            ;;
        --check-only)
            CHECK_ONLY=true
            shift
            ;;
        --help|-h)
            echo "Development Setup Script"
            echo ""
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --users-only    Create test users only"
            echo "  --seed-only     Seed sample data only"
            echo "  --check-only    Run environment checks only"
            echo "  --help, -h      Show this help message"
            echo ""
            echo "Environment Variables:"
            echo "  SUPABASE_URL              Supabase project URL"
            echo "  SUPABASE_ANON_KEY         Supabase anonymous key"
            echo "  SUPABASE_SERVICE_ROLE_KEY Supabase service role key"
            exit 0
            ;;
        *)
            log_error "Unknown option: $arg"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# ============================================================================
# ENVIRONMENT DETECTION AND VALIDATION
# ============================================================================

# Read from environment variables or use local defaults
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-REMOVED_SECRET}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-REMOVED_SECRET}"

# Detect environment
if [[ "$SUPABASE_URL" == *"127.0.0.1"* ]] || [[ "$SUPABASE_URL" == *"localhost"* ]]; then
    ENVIRONMENT="LOCAL"
else
    ENVIRONMENT="PRODUCTION"
fi

# Function to check if required tools are installed
check_dependencies() {
    log_info "Checking required dependencies..."
    
    local missing_deps=()
    
    # Check for curl
    if ! command -v curl &> /dev/null; then
        missing_deps+=("curl")
    fi
    
    # Check for jq
    if ! command -v jq &> /dev/null; then
        missing_deps+=("jq")
    fi
    
    # Check for psql (optional but recommended)
    if ! command -v psql &> /dev/null; then
        log_warning "psql not found - database operations will use API only"
    fi
    
    # Check for supabase CLI (optional but recommended for local dev)
    if [[ "$ENVIRONMENT" == "LOCAL" ]] && ! command -v supabase &> /dev/null; then
        log_warning "Supabase CLI not found - some operations may be limited"
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing required dependencies: ${missing_deps[*]}"
        log_error "Please install missing dependencies and try again"
        exit 1
    fi
    
    log_success "All required dependencies are installed"
}

# Function to validate environment configuration
validate_environment() {
    log_info "Validating environment configuration..."
    
    # Check if .env files exist for local development
    if [[ "$ENVIRONMENT" == "LOCAL" ]]; then
        if [[ ! -f ".env" ]] && [[ ! -f ".env.local" ]]; then
            log_warning "No .env or .env.local file found"
            log_info "Consider creating one for consistent local development"
        fi
        
        # Check if Supabase is running locally
        if ! curl -s "$SUPABASE_URL/health" &> /dev/null; then
            log_error "Cannot connect to Supabase at $SUPABASE_URL"
            log_error "Make sure Supabase is running locally with: supabase start"
            exit 1
        fi
    fi
    
    # Validate API keys format
    if [[ ! "$ANON_KEY" =~ ^sb_publishable_ ]] && [[ ! "$ANON_KEY" =~ ^eyJ ]]; then
        log_error "Invalid SUPABASE_ANON_KEY format"
        exit 1
    fi
    
    if [[ ! "$SERVICE_ROLE_KEY" =~ ^sb_secret_ ]] && [[ ! "$SERVICE_ROLE_KEY" =~ ^eyJ ]]; then
        log_error "Invalid SUPABASE_SERVICE_ROLE_KEY format"
        exit 1
    fi
    
    log_success "Environment configuration is valid"
}

# Function to check database connectivity and migration status
check_database_status() {
    log_info "Checking database connectivity and migration status..."
    
    # Test basic connectivity
    local health_check
    health_check=$(curl -s -w "%{http_code}" -o /dev/null "$SUPABASE_URL/rest/v1/" \
        -H "apikey: $ANON_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY")
    
    if [[ "$health_check" != "200" ]]; then
        log_error "Database connectivity check failed (HTTP $health_check)"
        exit 1
    fi
    
    # Check if core tables exist
    local tables_check
    tables_check=$(curl -s "$SUPABASE_URL/rest/v1/gyms?select=count" \
        -H "apikey: $ANON_KEY" \
        -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
        -H "Range: 0-0")
    
    if [[ "$tables_check" == *"error"* ]]; then
        log_error "Core database tables not found. Please run migrations first:"
        log_error "  supabase db reset  # For local development"
        log_error "  supabase db push   # For production"
        exit 1
    fi
    
    log_success "Database is accessible and properly migrated"
}

# Function to display environment information
display_environment_info() {
    echo ""
    echo "================================================"
    echo "DEVELOPMENT ENVIRONMENT SETUP"
    echo "================================================"
    echo "Environment: $ENVIRONMENT"
    echo "Supabase URL: $SUPABASE_URL"
    echo "Script Directory: $(dirname "$0")"
    echo "Working Directory: $(pwd)"
    echo "================================================"
    echo ""
}

# ============================================================================
# TEST USER CREATION
# ============================================================================

create_test_users() {
    log_info "Creating test users..."
    
    # Confirmation prompt for production
    if [ "$ENVIRONMENT" = "PRODUCTION" ]; then
        echo ""
        log_warning "You are about to create test users in PRODUCTION!"
        echo ""
        read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
        if [ "$confirmation" != "yes" ]; then
            log_info "Operation cancelled."
            return 0
        fi
        echo ""
    fi
    
    local users_created=0
    local users_failed=0
    
    # Define test users
    declare -A test_users=(
        ["admin@muaythai.com"]='{"password":"password123","phone":"+66812345678","username":"admin","full_name":"Admin User"}'
        ["user@muaythai.com"]='{"password":"password123","phone":"+66823456789","username":"regular_user","full_name":"ผู้ใช้ทั่วไป"}'
        ["partner@muaythai.com"]='{"password":"password123","phone":"+66834567890","username":"somchai_gym","full_name":"สมชาย มวยไทย"}'
        ["partner2@muaythai.com"]='{"password":"password123","phone":"+66845678901","username":"somying_fitness","full_name":"สมหญิง ฟิตเนส"}'
    )
    
    for email in "${!test_users[@]}"; do
        local user_data="${test_users[$email]}"
        local password=$(echo "$user_data" | jq -r '.password')
        local phone=$(echo "$user_data" | jq -r '.phone')
        local username=$(echo "$user_data" | jq -r '.username')
        local full_name=$(echo "$user_data" | jq -r '.full_name')
        
        log_info "Creating user: $email ($full_name)"
        
        local response
        response=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
            -H "apikey: ${ANON_KEY}" \
            -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
            -H "Content-Type: application/json" \
            -d "{
                \"email\": \"$email\",
                \"password\": \"$password\",
                \"email_confirm\": true,
                \"phone\": \"$phone\",
                \"phone_confirm\": true,
                \"user_metadata\": {
                    \"username\": \"$username\",
                    \"full_name\": \"$full_name\"
                }
            }")
        
        local user_id
        user_id=$(echo "$response" | jq -r '.id // empty')
        
        if [[ -n "$user_id" && "$user_id" != "null" ]]; then
            log_success "Created user: $email (ID: $user_id)"
            ((users_created++))
        else
            local error_msg
            error_msg=$(echo "$response" | jq -r '.message // .error_description // "Unknown error"')
            if [[ "$error_msg" == *"already registered"* ]]; then
                log_warning "User already exists: $email"
            else
                log_error "Failed to create user $email: $error_msg"
                ((users_failed++))
            fi
        fi
    done
    
    echo ""
    log_success "User creation completed: $users_created created, $users_failed failed"
    
    if [ $users_created -gt 0 ]; then
        echo ""
        echo "Test User Credentials:"
        echo "  Admin:    admin@muaythai.com / password123"
        echo "  User:     user@muaythai.com / password123"
        echo "  Partner1: partner@muaythai.com / password123"
        echo "  Partner2: partner2@muaythai.com / password123"
        echo ""
        log_info "Next steps:"
        echo "  1. Set admin role: Use scripts/sql/admin-management.sql"
        echo "  2. Seed sample data: Run with --seed-only flag"
    fi
}

# ============================================================================
# SAMPLE DATA SEEDING
# ============================================================================

seed_sample_data() {
    log_info "Seeding sample data..."
    
    # Check if seed.sql exists
    if [[ ! -f "supabase/seed.sql" ]]; then
        log_error "seed.sql file not found at supabase/seed.sql"
        return 1
    fi
    
    # For local development, use supabase CLI if available
    if [[ "$ENVIRONMENT" == "LOCAL" ]] && command -v supabase &> /dev/null; then
        log_info "Using Supabase CLI to seed data..."
        if supabase db seed; then
            log_success "Sample data seeded successfully using Supabase CLI"
        else
            log_error "Failed to seed data using Supabase CLI"
            return 1
        fi
    else
        # Fallback: use psql if available
        if command -v psql &> /dev/null; then
            log_info "Using psql to seed data..."
            
            # Extract connection details from Supabase URL
            local db_url
            if [[ "$ENVIRONMENT" == "LOCAL" ]]; then
                db_url="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
            else
                log_warning "Direct database seeding not supported for production"
                log_info "Please run the seed.sql file manually in your database"
                return 0
            fi
            
            if psql "$db_url" -f "supabase/seed.sql"; then
                log_success "Sample data seeded successfully using psql"
            else
                log_error "Failed to seed data using psql"
                return 1
            fi
        else
            log_warning "Neither Supabase CLI nor psql available for seeding"
            log_info "Please run supabase/seed.sql manually in your database"
        fi
    fi
}

# ============================================================================
# DEVELOPMENT ENVIRONMENT HEALTH CHECK
# ============================================================================

run_health_check() {
    log_info "Running development environment health check..."
    
    local issues=0
    
    # Check Node.js and npm
    if command -v node &> /dev/null; then
        local node_version
        node_version=$(node --version)
        log_success "Node.js: $node_version"
    else
        log_error "Node.js not found"
        ((issues++))
    fi
    
    if command -v npm &> /dev/null; then
        local npm_version
        npm_version=$(npm --version)
        log_success "npm: $npm_version"
    else
        log_error "npm not found"
        ((issues++))
    fi
    
    # Check if node_modules exists
    if [[ -d "node_modules" ]]; then
        log_success "node_modules directory exists"
    else
        log_warning "node_modules not found - run 'npm install'"
        ((issues++))
    fi
    
    # Check package.json scripts
    if [[ -f "package.json" ]]; then
        log_success "package.json found"
        
        # Check for important scripts
        local scripts=("dev" "build" "db:start" "db:reset")
        for script in "${scripts[@]}"; do
            if jq -e ".scripts.\"$script\"" package.json > /dev/null 2>&1; then
                log_success "Script available: npm run $script"
            else
                log_warning "Script missing: $script"
            fi
        done
    else
        log_error "package.json not found"
        ((issues++))
    fi
    
    # Check TypeScript configuration
    if [[ -f "tsconfig.json" ]]; then
        log_success "TypeScript configuration found"
    else
        log_warning "tsconfig.json not found"
    fi
    
    # Check Next.js configuration
    if [[ -f "next.config.ts" ]] || [[ -f "next.config.js" ]]; then
        log_success "Next.js configuration found"
    else
        log_warning "Next.js configuration not found"
    fi
    
    # Check Tailwind configuration
    if [[ -f "tailwind.config.ts" ]] || [[ -f "tailwind.config.js" ]]; then
        log_success "Tailwind CSS configuration found"
    else
        log_warning "Tailwind CSS configuration not found"
    fi
    
    echo ""
    if [ $issues -eq 0 ]; then
        log_success "Development environment health check passed!"
    else
        log_warning "Development environment has $issues issues that should be addressed"
    fi
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

main() {
    display_environment_info
    
    # Always run dependency and environment checks unless it's seed-only
    if [[ "$SEED_ONLY" != true ]]; then
        check_dependencies
        validate_environment
        check_database_status
    fi
    
    # Run health check if requested
    if [[ "$CHECK_ONLY" == true ]]; then
        run_health_check
        exit 0
    fi
    
    # Create users if requested or if full setup
    if [[ "$USERS_ONLY" == true ]] || [[ "$SEED_ONLY" != true ]]; then
        create_test_users
    fi
    
    # Seed data if requested or if full setup
    if [[ "$SEED_ONLY" == true ]] || [[ "$USERS_ONLY" != true ]]; then
        seed_sample_data
    fi
    
    # Run health check for full setup
    if [[ "$USERS_ONLY" != true ]] && [[ "$SEED_ONLY" != true ]]; then
        echo ""
        run_health_check
    fi
    
    echo ""
    log_success "Development setup completed successfully!"
    echo ""
    log_info "Next steps:"
    echo "  1. Start the development server: npm run dev"
    echo "  2. Set admin roles: Use scripts/sql/admin-management.sql"
    echo "  3. Check database utilities: npm run db:check"
    echo ""
}

# Run main function
main "$@"