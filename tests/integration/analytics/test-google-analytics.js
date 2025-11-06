#!/usr/bin/env node

/**
 * Test Script: Google Analytics Integration (TC-5.1)
 * 
 * Tests the Google Analytics utility functions:
 * 1. Function exports and structure
 * 2. Parameter validation
 * 3. Function signatures
 * 4. Component structure
 * 
 * Usage:
 *   node tests/scripts/test-google-analytics.js
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_CONFIG = {
  analyticsUtilsPath: join(__dirname, '../../src/lib/utils/analytics.ts'),
  analyticsComponentPath: join(__dirname, '../../src/components/shared/analytics/GoogleAnalytics.tsx'),
};

// Test results
let testResults = {
  passed: 0,
  failed: 0,
  tests: [],
};

/**
 * Test helper functions
 */
function pass(testName, details = '') {
  testResults.passed++;
  testResults.tests.push({ name: testName, status: 'PASS', details });
  console.log(`✅   ✓ ${testName}${details ? `: ${details}` : ''}`);
}

function fail(testName, reason = '') {
  testResults.failed++;
  testResults.tests.push({ name: testName, status: 'FAIL', details: reason });
  console.log(`❌   ✗ ${testName}${reason ? `: ${reason}` : ''}`);
}

function info(message) {
  console.log(`ℹ️ ${message}`);
}

/**
 * Test functions
 */
function test1_CheckAnalyticsUtilsFile() {
  info('Test 1: Checking analytics.ts file exists and has correct structure...');
  
  try {
    const content = readFileSync(TEST_CONFIG.analyticsUtilsPath, 'utf-8');
    
    // Check if file exists and has content
    if (!content || content.length === 0) {
      fail('test1_file_exists', 'File is empty');
      return;
    }
    pass('test1_file_exists');
    
    // Check for required function exports
    const requiredFunctions = [
      'trackPageView',
      'trackEvent',
      'trackConversion',
      'trackBookingCompletion',
      'trackPaymentSuccess',
      'trackUserSignup',
      'trackUserLogin',
      'trackSearch',
      'trackProductView',
      'isAnalyticsAvailable',
    ];
    
    let allFunctionsFound = true;
    for (const funcName of requiredFunctions) {
      const exportPattern = new RegExp(`export\\s+(function|const|async\\s+function)\\s+${funcName}`, 'i');
      if (!exportPattern.test(content)) {
        fail(`test1_function_${funcName}`, `Function ${funcName} not found or not exported`);
        allFunctionsFound = false;
      } else {
        pass(`test1_function_${funcName}`);
      }
    }
    
    // Check for gtag declaration
    if (!content.includes('gtag') || !content.includes('Window')) {
      fail('test1_gtag_declaration', 'gtag declaration not found');
    } else {
      pass('test1_gtag_declaration');
    }
    
    // Check for window check (typeof window === 'undefined')
    if (!content.includes("typeof window === 'undefined'")) {
      fail('test1_window_check', 'Window check not found (SSR safety)');
    } else {
      pass('test1_window_check');
    }
    
    // Check for NEXT_PUBLIC_GA_MEASUREMENT_ID usage
    if (!content.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID')) {
      fail('test1_env_var', 'NEXT_PUBLIC_GA_MEASUREMENT_ID not used');
    } else {
      pass('test1_env_var');
    }
    
  } catch (error) {
    fail('test1_file_read', `Error reading file: ${error.message}`);
  }
}

