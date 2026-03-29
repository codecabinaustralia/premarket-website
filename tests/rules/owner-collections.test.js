import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestEnv, getAuthedDb, getUnauthDb,
  cleanup, teardown,
  assertSucceeds, assertFails,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
} from './helpers.js';

beforeAll(async () => { await getTestEnv(); });
afterAll(async () => { await teardown(); });
beforeEach(async () => { await cleanup(); });

// agents, draftProperties share the same owner-only CRUD pattern.
// image_edits is similar but create only requires isAuth() (no userId match).

describe.each([
  { name: 'agents', col: 'agents' },
  { name: 'draftProperties', col: 'draftProperties' },
])('$name (owner-only CRUD)', ({ col }) => {
  // --- read ---
  it('allows owner to read own doc', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { userId: 'user1', data: 'test' });
    await assertSucceeds(getDoc(doc(db, col, 'doc1')));
  });

  it('denies non-owner read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getAuthedDb('user2');
    await assertFails(getDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, col, 'doc1')));
  });

  // --- create ---
  it('allows create with matching userId', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, col, 'doc1'), { userId: 'user1', data: 'test' }));
  });

  it('denies create with mismatched userId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, col, 'doc1'), { userId: 'user2', data: 'test' }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, col, 'doc1'), { userId: 'user1', data: 'test' }));
  });

  // --- update ---
  it('allows owner to update', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { userId: 'user1', data: 'test' });
    await assertSucceeds(updateDoc(doc(db, col, 'doc1'), { data: 'updated' }));
  });

  it('denies non-owner update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getAuthedDb('user2');
    await assertFails(updateDoc(doc(db, col, 'doc1'), { data: 'hacked' }));
  });

  it('denies unauthenticated update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getUnauthDb();
    await assertFails(updateDoc(doc(db, col, 'doc1'), { data: 'hacked' }));
  });

  // --- delete ---
  it('allows owner to delete', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { userId: 'user1', data: 'test' });
    await assertSucceeds(deleteDoc(doc(db, col, 'doc1')));
  });

  it('denies non-owner delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getAuthedDb('user2');
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, col, 'doc1'), { userId: 'user1', data: 'test' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });
});

describe('image_edits (owner CRUD, auth create)', () => {
  // --- read ---
  it('allows owner to read', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    await assertSucceeds(getDoc(doc(db, 'image_edits', 'edit1')));
  });

  it('denies non-owner read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getAuthedDb('user2');
    await assertFails(getDoc(doc(db, 'image_edits', 'edit1')));
  });

  it('denies unauthenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'image_edits', 'edit1')));
  });

  // --- create ---
  it('allows any authed user to create (no userId match required)', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'image_edits', 'edit1'), { userId: 'user2', url: 'img.png' }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' }));
  });

  // --- update ---
  it('allows owner to update', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    await assertSucceeds(updateDoc(doc(db, 'image_edits', 'edit1'), { url: 'new.png' }));
  });

  it('denies non-owner update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getAuthedDb('user2');
    await assertFails(updateDoc(doc(db, 'image_edits', 'edit1'), { url: 'hacked.png' }));
  });

  it('denies unauthenticated update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getUnauthDb();
    await assertFails(updateDoc(doc(db, 'image_edits', 'edit1'), { url: 'hacked.png' }));
  });

  // --- delete ---
  it('allows owner to delete', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    await assertSucceeds(deleteDoc(doc(db, 'image_edits', 'edit1')));
  });

  it('denies non-owner delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getAuthedDb('user2');
    await assertFails(deleteDoc(doc(db, 'image_edits', 'edit1')));
  });

  it('denies unauthenticated delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'image_edits', 'edit1'), { userId: 'user1', url: 'img.png' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, 'image_edits', 'edit1')));
  });
});
