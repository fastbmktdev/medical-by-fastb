/**
 * Simulate network delay for more realistic mock responses
 */

/**
 * Delay execution by a random amount between min and max milliseconds
 */
export async function delay(min: number = 100, max: number = 500): Promise<void> {
  const delayMs = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Delay execution by a fixed amount of milliseconds
 */
export async function fixedDelay(ms: number = 200): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

