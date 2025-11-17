/**
 * Quick Test Script for ID Card Upload API
 * 
 * Usage:
 *   node scripts/test-id-card-upload.js <path-to-test-image.jpg>
 * 
 * Prerequisites:
 *   - Must have a valid session token (login first)
 *   - Test image file must exist
 */

const fs = require('fs');
const path = require('path');

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const TEST_IMAGE_PATH = process.argv[2];

if (!TEST_IMAGE_PATH) {
  console.error('❌ Error: Please provide path to test image');
  console.log('Usage: node scripts/test-id-card-upload.js <path-to-image.jpg>');
  process.exit(1);
}

if (!fs.existsSync(TEST_IMAGE_PATH)) {
  console.error(`❌ Error: File not found: ${TEST_IMAGE_PATH}`);
  process.exit(1);
}

async function testIdCardUpload() {
  console.log('🧪 Testing ID Card Upload API...\n');

  // Check file size
  const stats = fs.statSync(TEST_IMAGE_PATH);
  const fileSizeMB = stats.size / (1024 * 1024);
  console.log(`📁 Test file: ${TEST_IMAGE_PATH}`);
  console.log(`📊 File size: ${fileSizeMB.toFixed(2)} MB\n`);

  if (fileSizeMB > 10) {
    console.error('❌ Error: File size exceeds 10MB limit');
    process.exit(1);
  }

  // Note: This script tests the API structure
  // For actual upload, you need to:
  // 1. Create a watermarked version first (client-side)
  // 2. Send both files to the API
  
  console.log('⚠️  Note: This script only validates the API structure.');
  console.log('   For full test, use the web UI at /partner/apply\n');
  
  console.log('✅ API Endpoint: POST /api/partner/id-card');
  console.log('✅ Expected Request:');
  console.log('   - FormData with "file" (original)');
  console.log('   - FormData with "watermarkedFile" (watermarked)');
  console.log('\n✅ Expected Response:');
  console.log('   {');
  console.log('     "success": true,');
  console.log('     "data": {');
  console.log('       "originalUrl": "...",');
  console.log('       "watermarkedUrl": "...",');
  console.log('       "originalPath": "...",');
  console.log('       "watermarkedPath": "..."');
  console.log('     }');
  console.log('   }\n');

  console.log('📝 To test manually:');
  console.log('   1. Go to http://localhost:3000/th/partner/apply');
  console.log('   2. Login with a test account');
  console.log('   3. Fill in the form');
  console.log('   4. Upload an ID card image');
  console.log('   5. Check browser console and network tab\n');

  console.log('✅ Test script completed!');
}

testIdCardUpload().catch(console.error);

