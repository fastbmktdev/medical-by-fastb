#!/bin/bash

# ============================================================================
# Security Fix Verification Script
# ============================================================================
# This script verifies that all security fixes have been properly applied
#
# Usage:
#   ./scripts/security/verify-security-fix.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

echo -e "${BLUE}🔍 Security Fix Verification${NC}"
echo "================================"
echo ""

# Check 1: Hardcoded secrets removed from development-setup.sh
echo -e "${BLUE}1. Checking development-setup.sh...${NC}"
if grep -q "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" scripts/shell/development-setup.sh 2>/dev/null; then
    echo -e "${RED}❌ FAILED: Hardcoded anon key still found${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: No hardcoded anon key${NC}"
    PASSED=$((PASSED + 1))
fi

if grep -q "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU" scripts/shell/development-setup.sh 2>/dev/null; then
    echo -e "${RED}❌ FAILED: Hardcoded service role key still found${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: No hardcoded service role key${NC}"
    PASSED=$((PASSED + 1))
fi

# Check 2: Placeholder values removed from server.ts
echo ""
echo -e "${BLUE}2. Checking server.ts...${NC}"
if grep -q "placeholder.supabase.co" src/lib/database/supabase/server.ts 2>/dev/null; then
    echo -e "${RED}❌ FAILED: Placeholder values still found${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: No placeholder values${NC}"
    PASSED=$((PASSED + 1))
fi

if grep -q "placeholder-key" src/lib/database/supabase/server.ts 2>/dev/null; then
    echo -e "${RED}❌ FAILED: Placeholder key still found${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: No placeholder key${NC}"
    PASSED=$((PASSED + 1))
fi

# Check 3: .gitignore updated
echo ""
echo -e "${BLUE}3. Checking .gitignore...${NC}"
if grep -q "Security: Prevent committing secrets" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ PASSED: Security section added to .gitignore${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Security section not found in .gitignore${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if grep -q "\*secret\*" .gitignore 2>/dev/null; then
    echo -e "${GREEN}✅ PASSED: Secret patterns in .gitignore${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Secret patterns not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 4: Security scripts created
echo ""
echo -e "${BLUE}4. Checking security scripts...${NC}"
if [ -f "scripts/security/cleanup-git-history.sh" ]; then
    echo -e "${GREEN}✅ PASSED: cleanup-git-history.sh exists${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: cleanup-git-history.sh not found${NC}"
    FAILED=$((FAILED + 1))
fi

if [ -f "scripts/security/pre-commit-secret-check.sh" ]; then
    echo -e "${GREEN}✅ PASSED: pre-commit-secret-check.sh exists${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: pre-commit-secret-check.sh not found${NC}"
    FAILED=$((FAILED + 1))
fi

if [ -f "scripts/security/get-supabase-keys.sh" ]; then
    echo -e "${GREEN}✅ PASSED: get-supabase-keys.sh exists${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${RED}❌ FAILED: get-supabase-keys.sh not found${NC}"
    FAILED=$((FAILED + 1))
fi

# Check 5: Documentation created
echo ""
echo -e "${BLUE}5. Checking documentation...${NC}"
if [ -f "SECURITY_INCIDENT_REPORT.md" ]; then
    echo -e "${GREEN}✅ PASSED: SECURITY_INCIDENT_REPORT.md exists${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: SECURITY_INCIDENT_REPORT.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

if [ -f "PRODUCTION_SECRET_ROTATION_GUIDE.md" ]; then
    echo -e "${GREEN}✅ PASSED: PRODUCTION_SECRET_ROTATION_GUIDE.md exists${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: PRODUCTION_SECRET_ROTATION_GUIDE.md not found${NC}"
    WARNINGS=$((WARNINGS + 1))
fi

# Check 6: No secrets in source code
echo ""
echo -e "${BLUE}6. Checking for secrets in source code...${NC}"
SECRETS_IN_CODE=$(grep -r "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" src/ scripts/shell/ scripts/node/ 2>/dev/null | grep -v "cleanup-git-history.sh" | wc -l | tr -d ' ')
if [ "$SECRETS_IN_CODE" -gt 0 ]; then
    echo -e "${RED}❌ FAILED: Found exposed secrets in source code${NC}"
    FAILED=$((FAILED + 1))
else
    echo -e "${GREEN}✅ PASSED: No exposed secrets in source code${NC}"
    PASSED=$((PASSED + 1))
fi

# Check 7: Pre-commit hook (optional)
echo ""
echo -e "${BLUE}7. Checking pre-commit hook...${NC}"
if [ -f ".git/hooks/pre-commit" ]; then
    echo -e "${GREEN}✅ PASSED: Pre-commit hook installed${NC}"
    PASSED=$((PASSED + 1))
else
    echo -e "${YELLOW}⚠️  WARNING: Pre-commit hook not installed${NC}"
    echo "   Install with: ./scripts/security/install-pre-commit-hook.sh"
    WARNINGS=$((WARNINGS + 1))
fi

# Summary
echo ""
echo "================================"
echo -e "${BLUE}Summary:${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All critical checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Some optional checks have warnings${NC}"
    fi
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review and fix.${NC}"
    exit 1
fi

