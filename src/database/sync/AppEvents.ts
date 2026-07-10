import { EventEmitter } from 'events';

class AppEventEmitter extends EventEmitter {
  /**
   * Broadcasts an event to all open Electron windows
   */
  public broadcastToRenderers(eventName: string, ...args: any[]): void {
    // We can require electron dynamically so this file can be tested without Electron if needed
    try {
      const { BrowserWindow } = require('electron');
      if (BrowserWindow) {
        BrowserWindow.getAllWindows().forEach((win: any) => {
          if (!win.isDestroyed()) {
            win.webContents.send('app-event', eventName, ...args);
          }
        });
      }
    } catch (e) {
      // Ignored if not running in electron
    }
  }
}

export const AppEvents = new AppEventEmitter();
