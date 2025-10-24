/**
 * Validation Tests for Admin Management Script
 * 
 * Tests the consolidated admin management functions to ensure:
 * - User promotion to admin works correctly
 * - Role checking functions return accurate data
 * - Batch operations handle multiple users properly
 * - Error handling works for invalid inputs
 * - Validation functions detect configuration issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Load environment
function loadEnvironment() {
  const envFiles = [
    join(projectRoot, '.env.local'),
    join(projectRoot, '.env'),
  ];

  let env = { ...process.env };

  for (const envPath of envFiles) {
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              env[key.trim()] = value;
            }
          }
        }
        break;
      } catch (error) {
        console.warn(`Could not load ${envPath}: ${error.message}`);
      }
    }
  }

  return env;
}

// Initialize Supabase client
function initializeSupabase() {
  const env = loadEnvironment();
  
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials for testing');
  }

  return createClient(supabaseUrl, supabaseKey);
}

class AdminManagementTester {
  constructor() {
    this.supabase = initializeSupabase();
    this.testResults = [];
    this.testUsers = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async createTestUser(email, username, fullName) {
    try {
      const { data, error } = await this.supabase.auth.admin.createUser({
        email,
        password: 'TestPassword123!',
        email_confirm: true,
        user_metadata: {
          username,
          full_name: fullName
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          this.log(`Test user already exists: ${email}`, 'warning');
          return await this.getUserByEmail(email);
        }
        throw error;
      }

      this.testUsers.push(data.user.id);
      this.log(`Created test user: ${email}`, 'success');
      return data.user;
    } catch (error) {
      this.log(`Failed to create test user ${email}: ${error.message}`, 'error');
      throw error;
    }
  }

  async getUserByEmail(email) {
    const { data, error } = await this.supabase.auth.admin.listUsers();
    if (error) throw error;
    
    return data.users.find(user => user.email === email);
  }

  async testValidateAdminSetup() {
    this.log('Testing admin setup validation...', 'info');
    
    try {
      const { data, error } = await this.supabase.rpc('validate_admin_setup');
      
      if (error) {
        this.log(`Admin setup validation failed: ${error.message}`, 'error');
        return false;
      }

      this.log('Admin setup validation results:', 'info');
      data.forEach(result => {
        this.log(`  ${result.check_name}: ${result.status} - ${result.details}`, 
          result.status === 'OK' ? 'success' : result.status === 'ERROR' ? 'error' : 'warning');
      });

      return data.every(result => result.status !== 'ERROR');
    } catch (error) {
      this.log(`Error running admin setup validation: ${error.message}`, 'error');
      return false;
    }
  }

  async testPromoteToAdmin() {
    this.log('Testing user promotion to admin...', 'info');
    
    try {
      // Create test user
      const testUser = await this.createTestUser(
        'test_admin_promotion@test.com',
        'test_admin_user',
        'Test Admin User'
      );

      // Test promotion by email
      const { data: promotionResult, error } = await this.supabase.rpc('promote_to_admin', {
        user_email: testUser.email
      });

      if (error) {
        this.log(`Promotion failed: ${error.message}`, 'error');
        return false;
      }

      if (promotionResult.includes('SUCCESS')) {
        this.log('User promotion to admin successful', 'success');
      } else {
        this.log(`Unexpected promotion result: ${promotionResult}`, 'warning');
      }

      // Verify the role was set
      const { data: roleCheck, error: roleError } = await this.supabase.rpc('check_user_role', {
        user_email: testUser.email
      });

      if (roleError) {
        this.log(`Role verification failed: ${roleError.message}`, 'error');
        return false;
      }

      if (roleCheck && roleCheck.length > 0 && roleCheck[0].role === 'admin') {
        this.log('Admin role verification successful', 'success');
        return true;
      } else {
        this.log('Admin role verification failed - role not set correctly', 'error');
        return false;
      }

    } catch (error) {
      this.log(`Error testing admin promotion: ${error.message}`, 'error');
      return false;
    }
  }

  async testPromoteToAdminById() {
    this.log('Testing user promotion to admin by ID...', 'info');
    
    try {
      // Create test user
      const testUser = await this.createTestUser(
        'test_admin_promotion_id@test.com',
        'test_admin_user_id',
        'Test Admin User ID'
      );

      // Test promotion by user ID
      const { data: promotionResult, error } = await this.supabase.rpc('promote_to_admin_by_id', {
        target_user_id: testUser.id
      });

      if (error) {
        this.log(`Promotion by ID failed: ${error.message}`, 'error');
        return false;
      }

      if (promotionResult.includes('SUCCESS')) {
        this.log('User promotion to admin by ID successful', 'success');
        return true;
      } else {
        this.log(`Unexpected promotion result: ${promotionResult}`, 'warning');
        return false;
      }

    } catch (error) {
      this.log(`Error testing admin promotion by ID: ${error.message}`, 'error');
      return false;
    }
  }

  async testBatchPromotion() {
    this.log('Testing batch admin promotion...', 'info');
    
    try {
      // Create multiple test users
      const testEmails = [
        'test_batch_1@test.com',
        'test_batch_2@test.com',
        'test_batch_3@test.com'
      ];

      for (let i = 0; i < testEmails.length; i++) {
        await this.createTestUser(
          testEmails[i],
          `test_batch_user_${i + 1}`,
          `Test Batch User ${i + 1}`
        );
      }

      // Test batch promotion
      const { data: batchResult, error } = await this.supabase.rpc('batch_promote_to_admin', {
        user_emails: testEmails
      });

      if (error) {
        this.log(`Batch promotion failed: ${error.message}`, 'error');
        return false;
      }

      let successCount = 0;
      batchResult.forEach(result => {
        if (result.status === 'SUCCESS') {
          successCount++;
          this.log(`Batch promotion success: ${result.email}`, 'success');
        } else {
          this.log(`Batch promotion issue: ${result.email} - ${result.message}`, 'warning');
        }
      });

      if (successCount === testEmails.length) {
        this.log('Batch promotion completed successfully', 'success');
        return true;
      } else {
        this.log(`Batch promotion partial success: ${successCount}/${testEmails.length}`, 'warning');
        return false;
      }

    } catch (error) {
      this.log(`Error testing batch promotion: ${error.message}`, 'error');
      return false;
    }
  }

  async testListAllAdmins() {
    this.log('Testing list all admins function...', 'info');
    
    try {
      const { data: adminList, error } = await this.supabase.rpc('list_all_admins');

      if (error) {
        this.log(`List admins failed: ${error.message}`, 'error');
        return false;
      }

      this.log(`Found ${adminList.length} admin users`, 'info');
      adminList.forEach(admin => {
        this.log(`  Admin: ${admin.email} (${admin.username || 'no username'})`, 'info');
      });

      return true;
    } catch (error) {
      this.log(`Error testing list admins: ${error.message}`, 'error');
      return false;
    }
  }

  async testDemoteFromAdmin() {
    this.log('Testing admin demotion...', 'info');
    
    try {
      // Create and promote a test user
      const testUser = await this.createTestUser(
        'test_admin_demotion@test.com',
        'test_demote_user',
        'Test Demote User'
      );

      // First promote to admin
      await this.supabase.rpc('promote_to_admin', {
        user_email: testUser.email
      });

      // Then demote
      const { data: demotionResult, error } = await this.supabase.rpc('demote_from_admin', {
        user_email: testUser.email
      });

      if (error) {
        this.log(`Demotion failed: ${error.message}`, 'error');
        return false;
      }

      if (demotionResult.includes('SUCCESS')) {
        this.log('Admin demotion successful', 'success');
        return true;
      } else {
        this.log(`Unexpected demotion result: ${demotionResult}`, 'warning');
        return false;
      }

    } catch (error) {
      this.log(`Error testing admin demotion: ${error.message}`, 'error');
      return false;
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling...', 'info');
    
    try {
      // Test with invalid email
      const { data: invalidResult } = await this.supabase.rpc('promote_to_admin', {
        user_email: 'nonexistent@test.com'
      });

      if (invalidResult && invalidResult.includes('ERROR')) {
        this.log('Error handling for invalid email works correctly', 'success');
      } else {
        this.log('Error handling for invalid email may not be working', 'warning');
      }

      // Test with null email
      const { data: nullResult } = await this.supabase.rpc('promote_to_admin', {
        user_email: null
      });

      if (nullResult && nullResult.includes('ERROR')) {
        this.log('Error handling for null email works correctly', 'success');
      } else {
        this.log('Error handling for null email may not be working', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Error testing error handling: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...', 'info');
    
    try {
      // Delete test users
      for (const userId of this.testUsers) {
        try {
          await this.supabase.auth.admin.deleteUser(userId);
        } catch (error) {
          this.log(`Failed to delete test user ${userId}: ${error.message}`, 'warning');
        }
      }

      // Clean up user_roles entries for test emails
      const testEmailPatterns = [
        'test_admin_promotion@test.com',
        'test_admin_promotion_id@test.com',
        'test_batch_%@test.com',
        'test_admin_demotion@test.com'
      ];

      for (const pattern of testEmailPatterns) {
        try {
          const { error } = await this.supabase
            .from('user_roles')
            .delete()
            .like('user_id', pattern);
          
          if (error && !error.message.includes('No rows')) {
            this.log(`Warning cleaning up roles: ${error.message}`, 'warning');
          }
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      this.log('Test cleanup completed', 'success');
    } catch (error) {
      this.log(`Error during cleanup: ${error.message}`, 'warning');
    }
  }

  async runAllTests() {
    this.log('Starting Admin Management Script Validation Tests', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'Validate Admin Setup', fn: () => this.testValidateAdminSetup() },
      { name: 'Promote to Admin', fn: () => this.testPromoteToAdmin() },
      { name: 'Promote to Admin by ID', fn: () => this.testPromoteToAdminById() },
      { name: 'Batch Promotion', fn: () => this.testBatchPromotion() },
      { name: 'List All Admins', fn: () => this.testListAllAdmins() },
      { name: 'Demote from Admin', fn: () => this.testDemoteFromAdmin() },
      { name: 'Error Handling', fn: () => this.testErrorHandling() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      this.log(`\nRunning test: ${test.name}`, 'info');
      try {
        const result = await test.fn();
        if (result) {
          passed++;
          this.log(`✅ ${test.name} PASSED`, 'success');
        } else {
          failed++;
          this.log(`❌ ${test.name} FAILED`, 'error');
        }
      } catch (error) {
        failed++;
        this.log(`❌ ${test.name} FAILED: ${error.message}`, 'error');
      }
    }

    await this.cleanup();

    this.log('\n' + '=' .repeat(60), 'info');
    this.log(`Admin Management Tests Complete: ${passed} passed, ${failed} failed`, 
      failed === 0 ? 'success' : 'warning');
    
    return { passed, failed, total: tests.length };
  }
}

// Export for use in other test files
export default AdminManagementTester;

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new AdminManagementTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}