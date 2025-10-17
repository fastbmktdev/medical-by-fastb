#!/usr/bin/env node

/**
 * Database Check Script
 * 
 * This script checks if the required database tables exist
 * Run with: node scripts/check-database.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

// Simple .env parser (no need for dotenv package)
function loadEnv(path) {
  try {
    const content = readFileSync(path, 'utf-8');
    const lines = content.split('\n');
    const env = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          env[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return env;
  } catch (error) {
    console.error(`⚠️  Could not load .env.local: ${error.message}`);
    return {};
  }
}

const env = loadEnv(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required variables:');
  console.error('  - NEXT_PUBLIC_SUPABASE_URL');
  console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

console.log('🔍 Checking database tables...\n');

async function checkTable(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      if (error.code === '42P01') {
        console.log(`❌ Table "${tableName}" does NOT exist`);
        return { exists: false, error: error.code };
      } else if (error.code === 'PGRST301') {
        console.log(`⚠️  Table "${tableName}" exists but you don't have permission to access it`);
        return { exists: true, hasPermission: false, error: error.code };
      } else {
        console.log(`⚠️  Table "${tableName}" - Unknown error: ${error.message}`);
        return { exists: true, error: error.code, message: error.message };
      }
    }

    console.log(`✅ Table "${tableName}" exists (${count || 0} rows)`);
    return { exists: true, count: count || 0 };
  } catch (err) {
    console.log(`❌ Error checking "${tableName}": ${err.message}`);
    return { exists: false, error: err.message };
  }
}

async function checkStorage() {
  try {
    const { data, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.log(`❌ Error checking storage: ${error.message}`);
      return { exists: false };
    }

    const gymImagesBucket = data?.find(bucket => bucket.id === 'gym-images');
    
    if (gymImagesBucket) {
      console.log(`✅ Storage bucket "gym-images" exists`);
      return { exists: true };
    } else {
      console.log(`❌ Storage bucket "gym-images" does NOT exist`);
      return { exists: false };
    }
  } catch (err) {
    console.log(`❌ Error checking storage: ${err.message}`);
    return { exists: false };
  }
}

async function main() {
  const tables = ['user_roles', 'gyms', 'profiles'];
  const results = {};

  // Check tables
  for (const table of tables) {
    results[table] = await checkTable(table);
  }

  console.log('');
  
  // Check storage
  results.storage = await checkStorage();

  console.log('\n📊 Summary:');
  console.log('─────────────────────────────────────');

  const missingTables = Object.entries(results)
    .filter(([key, value]) => key !== 'storage' && !value.exists)
    .map(([key]) => key);

  if (missingTables.length === 0 && results.storage.exists) {
    console.log('✅ All required tables and storage buckets exist!');
    console.log('✅ Your database is properly set up.');
  } else {
    console.log('⚠️  Missing database components:');
    
    if (missingTables.length > 0) {
      console.log(`   Tables: ${missingTables.join(', ')}`);
    }
    
    if (!results.storage.exists) {
      console.log('   Storage: gym-images bucket');
    }
    
    console.log('\n📖 Next Steps:');
    console.log('1. Run the migration script in Supabase SQL Editor');
    console.log('2. File: supabase/migrations/partner_application_setup.sql');
    console.log('3. See MIGRATION_GUIDE.md for detailed instructions');
  }

  console.log('─────────────────────────────────────\n');
}

main().catch(console.error);

