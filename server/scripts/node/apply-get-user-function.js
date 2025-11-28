/**
 * Apply get_user_by_username_or_email Function Migration
 * 
 * This script applies the migration to fix the get_user_by_username_or_email function
 * that may be missing from the schema cache.
 * 
 * Usage:
 *   node server/scripts/node/apply-get-user-function.js
 */

const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('\n🔧 Applying get_user_by_username_or_email function fix...\n');

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../../../shared/supabase/migrations/20251228000000_fix_get_user_by_username_or_email.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`);
      process.exit(1);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Migration file loaded');
    console.log('📏 SQL length:', sql.length, 'characters\n');

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`🔢 Found ${statements.length} SQL statements\n`);

    // Execute each statement using Supabase RPC (if exec_sql exists) or direct query
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip comments
      if (statement.trim().startsWith('--')) {
        continue;
      }

      try {
        console.log(`[${i + 1}/${statements.length}] Executing...`);
        
        // Try using RPC exec_sql if available
        const { error: rpcError } = await supabase.rpc('exec_sql', { sql_query: statement });
        
        if (rpcError) {
          // If exec_sql doesn't exist, try direct query (for CREATE/DROP FUNCTION)
          if (rpcError.message.includes('function exec_sql') || rpcError.code === '42883') {
            console.log('  ℹ️  exec_sql not available, trying alternative method...');
            
            // For function creation, we need to use a different approach
            // Since Supabase client doesn't support direct SQL execution,
            // we'll provide instructions
            console.log('\n⚠️  Direct SQL execution not available through Supabase client.');
            console.log('📋 Please run this migration manually using one of these methods:\n');
            console.log('Method 1: Use npx supabase (Recommended)');
            console.log('  npx supabase db push\n');
            console.log('Method 2: Supabase Dashboard SQL Editor');
            console.log('  1. Go to: https://supabase.com/dashboard/project/_/sql/new');
            console.log('  2. Copy and paste the SQL from the migration file');
            console.log(`  3. File location: ${migrationPath}\n`);
            console.log('Method 3: Use psql (if you have database connection)');
            console.log('  psql "YOUR_DATABASE_URL" -f shared/supabase/migrations/20251228000000_fix_get_user_by_username_or_email.sql\n');
            
            // Show the SQL content
            console.log('\n📄 SQL Content to run:\n');
            console.log('='.repeat(60));
            console.log(sql);
            console.log('='.repeat(60));
            
            process.exit(0);
          } else if (rpcError.message.includes('already exists') || rpcError.code === '42P07' || rpcError.code === '42701') {
            console.log(`  ⚠️  Already exists (skipping): ${rpcError.message}`);
            skipCount++;
          } else {
            console.error(`  ❌ Error: ${rpcError.message}`);
            errorCount++;
          }
        } else {
          console.log(`  ✅ Success`);
          successCount++;
        }
      } catch (err) {
        console.error(`  ❌ Exception: ${err.message}`);
        errorCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`⚠️  Skipped: ${skipCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('');

    // Verify function exists
    if (successCount > 0 || skipCount > 0) {
      console.log('🔍 Verifying function exists...');
      const { data, error: verifyError } = await supabase
        .rpc('get_user_by_username_or_email', { identifier: 'test@example.com' });
      
      if (verifyError) {
        if (verifyError.message.includes('Could not find the function')) {
          console.error('❌ Function still not found in schema cache');
          console.log('\n💡 This might be a schema cache issue. Try:');
          console.log('   1. Wait a few minutes and try again');
          console.log('   2. Restart your Supabase project');
          console.log('   3. Run the SQL directly in Supabase Dashboard SQL Editor');
        } else {
          // Function exists but test query failed (expected for non-existent user)
          console.log('✅ Function exists (test query returned expected error)');
        }
      } else {
        console.log('✅ Function verified successfully!\n');
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run
applyMigration().catch(console.error);

