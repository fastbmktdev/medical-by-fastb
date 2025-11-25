#!/usr/bin/env node

/**
 * Bootstrap hospital-images Bucket
 *
 * This utility ensures the Supabase Storage bucket `hospital-images`
 * exists with the expected public settings that our Playwright
 * auth flow depends on.
 *
 * Usage:
 *   node scripts/node/bootstrap-hospital-images-bucket.js
 *
 * Environment variables (from .env.local / .env):
 *   - SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const ENV_CANDIDATES = [
  '.env.local',
  '.env',
  'apps/web/.env.local',
  'apps/web/.env',
];

function loadEnv() {
  for (const candidate of ENV_CANDIDATES) {
    const envPath = path.resolve(PROJECT_ROOT, candidate);
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      return envPath;
    }
  }
  return null;
}

async function main() {
  console.log('\n📦 Bootstrapping Supabase bucket `hospital-images`');
  console.log('='.repeat(70));

  const envPath = loadEnv();
  if (envPath) {
    console.log(`📄 Loaded environment variables from ${path.relative(PROJECT_ROOT, envPath)}`);
  } else {
    console.warn('⚠️  No .env file found automatically (looked for .env.local, .env)');
  }

  const supabaseUrl = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();

  const serviceRoleKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

  if (!supabaseUrl) {
    console.error('❌ Missing SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL)');
    process.exit(1);
  }

  if (!serviceRoleKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY (service role key required)');
    process.exit(1);
  }

  console.log(`🔗 Supabase URL: ${supabaseUrl}`);

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const bucketId = 'hospital-images';

  try {
    console.log('\n🔍 Checking existing buckets …');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      throw listError;
    }

    const existingBucket = buckets?.find((bucket) => bucket.id === bucketId);

    if (existingBucket) {
      console.log('✅ Bucket already exists');
    } else {
      console.log('➕ Creating bucket …');
      const { error: createError } = await supabase.storage.createBucket(bucketId, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024, // 5 MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      });

      if (createError) {
        throw createError;
      }

      console.log('✅ Bucket created successfully');
    }

    console.log('\n⚙️  Ensuring bucket settings …');
    const { error: updateError } = await supabase.storage.updateBucket(bucketId, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    });

    if (updateError) {
      throw updateError;
    }

    console.log('✅ Bucket settings updated (public, 5MB limit, JPEG/PNG/WebP)');

    console.log('\nℹ️  Note: RLS policies must be applied separately.');
    console.log('   Run the SQL snippet from docs/guild/SUPABASE_STORAGE_SETUP.md');
    console.log('   via Supabase SQL Editor or CLI to configure access policies.');

    console.log('\n🧪 Next steps:');
    console.log('   1. Apply the RLS policies if not already in place.');
    console.log('   2. Re-run `npm run test:e2e:auth` to confirm the Playwright flow succeeds.');
    console.log('   3. Verify partner application image uploads work in staging.');

    console.log('\n🎉 Done!\n');
  } catch (error) {
    console.error('\n❌ Failed to bootstrap bucket:');
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

main();

