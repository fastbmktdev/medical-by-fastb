#!/usr/bin/env node

/**
 * Script: build-and-clean.js
 * Description: Build all workspaces and clean build artifacts
 * Usage: node scripts/node/build-and-clean.js
 */

import { execSync } from 'child_process';
import { existsSync, rmSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '../..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function exec(command, options = {}) {
  try {
    execSync(command, {
      stdio: 'inherit',
      cwd: rootDir,
      ...options,
    });
    return true;
  } catch (error) {
    return false;
  }
}

function cleanBuildDirs() {
  log('\n🧹 Cleaning build directories...', 'cyan');
  log('==================================', 'cyan');

  const buildDirs = [
    '.next',
    'out',
    'build',
    'dist',
    'client/.next',
    'client/out',
    'client/dist',
    'server/dist',
    'server/.next',
    'shared/dist',
  ];

  let cleaned = 0;
  for (const dir of buildDirs) {
    const fullPath = join(rootDir, dir);
    if (existsSync(fullPath)) {
      try {
        rmSync(fullPath, { recursive: true, force: true });
        log(`  ✓ Removed ${dir}/`, 'green');
        cleaned++;
      } catch (error) {
        log(`  ✗ Failed to remove ${dir}/: ${error.message}`, 'red');
      }
    } else {
      log(`  ℹ️  ${dir}/ not found (already clean)`, 'yellow');
    }
  }

  if (cleaned > 0) {
    log(`\n✅ Cleaned ${cleaned} build directory/directories`, 'green');
  } else {
    log('\n✅ Build directories are already clean', 'green');
  }
}

async function main() {
  log('🔨 Building and Cleaning Project', 'blue');
  log('==================================\n', 'blue');

  // Step 1: Build shared
  log('📦 Step 1: Building shared workspace...', 'cyan');
  if (!exec('npm run build:shared')) {
    log('❌ Failed to build shared workspace', 'red');
    process.exit(1);
  }
  log('✅ Shared workspace built successfully\n', 'green');

  // Step 2: Build client
  log('📦 Step 2: Building client workspace...', 'cyan');
  if (!exec('npm run build:client')) {
    log('❌ Failed to build client workspace', 'red');
    process.exit(1);
  }
  log('✅ Client workspace built successfully\n', 'green');

  // Step 3: Build server
  log('📦 Step 3: Building server workspace...', 'cyan');
  if (!exec('npm run build:server')) {
    log('❌ Failed to build server workspace', 'red');
    process.exit(1);
  }
  log('✅ Server workspace built successfully\n', 'green');

  // Step 4: Clean build directories
  cleanBuildDirs();

  log('\n🎉 All done! Build completed and cleaned successfully.', 'green');
  log('==================================\n', 'blue');
}

main().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});

