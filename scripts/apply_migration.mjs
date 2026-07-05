/**
 * Apply Phase 5 Workspace Management Migration
 * Uses Supabase Management API with Personal Access Token (PAT)
 */
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

const migrations = [
  {
    name: '1_add_workspace_columns',
    sql: `
      ALTER TABLE public.workspaces
        ADD COLUMN IF NOT EXISTS business_email VARCHAR(255),
        ADD COLUMN IF NOT EXISTS business_phone VARCHAR(50),
        ADD COLUMN IF NOT EXISTS business_address TEXT,
        ADD COLUMN IF NOT EXISTS business_category VARCHAR(100),
        ADD COLUMN IF NOT EXISTS internal_notes TEXT;
    `
  },
  {
    name: '2_add_users_name_column',
    sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`
  },
  {
    name: '3_workspace_admin_rls_policies',
    sql: `
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Platform Admins can view all workspaces') THEN
          CREATE POLICY "Platform Admins can view all workspaces" ON public.workspaces FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Platform Admins can manage all workspaces') THEN
          CREATE POLICY "Platform Admins can manage all workspaces" ON public.workspaces FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Platform Admins can view all users') THEN
          CREATE POLICY "Platform Admins can view all users" ON public.users FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Platform Admins can manage all users') THEN
          CREATE POLICY "Platform Admins can manage all users" ON public.users FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'products' AND policyname = 'Platform Admins can view all products') THEN
          CREATE POLICY "Platform Admins can view all products" ON public.products FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'customers' AND policyname = 'Platform Admins can view all customers') THEN
          CREATE POLICY "Platform Admins can view all customers" ON public.customers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sales' AND policyname = 'Platform Admins can view all sales') THEN
          CREATE POLICY "Platform Admins can view all sales" ON public.sales FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'suppliers' AND policyname = 'Platform Admins can view all suppliers') THEN
          CREATE POLICY "Platform Admins can view all suppliers" ON public.suppliers FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'business_profiles' AND policyname = 'Platform Admins can view all business_profiles') THEN
          CREATE POLICY "Platform Admins can view all business_profiles" ON public.business_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Platform Admins can view all settings') THEN
          CREATE POLICY "Platform Admins can view all settings" ON public.settings FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Platform Admins can view all activity_logs') THEN
          CREATE POLICY "Platform Admins can view all activity_logs" ON public.activity_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Platform Admins can insert into activity_logs') THEN
          CREATE POLICY "Platform Admins can insert into activity_logs" ON public.activity_logs FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_methods' AND policyname = 'Platform Admins can view all payment_methods') THEN
          CREATE POLICY "Platform Admins can view all payment_methods" ON public.payment_methods FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tax_configurations' AND policyname = 'Platform Admins can view all tax_configurations') THEN
          CREATE POLICY "Platform Admins can view all tax_configurations" ON public.tax_configurations FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'license_history' AND policyname = 'Platform Admins can view license_history') THEN
          CREATE POLICY "Platform Admins can view license_history" ON public.license_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'license_history' AND policyname = 'Platform Admins can insert license_history') THEN
          CREATE POLICY "Platform Admins can insert license_history" ON public.license_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.platform_admins pa WHERE pa.user_id = auth.uid() AND pa.is_active = true));
        END IF;
      END $$;
    `
  },
  {
    name: '4_provision_workspace_rpc',
    sql: `
      CREATE OR REPLACE FUNCTION public.provision_workspace(
        p_business_name TEXT, p_business_email TEXT, p_business_phone TEXT,
        p_business_address TEXT, p_business_category TEXT, p_internal_notes TEXT,
        p_owner_name TEXT, p_owner_email TEXT, p_owner_password TEXT,
        p_access_period TEXT, p_is_lifetime BOOLEAN,
        p_activation_date TIMESTAMPTZ, p_expiry_date TIMESTAMPTZ
      )
      RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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
        VALUES (v_auth_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', p_owner_email, crypt(p_owner_password, gen_salt('bf')), NOW(), jsonb_build_object('provider', 'email', 'providers', ARRAY['email']), jsonb_build_object('name', p_owner_name, 'role', 'Admin', 'workspaceId', v_workspace_id::text), NOW(), NOW(), '', '', '', '');
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
    `
  },
  {
    name: '5_admin_workspace_status_rpcs',
    sql: `
      CREATE OR REPLACE FUNCTION public.admin_update_workspace_status(p_workspace_id UUID, p_status TEXT, p_admin_notes TEXT DEFAULT NULL)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
        UPDATE public.workspaces SET status = p_status, updated_at = NOW() WHERE id = p_workspace_id;
        INSERT INTO public.license_history (workspace_id, action, new_value, performed_by) VALUES (p_workspace_id, 'STATUS_CHANGE', p_status, auth.uid());
        INSERT INTO public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, description)
        VALUES (p_workspace_id, auth.uid(), 'WORKSPACE_STATUS_CHANGED', 'Workspace', p_workspace_id, 'Status changed to ' || p_status || COALESCE('. Notes: ' || p_admin_notes, ''));
      END; $$;

      CREATE OR REPLACE FUNCTION public.admin_extend_workspace_access(p_workspace_id UUID, p_access_period TEXT, p_is_lifetime BOOLEAN, p_new_expiry_date TIMESTAMPTZ DEFAULT NULL)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
        UPDATE public.workspaces SET access_period = p_access_period, is_lifetime = p_is_lifetime, expiry_date = p_new_expiry_date, status = 'Active', updated_at = NOW() WHERE id = p_workspace_id;
        INSERT INTO public.license_history (workspace_id, action, new_value, performed_by) VALUES (p_workspace_id, 'ACCESS_EXTENDED', CASE WHEN p_is_lifetime THEN 'Lifetime' ELSE p_access_period END, auth.uid());
        INSERT INTO public.activity_logs (workspace_id, user_id, action, entity_type, entity_id, description)
        VALUES (p_workspace_id, auth.uid(), 'WORKSPACE_ACCESS_EXTENDED', 'Workspace', p_workspace_id, 'Access period updated to: ' || CASE WHEN p_is_lifetime THEN 'Lifetime' ELSE p_access_period END);
      END; $$;

      CREATE OR REPLACE FUNCTION public.admin_soft_delete_workspace(p_workspace_id UUID)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
        UPDATE public.workspaces SET deleted_at = NOW(), status = 'Deleted', updated_at = NOW() WHERE id = p_workspace_id;
      END; $$;

      CREATE OR REPLACE FUNCTION public.admin_restore_workspace(p_workspace_id UUID)
      RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid() AND is_active = true) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
        UPDATE public.workspaces SET deleted_at = NULL, status = 'Active', updated_at = NOW() WHERE id = p_workspace_id;
      END; $$;
    `
  }
];

async function run() {
  console.log('🚀 Phase 5 Migration - Applying via Management API using PAT\n');

  for (const migration of migrations) {
    console.log(`\n→ Applying: ${migration.name}`);
    try {
      const result = await mgmtApiRequest(
        `/v1/projects/${PROJECT_REF}/database/query`,
        'POST',
        { query: migration.sql },
        PAT
      );
      
      if (result.status >= 200 && result.status < 300) {
        console.log(`  ✓ Successfully applied`);
      } else {
        console.log(`  ⚠ Status: ${result.status}`);
        console.log('  Response:', result.data.substring(0, 300));
        const dataObj = JSON.parse(result.data || '{}');
        if (dataObj.message && dataObj.message.includes('already exists')) {
            console.log('  (Safe to ignore - already applied)');
        } else {
            process.exit(1);
        }
      }
    } catch (err) {
      console.error(`  ❌ Failed:`, err.message);
      process.exit(1);
    }
  }
  console.log('\n✅ All migrations applied successfully!');
}

run().catch(console.error);