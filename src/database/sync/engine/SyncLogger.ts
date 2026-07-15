import fs from 'fs';
import path from 'path';

const logFile = path.join(process.cwd(), 'sync-audit.log');

function writeLog(level: string, message: string, data?: any) {
  const line = `[${new Date().toISOString()}] [SyncEngine] ${level}: ${message} ${data ? JSON.stringify(data) : ''}\n`;
  console.log(line.trim());
  try {
    fs.appendFileSync(logFile, line);
  } catch (e) {}
}

export class SyncLogger {
  public static info(message: string, context?: any) {
    writeLog('INFO', message, context);
  }

  public static warn(message: string, context?: any) {
    writeLog('WARN', message, context);
  }

  public static error(message: string, error?: any) {
    writeLog('ERROR', message, error);
  }
}
