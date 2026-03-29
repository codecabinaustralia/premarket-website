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

describe('properties collection', () => {
  // --- read ---
  it('allows unauthenticated read', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getUnauthDb();
    await assertSucceeds(getDoc(doc(db, 'properties', 'prop1')));
  });

  it('allows authenticated read by non-owner', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getAuthedDb('user2');
    await assertSucceeds(getDoc(doc(db, 'properties', 'prop1')));
  });

  // --- create ---
  it('allows authenticated create with matching userId', async () => {
    const db = getAuthedDb('user1');
    await assertSucceeds(setDoc(doc(db, 'properties', 'prop1'), { userId: 'user1', title: 'House' }));
  });

  it('denies create with mismatched userId', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'properties', 'prop1'), { userId: 'user2', title: 'House' }));
  });

  it('denies create without userId field', async () => {
    const db = getAuthedDb('user1');
    await assertFails(setDoc(doc(db, 'properties', 'prop1'), { title: 'House' }));
  });

  it('denies unauthenticated create', async () => {
    const db = getUnauthDb();
    await assertFails(setDoc(doc(db, 'properties', 'prop1'), { userId: 'user1', title: 'House' }));
  });

  // --- update ---
  it('allows owner to update own property', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    await assertSucceeds(updateDoc(doc(db, 'properties', 'prop1'), { title: 'Updated House' }));
  });

  it('denies non-owner update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getAuthedDb('user2');
    await assertFails(updateDoc(doc(db, 'properties', 'prop1'), { title: 'Hacked' }));
  });

  it('denies unauthenticated update', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getUnauthDb();
    await assertFails(updateDoc(doc(db, 'properties', 'prop1'), { title: 'Hacked' }));
  });

  // --- delete ---
  it('allows owner to delete own property', async () => {
    const db = getAuthedDb('user1');
    await setDoc(doc(db, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    await assertSucceeds(deleteDoc(doc(db, 'properties', 'prop1')));
  });

  it('denies non-owner delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getAuthedDb('user2');
    await assertFails(deleteDoc(doc(db, 'properties', 'prop1')));
  });

  it('denies unauthenticated delete', async () => {
    const ownerDb = getAuthedDb('user1');
    await setDoc(doc(ownerDb, 'properties', 'prop1'), { userId: 'user1', title: 'House' });
    const db = getUnauthDb();
    await assertFails(deleteDoc(doc(db, 'properties', 'prop1')));
  });
});
