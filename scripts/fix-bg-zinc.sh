#!/bin/bash

# Script to replace bg-zinc patterns with bg-white and text-zinc-950
# Usage: ./scripts/fix-bg-zinc.sh

cd "$(dirname "$0")/.." || exit

# Find all TypeScript/TSX files
find client/src -type f \( -name "*.tsx" -o -name "*.ts" \) | while read -r file; do
  # Skip if file doesn't contain bg-zinc
  if ! grep -q "bg-zinc" "$file"; then
    continue
  fi

  echo "Processing: $file"

  # Create backup
  cp "$file" "$file.bak"

  # Replace common patterns
  sed -i '' \
    -e 's/bg-zinc-100\/95/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-100\/50/bg-white\/50 text-zinc-950/g' \
    -e 's/bg-zinc-100/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-900\/50/bg-white\/50 text-zinc-950/g' \
    -e 's/bg-zinc-900/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-800\/50 backdrop-blur-sm/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-800\/50/bg-white\/50 text-zinc-950/g' \
    -e 's/bg-zinc-800/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-100/bg-white text-zinc-950/g' \
    -e 's/bg-zinc-600/bg-gray-400/g' \
    -e 's/text-zinc-400/text-zinc-950/g' \
    -e 's/text-zinc-400/text-gray-600/g' \
    -e 's/text-zinc-500/text-gray-600/g' \
    -e 's/border-zinc-700\/50/border-gray-300/g' \
    -e 's/border-zinc-700/border-gray-300/g' \
    -e 's/border-zinc-600\/50/border-gray-300/g' \
    -e 's/border-zinc-600/border-gray-300/g' \
    -e 's/border-zinc-500\/70/border-gray-400/g' \
    -e 's/border-zinc-500\/50/border-gray-400/g' \
    -e 's/border-zinc-500/border-gray-400/g' \
    -e 's/placeholder-zinc-500/placeholder-gray-400/g' \
    -e 's/placeholder-zinc-400/placeholder-gray-400/g' \
    "$file"

  # Remove backup if no changes were made
  if cmp -s "$file" "$file.bak"; then
    rm "$file.bak"
  else
    echo "  ✓ Updated: $file"
  fi
done

echo "Done! Please review the changes and remove .bak files if everything looks good."

