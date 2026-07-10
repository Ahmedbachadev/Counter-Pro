import Database from 'better-sqlite3';
import { BaseRecord, DatabaseError } from '../types';
import { generateUUID, now, buildQuerySuffix, QueryOptions } from '../utils/dbUtils';

export class BaseRepository<T extends BaseRecord> {
  protected db: Database.Database;
  protected tableName: string;

  constructor(db: Database.Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  protected handleError(err: any): never {
    if (err instanceof DatabaseError) throw err;
    throw new DatabaseError(`Database operation failed in ${this.tableName}`, err?.code, err);
  }

  public findById(id: string): T | undefined {
    try {
      const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL`);
      return stmt.get(id) as T | undefined;
    } catch (err) {
      this.handleError(err);
    }
  }

  public findAll(options?: QueryOptions): T[] {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;
      query += buildQuerySuffix(options);
      const stmt = this.db.prepare(query);
      return stmt.all() as T[];
    } catch (err) {
      this.handleError(err);
    }
  }

  private getQueue() {
    const { dbManager } = require('../index');
    return dbManager.queue;
  }

  public create(data: Partial<T> & { workspace_id: string }): T {
    try {
      const timestamp = now();
      const record = {
        id: generateUUID(),
        sync_status: 'pending',
        version: 1,
        created_at: timestamp,
        updated_at: timestamp,
        deleted_at: null,
        last_synced_at: null,
        device_id: 'LOCAL',
        ...data
      };

      const keys = Object.keys(record);
      const values = keys.map(k => (record as any)[k]);
      const placeholders = keys.map(() => '?').join(', ');

      const stmt = this.db.prepare(`
        INSERT INTO ${this.tableName} (${keys.join(', ')})
        VALUES (${placeholders})
      `);

      stmt.run(values);

      // Enqueue Sync Operation
      if (this.getQueue() && record.workspace_id) {
        this.getQueue().enqueue(record.workspace_id, this.tableName, record.id, 'CREATE', record);
      }

      return record as unknown as T;
    } catch (err) {
      this.handleError(err);
    }
  }

  public update(id: string, updates: Partial<T>): T | undefined {
    try {
      const existing = this.findById(id);
      if (!existing) return undefined;

      const updatedRecord = {
        ...existing,
        ...updates,
        updated_at: now(),
        version: existing.version + 1,
        sync_status: 'pending'
      };

      const keys = Object.keys(updatedRecord);
      const values = keys.map(k => (updatedRecord as any)[k]);
      const setClause = keys.map(k => `${k} = ?`).join(', ');

      const stmt = this.db.prepare(`
        UPDATE ${this.tableName}
        SET ${setClause}
        WHERE id = ?
      `);

      stmt.run([...values, id]);

      if (this.getQueue() && updatedRecord.workspace_id) {
        this.getQueue().enqueue(updatedRecord.workspace_id, this.tableName, id, 'UPDATE', updatedRecord);
      }

      return updatedRecord as unknown as T;
    } catch (err) {
      this.handleError(err);
    }
  }

  public delete(id: string, hardDelete: boolean = false): boolean {
    try {
      const existing = this.findById(id);
      if (!existing) return false;

      if (hardDelete) {
        const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
        const result = stmt.run(id);
        
        if (result.changes > 0 && this.getQueue() && existing.workspace_id) {
          this.getQueue().enqueue(existing.workspace_id, this.tableName, id, 'DELETE', existing);
        }
        return result.changes > 0;
      } else {
        const stmt = this.db.prepare(`
          UPDATE ${this.tableName}
          SET deleted_at = ?, sync_status = 'pending', version = version + 1
          WHERE id = ? AND deleted_at IS NULL
        `);
        const result = stmt.run(now(), id);
        
        if (result.changes > 0 && this.getQueue() && existing.workspace_id) {
          this.getQueue().enqueue(existing.workspace_id, this.tableName, id, 'DELETE', existing);
        }
        return result.changes > 0;
      }
    } catch (err) {
      this.handleError(err);
    }
  }

  public softDelete(id: string): boolean {
    return this.delete(id, false);
  }

  public count(options?: { where?: Record<string, any> }): number {
    try {
      let query = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE deleted_at IS NULL`;
      const values: any[] = [];

      if (options?.where) {
        for (const [key, value] of Object.entries(options.where)) {
          query += ` AND ${key} = ?`;
          values.push(value);
        }
      }

      const stmt = this.db.prepare(query);
      const result = stmt.get(values) as { count: number };
      return result.count;
    } catch (err) {
      this.handleError(err);
    }
  }

  public exists(id: string): boolean {
    try {
      const stmt = this.db.prepare(`SELECT 1 FROM ${this.tableName} WHERE id = ? AND deleted_at IS NULL LIMIT 1`);
      return !!stmt.get(id);
    } catch (err) {
      this.handleError(err);
    }
  }

  public filter(conditions: Record<string, any>, options?: QueryOptions): T[] {
    try {
      let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL`;
      const values: any[] = [];

      for (const [key, value] of Object.entries(conditions)) {
        if (value === null) {
          query += ` AND ${key} IS NULL`;
        } else {
          query += ` AND ${key} = ?`;
          values.push(value);
        }
      }

      query += buildQuerySuffix(options);
      const stmt = this.db.prepare(query);
      return stmt.all(values) as T[];
    } catch (err) {
      this.handleError(err);
    }
  }

  public search(queryStr: string, fields: string[], options?: QueryOptions): T[] {
    try {
      if (!queryStr || fields.length === 0) return this.findAll(options);
      
      let query = `SELECT * FROM ${this.tableName} WHERE deleted_at IS NULL AND (`;
      const values: any[] = [];
      const conditions: string[] = [];

      for (const field of fields) {
        conditions.push(`${field} LIKE ?`);
        values.push(`%${queryStr}%`);
      }

      query += conditions.join(' OR ') + ')';
      query += buildQuerySuffix(options);
      const stmt = this.db.prepare(query);
      return stmt.all(values) as T[];
    } catch (err) {
      this.handleError(err);
    }
  }

  public paginate(page: number, limit: number, options?: Omit<QueryOptions, 'limit' | 'offset'>): { data: T[], total: number, page: number, totalPages: number } {
    try {
      const offset = (Math.max(1, page) - 1) * limit;
      const data = this.findAll({ ...options, limit, offset });
      const total = this.count();
      const totalPages = Math.ceil(total / limit);
      
      return { data, total, page: Math.max(1, page), totalPages };
    } catch (err) {
      this.handleError(err);
    }
  }

  public bulkInsert(records: (Partial<T> & { workspace_id: string })[]): T[] {
    try {
      if (records.length === 0) return [];
      
      const results: T[] = [];
      const transaction = this.db.transaction((items) => {
        for (const item of items) {
          results.push(this.create(item));
        }
      });
      transaction(records);
      return results;
    } catch (err) {
      this.handleError(err);
    }
  }

  public bulkUpdate(updates: { id: string, data: Partial<T> }[]): T[] {
    try {
      if (updates.length === 0) return [];

      const results: T[] = [];
      const transaction = this.db.transaction((items) => {
        for (const item of items) {
          const updated = this.update(item.id, item.data);
          if (updated) results.push(updated);
        }
      });
      transaction(updates);
      return results;
    } catch (err) {
      this.handleError(err);
    }
  }

  public bulkDelete(ids: string[], hardDelete: boolean = false): boolean {
    try {
      if (ids.length === 0) return true;

      let successCount = 0;
      const transaction = this.db.transaction((idList) => {
        for (const id of idList) {
          if (this.delete(id, hardDelete)) successCount++;
        }
      });
      transaction(ids);
      return successCount === ids.length;
    } catch (err) {
      this.handleError(err);
    }
  }
}
