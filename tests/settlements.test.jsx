import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BalanceList from '../src/components/settlements/BalanceList';
import SettlementSuggestions from '../src/components/settlements/SettlementSuggestions';
import SettlementHistory from '../src/components/settlements/SettlementHistory';
import Settlements from '../src/pages/Settlements';
import * as settlementService from '../src/services/settlementService';
import * as groupService from '../src/services/groupService';
import * as expenseService from '../src/services/expenseService';
import * as authService from '../src/services/authService';
import * as database from '../src/services/database';

describe('Settlement Components & Page', () => {
  const currentUserId = 'user-1';
  const mockUser = {
    id: currentUserId,
    name: 'Alice Johnson',
    email: 'alice@campus.edu',
  };

  const sampleDebts = [
    {
      from: 'user-1',
      to: 'user-2',
      amount: 45000,
      fromName: 'Alice Johnson',
      toName: 'Bob Smith',
      groupId: 'grp-1',
      groupName: 'Apartment 4B',
    },
    {
      from: 'user-3',
      to: 'user-1',
      amount: 60000,
      fromName: 'Charlie Brown',
      toName: 'Alice Johnson',
      groupId: 'grp-1',
      groupName: 'Apartment 4B',
    },
  ];

  const sampleSettlements = [
    {
      id: 'settle-1',
      groupId: 'grp-1',
      payerId: 'user-1',
      receiverId: 'user-2',
      amount: 50000,
      status: 'completed',
      createdAt: '2026-11-21T10:00:00.000Z',
    },
    {
      id: 'settle-2',
      groupId: 'grp-1',
      payerId: 'user-3',
      receiverId: 'user-1',
      amount: 25000,
      status: 'cancelled',
      createdAt: '2026-11-20T10:00:00.000Z',
      cancelledAt: '2026-11-20T12:00:00.000Z',
    },
  ];

  const memberMap = {
    'user-1': 'Alice Johnson',
    'user-2': 'Bob Smith',
    'user-3': 'Charlie Brown',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockUser);
  });

  describe('BalanceList Component', () => {
    it('renders "You Owe" and "Others Owe You" sections correctly', () => {
      const onSettle = vi.fn();
      render(
        <BalanceList
          debts={sampleDebts}
          currentUserId={currentUserId}
          onSettle={onSettle}
        />
      );

      expect(screen.getByText('You Owe')).toBeInTheDocument();
      expect(screen.getByText('Others Owe You')).toBeInTheDocument();

      // You owe Bob Smith ₹450.00
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('₹450.00')).toBeInTheDocument();

      // Charlie Brown owes you ₹600.00
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
      expect(screen.getByText('₹600.00')).toBeInTheDocument();

      // Settle up button for You Owe
      const settleUpBtn = screen.getByRole('button', { name: /Settle Up/i });
      fireEvent.click(settleUpBtn);
      expect(onSettle).toHaveBeenCalledTimes(1);
    });

    it('renders empty states when no debts exist', () => {
      render(
        <BalanceList
          debts={[]}
          currentUserId={currentUserId}
          onSettle={vi.fn()}
        />
      );

      expect(screen.getByText(/You don't owe anyone right now!/i)).toBeInTheDocument();
      expect(screen.getByText(/No one owes you money right now./i)).toBeInTheDocument();
    });
  });

  describe('SettlementSuggestions Component', () => {
    it('renders suggestions and enables "Mark as Paid" only for the payer', () => {
      const onSettle = vi.fn();
      render(
        <SettlementSuggestions
          suggestions={sampleDebts}
          currentUserId={currentUserId}
          onSettle={onSettle}
        />
      );

      expect(screen.getByText('Suggested Settlements')).toBeInTheDocument();

      const markAsPaidButtons = screen.getAllByRole('button', { name: /Mark as Paid/i });
      expect(markAsPaidButtons.length).toBe(2);

      // First button is where user-1 is payer -> enabled
      expect(markAsPaidButtons[0]).toBeEnabled();
      fireEvent.click(markAsPaidButtons[0]);
      expect(onSettle).toHaveBeenCalledTimes(1);

      // Second button is where user-3 is payer -> disabled
      expect(markAsPaidButtons[1]).toBeDisabled();
    });

    it('renders "All settled up!" when suggestions array is empty', () => {
      render(
        <SettlementSuggestions
          suggestions={[]}
          currentUserId={currentUserId}
          onSettle={vi.fn()}
        />
      );

      expect(screen.getByText('All settled up!')).toBeInTheDocument();
    });
  });

  describe('SettlementHistory Component', () => {
    it('renders settlement history with Completed and Cancelled badges', () => {
      render(
        <SettlementHistory
          settlements={sampleSettlements}
          currentUserId={currentUserId}
          memberMap={memberMap}
          onCancel={vi.fn()}
        />
      );

      expect(screen.getByText('Payment History')).toBeInTheDocument();
      expect(screen.getByText('Completed')).toBeInTheDocument();
      expect(screen.getByText('Cancelled')).toBeInTheDocument();
      expect(screen.getByText('₹500.00')).toBeInTheDocument();
      expect(screen.getByText('₹250.00')).toBeInTheDocument();
    });

    it('allows cancelling completed settlement where payer is current user with ConfirmDialog', async () => {
      const onCancel = vi.fn().mockResolvedValue(true);
      render(
        <SettlementHistory
          settlements={sampleSettlements}
          currentUserId={currentUserId}
          memberMap={memberMap}
          onCancel={onCancel}
        />
      );

      // Only 1 cancel button should be visible (for completed payment where current user is payer)
      const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
      expect(cancelBtn).toBeInTheDocument();
      fireEvent.click(cancelBtn);

      expect(screen.getByText('Cancel Payment?')).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Yes, Cancel Payment/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onCancel).toHaveBeenCalledWith('settle-1');
      });
    });
  });

  describe('Settlements Page', () => {
    it('renders settlements page with summary cards, group filter, suggestions and history', async () => {
      const mockGroups = [
        { id: 'grp-1', name: 'Apartment 4B', color: '#FFDE59', createdBy: 'user-1' },
      ];
      const mockMembers = [
        { id: 'm-1', groupId: 'grp-1', userId: 'user-1', name: 'Alice Johnson', email: 'alice@campus.edu' },
        { id: 'm-2', groupId: 'grp-1', userId: 'user-2', name: 'Bob Smith', email: 'bob@campus.edu' },
      ];
      const mockExpenses = [
        {
          id: 'e-1',
          groupId: 'grp-1',
          description: 'Groceries',
          amount: 200000,
          paidBy: 'user-2',
          date: '2026-11-20',
        },
      ];
      const mockSplits = [
        { id: 'sp-1', expenseId: 'e-1', userId: 'user-1', amount: 100000 },
        { id: 'sp-2', expenseId: 'e-1', userId: 'user-2', amount: 100000 },
      ];

      vi.spyOn(groupService, 'getUserGroups').mockResolvedValue(mockGroups);
      vi.spyOn(groupService, 'getGroupMembers').mockResolvedValue(mockMembers);
      vi.spyOn(expenseService, 'getGroupExpenses').mockResolvedValue(mockExpenses);
      vi.spyOn(database, 'getByIndex').mockImplementation(async (store, index, val) => {
        if (store === 'expenseSplits' && index === 'expenseId') {
          return mockSplits;
        }
        return [];
      });
      vi.spyOn(settlementService, 'getGroupSettlements').mockResolvedValue([]);

      render(<Settlements />);

      // Wait for page load and summary cards
      await waitFor(() => {
        expect(screen.getByText('Total You Owe')).toBeInTheDocument();
      });

      // Summary cards
      expect(screen.getByText('Total Owed To You')).toBeInTheDocument();
      expect(screen.getAllByText('₹1,000.00').length).toBeGreaterThanOrEqual(1); // user-1 owes user-2 ₹1,000

      // Group filter select
      expect(screen.getByRole('combobox', { name: /Filter by group/i })).toBeInTheDocument();
      expect(screen.getByText('Apartment 4B')).toBeInTheDocument();

      // Suggestions
      expect(screen.getByText('Suggested Settlements')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Mark as Paid/i })).toBeInTheDocument();
    });

    it('records a settlement when Mark as Paid is clicked', async () => {
      const mockGroups = [
        { id: 'grp-1', name: 'Apartment 4B', color: '#FFDE59', createdBy: 'user-1' },
      ];
      const mockMembers = [
        { id: 'm-1', groupId: 'grp-1', userId: 'user-1', name: 'Alice Johnson', email: 'alice@campus.edu' },
        { id: 'm-2', groupId: 'grp-1', userId: 'user-2', name: 'Bob Smith', email: 'bob@campus.edu' },
      ];
      const mockExpenses = [
        {
          id: 'e-1',
          groupId: 'grp-1',
          description: 'Groceries',
          amount: 200000,
          paidBy: 'user-2',
          date: '2026-11-20',
        },
      ];
      const mockSplits = [
        { id: 'sp-1', expenseId: 'e-1', userId: 'user-1', amount: 100000 },
        { id: 'sp-2', expenseId: 'e-1', userId: 'user-2', amount: 100000 },
      ];

      vi.spyOn(groupService, 'getUserGroups').mockResolvedValue(mockGroups);
      vi.spyOn(groupService, 'getGroupMembers').mockResolvedValue(mockMembers);
      vi.spyOn(expenseService, 'getGroupExpenses').mockResolvedValue(mockExpenses);
      vi.spyOn(database, 'getByIndex').mockImplementation(async (store, index) => {
        if (store === 'expenseSplits') return mockSplits;
        return [];
      });
      vi.spyOn(settlementService, 'getGroupSettlements').mockResolvedValue([]);
      const createSettlementSpy = vi.spyOn(settlementService, 'createSettlement').mockResolvedValue({
        id: 'new-settle',
        groupId: 'grp-1',
        payerId: 'user-1',
        receiverId: 'user-2',
        amount: 100000,
        status: 'completed',
      });

      render(<Settlements />);

      await waitFor(() => {
        expect(screen.getByText('Suggested Settlements')).toBeInTheDocument();
      });

      const markAsPaidBtn = screen.getByRole('button', { name: /Mark as Paid/i });
      fireEvent.click(markAsPaidBtn);

      await waitFor(() => {
        expect(createSettlementSpy).toHaveBeenCalledWith(
          'grp-1',
          'user-1',
          'user-2',
          100000,
          'user-1'
        );
      });
    });
  });
});
