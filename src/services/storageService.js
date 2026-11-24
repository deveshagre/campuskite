/**
 * @file storageService.js
 * @description Higher-level abstraction over database.js for CampusKite.
 * Provides unified record management, automated ID and timestamp generation,
 * store clearing, and export/import functionality.
 */

import {
  getAll,
  getById,
  getByIndex,
  put,
  remove,
  clearStore,
} from './database.js';

export const ALL_STORES = [
  'users',
  'groups',
  'groupMembers',
  'expenses',
  'expenseSplits',
  'settlements',
  'receipts',
];

/**
 * Retrieves all records from a given store.
 *
 * @param {string} storeName - Name of the store
 * @returns {Promise<Array<*>>}
 */
export async function getAllRecords(storeName) {
  return getAll(storeName);
}

/**
 * Retrieves a single record by its ID.
 *
 * @param {string} storeName - Name of the store
 * @param {string} id - Record ID
 * @returns {Promise<*|undefined>}
 */
export async function getRecord(storeName, id) {
  return getById(storeName, id);
}

/**
 * Queries records from an index by matching value.
 *
 * @param {string} storeName - Name of the store
 * @param {string} indexName - Name of the index
 * @param {*} value - Value to query
 * @returns {Promise<Array<*>>}
 */
export async function queryByIndex(storeName, indexName, value) {
  return getByIndex(storeName, indexName, value);
}

/**
 * Creates a new record in a store.
 * Automatically adds a UUID `id` and ISO `createdAt` timestamp if not present.
 *
 * @param {string} storeName - Name of the store
 * @param {Object} data - Record data
 * @returns {Promise<Object>} Created record
 */
export async function createRecord(storeName, data) {
  const record = {
    ...data,
    id: data.id || crypto.randomUUID(),
    createdAt: data.createdAt || new Date().toISOString(),
  };

  await put(storeName, record);
  return record;
}

/**
 * Updates an existing record in a store by merging changes and setting `updatedAt`.
 *
 * @param {string} storeName - Name of the store
 * @param {string} id - Record ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated record
 * @throws {Error} If record does not exist
 */
export async function updateRecord(storeName, id, updates) {
  const existing = await getById(storeName, id);
  if (!existing) {
    throw new Error(`Record with id '${id}' not found in store '${storeName}'`);
  }

  const updatedRecord = {
    ...existing,
    ...updates,
    id, // Preserve ID
    updatedAt: new Date().toISOString(),
  };

  await put(storeName, updatedRecord);
  return updatedRecord;
}

/**
 * Deletes a record from a store by its ID.
 *
 * @param {string} storeName - Name of the store
 * @param {string} id - Record ID
 * @returns {Promise<void>}
 */
export async function deleteRecord(storeName, id) {
  return remove(storeName, id);
}

/**
 * Clears every store in the database.
 *
 * @returns {Promise<void>}
 */
export async function clearAllStores() {
  for (const store of ALL_STORES) {
    await clearStore(store);
  }
}

/**
 * Exports all database stores as a single JSON object.
 *
 * @returns {Promise<Record<string, Array<*>>>}
 */
export async function exportAllData() {
  const result = {};
  for (const store of ALL_STORES) {
    result[store] = await getAll(store);
  }
  return result;
}

/**
 * Validates and imports full data into all stores.
 * Clears existing data before importing.
 *
 * @param {Record<string, Array<*>>} data - Exported data object
 * @returns {Promise<boolean>} True on success
 * @throws {Error} If data format is invalid
 */
export async function importAllData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid data format for import: must be an object');
  }

  // Clear all stores first
  await clearAllStores();

  // Populate stores from data
  for (const store of ALL_STORES) {
    const records = data[store];
    if (Array.isArray(records)) {
      for (const record of records) {
        if (record && typeof record === 'object') {
          await put(store, record);
        }
      }
    }
  }

  return true;
}
