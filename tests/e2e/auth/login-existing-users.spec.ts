import { test, expect } from '@playwright/test';
import {
  loginUser,
  logoutUser,
  takeDebugScreenshot,
} from './helpers';

/**
 * E2E Test: Login with Existing Users (3 Roles)
 * 
 * This test suite is for logging in with EXISTING user accounts
 * that were created from previous test runs.
 * 
 * Usage:
 * 1. Run the main auth-flow.spec.ts first to create test users
 * 2. Copy the email addresses from console output
 * 3. Update the credentials below
 * 4. Run this test to verify login for all 3 roles
 * 
 * Test Coverage:
 * - Regular User login & dashboard access
 * - Partner User login & partner dashboard access  
 * - Admin User login & admin dashboard access
 */

// ⚠️ UPDATE THESE WITH YOUR TEST USER EMAILS
// Copy from the console output of auth-flow.spec.ts
const TEST_USERS = {
  regular: {
    email: 'test_user_1760785430506_r5d8zk@test.com',  // ← UPDATE THIS
    password: 'Test@1234567890',
  },
  partner: {
    email: 'test_partner_1760785430506_jzk62a@test.com',  // ← UPDATE THIS
    password: 'Test@1234567890',
  },
  admin: {
    email: 'test_admin_1760785430506_cxo53j@test.com',  // ← UPDATE THIS
    password: 'Test@1234567890',
  },
};

test.describe('Login with Existing Users - 3 Roles', () => {
  test.describe.configure({ mode: 'serial' });

  test('Test 1: Regular User Login', async ({ page }) => {
    console.log('\n=== Testing Regular User Login ===');
    console.log('Email:', TEST_USERS.regular.email);

    try {
      // Login with regular user credentials
      await loginUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password);

      // Take screenshot after login
      await takeDebugScreenshot(page, 'regular-user-after-login');

      // Verify we're logged in (check for dashboard or user menu)
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);

      // Try to navigate to user dashboard
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      // Take screenshot of dashboard
      await takeDebugScreenshot(page, 'regular-user-dashboard');

      // Verify we're on dashboard
      const dashboardUrl = page.url();
      console.log('Dashboard URL:', dashboardUrl);

      // Check if we can see dashboard content
      const isDashboard = dashboardUrl.includes('/dashboard') && !dashboardUrl.includes('403');
      
      if (isDashboard) {
        console.log('✓ Regular user can access dashboard');
      } else {
        console.log('✗ Regular user cannot access dashboard');
        console.log('  Current URL:', dashboardUrl);
      }

      expect(isDashboard).toBeTruthy();

      // Logout
      await logoutUser(page);
      console.log('✓ Regular user logged out successfully\n');

    } catch (error) {
      console.error('✗ Regular user login failed:', error);
      await takeDebugScreenshot(page, 'regular-user-login-error');
      throw error;
    }
  });

  test('Test 2: Partner User Login', async ({ page }) => {
    console.log('\n=== Testing Partner User Login ===');
    console.log('Email:', TEST_USERS.partner.email);

    try {
      // Login with partner user credentials
      await loginUser(page, TEST_USERS.partner.email, TEST_USERS.partner.password);

      // Take screenshot after login
      await takeDebugScreenshot(page, 'partner-user-after-login');

      // Verify we're logged in
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);

      // Try to navigate to partner dashboard
      await page.goto('/partner/dashboard');
      await page.waitForTimeout(2000);

      // Take screenshot of dashboard
      await takeDebugScreenshot(page, 'partner-user-dashboard');

      // Verify access
      const dashboardUrl = page.url();
      console.log('Dashboard URL:', dashboardUrl);

      // Check if we can access partner dashboard
      const isPartnerDashboard = dashboardUrl.includes('/partner/dashboard') && !dashboardUrl.includes('403');
      const isPartnerApply = dashboardUrl.includes('/partner/apply');

      if (isPartnerDashboard) {
        console.log('✓ Partner user can access partner dashboard');
      } else if (isPartnerApply) {
        console.log('~ Partner user redirected to application page');
        console.log('  (Partner application might still be pending)');
      } else {
        console.log('✗ Partner user cannot access partner dashboard');
        console.log('  Current URL:', dashboardUrl);
      }

      // Partner should be able to access either dashboard or apply page
      const hasPartnerAccess = isPartnerDashboard || isPartnerApply;
      expect(hasPartnerAccess).toBeTruthy();

      // Logout
      await logoutUser(page);
      console.log('✓ Partner user logged out successfully\n');

    } catch (error) {
      console.error('✗ Partner user login failed:', error);
      await takeDebugScreenshot(page, 'partner-user-login-error');
      throw error;
    }
  });

  test('Test 3: Admin User Login', async ({ page }) => {
    console.log('\n=== Testing Admin User Login ===');
    console.log('Email:', TEST_USERS.admin.email);

    try {
      // Login with admin user credentials
      await loginUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password);

      // Take screenshot after login
      await takeDebugScreenshot(page, 'admin-user-after-login');

      // Verify we're logged in
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);

      // Try to navigate to admin dashboard
      await page.goto('/admin/dashboard');
      await page.waitForTimeout(2000);

      // Take screenshot of dashboard
      await takeDebugScreenshot(page, 'admin-user-dashboard');

      // Verify access
      const dashboardUrl = page.url();
      console.log('Dashboard URL:', dashboardUrl);

      // Check if we can access admin dashboard
      const isAdminDashboard = dashboardUrl.includes('/admin/dashboard') && !dashboardUrl.includes('403');

      if (isAdminDashboard) {
        console.log('✓ Admin user can access admin dashboard');
      } else {
        console.log('✗ Admin user cannot access admin dashboard');
        console.log('  Current URL:', dashboardUrl);
        console.log('  ⚠️ Make sure admin role is set in database!');
      }

      expect(isAdminDashboard).toBeTruthy();

      // Logout
      await logoutUser(page);
      console.log('✓ Admin user logged out successfully\n');

    } catch (error) {
      console.error('✗ Admin user login failed:', error);
      await takeDebugScreenshot(page, 'admin-user-login-error');
      throw error;
    }
  });

  test('Test 4: Verify All Users Can Access Their Dashboards', async ({ page }) => {
    console.log('\n=== Final Verification - All Roles ===');

    const results = {
      regular: false,
      partner: false,
      admin: false,
    };

    // Test Regular User
    try {
      await loginUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);
      results.regular = page.url().includes('/dashboard') && !page.url().includes('403');
      await logoutUser(page);
    } catch (error) {
      console.error('Regular user verification failed:', error);
    }

    // Test Partner User
    try {
      await loginUser(page, TEST_USERS.partner.email, TEST_USERS.partner.password);
      await page.goto('/partner/dashboard');
      await page.waitForTimeout(2000);
      const url = page.url();
      results.partner = (url.includes('/partner/dashboard') || url.includes('/partner/apply')) && !url.includes('403');
      await logoutUser(page);
    } catch (error) {
      console.error('Partner user verification failed:', error);
    }

    // Test Admin User
    try {
      await loginUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
      await page.goto('/admin/dashboard');
      await page.waitForTimeout(2000);
      results.admin = page.url().includes('/admin/dashboard') && !page.url().includes('403');
      await logoutUser(page);
    } catch (error) {
      console.error('Admin user verification failed:', error);
    }

    // Print summary
    console.log('\n=== SUMMARY ===');
    console.log('Regular User:', results.regular ? '✓ PASS' : '✗ FAIL');
    console.log('Partner User:', results.partner ? '✓ PASS' : '✗ FAIL');
    console.log('Admin User:', results.admin ? '✓ PASS' : '✗ FAIL');

    // Take final screenshot
    await takeDebugScreenshot(page, 'final-verification-complete');

    // All users should be able to access their respective dashboards
    expect(results.regular).toBeTruthy();
    expect(results.partner).toBeTruthy();
    expect(results.admin).toBeTruthy();

    console.log('\n✓ All roles verified successfully!\n');
  });

  test('Test 5: Test with Username Login (Optional)', async ({ page }) => {
    console.log('\n=== Testing Login with Username ===');

    // Extract username from email (part before @)
    const regularUsername = TEST_USERS.regular.email.split('@')[0];
    console.log('Username:', regularUsername);

    try {
      // Login with username instead of email
      await loginUser(page, regularUsername, TEST_USERS.regular.password);

      // Take screenshot
      await takeDebugScreenshot(page, 'username-login');

      // Verify login
      await page.goto('/dashboard');
      await page.waitForTimeout(2000);

      const dashboardUrl = page.url();
      const canAccessWithUsername = dashboardUrl.includes('/dashboard') && !dashboardUrl.includes('403');

      if (canAccessWithUsername) {
        console.log('✓ Username login works');
      } else {
        console.log('✗ Username login failed');
      }

      expect(canAccessWithUsername).toBeTruthy();

      // Logout
      await logoutUser(page);
      console.log('✓ Logged out successfully\n');

    } catch (error) {
      console.error('Username login test failed:', error);
      await takeDebugScreenshot(page, 'username-login-error');
      throw error;
    }
  });
});

