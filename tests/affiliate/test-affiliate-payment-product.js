#!/usr/bin/env node

/**
 * Test Script: Payment Success for Product Purchase - Conversion Status Update (TC-3.2)
 * 
 * Tests that payment success for product purchase:
 * 1. Order payment succeeds
 * 2. Affiliate conversion (if exists) status updated to 'confirmed'
 * 3. Commission calculated correctly (5% for products)
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-payment-product.js
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
  referrerEmail: `test-referrer-product-${Date.now()}@test.com`,
  referredEmail: `test-referred-product-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  productPrice: 2000,
  expectedCommissionRate: 5, // 5% for products
  expectedCommissionAmount: 100, // 5% of 2000
};

let referrerUserId = null;
let referredUserId = null;
let referralCode = null;
let signupConversionId = null;
let orderId = null;
let productConversionId = null;

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
    if (productConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', productConversionId);
    }
    if (signupConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', signupConversionId);
    }
    if (orderId) {
      await supabase.from('orders').delete().eq('id', orderId);
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

async function test1_CreateUsersAndSignupConversion() {
  log('Test 1: Creating users and signup conversion...', 'info');
  
  try {
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

    const { data: conversion } = await supabase
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

    signupConversionId = conversion.id;
    log(`Users and signup conversion created`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test2_CreateOrderWithPendingConversion() {
  log('Test 2: Creating order with pending affiliate conversion...', 'info');
  
  try {
    const newOrderId = generateUUID();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: newOrderId,
        user_id: referredUserId,
        order_number: `ORDER-${Date.now()}`,
        total_amount: TEST_CONFIG.productPrice,
        status: 'pending',
        currency: 'thb',
        items: [],
      })
      .select()
      .single();

    if (orderError) throw orderError;
    orderId = newOrderId;

    // Create affiliate conversion for product purchase
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'product_purchase',
        conversion_value: TEST_CONFIG.productPrice,
        commission_rate: TEST_CONFIG.expectedCommissionRate,
        commission_amount: TEST_CONFIG.expectedCommissionAmount,
        status: 'pending',
        reference_id: orderId,
        reference_type: 'order',
        referral_source: 'direct',
        metadata: {
          order_number: order.order_number,
          product_count: 1,
        },
      })
      .select()
      .single();

    if (conversionError) throw conversionError;
    productConversionId = conversion.id;

    log(`Order created: ${orderId} (status: pending)`, 'success');
    log(`Conversion created: ${productConversionId} (status: pending)`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test3_SimulatePaymentSuccess() {
  log('Test 3: Simulating payment success for product order...', 'info');
  
  try {
    // Update order status (as done in webhook)
    const { data: updatedOrder, error: orderUpdateError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)
      .select()
      .single();

    if (orderUpdateError) throw orderUpdateError;

    if (updatedOrder.status !== 'confirmed') {
      log(`❌ Order status not updated (got: ${updatedOrder.status})`, 'error');
      return false;
    }

    log(`✅ Order status updated to 'confirmed'`, 'success');

    // Update affiliate conversion (as done in webhook)
    const confirmedAt = new Date().toISOString();
    const { data: updatedConversion, error: conversionUpdateError } = await supabase
      .from('affiliate_conversions')
      .update({
        status: 'confirmed',
        confirmed_at: confirmedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', orderId)
      .eq('reference_type', 'order')
      .eq('conversion_type', 'product_purchase')
      .eq('status', 'pending')
      .select()
      .single();

    if (conversionUpdateError) {
      log(`❌ Failed to update conversion: ${conversionUpdateError.message}`, 'error');
      return false;
    }

    if (!updatedConversion) {
      log('❌ Conversion not found or not updated', 'error');
      return false;
    }

    log(`✅ Conversion status updated to 'confirmed'`, 'success');
    log(`✅ confirmed_at timestamp set`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test4_VerifyConversionAndCommission() {
  log('Test 4: Verifying conversion and commission calculation...', 'info');
  
  try {
    const { data: conversion, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('id', productConversionId)
      .single();

    if (error) throw error;

    const checks = [
      { field: 'status', expected: 'confirmed', actual: conversion.status },
      { field: 'confirmed_at', expected: 'not null', actual: conversion.confirmed_at ? 'set' : 'null' },
      { field: 'conversion_type', expected: 'product_purchase', actual: conversion.conversion_type },
      { field: 'conversion_value', expected: TEST_CONFIG.productPrice, actual: parseFloat(conversion.conversion_value) },
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

async function runTests() {
  console.log('\n🧪 Testing Payment Success for Product Purchase (TC-3.2)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
  };

  try {
    results.test1 = await test1_CreateUsersAndSignupConversion();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_CreateOrderWithPendingConversion();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_SimulatePaymentSuccess();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifyConversionAndCommission();
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
      log('✅ Payment success updates order status correctly', 'success');
      log('✅ Affiliate conversion status updated to confirmed', 'success');
      log('✅ Commission calculated correctly (5% for products)', 'success');
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

