import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  getTestEnv, getAuthedDb, getUnauthDb, getSuperAdminDb,
  cleanup, teardown,
  assertFails,
  doc, getDoc, setDoc,
} from './helpers.js';

beforeAll(async () => { await getTestEnv(); });
afterAll(async () => { await teardown(); });
beforeEach(async () => { await cleanup(); });

describe('default deny (unknown collections)', () => {
  // --- read ---
  it('denies unauthenticated read of unknown collection', async () => {
    const db = getUnauthDb();
    await assertFails(getDoc(doc(db, 'unknownCollection', 'doc1')));
  });

  it('denies authenticated read of unknown collection', async () => {
    const db = getAuthedDb('user1');
    await assertFails(getDoc(doc(db, 'unknownCollection', 'doc1')));
  });

  it('denies superAdmin read of unknown collection', async () => {
    const db = await getSuperAdminDb();
    await assertFails(getDoc(doc(db, 'unknownCollection', 'doc1')));
  });

  // --- write ---
  it('denies unauthenticated write to unknown collection', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'unknownCollection', 'doc1'), { data: 'test' }));
  });

  it('denies authenticated write to unknown collection', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'unknownCollection', 'doc1'), { data: 'test' }));
  });

  it('denies superAdmin write to unknown collection', async () => {
    const db = await getSuperAdminDb();
    await assertFails(setDoc(doc(db, 'unknownCollection', 'doc1'), { data: 'test' }));
  });
});
