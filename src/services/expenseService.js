/**
 * @file expenseService.js
 * @description Expense management service for CampusKite.
 * Handles expense creation with equal/custom splits, receipt attachment, updates, deletion, and filtering.
 */

import { getAll, getById, getByIndex, put, remove } from './database.js';
import { isGroupMember } from './groupService.js';
import { equalSplit, validateCustomSplit } from '../utils/calculations.js';
import { toISODateString, isInMonth } from '../utils/date.js';
import { validateAmount, validateRequired } from '../utils/validation.js';

/**
 * Creates a new expense in a group with associated split records and optional receipt.
 *
 * @param {Object} data - Expense payload
 * @param {string} data.groupId - Target group ID
 * @param {string} data.description - Description of the expense
 * @param {number} data.amount - Total amount in paise
 * @param {string} [data.category='General'] - Expense category
 * @param {string} data.paidBy - User ID of payer (must be a group member)
 * @param {string|Date} [data.date] - Date of the expense
 * @param {'equal'|'custom'} [data.splitType='equal'] - Split distribution type
 * @param {string[]} data.participants - Array of participant user IDs
 * @param {Record<string, number>} [data.customAmounts] - Map of userId -> paise for custom split
 * @param {File|Blob|null} [data.receiptFile] - Optional receipt file
 * @returns {Promise<Object>} Created expense record with splits
 * @throws {Error} If validation fails or payer is not a group member
 */
export async function createExpense(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Expense data must be an object');
  }

  const { groupId, description, amount, category, paidBy, date, splitType, participants, customAmounts, receiptFile } = data;

  if (!groupId) {
    throw new Error('Group ID is required');
  }

  const descError = validateRequired(description, 'Description');
  if (descError) throw new Error(descError);

  const amountError = validateAmount(amount);
  if (amountError) throw new Error(amountError);

  const integerAmount = Math.round(Number(amount));
  if (integerAmount <= 0) {
    throw new Error('Expense amount must be greater than zero');
  }

  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    throw new Error('Expense must have at least one participant');
  }

  if (!paidBy) {
    throw new Error('Payer (paidBy) is required');
  }

  const isMember = await isGroupMember(groupId, paidBy);
  if (!isMember) {
    throw new Error('Payer must be a member of the group');
  }

  // Calculate split amounts
  const type = splitType === 'custom' ? 'custom' : 'equal';
  let splitAmounts = [];

  if (type === 'equal') {
    splitAmounts = equalSplit(integerAmount, participants.length);
  } else {
    splitAmounts = participants.map((uid) => {
      const val = customAmounts && customAmounts[uid] !== undefined ? customAmounts[uid] : 0;
      return Math.round(Number(val));
    });
    const customValidation = validateCustomSplit(splitAmounts, integerAmount);
    if (!customValidation.valid) {
      throw new Error(customValidation.error || 'Invalid custom split configuration');
    }
  }

  const expenseId = crypto.randomUUID();
  let receiptId = null;

  // Handle optional receipt attachment
  if (receiptFile) {
    receiptId = crypto.randomUUID();
    const receipt = {
      id: receiptId,
      expenseId,
      groupId,
      file: receiptFile,
      fileName: receiptFile.name || 'receipt',
      fileType: receiptFile.type || 'application/octet-stream',
      fileSize: receiptFile.size || 0,
      createdAt: new Date().toISOString(),
    };
    await put('receipts', receipt);
  }

  const expenseDate = date ? toISODateString(date) : toISODateString(new Date());

  const expenseRecord = {
    id: expenseId,
    groupId,
    description: description.trim(),
    amount: integerAmount,
    category: category || 'General',
    paidBy,
    date: expenseDate,
    splitType: type,
    receiptId,
    createdAt: new Date().toISOString(),
  };

  await put('expenses', expenseRecord);

  // Create expenseSplit records
  const splitRecords = [];
  for (let i = 0; i < participants.length; i++) {
    const split = {
      id: crypto.randomUUID(),
      expenseId,
      userId: participants[i],
      amount: splitAmounts[i],
      createdAt: new Date().toISOString(),
    };
    await put('expenseSplits', split);
    splitRecords.push(split);
  }

  return {
    ...expenseRecord,
    splits: splitRecords,
  };
}

