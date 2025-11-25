#!/usr/bin/env node

/**
 * Apply Gallery Migration
 * Manually applies the hospital_gallery migration to the database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔧 Applying hospital_gallery migration...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20251221000000_hospital_gallery.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📏 SQL length:', sql.length, 'characters\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔢 Found ${statements.length} SQL statements\n`);

    // Execute each statement
    let successCount = 0;
    let skipCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (error) {
          // Check if it's a "already exists" error
          if (error.message.includes('already exists') || error.code === '42P07' || error.code === '42701') {
            console.log(`  ⚠️  Already exists (skipping): ${error.message}`);
            skipCount++;
          } else {
            console.error(`  ❌ Error: ${error.message}`);
          }
        } else {
          console.log(`  ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Exception: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${statements.length - successCount - skipCount}`);
    console.log('');

    // Verify table was created
    console.log('🔍 Verifying table creation...');
    const { data, error: verifyError } = await supabase
      .from('hospital_gallery')
      .select('count')
      .limit(1);

    if (verifyError) {
      console.error('❌ Table verification failed:', verifyError.message);
      console.log('\n💡 Tip: You may need to apply this migration through the Supabase Dashboard');
      console.log('   Or use the SQL Editor to run the migration file manually');
      process.exit(1);
    } else {
      console.log('✅ Table hospital_gallery verified!\n');
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Alternative: Direct SQL execution
async function applyMigrationDirect() {
  console.log('\n🔧 Applying hospital_gallery migration (Direct Method)...\n');

  try {
    const migrationPath = path.join(__dirname, '../../supabase/migrations/20251221000000_hospital_gallery.sql');
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📏 SQL length:', sql.length, 'characters\n');
    console.log('⚠️  Note: This method requires PostgreSQL client access');
    console.log('');
    console.log('Please run this command manually:');
    console.log('');
    console.log(`psql "${supabaseUrl.replace('https://', 'postgres://postgres:')}@db.${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co:5432/postgres" -f supabase/migrations/20251221000000_hospital_gallery.sql`);
    console.log('');
    console.log('Or copy the SQL content and paste it into the Supabase SQL Editor:');
    console.log(supabaseUrl.replace('/v1', '') + '/project/_/sql/new');
    console.log('');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Run
console.log('Choose method:');
console.log('1. Try programmatic execution (may not work)');
console.log('2. Show manual instructions');
console.log('');

// For now, show instructions
applyMigrationDirect();

