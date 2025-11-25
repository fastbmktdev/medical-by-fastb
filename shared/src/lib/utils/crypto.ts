import { randomBytes } from 'crypto';

/**
 * Generate a secure random token for unsubscribe links
 */
export async function generateUnsubscribeToken(): Promise<string> {
  return randomBytes(32).toString('hex');
}

/**
 * Verify unsubscribe token format
 */
export function isValidUnsubscribeToken(token: string): boolean {
  return /^[a-f0-9]{64}$/i.test(token);
}
