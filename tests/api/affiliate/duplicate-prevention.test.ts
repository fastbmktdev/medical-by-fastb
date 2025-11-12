import { beforeAll, beforeEach, describe, expect, it, jest } from '@jest/globals';
import type { NextRequest } from 'next/server';

type CreateSupabaseStubOptions = {
  userId: string;
  existingConversions?: Array<Record<string, unknown> | null>;
  insertedConversion?: Record<string, unknown>;
  referrerProfile?: {
    user_id: string;
    full_name?: string | null;
    username?: string | null;
  } | null;
};

type SupabaseAuthResponse = {
  data: { user: { id: string } } | null;
  error: null;
};

type SupabaseConversionResponse = {
  data: Record<string, unknown> | null;
  error: null;
};

type InsertSingleMock = jest.MockedFunction<() => Promise<SupabaseConversionResponse>>;
type InsertSelectMock = jest.MockedFunction<() => { single: InsertSingleMock }>;
type InsertMock = jest.MockedFunction<
  (values: Record<string, unknown>) => { select: InsertSelectMock }
>;

type QueryBuilderMock = {
  select: jest.MockedFunction<(columns?: string) => QueryBuilderMock>;
  eq: jest.MockedFunction<(column: string, value: unknown) => QueryBuilderMock>;
  maybeSingle: jest.MockedFunction<() => Promise<SupabaseConversionResponse>>;
  insert: InsertMock;
};

type ProfilesQueryMock = {
  select: jest.MockedFunction<(columns?: string) => ProfilesQueryMock>;
  ilike: jest.MockedFunction<(column: string, pattern: string) => ProfilesQueryMock>;
  limit: jest.MockedFunction<(count: number) => ProfilesQueryMock>;
  maybeSingle: jest.MockedFunction<
    () => Promise<{
      data:
        | {
            user_id: string;
            full_name?: string | null;
            username?: string | null;
          }
        | null;
      error: null;
    }>
  >;
};

type SupabaseRpcResponse = {
  data: unknown;
  error: null;
};

type SupabaseClientStub = {
  auth: {
    getUser: jest.MockedFunction<() => Promise<SupabaseAuthResponse>>;
  };
  from: jest.MockedFunction<(table: string) => QueryBuilderMock | ProfilesQueryMock>;
  rpc: jest.MockedFunction<
    (fn: string, params: Record<string, unknown>) => Promise<SupabaseRpcResponse>
  >;
  queryBuilder: QueryBuilderMock;
  profilesQuery: ProfilesQueryMock;
  insertMock: InsertMock;
  insertSelectMock: InsertSelectMock;
  insertSingleMock: InsertSingleMock;
};

const createClientMock = jest.fn<() => Promise<SupabaseClientStub>>();
const getCommissionRateMock = jest.fn<() => Promise<number>>();
const calculateCommissionAmountMock =
  jest.fn<(value: number | string, rate: number | string) => number>();
const awardPointsMock = jest.fn<(...args: unknown[]) => Promise<void>>();

jest.mock('@/lib/database/supabase/server', () => ({
  createClient: createClientMock,
}));

jest.mock('@/lib/constants/affiliate', () => ({
  getCommissionRate: getCommissionRateMock,
  calculateCommissionAmount: calculateCommissionAmountMock,
}));

jest.mock('@/services/gamification.service', () => ({
  awardPoints: awardPointsMock,
}));

let affiliatePost: (request: NextRequest | Request) => Promise<Response>;
let affiliateConversionsPost: (request: NextRequest | Request) => Promise<Response>;

