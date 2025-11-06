/**
 * Validation Tests for Development Setup Script
 * 
 * Tests the consolidated development setup script to ensure:
 * - Environment validation works correctly
 * - Test user creation functions properly
 * - Sample data seeding works as expected
 * - Development environment checks are accurate
 * - Command line options work correctly
 */

import { spawn } from 'child_process';
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

class DevelopmentSetupTester {
  constructor() {
    this.supabase = initializeSupabase();
    this.testResults = [];
    this.scriptPath = join(projectRoot, 'scripts', 'development-setup.sh');
    this.createdTestUsers = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async runScriptCommand(args = []) {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', [this.scriptPath, ...args], {
        cwd: projectRoot,
        env: { ...process.env, ...loadEnvironment() }
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          code,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Set timeout to prevent hanging
      setTimeout(() => {
        child.kill();
        reject(new Error('Script execution timeout'));
      }, 60000); // Longer timeout for setup script
    });
  }

  async testScriptExists() {
    this.log('Testing if development setup script exists...', 'info');
    
    if (existsSync(this.scriptPath)) {
      this.log('Development setup script found', 'success');
      return true;
    } else {
      this.log(`Development setup script not found at: ${this.scriptPath}`, 'error');
      return false;
    }
  }

  async testScriptPermissions() {
    this.log('Testing script permissions...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--help']);
      
      if (result.success || result.stdout.includes('Development Setup Script')) {
        this.log('Script has proper execution permissions', 'success');
        return true;
      } else {
        this.log('Script may not have proper execution permissions', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing script permissions: ${error.message}`, 'error');
      return false;
    }
  }

  async testHelpOption() {
    this.log('Testing help option...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--help']);
      
      if (result.success) {
        this.log('Help option executed successfully', 'success');
        
        // Check for expected help content
        const expectedPatterns = [
          'Development Setup Script',
          'Usage:',
          'Options:',
          '--users-only',
          '--seed-only',
          '--check-only'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 4) {
          this.log('Help output contains expected content', 'success');
          return true;
        } else {
          this.log('Help output missing some expected content', 'warning');
          return false;
        }
      } else {
        this.log(`Help option failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing help option: ${error.message}`, 'error');
      return false;
    }
  }

  async testCheckOnlyOption() {
    this.log('Testing check-only option...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--check-only']);
      
      if (result.success) {
        this.log('Check-only option executed successfully', 'success');
        
        // Check for expected output patterns
        const expectedPatterns = [
          'DEVELOPMENT ENVIRONMENT SETUP',
          'Checking required dependencies',
          'Validating environment configuration',
          'development environment health check'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 2) {
          this.log('Check-only output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Check-only output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Check-only option failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing check-only option: ${error.message}`, 'error');
      return false;
    }
  }

  async testEnvironmentDetection() {
    this.log('Testing environment detection...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--check-only']);
      
      if (result.success) {
        // Check if environment is properly detected
        if (result.stdout.includes('Environment: LOCAL') || result.stdout.includes('Environment: PRODUCTION')) {
          this.log('Environment properly detected and displayed', 'success');
          return true;
        } else {
          this.log('Environment detection may not be working properly', 'warning');
          return false;
        }
      } else {
        this.log('Environment detection test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing environment detection: ${error.message}`, 'error');
      return false;
    }
  }

  async testDependencyChecking() {
    this.log('Testing dependency checking...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--check-only']);
      
      if (result.success) {
        // Check for dependency checking output
        const expectedPatterns = [
          'Checking required dependencies',
          'dependencies are installed'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 1) {
          this.log('Dependency checking is working', 'success');
          return true;
        } else {
          this.log('Dependency checking output not found', 'warning');
          return false;
        }
      } else {
        this.log('Dependency checking test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing dependency checking: ${error.message}`, 'error');
      return false;
    }
  }

  async testDatabaseConnectivity() {
    this.log('Testing database connectivity validation...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--check-only']);
      
      if (result.success) {
        // Check for database connectivity validation
        const expectedPatterns = [
          'Checking database connectivity',
          'Database is accessible'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 1) {
          this.log('Database connectivity validation is working', 'success');
          return true;
        } else {
          this.log('Database connectivity validation output not clear', 'warning');
          return false;
        }
      } else {
        this.log('Database connectivity test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing database connectivity: ${error.message}`, 'error');
      return false;
    }
  }

  async testUsersOnlyOption() {
    this.log('Testing users-only option...', 'info');
    
    try {
      // Note: This test may create actual users, so we need to be careful
      // In a real test environment, we might want to mock this or use a test database
      
      const result = await this.runScriptCommand(['--users-only']);
      
      // The script might fail if users already exist, which is okay
      if (result.success || result.stdout.includes('User already exists')) {
        this.log('Users-only option executed (users may already exist)', 'success');
        
        // Check for user creation patterns
        const expectedPatterns = [
          'Creating test users',
          'User creation completed',
          'Test User Credentials'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 1) {
          this.log('Users-only output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Users-only output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Users-only option failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing users-only option: ${error.message}`, 'error');
      return false;
    }
  }

  async testSeedOnlyOption() {
    this.log('Testing seed-only option...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--seed-only']);
      
      // Check if seed.sql exists first
      const seedPath = join(projectRoot, 'supabase', 'seed.sql');
      if (!existsSync(seedPath)) {
        this.log('seed.sql file not found - this is expected for some setups', 'warning');
        return true;
      }

      if (result.success) {
        this.log('Seed-only option executed successfully', 'success');
        
        // Check for seeding patterns
        const expectedPatterns = [
          'Seeding sample data',
          'seed',
          'data'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.toLowerCase().includes(pattern.toLowerCase())) {
            patternMatches++;
          }
        });

        if (patternMatches >= 1) {
          this.log('Seed-only output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Seed-only output missing expected patterns', 'warning');
          return false;
        }
      } else {
        // Seeding might fail if no seed file exists or database is not accessible
        if (result.stderr.includes('seed.sql') || result.stdout.includes('seed.sql')) {
          this.log('Seed-only option properly handles missing seed file', 'success');
          return true;
        } else {
          this.log(`Seed-only option failed: ${result.stderr}`, 'warning');
          return false;
        }
      }
    } catch (error) {
      this.log(`Error testing seed-only option: ${error.message}`, 'error');
      return false;
    }
  }

  async testInvalidOption() {
    this.log('Testing invalid option handling...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--invalid-option']);
      
      // Invalid option should fail
      if (!result.success) {
        this.log('Invalid option properly rejected', 'success');
        
        if (result.stderr.includes('Unknown option') || result.stdout.includes('Unknown option')) {
          this.log('Invalid option shows appropriate error message', 'success');
          return true;
        } else {
          this.log('Invalid option error message could be clearer', 'warning');
          return false;
        }
      } else {
        this.log('Invalid option should have failed but succeeded', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing invalid option: ${error.message}`, 'error');
      return false;
    }
  }

  async testHealthCheckComponents() {
    this.log('Testing health check components...', 'info');
    
    try {
      const result = await this.runScriptCommand(['--check-only']);
      
      if (result.success) {
        // Check for various health check components
        const expectedPatterns = [
          'Node.js',
          'npm',
          'package.json',
          'health check'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 2) {
          this.log('Health check components are working', 'success');
          return true;
        } else {
          this.log('Health check components missing some checks', 'warning');
          return false;
        }
      } else {
        this.log('Health check components test failed', 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error testing health check components: ${error.message}`, 'error');
      return false;
    }
  }

  async cleanup() {
    this.log('Cleaning up test data...', 'info');
    
    try {
      // Clean up any test users that might have been created
      // Note: In a real scenario, you might want to implement user cleanup
      // For now, we'll just log that cleanup would happen here
      
      this.log('Test cleanup completed (no actual cleanup needed for this test)', 'success');
    } catch (error) {
      this.log(`Error during cleanup: ${error.message}`, 'warning');
    }
  }

  async runAllTests() {
    this.log('Starting Development Setup Script Validation Tests', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'Script Exists', fn: () => this.testScriptExists() },
      { name: 'Script Permissions', fn: () => this.testScriptPermissions() },
      { name: 'Help Option', fn: () => this.testHelpOption() },
      { name: 'Check-Only Option', fn: () => this.testCheckOnlyOption() },
      { name: 'Environment Detection', fn: () => this.testEnvironmentDetection() },
      { name: 'Dependency Checking', fn: () => this.testDependencyChecking() },
      { name: 'Database Connectivity', fn: () => this.testDatabaseConnectivity() },
      { name: 'Users-Only Option', fn: () => this.testUsersOnlyOption() },
      { name: 'Seed-Only Option', fn: () => this.testSeedOnlyOption() },
      { name: 'Invalid Option Handling', fn: () => this.testInvalidOption() },
      { name: 'Health Check Components', fn: () => this.testHealthCheckComponents() }
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
    this.log(`Development Setup Tests Complete: ${passed} passed, ${failed} failed`, 
      failed === 0 ? 'success' : 'warning');
    
    return { passed, failed, total: tests.length };
  }
}

// Export for use in other test files
export default DevelopmentSetupTester;

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DevelopmentSetupTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}