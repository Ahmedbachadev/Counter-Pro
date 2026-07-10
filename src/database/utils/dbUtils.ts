import crypto from 'crypto';

/**
 * Generates a standard UUID v4
 */
export function generateUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback if randomUUID is not available in the environment
  const bytes = crypto.randomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  return bytes.toString('hex').match(/(.{8})(.{4})(.{4})(.{4})(.{12})/)!.slice(1).join('-');
}

/**
 * Returns current ISO 8601 timestamp
 */
export function now(): string {
  return new Date().toISOString();
}

/**
 * Utility to extract pagination/sorting from options
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

export function buildQuerySuffix(options?: QueryOptions): string {
  if (!options) return '';
  let sql = '';
  if (options.orderBy) {
    const dir = options.orderDir === 'DESC' ? 'DESC' : 'ASC';
    // Prevent basic injection by removing spaces
    const safeOrder = options.orderBy.replace(/[^a-zA-Z0-9_]/g, '');
    sql += ` ORDER BY ${safeOrder} ${dir}`;
  }
  if (options.limit !== undefined) {
    sql += ` LIMIT ${Number(options.limit)}`;
    if (options.offset !== undefined) {
      sql += ` OFFSET ${Number(options.offset)}`;
    }
  }
  return sql;
}
