import { NextRequest } from 'next/server';

const createClientMock = jest.fn();

jest.mock('@/lib/database/supabase/server', () => ({
  createClient: createClientMock,
}));

function createJsonRequest(body: Record<string, unknown>): NextRequest {
  const request = new Request('http://localhost/api/admin/bulk-operations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  return new NextRequest(request);
}

type AuthClientConfig = {
  userId?: string | null;
  role?: 'admin' | 'partner' | null;
  authError?: Error | null;
};

function createAuthClient({
  userId = 'admin-user',
  role = 'admin',
  authError = null,
}: AuthClientConfig) {
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
        data: { user: userId ? { id: userId } : null },
        error: authError,
      }),
    },
    from: fromMock,
  };
}

function createOperationsClient() {
  const selectMock = jest.fn().mockResolvedValue({
    data: [{ id: 'item-1' }],
    error: null,
  });
  const inMock = jest.fn().mockReturnValue({ select: selectMock });
  const updateMock = jest.fn().mockReturnValue({ in: inMock });

  const deleteInMock = jest.fn().mockResolvedValue({ error: null });
  const deleteMock = jest.fn().mockReturnValue({ in: deleteInMock });

  const fromMock = jest.fn(() => ({
    update: updateMock,
    delete: deleteMock,
  }));

  return {
    from: fromMock,
    updateMock,
    deleteMock,
    inMock,
    selectMock,
    deleteInMock,
  };
}

describe('POST /api/admin/bulk-operations', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  it('returns 401 when user is not authenticated', async () => {
    const authStub = createAuthClient({ userId: null });
    createClientMock.mockResolvedValueOnce(authStub);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const response = await POST(
      createJsonRequest({
        operation: 'approve',
        table: 'gyms',
        ids: ['gym-1'],
      }),
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Unauthorized/i);
  });

  it('returns 403 when user is not admin', async () => {
    const authStub = createAuthClient({ role: 'partner' });
    createClientMock.mockResolvedValueOnce(authStub);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const response = await POST(
      createJsonRequest({
        operation: 'approve',
        table: 'gyms',
        ids: ['gym-1'],
      }),
    );

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Admin access required/i);
  });

  it('returns 400 for unsupported operation', async () => {
    const authStub = createAuthClient({});
    const clientStub = createOperationsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(clientStub as never);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const response = await POST(
      createJsonRequest({
        operation: 'invalid-operation',
        table: 'gyms',
        ids: ['gym-1'],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/Invalid operation/i);
    expect(clientStub.updateMock).not.toHaveBeenCalled();
  });

  it('returns 400 when operation is not supported for the table', async () => {
    const authStub = createAuthClient({});
    const clientStub = createOperationsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(clientStub as never);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const response = await POST(
      createJsonRequest({
        operation: 'activate',
        table: 'gyms',
        ids: ['gym-1'],
      }),
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toMatch(/not supported/);
    expect(clientStub.updateMock).not.toHaveBeenCalled();
  });

  it('successfully approves gyms', async () => {
    const authStub = createAuthClient({});
    const clientStub = createOperationsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(clientStub as never);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const ids = ['gym-1', 'gym-2'];
    clientStub.selectMock.mockResolvedValueOnce({
      data: ids.map((id) => ({ id })),
      error: null,
    });

    const response = await POST(
      createJsonRequest({
        operation: 'approve',
        table: 'gyms',
        ids,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.data.affectedCount).toBe(ids.length);

    expect(clientStub.from).toHaveBeenCalledWith('gyms');
    expect(clientStub.updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'approved', is_approved: true }),
    );
    expect(clientStub.inMock).toHaveBeenCalledWith('id', ids);
  });

  it('successfully cancels bookings', async () => {
    const authStub = createAuthClient({});
    const clientStub = createOperationsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(clientStub as never);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const ids = ['booking-1'];
    clientStub.selectMock.mockResolvedValueOnce({
      data: ids.map((id) => ({ id })),
      error: null,
    });

    const response = await POST(
      createJsonRequest({
        operation: 'reject',
        table: 'bookings',
        ids,
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(clientStub.updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'cancelled' }),
    );
  });

  it('successfully deletes promotions', async () => {
    const authStub = createAuthClient({});
    const clientStub = createOperationsClient();
    createClientMock.mockResolvedValueOnce(authStub).mockResolvedValueOnce(clientStub as never);

    const { POST } = await import('@/app/api/admin/bulk-operations/route');

    const response = await POST(
      createJsonRequest({
        operation: 'delete',
        table: 'promotions',
        ids: ['promo-1', 'promo-2'],
      }),
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(clientStub.deleteMock).toHaveBeenCalled();
    expect(clientStub.deleteInMock).toHaveBeenCalledWith('id', ['promo-1', 'promo-2']);
  });
});


