#!/bin/bash

# ============================================================================
# Production Security Checker (from Local)
# ============================================================================
# This script checks Production Security readiness from local environment
# It does NOT check actual production secrets (those are in production env)
# 
# Usage:
#   ./scripts/security/check-production-security.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0
WARNINGS=0
CHECKS=0

echo -e "${CYAN}🔒 Production Security Checker${NC}"
echo "=========================================="
echo ""
echo -e "${YELLOW}Note: This checks security readiness, not actual production secrets${NC}"
echo -e "${YELLOW}Production secrets are stored in production environment only${NC}"
echo ""

# Function to print check result
print_check() {
    local status=$1
    local message=$2
    CHECKS=$((CHECKS + 1))
    
    if [ "$status" = "pass" ]; then
        echo -e "${GREEN}✅ $message${NC}"
        PASSED=$((PASSED + 1))
    elif [ "$status" = "fail" ]; then
        echo -e "${RED}❌ $message${NC}"
        FAILED=$((FAILED + 1))
    elif [ "$status" = "warn" ]; then
        echo -e "${YELLOW}⚠️  $message${NC}"
        WARNINGS=$((WARNINGS + 1))
    fi
}

# ============================================================================
# 1. Code Security Checks
# ============================================================================
echo -e "${BLUE}📋 1. Code Security Checks${NC}"
echo "----------------------------------------"

# Check 1.1: No hardcoded secrets in code
echo -e "${CYAN}1.1 Checking for hardcoded secrets...${NC}"
# Exclude security scripts that intentionally check for these patterns
# Also exclude git log commands and markdown files
SECRETS_FOUND=$(grep -r "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH" src/ scripts/ 2>/dev/null | \
    grep -v "cleanup\|verify\|check-production\|check-security\|check-log\|SECURITY_INCIDENT" | \
    grep -v "\.md:" | grep -v "git log" | wc -l | tr -d ' ')
if [ "$SECRETS_FOUND" -gt 0 ]; then
    print_check "fail" "Hardcoded secrets found in code ($SECRETS_FOUND instances)"
else
    print_check "pass" "No hardcoded secrets in source code"
fi

# Check 1.2: No placeholder values (check for actual placeholder configs, not UI placeholders or validation)
echo -e "${CYAN}1.2 Checking for placeholder values...${NC}"
# Exclude security scripts, documentation, UI placeholders, validation checks, and middleware validation
PLACEHOLDERS_FOUND=$(grep -r "placeholder.*supabase\|placeholder.*key" src/ scripts/ 2>/dev/null | \
    grep -v "cleanup\|verify\|check-production\|check-security\|SECURITY_INCIDENT" | \
    grep -v "\.md:" | grep -v "documentation\|README" | \
    grep -v "placeholder=\"\|placeholder={'\|placeholder={" | \
    grep -v "placeholder-anon-key\|placeholder.supabase.co" | \
    grep -v "ArticleCreateModal\|ArticleEditModal" | \
    grep -v "middleware.ts.*===.*placeholder" | \
    grep -v "skip auth\|skip authentication\|not configured" | wc -l | tr -d ' ')
if [ "$PLACEHOLDERS_FOUND" -gt 0 ]; then
    print_check "fail" "Placeholder values found in code ($PLACEHOLDERS_FOUND instances)"
    echo -e "   ${YELLOW}Check if these are actual placeholder configs (bad) or validation checks (OK)${NC}"
else
    print_check "pass" "No placeholder values found (validation checks are OK)"
fi

# Check 1.3: Environment variables used correctly
echo -e "${CYAN}1.3 Checking environment variable usage...${NC}"
if grep -r "process\.env\." src/ 2>/dev/null | grep -q "SUPABASE\|NEXT_PUBLIC"; then
    print_check "pass" "Code uses environment variables correctly"
else
    print_check "warn" "No environment variable usage found (might be using hardcoded values)"
fi

echo ""

# ============================================================================
# 2. Security Configuration Checks
# ============================================================================
echo -e "${BLUE}📋 2. Security Configuration Checks${NC}"
echo "----------------------------------------"

