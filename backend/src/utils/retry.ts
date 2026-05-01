import { logger } from "./logger";

/**
 * Retry with exponential backoff.
 * Handles transient DB / network failures (MongoDB, PostgreSQL, Redis).
 *
 * @param fn          Async function to attempt
 * @param maxAttempts Maximum number of tries (default 3)
 * @param baseDelayMs Base delay in ms — doubles each retry (default 200ms)
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelayMs = 200
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const delay = baseDelayMs * Math.pow(2, attempt - 1); // 200, 400, 800 ms
      logger.warn(
        `[RETRY] Attempt ${attempt}/${maxAttempts} failed. Retrying in ${delay}ms...`,
        { error: (err as Error).message }
      );
      if (attempt < maxAttempts) {
        await sleep(delay);
      }
    }
  }

  logger.error(`[RETRY] All ${maxAttempts} attempts failed.`, {
    error: (lastError as Error).message,
  });
  throw lastError;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
