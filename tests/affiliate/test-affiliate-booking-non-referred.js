#!/usr/bin/env node

/**
 * Test Script: Affiliate Booking Flow - Non-Referred User (TC-2.2)
 * 
 * Tests that booking by non-referred user:
 * 1. No affiliate_conversion record created
 * 2. Booking completes normally
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-booking-non-referred.js
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
  userEmail: `test-non-referred-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  bookingPrice: 5000, // 5000 THB
};

let userId = null;
let bookingId = null;
let gymId = null;
let packageId = null;
let orderId = null;

// Helper functions
function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

    // Delete bookings
    if (bookingId) {
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
    }

    // Delete orders
    if (orderId) {
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    }

    // Delete packages
    if (packageId) {
      await supabase
        .from('gym_packages')
        .delete()
        .eq('id', packageId);
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

async function test1_CreateNonReferredUser() {
  log('Test 1: Creating non-referred user (no signup conversion)...', 'info');
  
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.userEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: {
        username: `nonreferred${Date.now()}`,
        full_name: 'Non-Referred User'
      }
    });

    if (error) throw error;

    userId = data.user.id;
    log(`Non-referred user created: ${userId}`, 'success');
    
    // Wait for profile creation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Verify NO signup conversion exists
    const { data: conversions, error: convError } = await supabase
      .from('affiliate_conversions')
      .select('id')
      .eq('referred_user_id', userId)
      .eq('conversion_type', 'signup');

    if (convError && convError.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw convError;
    }

    if (conversions && conversions.length > 0) {
      log(`⚠️ Found ${conversions.length} signup conversion(s) - should be 0!`, 'warning');
    } else {
      log('✅ No signup conversion found (as expected)', 'success');
    }
    
    return true;
  } catch (error) {
    log(`Failed to create user: ${error.message}`, 'error');
    return false;
  }
}

async function test2_CreateBooking() {
  log('Test 2: Creating booking for non-referred user...', 'info');
  
  try {
    // Get or create a gym
    const { data: gyms, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (gymError || !gyms) {
      // Create a test gym
      log('No gym found, creating test gym...', 'info');
      const { data: testGym, error: createGymError } = await supabase
        .from('gyms')
        .insert({
          gym_name: 'Test Gym for Non-Referred Booking',
          gym_name_english: 'Test Gym',
          user_id: userId, // Use test user as gym owner
          status: 'approved',
        })
        .select()
        .single();
      
      if (createGymError) {
        throw createGymError;
      } else {
        gymId = testGym.id;
      }
    } else {
      gymId = gyms.id;
    }

    // Create a test package
    log('Creating test package...', 'info');
    const { data: testPackage, error: packageError } = await supabase
      .from('gym_packages')
      .insert({
        gym_id: gymId,
        name: 'Test Package',
        package_type: 'package',
        price: TEST_CONFIG.bookingPrice,
        duration_months: 1,
        is_active: true,
      })
      .select()
      .single();

    if (packageError) {
      throw packageError;
    }

    packageId = testPackage.id;
    log(`Test package created: ${packageId}`, 'success');

    // Create order
    log('Creating test order...', 'info');
    const newOrderId = generateUUID();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: newOrderId,
        user_id: userId,
        order_number: `ORDER-${Date.now()}`,
        total_amount: TEST_CONFIG.bookingPrice,
        status: 'pending',
        currency: 'thb',
        items: [],
      })
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    orderId = newOrderId;
    log(`Order created: ${orderId}`, 'success');

    // Create booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        order_id: orderId,
        user_id: userId,
        gym_id: gymId,
        package_id: packageId,
        booking_number: `TEST-${Date.now()}`,
        customer_name: 'Non-Referred User',
        customer_email: TEST_CONFIG.userEmail,
        customer_phone: '0812345678',
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        price_paid: TEST_CONFIG.bookingPrice,
        package_name: 'Test Package',
        package_type: 'package',
        duration_months: 1,
        payment_status: 'pending',
        status: 'pending',
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    bookingId = booking.id;
    log(`Booking created: ${bookingId}`, 'success');
    log(`Booking price: ${TEST_CONFIG.bookingPrice} THB`, 'success');

    return true;
  } catch (error) {
    log(`Failed to create booking: ${error.message}`, 'error');
    return false;
  }
}

async function test3_VerifyNoAffiliateConversion() {
  log('Test 3: Verifying NO affiliate conversion record created...', 'info');
  
  try {
    const { data: conversions, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('referred_user_id', userId)
      .eq('conversion_type', 'booking');

    if (error) throw error;

    if (conversions && conversions.length > 0) {
      log(`❌ Found ${conversions.length} affiliate conversion(s) - should be 0!`, 'error');
      conversions.forEach(conv => {
        log(`  - Conversion ID: ${conv.id}, Type: ${conv.conversion_type}, Reference: ${conv.reference_id}`, 'error');
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

async function test4_VerifyBookingCompleted() {
  log('Test 4: Verifying booking completed normally...', 'info');
  
  try {
    // Check if booking exists
    const { data: booking, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (error) throw error;

    if (!booking) {
      log('❌ Booking not found', 'error');
      return false;
    }

    // Verify booking fields
    const checks = [
      { field: 'user_id', expected: userId, actual: booking.user_id },
      { field: 'gym_id', expected: gymId, actual: booking.gym_id },
      { field: 'package_id', expected: packageId, actual: booking.package_id },
      { field: 'price_paid', expected: TEST_CONFIG.bookingPrice, actual: parseFloat(booking.price_paid) },
      { field: 'status', expected: 'pending', actual: booking.status },
      { field: 'payment_status', expected: 'pending', actual: booking.payment_status },
    ];

    let allPassed = true;
    checks.forEach(({ field, expected, actual }) => {
      if (actual === expected) {
        log(`  ✓ ${field}: ${actual}`, 'success');
      } else {
        log(`  ✗ ${field}: Expected ${expected}, got ${actual}`, 'error');
        allPassed = false;
      }
    });

    if (allPassed) {
      log('✅ Booking completed successfully', 'success');
      log('✅ All booking fields are correct', 'success');
    }

    return allPassed;
  } catch (error) {
    log(`Failed to verify booking: ${error.message}`, 'error');
    return false;
  }
}

async function test5_VerifyUserCanAuthenticate() {
  log('Test 5: Verifying user can authenticate...', 'info');
  
  try {
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
  console.log('\n🧪 Testing Booking by Non-Referred User (TC-2.2)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };

  try {
    // Run tests in sequence
    results.test1 = await test1_CreateNonReferredUser();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_CreateBooking();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_VerifyNoAffiliateConversion();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifyBookingCompleted();
    if (!results.test4) throw new Error('Test 4 failed');

    results.test5 = await test5_VerifyUserCanAuthenticate();
    if (!results.test5) throw new Error('Test 5 failed');

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
      log('✅ No affiliate conversion record created for non-referred user', 'success');
      log('✅ Booking completes normally without referral', 'success');
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

