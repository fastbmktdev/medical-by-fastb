#!/usr/bin/env node

/**
 * Consolidated Database Utilities Script
 * 
 * This script provides comprehensive database management utilities including:
 * - Database health checking and table verification
 * - Partner promotion verification and role management
 * - Gym slug updates and maintenance
 * - Storage bucket verification
 * - Environment detection and validation
 * 
 * Usage:
 *   node scripts/node/database-utilities.js [command]
 * 
 * Commands:
 *   check        - Check database health and table existence (default)
 *   partners     - Verify partner role promotions and gym applications
 *   slugs        - Update and verify gym slugs
 *   storage      - Check and verify storage buckets
 *   all          - Run all checks and utilities
 * 
 * Examples:
 *   node scripts/node/database-utilities.js
 *   node scripts/node/database-utilities.js check
 *   node scripts/node/database-utilities.js partners
 *   node scripts/node/database-utilities.js slugs
 *   npm run check-db
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory and environment setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isLocal = !isProduction && (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV);

/**
 * Enhanced environment loader with multiple file support
 */
function loadEnvironment() {
  const envFiles = [
    join(projectRoot, '.env.local'),
    join(projectRoot, '.env'),
    join(projectRoot, '.env.development')
  ];

  let env = { ...process.env };

  for (const envPath of envFiles) {
    if (existsSync(envPath)) {
      try {
        const content = readFileSync(envPath, 'utf-8');
        const lines = content.split('\n');
        
        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
              const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
              env[key.trim()] = value;
            }
          }
        }
        console.log(`📄 Loaded environment from: ${envPath}`);
        break;
      } catch (error) {
        console.warn(`⚠️  Could not load ${envPath}: ${error.message}`);
      }
    }
  }

  return env;
}

/**
 * Initialize Supabase client with error handling
 */
function initializeSupabase() {
  const env = loadEnvironment();
  
  const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required environment variables:');
    console.error('  - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    console.error('  - SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)');
    console.error('\nMake sure you have a .env.local file with these variables.');
    process.exit(1);
  }

  console.log(`🌍 Environment: ${isProduction ? 'Production' : isLocal ? 'Local Development' : 'Development'}`);
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  
  return createClient(supabaseUrl, supabaseKey);
}

/**
 * Database Health Check Functions
 */
