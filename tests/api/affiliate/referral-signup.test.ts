import { NextRequest } from 'next/server';

const awardPointsMock = jest.fn();
const createClientMock = jest.fn();
const getCommissionRateMock = jest.fn().mockResolvedValue(0);
const calculateCommissionAmountMock = jest.fn().mockReturnValue(0);

jest.mock('@/services/gamification.service', () => ({
  awardPoints: awardPointsMock,
}));

jest.mock('@/lib/database/supabase/server', () => ({
  createClient: createClientMock,
}));

jest.mock('@/lib/constants/affiliate', () => ({
  getCommissionRate: getCommissionRateMock,
  calculateCommissionAmount: calculateCommissionAmountMock,
}));

type AuthUser = {
  id: string;
};

type SupabaseStubOptions = {
  authUser?: AuthUser | null;
  referrerProfile?: {
    user_id: string;
    full_name?: string | null;
    username?: string | null;
  } | null;
  existingConversion?: { id: string } | null;
  insertedConversion?: Record<string, unknown>;
  referrerLookupError?: Error | null;
};

type MaybeSingleResponse<T> = Promise<{
  data: T | null;
  error: unknown;
}>;

type ProfilesQueryStub = {
  select: jest.MockedFunction<(columns?: string) => ProfilesQueryStub>;
  ilike: jest.MockedFunction<(column: string, pattern: string) => ProfilesQueryStub>;
  limit: jest.MockedFunction<(count: number) => ProfilesQueryStub>;
  maybeSingle: jest.MockedFunction<() => MaybeSingleResponse<SupabaseStubOptions['referrerProfile']>>;
};

type AffiliateConversionQueryStub = {
  select: jest.MockedFunction<(columns?: string) => AffiliateConversionQueryStub>;
  eq: jest.MockedFunction<(column: string, value: unknown) => AffiliateConversionQueryStub>;
  maybeSingle: jest.MockedFunction<
    () => MaybeSingleResponse<SupabaseStubOptions['existingConversion']>
  >;
};

type AffiliateInsertSingleMock = jest.MockedFunction<
  () => Promise<{ data: Record<string, unknown>; error: null }>
>;
type AffiliateInsertSelectMock = jest.MockedFunction<() => { single: AffiliateInsertSingleMock }>;
type AffiliateInsertMock = jest.MockedFunction<
  (values: Record<string, unknown>) => { select: AffiliateInsertSelectMock }
>;

function createProfilesQueryStub(
  options: SupabaseStubOptions,
): ProfilesQueryStub {
  const query: ProfilesQueryStub = {
    select: jest.fn<ProfilesQueryStub, [string?]>(),
    ilike: jest.fn<ProfilesQueryStub, [string, string]>(),
    limit: jest.fn<ProfilesQueryStub, [number]>(),
    maybeSingle: jest.fn<MaybeSingleResponse<SupabaseStubOptions['referrerProfile']>, []>(),
  };

  query.select.mockReturnValue(query);
  query.ilike.mockReturnValue(query);
  query.limit.mockReturnValue(query);
  query.maybeSingle.mockImplementation(async () => ({
    data: options.referrerProfile ?? null,
    error: options.referrerLookupError ?? null,
  }));
  return query;
}

function createAffiliateConversionsQueryStub(
  options: SupabaseStubOptions,
): {
  queryBuilder: AffiliateConversionQueryStub;
  insert: AffiliateInsertMock;
  insertSelect: AffiliateInsertSelectMock;
  insertSingle: AffiliateInsertSingleMock;
} {
  const queryBuilder: AffiliateConversionQueryStub = {
    select: jest.fn<AffiliateConversionQueryStub, [string?]>(),
    eq: jest.fn<AffiliateConversionQueryStub, [string, unknown]>(),
    maybeSingle: jest.fn<MaybeSingleResponse<SupabaseStubOptions['existingConversion']>, []>(),
  };

  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.eq.mockReturnValue(queryBuilder);
  queryBuilder.maybeSingle.mockImplementation(async () => ({
    data: options.existingConversion ?? null,
    error: null,
  }));

  const insertSingle: AffiliateInsertSingleMock = jest
    .fn<Promise<{ data: Record<string, unknown>; error: null }>, []>()
    .mockResolvedValue({
      data: (options.insertedConversion ?? {
        id: 'conversion_123',
        status: 'confirmed',
      }) as Record<string, unknown>,
      error: null,
    });
  const insertSelect: AffiliateInsertSelectMock = jest.fn().mockReturnValue({
    single: insertSingle,
  });
  const insert: AffiliateInsertMock = jest.fn().mockReturnValue({
    select: insertSelect,
  });

  return {
    queryBuilder,
    insert,
    insertSelect,
    insertSingle,
  };
}

