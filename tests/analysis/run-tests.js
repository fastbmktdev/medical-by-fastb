#!/usr/bin/env node

/**
 * Test runner for cleanup tool analysis tests
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

class TestRunner {
  constructor() {
    this.testDir = __dirname;
    this.rootDir = path.resolve(__dirname, '../..');
    this.testFiles = [];
    this.results = {
      passed: 0,
      failed: 0,
      total: 0,
      errors: []
    };
  }

  /**
   * Discover test files
   */
  discoverTests() {
    const testFiles = fs.readdirSync(this.testDir)
      .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.js'))
      .map(file => path.join(this.testDir, file));
    
    this.testFiles = testFiles;
    console.log(`Discovered ${testFiles.length} test files:`);
    testFiles.forEach(file => {
      console.log(`  - ${path.basename(file)}`);
    });
    console.log();
  }

  /**
   * Run a single test file
   */
  async runTestFile(testFile) {
    return new Promise((resolve) => {
      console.log(`Running ${path.basename(testFile)}...`);
      
      const startTime = Date.now();
      
      // Use ts-node to run TypeScript test files
      const child = spawn('npx', ['ts-node', testFile], {
        cwd: this.rootDir,
        stdio: 'pipe'
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
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const result = {
          file: testFile,
          passed: code === 0,
          duration,
          stdout,
          stderr,
          code
        };

        if (code === 0) {
          console.log(`  ✅ PASSED (${duration}ms)`);
          this.results.passed++;
        } else {
          console.log(`  ❌ FAILED (${duration}ms)`);
          console.log(`     Exit code: ${code}`);
          if (stderr) {
            console.log(`     Error: ${stderr.slice(0, 200)}...`);
          }
          this.results.failed++;
          this.results.errors.push(result);
        }
        
        this.results.total++;
        resolve(result);
      });

      child.on('error', (error) => {
        console.log(`  ❌ ERROR: ${error.message}`);
        this.results.failed++;
        this.results.total++;
        this.results.errors.push({
          file: testFile,
          passed: false,
          duration: Date.now() - startTime,
          stdout: '',
          stderr: error.message,
          code: -1
        });
        resolve(null);
      });
    });
  }

  /**
   * Run all discovered tests
   */
  async runAllTests() {
    console.log('Starting test execution...\n');
    
    for (const testFile of this.testFiles) {
      await this.runTestFile(testFile);
    }
  }

  /**
   * Run tests in parallel
   */
  async runTestsParallel() {
    console.log('Starting parallel test execution...\n');
    
    const promises = this.testFiles.map(testFile => this.runTestFile(testFile));
    await Promise.all(promises);
  }

  /**
   * Print test summary
   */
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('TEST SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total tests: ${this.results.total}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    
    if (this.results.failed > 0) {
      console.log('\nFailed tests:');
      this.results.errors.forEach(error => {
        console.log(`  - ${path.basename(error.file)}`);
        if (error.stderr) {
          console.log(`    ${error.stderr.split('\n')[0]}`);
        }
      });
    }
    
    const successRate = (this.results.passed / this.results.total * 100).toFixed(1);
    console.log(`\nSuccess rate: ${successRate}%`);
    
    if (this.results.failed === 0) {
      console.log('🎉 All tests passed!');
    } else {
      console.log('❌ Some tests failed. Check the output above for details.');
    }
  }

  /**
   * Run specific test categories
   */
  async runCategory(category) {
    const categoryTests = this.testFiles.filter(file => 
      path.basename(file).includes(category)
    );
    
    if (categoryTests.length === 0) {
      console.log(`No tests found for category: ${category}`);
      return;
    }
    
    console.log(`Running ${category} tests (${categoryTests.length} files)...\n`);
    
    for (const testFile of categoryTests) {
      await this.runTestFile(testFile);
    }
  }

  /**
   * Validate test environment
   */
  validateEnvironment() {
    console.log('Validating test environment...');
    
    // Check if required dependencies are available
    const requiredDeps = ['typescript', 'ts-node'];
    const packageJson = path.join(this.rootDir, 'package.json');
    
    if (!fs.existsSync(packageJson)) {
      console.error('❌ package.json not found');
      return false;
    }
    
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        console.error(`❌ Required dependency not found: ${dep}`);
        return false;
      }
    }
    
    // Check if source files exist
    const srcDir = path.join(this.rootDir, 'src', 'analysis');
    if (!fs.existsSync(srcDir)) {
      console.error('❌ Source directory not found: src/analysis');
      return false;
    }
    
    console.log('✅ Environment validation passed');
    return true;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);
  const runner = new TestRunner();
  
  // Validate environment first
  if (!runner.validateEnvironment()) {
    process.exit(1);
  }
  
  // Discover tests
  runner.discoverTests();
  
  if (runner.testFiles.length === 0) {
    console.log('No test files found.');
    process.exit(0);
  }
  
  // Parse command line arguments
  const command = args[0] || 'all';
  
  try {
    switch (command) {
      case 'all':
        await runner.runAllTests();
        break;
      case 'parallel':
        await runner.runTestsParallel();
        break;
      case 'dependency':
      case 'integration':
      case 'safety':
        await runner.runCategory(command);
        break;
      default:
        console.log('Usage: node run-tests.js [all|parallel|dependency|integration|safety]');
        process.exit(1);
    }
  } catch (error) {
    console.error('Test runner error:', error);
    process.exit(1);
  }
  
  // Print summary
  runner.printSummary();
  
  // Exit with appropriate code
  process.exit(runner.results.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = TestRunner;