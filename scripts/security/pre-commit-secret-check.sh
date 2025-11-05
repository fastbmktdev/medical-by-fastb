#!/bin/bash

# ============================================================================
# Pre-commit Hook: Secret Detection
# ============================================================================
# This script checks for hardcoded secrets before allowing a commit
#
# Installation:
#   cp scripts/security/pre-commit-secret-check.sh .git/hooks/pre-commit
#   chmod +x .git/hooks/pre-commit
#
# Or use git-secrets:
#   git secrets --install
#   git secrets --register-aws
# ============================================================================

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Patterns to detect secrets
PATTERNS=(
    # Supabase keys
    "sb_publishable_[A-Za-z0-9_-]{20,}"
    "sb_secret_[A-Za-z0-9_-]{20,}"
    "eyJ[A-Za-z0-9_-]{100,}"  # JWT tokens
    
    # API keys
    "api[_-]?key['\"\\s]*[:=]['\"\\s]*[A-Za-z0-9_-]{20,}"
    "secret[_-]?key['\"\\s]*[:=]['\"\\s]*[A-Za-z0-9_-]{20,}"
    
    # Common secret patterns
    "password['\"\\s]*[:=]['\"\\s]*[^'\"\\s]{8,}"
    "token['\"\\s]*[:=]['\"\\s]*[A-Za-z0-9_-]{20,}"
    "secret['\"\\s]*[:=]['\"\\s]*[A-Za-z0-9_-]{20,}"
    
    # AWS keys
    "AKIA[0-9A-Z]{16}"
    "aws[_-]?secret[_-]?access[_-]?key"
    
    # Stripe keys
    "sk_live_[0-9a-zA-Z]{24,}"
    "sk_test_[0-9a-zA-Z]{24,}"
    "pk_live_[0-9a-zA-Z]{24,}"
    "pk_test_[0-9a-zA-Z]{24,}"
    
    # Generic long strings (but be careful - this can have false positives)
    # Disabled for now - too many false positives
    # "[A-Za-z0-9_-]{32,}"
)

# Files to check (staged files)
FILES=$(git diff --cached --name-only --diff-filter=ACM)

if [ -z "$FILES" ]; then
    exit 0
fi

ERRORS=0

echo -e "${YELLOW}🔍 Checking for secrets in staged files...${NC}"

for file in $FILES; do
    # Skip binary files
    if git diff --cached -- "$file" | grep -q "^Binary"; then
        continue
    fi
    
    # Get file content
    CONTENT=$(git show ":$file" 2>/dev/null || echo "")
    
    if [ -z "$CONTENT" ]; then
        continue
    fi
    
    # Check each pattern
    for pattern in "${PATTERNS[@]}"; do
        # Use grep with extended regex
        if echo "$CONTENT" | grep -qiE "$pattern"; then
            # Whitelist exceptions (test files, documentation, security scripts, etc.)
            # Skip files that are meant to contain secret patterns (for detection/validation)
            if [[ "$file" == *"test"* ]] || \
               [[ "$file" == *"example"* ]] || \
               [[ "$file" == *".md"* ]] || \
               [[ "$file" == *"SECURITY"* ]] || \
               [[ "$file" == *"README"* ]] || \
               [[ "$file" == *"scripts/security/"* ]] || \
               [[ "$file" == *"PRODUCTION_SECRET"* ]] || \
               [[ "$file" == *"PRODUCTION_SECURITY"* ]] || \
               [[ "$file" == *"SECURITY_"* ]] || \
               [[ "$file" == *"check-"* ]] || \
               [[ "$file" == *"verify-"* ]] || \
               [[ "$file" == *"cleanup-"* ]] || \
               [[ "$file" == *"check-log"* ]] || \
               [[ "$file" == *"check-production"* ]] || \
               [[ "$file" == *"pre-commit"* ]] || \
               [[ "$file" == *".gitignore"* ]] || \
               [[ "$file" == *"PROGRESS_"* ]]; then
                continue
            fi
            
            # Additional check: Skip if the match is in a comment or string context
            # (This is a simple heuristic - actual secrets shouldn't be in comments)
            # Note: Security scripts already whitelisted above, so this is just extra safety
            
            echo -e "${RED}❌ Potential secret found in: $file${NC}"
            echo -e "${RED}   Pattern: $pattern${NC}"
            ERRORS=$((ERRORS + 1))
        fi
    done
done

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}🚫 Commit blocked: Found $ERRORS potential secret(s)${NC}"
    echo -e "${YELLOW}Please remove secrets and use environment variables instead.${NC}"
    echo ""
    echo "Common fixes:"
    echo "  - Use process.env.VARIABLE_NAME instead of hardcoded values"
    echo "  - Add secrets to .env.local (not committed)"
    echo "  - Check .gitignore includes .env* files"
    exit 1
fi

echo -e "${GREEN}✅ No secrets detected${NC}"
exit 0

