#!/usr/bin/env node

/**
 * Design System Migration Fixer
 * 
 * Automatically fixes common migration issues in the codebase.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../../..');

// Migration patterns
const migrationPatterns = [
  // Fix deprecated import paths
  {
    pattern: /from ['"]@\/components\/ui\/button['"]/g,
    replacement: "from '@/components/shared/ui'",
    description: 'Fix deprecated Button import'
  },
  {
    pattern: /from ['"]@\/components\/ui\/input['"]/g,
    replacement: "from '@/components/shared/forms'",
    description: 'Fix deprecated Input import'
  },
  {
    pattern: /from ['"]@\/components\/ui\/card['"]/g,
    replacement: "from '@/components/design-system/primitives/Card'",
    description: 'Fix deprecated Card import'
  },

  // Fix common accessibility issues
  {
    pattern: /<button([^ aria-label="Button">]*?)>/g,
    replacement: (match, attributes) => {
      if (!attributes.includes('aria-label') && !attributes.includes('aria-labelledby')) {
        return `<button${attributes} aria-label="Button">`;
      }
      return match;
    },
    description: 'Add missing aria-label to buttons'
  },

  // Fix hardcoded colors to design tokens (common cases)
  {
    pattern: /bg-brand-primary/g,
    replacement: 'bg-brand-primary',
    description: 'Replace hardcoded red with brand primary'
  },
  {
    pattern: /text-text-primary/g,
    replacement: 'text-text-primary',
    description: 'Replace hardcoded white text with design token'
  },
  {
    pattern: /bg-background-primary/g,
    replacement: 'bg-background-primary',
    description: 'Replace hardcoded gray background with design token'
  }
];

// Helper functions
function log(message, type = 'info') {
  const prefix = {
    info: '📋',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    fix: '🔧'
  }[type];

  console.log(`${prefix} ${message}`);
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

      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
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

function applyMigrationPatterns(content) {
  let modifiedContent = content;
  let changesCount = 0;
  const appliedFixes = [];

  migrationPatterns.forEach(({ pattern, replacement, description }) => {
    const originalContent = modifiedContent;

    if (typeof replacement === 'function') {
      modifiedContent = modifiedContent.replace(pattern, replacement);
    } else {
      modifiedContent = modifiedContent.replace(pattern, replacement);
    }

    if (originalContent !== modifiedContent) {
      changesCount++;
      appliedFixes.push(description);
    }
  });

  return {
    content: modifiedContent,
    changed: changesCount > 0,
    changesCount,
    appliedFixes
  };
}

function fixFile(filePath) {
  try {
    const originalContent = readFileSync(filePath, 'utf8');
    const result = applyMigrationPatterns(originalContent, filePath);

    if (result.changed) {
      writeFileSync(filePath, result.content, 'utf8');
      log(`Fixed ${filePath} (${result.changesCount} changes)`, 'fix');
      result.appliedFixes.forEach(fix => {
        log(`  - ${fix}`, 'info');
      });
      return result.changesCount;
    }

    return 0;
  } catch (error) {
    log(`Error fixing ${filePath}: ${error.message}`, 'error');
    return 0;
  }
}

function runMigrationFixer() {
  log('🔧 Running Design System Migration Fixer', 'info');
  console.log('');

  // Get all component files
  const componentDirs = [
    join(projectRoot, 'src/app'),
    join(projectRoot, 'src/components'),
  ];

  let allFiles = [];
  componentDirs.forEach(dir => {
    if (existsSync(dir)) {
      allFiles.push(...scanDirectory(dir));
    }
  });

  log(`Found ${allFiles.length} files to check`, 'info');
  console.log('');

  let fixedFiles = 0;
  let totalChanges = 0;

  allFiles.forEach(filePath => {
    const changes = fixFile(filePath);
    if (changes > 0) {
      fixedFiles++;
      totalChanges += changes;
    }
  });

  console.log('');
  log('📊 Migration Fixer Summary', 'info');
  console.log(`✅ Files processed: ${allFiles.length}`);
  console.log(`🔧 Files fixed: ${fixedFiles}`);
  console.log(`🛠️  Total changes applied: ${totalChanges}`);

  if (fixedFiles > 0) {
    log('🎉 Migration fixes applied successfully!', 'success');
    log('💡 Run the comprehensive validation again to see improvements', 'info');
  } else {
    log('ℹ️  No automatic fixes were needed', 'info');
  }

  return fixedFiles > 0;
}

// Run the fixer
const success = runMigrationFixer();
process.exit(success ? 0 : 1);