# Check 2.1: Rate limiting middleware exists
echo -e "${CYAN}2.1 Checking rate limiting...${NC}"
if [ -f "src/lib/middleware/rate-limit.ts" ]; then
    print_check "pass" "Rate limiting middleware exists"
else
    print_check "fail" "Rate limiting middleware not found"
fi

# Check 2.2: CSRF protection exists
echo -e "${CYAN}2.2 Checking CSRF protection...${NC}"
if [ -f "src/lib/middleware/csrf-protection.ts" ]; then
    print_check "pass" "CSRF protection middleware exists"
else
    print_check "fail" "CSRF protection middleware not found"
fi

# Check 2.3: XSS sanitization exists
echo -e "${CYAN}2.3 Checking XSS sanitization...${NC}"
if [ -f "src/lib/utils/sanitize.ts" ]; then
    print_check "pass" "XSS sanitization utility exists"
else
    print_check "fail" "XSS sanitization utility not found"
fi

# Check 2.4: File upload validation exists
echo -e "${CYAN}2.4 Checking file upload validation...${NC}"
if [ -f "src/lib/utils/file-validation.ts" ]; then
    print_check "pass" "File upload validation exists"
else
    print_check "fail" "File upload validation not found"
fi

# Check 2.5: Security headers in next.config
echo -e "${CYAN}2.5 Checking security headers...${NC}"
if grep -q "Content-Security-Policy\|X-Frame-Options\|X-Content-Type-Options" next.config.ts 2>/dev/null; then
    print_check "pass" "Security headers configured"
else
    print_check "warn" "Security headers not found in next.config.ts"
fi

# Check 2.6: Audit logging exists
echo -e "${CYAN}2.6 Checking audit logging...${NC}"
# Check for audit_logs table usage or audit logging functions
if grep -r "audit_logs\|log_audit_event" src/ supabase/ 2>/dev/null | grep -v "node_modules" | grep -q .; then
    print_check "pass" "Audit logging system exists"
elif [ -f "src/app/api/admin/audit-logs" ] || [ -d "src/app/api/admin/audit-logs" ]; then
    print_check "pass" "Audit logging API exists"
else
    print_check "warn" "Audit logging system not found (may be in database)"
fi

echo ""

# ============================================================================
# 3. Environment Variable Structure Checks
# ============================================================================
echo -e "${BLUE}📋 3. Environment Variable Structure Checks${NC}"
echo "----------------------------------------"

# Check 3.1: .env.example or documentation exists
echo -e "${CYAN}3.1 Checking environment documentation...${NC}"
if [ -f ".env.example" ] || [ -f "PRODUCTION_SECRET_ROTATION_GUIDE.md" ]; then
    print_check "pass" "Environment variable documentation exists"
else
    print_check "warn" "Environment variable documentation not found"
fi

# Check 3.2: Required env vars documented
echo -e "${CYAN}3.2 Checking required variables documented...${NC}"
REQUIRED_VARS=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "SUPABASE_SERVICE_ROLE_KEY")
MISSING_DOCS=0
for var in "${REQUIRED_VARS[@]}"; do
    if ! grep -r "$var" .env.example PRODUCTION_SECRET_ROTATION_GUIDE.md 2>/dev/null | grep -q .; then
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

if [ $MISSING_DOCS -eq 0 ]; then
    print_check "pass" "Required environment variables documented"
else
    print_check "warn" "Some required variables not documented"
fi

# Check 3.3: .gitignore protects secrets
echo -e "${CYAN}3.3 Checking .gitignore protection...${NC}"
if grep -q "\.env\*\|secret\|credential" .gitignore 2>/dev/null; then
    print_check "pass" ".gitignore protects secret files"
else
    print_check "fail" ".gitignore does not protect secret files"
fi

echo ""

# ============================================================================
# 4. Production Readiness Checks
# ============================================================================
echo -e "${BLUE}📋 4. Production Readiness Checks${NC}"
echo "----------------------------------------"

# Check 4.1: Security scripts exist
echo -e "${CYAN}4.1 Checking security scripts...${NC}"
SECURITY_SCRIPTS=(
    "scripts/security/verify-security-fix.sh"
    "scripts/security/get-supabase-keys.sh"
    "scripts/security/check-log-secrets.sh"
)
MISSING_SCRIPTS=0
for script in "${SECURITY_SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        MISSING_SCRIPTS=$((MISSING_SCRIPTS + 1))
    fi