class DatabaseHealthChecker {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async checkTable(tableName) {
    try {
      const { data, error, count } = await this.supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ Table "${tableName}" does NOT exist`);
          return { exists: false, error: error.code };
        } else if (error.code === 'PGRST301') {
          console.log(`⚠️  Table "${tableName}" exists but access denied`);
          return { exists: true, hasPermission: false, error: error.code };
        } else {
          console.log(`⚠️  Table "${tableName}" - Error: ${error.message}`);
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

  async checkStorage() {
    try {
      const { data, error } = await this.supabase.storage.listBuckets();
      
      if (error) {
        console.log(`❌ Error checking storage: ${error.message}`);
        return { exists: false, error: error.message };
      }

      const buckets = data || [];
      const gymImagesBucket = buckets.find(bucket => bucket.id === 'gym-images');
      
      console.log(`📦 Found ${buckets.length} storage bucket(s)`);
      
      if (gymImagesBucket) {
        console.log(`✅ Storage bucket "gym-images" exists`);
        return { exists: true, buckets: buckets.map(b => b.id) };
      } else {
        console.log(`❌ Storage bucket "gym-images" does NOT exist`);
        return { exists: false, buckets: buckets.map(b => b.id) };
      }
    } catch (err) {
      console.log(`❌ Error checking storage: ${err.message}`);
      return { exists: false, error: err.message };
    }
  }

  async runHealthCheck() {
    console.log('🔍 Running Database Health Check...\n');

    const requiredTables = [
      'profiles', 'user_roles', 'gyms', 'gym_packages', 
      'bookings', 'payments', 'partner_applications'
    ];
    
    const results = {};

    // Check all required tables
    for (const table of requiredTables) {
      results[table] = await this.checkTable(table);
    }

    console.log('');
    
    // Check storage
    results.storage = await this.checkStorage();

    // Generate summary
    this.generateHealthSummary(results);
    
    return results;
  }

  generateHealthSummary(results) {
    console.log('\n📊 Database Health Summary:');
    console.log('─────────────────────────────────────');

    const missingTables = Object.entries(results)
      .filter(([key, value]) => key !== 'storage' && !value.exists)
      .map(([key]) => key);

    const tablesWithIssues = Object.entries(results)
      .filter(([key, value]) => key !== 'storage' && value.exists && value.error)
      .map(([key, value]) => ({ table: key, error: value.error }));

    if (missingTables.length === 0 && results.storage.exists && tablesWithIssues.length === 0) {
      console.log('✅ All systems operational!');
      console.log('✅ Database is properly configured and accessible.');
    } else {
      console.log('⚠️  Issues detected:');
      
      if (missingTables.length > 0) {
        console.log(`   Missing tables: ${missingTables.join(', ')}`);
      }
      
      if (tablesWithIssues.length > 0) {
        console.log('   Tables with access issues:');
        tablesWithIssues.forEach(({ table, error }) => {
          console.log(`     - ${table}: ${error}`);
        });
      }
      
      if (!results.storage.exists) {
        console.log('   Missing storage: gym-images bucket');
      }
      
      console.log('\n📖 Recommended Actions:');
      console.log('1. Run database migrations: npm run db:migrate');
      console.log('2. Check Supabase dashboard for RLS policies');
      console.log('3. Verify environment variables are correct');
    }

    console.log('─────────────────────────────────────\n');
  }
}

/**
 * Partner Role Management Functions
 */
class PartnerRoleManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async checkPartnerPromotions() {
    console.log('👥 Checking Partner Role Promotions...\n');

    try {
      // Get all user roles
      const { data: rolesData, error: rolesError } = await this.supabase
        .from('user_roles')
        .select('user_id, role, updated_at');

      if (rolesError) {
        console.error(`❌ Error fetching user roles: ${rolesError.message}`);
        return false;
      }

      // Get all profiles
      const { data: profilesData, error: profilesError } = await this.supabase
        .from('profiles')
        .select('user_id, username, full_name');

      if (profilesError) {
        console.error(`❌ Error fetching profiles: ${profilesError.message}`);
        return false;
      }

      // Get all gyms
      const { data: gymsData, error: gymsError } = await this.supabase
        .from('gyms')
        .select('user_id, gym_name, status, created_at');

      if (gymsError) {
        console.error(`❌ Error fetching gyms: ${gymsError.message}`);
        return false;
      }

      // Create lookup maps
      const rolesByUserId = {};
      const profilesByUserId = {};
      const gymsByUserId = {};

      rolesData.forEach(role => {
        rolesByUserId[role.user_id] = role;
      });

      profilesData.forEach(profile => {
        profilesByUserId[profile.user_id] = profile;
      });

      gymsData.forEach(gym => {
        if (!gymsByUserId[gym.user_id]) {
          gymsByUserId[gym.user_id] = [];
        }
        gymsByUserId[gym.user_id].push(gym);
      });

      // Count users by role
      const roleCounts = {};
      rolesData.forEach(role => {
        roleCounts[role.role] = (roleCounts[role.role] || 0) + 1;
      });

      console.log('📊 User Role Distribution:');
      Object.entries(roleCounts).forEach(([role, count]) => {
        console.log(`   ${role}: ${count} users`);
      });

      // Check partners with gym applications
      const partners = rolesData.filter(role => role.role === 'partner');
      const partnersWithGyms = partners.filter(partner => gymsByUserId[partner.user_id]);

      console.log(`\n🏢 Partners with Gym Applications (${partnersWithGyms.length}):`);
      partnersWithGyms.forEach(partner => {
        const profile = profilesByUserId[partner.user_id];
        const gyms = gymsByUserId[partner.user_id];
        const gym = gyms[0]; // Assuming one gym per partner
        
        const roleUpdated = new Date(partner.updated_at);
        const gymCreated = new Date(gym.created_at);
        const timeDiff = Math.abs(roleUpdated - gymCreated) / 1000; // seconds

        console.log(`   ${profile?.username || 'Unknown'} - ${gym.gym_name}`);
        console.log(`     Status: ${gym.status}, Time diff: ${timeDiff.toFixed(1)}s`);
      });

      // Check for users who should be partners but aren't
      const shouldBePartners = [];
      Object.entries(gymsByUserId).forEach(([userId, gyms]) => {
        const role = rolesByUserId[userId];
        if (role && role.role !== 'partner') {
          const profile = profilesByUserId[userId];
          shouldBePartners.push({
            userId,
            username: profile?.username || 'Unknown',
            role: role.role,
            gymCount: gyms.length
          });
        }
      });

      if (shouldBePartners.length > 0) {
        console.log(`\n⚠️  Users with gyms but not partner role (${shouldBePartners.length}):`);
        shouldBePartners.forEach(user => {
          console.log(`   ${user.username} - Role: ${user.role} (${user.gymCount} gym${user.gymCount > 1 ? 's' : ''})`);
        });
      } else {
        console.log('\n✅ All users with gym applications have correct partner role');
      }

      // Check for partners without gyms
      const partnersWithoutGyms = partners.filter(partner => !gymsByUserId[partner.user_id]);
      if (partnersWithoutGyms.length > 0) {
        console.log(`\n⚠️  Partners without gym applications (${partnersWithoutGyms.length}):`);
        partnersWithoutGyms.forEach(partner => {
          const profile = profilesByUserId[partner.user_id];
          console.log(`   ${profile?.username || 'Unknown'} - Partner role but no gym`);
        });
      }

      return true;
    } catch (error) {
      console.error(`❌ Error checking partner promotions: ${error.message}`);
      return false;
    }
  }
}

/**
 * Gym Slug Management Functions
 */
class GymSlugManager {
  constructor(supabase) {
    this.supabase = supabase;
  }

  async updateGymSlugs() {
    console.log('🏷️  Updating Gym Slugs...\n');

    try {
      // First, check current slug status
      const { data: gyms, error: fetchError } = await this.supabase
        .from('gyms')
        .select('id, gym_name, gym_name_english, slug, created_at')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error(`❌ Error fetching gyms: ${fetchError.message}`);
        return false;
      }

      console.log(`📋 Found ${gyms.length} gyms in database`);

      // Identify gyms without slugs
      const gymsWithoutSlugs = gyms.filter(gym => !gym.slug || gym.slug.trim() === '');
      
      if (gymsWithoutSlugs.length === 0) {
        console.log('✅ All gyms already have slugs!');
        this.displaySlugStatus(gyms);
        return true;
      }

      console.log(`🔄 Updating ${gymsWithoutSlugs.length} gyms without slugs...`);

      // Update gyms to trigger slug generation
      for (const gym of gymsWithoutSlugs) {
        const { error: updateError } = await this.supabase
          .from('gyms')
          .update({ updated_at: new Date().toISOString() })
          .eq('id', gym.id);

        if (updateError) {
          console.error(`❌ Error updating gym ${gym.gym_name}: ${updateError.message}`);
        } else {
          console.log(`✅ Updated: ${gym.gym_name}`);
        }
      }

      // Verify updates
      console.log('\n🔍 Verifying slug generation...');
      const { data: updatedGyms, error: verifyError } = await this.supabase
        .from('gyms')
        .select('id, gym_name, gym_name_english, slug')
        .in('id', gymsWithoutSlugs.map(g => g.id));

      if (verifyError) {
        console.error(`❌ Error verifying updates: ${verifyError.message}`);
        return false;
      }

      this.displaySlugStatus(updatedGyms);
      return true;

    } catch (error) {
      console.error(`❌ Error updating gym slugs: ${error.message}`);
      return false;
    }
  }

  displaySlugStatus(gyms) {
    console.log('\n📊 Gym Slug Status:');
    console.log('─────────────────────────────────────');
    
    gyms.forEach(gym => {
      const hasSlug = gym.slug && gym.slug.trim() !== '';
      const status = hasSlug ? '✅' : '❌';
      console.log(`${status} ${gym.gym_name} ${hasSlug ? `(${gym.slug})` : '(no slug)'}`);
    });
    
    const withSlugs = gyms.filter(g => g.slug && g.slug.trim() !== '').length;
    const withoutSlugs = gyms.length - withSlugs;
    
    console.log(`\nSummary: ${withSlugs} with slugs, ${withoutSlugs} without slugs`);
    console.log('─────────────────────────────────────\n');
  }
}

/**
 * Main Application Class
 */
class DatabaseUtilities {
  constructor() {
    this.supabase = initializeSupabase();
    this.healthChecker = new DatabaseHealthChecker(this.supabase);
    this.partnerManager = new PartnerRoleManager(this.supabase);
    this.slugManager = new GymSlugManager(this.supabase);
  }

  async runCommand(command = 'check') {
    console.log(`🚀 Running Database Utilities - Command: ${command}\n`);

    try {
      switch (command.toLowerCase()) {
        case 'check':
        case 'health':
          return await this.healthChecker.runHealthCheck();

        case 'partners':
        case 'partner':
          return await this.partnerManager.checkPartnerPromotions();

        case 'slugs':
        case 'slug':
          return await this.slugManager.updateGymSlugs();

        case 'storage':
          return await this.healthChecker.checkStorage();

        case 'all':
          console.log('🔄 Running all utilities...\n');
          await this.healthChecker.runHealthCheck();
          console.log('\n' + '='.repeat(50) + '\n');
          await this.partnerManager.checkPartnerPromotions();
          console.log('\n' + '='.repeat(50) + '\n');
          await this.slugManager.updateGymSlugs();
          return true;

        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          return false;
      }
    } catch (error) {
      console.error(`❌ Fatal error running command '${command}': ${error.message}`);
      if (error.stack && !isProduction) {
        console.error(error.stack);
      }
      return false;
    }
  }

  showHelp() {
    console.log(`
📖 Database Utilities Help

Usage: node scripts/node/database-utilities.js [command]

Available Commands:
  check, health    - Check database health and table existence (default)
  partners         - Verify partner role promotions and gym applications  
  slugs            - Update and verify gym slugs
  storage          - Check storage buckets
  all              - Run all utilities

Examples:
  node scripts/node/database-utilities.js
  node scripts/node/database-utilities.js check
  node scripts/node/database-utilities.js partners
  node scripts/node/database-utilities.js slugs
  npm run check-db

Environment:
  The script automatically detects your environment and loads configuration
  from .env.local, .env, or .env.development files.
    `);
  }
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2] || 'check';
  
  if (command === 'help' || command === '--help' || command === '-h') {
    new DatabaseUtilities().showHelp();
    return;
  }

  const utilities = new DatabaseUtilities();
  const success = await utilities.runCommand(command);
  
  process.exit(success ? 0 : 1);
}

// Handle uncaught errors gracefully
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  if (!isProduction) {
    console.error(error.stack);
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export default DatabaseUtilities;