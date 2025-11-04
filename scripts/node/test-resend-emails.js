#!/usr/bin/env node

/**
 * Test Resend Email Service
 * 
 * Tests all email types sent via Resend
 * 
 * This script tests emails by calling the API routes or directly testing Resend functions.
 * 
 * Usage:
 *   npm run test:resend <email>
 *   node scripts/node/test-resend-emails.js <email>
 * 
 * Example:
 *   npm run test:resend test@example.com
 *   node scripts/node/test-resend-emails.js test@example.com
 * 
 * Note: Make sure your dev server is running if testing via API routes
 */

import { Resend } from 'resend';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '../..');

// Load environment variables
function loadEnvironment() {
  const envFiles = [
    join(projectRoot, '.env.local'),
    join(projectRoot, '.env'),
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
        break;
      } catch (error) {
        // Silently ignore file read errors
      }
    }
  }

  return env;
}

// Load environment
const env = loadEnvironment();
Object.assign(process.env, env);

const testEmail = process.argv[2];
const registeredEmail = process.argv[3] || 'thaikickmuaythai@gmail.com'; // Default registered email

if (!testEmail) {
  console.error('❌ Please provide an email address');
  console.log('Usage: npm run test:resend <email> [registered-email]');
  console.log('   or: node scripts/node/test-resend-emails.js <email> [registered-email]');
  console.log('\nNote: With free Resend account, you can only send to the registered email.');
  console.log('      Use the registered email (thaikickmuaythai@gmail.com) for testing.');
  process.exit(1);
}

// Check if using registered email
if (testEmail !== registeredEmail) {
  console.warn('⚠️  Warning: Resend free tier only allows sending to registered email.');
  console.warn(`   Using registered email instead: ${registeredEmail}`);
  console.warn('   For production, verify a domain at https://resend.com/domains\n');
}

// Check if RESEND_API_KEY is configured
if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is not configured in environment variables');
  console.log('Please set RESEND_API_KEY in your .env.local file');
  process.exit(1);
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';

async function testResendEmails() {
  // Use registered email if different email provided (free tier limitation)
  const emailToUse = testEmail !== registeredEmail ? registeredEmail : testEmail;
  
  console.log('🧪 Testing Resend Email Service\n');
  console.log(`📧 Test Email: ${emailToUse}${emailToUse !== testEmail ? ` (changed from ${testEmail})` : ''}`);
  console.log(`📨 From Email: ${fromEmail}\n`);

  const results = {
    success: [],
    failed: [],
  };

  // Test 1: Simple Test Email
  console.log('1️⃣  Testing Simple Email...');
  try {
    const result = await resend.emails.send({
      from: fromEmail,
      to: emailToUse,
      subject: '🧪 Test Email - MUAYTHAI Platform',
      html: `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h1>Test Email from Resend</h1>
            <p>This is a simple test email to verify Resend is working correctly.</p>
            <p>If you receive this email, your Resend configuration is working! ✅</p>
            <p><strong>Test Time:</strong> ${new Date().toLocaleString('th-TH')}</p>
          </body>
        </html>
      `,
    });
    
    if (result.error) {
      const errorMsg = result.error?.message || JSON.stringify(result.error);
      console.log('   ❌ Failed:', errorMsg);
      if (errorMsg.includes('not verified') || errorMsg.includes('domain')) {
        console.log('   💡 Tip: Verify a domain at https://resend.com/domains to use custom domains');
      }
      if (errorMsg.includes('only send testing emails') || errorMsg.includes('your own email')) {
        console.log(`   💡 Tip: Resend free tier only allows sending to registered email: ${registeredEmail}`);
        console.log('   💡 Tip: Use this email for testing, or verify a domain for production use');
      }
      results.failed.push({ type: 'Simple Test Email', error: errorMsg });
    } else {
      console.log('   ✅ Success - Email ID:', result.data?.id);
      results.success.push('Simple Test Email');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.failed.push({ type: 'Simple Test Email', error: error.message });
  }
  console.log('');

  // Note: For full testing of all email templates, you need to run the Next.js app
  // and test via API routes or use tsx to import TypeScript files
  
  console.log('💡 Note: This script tests basic Resend connectivity.');
  console.log('   To test all email templates (verification, booking, etc.),');
  console.log('   please test them through the actual application flow:\n');
  console.log('   - Verification: Sign up a new user');
  console.log('   - Password Reset: Use forgot password feature');
  console.log('   - Booking: Create a booking');
  console.log('   - Payment: Complete a payment\n');

  // Summary
  console.log('='.repeat(60));
  console.log('📊 Test Summary');
  console.log('='.repeat(60));
  console.log(`✅ Successful: ${results.success.length}`);
  console.log(`❌ Failed: ${results.failed.length}\n`);

  if (results.success.length > 0) {
    console.log('✅ Successful tests:');
    results.success.forEach((type) => {
      console.log(`   - ${type}`);
    });
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('❌ Failed tests:');
    results.failed.forEach(({ type, error }) => {
      console.log(`   - ${type}: ${error}`);
    });
    console.log('');
  }

  if (results.failed.length === 0) {
    console.log('🎉 Resend is configured correctly!');
    console.log(`   Check your email inbox (${emailToUse}) to confirm receipt.`);
    console.log('\n📝 Next Steps:');
    console.log('   1. For production, verify a domain at https://resend.com/domains');
    console.log('   2. Update CONTACT_EMAIL_FROM to use your verified domain');
    console.log('   3. Then you can send emails to any recipient');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed.');
    console.log('\n📝 Troubleshooting:');
    console.log('   1. Check RESEND_API_KEY is correct in .env.local');
    console.log(`   2. Try using registered email: ${registeredEmail}`);
    console.log('   3. For production, verify a domain at https://resend.com/domains');
    process.exit(1);
  }
}

// Run tests
testResendEmails().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
