-- Phase 4.1: Backend Hardening, Storage, Functions, Triggers, Performance

-- 1. Create Storage Buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('product-images', 'product-images', false),
('business-logos', 'business-logos', false),
('expense-receipts', 'expense-receipts', false),
('po-attachments', 'po-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage path extraction helper
CREATE OR REPLACE FUNCTION public.get_workspace_id_from_path(file_path TEXT)
RETURNS UUID AS $$
BEGIN
  RETURN (string_to_array(file_path, '/'))[1]::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Storage Policies
-- We need to enable RLS on storage.objects first? No, it's enabled by default in Supabase usually.
CREATE POLICY "Workspace isolation for product-images" ON storage.objects
FOR ALL USING (bucket_id = 'product-images' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id())
WITH CHECK (bucket_id = 'product-images' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id());

CREATE POLICY "Workspace isolation for business-logos" ON storage.objects
FOR ALL USING (bucket_id = 'business-logos' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id())
WITH CHECK (bucket_id = 'business-logos' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id());

CREATE POLICY "Workspace isolation for expense-receipts" ON storage.objects
FOR ALL USING (bucket_id = 'expense-receipts' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id())
WITH CHECK (bucket_id = 'expense-receipts' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id());

CREATE POLICY "Workspace isolation for po-attachments" ON storage.objects
FOR ALL USING (bucket_id = 'po-attachments' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id())
WITH CHECK (bucket_id = 'po-attachments' AND public.get_workspace_id_from_path(name) = public.get_current_workspace_id());

-- 2. Trigger functions for updated_at
DO $$ BEGIN
  CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_product_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_returns_updated_at BEFORE UPDATE ON returns FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_exchanges_updated_at BEFORE UPDATE ON exchanges FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_business_profiles_updated_at BEFORE UPDATE ON business_profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_payment_methods_updated_at BEFORE UPDATE ON payment_methods FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_tax_configurations_updated_at BEFORE UPDATE ON tax_configurations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_discount_rules_updated_at BEFORE UPDATE ON discount_rules FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_units_updated_at BEFORE UPDATE ON units FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER set_barcode_settings_updated_at BEFORE UPDATE ON barcode_settings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Audit Logging
CREATE OR REPLACE FUNCTION public.audit_log_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_user_id UUID;
  v_action VARCHAR(255);
  v_entity_id UUID;
  v_row_data JSONB;
BEGIN
  v_user_id := auth.uid();

  IF TG_OP = 'DELETE' THEN
    v_row_data := to_jsonb(OLD);
  ELSE
    v_row_data := to_jsonb(NEW);
  END IF;

  v_entity_id := (v_row_data->>'id')::UUID;
  
  BEGIN
    v_workspace_id := (v_row_data->>'workspace_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_workspace_id := public.get_current_workspace_id();
  END;
  
  IF v_workspace_id IS NULL THEN
     v_workspace_id := public.get_current_workspace_id();
  END IF;

  IF TG_OP = 'INSERT' THEN v_action := 'Created';
  ELSIF TG_OP = 'UPDATE' THEN v_action := 'Updated';
  ELSIF TG_OP = 'DELETE' THEN v_action := 'Deleted';
  END IF;

  INSERT INTO public.activity_logs (
    workspace_id, user_id, action, entity_type, entity_id, description
  ) VALUES (
    v_workspace_id, v_user_id, v_action, TG_TABLE_NAME, v_entity_id, 
    v_action || ' ' || TG_TABLE_NAME || ' record'
  );
  
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON sales FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER audit_returns AFTER INSERT OR UPDATE OR DELETE ON returns FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER audit_purchase_orders AFTER INSERT OR UPDATE OR DELETE ON purchase_orders FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION audit_log_trigger_func();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Inventory Consistency Triggers

CREATE OR REPLACE FUNCTION public.adjust_inventory_on_sale()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
BEGIN
  SELECT workspace_id INTO v_workspace_id FROM public.sales WHERE id = NEW.sale_id;
  
  -- Decrease products stock
  UPDATE public.products 
  SET stock = stock - NEW.quantity 
  WHERE id = NEW.product_id;
  
  IF NEW.variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock - NEW.quantity
    WHERE id = NEW.variant_id;
  END IF;
  
  -- Ensure inventory record exists
  INSERT INTO public.inventory (workspace_id, product_id, variant_id, location_name, quantity)
  VALUES (v_workspace_id, NEW.product_id, NEW.variant_id, 'Main Store', -NEW.quantity)
  ON CONFLICT (workspace_id, product_id, variant_id, location_name) 
  DO UPDATE SET quantity = public.inventory.quantity - EXCLUDED.quantity;
    
  -- Log stock movement
  INSERT INTO public.stock_movements (
    workspace_id, product_id, variant_id, action_type, qty_before, qty_changed, qty_after, reference, created_by
  ) VALUES (
    v_workspace_id, NEW.product_id, NEW.variant_id, 'Sale', 
    (SELECT stock + NEW.quantity FROM public.products WHERE id = NEW.product_id), 
    -NEW.quantity, 
    (SELECT stock FROM public.products WHERE id = NEW.product_id), 
    'Sale ID: ' || NEW.sale_id, auth.uid()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_adjust_inventory_on_sale
  AFTER INSERT ON sale_items
  FOR EACH ROW EXECUTE FUNCTION adjust_inventory_on_sale();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.adjust_inventory_on_return()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_variant_id UUID;
BEGIN
  SELECT workspace_id INTO v_workspace_id FROM public.returns WHERE id = NEW.return_id;
  SELECT variant_id INTO v_variant_id FROM public.sale_items WHERE id = NEW.sale_item_id;
  
  -- Increase products stock
  UPDATE public.products 
  SET stock = stock + NEW.quantity 
  WHERE id = NEW.product_id;
  
  IF v_variant_id IS NOT NULL THEN
    UPDATE public.product_variants
    SET stock = stock + NEW.quantity
    WHERE id = v_variant_id;
  END IF;
  
  -- Increase inventory location
  INSERT INTO public.inventory (workspace_id, product_id, variant_id, location_name, quantity)
  VALUES (v_workspace_id, NEW.product_id, v_variant_id, 'Main Store', NEW.quantity)
  ON CONFLICT (workspace_id, product_id, variant_id, location_name) 
  DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity;

  -- Log stock movement
  INSERT INTO public.stock_movements (
    workspace_id, product_id, variant_id, action_type, qty_before, qty_changed, qty_after, reference, created_by
  ) VALUES (
    v_workspace_id, NEW.product_id, v_variant_id, 'Return', 
    (SELECT stock - NEW.quantity FROM public.products WHERE id = NEW.product_id), 
    NEW.quantity, 
    (SELECT stock FROM public.products WHERE id = NEW.product_id), 
    'Return ID: ' || NEW.return_id, auth.uid()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_adjust_inventory_on_return
  AFTER INSERT ON return_items
  FOR EACH ROW EXECUTE FUNCTION adjust_inventory_on_return();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.adjust_inventory_on_po_item()
RETURNS TRIGGER AS $$
DECLARE
  v_workspace_id UUID;
  v_status VARCHAR(50);
BEGIN
  SELECT workspace_id, status INTO v_workspace_id, v_status FROM public.purchase_orders WHERE id = NEW.purchase_order_id;
  
  IF v_status = 'Completed' THEN
    -- Increase products stock
    UPDATE public.products 
    SET stock = stock + NEW.quantity 
    WHERE id = NEW.product_id;
    
    IF NEW.variant_id IS NOT NULL THEN
      UPDATE public.product_variants
      SET stock = stock + NEW.quantity
      WHERE id = NEW.variant_id;
    END IF;
    
    -- Increase inventory location
    INSERT INTO public.inventory (workspace_id, product_id, variant_id, location_name, quantity)
    VALUES (v_workspace_id, NEW.product_id, NEW.variant_id, 'Main Store', NEW.quantity)
    ON CONFLICT (workspace_id, product_id, variant_id, location_name) 
    DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity;
      
    -- Log stock movement
    INSERT INTO public.stock_movements (
      workspace_id, product_id, variant_id, action_type, qty_before, qty_changed, qty_after, reference, created_by
    ) VALUES (
      v_workspace_id, NEW.product_id, NEW.variant_id, 'Purchase', 
      (SELECT stock - NEW.quantity FROM public.products WHERE id = NEW.product_id), 
      NEW.quantity, 
      (SELECT stock FROM public.products WHERE id = NEW.product_id), 
      'PO ID: ' || NEW.purchase_order_id, auth.uid()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_adjust_inventory_on_po_item
  AFTER INSERT ON purchase_order_items
  FOR EACH ROW EXECUTE FUNCTION adjust_inventory_on_po_item();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.adjust_inventory_on_po_status_change()
RETURNS TRIGGER AS $$
DECLARE
  item RECORD;
BEGIN
  IF NEW.status = 'Completed' AND OLD.status != 'Completed' THEN
    FOR item IN SELECT * FROM public.purchase_order_items WHERE purchase_order_id = NEW.id
    LOOP
      UPDATE public.products 
      SET stock = stock + item.quantity 
      WHERE id = item.product_id;
      
      IF item.variant_id IS NOT NULL THEN
        UPDATE public.product_variants
        SET stock = stock + item.quantity
        WHERE id = item.variant_id;
      END IF;
      
      INSERT INTO public.inventory (workspace_id, product_id, variant_id, location_name, quantity)
      VALUES (NEW.workspace_id, item.product_id, item.variant_id, 'Main Store', item.quantity)
      ON CONFLICT (workspace_id, product_id, variant_id, location_name) 
      DO UPDATE SET quantity = public.inventory.quantity + EXCLUDED.quantity;
        
      -- Log stock movement
      INSERT INTO public.stock_movements (
        workspace_id, product_id, variant_id, action_type, qty_before, qty_changed, qty_after, reference, created_by
      ) VALUES (
        NEW.workspace_id, item.product_id, item.variant_id, 'Purchase', 
        (SELECT stock - item.quantity FROM public.products WHERE id = item.product_id), 
        item.quantity, 
        (SELECT stock FROM public.products WHERE id = item.product_id), 
        'PO ID: ' || NEW.id, auth.uid()
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
  CREATE TRIGGER trg_adjust_inventory_on_po_status
  AFTER UPDATE OF status ON purchase_orders
  FOR EACH ROW EXECUTE FUNCTION adjust_inventory_on_po_status_change();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_sales_created_at_status ON sales(created_at, payment_status);
CREATE INDEX IF NOT EXISTS idx_inventory_qty ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_sale_items_product ON sale_items(product_id);

