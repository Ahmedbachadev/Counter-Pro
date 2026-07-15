import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load .env variables in the main process
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[SyncEngine] Supabase environment variables missing in Main Process!');
}

export const mainSupabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // Main process doesn't need to persist session in storage
        autoRefreshToken: false
      }
    })
  : null;

/**
 * Set the authenticated user session on the main-process Supabase client.
 * This is called from the renderer via IPC after login, forwarding the user's
 * access_token and refresh_token so the sync engine can make authenticated requests.
 */
export async function setSupabaseSession(accessToken: string, refreshToken: string): Promise<boolean> {
  if (!mainSupabase) {
    console.warn('[MainSupabaseClient] Cannot set session — client not initialized');
    return false;
  }

  try {
    const { data, error } = await mainSupabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken
    });

    if (error) {
      console.error('[MainSupabaseClient] Failed to set session:', error.message);
      return false;
    }

    console.log('[MainSupabaseClient] Session set successfully for user:', data.user?.id);
    return true;
  } catch (err) {
    console.error('[MainSupabaseClient] Error setting session:', err);
    return false;
  }
}

/**
 * Clear the session (e.g., on logout).
 */
export async function clearSupabaseSession(): Promise<void> {
  if (!mainSupabase) return;
  
  try {
    await mainSupabase.auth.signOut();
    console.log('[MainSupabaseClient] Session cleared.');
  } catch (err) {
    console.error('[MainSupabaseClient] Error clearing session:', err);
  }
}
