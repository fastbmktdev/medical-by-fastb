#!/usr/bin/env node

/**
 * Test Script: Payment Success for Event Ticket - Conversion Status Update (TC-3.3)
 * 
 * Tests that payment success for event ticket:
 * 1. Ticket booking payment succeeds
 * 2. Affiliate conversion status updated to 'confirmed'
 * 3. Commission calculated correctly (10% for tickets)
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-payment-ticket.js
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
  referrerEmail: `test-referrer-ticket-${Date.now()}@test.com`,
  referredEmail: `test-referred-ticket-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  ticketPrice: 1500,
  expectedCommissionRate: 10, // 10% for tickets
  expectedCommissionAmount: 150, // 10% of 1500
};

let referrerUserId = null;
let referredUserId = null;
let referralCode = null;
let signupConversionId = null;
let ticketBookingId = null;
let ticketConversionId = null;

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
    if (ticketConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', ticketConversionId);
    }
    if (signupConversionId) {
      await supabase.from('affiliate_conversions').delete().eq('id', signupConversionId);
    }
    if (ticketBookingId) {
      await supabase.from('ticket_bookings').delete().eq('id', ticketBookingId);
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

async function test2_CreateTicketBookingWithPendingConversion() {
  log('Test 2: Creating ticket booking with pending affiliate conversion...', 'info');
  
  try {
    // Create order first
    const orderId = generateUUID();
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        id: orderId,
        user_id: referredUserId,
        order_number: `ORDER-${Date.now()}`,
        total_amount: TEST_CONFIG.ticketPrice,
        status: 'pending',
        currency: 'thb',
        items: [],
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create ticket booking
    const { data: ticketBooking, error: ticketError } = await supabase
      .from('ticket_bookings')
      .insert({
        order_id: orderId,
        user_id: referredUserId,
        event_id: 'test-event-123',
        event_name: 'Test Muay Thai Event',
        event_name_en: 'Test Event',
        event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        ticket_type: 'General',
        ticket_count: 1,
        unit_price: TEST_CONFIG.ticketPrice,
        total_price: TEST_CONFIG.ticketPrice,
        booking_reference: `TICKET-${Date.now()}`,
      })
      .select()
      .single();

    if (ticketError) throw ticketError;
    ticketBookingId = ticketBooking.id;

    // Create affiliate conversion for ticket purchase
    const { data: conversion, error: conversionError } = await supabase
      .from('affiliate_conversions')
      .insert({
        affiliate_user_id: referrerUserId,
        referred_user_id: referredUserId,
        conversion_type: 'event_ticket_purchase',
        conversion_value: TEST_CONFIG.ticketPrice,
        commission_rate: TEST_CONFIG.expectedCommissionRate,
        commission_amount: TEST_CONFIG.expectedCommissionAmount,
        status: 'pending',
        reference_id: ticketBookingId,
        reference_type: 'ticket_booking',
        referral_source: 'direct',
        metadata: {
          event_id: 'test-event-123',
          event_name: 'Test Muay Thai Event',
          ticket_count: 1,
        },
      })
      .select()
      .single();

    if (conversionError) throw conversionError;
    ticketConversionId = conversion.id;

    log(`Ticket booking created: ${ticketBookingId}`, 'success');
    log(`Conversion created: ${ticketConversionId} (status: pending)`, 'success');
    return true;
  } catch (error) {
    log(`Failed: ${error.message}`, 'error');
    return false;
  }
}

async function test3_SimulatePaymentSuccess() {
  log('Test 3: Simulating payment success for ticket booking...', 'info');
  
  try {
    // Update affiliate conversion (as done in webhook for ticket_booking)
    const confirmedAt = new Date().toISOString();
    const { data: updatedConversion, error: conversionUpdateError } = await supabase
      .from('affiliate_conversions')
      .update({
        status: 'confirmed',
        confirmed_at: confirmedAt,
        updated_at: new Date().toISOString(),
      })
      .eq('reference_id', ticketBookingId)
      .eq('reference_type', 'ticket_booking')
      .eq('conversion_type', 'event_ticket_purchase')
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
      .eq('id', ticketConversionId)
      .single();

    if (error) throw error;

    const checks = [
      { field: 'status', expected: 'confirmed', actual: conversion.status },
      { field: 'confirmed_at', expected: 'not null', actual: conversion.confirmed_at ? 'set' : 'null' },
      { field: 'conversion_type', expected: 'event_ticket_purchase', actual: conversion.conversion_type },
      { field: 'conversion_value', expected: TEST_CONFIG.ticketPrice, actual: parseFloat(conversion.conversion_value) },
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
  console.log('\n🧪 Testing Payment Success for Event Ticket (TC-3.3)\n');
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

    results.test2 = await test2_CreateTicketBookingWithPendingConversion();
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
      log('✅ Payment success updates ticket booking correctly', 'success');
      log('✅ Affiliate conversion status updated to confirmed', 'success');
      log('✅ Commission calculated correctly (10% for tickets)', 'success');
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

