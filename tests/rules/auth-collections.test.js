import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestEnv, getAuthedDb, getUnauthDb, seedDoc,
  cleanup, teardown,
  assertSucceeds, assertFails,
  doc, getDoc, setDoc, updateDoc, deleteDoc,
} from './helpers.js';

beforeAll(async () => { await getTestEnv(); });
afterAll(async () => { await teardown(); });
beforeEach(async () => { await cleanup(); });

// notifications and propertyEngagement share the same pattern:
// auth read/create/update, no delete
describe.each([
  { name: 'notifications', col: 'notifications' },
  { name: 'propertyEngagement', col: 'propertyEngagement' },
])('$name (auth read/create/update, no delete)', ({ col }) => {
  // --- read ---
  it('allows authenticated read', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { data: 'test' });
    await assertSucceeds(getDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated read', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, col, 'doc1'), { data: 'test' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, col, 'doc1')));
  });

  // --- create ---
  it('allows authenticated create', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, col, 'doc1'), { data: 'test' }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, col, 'doc1'), { data: 'test' }));
  });

  // --- update ---
  it('allows authenticated update', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { data: 'test' });
    await assertSucceeds(updateDoc(doc(db, col, 'doc1'), { data: 'updated' }));
  });

  it('denies unauthenticated update', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, col, 'doc1'), { data: 'test' });
    const db = getUnauthDb();
    await assertFails(updateDoc(doc(db, col, 'doc1'), { data: 'hacked' }));
  });

  // --- delete ---
  it('denies authenticated delete', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, col, 'doc1'), { data: 'test' });
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated delete', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, col, 'doc1'), { data: 'test' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });
});

// inAppPurchases: owner read/create, no update/delete
describe('inAppPurchases (owner read/create, no update/delete)', () => {
  // --- read ---
  it('allows owner to read', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' });
    await assertSucceeds(getDoc(doc(db, 'inAppPurchases', 'p1')));
  });

  it('denies non-owner read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' });
    const db = getAuthedDb('user2');
    await assertFails(getDoc(doc(db, 'inAppPurchases', 'p1')));
  });

  it('denies unauthenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'inAppPurchases', 'p1')));
  });

  // --- create ---
  it('allows owner to create', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' }));
  });

  it('denies create with mismatched userId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user2', product: 'premium' }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' }));
  });

  // --- update ---
  it('denies update (even owner)', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' });
    await assertFails(updateDoc(doc(db, 'inAppPurchases', 'p1'), { product: 'gold' }));
  });

  // --- delete ---
  it('denies delete (even owner)', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'inAppPurchases', 'p1'), { userId: 'user1', product: 'premium' });
    await assertFails(deleteDoc(doc(db, 'inAppPurchases', 'p1')));
  });
});

// priceOpinions: auth read/create, no update/delete
describe('priceOpinions (auth read/create, no update/delete)', () => {
  // --- read ---
  it('allows authenticated read', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    await assertSucceeds(getDoc(doc(db, 'priceOpinions', 'op1')));
  });

  it('denies unauthenticated read', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'priceOpinions', 'op1')));
  });

  // --- create ---
  it('allows authed create with propertyId string', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 }));
  });

  it('denies create without propertyId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'priceOpinions', 'op1'), { value: 500000 }));
  });

  it('denies create with non-string propertyId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 123, value: 500000 }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 }));
  });

  // --- update ---
  it('denies authenticated update', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    await assertFails(updateDoc(doc(db, 'priceOpinions', 'op1'), { value: 600000 }));
  });

  it('denies unauthenticated update', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    const db = getUnauthDb();
    await assertFails(updateDoc(doc(db, 'priceOpinions', 'op1'), { value: 600000 }));
  });

  // --- delete ---
  it('denies authenticated delete', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    await assertFails(deleteDoc(doc(db, 'priceOpinions', 'op1')));
  });

  it('denies unauthenticated delete', async () => {
    const authedDb = getAuthedDb('user1');
    await setDoc(doc(authedDb, 'priceOpinions', 'op1'), { propertyId: 'prop1', value: 500000 });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, 'priceOpinions', 'op1')));
  });
});
