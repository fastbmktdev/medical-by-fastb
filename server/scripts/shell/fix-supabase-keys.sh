#!/bin/bash

# Script to fix Supabase local development keys
# This updates .env.local with correct keys from supabase status

echo "🔧 Fixing Supabase Local Development Keys"
echo "=========================================="

# Get Supabase status
echo "📋 Getting Supabase status..."
STATUS=$(npx supabase status)

# Extract publishable key
PUBLISHABLE_KEY=$(echo "$STATUS" | grep "Publishable key:" | awk '{print $3}')
ANON_KEY=$(echo "$STATUS" | grep "Publishable key:" | awk '{print $3}')

# Extract secret key
SECRET_KEY=$(echo "$STATUS" | grep "Secret key:" | awk '{print $3}')

# Extract API URL
API_URL=$(echo "$STATUS" | grep "API URL:" | awk '{print $3}')

if [ -z "$PUBLISHABLE_KEY" ]; then
  echo "❌ Error: Could not get publishable key from supabase status"
  echo "Make sure Supabase is running: supabase start"
  exit 1
fi

echo "✅ Found keys:"
echo "   API URL: $API_URL"
echo "   Publishable Key: ${PUBLISHABLE_KEY:0:20}..."
echo "   Secret Key: ${SECRET_KEY:0:20}..."

# Update .env.local
ENV_FILE=".env.local"

if [ ! -f "$ENV_FILE" ]; then
  echo "📝 Creating $ENV_FILE..."
  touch "$ENV_FILE"
fi

echo ""
echo "🔧 Updating $ENV_FILE..."

# Backup original
cp "$ENV_FILE" "${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
echo "✅ Backup created: ${ENV_FILE}.backup.*"

# Update or add NEXT_PUBLIC_SUPABASE_URL
if grep -q "NEXT_PUBLIC_SUPABASE_URL=" "$ENV_FILE"; then
  sed -i.bak "s|NEXT_PUBLIC_SUPABASE_URL=.*|NEXT_PUBLIC_SUPABASE_URL=$API_URL|" "$ENV_FILE"
else
  echo "" >> "$ENV_FILE"
  echo "# Supabase Configuration" >> "$ENV_FILE"
  echo "NEXT_PUBLIC_SUPABASE_URL=$API_URL" >> "$ENV_FILE"
fi

# Update or add NEXT_PUBLIC_SUPABASE_ANON_KEY
if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY=" "$ENV_FILE"; then
  sed -i.bak "s|NEXT_PUBLIC_SUPABASE_ANON_KEY=.*|NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY|" "$ENV_FILE"
else
  echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=$PUBLISHABLE_KEY" >> "$ENV_FILE"
fi

# Update or add SUPABASE_URL (for server-side)
if grep -q "^SUPABASE_URL=" "$ENV_FILE"; then
  sed -i.bak "s|^SUPABASE_URL=.*|SUPABASE_URL=$API_URL|" "$ENV_FILE"
else
  echo "SUPABASE_URL=$API_URL" >> "$ENV_FILE"
fi

# Update or add SUPABASE_ANON_KEY (for server-side)
if grep -q "^SUPABASE_ANON_KEY=" "$ENV_FILE"; then
  sed -i.bak "s|^SUPABASE_ANON_KEY=.*|SUPABASE_ANON_KEY=$PUBLISHABLE_KEY|" "$ENV_FILE"
else
  echo "SUPABASE_ANON_KEY=$PUBLISHABLE_KEY" >> "$ENV_FILE"
fi

# Update or add SUPABASE_SERVICE_ROLE_KEY
if grep -q "^SUPABASE_SERVICE_ROLE_KEY=" "$ENV_FILE"; then
  sed -i.bak "s|^SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SECRET_KEY|" "$ENV_FILE"
else
  echo "SUPABASE_SERVICE_ROLE_KEY=$SECRET_KEY" >> "$ENV_FILE"
fi

# Clean up backup files created by sed
rm -f "$ENV_FILE.bak"

echo ""
echo "✅ Updated $ENV_FILE successfully!"
echo ""
echo "📝 Current configuration:"
echo "   NEXT_PUBLIC_SUPABASE_URL=$API_URL"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=${PUBLISHABLE_KEY:0:30}..."
echo ""
echo "⚠️  IMPORTANT: Restart your Next.js dev server for changes to take effect!"
echo "   Stop server (Ctrl+C) and run: npm run dev"
echo ""

