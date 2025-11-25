#!/usr/bin/env node

/**
 * Migration Optimization Script
 * Reduces file size by:
 * - Shortening long section dividers
 * - Removing excessive blank lines
 * - Removing redundant comments
 * - Keeping essential comments
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, '../../supabase/migrations');

function optimizeMigration(content) {
  let optimized = content;

  // 1. Replace long section dividers (-- ==========) with shorter ones (-- ---)
  // Match lines that start with -- followed by 20+ equal signs (with optional trailing text)
  // Use multiline flag to match start/end of line
  optimized = optimized.replace(/^-- ={20,}.*$/gm, '-- ---');
  
  // 2. Remove duplicate section divider patterns (multiple consecutive divider lines)
  optimized = optimized.replace(/(-- ---\n)+-- ---/g, '-- ---');
  
  // 3. Remove section divider lines that are just dividers (keep content comments)
  optimized = optimized.replace(/^-- ---\s*$/gm, '-- ---');
  
  // 4. Replace multiple consecutive blank lines (4+ lines) with max 2 blank lines
  optimized = optimized.replace(/\n{4,}/g, '\n\n\n');
  
  // 5. Replace 3 blank lines with 2 blank lines
  optimized = optimized.replace(/\n{3}/g, '\n\n');
  
  // 6. Remove blank lines before section dividers (keep divider, remove blank line before)
  optimized = optimized.replace(/\n{2,}(-- ---)/g, '\n$1');
  
  // 7. Remove blank lines after section dividers if next line is another comment
  optimized = optimized.replace(/(-- ---)\n{2,}(--)/g, '$1\n$2');
  
  // 8. Remove trailing blank lines at end of file
  optimized = optimized.trimEnd() + '\n';
  
  // 9. Remove excessive blank lines before comments (keep max 1)
  optimized = optimized.replace(/\n{3,}(--)/g, '\n\n$1');
  
  // 10. Remove blank lines between consecutive comments (keep only one)
  optimized = optimized.replace(/(--[^\n]*)\n{2,}(--)/g, '$1\n$2');
  
  return optimized;
}

function optimizeMigrations() {
  console.log('🔧 Optimizing migration files...\n');
  
  const files = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;
  const stats = [];
  
  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const originalSize = Buffer.byteLength(originalContent, 'utf8');
    totalOriginalSize += originalSize;
    
    const optimizedContent = optimizeMigration(originalContent);
    const optimizedSize = Buffer.byteLength(optimizedContent, 'utf8');
    totalOptimizedSize += optimizedSize;
    
    const saved = originalSize - optimizedSize;
    const savedPercent = ((saved / originalSize) * 100).toFixed(1);
    
    stats.push({
      file,
      originalSize,
      optimizedSize,
      saved,
      savedPercent
    });
    
    // Write optimized content
    fs.writeFileSync(filePath, optimizedContent, 'utf8');
    
    console.log(`✅ ${file}`);
    console.log(`   Original: ${(originalSize / 1024).toFixed(1)} KB`);
    console.log(`   Optimized: ${(optimizedSize / 1024).toFixed(1)} KB`);
    console.log(`   Saved: ${(saved / 1024).toFixed(1)} KB (${savedPercent}%)\n`);
  }
  
  const totalSaved = totalOriginalSize - totalOptimizedSize;
  const totalSavedPercent = ((totalSaved / totalOriginalSize) * 100).toFixed(1);
  
  console.log('='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total files optimized: ${files.length}`);
  console.log(`Original total size: ${(totalOriginalSize / 1024).toFixed(1)} KB`);
  console.log(`Optimized total size: ${(totalOptimizedSize / 1024).toFixed(1)} KB`);
  console.log(`Total saved: ${(totalSaved / 1024).toFixed(1)} KB (${totalSavedPercent}%)`);
  console.log('='.repeat(60));
  
  // Show top 5 files with most savings
  console.log('\n🏆 Top 5 files with most savings:');
  stats
    .sort((a, b) => b.saved - a.saved)
    .slice(0, 5)
    .forEach((stat, index) => {
      console.log(`  ${index + 1}. ${stat.file} - ${(stat.saved / 1024).toFixed(1)} KB (${stat.savedPercent}%)`);
    });
}

// Run optimization
try {
  optimizeMigrations();
  console.log('\n✅ Migration optimization completed successfully!');
} catch (error) {
  console.error('❌ Error optimizing migrations:', error);
  process.exit(1);
}

