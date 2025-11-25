#!/bin/bash

# ============================================
# User Creation Script Runner
# ============================================
# This script provides easy commands to create users
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if .env file exists
if [ ! -f .env ]; then
    print_error ".env file not found. Please create one with your Supabase credentials."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    print_error "Missing required environment variables:"
    print_error "  - NEXT_PUBLIC_SUPABASE_URL"
    print_error "  - SUPABASE_SERVICE_ROLE_KEY"
    exit 1
fi

# Function to create test users
create_test_users() {
    print_header "Creating Test Users"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed or not in PATH"
        exit 1
    fi

    # Check if package.json exists
    if [ ! -f package.json ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi

    # Install dependencies if node_modules doesn't exist
    if [ ! -d "node_modules" ]; then
        print_status "Installing dependencies..."
        npm install
    fi

    # Run the create user script
    print_status "Running user creation script..."
    node scripts/node/create-user.js --test-users
}

# Function to create a single user
create_single_user() {
    local email="$1"
    local password="$2"
    local full_name="$3"
    local username="$4"
    local phone="$5"
    local role="$6"

    print_header "Creating Single User"
    
    if [ -z "$email" ] || [ -z "$password" ]; then
        print_error "Email and password are required"
        echo "Usage: $0 single <email> <password> [full_name] [username] [phone] [role]"
        exit 1
    fi

    # Set defaults
    full_name=${full_name:-""}
    username=${username:-""}
    phone=${phone:-""}
    role=${role:-"authenticated"}

    print_status "Creating user: $email"
    node scripts/node/create-user.js --email "$email" --password "$password" --full-name "$full_name" --username "$username" --phone "$phone" --role "$role"
}

# Function to list all users
list_users() {
    print_header "Listing All Users"
    node scripts/node/create-user.js --list-users
}

# Function to check if user exists
check_user() {
    local email="$1"
    
    if [ -z "$email" ]; then
        print_error "Email is required"
        echo "Usage: $0 check <email>"
        exit 1
    fi

    print_header "Checking User"
    node scripts/node/create-user.js --check "$email"
}

# Function to get user details
get_user_details() {
    local email="$1"
    
    if [ -z "$email" ]; then
        print_error "Email is required"
        echo "Usage: $0 details <email>"
        exit 1
    fi

    print_header "Getting User Details"
    node scripts/node/create-user.js --details "$email"
}

# Function to run SQL script
run_sql_script() {
    print_header "Running SQL Script"
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        print_error "psql is not installed or not in PATH"
        print_error "Please install PostgreSQL client tools"
        exit 1
    fi

    # Check if DATABASE_URL is set
    if [ -z "$DATABASE_URL" ]; then
        print_error "DATABASE_URL environment variable is not set"
        print_error "Please set it in your .env file"
        exit 1
    fi

    print_status "Running SQL script to create user functions..."
    psql "$DATABASE_URL" -f scripts/sql/create-user.sql
}

# Function to show help
show_help() {
    print_header "User Creation Script Runner"
    echo ""
    echo "Usage: $0 <command> [options]"
    echo ""
    echo "Commands:"
    echo "  test-users                    Create test users for development"
    echo "  single <email> <password>     Create a single user"
    echo "  list                          List all users"
    echo "  check <email>                 Check if user exists"
    echo "  details <email>               Get user details"
    echo "  sql                           Run SQL script to create functions"
    echo "  help                          Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 test-users"
    echo "  $0 single user@example.com password123"
    echo "  $0 single user@example.com password123 \"John Doe\" johndoe +66812345678 admin"
    echo "  $0 list"
    echo "  $0 check user@example.com"
    echo "  $0 details user@example.com"
    echo "  $0 sql"
    echo ""
}

# Main script logic
case "$1" in
    "test-users")
        create_test_users
        ;;
    "single")
        create_single_user "$2" "$3" "$4" "$5" "$6" "$7"
        ;;
    "list")
        list_users
        ;;
    "check")
        check_user "$2"
        ;;
    "details")
        get_user_details "$2"
        ;;
    "sql")
        run_sql_script
        ;;
    "help"|"-h"|"--help")
        show_help
        ;;
    "")
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        show_help
        exit 1
        ;;
esac
