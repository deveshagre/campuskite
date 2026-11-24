import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../src/context/AuthContext';
import { useAuth } from '../src/hooks/useAuth';
import { getAll } from '../src/services/database';
import { register, login, getCurrentUser, logout } from '../src/services/authService';
import { createGroup, getUserGroups, addMember } from '../src/services/groupService';
import { createExpense, getGroupExpenses } from '../src/services/expenseService';
import { createSettlement, getGroupSettlements } from '../src/services/settlementService';
import {
  clearAllData,
  loadDemoData,
  removeDemoData,
  isDemoDataLoaded,
} from '../src/services/demoDataService';

describe('Production Audit Test Suite', () => {
  beforeEach(async () => {
    localStorage.clear();
    sessionStorage.clear();
    await clearAllData();
  });

  describe('1. Auto Demo Data Prevention & Isolation', () => {
    it('restoring session for a new visitor does NOT load demo data automatically', async () => {
      function TestDashboard() {
        const { user, loading } = useAuth();
        if (loading) return <div>Loading...</div>;
        return (
          <div>
            <h1>Dashboard</h1>
            <span data-testid="user-status">{user ? user.name : 'Guest User'}</span>
          </div>
        );
      }

      render(
        <BrowserRouter>
          <AuthProvider>
            <TestDashboard />
          </AuthProvider>
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // User should be null (not Alice or demo data)
      expect(screen.getByTestId('user-status').textContent).toBe('Guest User');

      // Database should be completely empty of demo data
      const isLoaded = await isDemoDataLoaded();
      expect(isLoaded).toBe(false);

      const allUsers = await getAll('users');
      expect(allUsers.length).toBe(0);

      const allGroups = await getAll('groups');
      expect(allGroups.length).toBe(0);
    });

    it('allows a genuine user to register, and their data is clean and isolated', async () => {
      const genuineUser = await register('Real Student', 'real@university.edu', 'SecurePass123!');
      expect(genuineUser.email).toBe('real@university.edu');

      // Check current session
      const current = await getCurrentUser();
      expect(current.id).toBe(genuineUser.id);
      expect(current.email).toBe('real@university.edu');

      // Groups list for genuine user is initially empty
      const groups = await getUserGroups(genuineUser.id);
      expect(groups.length).toBe(0);

      // Verify no demo records were spawned
      expect(await isDemoDataLoaded()).toBe(false);
    });
  });

  describe('2. Manual Demo Data Loading and Selective Removal', () => {
    it('loads demo data manually when explicitly requested and prevents duplicate loads', async () => {
      expect(await isDemoDataLoaded()).toBe(false);

      const result = await loadDemoData();
      expect(result.users.length).toBe(4);
      expect(result.groups.length).toBe(3);
      expect(result.expensesCount).toBeGreaterThanOrEqual(15);
      expect(await isDemoDataLoaded()).toBe(true);

      // Attempting to load demo data again should throw error to prevent duplicate pollution
      await expect(loadDemoData()).rejects.toThrow('Demo data is already loaded');
    });

    it('removes demo records WITHOUT deleting genuine user accounts, groups, or expenses', async () => {
      // 1. Create a genuine user and group first
      const genuineUser = await register('Genuine Owner', 'owner@college.edu', 'MySecret123');
      const genuineGroup = await createGroup('Real Dorm', 'Real Expenses', '#B8E0D2', genuineUser.id);
      const genuineExpense = await createExpense({
        groupId: genuineGroup.id,
        paidBy: genuineUser.id,
        amount: 50000,
        description: 'Genuine Groceries',
        category: 'Groceries',
        date: new Date().toISOString(),
        splitType: 'equal',
        participants: [genuineUser.id],
      });

      // 2. Now manually load demo data
      await loadDemoData();
      expect(await isDemoDataLoaded()).toBe(true);

      // Verify genuine user and demo users coexist
      const usersBeforeRemoval = await getAll('users');
      expect(usersBeforeRemoval.length).toBe(5); // 1 genuine + 4 demo

      // 3. Remove demo data
      const removeResult = await removeDemoData();
      expect(removeResult.deletedUsersCount).toBe(4);
      expect(removeResult.deletedGroupsCount).toBe(3);

      // 4. Verify demo data is removed
      expect(await isDemoDataLoaded()).toBe(false);

      // 5. Verify genuine user, genuine group, and genuine expense are intact!
      const usersAfter = await getAll('users');
      expect(usersAfter.length).toBe(1);
      expect(usersAfter[0].email).toBe('owner@college.edu');

      const groupsAfter = await getUserGroups(genuineUser.id);
      expect(groupsAfter.length).toBe(1);
      expect(groupsAfter[0].name).toBe('Real Dorm');

      const expensesAfter = await getGroupExpenses(genuineGroup.id);
      expect(expensesAfter.length).toBe(1);
      expect(expensesAfter[0].description).toBe('Genuine Groceries');
    });
  });

  describe('3. Financial & Settlement Operations', () => {
    it('executes group creation, member invite, expense recording, and debt settlement correctly', async () => {
      // Create two users
      const userA = await register('User A', 'usera@campus.edu', 'pass123');
      const userB = await register('User B', 'userb@campus.edu', 'pass123');

      // User A creates group and adds User B
      const group = await createGroup('Hackathon Team', 'Project costs', '#FFDE59', userA.id);
      await addMember(group.id, userB.email);

      // User A pays for entire team meal (₹1000 = 100000 paise) split equally
      const expense = await createExpense({
        groupId: group.id,
        paidBy: userA.id,
        amount: 100000,
        description: 'Team Dinner',
        category: 'Food',
        date: new Date().toISOString(),
        splitType: 'equal',
        participants: [userA.id, userB.id],
      });

      expect(expense.id).toBeDefined();

      // User B settles up with User A
      const settlement = await createSettlement(
        group.id,
        userB.id,
        userA.id,
        50000,
        userB.id
      );

      expect(settlement.status).toBe('completed');
      expect(settlement.amount).toBe(50000);

      const groupSettlements = await getGroupSettlements(group.id);
      expect(groupSettlements.length).toBe(1);
      expect(groupSettlements[0].id).toBe(settlement.id);
    });
  });
});
