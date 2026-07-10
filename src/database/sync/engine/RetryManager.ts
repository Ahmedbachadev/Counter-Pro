export class RetryManager {
  private static readonly RETRY_DELAYS = [
    5 * 1000,        // 5 seconds
    15 * 1000,       // 15 seconds
    30 * 1000,       // 30 seconds
    60 * 1000,       // 1 minute
    5 * 60 * 1000    // 5 minutes
  ];

  private static readonly MAX_RETRIES = 5;

  /**
   * Determines if a failed queue item is eligible for retry based on its retry_count
   * and the time since it was created/last attempted.
   */
  public static shouldRetry(retryCount: number, lastAttemptAt: Date | string): boolean {
    if (retryCount >= this.MAX_RETRIES) return false;

    const delayMs = this.RETRY_DELAYS[retryCount] || this.RETRY_DELAYS[this.RETRY_DELAYS.length - 1];
    const lastAttemptMs = new Date(lastAttemptAt).getTime();
    
    return Date.now() - lastAttemptMs >= delayMs;
  }
}
