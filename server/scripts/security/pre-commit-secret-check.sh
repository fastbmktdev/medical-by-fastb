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
        # Use grep with extended regex to find matches
        MATCHES=$(echo "$CONTENT" | grep -niE "$pattern" || true)
        
        if [ -n "$MATCHES" ]; then
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
               [[ "$file" == *"PROGRESS_"* ]] || \
               [[ "$file" == *".env"* ]] || \
               [[ "$file" == *".bak"* ]] || \
               [[ "$file" == *".sql"* ]] || \
               [[ "$file" == *"scripts/sql/"* ]]; then
                continue
            fi
            
            # Filter out false positives: error messages, validation messages, comments
            # Skip matches that are clearly error messages or Thai text (validation messages)
            VALID_MATCHES=""
            while IFS= read -r line; do
                if [ -z "$line" ]; then
                    continue
                fi
                
                # Extract line number and content
                LINE_NUM=$(echo "$line" | cut -d: -f1)
                LINE_CONTENT=$(echo "$line" | cut -d: -f2-)
                
                # Skip environment variable lookups (e.g., password: requireEnv('VAR'))
                if echo "$LINE_CONTENT" | grep -qE "requireEnv\\("; then
                    continue
                fi

                # Skip values that reference other password variables (e.g., definition.password)
                if echo "$LINE_CONTENT" | grep -qE ":[[:space:]]*[A-Za-z0-9_.]+\\.password"; then
                    continue
                fi

                # Skip if it's clearly an error message (contains Thai characters or common error keywords)
                # Thai error messages like "รหัสผ่านไม่ตรงตามเงื่อนไข" are not secrets
                if echo "$LINE_CONTENT" | grep -qE "[ก-๙]" && \
                   echo "$LINE_CONTENT" | grep -qE "(password|password:)" && \
                   ! echo "$LINE_CONTENT" | grep -qE "[A-Za-z0-9_-]{20,}"; then
                    # This is likely a Thai error message, skip it
                    continue
                fi
                
                # Skip if it's an error message with common error keywords
                if echo "$LINE_CONTENT" | grep -qE "(error|Error|message|Message|กรุณา|ต้อง|ต้องมี|ไม่ตรง|ไม่ถูก|ถูกต้อง|ไม่ถูกต้อง)" && \
                   echo "$LINE_CONTENT" | grep -qE "(password|password:)" && \
                   ! echo "$LINE_CONTENT" | grep -qE "[A-Za-z0-9_-]{20,}"; then
                    # This is likely an error message, skip it
                    continue
                fi
                
                # Skip if it's a variable name like formData.password or state.password
                if echo "$LINE_CONTENT" | grep -qE "(formData\.|state\.|\.password[[:space:]]*[=:])" && \
                   ! echo "$LINE_CONTENT" | grep -qE "[A-Za-z0-9_-]{20,}"; then
                    continue
                fi
                
                # Skip if it's in a comment (starts with //, #, or /*)
                PREV_LINE=$(echo "$CONTENT" | sed -n "$((LINE_NUM-1))p" 2>/dev/null || echo "")
                if echo "$PREV_LINE" | grep -qE "^[[:space:]]*(//|#|/\*)" || \
                   echo "$LINE_CONTENT" | grep -qE "^[[:space:]]*(//|#|/\*)"; then
                    continue
                fi
                
                
                # This looks like a real potential secret
                if [ -z "$VALID_MATCHES" ]; then
                    VALID_MATCHES="$line"
                else
                    VALID_MATCHES="$VALID_MATCHES\n$line"
                fi
            done <<< "$MATCHES"
            
            if [ -n "$VALID_MATCHES" ]; then
                echo -e "${RED}❌ Potential secret found in: $file${NC}"
                echo -e "${RED}   Pattern: $pattern${NC}"
                echo -e "${RED}   Matches:${NC}"
                echo -e "$VALID_MATCHES" | while IFS= read -r match_line; do
                    echo -e "${RED}     Line: $match_line${NC}"
                done
                ERRORS=$((ERRORS + 1))
            fi
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

