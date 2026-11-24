import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import SpendingChart from '../src/components/reports/SpendingChart';
import CategoryBreakdown from '../src/components/reports/CategoryBreakdown';
import MonthlySummary from '../src/components/reports/MonthlySummary';
import Reports from '../src/pages/Reports';
import { AuthProvider } from '../src/context/AuthContext';
import * as reportService from '../src/services/reportService';
import * as groupService from '../src/services/groupService';
import * as expenseService from '../src/services/expenseService';
import * as authService from '../src/services/authService';

describe('Reports Components', () => {
  describe('SpendingChart', () => {
    it('renders with Spending Trend title and card container', () => {
      const sampleData = [
        { month: 'Sep', amount: 150000 },
        { month: 'Oct', amount: 220000 },
        { month: 'Nov', amount: 180000 },
      ];

      const { container } = render(<SpendingChart data={sampleData} />);
      expect(screen.getByText('Spending Trend')).toBeInTheDocument();
      const card = container.querySelector('.card');
      expect(card).toBeInTheDocument();
    });

    it('handles empty data gracefully', () => {
      render(<SpendingChart data={[]} />);
      expect(screen.getByText('Spending Trend')).toBeInTheDocument();
    });
  });

  describe('CategoryBreakdown', () => {
    it('renders Category Breakdown header and category items with bars', () => {
      const sampleData = [
        { category: 'Food', amount: 50000, percentage: 50 },
        { category: 'Groceries', amount: 30000, percentage: 30 },
        { category: 'Utilities', amount: 20000, percentage: 20 },
      ];

      render(<CategoryBreakdown data={sampleData} />);
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Utilities')).toBeInTheDocument();
      expect(screen.getByText('(50%)')).toBeInTheDocument();
      expect(screen.getByText('₹500.00')).toBeInTheDocument();
    });

    it('renders empty state when data is empty', () => {
      render(<CategoryBreakdown data={[]} />);
      expect(screen.getByText('Category Breakdown')).toBeInTheDocument();
      expect(screen.getByText('No Category Data')).toBeInTheDocument();
    });
  });

  describe('MonthlySummary', () => {
    it('renders all 4 stat cards with formatted values', () => {
      render(
        <MonthlySummary
          totalSpending={125050}
          expenseCount={8}
          highestCategory="Food"
          avgPerExpense={15631}
        />
      );

      expect(screen.getByText('Total Spent')).toBeInTheDocument();
      expect(screen.getByText('₹1,250.50')).toBeInTheDocument();

      expect(screen.getByText('Expenses')).toBeInTheDocument();
      expect(screen.getByText('8')).toBeInTheDocument();

      expect(screen.getByText('Top Category')).toBeInTheDocument();
      expect(screen.getByText('Food')).toBeInTheDocument();

      expect(screen.getByText('Average')).toBeInTheDocument();
      expect(screen.getByText('₹156.31')).toBeInTheDocument();
    });
  });

  describe('Reports Page', () => {
    beforeEach(() => {
      vi.restoreAllMocks();

      vi.spyOn(authService, 'getCurrentUser').mockResolvedValue({
        id: 'user-123',
        name: 'Alice Johnson',
        email: 'alice@campus.edu',
        createdAt: '2026-08-15T10:00:00.000Z',
      });

      vi.spyOn(groupService, 'getUserGroups').mockResolvedValue([
        { id: 'group-1', name: 'Apartment 4B' },
        { id: 'group-2', name: 'Road Trip Squad' },
      ]);

      vi.spyOn(reportService, 'getMonthlyReport').mockResolvedValue({
        userId: 'user-123',
        year: 2026,
        month: 10,
        monthName: 'November',
        totalSpending: 240000,
        expenseCount: 4,
        categoryBreakdown: { Food: 140000, Groceries: 100000 },
        highestCategory: 'Food',
        avgPerExpense: 60000,
      });

      vi.spyOn(reportService, 'getSpendingTrend').mockResolvedValue([
        {
          year: 2026,
          month: 9,
          monthName: 'October',
          totalSpending: 180000,
          expenseCount: 3,
        },
        {
          year: 2026,
          month: 10,
          monthName: 'November',
          totalSpending: 240000,
          expenseCount: 4,
        },
      ]);

      vi.spyOn(expenseService, 'getExpensesByMonth').mockResolvedValue([
        {
          id: 'exp-1',
          description: 'Pizza Party',
          amount: 140000,
          category: 'Food',
          date: '2026-11-20T19:00:00.000Z',
          splitType: 'equal',
        },
      ]);
    });

    it('renders page header, controls row, summary cards, and monthly expenses', async () => {
      render(
        <AuthProvider>
          <Reports />
        </AuthProvider>
      );

      // Wait for data load
      await waitFor(() => {
        expect(screen.getByText('Financial Reports')).toBeInTheDocument();
      });

      // Controls
      expect(screen.getByLabelText('Select Month')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Year')).toBeInTheDocument();
      expect(screen.getByLabelText('Select Group')).toBeInTheDocument();

      // MonthlySummary values
      expect(screen.getByText('Total Spent')).toBeInTheDocument();
      expect(screen.getByText('₹2,400.00')).toBeInTheDocument();

      // Expenses This Month
      expect(screen.getByText('Expenses This Month')).toBeInTheDocument();
      expect(screen.getByText('Pizza Party')).toBeInTheDocument();
      expect(screen.getAllByText('₹1,400.00').length).toBeGreaterThanOrEqual(1);
    });
  });
});
