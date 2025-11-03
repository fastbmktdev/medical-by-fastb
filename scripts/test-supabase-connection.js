#!/usr/bin/env node

/**
 * Test Supabase Connection Script
 * 
 * This script helps diagnose Supabase connection issues
 * Usage: node scripts/test-supabase-connection.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('\n🔍 Supabase Connection Test\n');
console.log('='.repeat(60));

// Check environment variables
console.log('\n1️⃣ Checking Environment Variables:');
if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl.substring(0, 30) + '...');
}

if (!supabaseAnonKey) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');
} else {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey.substring(0, 20) + '...');
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('\n❌ Missing required environment variables!');
  console.log('\nPlease check your .env.local file and ensure both variables are set.');
  process.exit(1);
}

// Validate URL format
console.log('\n2️⃣ Validating URL Format:');
try {
  const url = new URL(supabaseUrl);
  console.log('✅ URL format is valid');
  console.log('   - Protocol:', url.protocol);
  console.log('   - Host:', url.host);
} catch (error) {
  console.error('❌ Invalid URL format:', error.message);
  process.exit(1);
}

// Create Supabase client
console.log('\n3️⃣ Creating Supabase Client:');
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
  console.log('✅ Client created successfully');
} catch (error) {
  console.error('❌ Failed to create client:', error.message);
  process.exit(1);
}

// Test connection
console.log('\n4️⃣ Testing Connection:');
try {
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
    },
  });
  
  if (response.ok) {
    console.log('✅ Connection successful (HTTP', response.status + ')');
  } else {
    console.warn('⚠️  Connection returned HTTP', response.status);
    console.log('   Response:', response.statusText);
  }
} catch (error) {
  console.error('❌ Connection failed:', error.message);
  if (error.cause) {
    console.error('   Cause:', error.cause.message || error.cause.code);
  }
  
  console.log('\n💡 Troubleshooting Tips:');
  console.log('   1. Check your internet connection');
  console.log('   2. Verify Supabase project is active in dashboard');
  console.log('   3. Check if URL is correct (no trailing slash)');
  console.log('   4. For local dev, run: supabase status');
  
  process.exit(1);
}

// Test authentication endpoint
console.log('\n5️⃣ Testing Auth Endpoint:');
try {
  const response = await fetch(`${supabaseUrl}/auth/v1/health`, {
    method: 'GET',
    headers: {
      'apikey': supabaseAnonKey,
    },
  });
  
  if (response.ok) {
    const data = await response.json();
    console.log('✅ Auth endpoint is accessible');
    console.log('   Status:', data.status || 'OK');
  } else {
    console.warn('⚠️  Auth endpoint returned HTTP', response.status);
  }
} catch (error) {
  console.error('❌ Auth endpoint test failed:', error.message);
}

// Test with a simple query
console.log('\n6️⃣ Testing Database Query:');
try {
  const { data, error } = await supabase
    .from('profiles')
    .select('count')
    .limit(1);
  
  if (error) {
    console.warn('⚠️  Query test returned error:', error.message);
    console.log('   This might be normal if tables don\'t exist yet');
  } else {
    console.log('✅ Database query successful');
  }
} catch (error) {
  console.warn('⚠️  Query test failed:', error.message);
}

// Test authentication
console.log('\n7️⃣ Testing Authentication (with dummy credentials):');
try {
  const { error } = await supabase.auth.signInWithPassword({
    email: 'test@example.com',
    password: 'test123456',
  });
  
  // We expect this to fail with "Invalid credentials" - that's good!
  if (error && error.message.includes('Invalid')) {
    console.log('✅ Auth endpoint is working (correctly rejected invalid credentials)');
  } else if (error) {
    console.warn('⚠️  Auth test returned unexpected error:', error.message);
  }
} catch (error) {
  console.error('❌ Auth test failed:', error.message);
}

console.log('\n' + '='.repeat(60));
console.log('\n✅ Connection test completed!\n');

if (!supabaseUrl.includes('supabase.co') && !supabaseUrl.includes('localhost') && !supabaseUrl.includes('127.0.0.1')) {
  console.log('⚠️  Warning: Supabase URL doesn\'t look like a standard Supabase URL');
  console.log('   Make sure you\'re using the correct project URL from Supabase Dashboard');
}

console.log('\n💡 Next Steps:');
console.log('   1. If all tests passed, try logging in again');
console.log('   2. Check browser console (F12) for detailed errors');
console.log('   3. Verify .env.local is in the project root');
console.log('   4. Restart your development server after changing .env.local\n');

