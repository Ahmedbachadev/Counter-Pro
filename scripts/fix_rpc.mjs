import https from 'https';
import fs from 'fs';

const PROJECT_REF = 'nvenvuikepbjtgakasog';
const PAT = process.env.SUPABASE_ACCESS_TOKEN;

if (!PAT) {
  console.error('❌ Error: SUPABASE_ACCESS_TOKEN environment variable is not defined.');
  process.exit(1);
}

function mgmtApiRequest(path, method, body, token) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const options = {
      hostname: 'api.supabase.com',
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data: data }));
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

const fixRPC = `
  CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

  CREATE OR REPLACE FUNCTION public.provision_workspace(
    p_business_name TEXT, p_business_email TEXT, p_business_phone TEXT,
    p_business_address TEXT, p_business_category TEXT, p_internal_notes TEXT,
    p_owner_name TEXT, p_owner_email TEXT, p_owner_password TEXT,
    p_access_period TEXT, p_is_lifetime BOOLEAN,
    p_activation_date TIMESTAMPTZ, p_expiry_date TIMESTAMPTZ
  )
  RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions
  AS $$
  DECLARE
    v_workspace_id UUID; v_auth_user_id UUID; v_slug TEXT; v_result JSONB;
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN
      RAISE EXCEPTION 'Unauthorized: Only Platform Admins can provision workspaces';
    END IF;
    
    v_slug := lower(regexp_replace(p_business_name, '[^a-zA-Z0-9\\\\s]', '', 'g'));
    v_slug := regexp_replace(v_slug, '\\\\s+', '-', 'g');
    v_slug := v_slug || '-' || substr(gen_random_uuid()::text, 1, 8);
    
    INSERT INTO public.workspaces (name, slug, status, access_period, is_lifetime, activation_date, expiry_date, business_email, business_phone, business_address, business_category, internal_notes, created_at, updated_at)
    VALUES (p_business_name, v_slug, 'Active', p_access_period, p_is_lifetime, p_activation_date, p_expiry_date, p_business_email, p_business_phone, p_business_address, p_business_category, p_internal_notes, NOW(), NOW())
    RETURNING id INTO v_workspace_id;
    
    v_auth_user_id := gen_random_uuid();
    
    INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (v_auth_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_owner_email, extensions.crypt(p_owner_password, extensions.gen_salt('bf')), NOW(), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']), jsonb_build_object('name', p_owner_name, 'role', 'Admin', 'workspaceId', v_workspace_id::text), NOW(), NOW(), '', '', '', '');
    
    INSERT INTO auth.identities (id, provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (gen_random_uuid(), v_auth_user_id::text, v_auth_user_id, jsonb_build_object('sub', v_auth_user_id::text, 'email', p_owner_email), 'email', NOW(), NOW(), NOW());
    
    INSERT INTO public.users (id, workspace_id, username, name, email, role, status, password_hash, created_at, updated_at)
    VALUES (v_auth_user_id, v_workspace_id, split_part(p_owner_email, '@', 1), p_owner_name, p_owner_email, 'Admin', 'Active', 'auth_handled', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET workspace_id = v_workspace_id, name = p_owner_name, role = 'Admin', status = 'Active', updated_at = NOW();
    
    INSERT INTO public.business_profiles (workspace_id, business_name, email, phone, address, created_at, updated_at)
    VALUES (v_workspace_id, p_business_name, p_business_email, p_business_phone, p_business_address, NOW(), NOW()) ON CONFLICT (workspace_id) DO NOTHING;
    
    INSERT INTO public.settings (workspace_id, currency, currency_symbol, created_at, updated_at)
    VALUES (v_workspace_id, 'PKR', 'Rs.', NOW(), NOW()) ON CONFLICT (workspace_id) DO NOTHING;
    
    INSERT INTO public.payment_methods (workspace_id, name, method_type, is_active, sort_order)
    VALUES (v_workspace_id, 'Cash', 'cash', true, 1), (v_workspace_id, 'Card', 'card', true, 2), (v_workspace_id, 'Mobile Payment', 'mobile', true, 3), (v_workspace_id, 'Bank Transfer', 'bank', true, 4);
    
    INSERT INTO public.tax_configurations (workspace_id, name, rate, is_active, is_default)
    VALUES (v_workspace_id, 'Standard Tax (17%)', 17.00, true, true);
    
    INSERT INTO public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, description)
    VALUES (v_workspace_id, auth.uid(), 'WORKSPACE_PROVISIONED', 'Workspace', v_workspace_id, 'Workspace provisioned by Platform Admin. Owner: ' || p_owner_name || ' (' || p_owner_email || ')');
    
    RETURN jsonb_build_object('success', true, 'workspace_id', v_workspace_id, 'auth_user_id', v_auth_user_id, 'slug', v_slug);
  EXCEPTION WHEN OTHERS THEN RAISE EXCEPTION 'Workspace provisioning failed: %', SQLERRM;
  END;
  $$;
`;

async function run() {
  console.log('🚀 Fixing RPC function...');
  const result = await mgmtApiRequest(
    `/v1/projects/${PROJECT_REF}/database/query`,
    'POST',
    { query: fixRPC },
    PAT
  );
  
  if (result.status >= 200 && result.status < 300) {
    console.log('✅ Fix applied successfully');
  } else {
    console.error('❌ Failed:', result.status, result.data);
  }
}

run();