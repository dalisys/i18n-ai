import { BatchProcessor } from "../utils/batch-processor";

describe("BatchProcessor", () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor({
      maxConcurrent: 2,
      delayBetweenBatches: 100,
      retryAttempts: 2,
    });
  });

  it("should process items in batches", async () => {
    const items = [1, 2, 3, 4, 5];
    const mockProcessor = jest
      .fn()
      .mockImplementation(async (item: number) => item * 2);

    const results = await processor.processBatch(items, mockProcessor);

    expect(results).toHaveLength(5);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map((r) => r.result)).toEqual([2, 4, 6, 8, 10]);
    expect(mockProcessor).toHaveBeenCalledTimes(5);
  });

  it("should retry failed items", async () => {
    const items = [1, 2, 3];
    const mockProcessor = jest
      .fn()
      .mockRejectedValueOnce(new Error("First try failed"))
      .mockResolvedValueOnce(2)
      .mockRejectedValueOnce(new Error("First try failed"))
      .mockResolvedValueOnce(4)
      .mockRejectedValueOnce(new Error("First try failed"))
      .mockResolvedValueOnce(6);

    const results = await processor.processBatch(items, mockProcessor);

    expect(results).toHaveLength(3);
    expect(results.every((r) => r.success)).toBe(true);
    expect(results.map((r) => r.result)).toEqual([2, 4, 6]);
    expect(mockProcessor).toHaveBeenCalledTimes(6); // 3 failures + 3 successes
  });

  it("should handle permanent failures after retries", async () => {
    const items = [1];
    const mockProcessor = jest
      .fn()
      .mockRejectedValue(new Error("Permanent failure"));

    const results = await processor.processBatch(items, mockProcessor);

    expect(results).toHaveLength(1);
    expect(results[0].success).toBe(false);
    expect(results[0].error).toBeDefined();
    expect(mockProcessor).toHaveBeenCalledTimes(3); // Initial try + 2 retries
  });

  it("should respect maxConcurrent limit", async () => {
    const items = [1, 2, 3, 4];
    let concurrentCalls = 0;
    let maxConcurrentCalls = 0;

    const mockProcessor = jest.fn().mockImplementation(async (item: number) => {
      concurrentCalls++;
      maxConcurrentCalls = Math.max(maxConcurrentCalls, concurrentCalls);
      await new Promise((resolve) => setTimeout(resolve, 50));
      concurrentCalls--;
      return item * 2;
    });

    await processor.processBatch(items, mockProcessor);

    expect(maxConcurrentCalls).toBeLessThanOrEqual(2); // maxConcurrent is 2
    expect(mockProcessor).toHaveBeenCalledTimes(4);
  });

  it("should handle empty input array", async () => {
    const mockProcessor = jest.fn();
    const results = await processor.processBatch([], mockProcessor);

    expect(results).toHaveLength(0);
    expect(mockProcessor).not.toHaveBeenCalled();
  });

  it("should apply delay between batches", async () => {
    const items = [1, 2, 3, 4];
    const startTime = Date.now();

    await processor.processBatch(items, async (item: number) => item * 2);

    const duration = Date.now() - startTime;
    // With 2 items per batch and 100ms delay, we expect at least 100ms total duration
    expect(duration).toBeGreaterThanOrEqual(100);
  });
});
