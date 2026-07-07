import { DataProvider } from './DataProvider';
import { SupabaseProvider } from './SupabaseProvider';
import supabase from '../supabaseClient';

const supabaseProvider = new SupabaseProvider();

// Proxy to intercept all provider methods and improve error handling
const errorHandlingProxy = new Proxy(supabaseProvider, {
  get(target, prop, receiver) {
    const originalMethod = Reflect.get(target, prop, receiver);
    if (typeof originalMethod === 'function') {
      return async (...args: any[]) => {
        try {
          return await originalMethod.apply(target, args);
        } catch (error: any) {
          console.error(`[Supabase Error in ${String(prop)}]:`, error);
          
          // Auto-refresh token if expired and retry
          if (error.message && (error.message.includes('JWT expired') || error.message.includes('token expired') || error.status === 401)) {
            try {
              console.log('JWT expired or unauthorized, attempting to refresh session...');
              if (supabase) {
                const { data: { session }, error: refreshError } = await supabase.auth.getSession();
                if (session && !refreshError) {
                  console.log('Session successfully refreshed. Retrying database operation...');
                  return await originalMethod.apply(target, args);
                }
              }
            } catch (refreshErr) {
              console.error('Failed to automatically refresh session on JWT expiry:', refreshErr);
            }
          }

          let friendlyMessage = 'An unexpected error occurred while communicating with the server.';
          
          if (error.code === 'PGRST116') {
            friendlyMessage = 'The requested record could not be found.';
          } else if (error.code === '23505') {
            friendlyMessage = 'A record with this information already exists (duplicate entry).';
          } else if (error.code === '23503') {
            friendlyMessage = 'Cannot perform this action because this record is referenced by other data.';
          } else if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            friendlyMessage = 'Network failure. Please check your internet connection.';
          } else if (error.status === 408 || error.code === '57014') {
            friendlyMessage = 'The request timed out. Please try again.';
          } else if (error.message) {
            friendlyMessage = error.message;
          }
          
          throw new Error(friendlyMessage);
        }
      };
    }
    return originalMethod;
  }
});

export function getProvider(): DataProvider {
  return errorHandlingProxy;
}

export * from './DataProvider';
export * from './SupabaseProvider';
