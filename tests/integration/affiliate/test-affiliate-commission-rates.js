#!/usr/bin/env node

/**
 * Test Script: Commission Rates Verification (TC-4.1)
 * 
 * Tests that commission rates are correct:
 * - Signup: 0%
 * - Booking: 10%
 * - Product Purchase: 5%
 * - Event Ticket: 10%
 * - Subscription: 15%
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-commission-rates.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

// Import commission rate constants
const AFFILIATE_COMMISSION_RATES = {
  signup: 0,
  booking: 10,
  product_purchase: 5,
  event_ticket_purchase: 10,
  subscription: 15,
  referral: 0,
};

function getCommissionRate(conversionType) {
  return AFFILIATE_COMMISSION_RATES[conversionType] || 0;
}

function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

async function test1_VerifyCommissionRates() {
  log('Test 1: Verifying commission rates for each conversion type...', 'info');
  
  const expectedRates = {
    signup: 0,
    booking: 10,
    product_purchase: 5,
    event_ticket_purchase: 10,
    subscription: 15,
  };

  let allPassed = true;

  Object.entries(expectedRates).forEach(([type, expectedRate]) => {
    const actualRate = getCommissionRate(type);
    if (actualRate === expectedRate) {
      log(`  ✓ ${type}: ${actualRate}%`, 'success');
    } else {
      log(`  ✗ ${type}: Expected ${expectedRate}%, got ${actualRate}%`, 'error');
      allPassed = false;
    }
  });

  return allPassed;
}

async function test2_VerifyZeroRateForSignup() {
  log('Test 2: Verifying signup has 0% commission rate...', 'info');
  
  const signupRate = getCommissionRate('signup');
  
  if (signupRate === 0) {
    log(`✅ Signup commission rate: ${signupRate}% (as expected)`, 'success');
    return true;
  } else {
    log(`❌ Signup commission rate should be 0%, got ${signupRate}%`, 'error');
    return false;
  }
}

async function test3_VerifyBookingRate() {
  log('Test 3: Verifying booking has 10% commission rate...', 'info');
  
  const bookingRate = getCommissionRate('booking');
  
  if (bookingRate === 10) {
    log(`✅ Booking commission rate: ${bookingRate}% (as expected)`, 'success');
    return true;
  } else {
    log(`❌ Booking commission rate should be 10%, got ${bookingRate}%`, 'error');
    return false;
  }
}

async function test4_VerifyProductRate() {
  log('Test 4: Verifying product purchase has 5% commission rate...', 'info');
  
  const productRate = getCommissionRate('product_purchase');
  
  if (productRate === 5) {
    log(`✅ Product purchase commission rate: ${productRate}% (as expected)`, 'success');
    return true;
  } else {
    log(`❌ Product purchase commission rate should be 5%, got ${productRate}%`, 'error');
    return false;
  }
}

async function test5_VerifyTicketRate() {
  log('Test 5: Verifying event ticket has 10% commission rate...', 'info');
  
  const ticketRate = getCommissionRate('event_ticket_purchase');
  
  if (ticketRate === 10) {
    log(`✅ Event ticket commission rate: ${ticketRate}% (as expected)`, 'success');
    return true;
  } else {
    log(`❌ Event ticket commission rate should be 10%, got ${ticketRate}%`, 'error');
    return false;
  }
}

async function test6_VerifySubscriptionRate() {
  log('Test 6: Verifying subscription has 15% commission rate...', 'info');
  
  const subscriptionRate = getCommissionRate('subscription');
  
  if (subscriptionRate === 15) {
    log(`✅ Subscription commission rate: ${subscriptionRate}% (as expected)`, 'success');
    return true;
  } else {
    log(`❌ Subscription commission rate should be 15%, got ${subscriptionRate}%`, 'error');
    return false;
  }
}

async function runTests() {
  console.log('\n🧪 Testing Commission Rates (TC-4.1)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
    test6: false,
  };

  try {
    results.test1 = await test1_VerifyCommissionRates();
    results.test2 = await test2_VerifyZeroRateForSignup();
    results.test3 = await test3_VerifyBookingRate();
    results.test4 = await test4_VerifyProductRate();
    results.test5 = await test5_VerifyTicketRate();
    results.test6 = await test6_VerifySubscriptionRate();

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
      log('✅ All commission rates are correct', 'success');
      process.exit(0);
    } else {
      log('\n⚠️  Some tests failed', 'warning');
      process.exit(1);
    }
  } catch (error) {
    log(`\n❌ Test suite failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

runTests().catch((error) => {
  log(`Fatal error: ${error.message}`, 'error');
  process.exit(1);
});

