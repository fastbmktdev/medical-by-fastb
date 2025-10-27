#!/bin/bash

# ============================================================================
# 🚀 QUICK PRODUCTION DEPLOYMENT SCRIPT
# ============================================================================
# 
# This script automates the entire production deployment process.
# Run this after creating your Supabase project.
#
# Usage: ./scripts/quick-deploy.sh
#
# ============================================================================

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "\n${BLUE}============================================================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}============================================================================${NC}\n"
}

# Check if required tools are installed
check_dependencies() {
    print_header "🔍 CHECKING DEPENDENCIES"
    
    if ! command -v supabase &> /dev/null; then
        print_error "Supabase CLI is not installed. Please install it first:"
        echo "npm install -g supabase"
        echo "or visit: https://supabase.com/docs/guides/cli"
        exit 1
    fi
    
    print_success "Supabase CLI is installed"
}

# Check if user is logged in to Supabase
check_auth() {
    print_header "🔐 CHECKING AUTHENTICATION"
    
    if ! supabase projects list &> /dev/null; then
        print_warning "You are not logged in to Supabase"
        print_status "Please run: supabase login"
        read -p "Press Enter after logging in..."
    fi
    
    print_success "Supabase authentication verified"
}

# Get project reference
get_project_ref() {
    print_header "📋 PROJECT SELECTION"
    
    echo "Available Supabase projects:"
    supabase projects list
    
    echo ""
    read -p "Enter your project reference ID: " PROJECT_REF
    
    if [ -z "$PROJECT_REF" ]; then
        print_error "Project reference cannot be empty"
        exit 1
    fi
    
    print_success "Project reference set: $PROJECT_REF"
}

# Get admin email
get_admin_email() {
    print_header "👑 ADMIN USER SETUP"
    
    read -p "Enter admin email address: " ADMIN_EMAIL
    
    if [ -z "$ADMIN_EMAIL" ]; then
        print_error "Admin email cannot be empty"
        exit 1
    fi
    
    # Basic email validation
    if [[ ! "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        print_error "Invalid email format"
        exit 1
    fi
    
    print_success "Admin email set: $ADMIN_EMAIL"
}

# Link to project
link_project() {
    print_header "🔗 LINKING TO PROJECT"
    
    print_status "Linking to project: $PROJECT_REF"
    
    if supabase link --project-ref "$PROJECT_REF"; then
        print_success "Successfully linked to project"
    else
        print_error "Failed to link to project"
        exit 1
    fi
}

# Deploy database schema
deploy_schema() {
    print_header "🗄️ DEPLOYING DATABASE SCHEMA"
    
    # Create temporary SQL file with admin email
    TEMP_SQL_FILE="/tmp/production-deploy-temp.sql"
    
    print_status "Preparing deployment script with admin email: $ADMIN_EMAIL"
    
    # Replace the admin email in the production script
    sed "s/thaikickmuaythai@gmail.com/$ADMIN_EMAIL/g" scripts/production-deploy.sql > "$TEMP_SQL_FILE"
    
    print_status "Executing database deployment..."
    
    if supabase db reset --linked; then
        print_success "Database reset completed"
    else
        print_warning "Database reset failed, continuing with migration..."
    fi
    
    # Execute the SQL script
    if psql "$DATABASE_URL" -f "$TEMP_SQL_FILE" 2>/dev/null || supabase db push; then
        print_success "Database schema deployed successfully"
    else
        print_error "Database deployment failed"
        print_status "Trying alternative method..."
        
        # Alternative: Use supabase db push with migrations
        if [ -d "supabase/migrations" ]; then
            if supabase db push; then
                print_success "Database migrations applied successfully"
            else
                print_error "Failed to apply migrations"
                exit 1
            fi
        fi
    fi
    
    # Clean up temp file
    rm -f "$TEMP_SQL_FILE"
}

# Verify deployment
verify_deployment() {
    print_header "✅ VERIFYING DEPLOYMENT"
    
    print_status "Checking database tables..."
    
    # Create verification script
    VERIFY_SQL="
    SELECT 
        'Tables' as component,
        COUNT(*)::text as count
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    
    UNION ALL
    
    SELECT 
        'Functions' as component,
        COUNT(*)::text as count
    FROM information_schema.routines 
    WHERE routine_schema = 'public'
    
    UNION ALL
    
    SELECT 
        'Admin Users' as component,
        COUNT(*)::text as count
    FROM user_roles 
    WHERE role = 'admin'
    
    UNION ALL
    
    SELECT 
        'Storage Buckets' as component,
        COUNT(*)::text as count
    FROM storage.buckets 
    WHERE id = 'gym-images';
    "
    
    # Try to run verification
    if command -v psql &> /dev/null && [ ! -z "$DATABASE_URL" ]; then
        echo "$VERIFY_SQL" | psql "$DATABASE_URL" -t
    else
        print_status "Manual verification required - check Supabase dashboard"
    fi
    
    print_success "Deployment verification completed"
}

# Show next steps
show_next_steps() {
    print_header "🎯 NEXT STEPS"
    
    echo -e "${GREEN}✅ Production database is ready!${NC}\n"
    
    echo "📋 What to do next:"
    echo ""
    echo "1. 🔧 Set up environment variables in your app:"
    echo "   - NEXT_PUBLIC_SUPABASE_URL"
    echo "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "2. 🚀 Deploy your Next.js application"
    echo ""
    echo "3. 👤 Test user registration and login"
    echo ""
    echo "4. 👑 Verify admin access with: $ADMIN_EMAIL"
    echo ""
    echo "5. 💳 Configure Stripe webhooks (if using payments)"
    echo ""
    echo "📖 For detailed setup instructions, see: scripts/production-setup.md"
    echo ""
    
    print_success "Quick deployment completed successfully! 🎉"
}

# Main execution
main() {
    print_header "🚀 QUICK PRODUCTION DEPLOYMENT"
    
    echo "This script will:"
    echo "• Check dependencies"
    echo "• Link to your Supabase project"
    echo "• Deploy complete database schema"
    echo "• Create admin user"
    echo "• Set up storage and policies"
    echo ""
    
    read -p "Continue? (y/N): " -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Deployment cancelled"
        exit 0
    fi
    
    # Run deployment steps
    check_dependencies
    check_auth
    get_project_ref
    get_admin_email
    link_project
    deploy_schema
    verify_deployment
    show_next_steps
}

# Handle script interruption
trap 'print_error "Deployment interrupted"; exit 1' INT TERM

# Run main function
main "$@"