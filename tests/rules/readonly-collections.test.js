import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestEnv, getAuthedDb, getUnauthDb, seedDoc,
  cleanup, teardown,
  assertSucceeds, assertFails,
  doc, getDoc, setDoc, deleteDoc,
} from './helpers.js';

beforeAll(async () => { await getTestEnv(); });
afterAll(async () => { await teardown(); });
beforeEach(async () => { await cleanup(); });

// Collections that allow authenticated read but deny all writes:
// xpNotifications, propertyStats, stripeTransactions
describe.each([
  { name: 'xpNotifications', col: 'xpNotifications' },
  { name: 'propertyStats', col: 'propertyStats' },
  { name: 'stripeTransactions', col: 'stripeTransactions' },
])('$name (auth read, no write)', ({ col }) => {
  // --- read ---
  it('allows authenticated read', async () => {
    await seedDoc(`${col}/doc1`, { data: 'test' });
    const db = getAuthedDb('user1');
    await assertSucceeds(getDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated read', async () => {
    await seedDoc(`${col}/doc1`, { data: 'test' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, col, 'doc1')));
  });

  // --- write ---
  it('denies authenticated write', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, col, 'doc1'), { data: 'test' }));
  });

  it('denies unauthenticated write', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, col, 'doc1'), { data: 'test' }));
  });

  // --- delete ---
  it('denies authenticated delete', async () => {
    await seedDoc(`${col}/doc1`, { data: 'test' });
    const db = getAuthedDb('user1');
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });

  it('denies unauthenticated delete', async () => {
    await seedDoc(`${col}/doc1`, { data: 'test' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, col, 'doc1')));
  });
});
