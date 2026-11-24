import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, X, Receipt } from 'lucide-react';
import ExpenseRow from './ExpenseRow';
import Input from '../common/Input';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';

const CATEGORIES = ['Food', 'Groceries', 'Rent', 'Utilities', 'Travel', 'Other'];

/**
 * ExpenseList Component
 *
 * @param {Object} props
 * @param {Array<Object>} props.expenses - List of expense objects
 * @param {string} props.currentUserId - Logged in user ID
 * @param {Function} props.onViewExpense - Callback when an expense is clicked
 * @param {Array<Object>} [props.members=[]] - Group members for name lookup
 */
export default function ExpenseList({
  expenses = [],
  currentUserId,
  onViewExpense,
  members = [],
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Map userId -> member name
  const memberMap = useMemo(() => {
    const map = {};
    if (Array.isArray(members)) {
      for (const m of members) {
        if (!m) continue;
        const uid = m.userId || m.id;
        if (uid) {
          map[uid] = m.name || m.email || 'Unknown';
        }
      }
    }
    return map;
  }, [members]);

  const hasActiveFilters = Boolean(
    searchTerm.trim() || selectedCategory || dateFrom || dateTo
  );

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setDateFrom('');
    setDateTo('');
  };

  // Filtered and sorted expenses (newest first)
  const filteredExpenses = useMemo(() => {
    let result = Array.isArray(expenses) ? [...expenses] : [];

    // Search by description (case-insensitive)
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter(
        (exp) => exp.description && exp.description.toLowerCase().includes(term)
      );
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'ALL') {
      result = result.filter((exp) => exp.category === selectedCategory);
    }

    // Date range filters
    if (dateFrom) {
      result = result.filter((exp) => (exp.date || '') >= dateFrom);
    }
    if (dateTo) {
      result = result.filter((exp) => (exp.date || '') <= dateTo);
    }

    // Sort newest first
    result.sort((a, b) => {
      const dateDiff = (b.date || '').localeCompare(a.date || '');
      if (dateDiff !== 0) return dateDiff;
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    });

    return result;
  }, [expenses, searchTerm, selectedCategory, dateFrom, dateTo]);

  return (
    <div className="expense-list-container">
      {/* Filters Bar */}
      <div
        className="card"
        style={{
          padding: 'var(--space-md)',
          marginBottom: 'var(--space-md)',
          backgroundColor: 'var(--surface)',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--space-sm)',
            alignItems: 'flex-end',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <label
              className="input-label"
              style={{ fontSize: 'var(--font-size-xs)', marginBottom: 4 }}
            >
              Search
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input"
                placeholder="Search description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 34 }}
              />
              <Search
                size={16}
                style={{
                  position: 'absolute',
                  left: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-secondary)',
                  pointerEvents: 'none',
                }}
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <label
              className="input-label"
              style={{ fontSize: 'var(--font-size-xs)', marginBottom: 4 }}
            >
              Category
            </label>
            <select
              className="select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label
              className="input-label"
              style={{ fontSize: 'var(--font-size-xs)', marginBottom: 4 }}
            >
              From Date
            </label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          {/* Date To */}
          <div>
            <label
              className="input-label"
              style={{ fontSize: 'var(--font-size-xs)', marginBottom: 4 }}
            >
              To Date
            </label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                icon={<X size={14} />}
                style={{ width: '100%', height: 44 }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Result Count Text */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-sm)',
          padding: '0 4px',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          {expenses.length === 0
            ? 'No expenses yet'
            : hasActiveFilters
            ? `Showing ${filteredExpenses.length} of ${expenses.length} expenses`
            : `${filteredExpenses.length} ${filteredExpenses.length === 1 ? 'expense' : 'expenses'}`}
        </span>
      </div>

      {/* Expense List Items or Empty State */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={<Receipt size={32} />}
          title="No expenses yet"
          description="There are no expenses in this group yet. Add an expense to begin splitting costs!"
        />
      ) : filteredExpenses.length === 0 ? (
        <EmptyState
          icon={<Filter size={32} />}
          title="No matching expenses"
          description="No expenses match your search or filter criteria. Try adjusting the filters."
          action={
            <Button variant="secondary" size="sm" onClick={clearFilters}>
              Clear All Filters
            </Button>
          }
        />
      ) : (
        <div className="expense-rows-list">
          {filteredExpenses.map((expense) => (
            <ExpenseRow
              key={expense.id}
              expense={expense}
              currentUserId={currentUserId}
              onClick={() => onViewExpense?.(expense)}
              memberMap={memberMap}
            />
          ))}
        </div>
      )}
    </div>
  );
}
