#!/usr/bin/env node

/**
 * Production User Creation Script
 * 
 * This script is designed for creating users in production environment
 * with enhanced security, validation, and logging.
 * 
 * Usage:
 *   node scripts/production-user-creation.js --email user@example.com --password securepass123 --role admin
 *   node scripts/production-user-creation.js --bulk users.json
 *   node scripts/production-user-creation.js --list
 *   node scripts/production-user-creation.js --check user@example.com
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.production') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Production Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.production file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Production environment validation
const isProduction = process.env.NODE_ENV === 'production' || process.env.ENVIRONMENT === 'production';

// Enhanced password validation for production
function validatePassword(password) {
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Enhanced email validation
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Username validation
function validateUsername(username) {
  if (!username) return { isValid: true, errors: [] };
  
  const errors = [];
  
  if (username.length < 3 || username.length > 30) {
    errors.push('Username must be between 3 and 30 characters');
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, underscores, and hyphens');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

// Phone validation
function validatePhone(phone) {
  if (!phone) return { isValid: true, errors: [] };
  
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return {
    isValid: phoneRegex.test(phone),
    errors: phoneRegex.test(phone) ? [] : ['Phone number must be in international format (e.g., +66812345678)']
  };
}

// Generate secure password for production
function generateSecurePassword() {
  const length = 12;
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // Ensure at least one character from each required type
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

// Logging function for production
function logAction(action, details) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    action,
    details,
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.log(`[${timestamp}] ${action}:`, details);
  
  // In production, you might want to send this to a logging service
  if (isProduction) {
    // TODO: Send to logging service (e.g., Winston, LogRocket, etc.)
  }
}

// Create a single user with enhanced validation
async function createUser(userData) {
  const {
    email,
    password,
    full_name = null,
    username = null,
    phone = null,
    role = 'authenticated',
    avatar_url = null,
    auto_generate_password = false
  } = userData;

  try {
    logAction('USER_CREATION_START', { email, role });

    // Validate email
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    // Validate or generate password
    let finalPassword = password;
    if (auto_generate_password || !password) {
      finalPassword = generateSecurePassword();
      logAction('PASSWORD_GENERATED', { email });
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
      }
    }

    // Validate username
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.isValid) {
      throw new Error(`Username validation failed: ${usernameValidation.errors.join(', ')}`);
    }

    // Validate phone
    const phoneValidation = validatePhone(phone);
    if (!phoneValidation.isValid) {
      throw new Error(`Phone validation failed: ${phoneValidation.errors.join(', ')}`);
    }

    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(email);
    if (existingUser.user) {
      throw new Error('User with this email already exists');
    }

    // Check if username is taken (if provided)
    if (username) {
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('username', username)
        .single();

      if (existingProfile) {
        throw new Error('Username is already taken');
      }
    }

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: finalPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || '',
        username: username || '',
        phone: phone || '',
        avatar_url: avatar_url || ''
      }
    });

    if (authError) {
      throw new Error(`Auth error: ${authError.message}`);
    }

    const userId = authData.user.id;

    // Create profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: userId,
        username,
        full_name,
        phone,
        avatar_url
      });

    if (profileError) {
      logAction('PROFILE_CREATION_WARNING', { email, error: profileError.message });
    }

    // Create user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role
      });

    if (roleError) {
      logAction('ROLE_CREATION_WARNING', { email, error: roleError.message });
    }

    // Initialize user points for gamification
    const { error: pointsError } = await supabase
      .from('user_points')
      .insert({
        user_id: userId,
        total_points: 0,
        level: 1
      });

    if (pointsError) {
      logAction('POINTS_INITIALIZATION_WARNING', { email, error: pointsError.message });
    }

    logAction('USER_CREATION_SUCCESS', { 
      email, 
      userId, 
      role,
      passwordGenerated: auto_generate_password || !password
    });

    return {
      success: true,
      user: {
        id: userId,
        email,
        full_name,
        username,
        phone,
        role
      },
      password: auto_generate_password || !password ? finalPassword : undefined
    };

  } catch (error) {
    logAction('USER_CREATION_ERROR', { email, error: error.message });
    throw error;
  }
}

// Create multiple users from JSON file
async function createBulkUsers(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const users = JSON.parse(fileContent);
    
    if (!Array.isArray(users)) {
      throw new Error('JSON file must contain an array of user objects');
    }

    const results = [];
    const errors = [];

    for (const userData of users) {
      try {
        const result = await createUser(userData);
        results.push(result);
      } catch (error) {
        errors.push({
          user: userData.email,
          error: error.message
        });
      }
    }

    logAction('BULK_USER_CREATION_COMPLETE', { 
      total: users.length, 
      successful: results.length, 
      failed: errors.length 
    });

    return { results, errors };
  } catch (error) {
    logAction('BULK_USER_CREATION_ERROR', { error: error.message });
    throw error;
  }
}

// List all users
async function listUsers() {
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      throw new Error(`Failed to list users: ${error.message}`);
    }

    const userList = users.users.map(user => ({
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      email_confirmed_at: user.email_confirmed_at
    }));

    logAction('USER_LIST_RETRIEVED', { count: userList.length });
    return userList;
  } catch (error) {
    logAction('USER_LIST_ERROR', { error: error.message });
    throw error;
  }
}

// Check if user exists
async function checkUser(email) {
  try {
    const { data: user } = await supabase.auth.admin.getUserByEmail(email);
    
    if (user.user) {
      logAction('USER_CHECK_FOUND', { email });
      return {
        exists: true,
        user: {
          id: user.user.id,
          email: user.user.email,
          created_at: user.user.created_at,
          last_sign_in_at: user.user.last_sign_in_at
        }
      };
    } else {
      logAction('USER_CHECK_NOT_FOUND', { email });
      return { exists: false };
    }
  } catch (error) {
    logAction('USER_CHECK_ERROR', { email, error: error.message });
    throw error;
  }
}

// Main CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help')) {
    console.log(`
🚀 Production User Creation Script

Usage:
  node scripts/production-user-creation.js [options]

Options:
  --email <email>                    User email (required for single user)
  --password <password>              User password (optional, will generate if not provided)
  --full-name <name>                 User full name
  --username <username>              Username (must be unique)
  --phone <phone>                    Phone number (international format)
  --role <role>                      User role (authenticated, partner, admin)
  --avatar-url <url>                 Avatar URL
  --auto-generate-password           Generate secure password automatically
  --bulk <file.json>                 Create multiple users from JSON file
  --list                             List all users
  --check <email>                    Check if user exists
  --help                             Show this help message

Examples:
  # Create single user with auto-generated password
  node scripts/production-user-creation.js --email admin@example.com --role admin --auto-generate-password

  # Create user with custom password
  node scripts/production-user-creation.js --email user@example.com --password SecurePass123! --full-name "John Doe" --username johndoe

  # Create multiple users from file
  node scripts/production-user-creation.js --bulk users.json

  # List all users
  node scripts/production-user-creation.js --list

  # Check if user exists
  node scripts/production-user-creation.js --check user@example.com

Environment Variables Required:
  NEXT_PUBLIC_SUPABASE_URL          Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY         Supabase service role key
    `);
    return;
  }

  try {
    if (args.includes('--list')) {
      const users = await listUsers();
      console.log('\n📋 Users in database:');
      console.table(users);
      return;
    }

    if (args.includes('--check')) {
      const emailIndex = args.indexOf('--check') + 1;
      const email = args[emailIndex];
      
      if (!email) {
        console.error('❌ Email required for --check option');
        return;
      }

      const result = await checkUser(email);
      if (result.exists) {
        console.log(`✅ User found: ${email}`);
        console.log('User details:', result.user);
      } else {
        console.log(`❌ User not found: ${email}`);
      }
      return;
    }

    if (args.includes('--bulk')) {
      const fileIndex = args.indexOf('--bulk') + 1;
      const filePath = args[fileIndex];
      
      if (!filePath) {
        console.error('❌ File path required for --bulk option');
        return;
      }

      const { results, errors } = await createBulkUsers(filePath);
      
      console.log(`\n✅ Bulk user creation completed:`);
      console.log(`   Successful: ${results.length}`);
      console.log(`   Failed: ${errors.length}`);
      
      if (errors.length > 0) {
        console.log('\n❌ Errors:');
        errors.forEach(error => {
          console.log(`   ${error.user}: ${error.error}`);
        });
      }
      
      if (results.length > 0) {
        console.log('\n✅ Created users:');
        results.forEach(result => {
          console.log(`   ${result.user.email} (${result.user.role})`);
          if (result.password) {
            console.log(`   Password: ${result.password}`);
          }
        });
      }
      return;
    }

    // Single user creation
    const emailIndex = args.indexOf('--email');
    if (emailIndex === -1) {
      console.error('❌ Email is required. Use --email <email>');
      return;
    }

    const email = args[emailIndex + 1];
    if (!email) {
      console.error('❌ Email value is required');
      return;
    }

    const userData = { email };

    // Parse other arguments
    const passwordIndex = args.indexOf('--password');
    if (passwordIndex !== -1) {
      userData.password = args[passwordIndex + 1];
    }

    const fullNameIndex = args.indexOf('--full-name');
    if (fullNameIndex !== -1) {
      userData.full_name = args[fullNameIndex + 1];
    }

    const usernameIndex = args.indexOf('--username');
    if (usernameIndex !== -1) {
      userData.username = args[usernameIndex + 1];
    }

    const phoneIndex = args.indexOf('--phone');
    if (phoneIndex !== -1) {
      userData.phone = args[phoneIndex + 1];
    }

    const roleIndex = args.indexOf('--role');
    if (roleIndex !== -1) {
      userData.role = args[roleIndex + 1];
    }

    const avatarUrlIndex = args.indexOf('--avatar-url');
    if (avatarUrlIndex !== -1) {
      userData.avatar_url = args[avatarUrlIndex + 1];
    }

    if (args.includes('--auto-generate-password')) {
      userData.auto_generate_password = true;
    }

    const result = await createUser(userData);
    
    console.log(`\n✅ User created successfully:`);
    console.log(`   Email: ${result.user.email}`);
    console.log(`   Name: ${result.user.full_name || 'Not set'}`);
    console.log(`   Username: ${result.user.username || 'Not set'}`);
    console.log(`   Role: ${result.user.role}`);
    
    if (result.password) {
      console.log(`   Password: ${result.password}`);
      console.log(`\n⚠️  IMPORTANT: Save this password securely!`);
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
}

// Run the script
main().catch(console.error);
