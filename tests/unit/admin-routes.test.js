import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin/auth
const mockVerifyIdToken = vi.fn();
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({
    verifyIdToken: mockVerifyIdToken,
    generatePasswordResetLink: vi.fn().mockResolvedValue('https://reset-link'),
  }),
}));

// Mock adminDb
const mockDocGet = vi.fn();
const mockDocUpdate = vi.fn().mockResolvedValue(true);
const mockDocSet = vi.fn().mockResolvedValue(true);
const mockCollectionGet = vi.fn().mockResolvedValue({ docs: [] });
vi.mock('../../src/app/firebase/adminApp', () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({
        get: mockDocGet,
        update: mockDocUpdate,
        set: mockDocSet,
        collection: () => ({
          orderBy: () => ({ get: vi.fn().mockResolvedValue({ docs: [] }) }),
          add: vi.fn().mockResolvedValue({ id: 'note123' }),
          doc: () => ({ delete: vi.fn().mockResolvedValue(true) }),
        }),
      }),
      get: mockCollectionGet,
    }),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'TIMESTAMP',
    delete: () => 'DELETE',
  },
}));

function makeRequest(body, authHeader, method = 'GET', url = 'http://localhost/test') {
  const headers = new Headers();
  if (authHeader) headers.set('authorization', authHeader);
  if (method !== 'GET') {
    headers.set('Content-Type', 'application/json');
    return new Request(url, { method, headers, body: JSON.stringify(body) });
  }
  return new Request(url, { method, headers });
}

describe('Admin routes auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/admin/users returns 401 with no auth', async () => {
    const { GET } = await import('../../src/app/api/admin/users/route.js');
    const res = await GET(makeRequest(null, null, 'GET'));
    expect(res.status).toBe(401);
  });

  it('GET /api/admin/users returns 403 for non-admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    mockDocGet.mockResolvedValue({ exists: true, data: () => ({ superAdmin: false }) });
    const { GET } = await import('../../src/app/api/admin/users/route.js');
    const res = await GET(makeRequest(null, 'Bearer valid-token', 'GET'));
    expect(res.status).toBe(403);
  });

  it('GET /api/admin/users succeeds for admin', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'admin123', email: 'admin@example.com' });
    mockDocGet.mockResolvedValue({ exists: true, data: () => ({ superAdmin: true }) });
    mockCollectionGet.mockResolvedValue({ docs: [] });
    const { GET } = await import('../../src/app/api/admin/users/route.js');
    const res = await GET(makeRequest(null, 'Bearer valid-token', 'GET'));
    expect(res.status).toBe(200);
  });

  it('POST /api/admin/trigger-cron returns 401 without auth', async () => {
    const { POST } = await import('../../src/app/api/admin/trigger-cron/route.js');
    const res = await POST(makeRequest({ jobKey: 'compute-scores' }, null, 'POST'));
    expect(res.status).toBe(401);
  });

  it('POST /api/admin/api-access returns 401 without auth', async () => {
    const { POST } = await import('../../src/app/api/admin/api-access/route.js');
    const res = await POST(makeRequest({ targetUid: 'u1', action: 'approve' }, null, 'POST'));
    expect(res.status).toBe(401);
  });
});
