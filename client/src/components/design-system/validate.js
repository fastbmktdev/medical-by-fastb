#!/usr/bin/env node

/**
 * Design System Validation Script
 * 
 * Validates the design system implementation without running complex imports
 * that might have circular dependencies.
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  errors: [],
  warnings: [],
};

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
  }[type];
  
  console.log(`${prefix} ${message}`);
}

function validateFile(filePath, description) {
  try {
    if (!existsSync(filePath)) {
      results.errors.push(`Missing file: ${filePath}`);
      results.failed++;
      log(`${description}: Missing`, 'error');
      return false;
    }
    
    const content = readFileSync(filePath, 'utf8');
    if (content.length === 0) {
      results.warnings.push(`Empty file: ${filePath}`);
      results.warnings++;
      log(`${description}: Empty`, 'warning');
      return false;
    }
    
    results.passed++;
    log(`${description}: Found`, 'success');
    return true;
  } catch (error) {
    results.errors.push(`Error reading ${filePath}: ${error.message}`);
    results.failed++;
    log(`${description}: Error - ${error.message}`, 'error');
    return false;
  }
}

function validateExports(filePath, expectedExports, description) {
  try {
    if (!existsSync(filePath)) {
      results.errors.push(`Missing file: ${filePath}`);
      results.failed++;
      return false;
    }
    
    const content = readFileSync(filePath, 'utf8');
    const missingExports = [];
    
    expectedExports.forEach(exportName => {
      if (!content.includes(`export`) || !content.includes(exportName)) {
        missingExports.push(exportName);
      }
    });
    
    if (missingExports.length > 0) {
      results.warnings.push(`${description}: Missing exports - ${missingExports.join(', ')}`);
      results.warnings++;
      log(`${description}: Missing exports - ${missingExports.join(', ')}`, 'warning');
    } else {
      results.passed++;
      log(`${description}: All exports found`, 'success');
    }
    
    return missingExports.length === 0;
  } catch (error) {
    results.errors.push(`Error validating exports in ${filePath}: ${error.message}`);
    results.failed++;
    return false;
  }
}

// Main validation function
function validateDesignSystem() {
  log('🎨 Validating Design System Implementation', 'info');
  console.log('');
  
  // 1. Validate core structure
  log('1. Validating Core Structure', 'info');
  
  const coreFiles = [
    { path: join(__dirname, 'index.ts'), desc: 'Main index file' },
    { path: join(__dirname, 'ThemeProvider.tsx'), desc: 'Theme Provider' },
  ];
  
  coreFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 2. Validate design tokens
  log('2. Validating Design Tokens', 'info');
  
  const tokenFiles = [
    { path: join(__dirname, 'tokens/index.ts'), desc: 'Tokens index' },
    { path: join(__dirname, 'tokens/colors.ts'), desc: 'Color tokens' },
    { path: join(__dirname, 'tokens/typography.ts'), desc: 'Typography tokens' },
    { path: join(__dirname, 'tokens/spacing.ts'), desc: 'Spacing tokens' },
    { path: join(__dirname, 'tokens/animations.ts'), desc: 'Animation tokens' },
  ];
  
  tokenFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 3. Validate primitive components
  log('3. Validating Primitive Components', 'info');
  
  const primitiveFiles = [
    { path: join(__dirname, 'primitives/index.ts'), desc: 'Primitives index' },
    { path: join(__dirname, 'primitives/Button.tsx'), desc: 'Button component' },
    { path: join(__dirname, 'primitives/BaseInput.tsx'), desc: 'BaseInput component' },
    { path: join(__dirname, 'primitives/Card.tsx'), desc: 'Card component' },
    { path: join(__dirname, 'primitives/Container.tsx'), desc: 'Container component' },
    { path: join(__dirname, 'primitives/Loading.tsx'), desc: 'Loading component' },
  ];
  
  primitiveFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 4. Validate types
  log('4. Validating Type Definitions', 'info');
  
  const typeFiles = [
    { path: join(__dirname, 'types/index.ts'), desc: 'Types index' },
    { path: join(__dirname, 'types/component-props.ts'), desc: 'Component props types' },
    { path: join(__dirname, 'types/validation.ts'), desc: 'Validation types' },
    { path: join(__dirname, 'types/variants.ts'), desc: 'Variant types' },
  ];
  
  typeFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 5. Validate utilities
  log('5. Validating Utilities', 'info');
  
  const utilFiles = [
    { path: join(__dirname, 'utils/index.ts'), desc: 'Utils index' },
    { path: join(__dirname, 'utils/lazy.tsx'), desc: 'Lazy loading utils' },
    { path: join(__dirname, 'utils/performance.tsx'), desc: 'Performance utils' },
    { path: join(__dirname, 'utils/migration.tsx'), desc: 'Migration utils' },
    { path: join(__dirname, 'utils/exports.ts'), desc: 'Export utils' },
  ];
  
  utilFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 6. Validate documentation
  log('6. Validating Documentation', 'info');
  
  const docFiles = [
    { path: join(__dirname, 'MIGRATION_GUIDE.md'), desc: 'Migration guide' },
    { path: join(__dirname, 'BEST_PRACTICES.md'), desc: 'Best practices guide' },
    { path: join(__dirname, 'COMPOSITIONS_GUIDE.md'), desc: 'Compositions guide' },
  ];
  
  docFiles.forEach(({ path, desc }) => {
    validateFile(path, desc);
  });
  
  console.log('');
  
  // 7. Validate exports
  log('7. Validating Key Exports', 'info');
  
  validateExports(
    join(__dirname, 'index.ts'),
    ['ThemeProvider', 'useTheme', 'tokens', 'colors', 'typography', 'spacing'],
    'Main exports'
  );
  
  validateExports(
    join(__dirname, 'primitives/index.ts'),
    ['Button', 'BaseInput', 'Card', 'Container', 'Loading'],
    'Primitive exports'
  );
  
  console.log('');
  
  // 8. Summary
  log('📊 Validation Summary', 'info');
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Warnings: ${results.warnings}`);
  
  if (results.errors.length > 0) {
    console.log('\\n🚨 Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('');
  
  if (results.failed === 0) {
    log('🎉 Design System validation completed successfully!', 'success');
    return true;
  } else {
    log(`❌ Design System validation failed with ${results.failed} errors`, 'error');
    return false;
  }
}

// Run validation
const success = validateDesignSystem();
process.exit(success ? 0 : 1);