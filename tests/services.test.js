import { describe, it, expect, beforeEach } from 'vitest';
import {
  getDB,
  getAll,
  getById,
  getByIndex,
  add,
  put,
  remove,
  clearStore,
} from '../src/services/database.js';
import {
  getAllRecords,
  getRecord,
  queryByIndex,
  createRecord,
  updateRecord,
  deleteRecord,
  clearAllStores,
  exportAllData,
  importAllData,
} from '../src/services/storageService.js';
import {
  register,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
  hashPassword,
  generateSalt,
  hexEncode,
  hexDecode,
} from '../src/services/authService.js';
import {
  createGroup,
  updateGroup,
  deleteGroup,
  getGroup,
  getUserGroups,
  addMember,
  removeMember,
  getGroupMembers,
  isGroupMember,
} from '../src/services/groupService.js';
import {
  createExpense,
  updateExpense,
  deleteExpense,
  getExpense,
  getGroupExpenses,
  getExpensesByMonth,
} from '../src/services/expenseService.js';
import {
  createSettlement,
  cancelSettlement,
  getGroupSettlements,
  getUserSettlements,
  getPendingSettlements,
  getCancelledSettlements,
} from '../src/services/settlementService.js';
import {
  getMonthlyReport,
  getSpendingTrend,
  getAvailableMonths,
} from '../src/services/reportService.js';
import {
  loadDemoData,
  clearAllData,
  isDemoDataLoaded,
  DEMO_USERS,
} from '../src/services/demoDataService.js';

describe('Database and Storage Services', () => {
  beforeEach(async () => {
    await clearAllStores();
    localStorage.clear();
  });

  it('database.js CRUD operations', async () => {
    const db = await getDB();
    expect(db.name).toBe('campuskite-db');

    // Add and getById
    await add('users', { id: 'u1', name: 'User 1', email: 'u1@campus.edu' });
    const user = await getById('users', 'u1');
    expect(user.name).toBe('User 1');

    // getByIndex
    const byEmail = await getByIndex('users', 'email', 'u1@campus.edu');
    expect(byEmail.length).toBe(1);
    expect(byEmail[0].id).toBe('u1');

    // put
    await put('users', { id: 'u1', name: 'User One Updated', email: 'u1@campus.edu' });
    const updated = await getById('users', 'u1');
    expect(updated.name).toBe('User One Updated');

    // getAll
    const all = await getAll('users');
    expect(all.length).toBe(1);

    // remove
    await remove('users', 'u1');
    const afterRemove = await getById('users', 'u1');
    expect(afterRemove).toBeUndefined();

    // clearStore
    await add('users', { id: 'u2', name: 'User 2', email: 'u2@campus.edu' });
    await clearStore('users');
    const afterClear = await getAll('users');
    expect(afterClear.length).toBe(0);
  });

  it('storageService operations, export and import', async () => {
    const record = await createRecord('groups', { name: 'Flat 101' });
    expect(record.id).toBeDefined();
    expect(record.createdAt).toBeDefined();

    const fetched = await getRecord('groups', record.id);
    expect(fetched.name).toBe('Flat 101');

    const updated = await updateRecord('groups', record.id, { name: 'Flat 102' });
    expect(updated.name).toBe('Flat 102');
    expect(updated.updatedAt).toBeDefined();

    const queryResult = await queryByIndex('groups', 'createdBy', record.createdBy || undefined);
    expect(Array.isArray(queryResult)).toBe(true);

    const exported = await exportAllData();
    expect(exported.groups.length).toBe(1);
    expect(exported.groups[0].name).toBe('Flat 102');

    await deleteRecord('groups', record.id);
    expect(await getRecord('groups', record.id)).toBeUndefined();

    // Import back
    await importAllData(exported);
    const reImported = await getAllRecords('groups');
    expect(reImported.length).toBe(1);
    expect(reImported[0].name).toBe('Flat 102');
  });
});

