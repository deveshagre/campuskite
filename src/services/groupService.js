/**
 * @file groupService.js
 * @description Group management service for CampusKite.
 * Handles group creation, membership management, balance verification, and group deletion.
 */

import { getAll, getById, getByIndex, put, remove } from './database.js';
import { calculateMemberBalances } from '../utils/calculations.js';
import { validateRequired } from '../utils/validation.js';

/**
 * Creates a new expense group and automatically adds the creator as the first member.
 *
 * @param {string} name - Group name
 * @param {string} [description=''] - Group description
 * @param {string} [color='#FFDE59'] - Hex color code for neobrutalist theme
 * @param {string} createdBy - User ID or email of the creator
 * @returns {Promise<Object>} Created group record
 * @throws {Error} If name is invalid or creator cannot be identified
 */
export async function createGroup(name, description = '', color = '#FFDE59', createdBy) {
  const nameError = validateRequired(name, 'Group name');
  if (nameError) throw new Error(nameError);

  if (!createdBy) {
    throw new Error('Group creator is required');
  }

  // Find creator user record (whether createdBy is userId or email)
  let creatorUser = await getById('users', createdBy);
  if (!creatorUser) {
    const users = await getByIndex('users', 'email', String(createdBy).trim().toLowerCase());
    creatorUser = users && users[0];
  }

  if (!creatorUser) {
    throw new Error(`Creator user could not be found with id or email '${createdBy}'`);
  }

  const groupId = crypto.randomUUID();
  const group = {
    id: groupId,
    name: name.trim(),
    description: (description || '').trim(),
    color: color || '#FFDE59',
    createdBy: creatorUser.id,
    createdAt: new Date().toISOString(),
  };

  await put('groups', group);

  // Auto-add creator as first member via addMember
  await addMember(groupId, creatorUser.email);

  return group;
}

/**
 * Updates group properties (name, description, color).
 *
 * @param {string} groupId - Group ID
 * @param {{ name?: string, description?: string, color?: string }} updates - Updates
 * @returns {Promise<Object>} Updated group record
 * @throws {Error} If group not found
 */
export async function updateGroup(groupId, updates = {}) {
  const group = await getById('groups', groupId);
  if (!group) {
    throw new Error(`Group not found with id '${groupId}'`);
  }

  if (updates.name !== undefined) {
    const nameError = validateRequired(updates.name, 'Group name');
    if (nameError) throw new Error(nameError);
    group.name = updates.name.trim();
  }

  if (updates.description !== undefined) {
    group.description = String(updates.description || '').trim();
  }

  if (updates.color !== undefined) {
    group.color = updates.color || '#FFDE59';
  }

  group.updatedAt = new Date().toISOString();
  await put('groups', group);

  return group;
}

/**
 * Deletes a group and all its associated data (members, expenses, splits, settlements, receipts).
 * Blocks deletion if any member has an outstanding non-zero balance.
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<boolean>} True on successful deletion
 * @throws {Error} If group not found or members have outstanding balances
 */
export async function deleteGroup(groupId) {
  const group = await getById('groups', groupId);
  if (!group) {
    throw new Error(`Group not found with id '${groupId}'`);
  }

  // Fetch all group expenses, splits, and settlements
  const expenses = await getByIndex('expenses', 'groupId', groupId);
  const splits = [];
  for (const exp of expenses) {
    const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
    splits.push(...expSplits);
  }
  const settlements = await getByIndex('settlements', 'groupId', groupId);

  // Check if any member has an outstanding balance
  const balances = calculateMemberBalances(expenses, splits, settlements);
  const hasOutstandingBalance = Object.values(balances).some((balance) => balance !== 0);

  if (hasOutstandingBalance) {
    throw new Error('Cannot delete group with outstanding balances');
  }

  // Delete all expense splits
  for (const split of splits) {
    await remove('expenseSplits', split.id);
  }

  // Delete all group expenses and their receipts
  for (const exp of expenses) {
    if (exp.receiptId) {
      await remove('receipts', exp.receiptId);
    }
    await remove('expenses', exp.id);
  }

  // Delete any remaining group receipts
  const allReceipts = await getAll('receipts');
  for (const receipt of allReceipts) {
    if (receipt.groupId === groupId) {
      await remove('receipts', receipt.id);
    }
  }

  // Delete all settlements
  for (const settlement of settlements) {
    await remove('settlements', settlement.id);
  }

  // Delete all group members
  const members = await getByIndex('groupMembers', 'groupId', groupId);
  for (const member of members) {
    await remove('groupMembers', member.id);
  }

  // Delete the group record itself
  await remove('groups', groupId);

  return true;
}

