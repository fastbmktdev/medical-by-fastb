#!/bin/bash

# Script to create test users via Supabase Admin API
# This ensures passwords are hashed correctly
# 
# Usage:
#   Local:      ./create-test-users.sh
#   Production: SUPABASE_URL=<url> SUPABASE_ANON_KEY=<key> SUPABASE_SERVICE_ROLE_KEY=<key> ./create-test-users.sh

# Read from environment variables or use local defaults
SUPABASE_URL="${SUPABASE_URL:-http://127.0.0.1:54321}"
ANON_KEY="${SUPABASE_ANON_KEY:-REMOVED_SECRET}"
SERVICE_ROLE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-REMOVED_SECRET}"

# Detect environment
if [[ "$SUPABASE_URL" == *"127.0.0.1"* ]] || [[ "$SUPABASE_URL" == *"localhost"* ]]; then
  ENVIRONMENT="LOCAL"
else
  ENVIRONMENT="PRODUCTION"
fi

echo "================================================"
echo "Environment: $ENVIRONMENT"
echo "Supabase URL: $SUPABASE_URL"
echo "================================================"

# Confirmation prompt for production
if [ "$ENVIRONMENT" = "PRODUCTION" ]; then
  echo ""
  echo "⚠️  WARNING: You are about to create test users in PRODUCTION!"
  echo ""
  read -p "Are you sure you want to continue? (type 'yes' to confirm): " confirmation
  if [ "$confirmation" != "yes" ]; then
    echo "Operation cancelled."
    exit 0
  fi
  echo ""
fi

echo "Creating test users..."

# Admin user
echo "Creating admin user..."
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@muaythai.com",
    "password": "password123",
    "email_confirm": true,
    "phone": "+66812345678",
    "phone_confirm": true,
    "user_metadata": {
      "username": "admin",
      "full_name": "Admin User"
    }
  }' 2>&1 | jq -r '.id // "Error: \(.)"'

# Regular user
echo "Creating regular user..."
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@muaythai.com",
    "password": "password123",
    "email_confirm": true,
    "phone": "+66823456789",
    "phone_confirm": true,
    "user_metadata": {
      "username": "regular_user",
      "full_name": "ผู้ใช้ทั่วไป"
    }
  }' 2>&1 | jq -r '.id // "Error: \(.)"'

# Partner users
echo "Creating partner..."
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner@muaythai.com",
    "password": "password123",
    "email_confirm": true,
    "phone": "+66834567890",
    "phone_confirm": true,
    "user_metadata": {
      "username": "somchai_gym",
      "full_name": "สมชาย มวยไทย"
    }
  }' 2>&1 | jq -r '.id // "Error: \(.)"'

echo "Creating partner2..."
curl -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${ANON_KEY}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "partner2@muaythai.com",
    "password": "password123",
    "email_confirm": true,
    "phone": "+66845678901",
    "phone_confirm": true,
    "user_metadata": {
      "username": "somying_fitness",
      "full_name": "สมหญิง ฟิตเนส"
    }
  }' 2>&1 | jq -r '.id // "Error: \(.)"'

echo "Test users created successfully!"
echo ""
echo "Login credentials:"
echo "  Admin: admin@muaythai.com / password123"
echo "  User: user@muaythai.com / password123"
echo "  Partner1: partner1@muaythai.com / password123"
echo "  Partner2: partner2@muaythai.com / password123"
