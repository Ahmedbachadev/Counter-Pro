/**
 * Utility to map snake_case to camelCase
 */
export function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/([-_][a-z])/g, group =>
        group.toUpperCase().replace('-', '').replace('_', '')
      );
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Utility to map camelCase to snake_case
 */
export function toSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(v => toSnakeCase(v));
  } else if (obj !== null && obj !== undefined && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
      result[snakeKey] = toSnakeCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

export class FrontendBaseRepository<T> {
  protected repoName: string;

  constructor(repoName: string) {
    this.repoName = repoName;
  }

  protected async call(method: string, ...args: any[]): Promise<any> {
    const response = await window.electronAPI.repoCall(this.repoName, method, ...args);
    if (!response.success) {
      throw new Error(`[${this.repoName}.${method}] Database error: ${response.error}`);
    }
    return toCamelCase(response.data);
  }

  public async findById(id: string | number): Promise<T | undefined> {
    return this.call('findById', id);
  }

  public async findAll(options?: any): Promise<T[]> {
    return this.call('findAll', options);
  }

  public async create(data: Partial<T>): Promise<T> {
    const snakeData = toSnakeCase(data);
    return this.call('create', snakeData);
  }

  public async update(id: string | number, data: Partial<T>): Promise<T | undefined> {
    const snakeData = toSnakeCase(data);
    return this.call('update', id, snakeData);
  }

  public async delete(id: string | number, hardDelete: boolean = false): Promise<boolean> {
    return this.call('delete', id, hardDelete);
  }

  public async softDelete(id: string | number): Promise<boolean> {
    return this.call('softDelete', id);
  }

  public async search(queryStr: string, fields: string[], options?: any): Promise<T[]> {
    const snakeFields = fields.map(f => f.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`));
    return this.call('search', queryStr, snakeFields, options);
  }

  public async filter(conditions: Record<string, any>, options?: any): Promise<T[]> {
    const snakeConditions = toSnakeCase(conditions);
    return this.call('filter', snakeConditions, options);
  }

  public async paginate(page: number, limit: number, options?: any): Promise<{ data: T[], total: number, page: number, totalPages: number }> {
    return this.call('paginate', page, limit, options);
  }

  public async count(options?: { where?: Record<string, any> }): Promise<number> {
    const snakeOptions = toSnakeCase(options);
    return this.call('count', snakeOptions);
  }

  public async exists(id: string | number): Promise<boolean> {
    return this.call('exists', id);
  }

  public async bulkInsert(records: Partial<T>[]): Promise<T[]> {
    return this.call('bulkInsert', toSnakeCase(records));
  }

  public async bulkUpdate(updates: { id: string | number, data: Partial<T> }[]): Promise<T[]> {
    return this.call('bulkUpdate', toSnakeCase(updates));
  }

  public async bulkDelete(ids: (string | number)[], hardDelete: boolean = false): Promise<boolean> {
    return this.call('bulkDelete', ids, hardDelete);
  }
}
