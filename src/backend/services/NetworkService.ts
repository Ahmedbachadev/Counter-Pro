type NetworkStatus = 'online' | 'offline';
type NetworkListener = (status: NetworkStatus) => void;

class NetworkService {
  private status: NetworkStatus;
  private listeners: Set<NetworkListener> = new Set();

  constructor() {
    this.status = navigator.onLine ? 'online' : 'offline';
    
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
    
    // Also broadcast to the main process if it wants to know
    this.notifyMainProcess(this.status);
  }

  private handleOnline = () => {
    this.status = 'online';
    this.broadcast();
    this.notifyMainProcess(this.status);
  };

  private handleOffline = () => {
    this.status = 'offline';
    this.broadcast();
    this.notifyMainProcess(this.status);
  };

  private notifyMainProcess(status: NetworkStatus) {
    if (window.electronAPI && window.electronAPI.networkStatusChange) {
      window.electronAPI.networkStatusChange(status);
    }
  }

  private broadcast() {
    this.listeners.forEach(listener => listener(this.status));
  }

  public isOnline(): boolean {
    return this.status === 'online';
  }

  public isOffline(): boolean {
    return this.status === 'offline';
  }

  public get currentStatus(): NetworkStatus {
    return this.status;
  }

  public subscribe(listener: NetworkListener): () => void {
    this.listeners.add(listener);
    // Immediately notify the new listener of the current status
    listener(this.status);
    return () => this.unsubscribe(listener);
  }

  public unsubscribe(listener: NetworkListener): void {
    this.listeners.delete(listener);
  }
}

export const networkService = new NetworkService();
export default networkService;
