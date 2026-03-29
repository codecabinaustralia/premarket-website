import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestEnv, getAuthedDb, getUnauthDb, getSuperAdminDb, seedDoc,
  cleanup, teardown,
  assertSucceeds, assertFails,
  doc, getDoc, setDoc,
} from './helpers.js';

beforeAll(async () => { await getTestEnv(); });
afterAll(async () => { await teardown(); });
beforeEach(async () => { await cleanup(); });

describe('contacts collection', () => {
  // --- read ---
  it('allows superAdmin to read', async () => {
    await seedDoc('contacts/c1', { name: 'Alice', email: 'alice@test.com' });
    const db = await getSuperAdminDb();
    await assertSucceeds(getDoc(doc(db, 'contacts', 'c1')));
  });

  it('denies non-superAdmin read', async () => {
    await seedDoc('contacts/c1', { name: 'Alice', email: 'alice@test.com' });
    const db = getAuthedDb('user1');
    await assertFails(getDoc(doc(db, 'contacts', 'c1')));
  });

  it('denies unauthenticated read', async () => {
    await seedDoc('contacts/c1', { name: 'Alice', email: 'alice@test.com' });
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'contacts', 'c1')));
  });

  // --- write ---
  it('denies superAdmin write', async () => {
    const db = await getSuperAdminDb();
    await assertFails(setDoc(doc(db, 'contacts', 'c1'), { name: 'Alice' }));
  });

  it('denies authenticated write', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'contacts', 'c1'), { name: 'Alice' }));
  });

  it('denies unauthenticated write', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'contacts', 'c1'), { name: 'Alice' }));
  });
});
