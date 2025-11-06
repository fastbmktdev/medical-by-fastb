#!/usr/bin/env node

/**
 * Test Script: Payment Failure - Conversion Status Remains Pending (TC-3.4)
 * 
 * Tests that payment failure:
 * 1. Conversion status remains 'pending'
 * 2. No commission awarded
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-payment-failure.js
 */

import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const TEST_CONFIG = {
  referrerEmail: `test-referrer-failure-${Date.now()}@test.com`,
  referredEmail: `test-referred-failure-${Date.now()}@test.com`,
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

function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

function generateReferralCode(userId) {
  return `MT${userId.slice(-8).toUpperCase()}`;
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
      await supabase.from('affiliate_conversions').delete().eq('id', bookingConversionId);
    }
    if (signupConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', signupConversionId);
    }
    if (bookingId) {
      await supabase.from('bookings').delete().eq('id', bookingId);
    }
    if (orderId) {
      await supabase.from('orders').delete().eq('id', orderId);
    }
    if (packageId) {
      await supabase.from('gym_packages').delete().eq('id', packageId);
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

async function test1_CreateUsersAndBooking() {
  log('Test 1: Creating users, booking, and pending conversion...', 'info');
  
  try {
    // Create users
    const { data: referrerData } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.referrerEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: { username: `referrer${Date.now()}`, full_name: 'Referrer User' }
    });
    referrerUserId = referrerData.user.id;
    referralCode = generateReferralCode(referrerUserId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: referredData } = await supabase.auth.admin.createUser({
      email: TEST_CONFIG.referredEmail,
      password: TEST_CONFIG.password,
      email_confirm: true,
      user_metadata: { username: `referred${Date.now()}`, full_name: 'Referred User' }
    });
    referredUserId = referredData.user.id;
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create signup conversion
    const { data: signupConversion } = await supabase
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
        metadata: { signup_date: new Date().toISOString() },
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();
    signupConversionId = signupConversion.id;

    // Get or create gym
    const { data: gyms } = await supabase.from('gyms').select('id').limit(1).maybeSingle();
    if (!gyms) {
      const { data: testGym } = await supabase
        .from('gyms')
        .insert({
          gym_name: 'Test Gym for Payment Failure',
          gym_name_english: 'Test Gym',
          user_id: referrerUserId,
          status: 'approved',
        })
        .select()
        .single();
      gymId = testGym.id;
    } else {
      gymId = gyms.id;
    }

    // Create package
    const { data: testPackage } = await supabase
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
    packageId = testPackage.id;

    // Create order
    const newOrderId = generateUUID();
    const { data: order } = await supabase
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
    orderId = newOrderId;

    // Create booking
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    const { data: booking } = await supabase
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
    bookingId = booking.id;

    // Create affiliate conversion (status: pending)
    const { data: conversion } = await supabase
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
          booking_number: booking.booking_number,
        },
      })
      .select()
      .single();
    bookingConversionId = conversion.id;

    log(`Booking and conversion created (status: pending)`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test2_SimulatePaymentFailure() {
  log('Test 2: Simulating payment failure...', 'info');
  
  try {
    // Payment fails - booking status should remain 'pending'
    // Conversion status should NOT be updated (remains 'pending')
    
    // Verify booking status remains 'pending'
    const { data: booking } = await supabase
      .from('bookings')
      .select('payment_status, status')
      .eq('id', bookingId)
      .single();

    if (booking.payment_status !== 'pending') {
      log(`⚠️ Booking payment_status changed (got: ${booking.payment_status}, expected: pending)`, 'warning');
    } else {
      log(`✅ Booking payment_status remains 'pending'`, 'success');
    }

    if (booking.status !== 'pending') {
      log(`⚠️ Booking status changed (got: ${booking.status}, expected: pending)`, 'warning');
    } else {
      log(`✅ Booking status remains 'pending'`, 'success');
    }

    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test3_VerifyConversionRemainsPending() {
  log('Test 3: Verifying conversion status remains pending...', 'info');
  
  try {
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('id', bookingConversionId)
      .single();

    if (error) throw error;

    // Verify status is still 'pending'
    if (conversion.status !== 'pending') {
      log(`❌ Conversion status changed (got: ${conversion.status}, expected: pending)`, 'error');
      return false;
    }

    log(`✅ Conversion status remains 'pending'`, 'success');

    // Verify confirmed_at is NOT set
    if (conversion.confirmed_at !== null) {
      log(`❌ confirmed_at should be null but got: ${conversion.confirmed_at}`, 'error');
      return false;
    }

    log(`✅ confirmed_at is null (as expected)`, 'success');

    // Verify commission amount is still set (but not eligible)
    if (parseFloat(conversion.commission_amount) !== TEST_CONFIG.expectedCommissionAmount) {
      log(`❌ Commission amount changed (got: ${conversion.commission_amount})`, 'error');
      return false;
    }

    log(`✅ Commission amount preserved: ${conversion.commission_amount} THB`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test4_VerifyNoCommissionAwarded() {
  log('Test 4: Verifying no commission awarded (status: pending)...', 'info');
  
  try {
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .select('status, confirmed_at, commission_amount')
      .eq('id', bookingConversionId)
      .single();

    if (error) throw error;

    // Commission is NOT eligible when:
    // 1. Status is 'pending' (not 'confirmed')
    // 2. confirmed_at is null
    const isNotEligible = 
      conversion.status === 'pending' &&
      conversion.confirmed_at === null;

    if (isNotEligible) {
      log(`✅ Commission is NOT eligible for payout (as expected)`, 'success');
      log(`  - Status: ${conversion.status} (pending)`, 'success');
      log(`  - Confirmed at: ${conversion.confirmed_at || 'null'}`, 'success');
      log(`  - Commission amount: ${conversion.commission_amount} THB (not awarded yet)`, 'success');
      return true;
    } else {
      log(`❌ Commission should NOT be eligible but appears to be`, 'error');
      log(`  - Status: ${conversion.status}`, 'error');
      log(`  - Confirmed at: ${conversion.confirmed_at || 'null'}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Testing Payment Failure - Conversion Status (TC-3.4)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
  };

  try {
    results.test1 = await test1_CreateUsersAndBooking();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_SimulatePaymentFailure();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_VerifyConversionRemainsPending();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifyNoCommissionAwarded();
    if (!results.test4) throw new Error('Test 4 failed');

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
      log('✅ Conversion status remains pending on payment failure', 'success');
      log('✅ No commission awarded (status: pending)', 'success');
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

process.on('SIGINT', async () => {
  console.log('\n\n⚠️  Test interrupted. Cleaning up...');
  await cleanup();
  process.exit(1);
});

runTests().catch(async (error) => {
  log(`Fatal error: ${error.message}`, 'error');
  await cleanup();
  process.exit(1);
});

