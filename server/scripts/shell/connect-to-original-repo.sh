#!/bin/bash

# ============================================================================
# Connect to Original Repository
# ============================================================================
# This script helps reconnect to the original remote repository
#
# Usage:
#   ./scripts/shell/connect-to-original-repo.sh <repository-url>
#   OR
#   ./scripts/shell/connect-to-original-repo.sh
#   (Will prompt for URL)
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}🔗 Connect to Original Repository${NC}"
echo "=========================================="
echo ""

# Check if URL provided as argument
if [ -n "$1" ]; then
    REPO_URL="$1"
else
    echo -e "${YELLOW}Please provide the original repository URL${NC}"
    echo ""
    echo "Examples:"
    echo "  https://github.com/username/repo-name.git"
    echo "  git@github.com:username/repo-name.git"
    echo "  https://gitlab.com/username/repo-name.git"
    echo ""
    read -p "Repository URL: " REPO_URL
    
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ Repository URL is required${NC}"
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📋 Checking current git status...${NC}"

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo -e "${RED}❌ Not a git repository${NC}"
    exit 1
fi

# Check current remotes
echo ""
echo -e "${BLUE}Current remotes:${NC}"
CURRENT_REMOTES=$(git remote -v)
if [ -z "$CURRENT_REMOTES" ]; then
    echo -e "${YELLOW}  No remotes configured${NC}"
else
    echo "$CURRENT_REMOTES"
fi

# Check if origin already exists
if git remote get-url origin > /dev/null 2>&1; then
    CURRENT_ORIGIN=$(git remote get-url origin)
    echo ""
    echo -e "${YELLOW}⚠️  Origin already exists: $CURRENT_ORIGIN${NC}"
    read -p "Do you want to update it? (y/N): " UPDATE_ORIGIN
    
    if [[ "$UPDATE_ORIGIN" != "y" && "$UPDATE_ORIGIN" != "Y" ]]; then
        echo -e "${YELLOW}Cancelled${NC}"
        exit 0
    fi
    
    echo ""
    echo -e "${BLUE}Updating origin remote...${NC}"
    git remote set-url origin "$REPO_URL"
else
    echo ""
    echo -e "${BLUE}Adding origin remote...${NC}"
    git remote add origin "$REPO_URL"
fi

# Verify connection
echo ""
echo -e "${BLUE}Verifying connection...${NC}"
if git ls-remote --heads origin > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Successfully connected to repository!${NC}"
    echo ""
    echo -e "${BLUE}Remote branches available:${NC}"
    git ls-remote --heads origin | sed 's/.*refs\/heads\///' | head -10
else
    echo -e "${RED}❌ Failed to connect to repository${NC}"
    echo ""
    echo "Possible issues:"
    echo "  - Repository URL is incorrect"
    echo "  - No network access"
    echo "  - Authentication required (SSH key or credentials)"
    echo ""
    echo "For SSH repositories, make sure you have:"
    echo "  - SSH key set up"
    echo "  - Access to the repository"
    exit 1
fi

# Show current branch status
echo ""
echo -e "${BLUE}Current branch status:${NC}"
CURRENT_BRANCH=$(git branch --show-current)
echo "  Current branch: $CURRENT_BRANCH"

# Check if local branch tracks remote
if git branch -vv | grep -q "^\*.*\[origin/"; then
    echo -e "${GREEN}  ✅ Branch is tracking remote${NC}"
else
    echo -e "${YELLOW}  ⚠️  Branch is not tracking remote${NC}"
    echo ""
    echo "To set up tracking:"
    echo "  git branch --set-upstream-to=origin/$CURRENT_BRANCH $CURRENT_BRANCH"
fi

# Show next steps
echo ""
echo "=========================================="
echo -e "${CYAN}Next Steps:${NC}"
echo ""
echo "1. Fetch from remote:"
echo "   ${GREEN}git fetch origin${NC}"
echo ""
echo "2. Check remote branches:"
echo "   ${GREEN}git branch -r${NC}"
echo ""
echo "3. If you want to merge with remote:"
echo "   ${GREEN}git pull origin master${NC}"
echo "   (or your branch name)"
echo ""
echo "4. To push your local changes:"
echo "   ${GREEN}git push -u origin $CURRENT_BRANCH${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: Be careful with force push!${NC}"
echo "   Only use 'git push --force' if you're sure about overwriting remote"
echo ""

