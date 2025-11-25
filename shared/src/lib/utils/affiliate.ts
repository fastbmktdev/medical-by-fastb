/**
 * Affiliate Utility Functions
 * Helper functions for affiliate system operations
 */

/**
 * Extract user ID from referral code
 * Referral code format: MT{LAST_8_CHARS_OF_UUID}
 * Example: MT12345678
 */
export function extractUserIdFromReferralCode(referralCode: string): string | null {
  if (!referralCode || !referralCode.startsWith('MT')) {
    return null;
  }

  // Referral code format: MT{LAST_8_CHARS}
  // We need to find the user whose ID ends with these 8 characters
  const codeSuffix = referralCode.slice(2).toUpperCase();
  
  if (codeSuffix.length !== 8) {
    return null;
  }

  return codeSuffix;
}

/**
 * Find affiliate user ID from referral code
 * Returns the user ID if found, null otherwise
 */
export function isValidReferralCodeFormat(referralCode: string): boolean {
  if (!referralCode || typeof referralCode !== 'string') {
    return false;
  }

  // Format: MT{8 uppercase alphanumeric characters}
  const pattern = /^MT[A-Z0-9]{8}$/;
  return pattern.test(referralCode);
}

/**
 * Generate referral code from user ID
 */
export function generateReferralCode(userId: string): string {
  if (!userId || userId.length < 8) {
    throw new Error('Invalid user ID');
  }

  const suffix = userId.slice(-8).toUpperCase();
  return `MT${suffix}`;
}