/**
 * Retrieves a single group by its ID.
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<Object|null>} Group object or null
 */
export async function getGroup(groupId) {
  const group = await getById('groups', groupId);
  return group || null;
}

/**
 * Retrieves all groups that a user is a member of.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<Object>>} List of groups
 */
export async function getUserGroups(userId) {
  if (!userId) return [];

  const memberships = await getByIndex('groupMembers', 'userId', userId);
  if (!memberships || memberships.length === 0) {
    return [];
  }

  const groups = [];
  for (const m of memberships) {
    const group = await getById('groups', m.groupId);
    if (group) {
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Adds a new member to a group by their registered email address.
 *
 * @param {string} groupId - Group ID
 * @param {string} email - Registered user email
 * @returns {Promise<Object>} Created groupMember record
 * @throws {Error} If user not found, already member, or group does not exist
 */
export async function addMember(groupId, email) {
  if (!email || typeof email !== 'string') {
    throw new Error('A valid email is required to add a member');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await getByIndex('users', 'email', normalizedEmail);
  const user = users && users[0];

  if (!user) {
    throw new Error(`User not found with email '${email}'`);
  }

  const group = await getById('groups', groupId);
  if (!group) {
    throw new Error(`Group not found with id '${groupId}'`);
  }

  const currentMembers = await getByIndex('groupMembers', 'groupId', groupId);
  const isAlreadyMember = currentMembers.some((m) => m.userId === user.id);

  if (isAlreadyMember) {
    throw new Error('User is already a member of this group');
  }

  const newMember = {
    id: crypto.randomUUID(),
    groupId,
    userId: user.id,
    joinedAt: new Date().toISOString(),
  };

  await put('groupMembers', newMember);
  return newMember;
}

/**
 * Removes a member from a group if their balance is zero.
 *
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<boolean>} True on success
 * @throws {Error} If member has non-zero balance or membership not found
 */
export async function removeMember(groupId, userId) {
  // Check member balance
  const expenses = await getByIndex('expenses', 'groupId', groupId);
  const splits = [];
  for (const exp of expenses) {
    const expSplits = await getByIndex('expenseSplits', 'expenseId', exp.id);
    splits.push(...expSplits);
  }
  const settlements = await getByIndex('settlements', 'groupId', groupId);

  const balances = calculateMemberBalances(expenses, splits, settlements);
  if (balances[userId] && balances[userId] !== 0) {
    throw new Error('Cannot remove member with non-zero balance');
  }

  const currentMembers = await getByIndex('groupMembers', 'groupId', groupId);
  const memberRecord = currentMembers.find((m) => m.userId === userId);

  if (!memberRecord) {
    throw new Error(`Membership not found for user '${userId}' in group '${groupId}'`);
  }

  await remove('groupMembers', memberRecord.id);
  return true;
}

/**
 * Retrieves all members of a group with their user details (id, name, email).
 *
 * @param {string} groupId - Group ID
 * @returns {Promise<Array<Object>>} List of enriched member objects
 */
export async function getGroupMembers(groupId) {
  const memberRecords = await getByIndex('groupMembers', 'groupId', groupId);
  if (!memberRecords || memberRecords.length === 0) {
    return [];
  }

  const members = [];
  for (const m of memberRecords) {
    const user = await getById('users', m.userId);
    members.push({
      id: m.id,
      groupId: m.groupId,
      userId: m.userId,
      name: user ? user.name : 'Unknown User',
      email: user ? user.email : '',
      joinedAt: m.joinedAt,
    });
  }

  return members;
}

/**
 * Checks if a user is a member of the given group.
 *
 * @param {string} groupId - Group ID
 * @param {string} userId - User ID
 * @returns {Promise<boolean>} True if member, false otherwise
 */
export async function isGroupMember(groupId, userId) {
  if (!groupId || !userId) return false;
  const members = await getByIndex('groupMembers', 'groupId', groupId);
  return members.some((m) => m.userId === userId);
}
