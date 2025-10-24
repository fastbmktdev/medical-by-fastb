#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Consolidated Scripts
 * 
 * This script runs all validation tests for the consolidated database scripts:
 * - Admin Management Script Tests
 * - Database Utilities Script Tests  
 * - Development Setup Script Tests
 * - Storage Configuration Script Tests
 * 
 * Usage:
 *   node tests/scripts/run-all-tests.js
 *   npm run test:scripts
 */

import AdminManagementTester from './admin-management.test.js';
import DatabaseUtilitiesTester from './database-utilities.test.js';
import DevelopmentSetupTester from './development-setup.test.js';
import StorageConfigurationTester from './storage-configuration.test.js';

class ComprehensiveScriptTester {
  constructor() {
    this.results = {
      adminManagement: null,
      databaseUtilities: null,
      developmentSetup: null,
      storageConfiguration: null
    };
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
    console.log(`${prefix} ${message}`);
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async runAdminManagementTests() {
    this.log('\n🔧 Running Admin Management Script Tests...', 'info');
    this.log('=' .repeat(80), 'info');
    
    try {
      const tester = new AdminManagementTester();
      const results = await tester.runAllTests();
      this.results.adminManagement = results;
      return results;
    } catch (error) {
      this.log(`Fatal error in admin management tests: ${error.message}`, 'error');
      this.results.adminManagement = { passed: 0, failed: 1, total: 1, error: error.message };
      return this.results.adminManagement;
    }
  }

  async runDatabaseUtilitiesTests() {
    this.log('\n🗄️  Running Database Utilities Script Tests...', 'info');
    this.log('=' .repeat(80), 'info');
    
    try {
      const tester = new DatabaseUtilitiesTester();
      const results = await tester.runAllTests();
      this.results.databaseUtilities = results;
      return results;
    } catch (error) {
      this.log(`Fatal error in database utilities tests: ${error.message}`, 'error');
      this.results.databaseUtilities = { passed: 0, failed: 1, total: 1, error: error.message };
      return this.results.databaseUtilities;
    }
  }

  async runDevelopmentSetupTests() {
    this.log('\n🚀 Running Development Setup Script Tests...', 'info');
    this.log('=' .repeat(80), 'info');
    
    try {
      const tester = new DevelopmentSetupTester();
      const results = await tester.runAllTests();
      this.results.developmentSetup = results;
      return results;
    } catch (error) {
      this.log(`Fatal error in development setup tests: ${error.message}`, 'error');
      this.results.developmentSetup = { passed: 0, failed: 1, total: 1, error: error.message };
      return this.results.developmentSetup;
    }
  }

  async runStorageConfigurationTests() {
    this.log('\n📦 Running Storage Configuration Script Tests...', 'info');
    this.log('=' .repeat(80), 'info');
    
    try {
      const tester = new StorageConfigurationTester();
      const results = await tester.runAllTests();
      this.results.storageConfiguration = results;
      return results;
    } catch (error) {
      this.log(`Fatal error in storage configuration tests: ${error.message}`, 'error');
      this.results.storageConfiguration = { passed: 0, failed: 1, total: 1, error: error.message };
      return this.results.storageConfiguration;
    }
  }

  generateSummaryReport() {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    this.log('\n' + '=' .repeat(80), 'info');
    this.log('📊 COMPREHENSIVE SCRIPT VALIDATION SUMMARY', 'info');
    this.log('=' .repeat(80), 'info');
    
    let totalPassed = 0;
    let totalFailed = 0;
    let totalTests = 0;
    let allTestsSuccessful = true;

    // Admin Management Results
    if (this.results.adminManagement) {
      const { passed, failed, total } = this.results.adminManagement;
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
      
      const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
      this.log(`🔧 Admin Management:     ${status} (${passed}/${total})`, 
        failed === 0 ? 'success' : 'error');
      
      if (failed > 0) allTestsSuccessful = false;
    } else {
      this.log('🔧 Admin Management:     ❌ NOT RUN', 'error');
      allTestsSuccessful = false;
    }

    // Database Utilities Results
    if (this.results.databaseUtilities) {
      const { passed, failed, total } = this.results.databaseUtilities;
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
      
      const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
      this.log(`🗄️  Database Utilities:   ${status} (${passed}/${total})`, 
        failed === 0 ? 'success' : 'error');
      
      if (failed > 0) allTestsSuccessful = false;
    } else {
      this.log('🗄️  Database Utilities:   ❌ NOT RUN', 'error');
      allTestsSuccessful = false;
    }

    // Development Setup Results
    if (this.results.developmentSetup) {
      const { passed, failed, total } = this.results.developmentSetup;
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
      
      const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
      this.log(`🚀 Development Setup:    ${status} (${passed}/${total})`, 
        failed === 0 ? 'success' : 'error');
      
      if (failed > 0) allTestsSuccessful = false;
    } else {
      this.log('🚀 Development Setup:    ❌ NOT RUN', 'error');
      allTestsSuccessful = false;
    }

    // Storage Configuration Results
    if (this.results.storageConfiguration) {
      const { passed, failed, total } = this.results.storageConfiguration;
      totalPassed += passed;
      totalFailed += failed;
      totalTests += total;
      
      const status = failed === 0 ? '✅ PASSED' : '❌ FAILED';
      this.log(`📦 Storage Configuration: ${status} (${passed}/${total})`, 
        failed === 0 ? 'success' : 'error');
      
      if (failed > 0) allTestsSuccessful = false;
    } else {
      this.log('📦 Storage Configuration: ❌ NOT RUN', 'error');
      allTestsSuccessful = false;
    }

    this.log('─' .repeat(80), 'info');
    this.log(`📈 OVERALL RESULTS:      ${totalPassed} passed, ${totalFailed} failed, ${totalTests} total`, 
      allTestsSuccessful ? 'success' : 'error');
    this.log(`⏱️  TOTAL DURATION:       ${this.formatDuration(totalDuration)}`, 'info');
    
    if (allTestsSuccessful) {
      this.log('\n🎉 ALL SCRIPT VALIDATION TESTS PASSED!', 'success');
      this.log('✅ All consolidated scripts are working correctly', 'success');
    } else {
      this.log('\n⚠️  SOME TESTS FAILED', 'warning');
      this.log('❌ Please review the failed tests and fix any issues', 'error');
    }

    this.log('=' .repeat(80), 'info');
    
    return {
      allPassed: allTestsSuccessful,
      totalPassed,
      totalFailed,
      totalTests,
      duration: totalDuration,
      results: this.results
    };
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive Script Validation Tests', 'info');
    this.log(`📅 Started at: ${new Date().toISOString()}`, 'info');
    this.log('=' .repeat(80), 'info');

    try {
      // Run all test suites
      await this.runAdminManagementTests();
      await this.runDatabaseUtilitiesTests();
      await this.runDevelopmentSetupTests();
      await this.runStorageConfigurationTests();

      // Generate and display summary
      const summary = this.generateSummaryReport();
      
      return summary;
    } catch (error) {
      this.log(`Fatal error running comprehensive tests: ${error.message}`, 'error');
      console.error(error.stack);
      return {
        allPassed: false,
        totalPassed: 0,
        totalFailed: 1,
        totalTests: 1,
        duration: Date.now() - this.startTime,
        error: error.message
      };
    }
  }
}

// Handle command line arguments
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {
    help: false,
    verbose: false,
    specific: null
  };

