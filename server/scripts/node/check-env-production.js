#!/usr/bin/env node

/**
 * Production Environment Variables Checker
 * 
 * This script checks if all required Supabase environment variables
 * are properly configured for production deployment.
 * 
 * Usage:
 *   node scripts/node/check-env-production.js
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

/**
 * Load environment variables from .env files
 */
function loadEnvironment() {
  const envFiles = [
    join(projectRoot, '.env.local'),
    join(projectRoot, '.env'),
    join(projectRoot, '.env.production'),
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
              // Only override if not already set (process.env takes precedence)
              if (!env[key.trim()]) {
                env[key.trim()] = value;
              }
            }
          }
        }
        console.log(`📄 Loaded environment from: ${envPath}`);
      } catch (error) {
        // Silently ignore file read errors
      }
    }
  }

  return env;
}

const requiredEnvVars = {
  // Client-side (must be available at build time)
  NEXT_PUBLIC_SUPABASE_URL: {
    description: 'Supabase project URL (for client-side)',
    required: true,
    public: true,
  },
  NEXT_PUBLIC_SUPABASE_ANON_KEY: {
    description: 'Supabase anonymous key (for client-side)',
    required: true,
    public: true,
  },
  // Server-side (can be runtime)
  SUPABASE_URL: {
    description: 'Supabase project URL (for server-side)',
    required: false, // Can use NEXT_PUBLIC_ version
    public: false,
  },
  SUPABASE_ANON_KEY: {
    description: 'Supabase anonymous key (for server-side)',
    required: false, // Can use NEXT_PUBLIC_ version
    public: false,
  },
  SUPABASE_SERVICE_ROLE_KEY: {
    description: 'Supabase service role key (for admin operations)',
    required: false,
    public: false,
  },
};

function checkEnvironmentVariables() {
  // Load environment from .env files
  const env = loadEnvironment();
  
  // Detect if this is local or production environment
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const isLocal = supabaseUrl && (supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost'));
  const environment = isLocal ? 'Local Development' : 'Production';
  
  console.log(`🔍 Checking Environment Variables (${environment})\n`);
  console.log('=' .repeat(60));
  console.log('');

  let hasErrors = false;
  let hasWarnings = false;

  // Check required variables
  for (const [varName, config] of Object.entries(requiredEnvVars)) {
    const value = env[varName] || process.env[varName];
    const isSet = !!value;

    if (config.required && !isSet) {
      console.error(`❌ MISSING (Required): ${varName}`);
      console.error(`   ${config.description}`);
      console.error(`   ${config.public ? 'PUBLIC (exposed to browser)' : 'PRIVATE (server-side only)'}`);
      hasErrors = true;
    } else if (!config.required && !isSet) {
      console.warn(`⚠️  OPTIONAL (Not Set): ${varName}`);
      console.warn(`   ${config.description}`);
      hasWarnings = true;
    } else {
      // Validate format
      if (varName.includes('URL')) {
        try {
          const url = new URL(value);
          if (!url.protocol.startsWith('http')) {
            console.error(`❌ INVALID: ${varName}`);
            console.error(`   URL must use http or https protocol`);
            hasErrors = true;
          } else {
            const isLocalUrl = value.includes('127.0.0.1') || value.includes('localhost');
            console.log(`✅ SET: ${varName}`);
            console.log(`   Value: ${value.substring(0, 50)}...`);
            if (isLocalUrl && !isLocal) {
              console.warn(`   ⚠️  This appears to be a local URL - make sure to use production URL in production!`);
            }
          }
        } catch (e) {
          console.error(`❌ INVALID: ${varName}`);
          console.error(`   Not a valid URL: ${value}`);
          hasErrors = true;
        }
      } else if (varName.includes('KEY')) {
        // For local environment, accept shorter keys (local Supabase uses shorter keys)
        // For production, require longer keys (production keys are typically JWT tokens ~200+ chars)
        const isShortKey = value.length < 50;
        const isValidFormat = value.startsWith('eyJ') || value.startsWith('sb_') || value.startsWith('ey');
        
        if (!isValidFormat && !isLocal) {
          // Only warn about format if it's production
          console.warn(`⚠️  SUSPICIOUS: ${varName}`);
          console.warn(`   Key format may be invalid (should start with 'eyJ' or 'sb_')`);
          hasWarnings = true;
        } else if (isShortKey && !isLocal) {
          // For production, warn about short keys
          console.warn(`⚠️  WARNING: ${varName}`);
          console.warn(`   Key seems short (${value.length} chars) - production keys are usually 200+ chars`);
          console.warn(`   Make sure this is a production key, not a local development key!`);
          hasWarnings = true;
        } else if (isShortKey && isLocal) {
          // Local keys are expected to be short - this is OK
          console.log(`✅ SET: ${varName}`);
          console.log(`   Value: ${value.substring(0, 30)}...`);
          console.log(`   ℹ️  Local development key (shorter keys are normal for local Supabase)`);
        } else {
          // Production key looks good
          console.log(`✅ SET: ${varName}`);
          console.log(`   Value: ${value.substring(0, 30)}...`);
          if (isLocal) {
            console.log(`   ℹ️  This appears to be a production key - ensure local Supabase keys are used for local dev`);
          }
        }
      } else {
        console.log(`✅ SET: ${varName}`);
        console.log(`   Value: ${value.substring(0, 50)}...`);
      }
    }
    console.log('');
  }

  console.log('=' .repeat(60));
  console.log('');

  // Summary
  if (hasErrors) {
    console.error('❌ ERRORS FOUND: Some required environment variables are missing!');
    console.error('');
    if (isLocal) {
      console.error('For local development:');
      console.error('1. Ensure these variables are set in your .env.local file');
      console.error('2. Run: npm run supabase:fix-keys (if using local Supabase)');
      console.error('3. Restart your dev server: npm run dev');
    } else {
      console.error('For Next.js production deployment:');
      console.error('1. Set environment variables in your deployment platform (Vercel, etc.)');
      console.error('2. Ensure NEXT_PUBLIC_* variables are available at BUILD TIME');
      console.error('3. Redeploy your application after setting variables');
      console.error('');
      console.error('Example for Vercel:');
      console.error('  vercel env add NEXT_PUBLIC_SUPABASE_URL');
      console.error('  vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
    console.error('');
    process.exit(1);
  } else if (hasWarnings) {
    console.warn('⚠️  WARNINGS FOUND');
    console.warn('');
    if (isLocal) {
      console.warn('Local development environment detected:');
      console.warn('- Short keys are normal for local Supabase');
      console.warn('- Make sure you have the correct local Supabase credentials');
      console.warn('');
      console.warn('⚠️  IMPORTANT FOR PRODUCTION:');
      console.warn('   These local keys CANNOT be used in production!');
      console.warn('   You must set production Supabase credentials in your deployment platform.');
    } else {
      console.warn('Some optional variables are not set or may need attention');
      console.warn('This may limit functionality but should not prevent basic operations');
      console.warn('');
      console.warn('⚠️  Make sure you are using PRODUCTION Supabase credentials, not local ones!');
    }
    process.exit(0);
  } else {
    console.log('✅ All required environment variables are properly configured!');
    console.log('');
    if (isLocal) {
      console.log('📝 Local Development Ready!');
      console.log('   ⚠️  Remember: Use production credentials when deploying to production');
    } else {
      console.log('📝 Next Steps:');
      console.log('1. Make sure these variables are set in your deployment platform');
      console.log('2. Rebuild your application if variables were added');
      console.log('3. Verify the variables are accessible in your production environment');
    }
    process.exit(0);
  }
}

// Run check
checkEnvironmentVariables();

