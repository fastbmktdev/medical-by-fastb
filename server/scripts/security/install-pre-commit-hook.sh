#!/bin/bash

# ============================================================================
# Install Pre-commit Hook for Secret Detection
# ============================================================================
# This script installs the pre-commit hook to prevent committing secrets
#
# Usage:
#   ./scripts/security/install-pre-commit-hook.sh
# ============================================================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

HOOK_DIR=".git/hooks"
HOOK_FILE="$HOOK_DIR/pre-commit"
SCRIPT_PATH="scripts/security/pre-commit-secret-check.sh"

echo "🔧 Installing pre-commit hook for secret detection..."

# Check if .git directory exists
if [ ! -d ".git" ]; then
    echo "❌ Error: This is not a git repository"
    exit 1
fi

# Create hooks directory if it doesn't exist
mkdir -p "$HOOK_DIR"

# Check if pre-commit hook already exists
if [ -f "$HOOK_FILE" ]; then
    echo -e "${YELLOW}⚠️  Pre-commit hook already exists${NC}"
    read -p "Do you want to replace it? (y/n): " replace
    
    if [ "$replace" != "y" ] && [ "$replace" != "Y" ]; then
        echo "Installation cancelled."
        exit 0
    fi
    
    # Backup existing hook
    mv "$HOOK_FILE" "${HOOK_FILE}.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✅ Backed up existing hook"
fi

# Create the pre-commit hook
cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash
# Pre-commit hook for secret detection
# This hook runs the secret check script before allowing commits

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
SECRET_CHECK_SCRIPT="$PROJECT_ROOT/scripts/security/pre-commit-secret-check.sh"

if [ -f "$SECRET_CHECK_SCRIPT" ]; then
    bash "$SECRET_CHECK_SCRIPT"
    exit $?
else
    echo "⚠️  Secret check script not found: $SECRET_CHECK_SCRIPT"
    echo "   Skipping secret check..."
    exit 0
fi
EOF

# Make hook executable
chmod +x "$HOOK_FILE"

echo -e "${GREEN}✅ Pre-commit hook installed successfully!${NC}"
echo ""
echo "The hook will now check for secrets before every commit."
echo ""
echo "To test:"
echo "  1. Make a test commit with a secret pattern"
echo "  2. The hook should block the commit"
echo ""
echo "To uninstall:"
echo "  rm .git/hooks/pre-commit"

