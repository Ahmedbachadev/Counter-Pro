export interface SyncTableConfig {
  remoteTable: string;
  workspaceFiltered: boolean;
  parentJoin?: string;
  syncColumn?: string;
}

export const TABLE_MAPPINGS: Record<string, SyncTableConfig> = {
  'categories': { remoteTable: 'categories', workspaceFiltered: true },
  'products': { remoteTable: 'products', workspaceFiltered: true },
  'customers': { remoteTable: 'customers', workspaceFiltered: true },
  'suppliers': { remoteTable: 'suppliers', workspaceFiltered: true },
  'expenses': { remoteTable: 'expenses', workspaceFiltered: true },
  'purchases': { remoteTable: 'purchase_orders', workspaceFiltered: true },
  'purchase_items': { remoteTable: 'purchase_order_items', workspaceFiltered: false, parentJoin: 'purchase_orders!inner(workspace_id)', syncColumn: 'created_at' },
  'sales': { remoteTable: 'sales', workspaceFiltered: true },
  'sale_items': { remoteTable: 'sale_items', workspaceFiltered: false, parentJoin: 'sales!inner(workspace_id)', syncColumn: 'created_at' },
  'inventory_movements': { remoteTable: 'stock_movements', workspaceFiltered: true, syncColumn: 'created_at' },
  'settings': { remoteTable: 'settings', workspaceFiltered: true },
  'users': { remoteTable: 'users', workspaceFiltered: true },
};
