#!/bin/bash

# ============================================================================
# Check Logs for Secret Data
# ============================================================================
# This script checks for potential secret leaks in logs and console output
#
# Usage:
#   ./scripts/security/check-log-secrets.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Checking for secrets in logs and console output...${NC}"
echo "============================================================"
echo ""

ISSUES=0
WARNINGS=0

# Check 1: Console logs that might expose secrets
echo -e "${BLUE}1. Checking console.log/error/warn for secret exposure...${NC}"
SUSPICIOUS_LOGS=$(grep -rn "console\.\(log\|error\|warn\).*process\.env" src/ 2>/dev/null | grep -v "not configured\|not found\|not set\|missing" | wc -l | tr -d ' ')

if [ "$SUSPICIOUS_LOGS" -gt 0 ]; then
    echo -e "${RED}❌ Found $SUSPICIOUS_LOGS potentially dangerous console logs${NC}"
    grep -rn "console\.\(log\|error\|warn\).*process\.env" src/ 2>/dev/null | grep -v "not configured\|not found\|not set\|missing" | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No dangerous console logs found${NC}"
fi

# Check 2: Console logs with actual secret values
echo ""
echo -e "${BLUE}2. Checking for hardcoded secret values in logs...${NC}"
if grep -r "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" src/ 2>/dev/null | grep -v "cleanup\|verify-security" | grep -q .; then
    echo -e "${RED}❌ Found exposed secret in source code${NC}"
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No hardcoded secrets in logs${NC}"
fi

# Check 3: Error messages that might expose partial secrets
echo ""
echo -e "${BLUE}3. Checking error messages for secret exposure...${NC}"
ERROR_EXPOSURE=$(grep -rn "console\.error.*key\|console\.error.*secret\|console\.error.*password\|console\.error.*token" src/ 2>/dev/null | grep -v "not configured\|not found\|not set\|missing" | wc -l | tr -d ' ')

if [ "$ERROR_EXPOSURE" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $ERROR_EXPOSURE error messages that mention secrets${NC}"
    echo "   Review these for potential exposure:"
    grep -rn "console\.error.*key\|console\.error.*secret\|console\.error.*password\|console\.error.*token" src/ 2>/dev/null | grep -v "not configured\|not found\|not set\|missing" | head -3
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ Error messages look safe${NC}"
fi

# Check 4: Git log history
echo ""
echo -e "${BLUE}4. Checking git log for exposed secrets...${NC}"
if git log --all -p -S "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" --oneline 2>/dev/null | grep -q .; then
    echo -e "${YELLOW}⚠️  Exposed secrets found in git history${NC}"
    echo "   Commits containing secrets:"
    git log --all -p -S "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" --oneline 2>/dev/null | head -3
    echo ""
    echo "   Run cleanup script: ./scripts/security/cleanup-git-history.sh"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No secrets in current git history (or already cleaned)${NC}"
fi

# Check 5: Log files
echo ""
echo -e "${BLUE}5. Checking for log files...${NC}"
LOG_FILES=$(find . -type f -name "*.log" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | wc -l | tr -d ' ')

if [ "$LOG_FILES" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $LOG_FILES log files${NC}"
    find . -type f -name "*.log" -not -path "*/node_modules/*" -not -path "*/.git/*" 2>/dev/null | head -5
    echo ""
    echo "   Check if these files contain secrets and are in .gitignore"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${GREEN}✅ No log files found${NC}"
fi

# Check 6: Console logs that print full environment variable values
echo ""
echo -e "${BLUE}6. Checking for console logs that print env values...${NC}"
ENV_LOGS=$(grep -rn "console\.\(log\|error\|warn\).*\$\{.*env\|console\.\(log\|error\|warn\).*process\.env\." src/ 2>/dev/null | wc -l | tr -d ' ')

if [ "$ENV_LOGS" -gt 0 ]; then
    echo -e "${RED}❌ Found console logs that print environment variables${NC}"
    grep -rn "console\.\(log\|error\|warn\).*\$\{.*env\|console\.\(log\|error\|warn\).*process\.env\." src/ 2>/dev/null | head -5
    ISSUES=$((ISSUES + 1))
else
    echo -e "${GREEN}✅ No console logs printing env values${NC}"
fi

# Summary
echo ""
echo "============================================================"
echo -e "${BLUE}Summary:${NC}"
echo -e "${RED}❌ Issues: $ISSUES${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ No secret leaks found in logs!${NC}"
    exit 0
elif [ $ISSUES -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Some warnings found, but no critical issues${NC}"
    exit 0
else
    echo -e "${RED}❌ Critical issues found! Review and fix.${NC}"
    exit 1
fi

