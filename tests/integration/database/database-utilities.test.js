/**
 * Validation Tests for Database Utilities Script
 * 
 * Tests the consolidated database utilities to ensure:
 * - Database health checks work correctly
 * - Partner role verification functions properly
 * - Gym slug management works as expected
 * - Storage bucket verification is accurate
 * - Environment detection works correctly
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

class DatabaseUtilitiesTester {
  constructor() {
    this.supabase = initializeSupabase();
    this.testResults = [];
    this.scriptPath = join(projectRoot, 'scripts', 'database-utilities.js');
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = { timestamp, message, type };
    this.testResults.push(logEntry);
    
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  async runScriptCommand(command) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [this.scriptPath, command], {
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
      }, 30000);
    });
  }

  async testScriptExists() {
    this.log('Testing if database utilities script exists...', 'info');
    
    if (existsSync(this.scriptPath)) {
      this.log('Database utilities script found', 'success');
      return true;
    } else {
      this.log(`Database utilities script not found at: ${this.scriptPath}`, 'error');
      return false;
    }
  }

  async testHealthCheckCommand() {
    this.log('Testing database health check command...', 'info');
    
    try {
      const result = await this.runScriptCommand('check');
      
      if (result.success) {
        this.log('Health check command executed successfully', 'success');
        
        // Check for expected output patterns
        const expectedPatterns = [
          'Running Database Health Check',
          'Database Health Summary',
          'Table'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 2) {
          this.log('Health check output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Health check output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Health check command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running health check: ${error.message}`, 'error');
      return false;
    }
  }

  async testPartnersCommand() {
    this.log('Testing partner verification command...', 'info');
    
    try {
      const result = await this.runScriptCommand('partners');
      
      if (result.success) {
        this.log('Partner verification command executed successfully', 'success');
        
        // Check for expected output patterns
        const expectedPatterns = [
          'Checking Partner Role Promotions',
          'User Role Distribution',
          'Partners with Gym Applications'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 2) {
          this.log('Partner verification output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Partner verification output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Partner verification command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running partner verification: ${error.message}`, 'error');
      return false;
    }
  }

  async testSlugsCommand() {
    this.log('Testing gym slug management command...', 'info');
    
    try {
      const result = await this.runScriptCommand('slugs');
      
      if (result.success) {
        this.log('Slug management command executed successfully', 'success');
        
        // Check for expected output patterns
        const expectedPatterns = [
          'Updating Gym Slugs',
          'Gym Slug Status',
          'gyms in database'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 2) {
          this.log('Slug management output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Slug management output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Slug management command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running slug management: ${error.message}`, 'error');
      return false;
    }
  }

  async testStorageCommand() {
    this.log('Testing storage verification command...', 'info');
    
    try {
      const result = await this.runScriptCommand('storage');
      
      if (result.success) {
        this.log('Storage verification command executed successfully', 'success');
        
        // Check for expected output patterns
        const expectedPatterns = [
          'storage bucket',
          'Found',
          'bucket'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.toLowerCase().includes(pattern.toLowerCase())) {
            patternMatches++;
          }
        });

        if (patternMatches >= 1) {
          this.log('Storage verification output contains expected patterns', 'success');
          return true;
        } else {
          this.log('Storage verification output missing expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`Storage verification command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running storage verification: ${error.message}`, 'error');
      return false;
    }
  }

  async testAllCommand() {
    this.log('Testing comprehensive "all" command...', 'info');
    
    try {
      const result = await this.runScriptCommand('all');
      
      if (result.success) {
        this.log('All utilities command executed successfully', 'success');
        
        // Check for patterns from all utilities
        const expectedPatterns = [
          'Running all utilities',
          'Database Health Check',
          'Partner Role Promotions',
          'Gym Slugs'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 3) {
          this.log('All utilities output contains expected patterns', 'success');
          return true;
        } else {
          this.log('All utilities output missing some expected patterns', 'warning');
          return false;
        }
      } else {
        this.log(`All utilities command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running all utilities: ${error.message}`, 'error');
      return false;
    }
  }

  async testHelpCommand() {
    this.log('Testing help command...', 'info');
    
    try {
      const result = await this.runScriptCommand('help');
      
      if (result.success) {
        this.log('Help command executed successfully', 'success');
        
        // Check for help content
        const expectedPatterns = [
          'Database Utilities Help',
          'Usage:',
          'Available Commands:',
          'Examples:'
        ];

        let patternMatches = 0;
        expectedPatterns.forEach(pattern => {
          if (result.stdout.includes(pattern)) {
            patternMatches++;
          }
        });

        if (patternMatches >= 3) {
          this.log('Help output contains expected content', 'success');
          return true;
        } else {
          this.log('Help output missing expected content', 'warning');
          return false;
        }
      } else {
        this.log(`Help command failed: ${result.stderr}`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`Error running help command: ${error.message}`, 'error');
      return false;
    }
  }

  async testInvalidCommand() {
    this.log('Testing invalid command handling...', 'info');
    
    try {
      const result = await this.runScriptCommand('invalid_command');
      
      // Invalid command should fail gracefully
      if (!result.success) {
        this.log('Invalid command properly rejected', 'success');
        
        if (result.stderr.includes('Unknown command') || result.stdout.includes('Unknown command')) {
          this.log('Invalid command shows appropriate error message', 'success');
          return true;
        } else {
          this.log('Invalid command error message could be clearer', 'warning');
          return false;
        }
      } else {
        this.log('Invalid command should have failed but succeeded', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing invalid command: ${error.message}`, 'error');
      return false;
    }
  }

  async testDatabaseConnectivity() {
    this.log('Testing direct database connectivity...', 'info');
    
    try {
      // Test basic table access
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          this.log('Profiles table does not exist - this is expected for some setups', 'warning');
          return true;
        } else {
          this.log(`Database connectivity issue: ${error.message}`, 'error');
          return false;
        }
      }

      this.log('Database connectivity test passed', 'success');
      return true;
    } catch (error) {
      this.log(`Error testing database connectivity: ${error.message}`, 'error');
      return false;
    }
  }

  async testEnvironmentDetection() {
    this.log('Testing environment detection...', 'info');
    
    try {
      const env = loadEnvironment();
      
      if (env.SUPABASE_URL) {
        this.log('Supabase URL detected in environment', 'success');
      } else {
        this.log('Supabase URL not found in environment', 'warning');
      }

      if (env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        this.log('Supabase keys detected in environment', 'success');
      } else {
        this.log('Supabase keys not found in environment', 'warning');
      }

      // Test if environment is properly loaded by script
      const result = await this.runScriptCommand('check');
      
      if (result.stdout.includes('Environment:')) {
        this.log('Script properly detects and displays environment', 'success');
        return true;
      } else {
        this.log('Script may not be detecting environment properly', 'warning');
        return false;
      }
    } catch (error) {
      this.log(`Error testing environment detection: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('Starting Database Utilities Script Validation Tests', 'info');
    this.log('=' .repeat(60), 'info');

    const tests = [
      { name: 'Script Exists', fn: () => this.testScriptExists() },
      { name: 'Environment Detection', fn: () => this.testEnvironmentDetection() },
      { name: 'Database Connectivity', fn: () => this.testDatabaseConnectivity() },
      { name: 'Health Check Command', fn: () => this.testHealthCheckCommand() },
      { name: 'Partners Command', fn: () => this.testPartnersCommand() },
      { name: 'Slugs Command', fn: () => this.testSlugsCommand() },
      { name: 'Storage Command', fn: () => this.testStorageCommand() },
      { name: 'All Command', fn: () => this.testAllCommand() },
      { name: 'Help Command', fn: () => this.testHelpCommand() },
      { name: 'Invalid Command Handling', fn: () => this.testInvalidCommand() }
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
    this.log(`Database Utilities Tests Complete: ${passed} passed, ${failed} failed`, 
      failed === 0 ? 'success' : 'warning');
    
    return { passed, failed, total: tests.length };
  }
}

// Export for use in other test files
export default DatabaseUtilitiesTester;

// Run tests if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new DatabaseUtilitiesTester();
  tester.runAllTests()
    .then(results => {
      process.exit(results.failed === 0 ? 0 : 1);
    })
    .catch(error => {
      console.error('Fatal test error:', error);
      process.exit(1);
    });
}