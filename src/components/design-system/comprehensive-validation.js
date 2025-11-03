#!/usr/bin/env node

/**
 * Comprehensive Design System Validation
 * 
 * This script performs a complete validation of the design system implementation,
 * including migration cleanup, deprecated component removal, and consistency checks.
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warningCount: 0,
  errors: [],
  warnings: [],
  details: {
    migration: { passed: 0, failed: 0, warnings: 0 },
    cleanup: { passed: 0, failed: 0, warnings: 0 },
    consistency: { passed: 0, failed: 0, warnings: 0 },
    accessibility: { passed: 0, failed: 0, warnings: 0 },
    performance: { passed: 0, failed: 0, warnings: 0 }
  }
};

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    section: '🔍'
  }[type];
  
  console.log(`${prefix} ${message}`);
}

function validateFile(filePath, description, category = 'general') {
  try {
    if (!existsSync(filePath)) {
      results.errors.push(`Missing file: ${filePath}`);
      results.failed++;
      results.details[category].failed++;
      log(`${description}: Missing`, 'error');
      return false;
    }
    
    const content = readFileSync(filePath, 'utf8');
    if (content.length === 0) {
      results.warnings.push(`Empty file: ${filePath}`);
      results.warningCount++;
      results.details[category].warnings++;
      log(`${description}: Empty`, 'warning');
      return false;
    }
    
    results.passed++;
    results.details[category].passed++;
    log(`${description}: Found`, 'success');
    return true;
  } catch (error) {
    results.errors.push(`Error reading ${filePath}: ${error.message}`);
    results.failed++;
    results.details[category].failed++;
    log(`${description}: Error - ${error.message}`, 'error');
    return false;
  }
}

function scanDirectory(dirPath, extensions = ['.tsx', '.ts', '.js', '.jsx']) {
  const files = [];
  
  if (!existsSync(dirPath)) {
    return files;
  }
  
  try {
    const items = readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = join(dirPath, item);
      const stat = statSync(fullPath);
      
      if (stat.isDirectory()) {
        files.push(...scanDirectory(fullPath, extensions));
      } else if (extensions.includes(extname(item))) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    log(`Error scanning directory ${dirPath}: ${error.message}`, 'error');
  }
  
  return files;
}

function checkImportConsistency(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for deprecated import patterns
    const deprecatedPatterns = [
      { pattern: /from ['"]@\/components\/ui\//, message: 'Using deprecated @/components/ui/ import' },
      { pattern: /from ['"]\.\.\/\.\.\/ui\//, message: 'Using deprecated relative ui/ import' },
      { pattern: /import.*Button.*from ['"][^'"]*\/ui\//, message: 'Importing Button from deprecated ui directory' },
      { pattern: /import.*Input.*from ['"][^'"]*\/ui\//, message: 'Importing Input from deprecated ui directory' },
      { pattern: /import.*Card.*from ['"][^'"]*\/ui\//, message: 'Importing Card from deprecated ui directory' }
    ];
    
    deprecatedPatterns.forEach(({ pattern, message }) => {
      if (pattern.test(content)) {
        issues.push(message);
      }
    });
    
    // Check for proper design system imports
    const designSystemImports = [
      /from ['"]@\/components\/design-system/,
      /from ['"]@\/components\/shared/,
      /from ['"]@\/components\/compositions/
    ];
    
    const hasDesignSystemImports = designSystemImports.some(pattern => pattern.test(content));
    const hasComponentImports = /import.*(?:Button|Input|Card|Modal)/.test(content);
    
    if (hasComponentImports && !hasDesignSystemImports) {
      issues.push('Component imports not using design system paths');
    }
    
    return issues;
  } catch (error) {
    return [`Error checking imports: ${error.message}`];
  }
}

function checkDesignTokenUsage(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for hardcoded colors
    const hardcodedColorPatterns = [
      { pattern: /#[0-9a-fA-F]{3,6}/, message: 'Hardcoded hex color found' },
      { pattern: /rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/, message: 'Hardcoded RGB color found' },
      { pattern: /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)/, message: 'Hardcoded RGBA color found' }
    ];
    
    hardcodedColorPatterns.forEach(({ pattern, message }) => {
      const matches = content.match(new RegExp(pattern.source, 'g'));
      if (matches && matches.length > 0) {
        issues.push(`${message}: ${matches.length} instances`);
      }
    });
    
    // Check for arbitrary Tailwind values
    const arbitraryValuePattern = /\[[^\]]+\]/g;
    const arbitraryMatches = content.match(arbitraryValuePattern);
    if (arbitraryMatches && arbitraryMatches.length > 0) {
      issues.push(`Arbitrary Tailwind values found: ${arbitraryMatches.length} instances`);
    }
    
    return issues;
  } catch (error) {
    return [`Error checking design tokens: ${error.message}`];
  }
}

function checkAccessibilityCompliance(filePath) {
  try {
    const content = readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check for missing ARIA labels on interactive elements
    const interactiveElements = ['button', 'input', 'select', 'textarea'];
    
    interactiveElements.forEach(element => {
      const elementRegex = new RegExp(`<${element}[^>]*>`, 'gi');
      const matches = content.match(elementRegex);
      
      if (matches) {
        matches.forEach(match => {
          if (!match.includes('aria-label') && !match.includes('aria-labelledby')) {
            // Check if it has visible text content for buttons
            if (element === 'button' && !match.includes('aria-label')) {
              const buttonContentRegex = new RegExp(`${match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^<]*)</button>`, 'i');
              const contentMatch = content.match(buttonContentRegex);
              if (!contentMatch || !contentMatch[1].trim()) {
                issues.push(`${element} without accessible label`);
              }
            } else if (element !== 'button') {
              issues.push(`${element} without accessible label`);
            }
          }
        });
      }
    });
    
    // Check for missing alt text on images
    const imgMatches = content.match(/<Image src=["'][^'"]*["'][^>]*>/gi);
    if (imgMatches) {
      imgMatches.forEach(match => {
        if (!match.includes('alt=')) {
          issues.push('Image without alt text');
        }
      });
    }
    
    return issues;
  } catch (error) {
    return [`Error checking accessibility: ${error.message}`];
  }
}

// Main validation functions
function validateMigrationDocumentation() {
  log('1. Validating Migration Documentation', 'section');
  
  const migrationFiles = [
    { path: join(__dirname, 'MIGRATION_GUIDE.md'), desc: 'Migration guide' },
    { path: join(__dirname, 'BEST_PRACTICES.md'), desc: 'Best practices guide' },
    { path: join(__dirname, 'COMPOSITIONS_GUIDE.md'), desc: 'Compositions guide' }
  ];
  
  migrationFiles.forEach(({ path, desc }) => {
    validateFile(path, desc, 'migration');
  });
  
  // Check migration guide completeness
  try {
    const migrationContent = readFileSync(join(__dirname, 'MIGRATION_GUIDE.md'), 'utf8');
    const requiredSections = [
      'Component Migration Patterns',
      'Design Token Migration',
      'TypeScript Migration',
      'Performance Optimizations',
      'Migration Checklist'
    ];
    
    requiredSections.forEach(section => {
      if (migrationContent.includes(section)) {
        results.passed++;
        results.details.migration.passed++;
        log(`Migration guide section "${section}": Found`, 'success');
      } else {
        results.warnings.push(`Migration guide missing section: ${section}`);
        results.warningCount++;
        results.details.migration.warnings++;
        log(`Migration guide section "${section}": Missing`, 'warning');
      }
    });
  } catch (error) {
    results.errors.push(`Error validating migration guide: ${error.message}`);
    results.failed++;
    results.details.migration.failed++;
  }
}

function validateDeprecatedComponentCleanup() {
  log('2. Validating Deprecated Component Cleanup', 'section');
  
  // Check for deprecated component directories
  const deprecatedPaths = [
    join(projectRoot, 'src/components/ui'),
    join(projectRoot, 'src/components/deprecated'),
    join(projectRoot, 'src/components/old')
  ];
  
  deprecatedPaths.forEach(path => {
    if (existsSync(path)) {
      results.warnings.push(`Deprecated directory still exists: ${path}`);
      results.warningCount++;
      results.details.cleanup.warnings++;
      log(`Deprecated directory found: ${path}`, 'warning');
    } else {
      results.passed++;
      results.details.cleanup.passed++;
      log(`Deprecated directory cleaned up: ${path}`, 'success');
    }
  });
  
  // Scan all component files for deprecated imports
  const componentFiles = scanDirectory(join(projectRoot, 'src'));
  let deprecatedImportsFound = 0;
  
  componentFiles.forEach(filePath => {
    const issues = checkImportConsistency(filePath);
    if (issues.length > 0) {
      deprecatedImportsFound++;
      results.warnings.push(`${filePath}: ${issues.join(', ')}`);
      results.warningCount++;
      results.details.cleanup.warnings++;
    }
  });
  
  if (deprecatedImportsFound === 0) {
    results.passed++;
    results.details.cleanup.passed++;
    log('No deprecated imports found', 'success');
  } else {
    log(`Found deprecated imports in ${deprecatedImportsFound} files`, 'warning');
  }
}

function validateDesignSystemConsistency() {
  log('3. Validating Design System Consistency', 'section');
  
  // Check design token usage
  const componentFiles = scanDirectory(join(projectRoot, 'src/components'));
  let inconsistentFiles = 0;
  
  componentFiles.forEach(filePath => {
    const issues = checkDesignTokenUsage(filePath);
    if (issues.length > 0) {
      inconsistentFiles++;
      results.warnings.push(`${filePath}: ${issues.join(', ')}`);
      results.warningCount++;
      results.details.consistency.warnings++;
    }
  });
  
  if (inconsistentFiles === 0) {
    results.passed++;
    results.details.consistency.passed++;
    log('All components use design tokens consistently', 'success');
  } else {
    log(`Found design token inconsistencies in ${inconsistentFiles} files`, 'warning');
  }
  
  // Validate component exports
  const exportFiles = [
    join(__dirname, 'index.ts'),
    join(__dirname, 'primitives/index.ts'),
    join(projectRoot, 'src/components/shared/index.ts'),
    join(projectRoot, 'src/components/compositions/index.ts')
  ];
  
  exportFiles.forEach(filePath => {
    if (validateFile(filePath, `Export file: ${filePath}`, 'consistency')) {
      try {
        const content = readFileSync(filePath, 'utf8');
        if (content.includes('export') && content.length > 50) {
          results.passed++;
          results.details.consistency.passed++;
          log(`Export file has proper exports: ${filePath}`, 'success');
        } else {
          results.warnings.push(`Export file may be incomplete: ${filePath}`);
          results.warningCount++;
          results.details.consistency.warnings++;
          log(`Export file may be incomplete: ${filePath}`, 'warning');
        }
      } catch (error) {
        results.errors.push(`Error validating exports in ${filePath}: ${error.message}`);
        results.failed++;
        results.details.consistency.failed++;
      }
    }
  });
}

function validateAccessibilityCompliance() {
  log('4. Validating Accessibility Compliance', 'section');
  
  const componentFiles = scanDirectory(join(projectRoot, 'src/components'));
  let accessibilityIssues = 0;
  
  componentFiles.forEach(filePath => {
    const issues = checkAccessibilityCompliance(filePath);
    if (issues.length > 0) {
      accessibilityIssues++;
      results.warnings.push(`${filePath}: ${issues.join(', ')}`);
      results.warningCount++;
      results.details.accessibility.warnings++;
    }
  });
  
  if (accessibilityIssues === 0) {
    results.passed++;
    results.details.accessibility.passed++;
    log('No accessibility issues found', 'success');
  } else {
    log(`Found accessibility issues in ${accessibilityIssues} files`, 'warning');
  }
  
  // Check for accessibility documentation
  const accessibilityDocs = [
    join(__dirname, 'BEST_PRACTICES.md'),
    join(__dirname, 'MIGRATION_GUIDE.md')
  ];
  
  accessibilityDocs.forEach(docPath => {
    try {
      const content = readFileSync(docPath, 'utf8');
      if (content.includes('accessibility') || content.includes('ARIA') || content.includes('a11y')) {
        results.passed++;
        results.details.accessibility.passed++;
        log(`Accessibility documentation found in: ${docPath}`, 'success');
      } else {
        results.warnings.push(`No accessibility documentation in: ${docPath}`);
        results.warningCount++;
        results.details.accessibility.warnings++;
        log(`No accessibility documentation in: ${docPath}`, 'warning');
      }
    } catch (error) {
      results.errors.push(`Error checking accessibility docs in ${docPath}: ${error.message}`);
      results.failed++;
      results.details.accessibility.failed++;
    }
  });
}

function validatePerformanceOptimizations() {
  log('5. Validating Performance Optimizations', 'section');
  
  // Check for performance utilities
  const performanceFiles = [
    { path: join(__dirname, 'utils/performance.tsx'), desc: 'Performance utilities' },
    { path: join(__dirname, 'utils/lazy.tsx'), desc: 'Lazy loading utilities' },
    { path: join(__dirname, 'utils/exports.ts'), desc: 'Export optimization utilities' }
  ];
  
  performanceFiles.forEach(({ path, desc }) => {
    validateFile(path, desc, 'performance');
  });
  
  // Check for proper tree-shaking exports
  try {
    const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf8');
    if (indexContent.includes('export {') && !indexContent.includes('export *')) {
      results.passed++;
      results.details.performance.passed++;
      log('Tree-shaking friendly exports found', 'success');
    } else {
      results.warnings.push('Exports may not be optimized for tree-shaking');
      results.warningCount++;
      results.details.performance.warnings++;
      log('Exports may not be optimized for tree-shaking', 'warning');
    }
  } catch (error) {
    results.errors.push(`Error checking exports: ${error.message}`);
    results.failed++;
    results.details.performance.failed++;
  }
  
  // Check for React.memo usage in components
  const componentFiles = scanDirectory(join(__dirname, 'primitives'));
  let memoizedComponents = 0;
  
  componentFiles.forEach(filePath => {
    try {
      const content = readFileSync(filePath, 'utf8');
      if (content.includes('React.memo') || content.includes('memo(')) {
        memoizedComponents++;
      }
    } catch (error) {
      // Ignore read errors for this check
    }
  });
  
  if (memoizedComponents > 0) {
    results.passed++;
    results.details.performance.passed++;
    log(`Found ${memoizedComponents} memoized components`, 'success');
  } else {
    results.warnings.push('No memoized components found - consider performance optimization');
    results.warningCount++;
    results.details.performance.warnings++;
    log('No memoized components found', 'warning');
  }
}

function validateTestingSetup() {
  log('6. Validating Testing Setup', 'section');
  
  // Check for test files
  const testFiles = scanDirectory(join(__dirname, '__tests__'), ['.test.tsx', '.test.ts']);
  
  if (testFiles.length > 0) {
    results.passed++;
    results.details.consistency.passed++;
    log(`Found ${testFiles.length} test files`, 'success');
  } else {
    results.warnings.push('No test files found');
    results.warningCount++;
    results.details.consistency.warnings++;
    log('No test files found', 'warning');
  }
  
  // Check test setup
  const testSetupFile = join(__dirname, '__tests__/setup.ts');
  validateFile(testSetupFile, 'Test setup file', 'consistency');
  
  // Check for Storybook stories
  const storyFiles = scanDirectory(join(__dirname, 'stories'), ['.stories.tsx', '.stories.ts']);
  
  if (storyFiles.length > 0) {
    results.passed++;
    results.details.consistency.passed++;
    log(`Found ${storyFiles.length} Storybook stories`, 'success');
  } else {
    results.warnings.push('No Storybook stories found');
    results.warningCount++;
    results.details.consistency.warnings++;
    log('No Storybook stories found', 'warning');
  }
}

// Main validation function
function runComprehensiveValidation() {
  log('🎨 Running Comprehensive Design System Validation', 'info');
  console.log('');
  
  validateMigrationDocumentation();
  console.log('');
  
  validateDeprecatedComponentCleanup();
  console.log('');
  
  validateDesignSystemConsistency();
  console.log('');
  
  validateAccessibilityCompliance();
  console.log('');
  
  validatePerformanceOptimizations();
  console.log('');
  
  validateTestingSetup();
  console.log('');
  
  // Summary
  log('📊 Comprehensive Validation Summary', 'info');
  console.log(`✅ Total Passed: ${results.passed}`);
  console.log(`❌ Total Failed: ${results.failed}`);
  console.log(`⚠️  Total Warnings: ${results.warningCount}`);
  
  console.log('\\n📋 Category Breakdown:');
  Object.entries(results.details).forEach(([category, stats]) => {
    console.log(`  ${category}: ✅${stats.passed} ❌${stats.failed} ⚠️${stats.warnings}`);
  });
  
  if (results.errors.length > 0) {
    console.log('\\n🚨 Errors:');
    results.errors.forEach(error => console.log(`  - ${error}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\\n⚠️  Warnings:');
    results.warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log('');
  
  const criticalIssues = results.failed;
  const totalIssues = results.failed + results.warningCount;
  
  if (criticalIssues === 0 && totalIssues <= 5) {
    log('🎉 Design System validation completed successfully!', 'success');
    log('✨ All critical requirements met with minimal warnings', 'success');
    return true;
  } else if (criticalIssues === 0) {
    log('✅ Design System validation completed with warnings', 'warning');
    log(`⚠️  ${totalIssues} warnings found - consider addressing for optimal implementation`, 'warning');
    return true;
  } else {
    log(`❌ Design System validation failed with ${criticalIssues} critical errors`, 'error');
    log('🔧 Please address the errors above before proceeding', 'error');
    return false;
  }
}

// Run validation
const success = runComprehensiveValidation();
process.exit(success ? 0 : 1);