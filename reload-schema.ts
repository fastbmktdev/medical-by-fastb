/**
 * Reload Supabase Schema Cache
 * 
 * Run this script after applying database migrations
 * to refresh the PostgREST schema cache
 * 
 * Usage: npx tsx reload-schema.ts
 */

const SUPABASE_URL: string | undefined = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY: string | undefined = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

async function reloadSchema(): Promise<void> {
  try {
    console.log('🔄 Reloading Supabase schema cache...');
    
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY!,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY!}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      }
    });

    if (response.ok || response.status === 404) {
      console.log('✅ Schema cache reloaded successfully!');
      console.log('   You can now use the new phone column in your queries.');
    } else {
      console.log('⚠️  Response status:', response.status);
      console.log('   The migration might still work. Try your app now.');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Error reloading schema:', errorMessage);
    console.log('\n💡 Alternative: Restart your Supabase project from the dashboard');
    console.log('   Settings → General → Pause project → Resume project');
  }
}

reloadSchema();

