#!/usr/bin/env node

/**
 * Test Script: Zero Value Conversions (TC-4.3)
 * 
 * Tests that zero value conversions:
 * - Signup (0 value) → 0 commission
 * - Free booking → 0 commission
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-commission-zero.js
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

const AFFILIATE_COMMISSION_RATES = {
  signup: 0,
  booking: 10,
  product_purchase: 5,
  event_ticket_purchase: 10,
  subscription: 15,
};

function getCommissionRate(conversionType) {
  return AFFILIATE_COMMISSION_RATES[conversionType] || 0;
}

function calculateCommissionAmount(conversionValue, commissionRate) {
  return Math.round((conversionValue * commissionRate) / 100 * 100) / 100;
}

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

let referrerUserId = null;
let referredUserId = null;
let signupConversionId = null;
let bookingConversionId = null;

async function cleanup() {
  log('Cleaning up test data...', 'info');
  
  try {
    if (bookingConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', bookingConversionId);
    }
    if (signupConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', signupConversionId);
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

async function test1_VerifySignupZeroCommission() {
  log('Test 1: Verifying signup (0 value) → 0 commission...', 'info');
  
  try {
    // Create users
    const { data: referrerData } = await supabase.auth.admin.createUser({
      email: `test-referrer-zero-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { username: `referrer${Date.now()}`, full_name: 'Referrer User' }
    });
    referrerUserId = referrerData.user.id;
    const referralCode = generateReferralCode(referrerUserId);
    await new Promise(resolve => setTimeout(resolve, 1000));

    const { data: referredData } = await supabase.auth.admin.createUser({
      email: `test-referred-zero-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { username: `referred${Date.now()}`, full_name: 'Referred User' }
    });
    referredUserId = referredData.user.id;
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create signup conversion with 0 value
    const conversionValue = 0;
    const commissionRate = getCommissionRate('signup');
    const commissionAmount = calculateCommissionAmount(conversionValue, commissionRate);

    const { data: conversion } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'signup',
        conversion_value: conversionValue,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'confirmed',
        affiliate_code: referralCode,
        referral_source: 'direct',
        metadata: { signup_date: new Date().toISOString() },
        confirmed_at: new Date().toISOString()
      })
      .select()
      .single();

    signupConversionId = conversion.id;

    // Verify commission is 0
    if (conversion.commission_amount === 0 && conversion.commission_rate === 0) {
      log(`✅ Signup conversion: ${conversionValue} THB → ${commissionAmount} THB commission (${commissionRate}%)`, 'success');
      return true;
    } else {
      log(`❌ Signup commission should be 0, got ${conversion.commission_amount}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test2_VerifyFreeBookingZeroCommission() {
  log('Test 2: Verifying free booking (0 value) → 0 commission...', 'info');
  
  try {
    // Create conversion for free booking (0 value)
    const conversionValue = 0;
    const commissionRate = getCommissionRate('booking'); // 10% rate
    const commissionAmount = calculateCommissionAmount(conversionValue, commissionRate);

    const { data: conversion } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'booking',
        conversion_value: conversionValue,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        status: 'pending',
        reference_id: generateUUID(),
        reference_type: 'booking',
        referral_source: 'direct',
        metadata: {
          booking_number: `FREE-${Date.now()}`,
          is_free: true,
        },
      })
      .select()
      .single();

    bookingConversionId = conversion.id;

    // Verify commission is 0 (even though rate is 10%)
    if (conversion.commission_amount === 0) {
      log(`✅ Free booking: ${conversionValue} THB × ${commissionRate}% = ${commissionAmount} THB commission`, 'success');
      return true;
    } else {
      log(`❌ Free booking commission should be 0, got ${conversion.commission_amount}`, 'error');
      return false;
    }
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test3_VerifyZeroValueCalculation() {
  log('Test 3: Verifying zero value calculation logic...', 'info');
  
  const testCases = [
    { value: 0, rate: 10, expected: 0, description: 'Zero value with 10% rate' },
    { value: 0, rate: 5, expected: 0, description: 'Zero value with 5% rate' },
    { value: 0, rate: 15, expected: 0, description: 'Zero value with 15% rate' },
    { value: 0, rate: 0, expected: 0, description: 'Zero value with 0% rate' },
  ];

  let allPassed = true;

  testCases.forEach(({ value, rate, expected, description }) => {
    const calculated = calculateCommissionAmount(value, rate);
    
    if (calculated === expected) {
      log(`  ✓ ${description}: ${value} THB × ${rate}% = ${calculated} THB`, 'success');
    } else {
      log(`  ✗ ${description}: Expected ${expected} THB, got ${calculated} THB`, 'error');
      allPassed = false;
    }
  });

  return allPassed;
}

async function runTests() {
  console.log('\n🧪 Testing Zero Value Conversions (TC-4.3)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
  };

  try {
    results.test1 = await test1_VerifySignupZeroCommission();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_VerifyFreeBookingZeroCommission();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_VerifyZeroValueCalculation();
    if (!results.test3) throw new Error('Test 3 failed');

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
      log('✅ Signup (0 value) → 0 commission', 'success');
      log('✅ Free booking → 0 commission', 'success');
      log('✅ Zero value calculation works correctly', 'success');
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

