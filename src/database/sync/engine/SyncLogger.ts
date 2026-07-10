export class SyncLogger {
  public static info(message: string, context?: any) {
    console.log(`[SyncEngine] INFO: ${message}`, context ? JSON.stringify(context) : '');
  }

  public static warn(message: string, context?: any) {
    console.warn(`[SyncEngine] WARN: ${message}`, context ? JSON.stringify(context) : '');
  }

  public static error(message: string, error?: any) {
    console.error(`[SyncEngine] ERROR: ${message}`, error);
  }
}
