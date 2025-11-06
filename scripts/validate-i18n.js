#!/usr/bin/env node

/**
 * I18n Validation Script
 * ตรวจสอบความสอดคล้องของไฟล์แปลภาษาทั้ง 3 ภาษา
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// สี ANSI สำหรับ console
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// อ่านไฟล์ JSON
function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error(colorize(`❌ ไม่สามารถอ่านไฟล์ ${filePath}:`, 'red'), error.message);
    process.exit(1);
  }
}

// ดึง keys ทั้งหมดจาก object (แบบ nested)
function getKeys(obj, prefix = '') {
  let keys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(getKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

// เปรียบเทียบ arrays
function arrayDiff(arr1, arr2) {
  return arr1.filter(item => !arr2.includes(item));
}

// ตรวจสอบค่าว่าง
function findEmptyValues(obj, prefix = '') {
  let emptyKeys = [];
  for (let key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      emptyKeys = emptyKeys.concat(findEmptyValues(obj[key], fullKey));
    } else if (obj[key] === '' || obj[key] === null || obj[key] === undefined) {
      emptyKeys.push(fullKey);
    }
  }
  return emptyKeys;
}

// Main validation
function validateI18n() {
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  console.log(colorize('  🌐 I18n Validation Script', 'cyan'));
  console.log(colorize('='.repeat(60), 'cyan') + '\n');

  const messagesDir = path.join(__dirname, '../messages');

  // อ่านไฟล์ทั้ง 3 ภาษา
  const thPath = path.join(messagesDir, 'th.json');
  const enPath = path.join(messagesDir, 'en.json');
  const jpPath = path.join(messagesDir, 'jp.json');

  console.log(colorize('📂 กำลังอ่านไฟล์แปล...', 'blue'));
  const th = readJsonFile(thPath);
  const en = readJsonFile(enPath);
  const jp = readJsonFile(jpPath);
  console.log(colorize('   ✓ อ่านไฟล์เสร็จสิ้น\n', 'green'));

  // ดึง keys
  console.log(colorize('🔍 กำลังตรวจสอบ keys...', 'blue'));
  const thKeys = getKeys(th).sort();
  const enKeys = getKeys(en).sort();
  const jpKeys = getKeys(jp).sort();

  console.log(colorize(`   📝 TH keys: ${thKeys.length}`, 'cyan'));
  console.log(colorize(`   📝 EN keys: ${enKeys.length}`, 'cyan'));
  console.log(colorize(`   📝 JP keys: ${jpKeys.length}\n`, 'cyan'));

  let hasErrors = false;

  // ตรวจสอบ keys ที่ไม่ตรงกัน
  console.log(colorize('🔎 ตรวจสอบความสอดคล้องของ keys...', 'blue'));

  const missingInEn = arrayDiff(thKeys, enKeys);
  const missingInJp = arrayDiff(thKeys, jpKeys);
  const extraInEn = arrayDiff(enKeys, thKeys);
  const extraInJp = arrayDiff(jpKeys, thKeys);

  if (missingInEn.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n❌ Keys ที่ขาดหายไปใน EN (${missingInEn.length}):`, 'red'));
    missingInEn.forEach(key => console.log(colorize(`   - ${key}`, 'red')));
  }

  if (missingInJp.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n❌ Keys ที่ขาดหายไปใน JP (${missingInJp.length}):`, 'red'));
    missingInJp.forEach(key => console.log(colorize(`   - ${key}`, 'red')));
  }

  if (extraInEn.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n❌ Keys ที่เกินมาใน EN (${extraInEn.length}):`, 'red'));
    extraInEn.forEach(key => console.log(colorize(`   - ${key}`, 'red')));
  }

  if (extraInJp.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n❌ Keys ที่เกินมาใน JP (${extraInJp.length}):`, 'red'));
    extraInJp.forEach(key => console.log(colorize(`   - ${key}`, 'red')));
  }

  if (!hasErrors) {
    console.log(colorize('   ✓ Keys ทั้งหมดตรงกัน', 'green'));
  }

  // ตรวจสอบค่าว่าง
  console.log(colorize('\n🔎 ตรวจสอบค่าว่าง...', 'blue'));

  const emptyInTh = findEmptyValues(th);
  const emptyInEn = findEmptyValues(en);
  const emptyInJp = findEmptyValues(jp);

  if (emptyInTh.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n⚠️  ค่าว่างใน TH (${emptyInTh.length}):`, 'yellow'));
    emptyInTh.forEach(key => console.log(colorize(`   - ${key}`, 'yellow')));
  }

  if (emptyInEn.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n⚠️  ค่าว่างใน EN (${emptyInEn.length}):`, 'yellow'));
    emptyInEn.forEach(key => console.log(colorize(`   - ${key}`, 'yellow')));
  }

  if (emptyInJp.length > 0) {
    hasErrors = true;
    console.log(colorize(`\n⚠️  ค่าว่างใน JP (${emptyInJp.length}):`, 'yellow'));
    emptyInJp.forEach(key => console.log(colorize(`   - ${key}`, 'yellow')));
  }

  if (emptyInTh.length === 0 && emptyInEn.length === 0 && emptyInJp.length === 0) {
    console.log(colorize('   ✓ ไม่มีค่าว่าง', 'green'));
  }

  // ตรวจสอบ JSON format
  console.log(colorize('\n🔎 ตรวจสอบ JSON format...', 'blue'));
  try {
    JSON.stringify(th, null, 2);
    JSON.stringify(en, null, 2);
    JSON.stringify(jp, null, 2);
    console.log(colorize('   ✓ JSON format ถูกต้องทั้งหมด', 'green'));
  } catch (error) {
    hasErrors = true;
    console.log(colorize('   ❌ JSON format ไม่ถูกต้อง', 'red'));
  }

  // สรุปผล
  console.log('\n' + colorize('='.repeat(60), 'cyan'));
  if (hasErrors) {
    console.log(colorize('  ❌ พบข้อผิดพลาด กรุณาแก้ไข', 'red'));
    console.log(colorize('='.repeat(60), 'cyan') + '\n');
    process.exit(1);
  } else {
    console.log(colorize('  ✅ ผ่านการตรวจสอบทั้งหมด!', 'green'));
    console.log(colorize('='.repeat(60), 'cyan') + '\n');
    process.exit(0);
  }
}

// เรียกใช้งาน
validateI18n();
