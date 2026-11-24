/**
 * @file database.js
 * @description IndexedDB wrapper using the 'idb' library for CampusKite.
 * Manages database initialization, schema versioning, and core CRUD helpers.
 */

import { openDB } from 'idb';

export const DB_NAME = 'campuskite-db';
export const DB_VERSION = 1;

/** @type {Promise<import('idb').IDBPDatabase>|null} */
let dbPromise = null;

/**
 * Lazily opens and returns the 'campuskite-db' IndexedDB instance.
 *
 * Stores configured:
 * - users: keyPath 'id', index on 'email' (unique)
 * - groups: keyPath 'id', index on 'createdBy'
 * - groupMembers: keyPath 'id', indexes on 'groupId', 'userId'
 * - expenses: keyPath 'id', indexes on 'groupId', 'paidBy', 'date'
 * - expenseSplits: keyPath 'id', indexes on 'expenseId', 'userId'
 * - settlements: keyPath 'id', indexes on 'groupId', 'payerId', 'receiverId'
 * - receipts: keyPath 'id'
 *
 * @returns {Promise<import('idb').IDBPDatabase>}
 */
export async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // users: keyPath 'id', indexes on 'email' (unique)
        if (!db.objectStoreNames.contains('users')) {
          const userStore = db.createObjectStore('users', { keyPath: 'id' });
          userStore.createIndex('email', 'email', { unique: true });
        }

        // groups: keyPath 'id', indexes on 'createdBy'
        if (!db.objectStoreNames.contains('groups')) {
          const groupStore = db.createObjectStore('groups', { keyPath: 'id' });
          groupStore.createIndex('createdBy', 'createdBy');
        }

        // groupMembers: keyPath 'id', indexes on 'groupId', 'userId'
        if (!db.objectStoreNames.contains('groupMembers')) {
          const memberStore = db.createObjectStore('groupMembers', { keyPath: 'id' });
          memberStore.createIndex('groupId', 'groupId');
          memberStore.createIndex('userId', 'userId');
        }

        // expenses: keyPath 'id', indexes on 'groupId', 'paidBy', 'date'
        if (!db.objectStoreNames.contains('expenses')) {
          const expenseStore = db.createObjectStore('expenses', { keyPath: 'id' });
          expenseStore.createIndex('groupId', 'groupId');
          expenseStore.createIndex('paidBy', 'paidBy');
          expenseStore.createIndex('date', 'date');
        }

        // expenseSplits: keyPath 'id', indexes on 'expenseId', 'userId'
        if (!db.objectStoreNames.contains('expenseSplits')) {
          const splitStore = db.createObjectStore('expenseSplits', { keyPath: 'id' });
          splitStore.createIndex('expenseId', 'expenseId');
          splitStore.createIndex('userId', 'userId');
        }

        // settlements: keyPath 'id', indexes on 'groupId', 'payerId', 'receiverId'
        if (!db.objectStoreNames.contains('settlements')) {
          const settlementStore = db.createObjectStore('settlements', { keyPath: 'id' });
          settlementStore.createIndex('groupId', 'groupId');
          settlementStore.createIndex('payerId', 'payerId');
          settlementStore.createIndex('receiverId', 'receiverId');
        }

        // receipts: keyPath 'id'
        if (!db.objectStoreNames.contains('receipts')) {
          db.createObjectStore('receipts', { keyPath: 'id' });
        }
      },
    }).catch((err) => {
      dbPromise = null;
      console.error('Failed to open IndexedDB database:', err);
      throw err;
    });
  }
  return dbPromise;
}

/**
 * Retrieves all records from an object store.
 *
 * @param {string} storeName - Name of the object store
 * @returns {Promise<Array<*>>} List of all records in the store
 */
export async function getAll(storeName) {
  const db = await getDB();
  return db.getAll(storeName);
}

/**
 * Retrieves a single record by its primary key.
 *
 * @param {string} storeName - Name of the object store
 * @param {string|number} id - Primary key value
 * @returns {Promise<*|undefined>} The record or undefined if not found
 */
export async function getById(storeName, id) {
  const db = await getDB();
  return db.get(storeName, id);
}

export const get = getById;

/**
 * Retrieves all records matching a specific index value.
 *
 * @param {string} storeName - Name of the object store
 * @param {string} indexName - Name of the index
 * @param {*} value - Target index value
 * @returns {Promise<Array<*>>} Array of matching records
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await getDB();
  return db.getAllFromIndex(storeName, indexName, value);
}

/**
 * Adds a new record to an object store. Fails if a record with the same key exists.
 *
 * @param {string} storeName - Name of the object store
 * @param {Object} record - Record to add
 * @returns {Promise<string|number>} Primary key of the inserted record
 */
export async function add(storeName, record) {
  const db = await getDB();
  return db.add(storeName, record);
}

/**
 * Adds or updates a record in an object store.
 *
 * @param {string} storeName - Name of the object store
 * @param {Object} record - Record to save
 * @returns {Promise<string|number>} Primary key of the saved record
 */
export async function put(storeName, record) {
  const db = await getDB();
  return db.put(storeName, record);
}

/**
 * Removes a record by its primary key from an object store.
 *
 * @param {string} storeName - Name of the object store
 * @param {string|number} id - Primary key of the record to delete
 * @returns {Promise<void>}
 */
export async function remove(storeName, id) {
  const db = await getDB();
  return db.delete(storeName, id);
}

/**
 * Clears all records from an object store.
 *
 * @param {string} storeName - Name of the object store
 * @returns {Promise<void>}
 */
export async function clearStore(storeName) {
  const db = await getDB();
  return db.clear(storeName);
}

/**
 * Closes the active database connection and resets the singleton instance.
 * Useful during tests or data resets.
 */
export function closeDB() {
  if (dbPromise) {
    dbPromise.then((db) => db.close()).catch(() => {});
    dbPromise = null;
  }
}
