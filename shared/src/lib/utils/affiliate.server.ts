import { createServerClient } from "@shared/lib/database/supabase/server";
import { extractUserIdFromReferralCode } from "./affiliate";

async function getServerSupabaseClient() {
  return createServerClient();
}

export async function getAffiliateUserIdFromCode(
  referralCode: string
): Promise<string | null> {
  try {
    const supabase = await getServerSupabaseClient();
    const codeSuffix = extractUserIdFromReferralCode(referralCode);

    if (!codeSuffix) {
      return null;
    }

    const { data: conversion } = await supabase
      .from("affiliate_conversions")
      .select("affiliate_user_id")
      .eq("affiliate_code", referralCode)
      .limit(1)
      .maybeSingle();

    if (conversion) {
      return conversion.affiliate_user_id;
    }

    return null;
  } catch (error) {
    console.error("Error getting affiliate user ID from code:", error);
    return null;
  }
}

export async function getAffiliateUserIdForReferredUser(
  referredUserId: string
): Promise<string | null> {
  try {
    const supabase = await getServerSupabaseClient();

    const { data: signupConversion } = await supabase
      .from("affiliate_conversions")
      .select("affiliate_user_id, affiliate_code")
      .eq("referred_user_id", referredUserId)
      .eq("conversion_type", "signup")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (signupConversion) {
      return signupConversion.affiliate_user_id;
    }

    return null;
  } catch (error) {
    console.error(
      "Error getting affiliate user ID for referred user:",
      error
    );
    return null;
  }
}

