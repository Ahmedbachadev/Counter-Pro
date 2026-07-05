const fs = require('fs');
const path = require('path');

const tablesWithWorkspace = [
  'stock_movements', 'sales', 'users', 'cashier_permissions', 'login_history', 'business_profiles', 
  'settings', 'payment_methods', 'tax_configurations', 'discount_rules', 'units', 'brands', 
  'barcode_settings', 'categories', 'suppliers', 'inventory', 'stock_adjustments', 'purchase_orders', 
  'returns', 'exchanges', 'expenses', 'notifications', 'activity_logs', 'inventory_audit_logs', 
  'products', 'customers'
];

const tablesWithoutWorkspace = {
  'product_images': 'product_id',
  'product_variants': 'product_id',
  'sale_payments': 'sale_id',
  'sale_items': 'sale_id',
  'purchase_order_items': 'purchase_order_id',
  'return_items': 'return_id'
};

const parentTables = {
  'product_id': 'products',
  'sale_id': 'sales',
  'purchase_order_id': 'purchase_orders',
  'return_id': 'returns'
};

let sql = '';

sql += '-- 1. Helper Functions\n';
sql += `
CREATE OR REPLACE FUNCTION get_current_workspace_id()
RETURNS UUID AS $$
DECLARE
  v_workspace_id UUID;
  v_meta_workspace_id TEXT;
BEGIN
  v_meta_workspace_id := auth.jwt() -> 'user_metadata' ->> 'workspaceId';
  
  BEGIN
    v_workspace_id := v_meta_workspace_id::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_workspace_id := NULL;
  END;

  IF v_workspace_id IS NULL THEN
     SELECT workspace_id INTO v_workspace_id FROM public.users WHERE id = auth.uid();
  END IF;

  IF v_workspace_id IS NULL THEN
     SELECT id INTO v_workspace_id FROM public.workspaces LIMIT 1;
  END IF;

  RETURN v_workspace_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
BEGIN
  v_role := auth.jwt() -> 'user_metadata' ->> 'role';
  IF v_role IS NULL THEN
     SELECT role INTO v_role FROM public.users WHERE id = auth.uid();
  END IF;
  RETURN v_role IN ('Admin', 'Owner', 'Manager', 'admin');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Trigger to sync auth.users to public.users automatically
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  BEGIN
    v_workspace_id := (NEW.raw_user_meta_data->>'workspaceId')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_workspace_id := NULL;
  END;
  
  IF v_workspace_id IS NULL THEN
     SELECT id INTO v_workspace_id FROM public.workspaces LIMIT 1;
  END IF;

  INSERT INTO public.users (id, workspace_id, username, email, role, status, password_hash)
  VALUES (
    NEW.id,
    v_workspace_id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'Cashier'),
    'Active',
    'auth_handled'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = EXCLUDED.role;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

`;

sql += '\n-- 2. Enable RLS and Create Policies\n';

sql += `ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;\n`;
sql += `
CREATE POLICY "Users can view their own workspace" ON public.workspaces
  FOR SELECT USING (id = get_current_workspace_id());

CREATE POLICY "Admins can update their workspace" ON public.workspaces
  FOR UPDATE USING (id = get_current_workspace_id() AND is_admin());
`;

for (const table of tablesWithWorkspace) {
  if (table === 'users') {
     sql += `ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;\n`;
     sql += `
CREATE POLICY "Users can view users in same workspace" ON public.users
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (workspace_id = get_current_workspace_id() AND is_admin());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());
`;
  } else {
     sql += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
     sql += `
CREATE POLICY "Workspace data isolation (SELECT)" ON public.${table}
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.${table}
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.${table}
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.${table}
  FOR DELETE USING (workspace_id = get_current_workspace_id());
`;
  }
}

for (const [table, fk] of Object.entries(tablesWithoutWorkspace)) {
  const parent = parentTables[fk];
  sql += `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY;\n`;
  sql += `
CREATE POLICY "Workspace data isolation (SELECT)" ON public.${table}
  FOR SELECT USING (${fk} IN (SELECT id FROM public.${parent} WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.${table}
  FOR INSERT WITH CHECK (${fk} IN (SELECT id FROM public.${parent} WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.${table}
  FOR UPDATE USING (${fk} IN (SELECT id FROM public.${parent} WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.${table}
  FOR DELETE USING (${fk} IN (SELECT id FROM public.${parent} WHERE workspace_id = get_current_workspace_id()));
`;
}

fs.writeFileSync(path.join(__dirname, '../supabase/migrations/20260703120000_enable_rls.sql'), sql);
fs.writeFileSync(path.join(__dirname, '../mcp_payload.json'), JSON.stringify({
  project_id: 'nvenvuikepbjtgakasog',
  query: sql
}));
console.log('Generated migration file and MCP payload.');