/**
 * Updates an existing expense and its split distribution.
 *
 * @param {string} expenseId - Expense ID
 * @param {Object} data - Updated expense data
 * @returns {Promise<Object>} Updated expense record
 * @throws {Error} If expense not found or validation fails
 */
export async function updateExpense(expenseId, data) {
  const existingExpense = await getById('expenses', expenseId);
  if (!existingExpense) {
    throw new Error(`Expense not found with id '${expenseId}'`);
  }

  const groupId = data.groupId || existingExpense.groupId;
  const description = data.description !== undefined ? data.description : existingExpense.description;
  const amount = data.amount !== undefined ? data.amount : existingExpense.amount;
  const category = data.category !== undefined ? data.category : existingExpense.category;
  const paidBy = data.paidBy !== undefined ? data.paidBy : existingExpense.paidBy;
  const date = data.date !== undefined ? data.date : existingExpense.date;
  const splitType = data.splitType !== undefined ? data.splitType : existingExpense.splitType;

  const descError = validateRequired(description, 'Description');
  if (descError) throw new Error(descError);

  const amountError = validateAmount(amount);
  if (amountError) throw new Error(amountError);

  const integerAmount = Math.round(Number(amount));

  // Determine participants
  let participants = data.participants;
  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    const currentSplits = await getByIndex('expenseSplits', 'expenseId', expenseId);
    participants = currentSplits.map((s) => s.userId);
  }

  if (participants.length === 0) {
    throw new Error('Expense must have at least one participant');
  }

  // Calculate splits
  const type = splitType === 'custom' ? 'custom' : 'equal';
  let splitAmounts = [];

  if (type === 'equal') {
    splitAmounts = equalSplit(integerAmount, participants.length);
  } else {
    splitAmounts = participants.map((uid) => {
      const val = data.customAmounts && data.customAmounts[uid] !== undefined ? data.customAmounts[uid] : 0;
      return Math.round(Number(val));
    });
    const customValidation = validateCustomSplit(splitAmounts, integerAmount);
    if (!customValidation.valid) {
      throw new Error(customValidation.error || 'Invalid custom split configuration');
    }
  }

  // Delete old splits
  const oldSplits = await getByIndex('expenseSplits', 'expenseId', expenseId);
  for (const s of oldSplits) {
    await remove('expenseSplits', s.id);
  }

  // Create new splits
  const newSplits = [];
  for (let i = 0; i < participants.length; i++) {
    const split = {
      id: crypto.randomUUID(),
      expenseId,
      userId: participants[i],
      amount: splitAmounts[i],
      createdAt: new Date().toISOString(),
    };
    await put('expenseSplits', split);
    newSplits.push(split);
  }

  // Handle receipt updates
  let receiptId = existingExpense.receiptId;
  if (data.receiptFile) {
    if (receiptId) {
      await remove('receipts', receiptId);
    }
    receiptId = crypto.randomUUID();
    const receipt = {
      id: receiptId,
      expenseId,
      groupId,
      file: data.receiptFile,
      fileName: data.receiptFile.name || 'receipt',
      fileType: data.receiptFile.type || 'application/octet-stream',
      fileSize: data.receiptFile.size || 0,
      createdAt: new Date().toISOString(),
    };
    await put('receipts', receipt);
  } else if (data.receiptFile === null && receiptId) {
    await remove('receipts', receiptId);
    receiptId = null;
  }

  const updatedExpense = {
    ...existingExpense,
    groupId,
    description: description.trim(),
    amount: integerAmount,
    category: category || 'General',
    paidBy,
    date: toISODateString(date),
    splitType: type,
    receiptId,
    updatedAt: new Date().toISOString(),
  };

  await put('expenses', updatedExpense);

  return {
    ...updatedExpense,
    splits: newSplits,
  };
}