/**
 * Test Suite: Quick Login Test (Individual Tests)
 * Run these individually for quick testing of specific roles
 */

test.describe('Quick Login Tests - Individual', () => {
  test('Quick Test: Regular User Only', async ({ page }) => {
    await loginUser(page, TEST_USERS.regular.email, TEST_USERS.regular.password);
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);
    await takeDebugScreenshot(page, 'quick-regular-user');
    expect(page.url()).toContain('/dashboard');
    console.log('✓ Regular user quick test passed');
  });

  test('Quick Test: Partner User Only', async ({ page }) => {
    await loginUser(page, TEST_USERS.partner.email, TEST_USERS.partner.password);
    await page.goto('/partner/dashboard');
    await page.waitForTimeout(2000);
    await takeDebugScreenshot(page, 'quick-partner-user');
    const url = page.url();
    expect(url.includes('/partner/dashboard') || url.includes('/partner/apply')).toBeTruthy();
    console.log('✓ Partner user quick test passed');
  });

  test('Quick Test: Admin User Only', async ({ page }) => {
    await loginUser(page, TEST_USERS.admin.email, TEST_USERS.admin.password);
    await page.goto('/admin/dashboard');
    await page.waitForTimeout(2000);
    await takeDebugScreenshot(page, 'quick-admin-user');
    expect(page.url()).toContain('/admin/dashboard');
    console.log('✓ Admin user quick test passed');
  });
});

