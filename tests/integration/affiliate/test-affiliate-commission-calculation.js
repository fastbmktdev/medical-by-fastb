#!/usr/bin/env node

/**
 * Test Script: Commission Amount Calculation (TC-4.2)
 * 
 * Tests that commission amount calculation is correct:
 * - Booking: 1000 THB → 100 THB commission (10%)
 * - Product: 500 THB → 25 THB commission (5%)
 * - Event Ticket: 2000 THB → 200 THB commission (10%)
 * - Rounding to 2 decimal places
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-commission-calculation.js
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

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

function calculateCommissionAmount(conversionValue, commissionRate) {
  return Math.round((conversionValue * commissionRate) / 100 * 100) / 100; // Round to 2 decimal places
}

function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

async function test1_CalculateBookingCommission() {
  log('Test 1: Calculating commission for booking (10%)...', 'info');
  
  const bookingValue = 1000;
  const commissionRate = getCommissionRate('booking');
  const commissionAmount = calculateCommissionAmount(bookingValue, commissionRate);
  const expectedAmount = 100;

  if (commissionAmount === expectedAmount) {
    log(`  ✓ ${bookingValue} THB → ${commissionAmount} THB commission (${commissionRate}%)`, 'success');
    return true;
  } else {
    log(`  ✗ Expected ${expectedAmount} THB, got ${commissionAmount} THB`, 'error');
    return false;
  }
}

async function test2_CalculateProductCommission() {
  log('Test 2: Calculating commission for product purchase (5%)...', 'info');
  
  const productValue = 500;
  const commissionRate = getCommissionRate('product_purchase');
  const commissionAmount = calculateCommissionAmount(productValue, commissionRate);
  const expectedAmount = 25;

  if (commissionAmount === expectedAmount) {
    log(`  ✓ ${productValue} THB → ${commissionAmount} THB commission (${commissionRate}%)`, 'success');
    return true;
  } else {
    log(`  ✗ Expected ${expectedAmount} THB, got ${commissionAmount} THB`, 'error');
    return false;
  }
}

async function test3_CalculateTicketCommission() {
  log('Test 3: Calculating commission for event ticket (10%)...', 'info');
  
  const ticketValue = 2000;
  const commissionRate = getCommissionRate('event_ticket_purchase');
  const commissionAmount = calculateCommissionAmount(ticketValue, commissionRate);
  const expectedAmount = 200;

  if (commissionAmount === expectedAmount) {
    log(`  ✓ ${ticketValue} THB → ${commissionAmount} THB commission (${commissionRate}%)`, 'success');
    return true;
  } else {
    log(`  ✗ Expected ${expectedAmount} THB, got ${commissionAmount} THB`, 'error');
    return false;
  }
}

async function test4_TestRounding() {
  log('Test 4: Testing rounding to 2 decimal places...', 'info');
  
  const testCases = [
    { value: 1000, rate: 10, expected: 100.0 },
    { value: 3333, rate: 10, expected: 333.3 },
    { value: 1234.56, rate: 10, expected: 123.46 },
    { value: 999.99, rate: 5, expected: 50.0 },
    { value: 1999.99, rate: 15, expected: 300.0 },
  ];

  let allPassed = true;

  testCases.forEach(({ value, rate, expected }) => {
    const calculated = calculateCommissionAmount(value, rate);
    const rounded = Math.round(calculated * 100) / 100;
    
    if (rounded === expected || Math.abs(rounded - expected) < 0.01) {
      log(`  ✓ ${value} THB × ${rate}% = ${rounded} THB`, 'success');
    } else {
      log(`  ✗ ${value} THB × ${rate}% = ${rounded} THB (expected ${expected} THB)`, 'error');
      allPassed = false;
    }
  });

  return allPassed;
}

async function test5_TestEdgeCases() {
  log('Test 5: Testing edge cases...', 'info');
  
  const edgeCases = [
    { value: 0, rate: 10, expected: 0, description: 'Zero value' },
    { value: 1, rate: 10, expected: 0.1, description: 'Minimum value' },
    { value: 1000000, rate: 10, expected: 100000, description: 'Large value' },
    { value: 100, rate: 0, expected: 0, description: 'Zero rate' },
    { value: 100, rate: 100, expected: 100, description: '100% rate' },
  ];

  let allPassed = true;

  edgeCases.forEach(({ value, rate, expected, description }) => {
    const calculated = calculateCommissionAmount(value, rate);
    
    if (Math.abs(calculated - expected) < 0.01) {
      log(`  ✓ ${description}: ${value} THB × ${rate}% = ${calculated} THB`, 'success');
    } else {
      log(`  ✗ ${description}: Expected ${expected} THB, got ${calculated} THB`, 'error');
      allPassed = false;
    }
  });

  return allPassed;
}

async function runTests() {
  console.log('\n🧪 Testing Commission Amount Calculation (TC-4.2)\n');
  console.log('='.repeat(60));
  
  const results = {
    test1: false,
    test2: false,
    test3: false,
    test4: false,
    test5: false,
  };

  try {
    results.test1 = await test1_CalculateBookingCommission();
    results.test2 = await test2_CalculateProductCommission();
    results.test3 = await test3_CalculateTicketCommission();
    results.test4 = await test4_TestRounding();
    results.test5 = await test5_TestEdgeCases();

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
      log('✅ Commission amount calculation is correct', 'success');
      log('✅ Rounding to 2 decimal places works correctly', 'success');
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

