import supabase from '../../backend/supabaseClient';

export interface AuditLogOptions {
  action: string;
  module: string;
  entityType?: string;
  entityId?: string;
  description: string;
  severity?: 'Info' | 'Success' | 'Warning' | 'Critical';
  status?: 'Success' | 'Failed';
  beforeValues?: any;
  afterValues?: any;
  workspaceId?: string;
}

/**
 * Enterprise Audit Logger
 * Logs actions securely to the activity_logs table using Platform Admin credentials.
 */
export const logAudit = async (options: AuditLogOptions) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    // Attempt to get user agent details
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown';
    
    // We try to log to Supabase. This assumes the user has INSERT access to activity_logs
    // (which we enabled for Platform Admins via RLS)
    await supabase.from('activity_logs').insert([{
      workspace_id: options.workspaceId || null,
      user_id: session?.user?.id || null,
      action: options.action,
      module: options.module,
      entity_type: options.entityType || 'Platform',
      entity_id: options.entityId || '00000000-0000-0000-0000-000000000000',
      description: options.description,
      severity: options.severity || 'Info',
      status: options.status || 'Success',
      before_values: options.beforeValues || null,
      after_values: options.afterValues || null,
      user_agent: userAgent
    }]);
    
  } catch (error) {
    console.error('Audit Logger Error (Failed to write log):', error);
  }
};
