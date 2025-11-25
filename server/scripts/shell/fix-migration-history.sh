#!/bin/bash

# ============================================================================
# Fix Migration History
# ============================================================================
# This script repairs migration history when remote database has migrations
# that don't exist in local directory (usually due to renames or merges)
#
# Usage:
#   ./scripts/shell/fix-migration-history.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔧 Fix Migration History${NC}"
echo "=========================================="
echo ""

# Check if supabase is linked
if ! supabase status > /dev/null 2>&1; then
    echo -e "${RED}❌ Supabase is not running or not linked${NC}"
    echo ""
    echo "Please run:"
    echo "  supabase link --project-ref YOUR_PROJECT_REF"
    echo "  OR"
    echo "  supabase start (for local development)"
    exit 1
fi

echo -e "${BLUE}📋 Checking migration status...${NC}"
echo ""

# Check if we're using remote or local
if supabase projects list > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Remote migrations detected${NC}"
    echo ""
    echo "The following migrations exist in remote but not in local:"
    echo "  - 20250121000000"
    echo "  - 20250122000000"
    echo ""
    echo "These migrations appear to have been renamed/merged."
    echo ""
    read -p "Do you want to mark them as reverted? (y/N): " MARK_REVERTED
    
    if [[ "$MARK_REVERTED" == "y" || "$MARK_REVERTED" == "Y" ]]; then
        echo ""
        echo -e "${BLUE}🔧 Repairing migration history...${NC}"
        
        # Repair migration history - mark as reverted
        supabase migration repair --status reverted 20250121000000 20250122000000
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Migration history repaired successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to repair migration history${NC}"
            echo ""
            echo "You may need to:"
            echo "  1. Link to remote project: supabase link --project-ref YOUR_PROJECT_REF"
            echo "  2. Or pull migrations: supabase db pull"
            exit 1
        fi
    else
        echo ""
        echo -e "${YELLOW}Alternative: Pull migrations from remote${NC}"
        echo "  supabase db pull"
        exit 0
    fi
else
    echo -e "${BLUE}Using local database${NC}"
    echo ""
    echo "For local development, migration history is managed automatically."
    echo "If you see migration errors, try:"
    echo "  supabase db reset"
fi

echo ""
echo "=========================================="
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Verify migration status:"
echo "   supabase migration list"
echo ""
echo "2. Apply new migrations:"
echo "   supabase migration up"
echo ""
echo "3. Or push to remote:"
echo "   supabase db push"
echo ""

