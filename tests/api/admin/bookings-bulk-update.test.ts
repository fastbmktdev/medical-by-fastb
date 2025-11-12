import { NextRequest } from 'next/server';

const createClientMock = jest.fn();

jest.mock('@/lib/database/supabase/server', () => ({
  createClient: createClientMock,
}));

/**
 * Helper to create a NextRequest of POST with JSON body
 */
function createJsonRequest(body: Record<string, unknown>): NextRequest {
  const request = new Request('https://test.app/api/admin/bookings/bulk-update', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return new NextRequest(request);
}

/**
 * Mock authorized client
 */
function createAuthClient(role: 'admin' | 'partner' | null = 'admin') {
  const maybeSingleMock = jest.fn().mockResolvedValue({
    data: role ? { role } : null,
    error: null,
  });
  const eqMock = jest.fn().mockReturnValue({ maybeSingle: maybeSingleMock });
  const selectMock = jest.fn().mockReturnValue({ eq: eqMock });
  const fromMock = jest.fn().mockReturnValue({ select: selectMock });

  return {
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: role ? { id: 'user-1' } : null },
        error: null,
      }),
    },
    from: fromMock,
  };
}

/**
 * Mock booking supabase client
 */
function createBookingsClient({ shouldFail = false } = {}) {
  const selectMock = jest.fn().mockResolvedValue({
    data: shouldFail ? null : [{ id: 'booking-1' }],
    error: shouldFail ? new Error('Update failed') : null,
  });
  const inMock = jest.fn().mockReturnValue({ select: selectMock });
  const updateMock = jest.fn().mockReturnValue({ in: inMock });
  const fromMock = jest.fn().mockReturnValue({ update: updateMock });

  return {
    from: fromMock,
    updateMock,
    inMock,
    selectMock,
  };
}

describe('POST /api/admin/bookings/bulk-update', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 400 when required fields are missing', async () => {
    const authStub = createAuthClient('admin');
    createClientMock.mockResolvedValueOnce(authStub);

    const { POST } = await import('../../../src/app/api/admin/bookings/bulk-update/route');

    const response = await POST(createJsonRequest({}));

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Missing required fields/);
  });

  it('returns 403 when user is not admin', async () => {
    const authStub = createAuthClient('partner');
    createClientMock.mockResolvedValueOnce(authStub);

    const { POST } = await import('../../../src/app/api/admin/bookings/bulk-update/route');

    const response = await POST(
      createJsonRequest({
        action: 'confirm',
        bookingIds: ['booking-1'],
      }),
    );

    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid action', async () => {
    const authStub = createAuthClient('admin');
    const bookingsStub = createBookingsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(bookingsStub as never);

    const { POST } = await import('../../../src/app/api/admin/bookings/bulk-update/route');

    const response = await POST(
      createJsonRequest({
        action: 'invalid-action',
        bookingIds: ['booking-1'],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Invalid action/);
  });

  it('updates bookings successfully', async () => {
    const authStub = createAuthClient('admin');
    const bookingsStub = createBookingsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(bookingsStub as never);

    const { POST } = await import('../../../src/app/api/admin/bookings/bulk-update/route');

    const bookingIds = ['booking-1', 'booking-2'];
    bookingsStub.selectMock.mockResolvedValueOnce({
      data: bookingIds.map((id) => ({ id })),
      error: null,
    });

    const response = await POST(
      createJsonRequest({
        action: 'confirm',
        bookingIds,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.affectedCount).toBe(bookingIds.length);
    expect(bookingsStub.updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'confirmed' }),
    );
    expect(bookingsStub.inMock).toHaveBeenCalledWith('id', bookingIds);
  });

  it('returns 500 when update fails', async () => {
    const authStub = createAuthClient('admin');
    const bookingsStub = createBookingsClient({ shouldFail: true });
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(bookingsStub as never);

    const { POST } = await import('../../../src/app/api/admin/bookings/bulk-update/route');

    const response = await POST(
      createJsonRequest({
        action: 'cancel',
        bookingIds: ['booking-1'],
      }),
    );

    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body.success).toBe(false);
  });
});