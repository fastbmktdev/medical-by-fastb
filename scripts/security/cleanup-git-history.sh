#!/bin/bash

# ============================================================================
# Git History Cleanup Script for Secrets
# ============================================================================
# This script removes hardcoded secrets from git history using git-filter-repo
# 
# WARNING: This will rewrite git history. All team members must re-clone the
# repository after this script runs.
#
# Prerequisites:
#   pip install git-filter-repo
#   OR
#   brew install git-filter-repo
#
# Usage:
#   ./scripts/security/cleanup-git-history.sh
# ============================================================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${RED}⚠️  WARNING: This script will rewrite git history!${NC}"
echo -e "${YELLOW}All team members must re-clone the repository after this completes.${NC}"
echo ""
read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Operation cancelled."
    exit 1
fi

# Check if git-filter-repo is installed
if ! command -v git-filter-repo &> /dev/null; then
    echo -e "${RED}❌ git-filter-repo is not installed${NC}"
    echo ""
    echo "Install it with:"
    echo "  pip install git-filter-repo"
    echo "  OR"
    echo "  brew install git-filter-repo"
    exit 1
fi

# Create backup branch before cleanup
BACKUP_BRANCH="backup-before-secret-cleanup-$(date +%Y%m%d-%H%M%S)"
echo -e "${BLUE}📦 Creating backup branch: ${BACKUP_BRANCH}${NC}"
git branch "$BACKUP_BRANCH"
echo -e "${GREEN}✅ Backup created${NC}"
echo ""

# List of secrets to remove (exact strings)
SECRETS=(
    "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
)

# List of files that contained secrets
FILES_TO_CLEAN=(
    "scripts/shell/development-setup.sh"
    "src/lib/database/supabase/server.ts"
)

echo -e "${BLUE}🔍 Starting git history cleanup...${NC}"
echo ""

# Remove secrets from git history
for secret in "${SECRETS[@]}"; do
    echo -e "${YELLOW}Removing secret pattern from history...${NC}"
    # Use git-filter-repo to remove the secret
    git-filter-repo --force \
        --replace-text <(echo "$secret==>REMOVED_SECRET") \
        --path-glob '*.sh' \
        --path-glob '*.ts' \
        --path-glob '*.tsx' \
        --path-glob '*.js' \
        --path-glob '*.jsx'
done

echo ""
echo -e "${GREEN}✅ Git history cleanup completed!${NC}"
echo ""
echo -e "${YELLOW}📋 Next Steps:${NC}"
echo "1. Review the changes: git log --oneline"
echo "2. Force push to remote: git push --force-with-lease origin master"
echo "3. Notify all team members to re-clone the repository"
echo "4. Delete backup branch after verification: git branch -D $BACKUP_BRANCH"
echo ""
echo -e "${RED}⚠️  IMPORTANT:${NC}"
echo "- All team members MUST re-clone the repository"
echo "- Update all environment variables in production"
echo "- Rotate all exposed secrets immediately"
echo ""

