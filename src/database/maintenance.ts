import Database from 'better-sqlite3';

export class DatabaseMaintenance {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Run PRAGMA optimize.
   * This is very fast and should be run periodically (e.g. daily)
   * or right before closing the database connection.
   * It analyzes tables that have been modified significantly since the last ANALYZE.
   */
  public optimize(): void {
    try {
      console.log('[DatabaseMaintenance] Running PRAGMA optimize...');
      this.db.pragma('optimize');
      console.log('[DatabaseMaintenance] Optimization complete.');
    } catch (err) {
      console.error('[DatabaseMaintenance] Optimize failed:', err);
    }
  }

  /**
   * Run a full VACUUM.
   * This rebuilds the entire database file, reclaiming unused space
   * and defragmenting it.
   * This can be slow for very large DBs, so run it in background
   * or during low-traffic periods (e.g. weekly).
   */
  public vacuum(): void {
    try {
      console.log('[DatabaseMaintenance] Running VACUUM...');
      this.db.exec('VACUUM');
      console.log('[DatabaseMaintenance] VACUUM complete.');
    } catch (err) {
      console.error('[DatabaseMaintenance] VACUUM failed:', err);
    }
  }

  /**
   * Run ANALYZE.
   * Gathers statistics about tables and indices, storing them in sqlite_stat1.
   * This helps the query planner make better decisions.
   */
  public analyze(): void {
    try {
      console.log('[DatabaseMaintenance] Running ANALYZE...');
      this.db.exec('ANALYZE');
      console.log('[DatabaseMaintenance] ANALYZE complete.');
    } catch (err) {
      console.error('[DatabaseMaintenance] ANALYZE failed:', err);
    }
  }
}
