import { BaseRecord } from '../types';

export interface Product extends BaseRecord {
  name: string;
  name_urdu?: string;
  category_id?: string;
  supplier_id?: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  initial_stock: number;
  min_stock: number;
  description?: string;
  image?: string;
}

export interface Customer extends BaseRecord {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  pending_amount: number;
}

export interface Supplier extends BaseRecord {
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Sale extends BaseRecord {
  total: number;
  tax: number;
  discount: number;
  final_amount: number;
  amount_paid: number;
  change: number;
  due_amount: number;
  payment_method: string;
  customer_id?: string;
  cashier_id?: string;
}

export interface SaleItem extends BaseRecord {
  sale_id: string;
  product_id: string;
  product_name: string;
  product_price: number;
  quantity: number;
  subtotal: number;
}

export interface InventoryMovement extends BaseRecord {
  product_id: string;
  action_type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE' | 'RETURN';
  qty_changed: number;
  qty_before: number;
  qty_after: number;
  reference?: string;
  notes?: string;
}
