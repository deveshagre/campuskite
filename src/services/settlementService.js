/**
 * @file settlementService.js
 * @description Settlement service for CampusKite.
 * Manages debt settlements between members, status tracking, cancellations, and querying.
 */

import { getAll, getById, getByIndex, put } from './database.js';
import { validateAmount } from '../utils/validation.js';

/**
 * Creates a new completed settlement record between two members in a group.
 * Validates that current user is the payer and amount is positive.
 *
 * @param {string} groupId - Group ID
 * @param {string} payerId - User ID of payer
 * @param {string} receiverId - User ID of recipient
 * @param {number} amount - Amount in paise
 * @param {string} currentUserId - Currently logged in user ID
 * @returns {Promise<Object>} Created settlement record
 * @throws {Error} If payer is not current user, amount is invalid, or payer equals receiver
 */
export async function createSettlement(groupId, payerId, receiverId, amount, currentUserId) {
  if (!groupId) {
    throw new Error('Group ID is required');
  }

  if (!payerId || !receiverId) {
    throw new Error('Both payer and receiver IDs are required');
  }

  if (payerId === receiverId) {
    throw new Error('Payer and receiver cannot be the same user');
  }

  if (payerId !== currentUserId) {
    throw new Error('You can only record your own payments');
  }

  const amountError = validateAmount(amount);
  if (amountError) throw new Error(amountError);

  const integerAmount = Math.round(Number(amount));
  if (integerAmount <= 0) {
    throw new Error('Settlement amount must be greater than zero');
  }

  const settlement = {
    id: crypto.randomUUID(),
    groupId,
    payerId,
    receiverId,
    amount: integerAmount,
    status: 'completed',
    createdAt: new Date().toISOString(),
  };

  await put('settlements', settlement);
  return settlement;
}

/**
 * Cancels an existing settlement.
 * Verifies that the current user is the original payer.
 *
 * @param {string} settlementId - Settlement ID
 * @param {string} currentUserId - Currently logged in user ID
 * @returns {Promise<Object>} Updated settlement record with 'cancelled' status
 * @throws {Error} If settlement not found or current user is not the payer
 */
export async function cancelSettlement(settlementId, currentUserId) {
  const settlement = await getById('settlements', settlementId);
  if (!settlement) {
    throw new Error(`Settlement not found with id '${settlementId}'`);
  }

  if (settlement.payerId !== currentUserId) {
    throw new Error('Only the payer can cancel a settlement');
  }

  if (settlement.status === 'cancelled') {
    return settlement;
  }

  settlement.status = 'cancelled';
  settlement.cancelledAt = new Date().toISOString();
  settlement.updatedAt = new Date().toISOString();

  await put('settlements', settlement);
  return settlement;
}

/**
 * Retrieves all settlements for a specific group.
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<Array<Object>>} List of settlements
 */
export async function getGroupSettlements(groupId) {
  const settlements = await getByIndex('settlements', 'groupId', groupId);
  return settlements || [];
}

/**
 * Retrieves all settlements where the given user is either payer or receiver.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} List of settlements involving the user, sorted by date descending
 */
export async function getUserSettlements(userId) {
  if (!userId) return [];

  const allSettlements = await getAll('settlements');
  const userSettlements = allSettlements.filter(
    (s) => s.payerId === userId || s.receiverId === userId
  );

  userSettlements.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
  return userSettlements;
}

/**
 * Retrieves active (completed) settlements for a group.
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<Array<Object>>} List of active settlements
 */
export async function getPendingSettlements(groupId) {
  const settlements = await getGroupSettlements(groupId);
  return settlements.filter((s) => s.status === 'completed');
}

/**
 * Retrieves cancelled settlements for a group.
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<Array<Object>>} List of cancelled settlements
 */
export async function getCancelledSettlements(groupId) {
  const settlements = await getGroupSettlements(groupId);
  return settlements.filter((s) => s.status === 'cancelled');
}
