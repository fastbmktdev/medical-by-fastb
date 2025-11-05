/**
 * Affiliate Utility Functions
 * Helper functions for affiliate system operations
 */

import { createClient } from '@/lib/database/supabase/server';

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
export async function getAffiliateUserIdFromCode(
  referralCode: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    const codeSuffix = extractUserIdFromReferralCode(referralCode);

    if (!codeSuffix) {
      return null;
    }

    // Query users table to find user whose ID ends with the code suffix
    // Note: This requires admin access or we need to store referral codes in a table
    // For now, we'll use a different approach - validate the code format
    
    // Since we can't easily query auth.users, we'll need to:
    // 1. Store referral codes in profiles table, OR
    // 2. Use the affiliate_conversions table to find the affiliate_user_id
    
    // Alternative: Check if there's a conversion with this affiliate_code
    const { data: conversion } = await supabase
      .from('affiliate_conversions')
      .select('affiliate_user_id')
      .eq('affiliate_code', referralCode)
      .limit(1)
      .maybeSingle();

    if (conversion) {
      return conversion.affiliate_user_id;
    }

    // If not found in conversions, the code format is valid but we can't find the user
    // This means we need to store referral codes in profiles or use a lookup table
    return null;
  } catch (error) {
    console.error('Error getting affiliate user ID from code:', error);
    return null;
  }
}

/**
 * Validate referral code format
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

/**
 * Get affiliate user ID for a referred user
 * Finds the affiliate_user_id who referred this user (from signup conversion)
 */
export async function getAffiliateUserIdForReferredUser(
  referredUserId: string
): Promise<string | null> {
  try {
    const supabase = await createClient();
    
    // Find signup conversion where this user was referred
    const { data: signupConversion } = await supabase
      .from('affiliate_conversions')
      .select('affiliate_user_id, affiliate_code')
      .eq('referred_user_id', referredUserId)
      .eq('conversion_type', 'signup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (signupConversion) {
      return signupConversion.affiliate_user_id;
    }

    return null;
  } catch (error) {
    console.error('Error getting affiliate user ID for referred user:', error);
    return null;
  }
}

