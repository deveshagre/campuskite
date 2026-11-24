/**
 * @file demoDataService.js
 * @description Generates realistic demo data for CampusKite.
 * Populates 4 demo users ("demo123"), 3 student groups, 18 expenses across 3 months, and settlements.
 */

import { register, SESSION_KEY, logout, getCurrentUser } from './authService.js';
import { createGroup, addMember } from './groupService.js';
import { createExpense } from './expenseService.js';
import { createSettlement, cancelSettlement } from './settlementService.js';
import { clearAllStores } from './storageService.js';
import { get, getByIndex, getAll, put, remove } from './database.js';

export const DEMO_EMAILS = [
  'alice@campus.edu',
  'bob@campus.edu',
  'charlie@campus.edu',
  'diana@campus.edu',
];

export const DEMO_USERS = [
  { name: 'Alice Johnson', email: 'alice@campus.edu', password: 'demo123' },
  { name: 'Bob Smith', email: 'bob@campus.edu', password: 'demo123' },
  { name: 'Charlie Brown', email: 'charlie@campus.edu', password: 'demo123' },
  { name: 'Diana Ross', email: 'diana@campus.edu', password: 'demo123' },
];

/**
 * Checks whether demo data is already loaded in the database.
 *
 * @returns {Promise<boolean>} True if demo users are found
 */