function test2_CheckAnalyticsComponent() {
  info('Test 2: Checking GoogleAnalytics component file exists and has correct structure...');
  
  try {
    const content = readFileSync(TEST_CONFIG.analyticsComponentPath, 'utf-8');
    
    // Check if file exists and has content
    if (!content || content.length === 0) {
      fail('test2_file_exists', 'File is empty');
      return;
    }
    pass('test2_file_exists');
    
    // Check for GoogleAnalytics component export
    if (!content.includes('export function GoogleAnalytics') && !content.includes('export const GoogleAnalytics')) {
      fail('test2_component_export', 'GoogleAnalytics component not exported');
    } else {
      pass('test2_component_export');
    }
    
    // Check for @next/third-parties/google import
    if (!content.includes('@next/third-parties/google')) {
      fail('test2_third_parties', '@next/third-parties/google not imported');
    } else {
      pass('test2_third_parties');
    }
    
    // Check for NEXT_PUBLIC_GA_MEASUREMENT_ID usage
    if (!content.includes('NEXT_PUBLIC_GA_MEASUREMENT_ID')) {
      fail('test2_env_var', 'NEXT_PUBLIC_GA_MEASUREMENT_ID not used');
    } else {
      pass('test2_env_var');
    }
    
    // Check for "use client" directive
    if (!content.includes('"use client"') && !content.includes("'use client'")) {
      fail('test2_client_directive', '"use client" directive not found');
    } else {
      pass('test2_client_directive');
    }
    
  } catch (error) {
    fail('test2_file_read', `Error reading file: ${error.message}`);
  }
}

function test3_CheckFunctionSignatures() {
  info('Test 3: Checking function signatures and parameters...');
  
  try {
    const content = readFileSync(TEST_CONFIG.analyticsUtilsPath, 'utf-8');
    
    // Check trackPageView signature
    const trackPageViewPattern = /trackPageView\s*\([^)]*url:\s*string[^)]*\)/;
    if (!trackPageViewPattern.test(content)) {
      fail('test3_trackPageView_signature', 'trackPageView signature incorrect');
    } else {
      pass('test3_trackPageView_signature');
    }
    
    // Check trackEvent signature
    const trackEventPattern = /trackEvent\s*\([^)]*eventName:\s*string[^)]*\)/;
    if (!trackEventPattern.test(content)) {
      fail('test3_trackEvent_signature', 'trackEvent signature incorrect');
    } else {
      pass('test3_trackEvent_signature');
    }
    
    // Check trackConversion signature
    const trackConversionPattern = /trackConversion\s*\([^)]*\)/;
    if (!trackConversionPattern.test(content)) {
      fail('test3_trackConversion_signature', 'trackConversion signature incorrect');
    } else {
      pass('test3_trackConversion_signature');
    }
    
    // Check trackBookingCompletion signature
    const trackBookingPattern = /trackBookingCompletion\s*\([^)]*bookingId:\s*string[^)]*\)/;
    if (!trackBookingPattern.test(content)) {
      fail('test3_trackBookingCompletion_signature', 'trackBookingCompletion signature incorrect');
    } else {
      pass('test3_trackBookingCompletion_signature');
    }
    
    // Check trackPaymentSuccess signature
    const trackPaymentPattern = /trackPaymentSuccess\s*\([^)]*paymentId:\s*string[^)]*\)/;
    if (!trackPaymentPattern.test(content)) {
      fail('test3_trackPaymentSuccess_signature', 'trackPaymentSuccess signature incorrect');
    } else {
      pass('test3_trackPaymentSuccess_signature');
    }
    
    // Check isAnalyticsAvailable signature
    const isAnalyticsPattern = /isAnalyticsAvailable\s*\([^)]*\):\s*boolean/;
    if (!isAnalyticsPattern.test(content)) {
      fail('test3_isAnalyticsAvailable_signature', 'isAnalyticsAvailable signature incorrect');
    } else {
      pass('test3_isAnalyticsAvailable_signature');
    }
    
  } catch (error) {
    fail('test3_file_read', `Error reading file: ${error.message}`);
  }
}