function createJsonRequest(
  url: string,
  method: 'POST' | 'PUT',
  body: Record<string, unknown>,
): NextRequest | Request {
  return new Request(`http://localhost${url}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function createSupabaseStub(options: CreateSupabaseStubOptions): SupabaseClientStub {
  const {
    userId,
    existingConversions = [null],
    insertedConversion = { id: 'new-conversion' },
    referrerProfile = {
      user_id: userId,
      full_name: 'Affiliate User',
      username: 'affiliate-user',
    },
  } = options;

  const maybeSingleMock: QueryBuilderMock['maybeSingle'] =
    jest.fn<() => Promise<SupabaseConversionResponse>>();
  if (existingConversions.length === 0) {
    maybeSingleMock.mockResolvedValue({ data: null, error: null });
  } else {
    existingConversions.forEach((entry) => {
      maybeSingleMock.mockResolvedValueOnce({ data: entry, error: null });
    });
  }

  const insertSingleMock: InsertSingleMock = jest
    .fn<() => Promise<SupabaseConversionResponse>>()
    .mockResolvedValue({
      data: insertedConversion,
      error: null,
    });
  const insertSelectMock: InsertSelectMock = jest.fn<() => { single: InsertSingleMock }>().mockReturnValue({
    single: insertSingleMock,
  });
  const insertMock: InsertMock = jest
    .fn<(values: Record<string, unknown>) => { select: InsertSelectMock }>()
    .mockReturnValue({
    select: insertSelectMock,
  });

  const queryBuilder: QueryBuilderMock = {
    select: jest.fn<(columns?: string) => QueryBuilderMock>(),
    eq: jest.fn<(column: string, value: unknown) => QueryBuilderMock>(),
    maybeSingle: maybeSingleMock,
    insert: insertMock,
  };
  queryBuilder.select.mockReturnValue(queryBuilder);
  queryBuilder.eq.mockReturnValue(queryBuilder);

  const profilesQuery: ProfilesQueryMock = {
    select: jest.fn<(columns?: string) => ProfilesQueryMock>(),
    ilike: jest.fn<(column: string, pattern: string) => ProfilesQueryMock>(),
    limit: jest.fn<(count: number) => ProfilesQueryMock>(),
    maybeSingle: jest.fn<
      () => Promise<{
        data:
          | {
              user_id: string;
              full_name?: string | null;
              username?: string | null;
            }
          | null;
        error: null;
      }>
    >(),
  };
  profilesQuery.select.mockReturnValue(profilesQuery);
  profilesQuery.ilike.mockReturnValue(profilesQuery);
  profilesQuery.limit.mockReturnValue(profilesQuery);
  profilesQuery.maybeSingle.mockResolvedValue({
    data: referrerProfile,
    error: null,
  });

  const fromMock: SupabaseClientStub['from'] = jest.fn((table: string) => {
    if (table === 'affiliate_conversions') {
      return queryBuilder;
    }
    if (table === 'profiles') {
      return profilesQuery;
    }
    throw new Error(`Unexpected table requested: ${table}`);
  });

  const getUserMock: SupabaseClientStub['auth']['getUser'] = jest.fn(async () => ({
    data: { user: { id: userId } },
    error: null,
  }));

  const rpcMock: SupabaseClientStub['rpc'] = jest.fn(async (_fn, _params) => ({
    data: { id: 'audit-log-id' },
    error: null,
  }));

  return {
    auth: {
      getUser: getUserMock,
    },
    from: fromMock,
    rpc: rpcMock,
    queryBuilder,
    profilesQuery,
    insertMock,
    insertSelectMock,
    insertSingleMock,
  };
}

describe('Affiliate duplicate prevention', () => {
  beforeAll(async () => {
    const affiliateRoute = await import('../../../src/app/api/affiliate/route');
    affiliatePost = affiliateRoute.POST as (request: NextRequest | Request) => Promise<Response>;

    const affiliateConversionsRoute = await import(
      '../../../src/app/api/affiliate/conversions/route'
    );
    affiliateConversionsPost = affiliateConversionsRoute.POST as (
      request: NextRequest | Request,
    ) => Promise<Response>;
  });

  beforeEach(() => {
    jest.clearAllMocks();

    getCommissionRateMock.mockResolvedValue(10);
    calculateCommissionAmountMock.mockImplementation(
      (value: number | string, rate: number | string): number => {
        const numericValue = typeof value === 'string' ? parseFloat(value) : value;
        const numericRate = typeof rate === 'string' ? parseFloat(rate) : rate;
        if (Number.isNaN(numericValue) || Number.isNaN(numericRate)) {
          return 0;
        }
        return Number(((numericValue * numericRate) / 100).toFixed(2));
      },
    );
    awardPointsMock.mockResolvedValue(undefined);
  });

  it('returns existing conversion when signup affiliate conversion already recorded', async () => {
    const affiliateUserId = '00000000-0000-0000-0000-ABCDEF123456';
    const referralCode = `MT${affiliateUserId.slice(-8).toUpperCase()}`;

    const supabaseStub = createSupabaseStub({
      userId: affiliateUserId,
      existingConversions: [{ id: 'signup-conversion-id' }],
    });

    createClientMock.mockResolvedValueOnce(supabaseStub);

    const request = createJsonRequest('/api/affiliate', 'POST', {
      referredUserId: 'referred-user-1',
      referralCode,
    });

    const response = await affiliatePost(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Conversion already recorded',
      conversionId: 'signup-conversion-id',
    });

    expect(supabaseStub.insertMock).not.toHaveBeenCalled();
    expect(awardPointsMock).not.toHaveBeenCalled();
  });

  it('prevents duplicate booking conversions by returning the existing record', async () => {
    const supabaseStub = createSupabaseStub({
      userId: 'affiliate-user-1',
      existingConversions: [{ id: 'booking-conversion-id' }],
    });

    createClientMock.mockResolvedValueOnce(supabaseStub);

    const response = await affiliateConversionsPost(
      createJsonRequest('/api/affiliate/conversions', 'POST', {
        affiliate_user_id: 'affiliate-user-1',
        referred_user_id: 'referred-user-1',
        conversion_type: 'booking',
        conversion_value: 1500,
        reference_id: 'booking-123',
        reference_type: 'booking',
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({
      success: true,
      message: 'Conversion already exists',
      conversionId: 'booking-conversion-id',
      existing: true,
    });

    expect(supabaseStub.insertMock).not.toHaveBeenCalled();
  });

  it('checks both reference_id and reference_type when detecting duplicates', async () => {
    const supabaseStub = createSupabaseStub({
      userId: 'affiliate-user-2',
      existingConversions: [null],
      insertedConversion: { id: 'new-booking-conversion' },
    });

    createClientMock.mockResolvedValueOnce(supabaseStub);

    const referenceId = 'booking-456';
    const referenceType = 'booking';

    const response = await affiliateConversionsPost(
      createJsonRequest('/api/affiliate/conversions', 'POST', {
        affiliate_user_id: 'affiliate-user-2',
        referred_user_id: 'referred-user-2',
        conversion_type: 'booking',
        conversion_value: 2000,
        reference_id: referenceId,
        reference_type: referenceType,
      }),
    );
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe('Affiliate conversion created successfully');
    expect(body.data?.id).toBe('new-booking-conversion');

    const eqCalls = (supabaseStub.queryBuilder.eq as jest.Mock).mock.calls.map(
      ([column, value]) => [column, value],
    );
    expect(eqCalls).toEqual(
      expect.arrayContaining([
        ['affiliate_user_id', 'affiliate-user-2'],
        ['referred_user_id', 'referred-user-2'],
        ['conversion_type', 'booking'],
        ['reference_id', referenceId],
        ['reference_type', referenceType],
      ]),
    );

    expect(supabaseStub.insertMock).toHaveBeenCalledTimes(1);
    expect(supabaseStub.insertSelectMock).toHaveBeenCalledTimes(1);
    expect(supabaseStub.insertSingleMock).toHaveBeenCalledTimes(1);
  });
});


