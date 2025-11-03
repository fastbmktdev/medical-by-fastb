#!/bin/bash

# Security Check Script
# ตรวจสอบว่ามีข้อมูลสำคัญที่อาจรั่วไหลหรือไม่

echo "🔒 Security Check for Production"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# 1. Check for .env files in git (excluding .env.example which is safe)
echo "1️⃣ Checking for .env files in git..."
ENV_FILES=$(git ls-files | grep -E "^\.env" | grep -v ".gitignore" | grep -v ".env.example")
if [ -z "$ENV_FILES" ]; then
  echo -e "${GREEN}✅ No sensitive .env files tracked in git${NC}"
else
  echo -e "${RED}❌ Found .env files tracked in git (should be ignored):${NC}"
  echo "$ENV_FILES"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 2. Check for backup env files
echo "2️⃣ Checking for backup .env files..."
BACKUP_FILES=$(find . -name ".env*.backup*" -o -name "*.env.backup*" 2>/dev/null | grep -v node_modules)
if [ -z "$BACKUP_FILES" ]; then
  echo -e "${GREEN}✅ No backup .env files found${NC}"
else
  echo -e "${YELLOW}⚠️  Found backup .env files (should be ignored):${NC}"
  echo "$BACKUP_FILES"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 3. Check for sensitive documentation files
echo "3️⃣ Checking for sensitive documentation files..."
SENSITIVE_DOCS=$(git ls-files | grep -E "(QUICK_FIX|TROUBLESHOOT|MOCK_USERS|FIX_SUPABASE)" | grep "\.md$")
if [ -z "$SENSITIVE_DOCS" ]; then
  echo -e "${GREEN}✅ No sensitive documentation files tracked${NC}"
else
  echo -e "${RED}❌ Found sensitive documentation files in git:${NC}"
  echo "$SENSITIVE_DOCS"
  echo -e "${YELLOW}   Run: git rm --cached <file> to untrack them${NC}"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check for debug files
echo "4️⃣ Checking for debug files..."
DEBUG_FILES=$(git ls-files | grep -E "(debug\.tsx|debug\.ts|debug\.js)")
if [ -z "$DEBUG_FILES" ]; then
  echo -e "${GREEN}✅ No debug files tracked${NC}"
else
  echo -e "${YELLOW}⚠️  Found debug files (should be ignored in production):${NC}"
  echo "$DEBUG_FILES"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 5. Check for hardcoded passwords in tracked scripts
echo "5️⃣ Checking for hardcoded passwords in tracked scripts..."
PASSWORD_FILES=$(git ls-files scripts/*.js scripts/*.ts 2>/dev/null | xargs grep -l "password.*=" 2>/dev/null | grep -v node_modules || true)
if [ -z "$PASSWORD_FILES" ]; then
  echo -e "${GREEN}✅ No obvious hardcoded passwords found${NC}"
else
  echo -e "${YELLOW}⚠️  Files that may contain hardcoded passwords:${NC}"
  echo "$PASSWORD_FILES"
  echo -e "${YELLOW}   Review these files and use environment variables instead${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Check for production-users.json
echo "6️⃣ Checking for production-users.json..."
if [ -f "scripts/production-users.json" ]; then
  if git ls-files --error-unmatch scripts/production-users.json >/dev/null 2>&1; then
    echo -e "${RED}❌ production-users.json is tracked in git!${NC}"
    echo -e "${YELLOW}   Run: git rm --cached scripts/production-users.json${NC}"
    ERRORS=$((ERRORS + 1))
  else
    echo -e "${GREEN}✅ production-users.json exists but is ignored${NC}"
  fi
else
  echo -e "${GREEN}✅ No production-users.json file found${NC}"
fi
echo ""

# 7. Check .gitignore for important patterns
echo "7️⃣ Checking .gitignore coverage..."
if grep -q "\.env" .gitignore && grep -q "debug" .gitignore && grep -q "QUICK_FIX" .gitignore; then
  echo -e "${GREEN}✅ .gitignore looks good${NC}"
else
  echo -e "${YELLOW}⚠️  .gitignore might be missing some patterns${NC}"
  WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Summary
echo "================================"
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  echo -e "${GREEN}✅ All security checks passed!${NC}"
  exit 0
elif [ $ERRORS -eq 0 ]; then
  echo -e "${YELLOW}⚠️  Found $WARNINGS warning(s) - review recommended${NC}"
  exit 0
else
  echo -e "${RED}❌ Found $ERRORS error(s) and $WARNINGS warning(s)${NC}"
  echo -e "${RED}   Please fix errors before deploying to production!${NC}"
  exit 1
fi

