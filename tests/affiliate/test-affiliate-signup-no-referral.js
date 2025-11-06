#!/usr/bin/env node

/**
 * Test Script: Affiliate Signup Without Referral Code (TC-1.3)
 * 
 * Tests that signup without referral code:
 * 1. Does NOT create affiliate_conversion record
 * 2. Signup completes normally
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-signup-no-referral.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env.local') });

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test configuration
const TEST_CONFIG = {
  userEmail: `test-no-referral-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  username: `testuser${Date.now()}`,
};

let userId = null;

// Helper functions
function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

async function cleanup() {
  log('Cleaning up test data...', 'info');
  
  try {
    // Delete affiliate conversions (shouldn't exist, but just in case)
    if (userId) {
      await supabase
        .from('affiliate_conversions')
        .delete()
        .eq('referred_user_id', userId);
    }

    // Delete test user
    if (userId) {
      await supabase.auth.admin.deleteUser(userId);
    }

    log('Cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'warning');
  }
}

// Test functions
async function test1_CreateUserWithoutReferral() {
  log('Test 1: Creating user without referral code...', 'info');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.userEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: {
        username: TEST_CONFIG.username,
        full_name: 'Test User No Referral'
      }
    });

    if (error) throw error;

    userId = data.user.id;
    log(`User created: ${userId}`, 'success');
    
    // Wait for profile creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  } catch (error) {
    log(`Failed to create user: ${error.message}`, 'error');
    return false;
  }
}

async function test2_VerifyNoAffiliateConversion() {
  log('Test 2: Verifying NO affiliate conversion record created...', 'info');
  
  try {
    const { data: conversions, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('referred_user_id', userId);

    if (error) throw error;

    if (conversions && conversions.length > 0) {
      log(`❌ Found ${conversions.length} affiliate conversion(s) - should be 0!`, 'error');
      conversions.forEach(conv => {
        log(`  - Conversion ID: ${conv.id}, Type: ${conv.conversion_type}`, 'error');
      });
      return false;
    }

    log('✅ No affiliate conversion records found (as expected)', 'success');
    return true;
  } catch (error) {
    log(`Failed to verify conversions: ${error.message}`, 'error');
    return false;
  }
}

async function test3_VerifyUserExists() {
  log('Test 3: Verifying user exists and can be queried...', 'info');
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;

    if (!profile) {
      log('❌ User profile not found', 'error');
      return false;
    }

    log(`✅ User profile exists: ${profile.full_name || profile.username}`, 'success');
    
    // Verify user role
    const { data: roleData, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .maybeSingle();

    if (roleError) {
      log(`⚠️ Role check warning: ${roleError.message}`, 'warning');
    } else if (roleData) {
      log(`✅ User role: ${roleData.role}`, 'success');
    }

    return true;
  } catch (error) {
    log(`Failed to verify user: ${error.message}`, 'error');
    return false;
  }
}

async function test4_VerifySignupCompleted() {
  log('Test 4: Verifying signup completed normally...', 'info');
  
  try {
    // Check if user can authenticate
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: TEST_CONFIG.userEmail,
      password: TEST_CONFIG.password
    });

    if (authError) {
      log(`❌ User cannot authenticate: ${authError.message}`, 'error');
      return false;
    }

    if (authData.user && authData.user.id === userId) {
      log('✅ User can authenticate successfully', 'success');
      return true;
    }

    log('❌ User authentication returned different user ID', 'error');
    return false;
  } catch (error) {
    log(`Failed to verify authentication: ${error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 Testing Signup Without Referral Code (TC-1.3)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
  };

  try {
    // Run tests in sequence
    results.test1 = await test1_CreateUserWithoutReferral();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_VerifyNoAffiliateConversion();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_VerifyUserExists();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifySignupCompleted();
    if (!results.test4) throw new Error('Test 4 failed');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(60));
    
    const passed = Object.values(results).filter(r => r).length;
    const total = Object.keys(results).length;
    
    Object.entries(results).forEach(([test, passed]) => {
      const status = passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test}`);
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${passed}/${total} tests passed`);
    
    if (passed === total) {
      log('\n🎉 All tests passed!', 'success');
      log('✅ Signup without referral code works correctly', 'success');
      log('✅ No affiliate conversion record created', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
    // Cleanup
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted. Cleaning up...');
  await cleanup();
  process.exit(1);
});

// Run tests
runTests().catch(async (error) => {
  log(`Fatal error: ${error.message}`, 'error');
  await cleanup();
  process.exit(1);
});

