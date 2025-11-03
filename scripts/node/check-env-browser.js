#!/usr/bin/env node

/**
 * Check Environment Variables for Browser
 * 
 * This script helps verify that NEXT_PUBLIC_ variables are properly set
 * and will be available in the browser
 */

import dotenv from 'dotenv';
import { readFileSync } from 'fs';

console.log('🔍 Checking Environment Variables for Browser\n');

// Load .env.local
const envLocal = dotenv.config({ path: '.env.local' });
const envFile = dotenv.config({ path: '.env' });

console.log('='.repeat(60));

// Check NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  envLocal.parsed?.NEXT_PUBLIC_SUPABASE_URL ||
  envFile.parsed?.NEXT_PUBLIC_SUPABASE_URL;

// Check NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAnonKey = 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  envLocal.parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  envFile.parsed?.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n1️⃣ NEXT_PUBLIC_SUPABASE_URL:');
if (supabaseUrl) {
  console.log(`   ✅ SET: ${supabaseUrl}`);
  
  // Validate URL
  try {
    const url = new URL(supabaseUrl);
    console.log(`   ✅ Valid URL format`);
    console.log(`      Protocol: ${url.protocol}`);
    console.log(`      Host: ${url.host}`);
    
    // Check for trailing slash
    if (supabaseUrl.endsWith('/')) {
      console.log(`   ⚠️  WARNING: URL has trailing slash - remove it!`);
    }
  } catch (e) {
    console.log(`   ❌ Invalid URL format: ${e.message}`);
  }
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n2️⃣ NEXT_PUBLIC_SUPABASE_ANON_KEY:');
if (supabaseAnonKey) {
  console.log(`   ✅ SET: ${supabaseAnonKey.substring(0, 30)}...`);
  console.log(`      Length: ${supabaseAnonKey.length} characters`);
  
  // Check if it looks like a Supabase key
  if (supabaseAnonKey.startsWith('sb_publishable_') || supabaseAnonKey.startsWith('eyJ')) {
    console.log(`   ✅ Key format looks valid`);
  } else {
    console.log(`   ⚠️  Key format might be invalid`);
  }
} else {
  console.log('   ❌ NOT SET');
}

console.log('\n' + '='.repeat(60));

// Check .env.local file
console.log('\n📄 Checking .env.local file:');
try {
  const envLocalContent = readFileSync('.env.local', 'utf-8');
  const hasSupabaseUrl = envLocalContent.includes('NEXT_PUBLIC_SUPABASE_URL');
  const hasAnonKey = envLocalContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  console.log(`   File exists: ✅`);
  console.log(`   Contains NEXT_PUBLIC_SUPABASE_URL: ${hasSupabaseUrl ? '✅' : '❌'}`);
  console.log(`   Contains NEXT_PUBLIC_SUPABASE_ANON_KEY: ${hasAnonKey ? '✅' : '❌'}`);
  
  // Check for common issues
  if (envLocalContent.includes('NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:8000')) {
    console.log(`   ✅ Using local Supabase (port 8000)`);
  }
  
} catch (e) {
  console.log(`   ❌ File not found or cannot be read`);
}

console.log('\n' + '='.repeat(60));

// Final check
console.log('\n📊 Summary:');
if (supabaseUrl && supabaseAnonKey) {
  console.log('   ✅ All required variables are set');
  console.log('\n💡 Next steps:');
  console.log('   1. Make sure Next.js dev server is running');
  console.log('   2. If you just updated .env.local, RESTART the dev server');
  console.log('   3. Clear browser cache or use Incognito mode');
  console.log('   4. Check browser console (F12) for errors');
} else {
  console.log('   ❌ Missing required variables');
  console.log('\n💡 To fix:');
  console.log('   1. Run: ./scripts/fix-supabase-keys.sh');
  console.log('   2. Or manually update .env.local');
  console.log('   3. Restart Next.js dev server');
}

console.log('\n');

