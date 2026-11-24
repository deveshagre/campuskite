/**
 * @file reportService.js
 * @description Financial reporting and analytics service for CampusKite.
 * Generates monthly spending breakdowns, category insights, and trend analytics.
 */

import { getByIndex } from './database.js';
import { getUserGroups } from './groupService.js';
import { getExpensesByMonth } from './expenseService.js';
import { getMonthName, getMonthYear } from '../utils/date.js';

/**
 * Generates a monthly spending report for a user across all their groups or a single specified group.
 *
 * Calculations:
 * - totalSpending: sum of user's individual share amounts in paise
 * - expenseCount: number of expenses where user was a split participant
 * - categoryBreakdown: total user spending per category in paise
 * - highestCategory: category name with the highest user spending (or null)
 * - avgPerExpense: average spending per expense in integer paise
 *
 * @param {string} userId - User ID
 * @param {number} year - Four-digit year
 * @param {number} month - 0-indexed month (0 = January, 11 = December)
 * @param {string} [groupId] - Optional specific group ID
 * @returns {Promise<Object>} Monthly report object
 */
export async function getMonthlyReport(userId, year, month, groupId) {
  let targetGroups = [];
  if (groupId) {
    targetGroups = [{ id: groupId }];
  } else {
    targetGroups = await getUserGroups(userId);
  }

  let totalSpending = 0;
  let expenseCount = 0;
  const categoryBreakdown = {};

  for (const group of targetGroups) {
    const expenses = await getExpensesByMonth(group.id, year, month);

    for (const exp of expenses) {
      const splits = await getByIndex('expenseSplits', 'expenseId', exp.id);
      const userSplit = splits.find((s) => s.userId === userId);

      if (userSplit && typeof userSplit.amount === 'number' && userSplit.amount > 0) {
        const userShare = Math.round(userSplit.amount);
        totalSpending += userShare;
        expenseCount += 1;

        const category = exp.category || 'General';
        categoryBreakdown[category] = (categoryBreakdown[category] || 0) + userShare;
      }
    }
  }

  let highestCategory = null;
  let maxSpent = 0;
  for (const [cat, spent] of Object.entries(categoryBreakdown)) {
    if (spent > maxSpent) {
      maxSpent = spent;
      highestCategory = cat;
    }
  }

  const avgPerExpense = expenseCount > 0 ? Math.round(totalSpending / expenseCount) : 0;

  return {
    userId,
    year,
    month,
    monthName: getMonthName(month),
    label: getMonthYear(year, month),
    groupId: groupId || null,
    totalSpending,
    expenseCount,
    categoryBreakdown,
    highestCategory,
    avgPerExpense,
  };
}

/**
 * Retrieves spending totals and counts for the past N months for a user.
 *
 * @param {string} userId - User ID
 * @param {number} [months=6] - Number of previous months to query
 * @returns {Promise<Array<Object>>} List of monthly trends sorted chronologically
 */
export async function getSpendingTrend(userId, months = 6) {
  const trend = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const y = d.getFullYear();
    const m = d.getMonth();

    const report = await getMonthlyReport(userId, y, m);
    trend.push({
      year: y,
      month: m,
      monthName: getMonthName(m),
      label: getMonthYear(y, m),
      totalSpending: report.totalSpending,
      expenseCount: report.expenseCount,
      highestCategory: report.highestCategory,
    });
  }

  return trend;
}

/**
 * Scans all expenses across the user's groups to find unique year and month pairs with activity.
 *
 * @param {string} userId - User ID
 * @returns {Promise<Array<{ year: number, month: number, label: string }>>} Sorted descending
 */
export async function getAvailableMonths(userId) {
  const groups = await getUserGroups(userId);
  if (!groups || groups.length === 0) {
    return [];
  }

  const seen = new Set();
  const available = [];

  for (const group of groups) {
    const expenses = await getByIndex('expenses', 'groupId', group.id);
    for (const exp of expenses) {
      if (!exp.date) continue;
      const d = new Date(exp.date);
      if (isNaN(d.getTime())) continue;

      const y = d.getFullYear();
      const m = d.getMonth();
      const key = `${y}-${m}`;

      if (!seen.has(key)) {
        seen.add(key);
        available.push({
          year: y,
          month: m,
          label: getMonthYear(y, m),
        });
      }
    }
  }

  available.sort((a, b) => b.year - a.year || b.month - a.month);
  return available;
}
