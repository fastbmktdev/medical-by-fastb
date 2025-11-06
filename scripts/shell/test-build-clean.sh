#!/bin/bash

# Script: test-build-clean.sh
# Description: Run tests, build project, and clean build files if both succeed
# Usage: bash scripts/shell/test-build-clean.sh

set -e  # Exit on error

echo "🧪 Step 1: Running tests..."
echo "=================================="

# Run tests (using jest for unit tests)
npm run test

if [ $? -ne 0 ]; then
  echo "❌ Tests failed. Aborting build."
  exit 1
fi

echo ""
echo "✅ Tests passed!"
echo ""

echo "🔨 Step 2: Building project..."
echo "=================================="

# Run build
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Build failed."
  exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""

echo "🧹 Step 3: Cleaning build files..."
echo "=================================="

# Remove Next.js build directories
BUILD_DIRS=(".next" "out" "build" "dist")

for dir in "${BUILD_DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "  Removing $dir/..."
    rm -rf "$dir"
    echo "  ✓ $dir/ removed"
  else
    echo "  ℹ️  $dir/ not found (already clean)"
  fi
done

echo ""
echo "🎉 All done! Tests passed, build succeeded, and build files cleaned."
echo ""

