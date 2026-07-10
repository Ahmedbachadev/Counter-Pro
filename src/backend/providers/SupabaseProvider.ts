import { DataProvider } from './DataProvider';
import supabase from '../supabaseClient';
import { storageManager } from '../storage';
import type {
  Category,
  Product,
  Customer,
  Sale,
  SaleItem,
  ShopSettings,
  Supplier,
  StockPurchase,
  Expense,
  StockAdjustment,
  PurchaseEntry,
  PurchaseEntryItem,
  StockMovement,
  InventoryAuditLog,
  CustomerPayment,
  CustomerLoyaltyHistory,
  User
} from '../types';

export class SupabaseProvider implements DataProvider {
  private getClient() {
    if (!supabase) throw new Error('Supabase client is not configured.');
    return supabase;
  }

  private async getWorkspaceId(): Promise<string> {
    const client = this.getClient();
    let { data, error } = await client.from('workspaces').select('id').limit(1).single();
    if (!data) {
      const res = await client.from('workspaces').insert({ name: 'Default Workspace', slug: 'default' }).select('id').single();
      if (res.error) throw res.error;
      return res.data.id;
    }
    return data.id;
  }

  private async getCurrentUserId(workspaceId: string): Promise<string | null> {
    const client = this.getClient();
    let userId = (await client.auth.getUser()).data.user?.id;
    if (!userId) {
      const { data: users } = await client.from('users').select('id').eq('workspace_id', workspaceId).limit(1);
      if (users && users.length > 0) {
        userId = users[0].id;
      }
    }
    return userId || null;
  }

