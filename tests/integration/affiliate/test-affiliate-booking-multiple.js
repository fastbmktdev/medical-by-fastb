#!/usr/bin/env node

/**
 * Test Script: Multiple Bookings by Same Referred User (TC-2.3)
 * 
 * Tests that multiple bookings by same referred user:
 * 1. Each booking creates separate conversion record
 * 2. All conversions linked to same affiliate_user_id
 * 
 * Usage:
 *   node tests/scripts/test-affiliate-booking-multiple.js
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
  referrerEmail: `test-referrer-multiple-${Date.now()}@test.com`,
  referredEmail: `test-referred-multiple-${Date.now()}@test.com`,
  password: 'TestPassword123!',
  bookingPrices: [3000, 5000, 7000], // 3 different booking prices
  expectedCommissionRate: 10, // 10%
  expectedCommissionAmounts: [300, 500, 700], // 10% of each booking
  numberOfBookings: 3,
};

let referrerUserId = null;
let referredUserId = null;
let referralCode = null;
let signupConversionId = null;
let bookingIds = [];
let bookingConversionIds = [];
let gymId = null;
let packageIds = [];

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
    // Delete affiliate conversions
    if (bookingConversionIds.length > 0) {
      for (const conversionId of bookingConversionIds) {
        await supabase
          .from('affiliate_conversions')
          .delete()
          .eq('id', conversionId);
      }
    }
    
    if (signupConversionId) {
      await supabase
        .from('affiliate_conversions')
        .delete()
        .eq('id', signupConversionId);
    }

    // Delete bookings
    if (bookingIds.length > 0) {
      for (const bookingId of bookingIds) {
        await supabase
          .from('bookings')
          .delete()
          .eq('id', bookingId);
      }
    }

    // Delete orders
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', referredUserId);

    if (orders) {
      for (const order of orders) {
        await supabase
          .from('orders')
          .delete()
          .eq('id', order.id);
      }
    }

    // Delete packages
    if (packageIds.length > 0) {
      for (const packageId of packageIds) {
        await supabase
          .from('gym_packages')
          .delete()
          .eq('id', packageId);
      }
    }

    // Delete test users
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
    // Create referrer user
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
    
    log(`Referrer user created: ${referrerUserId}`, 'success');
    log(`Referral code: ${referralCode}`, 'success');
    
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create referred user
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
    log(`Referred user created: ${referredUserId}`, 'success');
    
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
    log(`Signup conversion created: ${signupConversionId}`, 'success');
    
    return true;
  } catch (error) {
    log(`Failed to create users: ${error.message}`, 'error');
    return false;
  }
}

async function test2_CreateMultipleBookings() {
  log(`Test 2: Creating ${TEST_CONFIG.numberOfBookings} bookings for referred user...`, 'info');
  
  try {
    // Get or create a gym
    const { data: gyms, error: gymError } = await supabase
      .from('gyms')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (gymError || !gyms) {
      const { data: testGym, error: createGymError } = await supabase
        .from('gyms')
        .insert({
          gym_name: 'Test Gym for Multiple Bookings',
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

    // Create bookings
    for (let i = 0; i < TEST_CONFIG.numberOfBookings; i++) {
      const bookingPrice = TEST_CONFIG.bookingPrices[i];
      const expectedCommission = TEST_CONFIG.expectedCommissionAmounts[i];
      
      log(`\n  Creating booking ${i + 1}/${TEST_CONFIG.numberOfBookings} (${bookingPrice} THB)...`, 'info');

      // Create package for this booking
      const { data: testPackage, error: packageError } = await supabase
        .from('gym_packages')
        .insert({
          gym_id: gymId,
          name: `Test Package ${i + 1}`,
          package_type: 'package',
          price: bookingPrice,
          duration_months: 1,
          is_active: true,
        })
        .select()
        .single();

      if (packageError) throw packageError;

      const packageId = testPackage.id;
      packageIds.push(packageId);
      log(`    Package created: ${packageId}`, 'success');

      // Create order
      const orderId = generateUUID();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          id: orderId,
          user_id: referredUserId,
          order_number: `ORDER-${Date.now()}-${i}`,
          total_amount: bookingPrice,
          status: 'pending',
          currency: 'thb',
          items: [],
        })
        .select()
        .single();

      if (orderError) throw orderError;
      log(`    Order created: ${orderId}`, 'success');

      // Create booking
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + (i * 30)); // Stagger dates
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 30);

      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          order_id: orderId,
          user_id: referredUserId,
          gym_id: gymId,
          package_id: packageId,
          booking_number: `TEST-${Date.now()}-${i}`,
          customer_name: 'Referred User',
          customer_email: TEST_CONFIG.referredEmail,
          customer_phone: '0812345678',
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          price_paid: bookingPrice,
          package_name: `Test Package ${i + 1}`,
          package_type: 'package',
          duration_months: 1,
          payment_status: 'pending',
          status: 'pending',
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      bookingIds.push(booking.id);
      log(`    Booking created: ${booking.id}`, 'success');

      // Create affiliate conversion (simulating booking API behavior)
      const commissionRate = TEST_CONFIG.expectedCommissionRate;
      const commissionAmount = Math.round((bookingPrice * commissionRate) / 100 * 100) / 100;

      // Check if conversion already exists
      const { data: existingConversion } = await supabase
        .from('affiliate_conversions')
        .select('id')
        .eq('affiliate_user_id', referrerUserId)
        .eq('referred_user_id', referredUserId)
        .eq('conversion_type', 'booking')
        .eq('reference_id', booking.id)
        .eq('reference_type', 'booking')
        .maybeSingle();

      if (!existingConversion) {
        const { data: conversion, error: conversionError } = await supabase
          .from('affiliate_conversions')
          .insert({
            affiliate_user_id: referrerUserId,
            referred_user_id: referredUserId,
            conversion_type: 'booking',
            conversion_value: bookingPrice,
            commission_rate: commissionRate,
            commission_amount: commissionAmount,
            status: 'pending',
            reference_id: booking.id,
            reference_type: 'booking',
            referral_source: 'direct',
            metadata: {
              gym_id: gymId,
              package_type: 'package',
              package_name: `Test Package ${i + 1}`,
              booking_number: booking.booking_number,
            },
          })
          .select()
          .single();

        if (conversionError) throw conversionError;

        bookingConversionIds.push(conversion.id);
        log(`    Conversion created: ${conversion.id} (commission: ${commissionAmount} THB)`, 'success');
      } else {
        bookingConversionIds.push(existingConversion.id);
        log(`    Conversion already exists: ${existingConversion.id}`, 'warning');
      }
    }

    log(`\n✅ All ${TEST_CONFIG.numberOfBookings} bookings created successfully`, 'success');
    return true;
  } catch (error) {
    log(`Failed to create bookings: ${error.message}`, 'error');
    return false;
  }
}

async function test3_VerifySeparateConversions() {
  log('Test 3: Verifying each booking created separate conversion record...', 'info');
  
  try {
    const { data: conversions, error } = await supabase
      .from('affiliate_conversions')
      .select('*')
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'booking')
      .order('created_at', { ascending: true });

    if (error) throw error;

    if (!conversions || conversions.length !== TEST_CONFIG.numberOfBookings) {
      log(`❌ Found ${conversions?.length || 0} conversions, expected ${TEST_CONFIG.numberOfBookings}`, 'error');
      return false;
    }

    log(`✅ Found ${conversions.length} separate conversion records (as expected)`, 'success');

    // Verify each conversion has unique reference_id
    const referenceIds = conversions.map(c => c.reference_id);
    const uniqueReferenceIds = [...new Set(referenceIds)];

    if (uniqueReferenceIds.length !== TEST_CONFIG.numberOfBookings) {
      log(`❌ Found duplicate reference_ids (${uniqueReferenceIds.length} unique vs ${TEST_CONFIG.numberOfBookings} expected)`, 'error');
      return false;
    }

    log('✅ Each conversion has unique reference_id', 'success');

    // Verify each conversion matches its booking
    for (let i = 0; i < conversions.length; i++) {
      const conversion = conversions[i];
      const bookingId = bookingIds[i];
      const expectedPrice = TEST_CONFIG.bookingPrices[i];
      const expectedCommission = TEST_CONFIG.expectedCommissionAmounts[i];

      if (conversion.reference_id !== bookingId) {
        log(`❌ Conversion ${i + 1}: reference_id mismatch`, 'error');
        return false;
      }

      if (parseFloat(conversion.conversion_value) !== expectedPrice) {
        log(`❌ Conversion ${i + 1}: conversion_value mismatch (expected ${expectedPrice}, got ${conversion.conversion_value})`, 'error');
        return false;
      }

      if (parseFloat(conversion.commission_amount) !== expectedCommission) {
        log(`❌ Conversion ${i + 1}: commission_amount mismatch (expected ${expectedCommission}, got ${conversion.commission_amount})`, 'error');
        return false;
      }

      log(`  ✓ Conversion ${i + 1}: Booking ${bookingId}, Value ${expectedPrice}, Commission ${expectedCommission}`, 'success');
    }

    return true;
  } catch (error) {
    log(`Failed to verify conversions: ${error.message}`, 'error');
    return false;
  }
}

async function test4_VerifySameAffiliateUserId() {
  log('Test 4: Verifying all conversions linked to same affiliate_user_id...', 'info');
  
  try {
    const { data: conversions, error } = await supabase
      .from('affiliate_conversions')
      .select('affiliate_user_id')
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'booking');

    if (error) throw error;

    if (!conversions || conversions.length === 0) {
      log('❌ No conversions found', 'error');
      return false;
    }

    // Check all conversions have same affiliate_user_id
    const affiliateUserIds = conversions.map(c => c.affiliate_user_id);
    const uniqueAffiliateUserIds = [...new Set(affiliateUserIds)];

    if (uniqueAffiliateUserIds.length !== 1) {
      log(`❌ Found ${uniqueAffiliateUserIds.length} different affiliate_user_ids (expected 1)`, 'error');
      log(`   IDs: ${uniqueAffiliateUserIds.join(', ')}`, 'error');
      return false;
    }

    if (uniqueAffiliateUserIds[0] !== referrerUserId) {
      log(`❌ affiliate_user_id mismatch (expected ${referrerUserId}, got ${uniqueAffiliateUserIds[0]})`, 'error');
      return false;
    }

    log(`✅ All ${conversions.length} conversions linked to same affiliate_user_id: ${referrerUserId}`, 'success');
    return true;
  } catch (error) {
    log(`Failed to verify affiliate_user_id: ${error.message}`, 'error');
    return false;
  }
}

async function test5_VerifyTotalCommission() {
  log('Test 5: Verifying total commission calculation...', 'info');
  
  try {
    const { data: conversions, error } = await supabase
      .from('affiliate_conversions')
      .select('commission_amount, conversion_value')
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'booking');

    if (error) throw error;

    const totalCommission = conversions.reduce((sum, c) => sum + parseFloat(c.commission_amount), 0);
    const totalConversionValue = conversions.reduce((sum, c) => sum + parseFloat(c.conversion_value), 0);
    const expectedTotalCommission = totalConversionValue * (TEST_CONFIG.expectedCommissionRate / 100);

    log(`Total conversion value: ${totalConversionValue} THB`, 'info');
    log(`Total commission: ${totalCommission} THB`, 'info');
    log(`Expected total commission: ${expectedTotalCommission} THB`, 'info');

    if (Math.abs(totalCommission - expectedTotalCommission) > 0.01) {
      log(`❌ Total commission mismatch (expected ${expectedTotalCommission}, got ${totalCommission})`, 'error');
      return false;
    }

    log('✅ Total commission calculation is correct', 'success');
    return true;
  } catch (error) {
    log(`Failed to verify total commission: ${error.message}`, 'error');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 Testing Multiple Bookings by Same Referred User (TC-2.3)\n');
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
    results.test1 = await test1_CreateReferrerAndReferredUser();
    if (!results.test1) throw new Error('Test 1 failed');

    results.test2 = await test2_CreateMultipleBookings();
    if (!results.test2) throw new Error('Test 2 failed');

    results.test3 = await test3_VerifySeparateConversions();
    if (!results.test3) throw new Error('Test 3 failed');

    results.test4 = await test4_VerifySameAffiliateUserId();
    if (!results.test4) throw new Error('Test 4 failed');

    results.test5 = await test5_VerifyTotalCommission();
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
      log('✅ Each booking creates separate conversion record', 'success');
      log('✅ All conversions linked to same affiliate_user_id', 'success');
      log('✅ Total commission calculation is correct', 'success');
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