/**
 * Deletes an expense, its split records, and attached receipt.
 * Verifies that the deleting user is the one who paid for the expense.
 *
 * @param {string} expenseId - Expense ID
 * @param {string} currentUserId - ID of user attempting deletion
 * @returns {Promise<boolean>} True on success
 * @throws {Error} If expense not found or user is not authorized
 */
export async function deleteExpense(expenseId, currentUserId) {
  const expense = await getById('expenses', expenseId);
  if (!expense) {
    throw new Error(`Expense not found with id '${expenseId}'`);
  }

  if (currentUserId !== expense.paidBy) {
    throw new Error('Only the member who paid for this expense can delete it');
  }

  // Delete splits
  const splits = await getByIndex('expenseSplits', 'expenseId', expenseId);
  for (const s of splits) {
    await remove('expenseSplits', s.id);
  }

  // Delete receipt if attached
  if (expense.receiptId) {
    await remove('receipts', expense.receiptId);
  }
  const allReceipts = await getAll('receipts');
  for (const r of allReceipts) {
    if (r.expenseId === expenseId) {
      await remove('receipts', r.id);
    }
  }

  // Delete expense record
  await remove('expenses', expenseId);

  return true;
}

/**
 * Retrieves an expense with its split records and receipt details.
 *
 * @param {string} expenseId - Expense ID
 * @returns {Promise<Object|null>} Expense object with splits and receipt, or null
 */
export async function getExpense(expenseId) {
  const expense = await getById('expenses', expenseId);
  if (!expense) return null;

  const splits = await getByIndex('expenseSplits', 'expenseId', expenseId);

  let receipt = null;
  if (expense.receiptId) {
    receipt = await getById('receipts', expense.receiptId);
  }
  if (!receipt) {
    const allReceipts = await getAll('receipts');
    receipt = allReceipts.find((r) => r.expenseId === expenseId) || null;
  }

  return {
    ...expense,
    splits,
    receipt,
  };
}

/**
 * Retrieves all expenses for a group, applying optional filters and sorting by date descending.
 *
 * @param {string} groupId - Group ID
 * @param {Object} [filters={}] - Optional filters
 * @param {string} [filters.category] - Filter by category
 * @param {string} [filters.searchText] - Case-insensitive search in description
 * @param {string} [filters.dateFrom] - Start date ISO string (inclusive)
 * @param {string} [filters.dateTo] - End date ISO string (inclusive)
 * @returns {Promise<Array<Object>>} Sorted and filtered expense records
 */
export async function getGroupExpenses(groupId, filters = {}) {
  const expenses = await getByIndex('expenses', 'groupId', groupId);
  if (!expenses || expenses.length === 0) {
    return [];
  }

  let result = expenses;

  // Filter by category
  if (filters.category) {
    result = result.filter((e) => e.category === filters.category);
  }

  // Filter by search text in description
  if (filters.searchText && typeof filters.searchText === 'string') {
    const search = filters.searchText.trim().toLowerCase();
    result = result.filter((e) => e.description && e.description.toLowerCase().includes(search));
  }

  // Filter by date range
  if (filters.dateFrom) {
    result = result.filter((e) => e.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    result = result.filter((e) => e.date <= filters.dateTo);
  }

  // Sort by date descending (secondary sort by createdAt descending)
  result.sort((a, b) => {
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  return result;
}

/**
 * Retrieves expenses for a group that occurred in the specified month and year.
 *
 * @param {string} groupId - Group ID
 * @param {number} year - Four-digit year
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @returns {Promise<Array<Object>>} Expenses in that month
 */
export async function getExpensesByMonth(groupId, year, month) {
  const expenses = await getByIndex('expenses', 'groupId', groupId);
  if (!expenses || expenses.length === 0) {
    return [];
  }

  return expenses.filter((e) => isInMonth(e.date, year, month));
}