function createSupabaseStub(options: SupabaseStubOptions) {
  const profilesQuery = createProfilesQueryStub(options);
  const affiliateConversionsStub = createAffiliateConversionsQueryStub(options);

  return {
    auth: {
      getUser: jest.fn(async () => ({
        data: { user: options.authUser ?? null },
        error: null,
      })),
    },
    from: jest.fn((table: string) => {
      switch (table) {
        case 'profiles':
          return profilesQuery;
        case 'affiliate_conversions':
          return {
            ...affiliateConversionsStub.queryBuilder,
            insert: affiliateConversionsStub.insert,
          };
        default:
          throw new Error(`Unexpected table requested: ${table}`);
      }
    }),
    affiliateConversionsInsertMock: affiliateConversionsStub.insert,
    affiliateConversionsInsertSelectMock: affiliateConversionsStub.insertSelect,
    affiliateConversionsInsertSingleMock: affiliateConversionsStub.insertSingle,
    affiliateConversionsQuery: affiliateConversionsStub.queryBuilder,
  };
}

function createJsonRequest(body: Record<string, unknown>): NextRequest {
  const request = new Request('http://localhost/api/affiliate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return new NextRequest(request);
}

describe('POST /api/affiliate referral signup integration', () => {
  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    awardPointsMock.mockResolvedValue(undefined);
  });

  it('creates conversion and awards points for valid referral code', async () => {
    const referrerId = '11111111-1111-1111-1111-aaaaaaaa1234';
    const referralCode = `MT${referrerId.slice(-8).toUpperCase()}`;
    const referredUserId = '22222222-2222-2222-2222-bbbbbbbb5678';

    const supabaseStub = createSupabaseStub({
      authUser: { id: referredUserId },
      referrerProfile: {
        user_id: referrerId,
        full_name: 'Referrer User',
        username: 'referrer123',
      },
      insertedConversion: {
        id: 'new-conversion',
        status: 'confirmed',
      },
    });

    createClientMock.mockResolvedValue(supabaseStub);

    const { POST } = await import('../../../src/app/api/affiliate/route');

    const response = await POST(
      createJsonRequest({
        referralCode,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.referrer.id).toBe(referrerId);
    expect(supabaseStub.affiliateConversionsInsertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        affiliate_user_id: referrerId,
        referred_user_id: referredUserId,
        affiliate_code: referralCode,
        status: 'confirmed',
      }),
    );
    expect(awardPointsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: referrerId,
        points: expect.any(Number),
        reference_id: referredUserId,
      }),
    );
  });

  it('prevents awarding when user attempts to use their own code', async () => {
    const userId = '33333333-3333-3333-3333-cccccccc9012';
    const referralCode = `MT${userId.slice(-8).toUpperCase()}`;

    const supabaseStub = createSupabaseStub({
      authUser: { id: userId },
      referrerProfile: {
        user_id: userId,
        full_name: null,
        username: null,
      },
    });

    createClientMock.mockResolvedValue(supabaseStub);

    const { POST } = await import('../../../src/app/api/affiliate/route');

    const response = await POST(
      createJsonRequest({
        referralCode,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toMatch(/cannot use your own referral code/i);
    expect(supabaseStub.affiliateConversionsInsertMock).not.toHaveBeenCalled();
    expect(awardPointsMock).not.toHaveBeenCalled();
  });

  it('returns existing conversion when duplicate signup detected', async () => {
    const referrerId = '44444444-4444-4444-4444-dddddddd3456';
    const referralCode = `MT${referrerId.slice(-8).toUpperCase()}`;
    const referredUserId = '55555555-5555-5555-5555-eeeeeeee7890';

    const supabaseStub = createSupabaseStub({
      authUser: { id: referredUserId },
      referrerProfile: {
        user_id: referrerId,
        full_name: 'Existing Referrer',
        username: null,
      },
      existingConversion: { id: 'existing-conv' },
    });

    createClientMock.mockResolvedValue(supabaseStub);

    const { POST } = await import('../../../src/app/api/affiliate/route');

    const response = await POST(
      createJsonRequest({
        referralCode,
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.conversionId).toBe('existing-conv');
    expect(supabaseStub.affiliateConversionsInsertMock).not.toHaveBeenCalled();
    expect(awardPointsMock).not.toHaveBeenCalled();
  });
});