  async getCategories(): Promise<Category[]> {
    const client = this.getClient();
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await client.from('categories').select('*').eq('workspace_id', workspaceId).order('name');
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      name: d.name,
      nameUrdu: d.name_urdu,
      description: d.description,
      createdAt: d.created_at
    }));
  }

  async addCategory(category: Omit<Category, 'id' | 'createdAt'>): Promise<Category> {
    const client = this.getClient();
    const workspaceId = await this.getWorkspaceId();
    const userId = await this.getCurrentUserId(workspaceId);
    const { data, error } = await client.from('categories').insert({
      workspace_id: workspaceId,
      name: category.name,
      name_urdu: category.nameUrdu || null,
      description: category.description || null,
      created_by: userId ?? null,
      updated_by: userId ?? null
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      nameUrdu: data.name_urdu,
      description: data.description,
      createdAt: data.created_at
    };
  }

  async updateCategory(id: number | string, updates: Partial<Category>): Promise<void> {
    const client = this.getClient();
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.nameUrdu !== undefined) payload.name_urdu = updates.nameUrdu;
    if (updates.description !== undefined) payload.description = updates.description;
    
    if (Object.keys(payload).length > 0) {
      const { error } = await client.from('categories').update(payload).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteCategory(id: number | string): Promise<void> {
    const { error } = await this.getClient().from('categories').delete().eq('id', id);
    if (error) throw error;
  }

  async getSuppliers(): Promise<Supplier[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('suppliers').select('*').eq('workspace_id', workspaceId).order('name');
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      name: d.name,
      contactPerson: d.contact_person,
      phone: d.phone,
      email: d.email,
      address: d.address,
      taxId: d.tax_id,
      bankName: d.bank_name,
      bankAccount: d.bank_account,
      paymentTerms: d.payment_terms,
      status: d.status,
      outstandingBalance: Number(d.outstanding_balance),
      totalPurchases: Number(d.total_purchases),
      lastPurchaseDate: d.last_purchase_date,
      notes: d.notes,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  async addSupplier(supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>): Promise<Supplier> {
    const workspaceId = await this.getWorkspaceId();
    const userId = await this.getCurrentUserId(workspaceId);
    const { data, error } = await this.getClient().from('suppliers').insert({
      workspace_id: workspaceId,
      name: supplier.name,
      contact_person: supplier.contactPerson,
      phone: supplier.phone,
      email: supplier.email,
      address: supplier.address,
      tax_id: supplier.taxId,
      bank_name: supplier.bankName,
      bank_account: supplier.bankAccount,
      payment_terms: supplier.paymentTerms,
      status: supplier.status || 'Active',
      outstanding_balance: supplier.outstandingBalance || 0,
      total_purchases: supplier.totalPurchases || 0,
      last_purchase_date: supplier.lastPurchaseDate,
      notes: supplier.notes,
      created_by: userId,
      updated_by: userId
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      contactPerson: data.contact_person,
      phone: data.phone,
      email: data.email,
      address: data.address,
      taxId: data.tax_id,
      bankName: data.bank_name,
      bankAccount: data.bank_account,
      paymentTerms: data.payment_terms,
      status: data.status,
      outstandingBalance: Number(data.outstanding_balance),
      totalPurchases: Number(data.total_purchases),
      lastPurchaseDate: data.last_purchase_date,
      notes: data.notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }

  async updateSupplier(id: number | string, updates: Partial<Supplier>): Promise<void> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.contactPerson !== undefined) payload.contact_person = updates.contactPerson;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.taxId !== undefined) payload.tax_id = updates.taxId;
    if (updates.bankName !== undefined) payload.bank_name = updates.bankName;
    if (updates.bankAccount !== undefined) payload.bank_account = updates.bankAccount;
    if (updates.paymentTerms !== undefined) payload.payment_terms = updates.paymentTerms;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.outstandingBalance !== undefined) payload.outstanding_balance = updates.outstandingBalance;
    if (updates.totalPurchases !== undefined) payload.total_purchases = updates.totalPurchases;
    if (updates.lastPurchaseDate !== undefined) payload.last_purchase_date = updates.lastPurchaseDate;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    if (Object.keys(payload).length > 0) {
      const { error } = await this.getClient().from('suppliers').update(payload).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteSupplier(id: number | string): Promise<void> {
    const { error } = await this.getClient().from('suppliers').delete().eq('id', id);
    if (error) throw error;
  }

  async getSupplierProducts(supplierId: number | string): Promise<Product[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('products').select('*').eq('workspace_id', workspaceId).eq('supplier_id', supplierId).order('name');
    if (error) throw error;
    return this.mapProducts(data);
  }

  async getSupplierStats(supplierId: number | string): Promise<{ totalProducts: number; totalCost: number }> {
    const products = await this.getSupplierProducts(supplierId);
    return {
      totalProducts: products.length,
      totalCost: products.reduce((acc, p) => acc + (p.cost * p.stock), 0)
    };
  }

  async addStockPurchase(purchase: Omit<StockPurchase, 'id' | 'createdAt'>): Promise<StockPurchase> {
    throw new Error('addStockPurchase not mapped, use purchase_orders');
  }
  async getSupplierStockPurchases(supplierId: number | string): Promise<StockPurchase[]> {
    return [];
  }
  async getProductStockPurchases(productId: number | string): Promise<StockPurchase[]> {
    return [];
  }
  async getAllStockPurchases(): Promise<StockPurchase[]> {
    return [];
  }

  private mapProducts(data: any[]): Product[] {
    return data.map(d => ({
      id: d.id,
      name: d.name,
      nameUrdu: d.name_urdu,
      categoryId: d.category_id,
      supplierId: d.supplier_id,
      barcode: d.barcode,
      sku: d.sku,
      price: Number(d.price),
      cost: Number(d.cost),
      stock: d.stock,
      initialStock: d.initial_stock,
      minStock: d.min_stock,
      description: d.description,
      image: d.primary_image_url,
      status: d.status,
      createdAt: d.created_at,
      updatedAt: d.updated_at
    }));
  }

  async getProducts(): Promise<Product[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('products').select('*').eq('workspace_id', workspaceId).order('name');
    if (error) throw error;
    const products = this.mapProducts(data);
    
    // Generate signed URLs for products with storage paths
    const paths = products.filter(p => p.image && !p.image.startsWith('data:')).map(p => p.image);
    if (paths.length > 0) {
      const { data: signedUrls } = await supabase.storage.from('product-images').createSignedUrls(paths, 3600);
      if (signedUrls) {
        const urlMap = Object.fromEntries(signedUrls.map(d => [d.path, d.signedUrl]));
        products.forEach(p => {
          if (p.image && urlMap[p.image]) {
            p.image = urlMap[p.image];
          }
        });
      }
    }
    
    return products;
  }

  async addProduct(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const workspaceId = await this.getWorkspaceId();
    const userId = await this.getCurrentUserId(workspaceId);
    const payload: any = {
      workspace_id: workspaceId,
      name: product.name,
      name_urdu: product.nameUrdu || null,
      category_id: product.categoryId && String(product.categoryId).trim() !== '' && String(product.categoryId) !== 'NaN' ? product.categoryId : null,
      supplier_id: product.supplierId && String(product.supplierId).trim() !== '' && String(product.supplierId) !== 'NaN' ? product.supplierId : null,
      barcode: product.barcode || null,
      sku: product.sku || null,
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      initial_stock: product.initialStock || product.stock,
      min_stock: product.minStock || 0,
      description: product.description || null,
      primary_image_url: product.image || null,
      status: product.status || 'Active',
      created_by: userId ?? null,
      updated_by: userId ?? null
    };
    
    // Upload image if it's base64
    if (product.image && product.image.startsWith('data:image/')) {
      try {
        const res = await fetch(product.image);
        const blob = await res.blob();
        const ext = blob.type.split('/')[1] || 'png';
        const file = new File([blob], `prod_${Date.now()}.${ext}`, { type: blob.type });
        const path = `${workspaceId}/${file.name}`;
        await storageManager.uploadFile('product-images', path, file);
        payload.primary_image_url = path;
      } catch (err) {
        console.error('Failed to upload image:', err);
      }
    }
    
    // In migration from JSON, categoryId/supplierId might be numbers which fail UUID cast. 
    // The migration script will handle fixing foreign keys before saving, or we handle nulls here.
    
    const { data, error } = await this.getClient().from('products').insert(payload).select().single();
    if (error) throw error;
    
    // Add movement and audit log automatically via provider
    await this.addStockMovement(data.id, data.name, 'Product Creation', 0, data.stock, data.stock, `PROD-${data.id}`, 'Initial stock');
    
    return this.mapProducts([data])[0];
  }

  async updateProduct(id: number | string, updates: Partial<Product>): Promise<void> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.nameUrdu !== undefined) payload.name_urdu = updates.nameUrdu;
    if (updates.categoryId !== undefined) payload.category_id = updates.categoryId && String(updates.categoryId).trim() !== '' && String(updates.categoryId) !== 'NaN' ? updates.categoryId : null;
    if (updates.supplierId !== undefined) payload.supplier_id = updates.supplierId && String(updates.supplierId).trim() !== '' && String(updates.supplierId) !== 'NaN' ? updates.supplierId : null;
    if (updates.barcode !== undefined) payload.barcode = updates.barcode;
    if (updates.sku !== undefined) payload.sku = updates.sku;
    if (updates.price !== undefined) payload.price = updates.price;
    if (updates.cost !== undefined) payload.cost = updates.cost;
    if (updates.stock !== undefined) payload.stock = updates.stock;
    if (updates.minStock !== undefined) payload.min_stock = updates.minStock;
    if (updates.description !== undefined) payload.description = updates.description;
    
    if (updates.image !== undefined) {
      if (updates.image.startsWith('data:image/')) {
        try {
          const workspaceId = await this.getWorkspaceId();
          const res = await fetch(updates.image);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `prod_${Date.now()}.${ext}`, { type: blob.type });
          const path = `${workspaceId}/${file.name}`;
          await storageManager.uploadFile('product-images', path, file);
          payload.primary_image_url = path;
        } catch (err) {
          console.error('Failed to upload image:', err);
          payload.primary_image_url = updates.image;
        }
      } else {
        payload.primary_image_url = updates.image;
      }
    }
    
    if (updates.status !== undefined) payload.status = updates.status;

    if (Object.keys(payload).length > 0) {
      const { error } = await this.getClient().from('products').update(payload).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteProduct(id: number | string): Promise<void> {
    const { error } = await this.getClient().from('products').delete().eq('id', id);
    if (error) throw error;
  }

  async updateProductStock(id: number | string, change: number): Promise<void> {
    // This is tricky without RPC, we have to fetch then update
    const { data } = await this.getClient().from('products').select('stock').eq('id', id).single();
    if (data) {
      await this.getClient().from('products').update({ stock: data.stock + change }).eq('id', id);
    }
  }

  async getCustomers(): Promise<Customer[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('customers').select('*').eq('workspace_id', workspaceId).order('name');
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      name: d.name,
      phone: d.phone,
      email: d.email,
      address: d.address,
      billingAddress: d.billing_address,
      shippingAddress: d.shipping_address,
      customerType: d.customer_type,
      status: d.status,
      pendingAmount: Number(d.pending_amount),
      loyaltyPoints: d.loyalty_points,
      notes: d.notes,
      createdAt: d.created_at as any
    }));
  }

  async addCustomer(customer: Omit<Customer, 'id' | 'createdAt'>): Promise<Customer> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('customers').insert({
      workspace_id: workspaceId,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      billing_address: customer.billingAddress,
      shipping_address: customer.shippingAddress,
      customer_type: customer.customerType,
      status: customer.status,
      pending_amount: customer.pendingAmount,
      loyalty_points: customer.loyaltyPoints,
      notes: customer.notes
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      name: data.name,
      phone: data.phone,
      email: data.email,
      address: data.address,
      billingAddress: data.billing_address,
      shippingAddress: data.shipping_address,
      customerType: data.customer_type,
      status: data.status,
      pendingAmount: Number(data.pending_amount),
      loyaltyPoints: data.loyalty_points,
      notes: data.notes,
      createdAt: data.created_at as any
    };
  }

  async updateCustomer(id: number | string, updates: Partial<Customer>): Promise<void> {
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.billingAddress !== undefined) payload.billing_address = updates.billingAddress;
    if (updates.shippingAddress !== undefined) payload.shipping_address = updates.shippingAddress;
    if (updates.customerType !== undefined) payload.customer_type = updates.customerType;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.pendingAmount !== undefined) payload.pending_amount = updates.pendingAmount;
    if (updates.loyaltyPoints !== undefined) payload.loyalty_points = updates.loyaltyPoints;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    if (Object.keys(payload).length > 0) {
      const { error } = await this.getClient().from('customers').update(payload).eq('id', id);
      if (error) throw error;
    }
  }

  async deleteCustomer(id: number | string): Promise<void> {
    const { error } = await this.getClient().from('customers').delete().eq('id', id);
    if (error) throw error;
  }

  async getCustomerPayments(customerId: number | string): Promise<CustomerPayment[]> {
    return [];
  }
  async addCustomerPayment(payment: Omit<CustomerPayment, 'id' | 'createdAt'>): Promise<CustomerPayment> {
    throw new Error('Not implemented');
  }
  async getCustomerLoyaltyHistory(customerId: number | string): Promise<CustomerLoyaltyHistory[]> {
    return [];
  }
  async addCustomerLoyaltyHistory(history: Omit<CustomerLoyaltyHistory, 'id' | 'createdAt'>): Promise<CustomerLoyaltyHistory> {
    throw new Error('Not implemented');
  }
  async updateCustomerBalance(id: number | string, amount: number): Promise<void> {
    const { data } = await this.getClient().from('customers').select('pending_amount').eq('id', id).single();
    if (data) {
      await this.getClient().from('customers').update({ pending_amount: Number(data.pending_amount) + amount }).eq('id', id);
    }
  }
  async updateCustomerLoyaltyPoints(id: number | string, pointsChange: number): Promise<void> {}

  async getSales(): Promise<Sale[]> {
    return this.getSalesWithItems() as any;
  }

  async getSalesWithItems(): Promise<(Sale & { items: any[] })[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data: sales, error } = await this.getClient().from('sales').select('*, sale_items(*)').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return sales.map(s => ({
      id: s.id,
      total: Number(s.total),
      tax: Number(s.tax),
      discount: Number(s.discount),
      finalAmount: Number(s.final_amount),
      amountPaid: Number(s.amount_paid),
      change: Number(s.change),
      dueAmount: Number(s.due_amount),
      paymentMethod: 'cash',
      paymentStatus: s.payment_status,
      customerId: s.customer_id,
      cashierId: s.cashier_id,
      createdAt: s.created_at as any,
      discountType: s.discount_type,
      discountValue: Number(s.discount_value),
      discountReason: s.discount_reason,
      notes: s.notes,
      items: (s.sale_items || []).map((i: any) => ({
        id: i.id,
        saleId: i.sale_id,
        productId: i.product_id,
        productName: i.product_name,
        productPrice: Number(i.product_price),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
        discountType: i.discount_type,
        discountValue: Number(i.discount_value),
        discountReason: i.discount_reason,
        notes: i.notes
      }))
    }));
  }

  async addSale(sale: Omit<Sale, 'id' | 'createdAt'>, items: any[]): Promise<Sale> {
    const workspaceId = await this.getWorkspaceId();

    const isUUID = (val: any): boolean => 
      typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    let cashierUuid: string | null = null;
    if (isUUID(sale.cashierId)) {
      cashierUuid = sale.cashierId;
    } else {
      try {
        const { data: { user } } = await this.getClient().auth.getUser();
        if (user && isUUID(user.id)) {
          cashierUuid = user.id;
        }
      } catch (err) {
        console.error('Failed to get authenticated user for cashier_id:', err);
      }
    }

    const customerUuid = isUUID(sale.customerId) ? sale.customerId : null;

    const { data, error } = await this.getClient().from('sales').insert({
      workspace_id: workspaceId,
      customer_id: customerUuid,
      cashier_id: cashierUuid,
      total: sale.total,
      tax: sale.tax,
      discount: sale.discount,
      discount_type: sale.discountType,
      discount_value: sale.discountValue,
      discount_reason: sale.discountReason,
      final_amount: sale.finalAmount,
      amount_paid: sale.amountPaid,
      change: sale.change,
      due_amount: sale.dueAmount,
      payment_status: sale.paymentStatus,
      notes: sale.notes
    }).select().single();
    if (error) throw error;

    if (items && items.length > 0) {
      const insertItems = items.map(item => ({
        sale_id: data.id,
        product_id: isUUID(item.product.id) ? item.product.id : null,
        product_name: item.product.name,
        product_price: item.product.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        discount_type: item.discountType,
        discount_value: item.discountValue,
        discount_reason: item.discountReason,
        notes: item.notes
      }));
      await this.getClient().from('sale_items').insert(insertItems);
      
      // Stock and inventory updates are handled automatically by PostgreSQL triggers
      // (adjust_inventory_on_sale) which deducts stock and writes to stock_movements
    }

    return { ...sale, id: data.id, createdAt: data.created_at as any };
  }

  async getSaleItems(saleId: number | string): Promise<SaleItem[]> {
    const { data, error } = await this.getClient().from('sale_items').select('*').eq('sale_id', saleId);
    if (error) throw error;
    return data.map(i => ({
        id: i.id,
        saleId: i.sale_id,
        productId: i.product_id,
        productName: i.product_name,
        productPrice: Number(i.product_price),
        quantity: i.quantity,
        subtotal: Number(i.subtotal),
        discountType: i.discount_type,
        discountValue: Number(i.discount_value),
        discountReason: i.discount_reason,
        notes: i.notes
    }));
  }

  async updateSale(saleId: number | string, updates: Partial<Sale>, items?: any[]): Promise<void> {
    const payload: any = {};
    if (updates.total !== undefined) payload.total = updates.total;
    // ... basic mapping. Will keep minimal for this phase as usually sales are not heavily updated
    if (Object.keys(payload).length > 0) {
      const { error } = await this.getClient().from('sales').update(payload).eq('id', saleId);
      if (error) throw error;
    }
  }

  async deleteSale(saleId: number | string): Promise<void> {
    const { error } = await this.getClient().from('sales').delete().eq('id', saleId);
    if (error) throw error;
  }

  async getSettings(): Promise<ShopSettings> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('settings').select('*').eq('workspace_id', workspaceId).single();
    if (error && error.code !== 'PGRST116') throw error; // ignore if missing
    
    // Fallback if missing
    if (!data) return { id: 1, name: 'Counter Pro', nameUrdu: '', address: '', addressUrdu: '', phone: '', email: '', taxRate: 0, updatedAt: '' };
    
    const settings: ShopSettings = {
      id: data.id,
      name: 'Counter Pro', // We don't store name in settings table anymore, it's in business_profiles or workspaces
      nameUrdu: '',
      address: '',
      addressUrdu: '',
      phone: '',
      email: '',
      taxRate: 0,
      updatedAt: data.updated_at,
      currency: data.currency,
      currencySymbol: data.currency_symbol,
      dateFormat: data.date_format,
      numberFormat: data.number_format,
      receiptSize: data.receipt_size,
      showLogoReceipt: data.show_logo_receipt,
      showCustomerReceipt: data.show_customer_receipt,
      showTaxBreakdownReceipt: data.show_tax_breakdown_receipt,
      showBarcodeReceipt: data.show_barcode_receipt,
      printAutomatically: data.print_automatically,
      lowStockThreshold: data.low_stock_threshold,
      inventoryValuationMethod: data.inventory_valuation_method,
      autoPrintReceiptPOS: data.auto_print_receipt_pos,
      openCashDrawer: data.open_cash_drawer,
      primaryColor: data.primary_color,
      secondaryColor: data.secondary_color,
      accentColor: data.accent_color,
      invoiceLogo: data.invoice_logo_url,
      receiptHeader: data.receipt_header,
      receiptFooter: data.receipt_footer,
    };
    
    // Convert signed URL if it's a storage path
    if (settings.invoiceLogo && !settings.invoiceLogo.startsWith('data:') && !settings.invoiceLogo.startsWith('http')) {
      const { data: signedUrlData } = await this.getClient().storage.from('business-logos').createSignedUrl(settings.invoiceLogo, 3600);
      if (signedUrlData) {
        settings.invoiceLogo = signedUrlData.signedUrl;
      }
    }
    
    return settings;
  }

  async updateSettings(updates: Partial<ShopSettings>): Promise<void> {
    const workspaceId = await this.getWorkspaceId();
    const payload: any = {};
    if (updates.currency !== undefined) payload.currency = updates.currency;
    if (updates.currencySymbol !== undefined) payload.currency_symbol = updates.currencySymbol;
    if (updates.dateFormat !== undefined) payload.date_format = updates.dateFormat;
    if (updates.numberFormat !== undefined) payload.number_format = updates.numberFormat;
    if (updates.receiptSize !== undefined) payload.receipt_size = updates.receiptSize;
    if (updates.showLogoReceipt !== undefined) payload.show_logo_receipt = updates.showLogoReceipt;
    if (updates.showCustomerReceipt !== undefined) payload.show_customer_receipt = updates.showCustomerReceipt;
    if (updates.showTaxBreakdownReceipt !== undefined) payload.show_tax_breakdown_receipt = updates.showTaxBreakdownReceipt;
    if (updates.showBarcodeReceipt !== undefined) payload.show_barcode_receipt = updates.showBarcodeReceipt;
    if (updates.printAutomatically !== undefined) payload.print_automatically = updates.printAutomatically;
    if (updates.lowStockThreshold !== undefined) payload.low_stock_threshold = updates.lowStockThreshold;
    if (updates.inventoryValuationMethod !== undefined) payload.inventory_valuation_method = updates.inventoryValuationMethod;
    if (updates.autoPrintReceiptPOS !== undefined) payload.auto_print_receipt_pos = updates.autoPrintReceiptPOS;
    if (updates.openCashDrawer !== undefined) payload.open_cash_drawer = updates.openCashDrawer;
    if (updates.primaryColor !== undefined) payload.primary_color = updates.primaryColor;
    if (updates.secondaryColor !== undefined) payload.secondary_color = updates.secondaryColor;
    if (updates.accentColor !== undefined) payload.accent_color = updates.accentColor;
    if (updates.receiptHeader !== undefined) payload.receipt_header = updates.receiptHeader;
    if (updates.receiptFooter !== undefined) payload.receipt_footer = updates.receiptFooter;

    if (updates.invoiceLogo !== undefined) {
      if (updates.invoiceLogo.startsWith('data:image/')) {
        try {
          const res = await fetch(updates.invoiceLogo);
          const blob = await res.blob();
          const ext = blob.type.split('/')[1] || 'png';
          const file = new File([blob], `logo_${Date.now()}.${ext}`, { type: blob.type });
          const path = `${workspaceId}/${file.name}`;
          await storageManager.uploadFile('business-logos', path, file);
          payload.invoice_logo_url = path;
        } catch (err) {
          console.error('Failed to upload logo:', err);
          payload.invoice_logo_url = updates.invoiceLogo;
        }
      } else {
        payload.invoice_logo_url = updates.invoiceLogo;
      }
    }

    if (Object.keys(payload).length > 0) {
      await this.getClient().from('settings').update(payload).eq('workspace_id', workspaceId);
    }
  }

  async getExpenses(): Promise<Expense[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('expenses').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(d => ({
      id: d.id,
      description: d.description,
      category: d.category,
      amount: Number(d.amount),
      paymentMethod: d.payment_method_id || 'cash',
      reference: d.reference,
      vendor: d.vendor,
      status: d.status,
      isRecurring: d.is_recurring,
      recurringFrequency: d.recurring_frequency as any,
      nextRecurringDate: d.next_recurring_date,
      notes: d.notes,
      createdAt: d.created_at,
      addedBy: d.created_by,
      lastUpdated: d.updated_at
    }));
  }

  async addExpense(expense: Omit<Expense, 'id' | 'createdAt'>): Promise<Expense> {
    const workspaceId = await this.getWorkspaceId();
    const { data, error } = await this.getClient().from('expenses').insert({
      workspace_id: workspaceId,
      description: expense.description,
      category: expense.category,
      amount: expense.amount,
      reference: expense.reference,
      vendor: expense.vendor,
      status: expense.status,
      is_recurring: expense.isRecurring,
      recurring_frequency: expense.recurringFrequency,
      next_recurring_date: expense.nextRecurringDate,
      notes: expense.notes
    }).select().single();
    if (error) throw error;
    return {
      id: data.id,
      description: data.description,
      category: data.category,
      amount: Number(data.amount),
      paymentMethod: data.payment_method_id || 'cash',
      reference: data.reference,
      vendor: data.vendor,
      status: data.status,
      isRecurring: data.is_recurring,
      recurringFrequency: data.recurring_frequency as any,
      nextRecurringDate: data.next_recurring_date,
      notes: data.notes,
      createdAt: data.created_at,
      addedBy: data.created_by,
      lastUpdated: data.updated_at
    };
  }

  async updateExpense(id: number | string, updates: Partial<Expense>): Promise<void> {
    const payload: any = {};
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    // Map as needed
    if (Object.keys(payload).length > 0) {
      await this.getClient().from('expenses').update(payload).eq('id', id);
    }
  }

  async deleteExpense(id: number | string): Promise<void> {
    await this.getClient().from('expenses').delete().eq('id', id);
  }

  async addLoginHistory(record: any): Promise<number> { return 0; }
  async updateLoginHistory(id: number | string, record: any): Promise<void> {}
  async authenticateUser(username: string, password: string): Promise<any> { return null; }
  async getUsers(): Promise<User[]> { return []; }
  async addUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> { throw new Error(''); }
  async updateUser(id: number | string, updates: Partial<User>): Promise<void> {}
  async deleteUser(id: number | string): Promise<void> {}
  
  async exportData(): Promise<void> {}
  async importData(file?: File): Promise<void> {}
  async exportSettings(): Promise<void> {}
  async importSettings(file?: File): Promise<void> {}
  async resetPreferences(): Promise<void> {}
  async clearDemoData(): Promise<void> {}
  async resetSampleData(): Promise<void> {}

  async getStockAdjustments(): Promise<StockAdjustment[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data } = await this.getClient().from('stock_adjustments').select('*').eq('workspace_id', workspaceId);
    return (data || []).map(d => ({
      id: d.id,
      productId: d.product_id,
      productName: 'Unknown',
      quantity: d.quantity,
      adjustmentType: d.adjustment_type as any,
      reason: d.reason,
      notes: d.notes,
      createdAt: d.created_at
    }));
  }

  async addStockAdjustment(adj: Omit<StockAdjustment, 'id' | 'createdAt'>): Promise<StockAdjustment> {
    const workspaceId = await this.getWorkspaceId();
    const client = this.getClient();

    const { data, error } = await client.from('stock_adjustments').insert({
      workspace_id: workspaceId,
      product_id: typeof adj.productId === 'string' ? adj.productId : null,
      quantity: adj.quantity,
      adjustment_type: adj.adjustmentType,
      reason: adj.reason,
      notes: adj.notes
    }).select().single();
    if (error) throw error;

    // Fetch current stock then update with signed quantity change
    const { data: prod } = await client.from('products').select('stock').eq('id', adj.productId).single();
    if (prod) {
      const newStock = Math.max(0, prod.stock + adj.quantity);
      await client.from('products').update({ stock: newStock }).eq('id', adj.productId);
    }

    return { ...adj, id: data.id, createdAt: data.created_at };
  }

  async getPurchaseEntries(): Promise<PurchaseEntry[]> {
    const workspaceId = await this.getWorkspaceId();
    const { data } = await this.getClient().from('purchase_orders').select('*').eq('workspace_id', workspaceId);
    return (data || []).map(d => ({
      id: d.id,
      supplierId: d.supplier_id,
      supplierName: 'Unknown',
      purchaseDate: d.order_date,
      invoiceNumber: d.invoice_number,
      taxes: Number(d.taxes),
      discounts: Number(d.discounts),
      totalAmount: Number(d.total_amount),
      notes: d.notes,
      createdAt: d.created_at
    }));
  }

  async addPurchaseEntry(entry: Omit<PurchaseEntry, 'id' | 'createdAt' | 'items'>, items: Omit<PurchaseEntryItem, 'id' | 'purchaseEntryId'>[]): Promise<PurchaseEntry> {
    const workspaceId = await this.getWorkspaceId();
    const client = this.getClient();

    // Insert the purchase order as Completed so the DB trigger auto-updates stock
    const { data, error } = await client.from('purchase_orders').insert({
      workspace_id: workspaceId,
      supplier_id: typeof entry.supplierId === 'string' ? entry.supplierId : null,
      order_date: entry.purchaseDate,
      invoice_number: entry.invoiceNumber,
      taxes: entry.taxes,
      discounts: entry.discounts,
      total_amount: entry.totalAmount,
      notes: entry.notes,
      status: 'Completed'
    }).select().single();
    if (error) throw error;

    // Insert all purchase items — the DB trigger on purchase_order_items updates product stock
    if (items.length > 0) {
      const itemRows = items.map(item => ({
        purchase_order_id: data.id,
        product_id: typeof item.productId === 'string' ? item.productId : null,
        product_name: item.productName,
        quantity: item.quantity,
        cost_price: item.costPrice,
        subtotal: item.subtotal
      }));

      const { error: itemError } = await client.from('purchase_order_items').insert(itemRows);
      if (itemError) throw itemError;

      // Update each product's cost price using Weighted Average Costing (WAC):
      // New WAC = (existing_stock × old_cost + new_qty × new_cost) / (existing_stock + new_qty)
      await Promise.all(
        items
          .filter(item => item.productId && item.costPrice > 0)
          .map(async item => {
            const { data: prod } = await client
              .from('products')
              .select('stock, cost')
              .eq('id', item.productId)
              .single();

            if (prod) {
              const existingStock = Number(prod.stock) || 0;
              const existingCost = Number(prod.cost) || 0;
              const newQty = item.quantity;
              const newCost = item.costPrice;

              // stock has already been incremented by the DB trigger, so back-calculate pre-purchase stock
              const prePurchaseStock = Math.max(0, existingStock - newQty);
              const totalUnits = prePurchaseStock + newQty;

              const weightedAvgCost = totalUnits > 0
                ? (prePurchaseStock * existingCost + newQty * newCost) / totalUnits
                : newCost;

              await client
                .from('products')
                .update({ cost: Math.round(weightedAvgCost * 100) / 100 })
                .eq('id', item.productId);
            }
          })
      );
    }

    return { ...entry, id: data.id, createdAt: data.created_at };
  }

  async getStockMovements(productId?: number | string): Promise<StockMovement[]> {
    const workspaceId = await this.getWorkspaceId();
    let q = this.getClient().from('stock_movements').select('*').eq('workspace_id', workspaceId);
    if (productId) q = q.eq('product_id', productId);
    const { data } = await q.order('created_at', { ascending: false });
    return (data || []).map(d => ({
      id: d.id,
      productId: d.product_id,
      productName: 'Unknown',
      actionType: d.action_type,
      qtyBefore: d.qty_before,
      qtyChanged: d.qty_changed,
      qtyAfter: d.qty_after,
      reference: d.reference,
      notes: d.notes,
      createdAt: d.created_at
    }));
  }

  async addStockMovement(productId: number | string, productName: string, actionType: string, qtyBefore: number, qtyChanged: number, qtyAfter: number, reference?: string, notes?: string, user?: string): Promise<void> {
    const workspaceId = await this.getWorkspaceId();
    await this.getClient().from('stock_movements').insert({
      workspace_id: workspaceId,
      product_id: typeof productId === 'string' ? productId : null,
      action_type: actionType,
      qty_before: qtyBefore,
      qty_changed: qtyChanged,
      qty_after: qtyAfter,
      reference,
      notes
    });
  }

  async getInventoryAuditLogs(): Promise<InventoryAuditLog[]> { return []; }
  async addInventoryAuditLog(action: string, reference: string, description: string, user?: string): Promise<void> {}
  
  async syncDatabases(): Promise<void> {
    console.log('Migration triggered.');
  }
}
