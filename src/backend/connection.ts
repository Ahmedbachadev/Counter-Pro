import supabase from './supabaseClient';
import { handleBackendError } from './errors';

export interface ConnectionStatus {
  isConnected: boolean;
  provider: 'supabase' | 'local';
  error?: string;
  diagnostics?: {
    hasUrl: boolean;
    hasKey: boolean;
    pingStatus?: number;
    latencyMs?: number;
  };
}

export const connectionManager = {
  async checkConnection(): Promise<ConnectionStatus> {
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!supabase) {
      return {
        isConnected: false,
        provider: 'local',
        error: 'Supabase client not initialized. Missing environment variables.',
        diagnostics: { hasUrl, hasKey }
      };
    }

    try {
      const startTime = Date.now();
      // Validate connection by checking a low-overhead call.
      // Testing auth.getSession() is standard and doesn't require a schema yet.
      const { error } = await supabase.auth.getSession();
      const latencyMs = Date.now() - startTime;

      if (error) {
        throw error;
      }

      return {
        isConnected: true,
        provider: 'supabase',
        diagnostics: {
          hasUrl,
          hasKey,
          pingStatus: 200,
          latencyMs
        }
      };
    } catch (err: any) {
      const normalizedError = handleBackendError(err);
      console.error('[Connection Diagnostic] Supabase connection failed:', normalizedError);
      
      return {
        isConnected: false,
        provider: 'local',
        error: normalizedError.message,
        diagnostics: {
          hasUrl,
          hasKey,
          pingStatus: err?.status || 500
        }
      };
    }
  },

  logDiagnostics(status: ConnectionStatus): void {
    console.group('🔌 Backend Connection Diagnostics');
    console.log(`Active Provider: ${status.provider.toUpperCase()}`);
    console.log(`Connection Status: ${status.isConnected ? '✅ Connected' : '❌ Disconnected (Falling back to local database)'}`);
    if (status.diagnostics) {
      console.log(`VITE_SUPABASE_URL config: ${status.diagnostics.hasUrl ? 'Present' : 'Missing'}`);
      console.log(`VITE_SUPABASE_ANON_KEY config: ${status.diagnostics.hasKey ? 'Present' : 'Missing'}`);
      if (status.diagnostics.latencyMs !== undefined) {
        console.log(`Connection Latency: ${status.diagnostics.latencyMs}ms`);
      }
      if (status.diagnostics.pingStatus !== undefined) {
        console.log(`HTTP Ping Status: ${status.diagnostics.pingStatus}`);
      }
    }
    if (status.error) {
      console.warn(`Error Details: ${status.error}`);
      console.info('Tip: Verify your network connection and check that your local .env file contains valid Supabase credentials.');
    }
    console.groupEnd();
  }
};

export default connectionManager;