function test4_CheckIntegrationInLayout() {
  info('Test 4: Checking GoogleAnalytics integration in layout.tsx...');
  
  try {
    const layoutPath = join(__dirname, '../../src/app/layout.tsx');
    const content = readFileSync(layoutPath, 'utf-8');
    
    // Check for GoogleAnalytics import
    if (!content.includes('GoogleAnalytics') && !content.includes('from') && !content.includes('analytics')) {
      fail('test4_import', 'GoogleAnalytics not imported in layout');
    } else {
      // More specific check
      const importPattern = /import.*GoogleAnalytics.*from.*analytics/i;
      if (!importPattern.test(content)) {
        fail('test4_import_specific', 'GoogleAnalytics import pattern not found');
      } else {
        pass('test4_import');
      }
    }
    
    // Check for GoogleAnalytics component usage
    if (!content.includes('<GoogleAnalytics') && !content.includes('GoogleAnalytics />')) {
      fail('test4_usage', 'GoogleAnalytics component not used in layout');
    } else {
      pass('test4_usage');
    }
    
  } catch (error) {
    fail('test4_file_read', `Error reading file: ${error.message}`);
  }
}

function test5_CheckEventTrackingFunctions() {
  info('Test 5: Checking event tracking functions have correct structure...');
  
  try {
    const content = readFileSync(TEST_CONFIG.analyticsUtilsPath, 'utf-8');
    
    // Check for booking_completed event
    if (!content.includes('booking_completed')) {
      fail('test5_booking_event', 'booking_completed event not found');
    } else {
      pass('test5_booking_event');
    }
    
    // Check for payment_success event
    if (!content.includes('payment_success')) {
      fail('test5_payment_event', 'payment_success event not found');
    } else {
      pass('test5_payment_event');
    }
    
    // Check for sign_up event
    if (!content.includes('sign_up')) {
      fail('test5_signup_event', 'sign_up event not found');
    } else {
      pass('test5_signup_event');
    }
    
    // Check for login event
    if (!content.includes("'login'") && !content.includes('"login"')) {
      fail('test5_login_event', 'login event not found');
    } else {
      pass('test5_login_event');
    }
    
    // Check for search event
    if (!content.includes("'search'") && !content.includes('"search"')) {
      fail('test5_search_event', 'search event not found');
    } else {
      pass('test5_search_event');
    }
    
    // Check for view_item event
    if (!content.includes('view_item')) {
      fail('test5_product_view_event', 'view_item event not found');
    } else {
      pass('test5_product_view_event');
    }
    
  } catch (error) {
    fail('test5_file_read', `Error reading file: ${error.message}`);
  }
}

/**
 * Run all tests
 */
function runTests() {
  console.log('\n🧪 Testing Google Analytics Integration (TC-5.1)\n');
  console.log('============================================================');
  
  test1_CheckAnalyticsUtilsFile();
  test2_CheckAnalyticsComponent();
  test3_CheckFunctionSignatures();
  test4_CheckIntegrationInLayout();
  test5_CheckEventTrackingFunctions();
  
  console.log('\n============================================================');
  console.log('📊 Test Results Summary');
  console.log('============================================================');
  
  testResults.tests.forEach((test) => {
    if (test.status === 'PASS') {
      console.log(`✅ PASS ${test.name}`);
    } else {
      console.log(`❌ FAIL ${test.name}: ${test.details}`);
    }
  });
  
  console.log('\n============================================================');
  console.log(`Total: ${testResults.passed}/${testResults.passed + testResults.failed} tests passed`);
  
  if (testResults.failed === 0) {
    console.log('✅ ');
    console.log('🎉 All tests passed!');
    console.log('✅ ✅ Google Analytics integration structure is correct');
    console.log('\n📝 Note: This test verifies code structure only.');
    console.log('   For actual GA tracking verification, you need to:');
    console.log('   1. Set NEXT_PUBLIC_GA_MEASUREMENT_ID in .env.local');
    console.log('   2. Run the app and check Google Analytics dashboard');
    console.log('   3. Use browser DevTools → Network tab to verify gtag calls\n');
    process.exit(0);
  } else {
    console.log('❌ ');
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  }
}

// Run tests
runTests();

