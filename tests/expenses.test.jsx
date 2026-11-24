import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ExpenseRow from '../src/components/expenses/ExpenseRow';
import ExpenseList from '../src/components/expenses/ExpenseList';
import SplitPreview from '../src/components/expenses/SplitPreview';
import ReceiptUploader from '../src/components/expenses/ReceiptUploader';
import AddExpenseModal from '../src/components/expenses/AddExpenseModal';
import ExpenseDetailsModal from '../src/components/expenses/ExpenseDetailsModal';
import * as expenseService from '../src/services/expenseService';
import { formatCurrency } from '../src/utils/currency';

describe('Expense Components', () => {
  const currentUserId = 'u-1';
  const members = [
    { userId: 'u-1', name: 'Alice Johnson', email: 'alice@campus.edu' },
    { userId: 'u-2', name: 'Bob Smith', email: 'bob@campus.edu' },
    { userId: 'u-3', name: 'Charlie Brown', email: 'charlie@campus.edu' },
  ];
  const memberMap = {
    'u-1': 'Alice Johnson',
    'u-2': 'Bob Smith',
    'u-3': 'Charlie Brown',
  };

  const sampleExpense = {
    id: 'exp-101',
    groupId: 'grp-1',
    description: 'Dorm Groceries',
    amount: 150000, // 1500.00 rupees in paise
    category: 'Groceries',
    paidBy: 'u-1',
    date: '2026-11-20',
    splitType: 'equal',
    receiptId: 'rec-1',
    splits: [
      { id: 's-1', expenseId: 'exp-101', userId: 'u-1', amount: 50000 },
      { id: 's-2', expenseId: 'exp-101', userId: 'u-2', amount: 50000 },
      { id: 's-3', expenseId: 'exp-101', userId: 'u-3', amount: 50000 },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('SplitPreview Component', () => {
    it('renders equal split breakdown and avg share text', () => {
      const participants = [
        { userId: 'u-1', name: 'Alice', amount: 50000 },
        { userId: 'u-2', name: 'Bob', amount: 50000 },
      ];
      render(
        <SplitPreview
          splitType="equal"
          totalAmountPaise={100000}
          participants={participants}
        />
      );

      expect(screen.getByText('Split Breakdown')).toBeInTheDocument();
      expect(screen.getByText(/each pays/i)).toBeInTheDocument();
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText('Bob')).toBeInTheDocument();
      expect(screen.getAllByText('₹500.00').length).toBeGreaterThan(0);
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument(); // total row
    });

    it('shows warning when split total does not match totalAmountPaise', () => {
      const participants = [
        { userId: 'u-1', name: 'Alice', amount: 40000 },
        { userId: 'u-2', name: 'Bob', amount: 40000 },
      ];
      render(
        <SplitPreview
          splitType="custom"
          totalAmountPaise={100000}
          participants={participants}
        />
      );

      expect(screen.getByText(/remaining ₹200.00 to allocate/i)).toBeInTheDocument();
    });
  });

  describe('ReceiptUploader Component', () => {
    it('renders drop zone when no receipt is present', () => {
      render(<ReceiptUploader value={null} onChange={vi.fn()} onRemove={vi.fn()} />);

      expect(
        screen.getByText(/Drop a receipt image here or click to browse/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/PNG, JPEG, WebP up to 2MB/i)).toBeInTheDocument();
    });

    it('renders preview thumbnail and remove button when receipt exists', () => {
      const onRemove = vi.fn();
      render(
        <ReceiptUploader
          value={{ fileName: 'bill.png', fileSize: 102400, url: 'http://test/img.png' }}
          onChange={vi.fn()}
          onRemove={onRemove}
        />
      );

      expect(screen.getByText('bill.png')).toBeInTheDocument();
      expect(screen.getByText('100.0 KB')).toBeInTheDocument();
      const removeBtn = screen.getByRole('button', { name: /Remove/i });
      fireEvent.click(removeBtn);
      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });

  describe('ExpenseRow Component', () => {
    it('renders expense details, category icon, amount, date, and payer styling', () => {
      const onClick = vi.fn();
      render(
        <ExpenseRow
          expense={sampleExpense}
          currentUserId={currentUserId}
          onClick={onClick}
          memberMap={memberMap}
        />
      );

      expect(screen.getByText('Dorm Groceries')).toBeInTheDocument();
      expect(screen.getByText('You paid')).toBeInTheDocument();
      expect(screen.getByText('₹1,500.00')).toBeInTheDocument();
      expect(screen.getByText(/Split between 3 people/i)).toBeInTheDocument();
      expect(screen.getByText(/you lent ₹1,000.00/i)).toBeInTheDocument();

      fireEvent.click(screen.getByText('Dorm Groceries'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders other member as payer when current user is not payer', () => {
      const otherPaidExpense = {
        ...sampleExpense,
        paidBy: 'u-2',
      };
      render(
        <ExpenseRow
          expense={otherPaidExpense}
          currentUserId={currentUserId}
          onClick={vi.fn()}
          memberMap={memberMap}
        />
      );

      expect(screen.getByText('Paid by Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Your share: ₹500.00')).toBeInTheDocument();
    });
  });

  describe('ExpenseList Component', () => {
    const expensesList = [
      sampleExpense,
      {
        id: 'exp-102',
        groupId: 'grp-1',
        description: 'Hostel Wifi bill',
        amount: 80000,
        category: 'Utilities',
        paidBy: 'u-2',
        date: '2026-11-22',
        splitType: 'equal',
        splits: [
          { id: 's-4', expenseId: 'exp-102', userId: 'u-1', amount: 40000 },
          { id: 's-5', expenseId: 'exp-102', userId: 'u-2', amount: 40000 },
        ],
      },
    ];

    it('filters expenses by search text', () => {
      render(
        <ExpenseList
          expenses={expensesList}
          currentUserId={currentUserId}
          onViewExpense={vi.fn()}
          members={members}
        />
      );

      expect(screen.getByText('Dorm Groceries')).toBeInTheDocument();
      expect(screen.getByText('Hostel Wifi bill')).toBeInTheDocument();

      const searchInput = screen.getByPlaceholderText(/Search description.../i);
      fireEvent.change(searchInput, { target: { value: 'wifi' } });

      expect(screen.queryByText('Dorm Groceries')).not.toBeInTheDocument();
      expect(screen.getByText('Hostel Wifi bill')).toBeInTheDocument();
    });

    it('filters expenses by category', () => {
      render(
        <ExpenseList
          expenses={expensesList}
          currentUserId={currentUserId}
          onViewExpense={vi.fn()}
          members={members}
        />
      );

      const categorySelect = screen.getByRole('combobox');
      fireEvent.change(categorySelect, { target: { value: 'Groceries' } });

      expect(screen.getByText('Dorm Groceries')).toBeInTheDocument();
      expect(screen.queryByText('Hostel Wifi bill')).not.toBeInTheDocument();
    });

    it('clears filters when Clear Filters button is clicked', () => {
      render(
        <ExpenseList
          expenses={expensesList}
          currentUserId={currentUserId}
          onViewExpense={vi.fn()}
          members={members}
        />
      );

      const searchInput = screen.getByPlaceholderText(/Search description.../i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No matching expenses')).toBeInTheDocument();

      const clearBtn = screen.getByRole('button', { name: /Clear All Filters/i });
      fireEvent.click(clearBtn);

      expect(screen.getByText('Dorm Groceries')).toBeInTheDocument();
      expect(screen.getByText('Hostel Wifi bill')).toBeInTheDocument();
    });
  });

  describe('AddExpenseModal Component', () => {
    it('creates a new expense on valid submission', async () => {
      const createSpy = vi.spyOn(expenseService, 'createExpense').mockResolvedValue({
        id: 'new-exp',
        amount: 30000,
        description: 'Late Night Biryani',
      });
      const onSaved = vi.fn();
      const onClose = vi.fn();

      render(
        <AddExpenseModal
          isOpen={true}
          onClose={onClose}
          groupId="grp-1"
          members={members}
          currentUserId={currentUserId}
          expense={null}
          onSaved={onSaved}
        />
      );

      expect(screen.getByText('Add Expense')).toBeInTheDocument();

      // Fill in description & amount
      fireEvent.change(screen.getByPlaceholderText(/Domino's Pizza/i), {
        target: { value: 'Late Night Biryani' },
      });
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '300' },
      });

      // Submit
      const saveBtn = screen.getByRole('button', { name: /Save Expense/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(createSpy).toHaveBeenCalledTimes(1);
        expect(onSaved).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    it('validates equal split requires at least 2 members', async () => {
      render(
        <AddExpenseModal
          isOpen={true}
          onClose={vi.fn()}
          groupId="grp-1"
          members={members}
          currentUserId={currentUserId}
          expense={null}
          onSaved={vi.fn()}
        />
      );

      fireEvent.change(screen.getByPlaceholderText(/Domino's Pizza/i), {
        target: { value: 'Late Night Biryani' },
      });
      fireEvent.change(screen.getByPlaceholderText('0.00'), {
        target: { value: '300' },
      });

      // Deselect 2 of the 3 members so only 1 remains
      fireEvent.click(screen.getByRole('checkbox', { name: /Bob Smith/i }));
      fireEvent.click(screen.getByRole('checkbox', { name: /Charlie Brown/i }));

      const saveBtn = screen.getByRole('button', { name: /Save Expense/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(screen.getByText(/At least 2 members must be selected/i)).toBeInTheDocument();
      });
    });
  });

  describe('ExpenseDetailsModal Component', () => {
    it('renders full expense details, amount, payer and split list', () => {
      render(
        <ExpenseDetailsModal
          isOpen={true}
          onClose={vi.fn()}
          expense={sampleExpense}
          members={members}
          currentUserId={currentUserId}
          onEdit={vi.fn()}
          onDelete={vi.fn()}
        />
      );

      expect(screen.getByText('Expense Details')).toBeInTheDocument();
      expect(screen.getByText('₹1,500.00')).toBeInTheDocument();
      expect(screen.getByText('Dorm Groceries')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText(/You \(You\)/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Delete/i })).toBeInTheDocument();
    });

    it('handles delete confirmation flow', async () => {
      const onDelete = vi.fn().mockResolvedValue(true);
      const onClose = vi.fn();

      render(
        <ExpenseDetailsModal
          isOpen={true}
          onClose={onClose}
          expense={sampleExpense}
          members={members}
          currentUserId={currentUserId}
          onEdit={vi.fn()}
          onDelete={onDelete}
        />
      );

      const deleteBtn = screen.getByRole('button', { name: /Delete/i });
      fireEvent.click(deleteBtn);

      expect(screen.getByText('Delete Expense?')).toBeInTheDocument();

      const confirmBtn = screen.getByRole('button', { name: /Yes, Delete/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onDelete).toHaveBeenCalledWith('exp-101');
        expect(onClose).toHaveBeenCalled();
      });
    });
  });
});
