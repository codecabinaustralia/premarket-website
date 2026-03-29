import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin/auth
const mockVerifyIdToken = vi.fn();
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}));

// Mock adminDb
const mockGet = vi.fn();
vi.mock('../../src/app/firebase/adminApp', () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({ get: mockGet }),
    }),
  },
}));

const { verifyAuth, verifyAdmin, verifyCron } = await import(
  '../../src/app/api/middleware/auth.js'
);

function makeRequest(authHeader) {
  const headers = new Headers();
  if (authHeader) headers.set('authorization', authHeader);
  return { headers };
}

describe('verifyAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects missing Authorization header', async () => {
    const result = await verifyAuth(makeRequest(null));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects non-Bearer header', async () => {
    const result = await verifyAuth(makeRequest('Basic abc123'));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects empty token', async () => {
    const result = await verifyAuth(makeRequest('Bearer '));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects invalid token', async () => {
    mockVerifyIdToken.mockRejectedValue({ code: 'auth/argument-error' });
    const result = await verifyAuth(makeRequest('Bearer invalid-token'));
    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('Invalid token');
    expect(result.status).toBe(401);
  });

  it('rejects expired token', async () => {
    mockVerifyIdToken.mockRejectedValue({ code: 'auth/id-token-expired' });
    const result = await verifyAuth(makeRequest('Bearer expired-token'));
    expect(result.authenticated).toBe(false);
    expect(result.error).toBe('Token expired');
    expect(result.status).toBe(401);
  });

  it('returns uid and email on valid token', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    const result = await verifyAuth(makeRequest('Bearer valid-token'));
    expect(result.authenticated).toBe(true);
    expect(result.uid).toBe('user123');
    expect(result.email).toBe('test@example.com');
  });
});

describe('verifyAdmin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects unauthenticated request', async () => {
    const result = await verifyAdmin(makeRequest(null));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects non-admin user', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    mockGet.mockResolvedValue({ exists: true, data: () => ({ superAdmin: false }) });
    const result = await verifyAdmin(makeRequest('Bearer valid-token'));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(403);
  });

  it('rejects missing user doc', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'user123', email: 'test@example.com' });
    mockGet.mockResolvedValue({ exists: false });
    const result = await verifyAdmin(makeRequest('Bearer valid-token'));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(403);
  });

  it('succeeds for superAdmin', async () => {
    mockVerifyIdToken.mockResolvedValue({ uid: 'admin123', email: 'admin@example.com' });
    mockGet.mockResolvedValue({ exists: true, data: () => ({ superAdmin: true }) });
    const result = await verifyAdmin(makeRequest('Bearer valid-token'));
    expect(result.authenticated).toBe(true);
    expect(result.uid).toBe('admin123');
  });
});

describe('verifyCron', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  it('rejects wrong secret', () => {
    process.env.CRON_SECRET = 'correct-secret';
    const result = verifyCron(makeRequest('Bearer wrong-secret'));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('rejects missing CRON_SECRET env', () => {
    delete process.env.CRON_SECRET;
    const result = verifyCron(makeRequest('Bearer some-secret'));
    expect(result.authenticated).toBe(false);
    expect(result.status).toBe(401);
  });

  it('accepts correct secret', () => {
    process.env.CRON_SECRET = 'correct-secret';
    const result = verifyCron(makeRequest('Bearer correct-secret'));
    expect(result.authenticated).toBe(true);
  });
});
