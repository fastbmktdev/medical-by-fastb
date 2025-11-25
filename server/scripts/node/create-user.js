#!/usr/bin/env node

/**
 * User Creation Script
 * 
 * This script provides functions to create users in the database
 * It can be run from command line or imported as a module
 * 
 * Usage:
 *   node create-user.js
 *   node create-user.js --email user@example.com --password password123
 *   node create-user.js --test-users
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Create a single user with profile and role
 */
async function createUser(userData) {
  const {
    email,
    password,
    full_name = null,
    username = null,
    phone = null,
    role = 'authenticated',
    avatar_url = null
  } = userData;

  try {
    console.log(`🔄 Creating user: ${email}`);

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        username,
        phone,
        avatar_url
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Update profile if it already exists (created by trigger)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        username,
        full_name,
        phone,
        avatar_url
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.warn(`⚠️  Profile creation warning: ${profileError.message}`);
    }

    // Update user role if it already exists (created by trigger)
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: userId,
        role
      }, {
        onConflict: 'user_id'
      });

    if (roleError) {
      console.warn(`⚠️  Role creation warning: ${roleError.message}`);
    }

    // Initialize user points for gamification
    const { error: pointsError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: 0,
        current_level: 1,
        points_to_next_level: 100
      });

    if (pointsError) {
      console.warn(`⚠️  Points initialization warning: ${pointsError.message}`);
    }

    console.log(`✅ User created successfully: ${email} (ID: ${userId})`);
    return {
      success: true,
      user_id: userId,
      email,
      username,
      full_name,
      role,
      message: 'User created successfully'
    };

  } catch (error) {
    console.error(`❌ Failed to create user ${email}:`, error.message);
    return {
      success: false,
      email,
      error: error.message
    };
  }
}

/**
 * Create multiple users
 */
async function createMultipleUsers(usersData) {
  console.log(`🔄 Creating ${usersData.length} users...`);
  
  const results = [];
  
  for (const userData of usersData) {
    const result = await createUser(userData);
    results.push(result);
    
    // Add small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n📊 Summary:`);
  console.log(`✅ Successfully created: ${successCount} users`);
  console.log(`❌ Failed to create: ${failureCount} users`);
  
  return results;
}

/**
 * Create test users for development
 */
async function createTestUsers() {
  const testUsers = [
    {
      email: 'admin@medical.com',
      password: 'admin123456',
      full_name: 'Admin User',
      username: 'admin',
      phone: '+66812345678',
      role: 'admin'
    },
    {
      email: 'partner@medical.com',
      password: 'partner123456',
      full_name: 'Partner User',
      username: 'partner',
      phone: '+66887654321',
      role: 'partner'
    },
    {
      email: 'user@medical.com',
      password: 'user123456',
      full_name: 'Regular User',
      username: 'user',
      phone: '+66811111111',
      role: 'authenticated'
    },
    {
      email: 'hospitalowner@medical.com',
      password: 'hospital123456',
      full_name: 'hospital Owner',
      username: 'hospitalowner',
      phone: '+66822222222',
      role: 'authenticated'
    },
    {
      email: 'doctor@medical.com',
      password: 'trainer123456',
      full_name: 'Medical doctor',
      username: 'doctor',
      phone: '+66833333333',
      role: 'authenticated'
    }
  ];

  console.log('🧪 Creating test users for development...');
  return await createMultipleUsers(testUsers);
}

/**
 * Check if user exists
 */
async function userExists(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) return false;
    return data.users.some(user => user.email === email);
  } catch (error) {
    return false;
  }
}

/**
 * Get user details
 */
async function getUserDetails(email) {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) return null;
    
    const user = data.users.find(u => u.email === email);
    if (!user) return null;

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    const { data: role } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    return {
      user_id: user.id,
      email: user.email,
      username: profile?.username,
      full_name: profile?.full_name,
      phone: profile?.phone,
      role: role?.role,
      avatar_url: profile?.avatar_url,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at
    };
  } catch (error) {
    console.error('Error getting user details:', error.message);
    return null;
  }
}

/**
 * List all users
 */
async function listAllUsers() {
  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw error;
    }

    console.log(`\n👥 Found ${data.users.length} users:`);
    console.log('=' .repeat(80));
    
    for (const user of data.users) {
      const details = await getUserDetails(user.email);
      console.log(`📧 ${user.email}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Name: ${details?.full_name || 'N/A'}`);
      console.log(`   Username: ${details?.username || 'N/A'}`);
      console.log(`   Role: ${details?.role || 'N/A'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log('-'.repeat(40));
    }
    
    return data.users;
  } catch (error) {
    console.error('❌ Error listing users:', error.message);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage: node create-user.js [options]

Options:
  --email <email>           User email
  --password <password>     User password
  --full-name <name>        User full name
  --username <username>     Username
  --phone <phone>           Phone number
  --role <role>             User role (authenticated, partner, admin)
  --test-users              Create test users for development
  --list-users              List all users
  --check <email>           Check if user exists
  --details <email>         Get user details
  --help, -h                Show this help message

Examples:
  node create-user.js --test-users
  node create-user.js --email user@example.com --password password123
  node create-user.js --list-users
  node create-user.js --check user@example.com
    `);
    return;
  }

  if (args.includes('--list-users')) {
    await listAllUsers();
    return;
  }

  if (args.includes('--check')) {
    const emailIndex = args.indexOf('--check') + 1;
    const email = args[emailIndex];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      return;
    }
    
    const exists = await userExists(email);
    console.log(`User ${email} ${exists ? 'exists' : 'does not exist'}`);
    return;
  }

  if (args.includes('--details')) {
    const emailIndex = args.indexOf('--details') + 1;
    const email = args[emailIndex];
    
    if (!email) {
      console.error('❌ Please provide an email address');
      return;
    }
    
    const details = await getUserDetails(email);
    if (details) {
      console.log('👤 User Details:');
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log(`❌ User ${email} not found`);
    }
    return;
  }

  if (args.includes('--test-users')) {
    await createTestUsers();
    return;
  }

  // Parse command line arguments for single user creation
  const emailIndex = args.indexOf('--email');
  const passwordIndex = args.indexOf('--password');
  const fullNameIndex = args.indexOf('--full-name');
  const usernameIndex = args.indexOf('--username');
  const phoneIndex = args.indexOf('--phone');
  const roleIndex = args.indexOf('--role');

  if (emailIndex === -1 || passwordIndex === -1) {
    console.log('❌ Please provide --email and --password');
    console.log('Use --help for usage information');
    return;
  }

  const userData = {
    email: args[emailIndex + 1],
    password: args[passwordIndex + 1],
    full_name: fullNameIndex !== -1 ? args[fullNameIndex + 1] : null,
    username: usernameIndex !== -1 ? args[usernameIndex + 1] : null,
    phone: phoneIndex !== -1 ? args[phoneIndex + 1] : null,
    role: roleIndex !== -1 ? args[roleIndex + 1] : 'authenticated'
  };

  await createUser(userData);
}

// Export functions for use as module
export {
  createUser,
  createMultipleUsers,
  createTestUsers,
  userExists,
  getUserDetails,
  listAllUsers
};

// Run main function if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