export async function isDemoDataLoaded() {
  try {
    for (const email of DEMO_EMAILS) {
      const existing = await getByIndex('users', 'email', email);
      if (Array.isArray(existing) && existing.length > 0) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Clears all stores in IndexedDB and removes localStorage session data.
 *
 * @returns {Promise<void>}
 */
export async function clearAllData() {
  await clearAllStores();
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
}

/**
 * Removes ONLY demo records from IndexedDB without affecting genuine user data.
 * Deletes demo users, demo groups, associated group memberships, expenses, splits, and settlements.
 *
 * @returns {Promise<{ deletedUsersCount: number, deletedGroupsCount: number }>}
 */
export async function removeDemoData() {
  // 1. Identify demo users
  const allUsers = await getAll('users');
  const demoUsers = allUsers.filter(
    (u) => u.isDemo || DEMO_EMAILS.includes((u.email || '').toLowerCase())
  );
  const demoUserIds = new Set(demoUsers.map((u) => u.id));

  // 2. Identify demo groups
  const allGroups = await getAll('groups');
  const demoGroups = allGroups.filter(
    (g) => g.isDemo || demoUserIds.has(g.createdBy)
  );
  const demoGroupIds = new Set(demoGroups.map((g) => g.id));

  // 3. Remove demo group members
  const allMembers = await getAll('groupMembers');
  for (const m of allMembers) {
    if (m.isDemo || demoGroupIds.has(m.groupId) || demoUserIds.has(m.userId)) {
      await remove('groupMembers', m.id).catch(() => {});
    }
  }

  // 4. Remove demo expenses and splits
  const allExpenses = await getAll('expenses');
  const deletedExpenseIds = new Set();
  for (const exp of allExpenses) {
    if (exp.isDemo || demoGroupIds.has(exp.groupId) || demoUserIds.has(exp.paidBy)) {
      deletedExpenseIds.add(exp.id);
      await remove('expenses', exp.id).catch(() => {});
      if (exp.receiptId) {
        await remove('receipts', exp.receiptId).catch(() => {});
      }
    }
  }

  const allSplits = await getAll('expenseSplits');
  for (const s of allSplits) {
    if (s.isDemo || deletedExpenseIds.has(s.expenseId) || demoUserIds.has(s.userId)) {
      await remove('expenseSplits', s.id).catch(() => {});
    }
  }

  // 5. Remove demo settlements
  const allSettlements = await getAll('settlements');
  for (const st of allSettlements) {
    if (
      st.isDemo ||
      demoGroupIds.has(st.groupId) ||
      demoUserIds.has(st.payerId) ||
      demoUserIds.has(st.receiverId)
    ) {
      await remove('settlements', st.id).catch(() => {});
    }
  }

  // 6. Remove demo groups
  for (const g of demoGroups) {
    await remove('groups', g.id).catch(() => {});
  }

  // 7. Remove demo users
  for (const u of demoUsers) {
    await remove('users', u.id).catch(() => {});
  }

  // 8. If active session is a demo user, log out
  const currentSession = await getCurrentUser().catch(() => null);
  if (currentSession && demoUserIds.has(currentSession.id)) {
    logout();
  }

  return {
    deletedUsersCount: demoUsers.length,
    deletedGroupsCount: demoGroups.length,
  };
}

/**
 * Populates realistic demo dataset without deleting existing user data:
 * - 4 users with PBKDF2 hashed passwords ("demo123")
 * - 3 student groups ("Apartment 4B", "Road Trip Squad", "Study Group")
 * - 18 expenses spanning September, October, and November 2026 with varied categories & split types
 * - 4 settlements (3 completed, 1 cancelled)
 *
 * @returns {Promise<{ users: Array<Object>, groups: Array<Object>, expensesCount: number, settlementsCount: number }>}
 */
export async function loadDemoData() {
  // Prevent duplicate demo data
  if (await isDemoDataLoaded()) {
    throw new Error('Demo data is already loaded in the application.');
  }

  // Check if a real user is currently logged in before creating demo data
  const existingLoggedInUser = await getCurrentUser().catch(() => null);

  // 1. Register 4 users
  const alice = await register('Alice Johnson', 'alice@campus.edu', 'demo123');
  const bob = await register('Bob Smith', 'bob@campus.edu', 'demo123');
  const charlie = await register('Charlie Brown', 'charlie@campus.edu', 'demo123');
  const diana = await register('Diana Ross', 'diana@campus.edu', 'demo123');

  // Tag demo users (preserving passwordHash and salt)
  const tagDemoUser = async (user) => {
    const raw = await get('users', user.id);
    if (raw) await put('users', { ...raw, isDemo: true });
  };
  await tagDemoUser(alice);
  await tagDemoUser(bob);
  await tagDemoUser(charlie);
  await tagDemoUser(diana);

  // 2. Create 3 groups
  // Group 1: Apartment 4B (Alice, Bob, Charlie)
  const aptGroup = await createGroup(
    'Apartment 4B',
    'Flatmate expenses, rent, groceries, and utilities',
    '#FFDE59',
    alice.id
  );
  await put('groups', { ...aptGroup, isDemo: true });
  await addMember(aptGroup.id, bob.email);
  await addMember(aptGroup.id, charlie.email);

  // Group 2: Road Trip Squad (Alice, Bob, Diana)
  const roadTripGroup = await createGroup(
    'Road Trip Squad',
    'Weekend getaway to Goa - fuel, stays & beach food',
    '#B8E0D2',
    alice.id
  );
  await put('groups', { ...roadTripGroup, isDemo: true });
  await addMember(roadTripGroup.id, bob.email);
  await addMember(roadTripGroup.id, diana.email);

  // Group 3: Study Group (All 4)
  const studyGroup = await createGroup(
    'Study Group',
    'Textbooks, shared cloud servers, and hackathon snacks',
    '#FF8066',
    alice.id
  );
  await put('groups', { ...studyGroup, isDemo: true });
  await addMember(studyGroup.id, bob.email);
  await addMember(studyGroup.id, charlie.email);
  await addMember(studyGroup.id, diana.email);

  // 3. Create 18 Expenses across 3 months (September, October, November 2026)
  const expenseData = [
    // --- September 2026 ---
    {
      groupId: aptGroup.id,
      description: 'High-speed Fiber Internet (Sep)',
      amount: 120000, // ₹1,200
      category: 'Utilities',
      paidBy: alice.id,
      date: '2026-09-05',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: aptGroup.id,
      description: 'Monthly Supermarket Staples',
      amount: 365000, // ₹3,650
      category: 'Groceries',
      paidBy: bob.id,
      date: '2026-09-12',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: studyGroup.id,
      description: 'Operating Systems Textbooks',
      amount: 240000, // ₹2,400
      category: 'Supplies',
      paidBy: charlie.id,
      date: '2026-09-18',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id, diana.id],
    },
    {
      groupId: roadTripGroup.id,
      description: 'Pre-trip Car Wheel Alignment & Servicing',
      amount: 450000, // ₹4,500
      category: 'Travel',
      paidBy: bob.id,
      date: '2026-09-24',
      splitType: 'equal',
      participants: [alice.id, bob.id, diana.id],
    },
    {
      groupId: aptGroup.id,
      description: 'Broom, Mop & Kitchen Detergents',
      amount: 85000, // ₹850
      category: 'Household',
      paidBy: alice.id,
      date: '2026-09-28',
      splitType: 'custom',
      participants: [alice.id, bob.id, charlie.id],
      customAmounts: {
        [alice.id]: 25000,
        [bob.id]: 30000,
        [charlie.id]: 30000,
      },
    },

    // --- October 2026 ---
    {
      groupId: roadTripGroup.id,
      description: 'Expressway Toll Booth Charges',
      amount: 68000, // ₹680
      category: 'Travel',
      paidBy: diana.id,
      date: '2026-10-02',
      splitType: 'equal',
      participants: [alice.id, bob.id, diana.id],
    },
    {
      groupId: roadTripGroup.id,
      description: 'Goa Beach Resort Villa Booking',
      amount: 1500000, // ₹15,000
      category: 'Travel',
      paidBy: alice.id,
      date: '2026-10-03',
      splitType: 'equal',
      participants: [alice.id, bob.id, diana.id],
    },
    {
      groupId: roadTripGroup.id,
      description: 'Seafood Shack Beach Dinner',
      amount: 330000, // ₹3,300
      category: 'Food',
      paidBy: bob.id,
      date: '2026-10-04',
      splitType: 'custom',
      participants: [alice.id, bob.id, diana.id],
      customAmounts: {
        [alice.id]: 100000,
        [bob.id]: 130000,
        [diana.id]: 100000,
      },
    },
    {
      groupId: aptGroup.id,
      description: 'October Electricity & Water Bill',
      amount: 210000, // ₹2,100
      category: 'Utilities',
      paidBy: charlie.id,
      date: '2026-10-10',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: studyGroup.id,
      description: 'AWS Cloud Credit Voucher',
      amount: 160000, // ₹1,600
      category: 'Technology',
      paidBy: diana.id,
      date: '2026-10-15',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id, diana.id],
    },
    {
      groupId: aptGroup.id,
      description: 'Mineral Water 20L Jars Refill',
      amount: 60000, // ₹600
      category: 'Groceries',
      paidBy: bob.id,
      date: '2026-10-22',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: studyGroup.id,
      description: 'Midterm Study Group Pizza Feast',
      amount: 180000, // ₹1,800
      category: 'Food',
      paidBy: alice.id,
      date: '2026-10-29',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id, diana.id],
    },

    // --- November 2026 ---
    {
      groupId: aptGroup.id,
      description: 'High-speed Fiber Internet (Nov)',
      amount: 120000, // ₹1,200
      category: 'Utilities',
      paidBy: alice.id,
      date: '2026-11-04',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: roadTripGroup.id,
      description: 'Petrol Tank Refill on Return Journey',
      amount: 350000, // ₹3,500
      category: 'Travel',
      paidBy: diana.id,
      date: '2026-11-08',
      splitType: 'equal',
      participants: [alice.id, bob.id, diana.id],
    },
    {
      groupId: studyGroup.id,
      description: 'Color Printing for Final Project Packets',
      amount: 90000, // ₹900
      category: 'Supplies',
      paidBy: charlie.id,
      date: '2026-11-12',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id, diana.id],
    },
    {
      groupId: aptGroup.id,
      description: 'Sunday Rooftop BBQ Party',
      amount: 270000, // ₹2,700
      category: 'Food',
      paidBy: bob.id,
      date: '2026-11-15',
      splitType: 'custom',
      participants: [alice.id, bob.id, charlie.id],
      customAmounts: {
        [alice.id]: 80000,
        [bob.id]: 110000,
        [charlie.id]: 80000,
      },
    },
    {
      groupId: aptGroup.id,
      description: 'Evening Snacks, Chips & Soda',
      amount: 75000, // ₹750
      category: 'Groceries',
      paidBy: charlie.id,
      date: '2026-11-20',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id],
    },
    {
      groupId: studyGroup.id,
      description: 'Hackathon Midnight Cold Brews',
      amount: 140000, // ₹1,400
      category: 'Food',
      paidBy: alice.id,
      date: '2026-11-22',
      splitType: 'equal',
      participants: [alice.id, bob.id, charlie.id, diana.id],
    },
  ];

  for (const exp of expenseData) {
    const createdExp = await createExpense(exp);
    if (createdExp?.id) {
      await put('expenses', { ...createdExp, isDemo: true });
    }
  }

  // 4. Create Settlements (3 completed, 1 cancelled)
  // Settlement 1 (completed): Charlie pays Alice ₹400 in Apartment 4B
  const st1 = await createSettlement(aptGroup.id, charlie.id, alice.id, 40000, charlie.id);
  await put('settlements', { ...st1, isDemo: true });

  // Settlement 2 (completed): Diana pays Alice ₹2,500 in Road Trip Squad
  const st2 = await createSettlement(roadTripGroup.id, diana.id, alice.id, 250000, diana.id);
  await put('settlements', { ...st2, isDemo: true });

  // Settlement 3 (completed): Bob pays Charlie ₹500 in Study Group
  const st3 = await createSettlement(studyGroup.id, bob.id, charlie.id, 50000, bob.id);
  await put('settlements', { ...st3, isDemo: true });

  // Settlement 4 (cancelled): Bob pays Charlie ₹300 in Apartment 4B, then cancels
  const s4 = await createSettlement(aptGroup.id, bob.id, charlie.id, 30000, bob.id);
  const cancelledS4 = await cancelSettlement(s4.id, bob.id);
  await put('settlements', { ...cancelledS4, isDemo: true });

  // Only switch active session to Alice if no genuine user was logged in
  if (!existingLoggedInUser && typeof localStorage !== 'undefined') {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: alice.id, loginTime: new Date().toISOString() })
    );
  }

  return {
    users: [alice, bob, charlie, diana],
    groups: [aptGroup, roadTripGroup, studyGroup],
    expensesCount: expenseData.length,
    settlementsCount: 4,
  };
}
