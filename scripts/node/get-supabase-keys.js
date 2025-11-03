#!/usr/bin/env node

/**
 * Script to get Supabase URL and ANON KEY
 * 
 * This script helps you:
 * 1. Connect to Supabase Dashboard and get your keys
 * 2. Or use local Supabase if you have it running
 * 3. Set up your .env.local file with the correct values
 * 
 * Usage: node scripts/get-supabase-keys.js
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import readline from 'node:readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Main async function
(async () => {
  console.log('\n🔍 Getting Supabase URL and ANON KEY\n');
  console.log('='.repeat(60));

  // Check if Supabase CLI is available
  let supabaseCliAvailable = false;
  try {
    execSync('which supabase', { stdio: 'ignore' });
    supabaseCliAvailable = true;
  } catch (e) {
    supabaseCliAvailable = false;
  }

  // Try to get keys from local Supabase first
  let localKeys = null;
  if (supabaseCliAvailable) {
    try {
      console.log('\n📋 Checking for local Supabase instance...');
      const status = execSync('supabase status', { encoding: 'utf8' });
      
      // Parse status output - handle different formats
      const apiUrlMatch = status.match(/API URL:\s+(\S+)/);
      // Try different key patterns
      const anonKeyMatch = status.match(/(?:anon key|Publishable key):\s+(\S+)/i);
      const serviceRoleKeyMatch = status.match(/(?:service_role key|Secret key):\s+(\S+)/i);
      
      if (apiUrlMatch && anonKeyMatch) {
        localKeys = {
          url: apiUrlMatch[1].trim(),
          anonKey: anonKeyMatch[1].trim(),
          serviceRoleKey: serviceRoleKeyMatch ? serviceRoleKeyMatch[1].trim() : null
        };
        
        console.log('✅ Found local Supabase instance!');
        console.log(`   API URL: ${localKeys.url}`);
        console.log(`   Anon Key: ${localKeys.anonKey.substring(0, 30)}...`);
        
        const useLocal = await question('\n❓ Use local Supabase keys? (y/n): ');
        if (useLocal.toLowerCase() === 'y' || useLocal.toLowerCase() === 'yes') {
          await updateEnvFile(localKeys);
          rl.close();
          process.exit(0);
        }
      }
    } catch (e) {
      console.log('   ⚠️  Local Supabase not running or not found');
    }
  }

  // Guide user to get keys from Supabase Dashboard
  console.log('\n📚 How to get your Supabase URL and ANON KEY:\n');
  console.log('1. Go to https://app.supabase.com');
  console.log('2. Select your project (or create a new one)');
  console.log('3. Go to Project Settings (gear icon in sidebar)');
  console.log('4. Click on "API" in the left menu');
  console.log('5. You will see:');
  console.log('   - Project URL (this is your SUPABASE_URL)');
  console.log('   - anon/public key (this is your SUPABASE_ANON_KEY)');
  console.log('   - service_role key (this is your SUPABASE_SERVICE_ROLE_KEY - keep secret!)\n');

  const useDashboard = await question('❓ Do you have your keys from Supabase Dashboard? (y/n): ');

  if (useDashboard.toLowerCase() !== 'y' && useDashboard.toLowerCase() !== 'yes') {
    console.log('\n💡 Please visit https://app.supabase.com to get your keys, then run this script again.');
    rl.close();
    process.exit(0);
  }

  console.log('\n📝 Please enter your Supabase credentials:\n');

  const supabaseUrl = await question('Enter SUPABASE_URL (e.g., https://xxxxx.supabase.co): ');
  const supabaseAnonKey = await question('Enter SUPABASE_ANON_KEY: ');
  const serviceRoleKey = await question('Enter SUPABASE_SERVICE_ROLE_KEY (optional, press Enter to skip): ');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('\n❌ SUPABASE_URL and SUPABASE_ANON_KEY are required!');
    rl.close();
    process.exit(1);
  }

  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    console.log('\n❌ Invalid URL format! Please check your SUPABASE_URL.');
    rl.close();
    process.exit(1);
  }

  const keys = {
    url: supabaseUrl.trim(),
    anonKey: supabaseAnonKey.trim(),
    serviceRoleKey: serviceRoleKey.trim() || null
  };

  await updateEnvFile(keys);
  rl.close();
})().catch(error => {
  console.error('\n❌ Error:', error.message);
  rl.close();
  process.exit(1);
});

async function updateEnvFile(keys) {
  const envPath = join(process.cwd(), '.env.local');
  
  let envContent = '';
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf8');
  }
  
  // Remove old Supabase entries
  const lines = envContent.split('\n');
  const filteredLines = lines.filter(line => {
    return !line.includes('NEXT_PUBLIC_SUPABASE_URL') &&
           !line.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY') &&
           !line.includes('SUPABASE_URL') &&
           !line.includes('SUPABASE_ANON_KEY') &&
           !line.includes('SUPABASE_SERVICE_ROLE_KEY');
  });
  
  // Add new entries
  const newEntries = [
    '',
    '# Supabase Configuration',
    `NEXT_PUBLIC_SUPABASE_URL=${keys.url}`,
    `NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.anonKey}`,
    `SUPABASE_URL=${keys.url}`,
    `SUPABASE_ANON_KEY=${keys.anonKey}`
  ];
  
  if (keys.serviceRoleKey) {
    newEntries.push(`SUPABASE_SERVICE_ROLE_KEY=${keys.serviceRoleKey}`);
  }
  
  const updatedContent = [...filteredLines, ...newEntries].join('\n');
  
  // Create backup
  if (existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    writeFileSync(backupPath, envContent);
    console.log(`\n✅ Backup created: ${backupPath}`);
  }
  
  writeFileSync(envPath, updatedContent);
  
  console.log('\n✅ Updated .env.local successfully!');
  console.log('\n📝 Current configuration:');
  console.log(`   NEXT_PUBLIC_SUPABASE_URL=${keys.url}`);
  console.log(`   NEXT_PUBLIC_SUPABASE_ANON_KEY=${keys.anonKey.substring(0, 30)}...`);
  if (keys.serviceRoleKey) {
    console.log(`   SUPABASE_SERVICE_ROLE_KEY=${keys.serviceRoleKey.substring(0, 30)}...`);
  }
  console.log('\n⚠️  IMPORTANT: Restart your Next.js dev server for changes to take effect!');
  console.log('   Stop server (Ctrl+C) and run: npm run dev\n');
  
  // Test connection
  console.log('🧪 Testing connection...');
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(keys.url, keys.anonKey);
    
    const { data, error } = await supabase.from('_realtime').select('count').limit(1);
    
    if (error && !error.message.includes('relation') && !error.message.includes('permission')) {
      console.log(`   ⚠️  Connection test: ${error.message}`);
    } else {
      console.log('   ✅ Connection successful!');
    }
  } catch (error) {
    console.log(`   ⚠️  Connection test failed: ${error.message}`);
    console.log('   💡 This might be normal. Please test with: node scripts/test-supabase-connection.js');
  }
}