  for (const arg of args) {
    switch (arg) {
      case '--help':
      case '-h':
        options.help = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--admin':
        options.specific = 'admin';
        break;
      case '--database':
        options.specific = 'database';
        break;
      case '--setup':
        options.specific = 'setup';
        break;
      case '--storage':
        options.specific = 'storage';
        break;
      default:
        console.log(`Unknown option: ${arg}`);
        options.help = true;
    }
  }

  return options;
}

function showHelp() {
  console.log(`
📖 Comprehensive Script Validation Test Runner

Usage: node tests/scripts/run-all-tests.js [OPTIONS]

Options:
  --help, -h      Show this help message
  --verbose, -v   Enable verbose output
  --admin         Run only admin management tests
  --database      Run only database utilities tests
  --setup         Run only development setup tests
  --storage       Run only storage configuration tests

Examples:
  node tests/scripts/run-all-tests.js
  node tests/scripts/run-all-tests.js --verbose
  node tests/scripts/run-all-tests.js --admin
  npm run test:scripts

Description:
  This script validates all consolidated database scripts by running
  comprehensive tests that verify functionality, error handling, and
  integration with the database system.

Test Coverage:
  🔧 Admin Management:     User promotion, role checking, batch operations
  🗄️  Database Utilities:   Health checks, partner verification, slug management
  🚀 Development Setup:    Environment validation, user creation, data seeding
  📦 Storage Configuration: Bucket creation, policies, access control

Requirements:
  - Valid Supabase credentials in environment
  - Database with proper migrations applied
  - Node.js with required dependencies installed
  `);
}

async function runSpecificTest(testType) {
  console.log(`Running specific test: ${testType}`);
  
  try {
    let tester;
    let testName;
    
    switch (testType) {
      case 'admin':
        tester = new AdminManagementTester();
        testName = 'Admin Management';
        break;
      case 'database':
        tester = new DatabaseUtilitiesTester();
        testName = 'Database Utilities';
        break;
      case 'setup':
        tester = new DevelopmentSetupTester();
        testName = 'Development Setup';
        break;
      case 'storage':
        tester = new StorageConfigurationTester();
        testName = 'Storage Configuration';
        break;
      default:
        throw new Error(`Unknown test type: ${testType}`);
    }
    
    console.log(`\n🔍 Running ${testName} Tests Only...`);
    console.log('=' .repeat(60));
    
    const results = await tester.runAllTests();
    
    console.log('\n' + '=' .repeat(60));
    console.log(`📊 ${testName} Test Results: ${results.passed} passed, ${results.failed} failed`);
    
    return results.failed === 0;
  } catch (error) {
    console.error(`Error running specific test: ${error.message}`);
    return false;
  }
}

// Main execution
async function main() {
  const options = parseArguments();
  
  if (options.help) {
    showHelp();
    process.exit(0);
  }

  if (options.specific) {
    const success = await runSpecificTest(options.specific);
    process.exit(success ? 0 : 1);
    return;
  }

  // Run comprehensive tests
  const tester = new ComprehensiveScriptTester();
  const results = await tester.runAllTests();
  
  // Exit with appropriate code
  process.exit(results.allPassed ? 0 : 1);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  console.error(error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ComprehensiveScriptTester;