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

describe('offers collection', () => {
  // --- read ---
  it('allows unauthenticated read', async () => {
    const db = getUnauthDb();
    await setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    await assertSucceeds(getDoc(doc(db, 'offers', 'offer1')));
  });

  it('allows authenticated read', async () => {
    const unauthDb = getUnauthDb();
    await setDoc(doc(unauthDb, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    const db = getAuthedDb('user1');
    await assertSucceeds(getDoc(doc(db, 'offers', 'offer1')));
  });

  // --- create ---
  it('allows anonymous create with propertyId string', async () => {
    const db = getUnauthDb();
    await assertSucceeds(setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 }));
  });

  it('allows authenticated create with propertyId string', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 }));
  });

  it('denies create without propertyId', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'offers', 'offer1'), { amount: 500000 }));
  });

  it('denies create with non-string propertyId', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'offers', 'offer1'), { propertyId: 123, amount: 500000 }));
  });

  // --- update ---
  it('allows update when propertyId stays the same (no userId)', async () => {
    const db = getUnauthDb();
    await setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    await assertSucceeds(updateDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 600000 }));
  });

  it('denies update that changes propertyId', async () => {
    const db = getUnauthDb();
    await setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    await assertFails(updateDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop2', amount: 600000 }));
  });

  it('allows authed update setting userId to own uid', async () => {
    const unauthDb = getUnauthDb();
    await setDoc(doc(unauthDb, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    const db = getAuthedDb('user1');
    await assertSucceeds(updateDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', userId: 'user1' }));
  });

  it('denies authed update setting userId to different uid', async () => {
    const unauthDb = getUnauthDb();
    await setDoc(doc(unauthDb, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    const db = getAuthedDb('user1');
    await assertFails(updateDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', userId: 'user2' }));
  });

  it('denies unauthenticated update that sets userId', async () => {
    const db = getUnauthDb();
    await setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    await assertFails(updateDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', userId: 'user1' }));
  });

  // --- delete ---
  it('denies authenticated delete', async () => {
    const unauthDb = getUnauthDb();
    await setDoc(doc(unauthDb, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    const db = getAuthedDb('user1');
    await assertFails(deleteDoc(doc(db, 'offers', 'offer1')));
  });

  it('denies unauthenticated delete', async () => {
    const db = getUnauthDb();
    await setDoc(doc(db, 'offers', 'offer1'), { propertyId: 'prop1', amount: 500000 });
    await assertFails(deleteDoc(doc(db, 'offers', 'offer1')));
  });
});
