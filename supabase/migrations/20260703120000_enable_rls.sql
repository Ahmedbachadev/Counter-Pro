-- 1. Helper Functions

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


-- 2. Enable RLS and Create Policies
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workspace" ON public.workspaces
  FOR SELECT USING (id = get_current_workspace_id());

CREATE POLICY "Admins can update their workspace" ON public.workspaces
  FOR UPDATE USING (id = get_current_workspace_id() AND is_admin());
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.stock_movements
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.stock_movements
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.stock_movements
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.stock_movements
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.sales
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.sales
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.sales
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.sales
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view users in same workspace" ON public.users
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Admins can manage users" ON public.users
  FOR ALL USING (workspace_id = get_current_workspace_id() AND is_admin());

CREATE POLICY "Users can update their own profile" ON public.users
  FOR UPDATE USING (id = auth.uid());
ALTER TABLE public.cashier_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.cashier_permissions
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.cashier_permissions
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.cashier_permissions
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.cashier_permissions
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.login_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.login_history
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.login_history
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.login_history
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.login_history
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.business_profiles
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.business_profiles
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.business_profiles
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.business_profiles
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.settings
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.settings
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.settings
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.settings
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.payment_methods
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.payment_methods
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.payment_methods
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.payment_methods
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.tax_configurations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.tax_configurations
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.tax_configurations
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.tax_configurations
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.tax_configurations
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.discount_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.discount_rules
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.discount_rules
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.discount_rules
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.discount_rules
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.units
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.units
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.units
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.units
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.brands
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.brands
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.brands
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.brands
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.barcode_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.barcode_settings
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.barcode_settings
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.barcode_settings
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.barcode_settings
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.categories
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.categories
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.categories
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.categories
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.suppliers
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.suppliers
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.suppliers
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.suppliers
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.inventory
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.inventory
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.inventory
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.inventory
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.stock_adjustments
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.stock_adjustments
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.stock_adjustments
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.stock_adjustments
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.purchase_orders
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.purchase_orders
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.purchase_orders
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.purchase_orders
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.returns
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.returns
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.returns
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.returns
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.exchanges
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.exchanges
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.exchanges
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.exchanges
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.expenses
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.expenses
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.expenses
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.expenses
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.notifications
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.notifications
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.notifications
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.notifications
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.activity_logs
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.activity_logs
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.activity_logs
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.activity_logs
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.inventory_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.inventory_audit_logs
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.inventory_audit_logs
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.inventory_audit_logs
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.inventory_audit_logs
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.products
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.products
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.products
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.products
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.customers
  FOR SELECT USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (INSERT)" ON public.customers
  FOR INSERT WITH CHECK (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.customers
  FOR UPDATE USING (workspace_id = get_current_workspace_id());

CREATE POLICY "Workspace data isolation (DELETE)" ON public.customers
  FOR DELETE USING (workspace_id = get_current_workspace_id());
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.product_images
  FOR SELECT USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.product_images
  FOR INSERT WITH CHECK (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.product_images
  FOR UPDATE USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.product_images
  FOR DELETE USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.product_variants
  FOR SELECT USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.product_variants
  FOR INSERT WITH CHECK (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.product_variants
  FOR UPDATE USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.product_variants
  FOR DELETE USING (product_id IN (SELECT id FROM public.products WHERE workspace_id = get_current_workspace_id()));
ALTER TABLE public.sale_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.sale_payments
  FOR SELECT USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.sale_payments
  FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.sale_payments
  FOR UPDATE USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.sale_payments
  FOR DELETE USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.sale_items
  FOR SELECT USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.sale_items
  FOR INSERT WITH CHECK (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.sale_items
  FOR UPDATE USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.sale_items
  FOR DELETE USING (sale_id IN (SELECT id FROM public.sales WHERE workspace_id = get_current_workspace_id()));
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.purchase_order_items
  FOR SELECT USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.purchase_order_items
  FOR INSERT WITH CHECK (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.purchase_order_items
  FOR UPDATE USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.purchase_order_items
  FOR DELETE USING (purchase_order_id IN (SELECT id FROM public.purchase_orders WHERE workspace_id = get_current_workspace_id()));
ALTER TABLE public.return_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace data isolation (SELECT)" ON public.return_items
  FOR SELECT USING (return_id IN (SELECT id FROM public.returns WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (INSERT)" ON public.return_items
  FOR INSERT WITH CHECK (return_id IN (SELECT id FROM public.returns WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (UPDATE)" ON public.return_items
  FOR UPDATE USING (return_id IN (SELECT id FROM public.returns WHERE workspace_id = get_current_workspace_id()));

CREATE POLICY "Workspace data isolation (DELETE)" ON public.return_items
  FOR DELETE USING (return_id IN (SELECT id FROM public.returns WHERE workspace_id = get_current_workspace_id()));
