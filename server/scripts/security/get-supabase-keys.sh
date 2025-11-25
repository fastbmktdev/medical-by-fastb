#!/bin/bash

# ============================================================================
# Get Supabase Keys from Terminal
# ============================================================================
# This script helps retrieve Supabase keys from terminal instead of dashboard
#
# Usage:
#   Local:    ./scripts/security/get-supabase-keys.sh --local
#   Production: ./scripts/security/get-supabase-keys.sh --project <project-ref>
#   From env: ./scripts/security/get-supabase-keys.sh --env
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to display usage
usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --local           Get keys from local Supabase (supabase status)"
    echo "  --project REF     Get keys from Supabase project (requires Supabase CLI login)"
    echo "  --env             Get keys from current environment variables"
    echo "  --help, -h        Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 --local                    # Local development"
    echo "  $0 --project abcdefghijkl     # Production project"
    echo "  $0 --env                      # From .env.local"
}

# Function to get keys from local Supabase
get_local_keys() {
    echo -e "${BLUE}📋 Getting Supabase keys from local instance...${NC}"
    echo ""
    
    # Check if Supabase CLI is installed
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        echo ""
        echo "Install it with:"
        echo "  npm install -g supabase"
        echo "  OR"
        echo "  brew install supabase/tap/supabase"
        exit 1
    fi
    
    # Check if Supabase is running
    if ! supabase status &> /dev/null; then
        echo -e "${RED}❌ Supabase is not running locally${NC}"
        echo ""
        echo "Start it with:"
        echo "  supabase start"
        exit 1
    fi
    
    # Get status
    STATUS=$(supabase status)
    
    # Extract values (Supabase CLI format)
    API_URL=$(echo "$STATUS" | grep "API URL:" | awk '{print $3}' | tr -d '\r')
    ANON_KEY=$(echo "$STATUS" | grep -E "(Publishable key|anon key):" | awk '{print $3}' | tr -d '\r')
    SERVICE_ROLE_KEY=$(echo "$STATUS" | grep -E "(Secret key|service_role key):" | awk '{print $3}' | tr -d '\r')
    
    if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ]; then
        echo -e "${RED}❌ Could not extract keys from supabase status${NC}"
        echo ""
        echo "Try running: supabase status"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found keys:${NC}"
    echo ""
    echo "# Supabase Configuration (Local Development)"
    echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_URL=$API_URL"
    echo "SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
    echo ""
    
    # Copy to clipboard if available
    if command -v pbcopy &> /dev/null; then
        {
            echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL"
            echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
            echo "SUPABASE_URL=$API_URL"
            echo "SUPABASE_ANON_KEY=$ANON_KEY"
            echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
        } | pbcopy
        echo -e "${GREEN}✅ Copied to clipboard!${NC}"
    fi
}

# Function to get keys from environment variables
get_env_keys() {
    echo -e "${BLUE}📋 Getting Supabase keys from environment variables...${NC}"
    echo ""
    
    # Load .env.local if it exists
    if [ -f ".env.local" ]; then
        echo -e "${YELLOW}Loading from .env.local...${NC}"
        export $(grep -v '^#' .env.local | xargs)
    fi
    
    # Get values from environment
    SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-${SUPABASE_URL}}"
    ANON_KEY="${NEXT_PUBLIC_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY}}"
    SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
    
    if [ -z "$SUPABASE_URL" ] || [ -z "$ANON_KEY" ]; then
        echo -e "${RED}❌ Supabase keys not found in environment variables${NC}"
        echo ""
        echo "Make sure you have set:"
        echo "  - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL"
        echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY"
        echo ""
        echo "Check your .env.local file or environment variables."
        exit 1
    fi
    
    echo -e "${GREEN}✅ Found keys in environment:${NC}"
    echo ""
    echo "# Supabase Configuration (from Environment)"
    echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY"
    echo "SUPABASE_URL=$SUPABASE_URL"
    echo "SUPABASE_ANON_KEY=$ANON_KEY"
    if [ -n "$SERVICE_ROLE_KEY" ]; then
        echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY"
    else
        echo "# SUPABASE_SERVICE_ROLE_KEY=<not set>"
    fi
    echo ""
}

# Function to get keys from Supabase project (production)
get_project_keys() {
    local PROJECT_REF=$1
    
    if [ -z "$PROJECT_REF" ]; then
        echo -e "${RED}❌ Project reference is required${NC}"
        echo ""
        echo "Usage: $0 --project <project-ref>"
        echo ""
        echo "Find your project ref in Supabase Dashboard:"
        echo "  https://app.supabase.com → Your Project → Settings → General"
        exit 1
    fi
    
    echo -e "${BLUE}📋 Getting Supabase keys from project: $PROJECT_REF${NC}"
    echo ""
    
    # Check if Supabase CLI is installed and logged in
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        exit 1
    fi
    
    # Check if logged in
    if ! supabase projects list &> /dev/null; then
        echo -e "${YELLOW}⚠️  Not logged in to Supabase CLI${NC}"
        echo ""
        echo "Login with:"
        echo "  supabase login"
        exit 1
    fi
    
    # Get project info
    echo -e "${YELLOW}Fetching project information...${NC}"
    
    # Use Supabase CLI to get project info
    # Note: This requires Supabase CLI v1.8.0+ with projects API
    PROJECT_INFO=$(supabase projects list --format json 2>/dev/null | jq -r ".[] | select(.ref == \"$PROJECT_REF\")" 2>/dev/null || echo "")
    
    if [ -z "$PROJECT_INFO" ]; then
        echo -e "${RED}❌ Project not found or access denied${NC}"
        echo ""
        echo "Make sure:"
        echo "  1. You're logged in: supabase login"
        echo "  2. You have access to the project"
        echo "  3. The project ref is correct"
        echo ""
        echo "List your projects:"
        echo "  supabase projects list"
        exit 1
    fi
    
    # Get API URL
    API_URL=$(echo "$PROJECT_INFO" | jq -r '.api_url' 2>/dev/null || echo "")
    
    if [ -z "$API_URL" ]; then
        echo -e "${YELLOW}⚠️  Could not get API URL from CLI${NC}"
        echo ""
        echo "For production keys, you need to:"
        echo "  1. Go to https://app.supabase.com"
        echo "  2. Select your project"
        echo "  3. Go to Settings → API"
        echo "  4. Copy the keys manually"
        echo ""
        echo "Or use --env option if keys are already in your environment."
        exit 1
    fi
    
    echo -e "${YELLOW}⚠️  Note: Supabase CLI cannot retrieve API keys for security reasons.${NC}"
    echo ""
    echo "To get production keys:"
    echo "  1. Go to https://app.supabase.com"
    echo "  2. Select project: $PROJECT_REF"
    echo "  3. Navigate to Settings → API"
    echo "  4. Copy the keys"
    echo ""
    echo "API URL: $API_URL"
    echo ""
    echo "Use --env option if keys are already in your environment."
}

# Main script
case "${1}" in
    --local)
        get_local_keys
        ;;
    --env)
        get_env_keys
        ;;
    --project)
        get_project_keys "$2"
        ;;
    --help|-h)
        usage
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        echo ""
        usage
        exit 1
        ;;
esac