describe('Auth Service', () => {
  beforeEach(async () => {
    await clearAllStores();
    localStorage.clear();
  });

  it('hexEncode and hexDecode work symmetrically', () => {
    const original = new Uint8Array([0, 15, 255, 128, 42]);
    const hex = hexEncode(original);
    expect(hex).toBe('000fff802a');
    const decoded = hexDecode(hex);
    expect(Array.from(decoded)).toEqual(Array.from(original));
  });

  it('generates random salt and hashes password with PBKDF2', async () => {
    const salt = generateSalt();
    expect(salt).toHaveLength(32);
    const hash1 = await hashPassword('password123', salt);
    const hash2 = await hashPassword('password123', salt);
    expect(hash1).toBe(hash2);

    const salt2 = generateSalt();
    const hash3 = await hashPassword('password123', salt2);
    expect(hash1).not.toBe(hash3);
  });

  it('registers user, logs in, manages session, and logs out', async () => {
    const user = await register('Alice Student', 'alice@college.edu', 'secret123');
    expect(user.id).toBeDefined();
    expect(user.email).toBe('alice@college.edu');
    expect(user.passwordHash).toBeUndefined(); // Sensitive fields stripped
    expect(user.salt).toBeUndefined();

    // Check duplicate email
    await expect(register('Alice Two', 'alice@college.edu', 'secret123')).rejects.toThrow(
      'already exists'
    );

    // getCurrentUser
    const current = await getCurrentUser();
    expect(current).not.toBeNull();
    expect(current.email).toBe('alice@college.edu');

    // Logout
    logout();
    expect(await getCurrentUser()).toBeNull();

    // Login with valid credentials
    const loggedIn = await login('alice@college.edu', 'secret123');
    expect(loggedIn.id).toBe(user.id);
    expect(await getCurrentUser()).not.toBeNull();

    // Login with invalid credentials
    await expect(login('alice@college.edu', 'wrongpass')).rejects.toThrow(
      'Invalid email or password'
    );
  });

  it('updates profile and changes password', async () => {
    const user = await register('Bob Student', 'bob@college.edu', 'pass123');
    const updated = await updateProfile(user.id, { name: 'Robert Student' });
    expect(updated.name).toBe('Robert Student');

    // Change password with wrong old password
    await expect(changePassword(user.id, 'wrongold', 'newpass123')).rejects.toThrow(
      'Current password is incorrect'
    );

    // Change password successfully
    await changePassword(user.id, 'pass123', 'newpass123');
    const loginOk = await login('bob@college.edu', 'newpass123');
    expect(loginOk.id).toBe(user.id);
  });
});

