import { getServiceClient } from './service-utils';
import { awardPoints } from './gamification.service';
import type { SupabaseClient } from '@supabase/supabase-js';

export const REFERRAL_BOOKING_POINTS = {
  referrer: 250,
  referred: 125,
} as const;

const REFERRAL_REFERENCE_TYPES = {
  referrer: 'booking_referral_referrer',
  referrerReversal: 'booking_referral_referrer_reversal',
  referred: 'booking_referral_referred',
  referredReversal: 'booking_referral_referred_reversal',
} as const;

type ReferralReferenceType =
  | typeof REFERRAL_REFERENCE_TYPES.referrer
  | typeof REFERRAL_REFERENCE_TYPES.referrerReversal
  | typeof REFERRAL_REFERENCE_TYPES.referred
  | typeof REFERRAL_REFERENCE_TYPES.referredReversal;

interface ReferralBookingAwardOptions {
  bookingId: string;
  supabase?: SupabaseClient;
}

interface ReferralBookingRevokeOptions {
  bookingId: string;
  supabase?: SupabaseClient;
}

type PointsHistoryEntry = {
  id: string;
  user_id: string;
  points: number;
  action_type: string;
  reference_id: string;
  reference_type: string;
};

async function ensurePointsAwarded(
  supabase: SupabaseClient,
  options: {
    userId: string | null | undefined;
    bookingId: string;
    bookingNumber: string;
    referenceType: ReferralReferenceType;
    points: number;
    actionType: string;
    description: string;
  }
) {
  const { userId, bookingId, referenceType, points, actionType, description } = options;

  if (!userId || !points) {
    return false;
  }

  const { data: existingEntry } = await supabase
    .from('points_history')
    .select('id')
    .eq('user_id', userId)
    .eq('reference_id', bookingId)
    .eq('reference_type', referenceType)
    .maybeSingle();

  if (existingEntry) {
    return false;
  }

  await awardPoints({
    user_id: userId,
    points,
    action_type: actionType,
    action_description: description,
    reference_id: bookingId,
    reference_type: referenceType,
  });

  return true;
}

async function ensurePointsReversed(
  supabase: SupabaseClient,
  options: {
    entry: PointsHistoryEntry;
    reversalReferenceType: ReferralReferenceType;
    description: string;
  }
) {
  const { entry, reversalReferenceType, description } = options;

  if (!entry?.user_id || !entry?.reference_id || !entry?.points) {
    return false;
  }

  const { data: existingReversal } = await supabase
    .from('points_history')
    .select('id')
    .eq('user_id', entry.user_id)
    .eq('reference_id', entry.reference_id)
    .eq('reference_type', reversalReferenceType)
    .maybeSingle();

  if (existingReversal) {
    return false;
  }

  await awardPoints({
    user_id: entry.user_id,
    points: -Math.abs(entry.points),
    action_type: entry.action_type,
    action_description: description,
    reference_id: entry.reference_id,
    reference_type: reversalReferenceType,
  });

  return true;
}