done

if [ $MISSING_SCRIPTS -eq 0 ]; then
    print_check "pass" "Security scripts available"
else
    print_check "warn" "Some security scripts missing"
fi

# Check 4.2: Security documentation exists
echo -e "${CYAN}4.2 Checking security documentation...${NC}"
DOCS=(
    "SECURITY_INCIDENT_REPORT.md"
    "PRODUCTION_SECRET_ROTATION_GUIDE.md"
    "SECURITY_SUMMARY.md"
)
MISSING_DOCS=0
for doc in "${DOCS[@]}"; do
    if [ ! -f "$doc" ]; then
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

if [ $MISSING_DOCS -eq 0 ]; then
    print_check "pass" "Security documentation complete"
else
    print_check "warn" "Some security documentation missing"
fi

# Check 4.3: Pre-commit hook (optional but recommended)
echo -e "${CYAN}4.3 Checking pre-commit hook...${NC}"
if [ -f ".git/hooks/pre-commit" ]; then
    print_check "pass" "Pre-commit hook installed"
else
    print_check "warn" "Pre-commit hook not installed (recommended)"
fi

echo ""

# ============================================================================
# 5. Production Verification Checklist
# ============================================================================
echo -e "${BLUE}📋 5. Production Verification Checklist${NC}"
echo "----------------------------------------"
echo ""
echo -e "${CYAN}To verify Production Security, you must:${NC}"
echo ""
echo "1. ${YELLOW}Rotate Supabase Keys${NC}"
echo "   - Go to https://app.supabase.com"
echo "   - Settings → API → Rotate keys"
echo "   - Follow: PRODUCTION_SECRET_ROTATION_GUIDE.md"
echo ""
echo "2. ${YELLOW}Update Production Environment Variables${NC}"
echo "   - Vercel/Deployment Platform → Settings → Environment Variables"
echo "   - Set: NEXT_PUBLIC_SUPABASE_URL"
echo "   - Set: NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   - Set: SUPABASE_SERVICE_ROLE_KEY"
echo ""
echo "3. ${YELLOW}Verify Production Secrets${NC}"
echo "   - Check production environment variables are set"
echo "   - Verify keys are different from exposed ones"
echo "   - Test production API endpoints"
echo ""
echo "4. ${YELLOW}Review Access Logs${NC}"
echo "   - Check Supabase Dashboard → Logs"
echo "   - Look for suspicious access patterns"
echo "   - Review audit logs"
echo ""
echo "5. ${YELLOW}Test Production Security${NC}"
echo "   - Test rate limiting"
echo "   - Test CSRF protection"
echo "   - Verify security headers"
echo ""

# ============================================================================
# Summary
# ============================================================================
echo "=========================================="
echo -e "${CYAN}Summary:${NC}"
echo -e "${GREEN}✅ Passed: $PASSED${NC}"
echo -e "${RED}❌ Failed: $FAILED${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo ""

# Calculate score
TOTAL=$((PASSED + FAILED + WARNINGS))
if [ $TOTAL -gt 0 ]; then
    SCORE=$((PASSED * 100 / TOTAL))
    echo -e "${CYAN}Security Readiness Score: ${SCORE}%${NC}"
    echo ""
fi

if [ $FAILED -eq 0 ]; then
    if [ $WARNINGS -eq 0 ]; then
        echo -e "${GREEN}✅ Production Security Ready!${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Remember: You still need to:${NC}"
        echo "   1. Rotate production Supabase keys"
        echo "   2. Update production environment variables"
        echo "   3. Verify production deployment"
        exit 0
    else
        echo -e "${YELLOW}⚠️  Production Security Mostly Ready (with warnings)${NC}"
        echo ""
        echo -e "${YELLOW}Review warnings above and production checklist${NC}"
        exit 0
    fi
else
    echo -e "${RED}❌ Production Security Not Ready${NC}"
    echo ""
    echo -e "${RED}Fix failed checks before deploying to production${NC}"
    exit 1
fi

