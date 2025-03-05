interface BatchConfig {
  maxConcurrent: number;
  delayBetweenBatches: number;
  retryAttempts: number;
}

interface BatchResponse<T> {
  success: boolean;
  result?: T;
  error?: Error;
  retryCount?: number;
}

export class BatchProcessor {
  private config: BatchConfig;

  constructor(config: Partial<BatchConfig> = {}) {
    this.config = {
      maxConcurrent: 3,
      delayBetweenBatches: 1000,
      retryAttempts: 3,
      ...config,
    };
  }

  // Public accessors for config properties
  public getMaxConcurrent(): number {
    return this.config.maxConcurrent;
  }

  public getDelayBetweenBatches(): number {
    return this.config.delayBetweenBatches;
  }

  public getRetryAttempts(): number {
    return this.config.retryAttempts;
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async processWithRetry<T>(
    processor: () => Promise<T>,
    attempts: number = 0
  ): Promise<BatchResponse<T>> {
    try {
      const result = await processor();
      return { success: true, result };
    } catch (error) {
      if (attempts < this.config.retryAttempts) {
        await this.delay(Math.pow(2, attempts) * 1000); // Exponential backoff
        return this.processWithRetry(processor, attempts + 1);
      }
      return {
        success: false,
        error: error as Error,
        retryCount: attempts,
      };
    }
  }

  async processBatch<T, I>(
    items: I[],
    processor: (item: I) => Promise<T>
  ): Promise<BatchResponse<T>[]> {
    const results: BatchResponse<T>[] = new Array(items.length);

    // Process items in batches while maintaining order
    for (let i = 0; i < items.length; i += this.config.maxConcurrent) {
      const batch = items.slice(i, i + this.config.maxConcurrent);

      // Process each batch sequentially to maintain order
      for (let j = 0; j < batch.length; j++) {
        const index = i + j;
        results[index] = await this.processWithRetry(() => processor(batch[j]));
      }

      if (i + this.config.maxConcurrent < items.length) {
        await this.delay(this.config.delayBetweenBatches);
      }
    }

    return results;
  }
}