export async function awardReferralBookingPoints(options: ReferralBookingAwardOptions): Promise<void> {
  const supabase = options.supabase ?? (await getServiceClient());
  const nowIso = new Date().toISOString();
  
  // Execute queries in parallel for better performance
  const [conversionResult, appointmentResult] = await Promise.all([
    supabase
      .from('affiliate_conversions')
      .select('id, affiliate_user_id, referred_user_id, status, metadata')
      .eq('reference_id', options.bookingId)
      .eq('reference_type', 'appointment')
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('id, user_id, price_paid, booking_number')
      .eq('id', options.bookingId)
      .maybeSingle(),
  ]);
  const conversion = conversionResult.data;
  const appointment = appointmentResult.data;

  if (!conversion?.affiliate_user_id || !appointment) {
    return;
  }

  const bookingNumber = appointment.booking_number || appointment.id.slice(0, 8).toUpperCase();

  const referrerAwarded = await ensurePointsAwarded(supabase, {
    userId: conversion.affiliate_user_id,
    bookingId: appointment.id,
    bookingNumber,
    referenceType: REFERRAL_REFERENCE_TYPES.referrer,
    points: REFERRAL_BOOKING_POINTS.referrer,
    actionType: 'referral',
    description: `ได้รับแต้มจากการจองของเพื่อน #${bookingNumber}`,
  });

  let referredAwarded = false;

  if (conversion.referred_user_id) {
    referredAwarded = await ensurePointsAwarded(supabase, {
      userId: conversion.referred_user_id,
      bookingId: appointment.id,
      bookingNumber,
      referenceType: REFERRAL_REFERENCE_TYPES.referred,
      points: REFERRAL_BOOKING_POINTS.referred,
      actionType: 'referral',
      description: `ได้รับโบนัสจากการใช้รหัสแนะนำเพื่อน #${bookingNumber}`,
    });
  }

  if (referrerAwarded || referredAwarded) {
    await supabase
      .from('affiliate_conversions')
      .update({
        metadata: {
          ...(conversion.metadata as Record<string, unknown> | null ?? {}),
          referral_points_awarded_at: nowIso,
        },
        updated_at: nowIso,
      })
      .eq('id', conversion.id);
  }
}

export async function revokeReferralBookingPoints(options: ReferralBookingRevokeOptions): Promise<void> {
  const supabase = options.supabase ?? (await getServiceClient());
  const nowIso = new Date().toISOString();
  
  // Execute queries in parallel for better performance
  const [conversionResult, appointmentResult] = await Promise.all([
    supabase
      .from('affiliate_conversions')
      .select('id, metadata, status')
      .eq('reference_id', options.bookingId)
      .eq('reference_type', 'appointment')
      .maybeSingle(),
    supabase
      .from('appointments')
      .select('id, booking_number')
      .eq('id', options.bookingId)
      .maybeSingle(),
  ]);
  const conversion = conversionResult.data;
  const appointment = appointmentResult.data;

  const bookingNumber = appointment?.booking_number || options.bookingId.slice(0, 8).toUpperCase();

  const reversalTargets: Array<{
    referenceType: ReferralReferenceType;
    reversalType: ReferralReferenceType;
    description: string;
  }> = [
    {
      referenceType: REFERRAL_REFERENCE_TYPES.referrer,
      reversalType: REFERRAL_REFERENCE_TYPES.referrerReversal,
      description: `ปรับแต้มหลังยกเลิกการจองของเพื่อน #${bookingNumber}`,
    },
    {
      referenceType: REFERRAL_REFERENCE_TYPES.referred,
      reversalType: REFERRAL_REFERENCE_TYPES.referredReversal,
      description: `ปรับแต้มโบนัสหลังยกเลิกการจอง #${bookingNumber}`,
    },
  ];

  // Fetch all entries for both reversal types in parallel
  const entriesPromises = reversalTargets.map(target =>
    supabase
      .from('points_history')
      .select('id, user_id, points, action_type, reference_id, reference_type')
      .eq('reference_id', options.bookingId)
      .eq('reference_type', target.referenceType)
      .then((result: { data: PointsHistoryEntry[] | null; error: unknown }) => ({ target, entries: result.data || [] }))
  );

  const entriesResults = await Promise.all(entriesPromises);

  // Process reversals in parallel where possible
  const reversalPromises: Promise<boolean>[] = [];
  for (const { target, entries } of entriesResults) {
    if (!entries.length) {
      continue;
    }

    for (const entry of entries) {
      reversalPromises.push(
        ensurePointsReversed(supabase, {
          entry,
          reversalReferenceType: target.reversalType,
          description: target.description,
        })
      );
    }
  }

  // Wait for all reversals to complete
  await Promise.all(reversalPromises);

  if (conversion?.id && conversion.status !== 'refunded') {
    await supabase
      .from('affiliate_conversions')
      .update({
        status: 'refunded',
        updated_at: nowIso,
        metadata: {
          ...(conversion.metadata as Record<string, unknown> | null ?? {}),
          referral_points_revoked_at: nowIso,
        },
      })
      .eq('id', conversion.id);
  }
}