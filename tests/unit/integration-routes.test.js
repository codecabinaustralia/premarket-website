import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock firebase-admin/auth
const mockVerifyIdToken = vi.fn();
vi.mock('firebase-admin/auth', () => ({
  getAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
}));

// Mock adminDb
vi.mock('../../src/app/firebase/adminApp', () => ({
  adminDb: {
    collection: () => ({
      doc: () => ({
        get: vi.fn().mockResolvedValue({ exists: true, data: () => ({}) }),
        update: vi.fn().mockResolvedValue(true),
        set: vi.fn().mockResolvedValue(true),
      }),
      where: () => ({
        get: vi.fn().mockResolvedValue({ docs: [] }),
        where: () => ({
          get: vi.fn().mockResolvedValue({ docs: [] }),
        }),
      }),
    }),
    batch: () => ({
      update: vi.fn(),
      commit: vi.fn().mockResolvedValue(true),
    }),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: { serverTimestamp: () => 'TIMESTAMP' },
}));

// Mock services
vi.mock('../../src/app/api/services/agentboxService', () => ({
  validateCredentials: vi.fn().mockResolvedValue({ valid: true, offices: [] }),
  storeCredentials: vi.fn().mockResolvedValue(true),
  syncContacts: vi.fn().mockResolvedValue(true),
  getCredentials: vi.fn().mockResolvedValue({ status: 'connected', mode: 'real' }),
  removeCredentials: vi.fn().mockResolvedValue(true),
  deleteContactsForAgent: vi.fn().mockResolvedValue(0),
  fetchListings: vi.fn().mockResolvedValue([]),
  fetchListingById: vi.fn().mockResolvedValue(null),
  mapListingToProperty: vi.fn().mockReturnValue({}),
  updateSyncStatus: vi.fn().mockResolvedValue(true),
}));
vi.mock('../../src/app/api/services/agentboxDemoData', () => ({
  DEMO_OFFICES: [],
  DEMO_LISTINGS: [],
}));

function makeRequest(body, authHeader, method = 'POST') {
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (authHeader) headers.set('authorization', authHeader);
  return new Request('http://localhost/test', {
    method,
    headers,
    body: method !== 'GET' ? JSON.stringify(body) : undefined,
  });
}

function setupValidAuth(uid = 'user123') {
  mockVerifyIdToken.mockResolvedValue({ uid, email: 'test@example.com' });
}

describe('Integration route auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('agentbox/connect returns 401 without auth', async () => {
    const { POST } = await import('../../src/app/api/integrations/agentbox/connect/route.js');
    const res = await POST(makeRequest({ clientId: 'x', apiKey: 'y' }));
    expect(res.status).toBe(401);
  });

  it('agentbox/connect succeeds with auth (demo mode)', async () => {
    setupValidAuth();
    const { POST } = await import('../../src/app/api/integrations/agentbox/connect/route.js');
    const res = await POST(makeRequest({ demo: true }, 'Bearer valid-token'));
    expect(res.status).toBe(200);
  });

  it('agentbox/disconnect returns 401 without auth', async () => {
    const { POST } = await import('../../src/app/api/integrations/agentbox/disconnect/route.js');
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(401);
  });
});

describe('Upload route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 without auth', async () => {
    const { POST } = await import('../../src/app/api/upload-image/route.js');
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'image/png' }), 'test.png');
    const req = new Request('http://localhost/test', { method: 'POST', body: formData });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('rejects non-image file types', async () => {
    setupValidAuth();
    const { POST } = await import('../../src/app/api/upload-image/route.js');
    const formData = new FormData();
    formData.append('file', new Blob(['test'], { type: 'text/plain' }), 'test.txt');
    const req = new Request('http://localhost/test', { method: 'POST', body: formData });
    req.headers.set('authorization', 'Bearer valid-token');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('Invalid file type');
  });

  it('rejects oversized files', async () => {
    setupValidAuth();
    const { POST } = await import('../../src/app/api/upload-image/route.js');
    // Create a blob larger than 10MB
    const largeContent = new Uint8Array(11 * 1024 * 1024);
    const formData = new FormData();
    formData.append('file', new Blob([largeContent], { type: 'image/png' }), 'large.png');
    const req = new Request('http://localhost/test', { method: 'POST', body: formData });
    req.headers.set('authorization', 'Bearer valid-token');
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('too large');
  });
});
