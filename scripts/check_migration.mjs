/**
 * Migration script: apply Phase 5 workspace provisioning
 * Uses Supabase Admin RPC endpoint
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Use the anon key - admin operations via SECURITY DEFINER functions
const SUPABASE_URL = 'https://nvenvuikepbjtgakasog.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im52ZW52dWlrZXBianRnYWthc29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzM2NzAsImV4cCI6MjA5ODU0OTY3MH0.cQDjgDxPihczXMY1dHS9Uvl06ggJhbRlOdP0mmilekg';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function run() {
  console.log('🚀 Applying Phase 5 workspace provisioning migration...\n');

  // Sign in as platform admin first
  console.log('1. Signing in as platform admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'abuh68653@gmail.com',
    password: 'Ahmedbacha1@#7'
  });

  if (authError) {
    console.error('❌ Auth failed:', authError.message);
    process.exit(1);
  }
  console.log('✓ Signed in as:', authData.user?.email);

  // Test: check workspaces query
  console.log('\n2. Testing workspace query...');
  const { data: workspaces, error: wsError } = await supabase
    .from('workspaces')
    .select('id, name, status')
    .limit(5);

  if (wsError) {
    console.error('❌ Workspace query failed:', wsError.message, wsError.code);
  } else {
    console.log(`✓ Found ${workspaces?.length || 0} workspaces`);
    workspaces?.forEach(w => console.log('  -', w.name, '|', w.status));
  }

  // Test: check if new columns exist
  console.log('\n3. Checking workspace columns...');
  const { data: wsData, error: colError } = await supabase
    .from('workspaces')
    .select('id, business_email, business_phone, business_address, business_category, internal_notes')
    .limit(1);

  if (colError) {
    console.log('⚠ New columns not yet applied:', colError.message);
    console.log('  → Columns need to be added via Supabase Dashboard');
  } else {
    console.log('✓ New workspace columns exist');
  }

  // Test: check if name column exists in users
  console.log('\n4. Checking users.name column...');
  const { data: usersData, error: usersError } = await supabase
    .from('users')
    .select('id, name, email, role')
    .limit(3);

  if (usersError) {
    console.log('⚠ Users name column issue:', usersError.message);
  } else {
    console.log(`✓ Users table accessible, found ${usersData?.length || 0} users`);
    usersData?.forEach(u => console.log('  -', u.name || u.email, '|', u.role));
  }

  // Test RPC functions
  console.log('\n5. Checking RPC functions...');
  
  // Test admin_update_workspace_status
  const { error: rpcError } = await supabase.rpc('admin_update_workspace_status', {
    p_workspace_id: '00000000-0000-0000-0000-000000000000',
    p_status: 'Active'
  });
  
  if (rpcError) {
    if (rpcError.message.includes('does not exist')) {
      console.log('⚠ admin_update_workspace_status RPC not found - needs to be created');
    } else if (rpcError.message.includes('Unauthorized') || rpcError.code === 'P0001') {
      console.log('✓ admin_update_workspace_status exists (got auth/no-op error as expected)');
    } else {
      console.log('RPC status:', rpcError.message.substring(0, 100));
    }
  } else {
    console.log('✓ admin_update_workspace_status RPC works');
  }

  const { error: rpc2Error } = await supabase.rpc('provision_workspace', {
    p_business_name: 'TEST',
    p_business_email: 'test@test.com',
    p_business_phone: null,
    p_business_address: null,
    p_business_category: null,
    p_internal_notes: null,
    p_owner_name: 'Test',
    p_owner_email: 'nonexistent_test_99999@test.com',
    p_owner_password: 'test123456',
    p_access_period: '1 Month',
    p_is_lifetime: false,
    p_activation_date: new Date().toISOString(),
    p_expiry_date: new Date(Date.now() + 30 * 86400000).toISOString(),
  });

  if (rpc2Error) {
    if (rpc2Error.message.includes('does not exist') || rpc2Error.message.includes('function provision_workspace')) {
      console.log('⚠ provision_workspace RPC not found - needs to be created via Dashboard');
    } else {
      console.log('✓ provision_workspace RPC exists, response:', rpc2Error.message.substring(0, 100));
    }
  } else {
    console.log('✓ provision_workspace executed (test workspace created - please clean up)');
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('📋 MIGRATION STATUS SUMMARY');
  console.log('═══════════════════════════════════════════════════════════');
  console.log('Please apply the migration SQL via the Supabase Dashboard:');
  console.log('https://supabase.com/dashboard/project/nvenvuikepbjtgakasog/sql/new');
  console.log('\nMigration file:');
  console.log('d:\\Khata Book\\supabase\\migrations\\20260704200000_phase_5_workspace_provisioning.sql');
  console.log('═══════════════════════════════════════════════════════════');
}

run().catch(console.error);
