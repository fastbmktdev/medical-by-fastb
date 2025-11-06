#!/usr/bin/env node

/**
 * Create Test Users Script
 * 
 * สร้าง test users สำหรับ development และ testing
 * 
 * Usage:
 *   node scripts/node/create-test-users.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env.local') });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test users configuration
const TEST_USERS = [
  {
    email: 'test_user@muaythai.com',
    password: 'Test@1234567890',
    full_name: 'Test Regular User',
    username: 'testuser',
    phone: '+66812345678',
    role: 'authenticated'
  },
  {
    email: 'test_partner@muaythai.com',
    password: 'Test@1234567890',
    full_name: 'Test Partner User',
    username: 'testpartner',
    phone: '+66823456789',
    role: 'partner'
  },
  {
    email: 'test_admin@muaythai.com',
    password: 'Test@1234567890',
    full_name: 'Test Admin User',
    username: 'testadmin',
    phone: '+66834567890',
    role: 'admin'
  }
];

// Helper functions
function log(message, type = 'info') {
  const prefix = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`${prefix} ${message}`);
}

async function checkUserExists(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) throw error;
    
    const user = data.users.find(u => u.email === email);
    return user ? user.id : null;
  } catch (error) {
    console.error('Error checking user:', error);
    return null;
  }
}

async function createUser(userData) {
  const { email, password, full_name, username, phone, role } = userData;

  try {
    // Check if user already exists
    const existingUserId = await checkUserExists(email);
    if (existingUserId) {
      log(`User already exists: ${email} (ID: ${existingUserId})`, 'warning');
      
      // Update role if needed
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: existingUserId,
          role
        }, {
          onConflict: 'user_id'
        });

      if (roleError) {
        log(`Warning: Could not update role: ${roleError.message}`, 'warning');
      } else {
        log(`Updated role to: ${role}`, 'success');
      }

      return { userId: existingUserId, created: false };
    }

    log(`Creating user: ${email} (${role})...`, 'info');

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        username,
        phone
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    const userId = authData.user.id;
    log(`User created in auth: ${userId}`, 'success');

    // Wait a bit for triggers to complete
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username,
        full_name,
        phone
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      log(`Warning: Profile error: ${profileError.message}`, 'warning');
    } else {
      log(`Profile created/updated`, 'success');
    }

    // Update user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      log(`Warning: Role error: ${roleError.message}`, 'warning');
    } else {
      log(`Role set to: ${role}`, 'success');
    }

    // Initialize user points for gamification
    const { error: pointsError } = await supabase
      .from('user_points')
      .upsert({
        user_id: userId,
        points: 0,
        level: 1,
        points_to_next_level: 100
      }, {
        onConflict: 'user_id'
      });

    if (pointsError) {
      log(`Warning: Points initialization error: ${pointsError.message}`, 'warning');
    }

    return { userId, created: true };
  } catch (error) {
    log(`Failed to create user ${email}: ${error.message}`, 'error');
    throw error;
  }
}

async function main() {
  console.log('\n🧪 Creating Test Users\n');
  console.log('='.repeat(60));

  const results = {
    created: 0,
    existing: 0,
    failed: 0
  };

  for (const userData of TEST_USERS) {
    try {
      const result = await createUser(userData);
      if (result.created) {
        results.created++;
      } else {
        results.existing++;
      }
      console.log(''); // Empty line between users
    } catch (error) {
      results.failed++;
      console.log(''); // Empty line between users
    }
  }

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Summary');
  console.log('='.repeat(60));
  log(`Created: ${results.created}`, 'success');
  log(`Existing: ${results.existing}`, 'warning');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'error' : 'success');

  console.log('\n📝 Test Users Credentials:');
  console.log('='.repeat(60));
  TEST_USERS.forEach(user => {
    console.log(`\n${user.role.toUpperCase()}:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Password: ${user.password}`);
    console.log(`  Username: ${user.username}`);
  });

  console.log('\n' + '='.repeat(60));
  log('Done!', 'success');
  console.log('');
}

// Run
main().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});

