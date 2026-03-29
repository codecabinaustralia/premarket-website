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

describe('likes collection', () => {
  // --- read ---
  it('allows unauthenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    const db = getUnauthDb();
    await assertSucceeds(getDoc(doc(db, 'likes', 'user1_prop1')));
  });

  it('allows authenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    const db = getAuthedDb('user2');
    await assertSucceeds(getDoc(doc(db, 'likes', 'user1_prop1')));
  });

  // --- create ---
  it('allows authed create with matching userId and propertyId string', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' }));
  });

  it('denies create with mismatched userId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'likes', 'like1'), { userId: 'user2', propertyId: 'prop1' }));
  });

  it('denies create without propertyId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'likes', 'like1'), { userId: 'user1' }));
  });

  it('denies create with non-string propertyId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'likes', 'like1'), { userId: 'user1', propertyId: 123 }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'likes', 'like1'), { userId: 'user1', propertyId: 'prop1' }));
  });

  // --- update ---
  it('denies update (even owner)', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    await assertFails(updateDoc(doc(db, 'likes', 'user1_prop1'), { propertyId: 'prop2' }));
  });

  // --- delete ---
  it('allows owner to delete own like', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    await assertSucceeds(deleteDoc(doc(db, 'likes', 'user1_prop1')));
  });

  it('denies non-owner delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    const db = getAuthedDb('user2');
    await assertFails(deleteDoc(doc(db, 'likes', 'user1_prop1')));
  });

  it('denies unauthenticated delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'likes', 'user1_prop1'), { userId: 'user1', propertyId: 'prop1' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, 'likes', 'user1_prop1')));
  });
});
