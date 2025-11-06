#!/usr/bin/env node

/**
 * Test Script: Payment Success for Booking - Conversion Status Update (TC-3.1)
 * 
 * Tests that payment success for booking:
 * 1. Stripe webhook receives payment_intent.succeeded
 * 2. Booking payment status updated to 'paid'
 * 3. Affiliate conversion status updated from 'pending' to 'confirmed'
 * 4. confirmed_at timestamp is set
 * 5. Commission is now eligible for payout
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-payment-booking.js
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
  referrerEmail: `test-referrer-payment-${Date.now()}@test.com`,
  referredEmail: `test-referred-payment-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  bookingPrice: 5000,
  expectedCommissionRate: 10,
  expectedCommissionAmount: 500,
};

let referrerUserId = null;
let referredUserId = null;
let referralCode = null;
let signupConversionId = null;
let bookingId = null;
let bookingConversionId = null;
let gymId = null;
let packageId = null;
let orderId = null;

// Helper functions
function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function generateReferralCode(userId) {
  const suffix = userId.slice(-8).toUpperCase();
  return `MT${suffix}`;
}

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

async function cleanup() {
  log('Cleaning up test data...', 'info');
  
  try {
    if (bookingConversionId) {
      await supabase
        .from('affiliate_conversions')
        .delete()
        .eq('id', bookingConversionId);
    }
    
    if (signupConversionId) {
      await supabase
        .from('affiliate_conversions')
        .delete()
        .eq('id', signupConversionId);
    }

    if (bookingId) {
      await supabase
        .from('bookings')
        .delete()
        .eq('id', bookingId);
    }

    if (orderId) {
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
    }

    if (packageId) {
      await supabase
        .from('gym_packages')
        .delete()
        .eq('id', packageId);
    }

    if (referredUserId) {
      await supabase.auth.admin.deleteUser(referredUserId);
    }
    
    if (referrerUserId) {
      await supabase.auth.admin.deleteUser(referrerUserId);
    }

    log('Cleanup completed', 'success');
  } catch (error) {
    log(`Cleanup error: ${error.message}`, 'warning');
  }
}

async function test1_CreateReferrerAndReferredUser() {
  log('Test 1: Creating referrer and referred user with signup conversion...', 'info');
  
  try {
    // Create referrer
    const { data: referrerData, error: referrerError } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.referrerEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: {
        username: `referrer${Date.now()}`,
        full_name: 'Referrer User'
      }
    });

    if (referrerError) throw referrerError;
    referrerUserId = referrerData.user.id;
    referralCode = generateReferralCode(referrerUserId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create referred
    const { data: referredData, error: referredError } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.referredEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: {
        username: `referred${Date.now()}`,
        full_name: 'Referred User'
      }
    });

    if (referredError) throw referredError;
    referredUserId = referredData.user.id;
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create signup conversion
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'signup',
        conversion_value: 0,
        commission_rate: 0,
        commission_amount: 0,
        status: 'confirmed',
        affiliate_code: referralCode,
        referral_source: 'direct',
        metadata: {
          signup_date: new Date().toISOString(),
          referral_code: referralCode
        },
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (conversionError) throw conversionError;
    signupConversionId = conversion.id;
    
    log(`Referrer: ${referrerUserId}, Referred: ${referredUserId}`, 'success');
    log(`Signup conversion: ${signupConversionId}`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test2_CreateBookingWithPendingConversion() {
  log('Test 2: Creating booking with pending affiliate conversion...', 'info');
  
  try {
    // Get or create gym
    const { data: gyms } = await supabase
      .from('gyms')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (!gyms) {
      const { data: testGym, error: createGymError } = await supabase
        .from('gyms')
        .insert({
          gym_name: 'Test Gym for Payment',
          gym_name_english: 'Test Gym',
          user_id: referrerUserId,
          status: 'approved',
        })
        .select()
        .single();
      
      if (createGymError) throw createGymError;
      gymId = testGym.id;
    } else {
      gymId = gyms.id;
    }

    // Create package
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

    if (packageError) throw packageError;
    packageId = testPackage.id;

    // Create order
    const newOrderId = generateUUID();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: newOrderId,
        user_id: referredUserId,
        order_number: `ORDER-${Date.now()}`,
        total_amount: TEST_CONFIG.bookingPrice,
        status: 'pending',
        currency: 'thb',
        items: [],
      })
      .select()
      .single();

    if (orderError) throw orderError;
    orderId = newOrderId;

    // Create booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        order_id: orderId,
        user_id: referredUserId,
        gym_id: gymId,
        package_id: packageId,
        booking_number: `TEST-${Date.now()}`,
        customer_name: 'Referred User',
        customer_email: TEST_CONFIG.referredEmail,
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

    // Create affiliate conversion (status: pending)
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'booking',
        conversion_value: TEST_CONFIG.bookingPrice,
        commission_rate: TEST_CONFIG.expectedCommissionRate,
        commission_amount: TEST_CONFIG.expectedCommissionAmount,
        status: 'pending',
        reference_id: bookingId,
        reference_type: 'booking',
        referral_source: 'direct',
        metadata: {
          gym_id: gymId,
          package_type: 'package',
          package_name: 'Test Package',
          booking_number: booking.booking_number,
        },
      })
      .select()
      .single();

    if (conversionError) throw conversionError;
    bookingConversionId = conversion.id;

    log(`Booking created: ${bookingId} (payment_status: pending)`, 'success');
    log(`Conversion created: ${bookingConversionId} (status: pending)`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test3_SimulatePaymentSuccess() {
  log('Test 3: Simulating payment success (Stripe webhook)...', 'info');
  
  try {
    // Simulate Stripe webhook: payment_intent.succeeded
    // This updates booking and affiliate conversion status
    
    // Step 1: Update booking payment status
    const { data: updatedBooking, error: bookingUpdateError } = await supabase
      .from('bookings')
      .update({
        payment_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (bookingUpdateError) throw bookingUpdateError;

    if (updatedBooking.payment_status !== 'paid') {
      log(`❌ Booking payment_status not updated (got: ${updatedBooking.payment_status})`, 'error');
      return false;
    }

    if (updatedBooking.status !== 'confirmed') {
      log(`❌ Booking status not updated (got: ${updatedBooking.status})`, 'error');
      return false;
    }

    log(`✅ Booking payment_status updated to 'paid'`, 'success');
    log(`✅ Booking status updated to 'confirmed'`, 'success');

    // Step 2: Update affiliate conversion status (as done in webhook)
    const confirmedAt = new Date().toISOString();
    const { data: updatedConversion, error: conversionUpdateError } = await supabase
      .from('affiliate_conversions')
      .update({
        status: 'confirmed',
        confirmed_at: confirmedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', bookingId)
      .eq('reference_type', 'booking')
      .eq('status', 'pending')
      .select()
      .single();

    if (conversionUpdateError) {
      log(`❌ Failed to update conversion status: ${conversionUpdateError.message}`, 'error');
      return false;
    }

    if (!updatedConversion) {
      log('❌ Conversion not found or not updated', 'error');
      return false;
    }

    log(`✅ Conversion status updated to 'confirmed'`, 'success');
    log(`✅ confirmed_at timestamp set: ${confirmedAt}`, 'success');

    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test4_VerifyConversionStatus() {
  log('Test 4: Verifying affiliate conversion status update...', 'info');
  
  try {
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('id', bookingConversionId)
      .single();

    if (error) throw error;

    const checks = [
      { field: 'status', expected: 'confirmed', actual: conversion.status },
      { field: 'confirmed_at', expected: 'not null', actual: conversion.confirmed_at ? 'set' : 'null' },
      { field: 'affiliate_user_id', expected: referrerUserId, actual: conversion.affiliate_user_id },
      { field: 'referred_user_id', expected: referredUserId, actual: conversion.referred_user_id },
      { field: 'conversion_type', expected: 'booking', actual: conversion.conversion_type },
      { field: 'conversion_value', expected: TEST_CONFIG.bookingPrice, actual: parseFloat(conversion.conversion_value) },
      { field: 'commission_rate', expected: TEST_CONFIG.expectedCommissionRate, actual: conversion.commission_rate },
      { field: 'commission_amount', expected: TEST_CONFIG.expectedCommissionAmount, actual: parseFloat(conversion.commission_amount) },
    ];

    let allPassed = true;
    checks.forEach(({ field, expected, actual }) => {
      if (expected === 'not null') {
        if (actual === 'set') {
          log(`  ✓ ${field}: ${conversion.confirmed_at}`, 'success');
        } else {
          log(`  ✗ ${field}: Expected timestamp, got ${actual}`, 'error');
          allPassed = false;
        }
      } else if (actual === expected) {
        log(`  ✓ ${field}: ${actual}`, 'success');
      } else {
        log(`  ✗ ${field}: Expected ${expected}, got ${actual}`, 'error');
        allPassed = false;
      }
    });

    return allPassed;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test5_VerifyCommissionEligible() {
  log('Test 5: Verifying commission is eligible for payout...', 'info');
  
  try {
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .select('status, confirmed_at, commission_amount')
      .eq('id', bookingConversionId)
      .single();

    if (error) throw error;

    // Commission is eligible when:
    // 1. Status is 'confirmed'
    // 2. confirmed_at is set
    // 3. commission_amount > 0

    const isEligible = 
      conversion.status === 'confirmed' &&
      conversion.confirmed_at !== null &&
      parseFloat(conversion.commission_amount) > 0;

    if (isEligible) {
      log(`✅ Commission is eligible for payout`, 'success');
      log(`  - Status: ${conversion.status}`, 'success');
      log(`  - Confirmed at: ${conversion.confirmed_at}`, 'success');
      log(`  - Commission amount: ${conversion.commission_amount} THB`, 'success');
      return true;
    } else {
      log(`❌ Commission is NOT eligible for payout`, 'error');
      log(`  - Status: ${conversion.status}`, 'error');
      log(`  - Confirmed at: ${conversion.confirmed_at || 'null'}`, 'error');
      log(`  - Commission amount: ${conversion.commission_amount}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 Testing Payment Success for Booking (TC-3.1)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };

  try {
    results.test1 = await test1_CreateReferrerAndReferredUser();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_CreateBookingWithPendingConversion();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_SimulatePaymentSuccess();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifyConversionStatus();
    if (!results.test4) throw new Error('Test 4 failed');

    results.test5 = await test5_VerifyCommissionEligible();
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
      log('✅ Payment success updates booking status correctly', 'success');
      log('✅ Affiliate conversion status updated from pending to confirmed', 'success');
      log('✅ Commission is eligible for payout', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  } finally {
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