describe('Group and Expense Services', () => {
  beforeEach(async () => {
    await clearAllStores();
    localStorage.clear();
  });

  it('creates group, updates group, and manages members', async () => {
    const alice = await register('Alice', 'alice@edu.in', 'pass123');
    const bob = await register('Bob', 'bob@edu.in', 'pass123');

    const group = await createGroup('Hostel Room 12', 'Fun times', '#FFDE59', alice.id);
    expect(group.id).toBeDefined();
    expect(await isGroupMember(group.id, alice.id)).toBe(true);

    const fetchedGroup = await getGroup(group.id);
    expect(fetchedGroup.name).toBe('Hostel Room 12');

    const updatedGroup = await updateGroup(group.id, { name: 'Hostel Room 12 Deluxe' });
    expect(updatedGroup.name).toBe('Hostel Room 12 Deluxe');

    // Add Bob
    await addMember(group.id, 'bob@edu.in');
    expect(await isGroupMember(group.id, bob.id)).toBe(true);

    // Prevent duplicate member
    await expect(addMember(group.id, 'bob@edu.in')).rejects.toThrow('already a member');

    const members = await getGroupMembers(group.id);
    expect(members.length).toBe(2);

    const userGroups = await getUserGroups(bob.id);
    expect(userGroups.length).toBe(1);
    expect(userGroups[0].name).toBe('Hostel Room 12 Deluxe');
  });

  it('creates, updates, and deletes expenses', async () => {
    const alice = await register('Alice', 'alice@edu.in', 'pass123');
    const bob = await register('Bob', 'bob@edu.in', 'pass123');
    const charlie = await register('Charlie', 'charlie@edu.in', 'pass123');

    const group = await createGroup('Study Room', '', '#FFDE59', alice.id);
    await addMember(group.id, bob.email);
    await addMember(group.id, charlie.email);

    // Equal split: ₹300 (30000 paise) among 3 users -> 10000 paise each
    const exp1 = await createExpense({
      groupId: group.id,
      description: 'Whiteboard markers',
      amount: 30000,
      category: 'Supplies',
      paidBy: alice.id,
      date: '2026-11-05',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    });
    expect(exp1.splits.length).toBe(3);
    expect(exp1.splits[0].amount).toBe(10000);

    // Update expense description and amount
    const updatedExp = await updateExpense(exp1.id, {
      description: 'Markers and Eraser',
      amount: 36000,
      participants: [alice.id, bob.id, charlie.id],
      splitType: 'equal',
    });
    expect(updatedExp.description).toBe('Markers and Eraser');
    expect(updatedExp.amount).toBe(36000);

    // Custom split: ₹250 (25000 paise) split 10000, 10000, 5000
    const exp2 = await createExpense({
      groupId: group.id,
      description: 'Snacks',
      amount: 25000,
      category: 'Food',
      paidBy: bob.id,
      date: '2026-11-10',
      splitType: 'custom',
      participants: [alice.id, bob.id, charlie.id],
      customAmounts: {
        [alice.id]: 10000,
        [bob.id]: 10000,
        [charlie.id]: 5000,
      },
    });
    expect(exp2.splits.length).toBe(3);
    const charlieSplit = exp2.splits.find((s) => s.userId === charlie.id);
    expect(charlieSplit.amount).toBe(5000);

    // Query expenses by month
    const novExpenses = await getExpensesByMonth(group.id, 2026, 10);
    expect(novExpenses.length).toBe(2);

    // Filter group expenses
    const suppliesExpenses = await getGroupExpenses(group.id, { category: 'Supplies' });
    expect(suppliesExpenses.length).toBe(1);

    const searchExpenses = await getGroupExpenses(group.id, { searchText: 'Eraser' });
    expect(searchExpenses.length).toBe(1);

    // Get single expense
    const single = await getExpense(exp1.id);
    expect(single.description).toBe('Markers and Eraser');
    expect(single.splits.length).toBe(3);

    // Only payer can delete
    await expect(deleteExpense(exp1.id, bob.id)).rejects.toThrow('Only the member who paid');
    await deleteExpense(exp1.id, alice.id);
    expect(await getExpense(exp1.id)).toBeNull();
  });

  it('prevents deleting group or removing member with outstanding balances', async () => {
    const alice = await register('Alice', 'alice@edu.in', 'pass123');
    const bob = await register('Bob', 'bob@edu.in', 'pass123');

    const group = await createGroup('Trip', '', '#FFDE59', alice.id);
    await addMember(group.id, bob.email);

    await createExpense({
      groupId: group.id,
      description: 'Cab fare',
      amount: 10000,
      category: 'Travel',
      paidBy: alice.id,
      splitType: 'equal',
      participants: [alice.id, bob.id],
    });

    await expect(deleteGroup(group.id)).rejects.toThrow('outstanding balances');
    await expect(removeMember(group.id, bob.id)).rejects.toThrow('non-zero balance');
  });
});

