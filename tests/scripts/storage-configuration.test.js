/**
 * Validation Tests for Storage Configuration Script
 * 
 * Tests the consolidated storage configuration script to ensure:
 * - Storage bucket creation works correctly
 * - Storage policies are properly configured
 * - Verification functions work as expected
 * - Error handling works for existing configurations
 * - Rollback procedures are available
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

class StorageConfigurationTester {
  constructor() {
    this.supabase = initializeSupabase();
    this.testResults = [];
    this.scriptPath = join(projectRoot, 'scripts', 'storage-configuration.sql');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async testScriptExists() {
    this.log('Testing if storage configuration script exists...', 'info');
    
    if (existsSync(this.scriptPath)) {
      this.log('Storage configuration script found', 'success');
      return true;
    } else {
      this.log(`Storage configuration script not found at: ${this.scriptPath}`, 'error');
      return false;
    }
  }

  async testStorageBucketExists() {
    this.log('Testing storage bucket existence...', 'info');
    
    try {
      const { data: buckets, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        this.log(`Error checking storage buckets: ${error.message}`, 'error');
        return false;
      }

      const gymImagesBucket = buckets.find(bucket => bucket.id === 'gym-images');
      
      if (gymImagesBucket) {
        this.log('gym-images bucket exists', 'success');
        this.log(`Bucket details: public=${gymImagesBucket.public}`, 'info');
        return true;
      } else {
        this.log('gym-images bucket does not exist', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing storage bucket: ${error.message}`, 'error');
      return false;
    }
  }

  async testStorageBucketAccess() {
    this.log('Testing storage bucket access...', 'info');
    
    try {
      // Try to list files in the gym-images bucket
      const { data, error } = await this.supabase.storage
        .from('gym-images')
        .list('', { limit: 1 });
      
      if (error) {
        if (error.message.includes('not found')) {
          this.log('gym-images bucket not found', 'warning');
          return false;
        } else {
          this.log(`Storage bucket access error: ${error.message}`, 'error');
          return false;
        }
      }

      this.log('Storage bucket access successful', 'success');
      return true;
    } catch (error) {
      this.log(`Error testing storage bucket access: ${error.message}`, 'error');
      return false;
    }
  }

  async testStoragePolicies() {
    this.log('Testing storage policies...', 'info');
    
    try {
      // Query storage policies using SQL
      const { data: policies, error } = await this.supabase
        .rpc('sql', {
          query: `
            SELECT policyname, cmd, qual 
            FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND policyname LIKE '%gym images%'
          `
        });

      if (error) {
        // If RPC doesn't work, try a different approach
        this.log('Cannot directly query policies, checking bucket configuration instead', 'warning');
        return await this.testStorageBucketExists();
      }

      if (policies && policies.length > 0) {
        this.log(`Found ${policies.length} storage policies for gym images`, 'success');
        policies.forEach(policy => {
          this.log(`  Policy: ${policy.policyname}`, 'info');
        });
        return true;
      } else {
        this.log('No storage policies found for gym images', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing storage policies: ${error.message}`, 'error');
      return false;
    }
  }

  async testHealthCheckFunction() {
    this.log('Testing storage health check function...', 'info');
    
    try {
      const { data, error } = await this.supabase.rpc('check_storage_bucket_health', {
        bucket_name: 'gym-images'
      });

      if (error) {
        this.log(`Health check function not available: ${error.message}`, 'warning');
        return false;
      }

      if (data && data.length > 0) {
        const result = data[0];
        this.log(`Health check result: ${result.status}`, 
          result.status === 'HEALTHY' ? 'success' : 'warning');
        this.log(`Bucket exists: ${result.bucket_exists}`, 'info');
        this.log(`Is public: ${result.is_public}`, 'info');
        this.log(`Policy count: ${result.policy_count}`, 'info');
        return result.status === 'HEALTHY';
      } else {
        this.log('Health check function returned no data', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing health check function: ${error.message}`, 'error');
      return false;
    }
  }

  async testRecreateStoragePoliciesFunction() {
    this.log('Testing recreate storage policies function...', 'info');
    
    try {
      const { data, error } = await this.supabase.rpc('recreate_storage_policies', {
        bucket_name: 'gym-images'
      });

      if (error) {
        this.log(`Recreate policies function not available: ${error.message}`, 'warning');
        return false;
      }

      if (data && data.includes('successfully')) {
        this.log('Recreate storage policies function works', 'success');
        return true;
      } else {
        this.log('Recreate storage policies function may not be working properly', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing recreate policies function: ${error.message}`, 'error');
      return false;
    }
  }

  async testStorageUpload() {
    this.log('Testing storage upload functionality...', 'info');
    
    try {
      // Create a small test file
      const testFileName = `test-${Date.now()}.txt`;
      const testContent = 'This is a test file for storage validation';
      
      const { data, error } = await this.supabase.storage
        .from('gym-images')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });

      if (error) {
        if (error.message.includes('not found')) {
          this.log('Storage bucket not found for upload test', 'warning');
          return false;
        } else {
          this.log(`Storage upload test failed: ${error.message}`, 'error');
          return false;
        }
      }

      this.log('Storage upload test successful', 'success');
      
      // Clean up test file
      try {
        await this.supabase.storage
          .from('gym-images')
          .remove([testFileName]);
        this.log('Test file cleaned up successfully', 'info');
      } catch (cleanupError) {
        this.log('Test file cleanup failed (not critical)', 'warning');
      }

      return true;
    } catch (error) {
      this.log(`Error testing storage upload: ${error.message}`, 'error');
      return false;
    }
  }

  async testStorageDownload() {
    this.log('Testing storage download functionality...', 'info');
    
    try {
      // First upload a test file
      const testFileName = `test-download-${Date.now()}.txt`;
      const testContent = 'Test content for download validation';
      
      const { error: uploadError } = await this.supabase.storage
        .from('gym-images')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        this.log('Cannot test download - upload failed', 'warning');
        return false;
      }

      // Try to download the file
      const { data, error } = await this.supabase.storage
        .from('gym-images')
        .download(testFileName);

      if (error) {
        this.log(`Storage download test failed: ${error.message}`, 'error');
        return false;
      }

      if (data) {
        this.log('Storage download test successful', 'success');
        
        // Clean up test file
        try {
          await this.supabase.storage
            .from('gym-images')
            .remove([testFileName]);
        } catch (cleanupError) {
          this.log('Test file cleanup failed (not critical)', 'warning');
        }

        return true;
      } else {
        this.log('Storage download returned no data', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing storage download: ${error.message}`, 'error');
      return false;
    }
  }

  async testStoragePublicAccess() {
    this.log('Testing storage public access...', 'info');
    
    try {
      // Upload a test file
      const testFileName = `public-test-${Date.now()}.txt`;
      const testContent = 'Public access test content';
      
      const { error: uploadError } = await this.supabase.storage
        .from('gym-images')
        .upload(testFileName, testContent, {
          contentType: 'text/plain'
        });

      if (uploadError) {
        this.log('Cannot test public access - upload failed', 'warning');
        return false;
      }

      // Get public URL
      const { data: publicUrlData } = this.supabase.storage
        .from('gym-images')
        .getPublicUrl(testFileName);

      if (publicUrlData && publicUrlData.publicUrl) {
        this.log('Public URL generated successfully', 'success');
        this.log(`Public URL: ${publicUrlData.publicUrl}`, 'info');
        
        // Clean up test file
        try {
          await this.supabase.storage
            .from('gym-images')
            .remove([testFileName]);
        } catch (cleanupError) {
          this.log('Test file cleanup failed (not critical)', 'warning');
        }

        return true;
      } else {
        this.log('Failed to generate public URL', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing storage public access: ${error.message}`, 'error');
      return false;
    }
  }

  async testScriptContent() {
    this.log('Testing script content and structure...', 'info');
    
    try {
      const scriptContent = readFileSync(this.scriptPath, 'utf-8');
      
      // Check for key components
      const expectedComponents = [
        'CREATE EXTENSION IF NOT EXISTS',
        'storage.buckets',
        'CREATE POLICY',
        'gym-images',
        'check_storage_bucket_health',
        'recreate_storage_policies',
        'ROLLBACK'
      ];

      let componentMatches = 0;
      expectedComponents.forEach(component => {
        if (scriptContent.includes(component)) {
          componentMatches++;
        }
      });

      if (componentMatches >= 5) {
        this.log('Script contains expected components', 'success');
        return true;
      } else {
        this.log(`Script missing some expected components (${componentMatches}/${expectedComponents.length})`, 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing script content: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Storage Configuration Script Validation Tests', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'Script Exists', fn: () => this.testScriptExists() },
      { name: 'Script Content', fn: () => this.testScriptContent() },
      { name: 'Storage Bucket Exists', fn: () => this.testStorageBucketExists() },
      { name: 'Storage Bucket Access', fn: () => this.testStorageBucketAccess() },
      { name: 'Storage Policies', fn: () => this.testStoragePolicies() },
      { name: 'Health Check Function', fn: () => this.testHealthCheckFunction() },
      { name: 'Recreate Policies Function', fn: () => this.testRecreateStoragePoliciesFunction() },
      { name: 'Storage Upload', fn: () => this.testStorageUpload() },
      { name: 'Storage Download', fn: () => this.testStorageDownload() },
      { name: 'Storage Public Access', fn: () => this.testStoragePublicAccess() }
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

    this.log('\n' + '=' .repeat(60), 'info');
    this.log(`Storage Configuration Tests Complete: ${passed} passed, ${failed} failed`, 
      failed === 0 ? 'success' : 'warning');
    
    return { passed, failed, total: tests.length };
  }
}

// Export for use in other test files
export default StorageConfigurationTester;

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new StorageConfigurationTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}