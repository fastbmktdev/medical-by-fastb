#!/bin/bash

# ============================================================================
# Update .env.local from Supabase Keys
# ============================================================================
# This script automatically updates .env.local with Supabase keys
#
# Usage:
#   ./scripts/security/update-env-from-keys.sh --local
#   ./scripts/security/update-env-from-keys.sh --url <url> --anon <key> --service <key>
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

ENV_FILE=".env.local"

# Function to update .env.local
update_env_file() {
    local SUPABASE_URL=$1
    local ANON_KEY=$2
    local SERVICE_ROLE_KEY=$3
    
    # Create backup
    if [ -f "$ENV_FILE" ]; then
        BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
        cp "$ENV_FILE" "$BACKUP_FILE"
        echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"
    fi
    
    # Create .env.local if it doesn't exist
    if [ ! -f "$ENV_FILE" ]; then
        touch "$ENV_FILE"
        echo -e "${BLUE}📝 Created $ENV_FILE${NC}"
    fi
    
    # Remove old Supabase entries
    sed -i.bak '/^NEXT_PUBLIC_SUPABASE_URL=/d' "$ENV_FILE" 2>/dev/null || true
    sed -i.bak '/^NEXT_PUBLIC_SUPABASE_ANON_KEY=/d' "$ENV_FILE" 2>/dev/null || true
    sed -i.bak '/^SUPABASE_URL=/d' "$ENV_FILE" 2>/dev/null || true
    sed -i.bak '/^SUPABASE_ANON_KEY=/d' "$ENV_FILE" 2>/dev/null || true
    sed -i.bak '/^SUPABASE_SERVICE_ROLE_KEY=/d' "$ENV_FILE" 2>/dev/null || true
    rm -f "${ENV_FILE}.bak" 2>/dev/null || true
    
    # Add new entries
    echo "" >> "$ENV_FILE"
    echo "# Supabase Configuration (Updated: $(date +%Y-%m-%d))" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL" >> "$ENV_FILE"
    echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$ANON_KEY" >> "$ENV_FILE"
    echo "SUPABASE_URL=$SUPABASE_URL" >> "$ENV_FILE"
    echo "SUPABASE_ANON_KEY=$ANON_KEY" >> "$ENV_FILE"
    if [ -n "$SERVICE_ROLE_KEY" ]; then
        echo "SUPABASE_SERVICE_ROLE_KEY=$SERVICE_ROLE_KEY" >> "$ENV_FILE"
    fi
    
    echo -e "${GREEN}✅ Updated $ENV_FILE${NC}"
}

# Function to get keys from local Supabase
get_local_keys() {
    if ! command -v supabase &> /dev/null; then
        echo -e "${RED}❌ Supabase CLI is not installed${NC}"
        exit 1
    fi
    
    STATUS=$(supabase status)
    API_URL=$(echo "$STATUS" | grep "API URL:" | awk '{print $3}' | tr -d '\r')
    ANON_KEY=$(echo "$STATUS" | grep -E "(Publishable key|anon key):" | awk '{print $3}' | tr -d '\r')
    SERVICE_ROLE_KEY=$(echo "$STATUS" | grep -E "(Secret key|service_role key):" | awk '{print $3}' | tr -d '\r')
    
    if [ -z "$API_URL" ] || [ -z "$ANON_KEY" ]; then
        echo -e "${RED}❌ Could not get keys from supabase status${NC}"
        exit 1
    fi
    
    update_env_file "$API_URL" "$ANON_KEY" "$SERVICE_ROLE_KEY"
}

# Parse arguments
case "${1}" in
    --local)
        echo -e "${BLUE}📋 Getting keys from local Supabase...${NC}"
        get_local_keys
        ;;
    --url)
        if [ -z "$2" ] || [ -z "$4" ]; then
            echo -e "${RED}❌ Usage: $0 --url <url> --anon <key> [--service <key>]${NC}"
            exit 1
        fi
        SUPABASE_URL="$2"
        ANON_KEY="$4"
        SERVICE_ROLE_KEY="$6"
        echo -e "${BLUE}📋 Updating .env.local with provided keys...${NC}"
        update_env_file "$SUPABASE_URL" "$ANON_KEY" "$SERVICE_ROLE_KEY"
        ;;
    --help|-h)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --local                    Get keys from local Supabase"
        echo "  --url URL --anon KEY       Update with provided keys"
        echo "  --url URL --anon KEY --service KEY  Update with all keys"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        echo "Use --help for usage information"
        exit 1
        ;;
esac

echo ""
echo -e "${YELLOW}⚠️  Restart your development server for changes to take effect${NC}"
echo "  npm run dev"