describe('Settlement and Report Services', () => {
  beforeEach(async () => {
    await clearAllStores();
    localStorage.clear();
  });

  it('settlement lifecycle: create, query, cancel', async () => {
    const alice = await register('Alice', 'alice@edu.in', 'pass123');
    const bob = await register('Bob', 'bob@edu.in', 'pass123');
    const group = await createGroup('Flat', '', '#FFDE59', alice.id);
    await addMember(group.id, bob.email);

    // Alice cannot mark Bob's payment
    await expect(
      createSettlement(group.id, bob.id, alice.id, 5000, alice.id)
    ).rejects.toThrow('own payments');

    // Bob marks his payment of ₹50 to Alice
    const settlement = await createSettlement(group.id, bob.id, alice.id, 5000, bob.id);
    expect(settlement.status).toBe('completed');

    const groupSettlements = await getGroupSettlements(group.id);
    expect(groupSettlements.length).toBe(1);

    const userSettlements = await getUserSettlements(alice.id);
    expect(userSettlements.length).toBe(1);

    const pending = await getPendingSettlements(group.id);
    expect(pending.length).toBe(1);

    // Alice cannot cancel Bob's payment
    await expect(cancelSettlement(settlement.id, alice.id)).rejects.toThrow(
      'Only the payer can cancel'
    );

    // Bob cancels payment
    const cancelled = await cancelSettlement(settlement.id, bob.id);
    expect(cancelled.status).toBe('cancelled');

    const cancelledList = await getCancelledSettlements(group.id);
    expect(cancelledList.length).toBe(1);
  });

  it('generates monthly report and spending trends accurately', async () => {
    const alice = await register('Alice', 'alice@edu.in', 'pass123');
    const bob = await register('Bob', 'bob@edu.in', 'pass123');
    const group = await createGroup('Flat', '', '#FFDE59', alice.id);
    await addMember(group.id, bob.email);

    // Expense 1: Nov 2026, ₹1,000 Food split equally (Alice share: ₹500 = 50000 paise)
    await createExpense({
      groupId: group.id,
      description: 'Dinner',
      amount: 100000,
      category: 'Food',
      paidBy: bob.id,
      date: '2026-11-10',
      splitType: 'equal',
      participants: [alice.id, bob.id],
    });

    // Expense 2: Nov 2026, ₹600 Groceries split equally (Alice share: ₹300 = 30000 paise)
    await createExpense({
      groupId: group.id,
      description: 'Supermarket',
      amount: 60000,
      category: 'Groceries',
      paidBy: alice.id,
      date: '2026-11-15',
      splitType: 'equal',
      participants: [alice.id, bob.id],
    });

    const report = await getMonthlyReport(alice.id, 2026, 10); // 10 = Nov
    expect(report.totalSpending).toBe(80000); // 50000 + 30000
    expect(report.expenseCount).toBe(2);
    expect(report.highestCategory).toBe('Food');
    expect(report.categoryBreakdown['Food']).toBe(50000);
    expect(report.categoryBreakdown['Groceries']).toBe(30000);
    expect(report.avgPerExpense).toBe(40000); // 80000 / 2

    const trend = await getSpendingTrend(alice.id, 3);
    expect(trend.length).toBe(3);

    const availableMonths = await getAvailableMonths(alice.id);
    expect(availableMonths.length).toBe(1);
    expect(availableMonths[0].year).toBe(2026);
    expect(availableMonths[0].month).toBe(10);
  });
});

describe('Demo Data Service', () => {
  beforeEach(async () => {
    await clearAllData();
  });

  it('loads and verifies full realistic demo dataset', async () => {
    expect(await isDemoDataLoaded()).toBe(false);

    const result = await loadDemoData();
    expect(result.users.length).toBe(4);
    expect(result.groups.length).toBe(3);
    expect(result.expensesCount).toBeGreaterThanOrEqual(15);
    expect(result.settlementsCount).toBe(4);

    expect(await isDemoDataLoaded()).toBe(true);

    // Verify all 4 users can login with 'demo123'
    for (const demoUser of DEMO_USERS) {
      const user = await login(demoUser.email, demoUser.password);
      expect(user.name).toBe(demoUser.name);
    }

    // Verify groups and memberships
    const allGroups = await getAllRecords('groups');
    expect(allGroups.length).toBe(3);

    const allExpenses = await getAllRecords('expenses');
    expect(allExpenses.length).toBeGreaterThanOrEqual(15);

    const allSettlements = await getAllRecords('settlements');
    expect(allSettlements.length).toBe(4);
    const completed = allSettlements.filter((s) => s.status === 'completed');
    const cancelled = allSettlements.filter((s) => s.status === 'cancelled');
    expect(completed.length).toBe(3);
    expect(cancelled.length).toBe(1);

    // Clear all data
    await clearAllData();
    expect(await isDemoDataLoaded()).toBe(false);
  });
});
