export class BackendError extends Error {
  public code: string;
  public details?: any;
  public type: 'database' | 'auth' | 'network' | 'timeout' | 'unknown';

  constructor(message: string, type: 'database' | 'auth' | 'network' | 'timeout' | 'unknown' = 'unknown', code: string = 'UNKNOWN', details?: any) {
    super(message);
    this.name = 'BackendError';
    this.type = type;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class DatabaseError extends BackendError {
  constructor(message: string, code: string = 'DB_ERROR', details?: any) {
    super(message, 'database', code, details);
    this.name = 'DatabaseError';
  }
}

export class AuthError extends BackendError {
  constructor(message: string, code: string = 'AUTH_ERROR', details?: any) {
    super(message, 'auth', code, details);
    this.name = 'AuthError';
  }
}

export class NetworkError extends BackendError {
  constructor(message: string = 'Network failure. Please check your connection.', code: string = 'NETWORK_ERROR', details?: any) {
    super(message, 'network', code, details);
    this.name = 'NetworkError';
  }
}

export class TimeoutError extends BackendError {
  constructor(message: string = 'The request timed out. Please try again.', code: string = 'TIMEOUT_ERROR', details?: any) {
    super(message, 'timeout', code, details);
    this.name = 'TimeoutError';
  }
}

export function handleBackendError(error: any): BackendError {
  if (error instanceof BackendError) {
    return error;
  }

  const message = error?.message || 'An unexpected error occurred.';
  const code = error?.code || 'UNKNOWN';

  // Check if it looks like a network or supabase/fetch error
  if (message.includes('fetch') || message.includes('Network') || message.includes('Failed to fetch')) {
    return new NetworkError(message, code, error);
  }

  if (message.includes('timeout') || message.includes('Timeout')) {
    return new TimeoutError(message, code, error);
  }

  // Supabase/Postgrest errors typically have a code or hint
  if (error?.hint || error?.details || code.startsWith('P') || code.startsWith('2') || error?.status) {
    return new DatabaseError(message, code, error);
  }

  return new BackendError(message, 'unknown', code, error);
}

export function getFriendlyErrorMessage(error: any): string {
  const err = handleBackendError(error);
  switch (err.type) {
    case 'database':
      return `Database Error: ${err.message}`;
    case 'auth':
      return `Authentication Error: ${err.message}`;
    case 'network':
      return 'Network connection issues detected. Please verify your internet connection and try again.';
    case 'timeout':
      return 'The operation timed out. Please check your connection speed and retry.';
    default:
      return err.message;
  }
}
