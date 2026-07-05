import supabase from './supabaseClient';

export interface RealtimeSubscription {
  unsubscribe: () => void;
}

type EventCallback = (payload: any) => void;

class RealtimeManager {
  private channel: any = null;
  private workspaceId: string | null = null;
  private subscriptions: Map<string, Set<EventCallback>> = new Map();
  private isConnected = false;
  private reconnectTimer: any = null;
  private activeTables = ['products', 'sales', 'customers', 'inventory', 'notifications', 'stock_movements'];

  /**
   * Initialize the realtime connection for a specific workspace.
   */
  initialize(workspaceId: string | number) {
    if (!supabase) return;
    
    this.workspaceId = String(workspaceId);
    this.connect();
  }

  private connect() {
    if (!this.workspaceId || this.isConnected) return;

    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    let chan = supabase.channel(`workspace_${this.workspaceId}`);

    // Subscribe to all relevant tables with workspace_id filter to ensure data isolation
    this.activeTables.forEach(table => {
      chan = chan.on(
        'postgres_changes',
        { event: '*', schema: 'public', table: table, filter: `workspace_id=eq.${this.workspaceId}` },
        (payload) => this.handlePayload(payload)
      );
    });

    this.channel = chan.subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log('[Realtime] Connected to workspace channel.');
        this.isConnected = true;
        if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
      } else if (status === 'CLOSED') {
        console.log('[Realtime] Disconnected.');
        this.isConnected = false;
      } else if (status === 'CHANNEL_ERROR') {
        console.error('[Realtime] Connection error. Will retry...', err);
        this.isConnected = false;
        this.scheduleReconnect();
      }
    });
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      console.log('[Realtime] Attempting to reconnect...');
      this.connect();
    }, 5000); // 5 seconds retry
  }

  private handlePayload(payload: any) {
    const key = `${payload.table}:${payload.eventType}`;
    const anyEventKey = `${payload.table}:*`;
    
    [key, anyEventKey].forEach(eventKey => {
      if (this.subscriptions.has(eventKey)) {
         this.subscriptions.get(eventKey)?.forEach(cb => {
            try { 
              cb(payload); 
            } catch (e) { 
              console.error(`[Realtime] Error in callback for ${eventKey}:`, e); 
            }
         });
      }
    });
  }

  /**
   * Subscribe to changes on a specific table.
   */
  subscribeToTable(
    tableName: string,
    event: 'INSERT' | 'UPDATE' | 'DELETE' | '*',
    callback: EventCallback
  ): RealtimeSubscription {
    const key = `${tableName}:${event}`;
    
    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, new Set());
    }
    
    this.subscriptions.get(key)!.add(callback);

    // If we're not connected but have a workspaceId, connect
    if (!this.isConnected && this.workspaceId) {
       this.connect();
    }

    return {
      unsubscribe: () => {
        const subs = this.subscriptions.get(key);
        if (subs) {
          subs.delete(callback);
          if (subs.size === 0) {
            this.subscriptions.delete(key);
          }
        }
      }
    };
  }

  /**
   * Disconnect and clear all subscriptions.
   */
  disconnect() {
    if (this.channel) {
      supabase.removeChannel(this.channel);
      this.channel = null;
    }
    this.isConnected = false;
    this.workspaceId = null;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.subscriptions.clear();
  }
}

export const realtimeManager = new RealtimeManager();
export default realtimeManager;
