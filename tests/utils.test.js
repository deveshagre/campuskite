import { describe, it, expect } from 'vitest';
import {
  calculateMemberBalances,
  minimizeDebts,
  equalSplit,
  validateCustomSplit,
} from '../src/utils/calculations.js';
import {
  formatCurrency,
  parseCurrencyInput,
  toPaise,
  toRupees,
} from '../src/utils/currency.js';
import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateAmount,
  validateFileSize,
  validateFileType,
  validatePasswordMatch,
} from '../src/utils/validation.js';
import {
  formatDate,
  formatDateTime,
  getMonthName,
  getMonthYear,
  isInMonth,
  getMonthDateRange,
  toISODateString,
} from '../src/utils/date.js';

describe('Calculations Utility', () => {
  it('calculateMemberBalances handles expenses and splits', () => {
    const expenses = [
      { id: 'e1', paidBy: 'alice', amount: 1200 },
      { id: 'e2', paidBy: 'bob', amount: 600 },
    ];
    const splits = [
      { expenseId: 'e1', userId: 'alice', amount: 400 },
      { expenseId: 'e1', userId: 'bob', amount: 400 },
      { expenseId: 'e1', userId: 'charlie', amount: 400 },
      { expenseId: 'e2', userId: 'alice', amount: 300 },
      { expenseId: 'e2', userId: 'bob', amount: 300 },
    ];

    const balances = calculateMemberBalances(expenses, splits, []);
    // Alice: +1200 - 400 - 300 = +500
    // Bob: +600 - 400 - 300 = -100
    // Charlie: 0 - 400 = -400
    expect(balances['alice']).toBe(500);
    expect(balances['bob']).toBe(-100);
    expect(balances['charlie']).toBe(-400);
  });

  it('calculateMemberBalances processes completed settlements according to spec', () => {
    const expenses = [{ id: 'e1', paidBy: 'alice', amount: 1000 }];
    const splits = [
      { expenseId: 'e1', userId: 'alice', amount: 500 },
      { expenseId: 'e1', userId: 'bob', amount: 500 },
    ];
    const settlements = [
      { id: 's1', payerId: 'bob', receiverId: 'alice', amount: 200, status: 'completed' },
      { id: 's2', payerId: 'bob', receiverId: 'alice', amount: 100, status: 'cancelled' },
    ];

    const balances = calculateMemberBalances(expenses, splits, settlements);
    // Alice: +1000 - 500 + 200 = +700
    // Bob: 0 - 500 - 200 = -700
    expect(balances['alice']).toBe(700);
    expect(balances['bob']).toBe(-700);
  });

  it('equalSplit handles even and odd splits in integer paise', () => {
    expect(equalSplit(100, 2)).toEqual([50, 50]);
    // 100 split 3 ways: base 33, remainder 1 -> [34, 33, 33]
    expect(equalSplit(100, 3)).toEqual([34, 33, 33]);
    // 100 split 7 ways: 14 * 7 = 98, remainder 2 -> [15, 15, 14, 14, 14, 14, 14]
    expect(equalSplit(100, 7)).toEqual([15, 15, 14, 14, 14, 14, 14]);
    // Sum matches exactly
    const split7 = equalSplit(100, 7);
    expect(split7.reduce((a, b) => a + b, 0)).toBe(100);
  });

  it('equalSplit throws on invalid input', () => {
    expect(() => equalSplit(100, 0)).toThrow();
    expect(() => equalSplit(-50, 2)).toThrow();
  });

  it('validateCustomSplit validates correctly', () => {
    expect(validateCustomSplit([60, 40], 100).valid).toBe(true);
    expect(validateCustomSplit([50, 40], 100).valid).toBe(false);
    expect(validateCustomSplit([-10, 110], 100).valid).toBe(false);
    expect(validateCustomSplit([10.5, 89.5], 100).valid).toBe(false);
  });

  it('minimizeDebts matches largest debtor and creditor', () => {
    const balances = {
      alice: 5000,
      bob: -3000,
      charlie: -2000,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toEqual([
      { from: 'bob', to: 'alice', amount: 3000 },
      { from: 'charlie', to: 'alice', amount: 2000 },
    ]);
  });
});

describe('Debt Minimization Engine Scenarios (Section 16 Specifications)', () => {
  it('Scenario 1: Two-person group - simple direct transfer', () => {
    const balances = {
      userA: -50000, // owes ₹500
      userB: 50000,  // is owed ₹500
    };
    const txs = minimizeDebts(balances);
    expect(txs).toHaveLength(1);
    expect(txs[0]).toEqual({ from: 'userA', to: 'userB', amount: 50000 });
  });

  it('Scenario 2: Multiple debtors, single creditor', () => {
    // Prompt example: A owes ₹500, B owes ₹300, C should receive ₹800
    const balances = {
      A: -50000,
      B: -30000,
      C: 80000,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toHaveLength(2);
    // Largest debtor A matches with C first
    expect(txs).toContainEqual({ from: 'A', to: 'C', amount: 50000 });
    expect(txs).toContainEqual({ from: 'B', to: 'C', amount: 30000 });
    const totalSettled = txs.reduce((sum, t) => sum + t.amount, 0);
    expect(totalSettled).toBe(80000);
  });

  it('Scenario 3: Single debtor, multiple creditors', () => {
    const balances = {
      debtor: -80000,
      creditor1: 50000,
      creditor2: 30000,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toHaveLength(2);
    expect(txs).toContainEqual({ from: 'debtor', to: 'creditor1', amount: 50000 });
    expect(txs).toContainEqual({ from: 'debtor', to: 'creditor2', amount: 30000 });
  });

  it('Scenario 4: Multiple debtors, multiple creditors with uneven amounts', () => {
    const balances = {
      A: -10000, // owes ₹100
      B: -40000, // owes ₹400
      C: 25000,  // owed ₹250
      D: 25000,  // owed ₹250
    };
    const txs = minimizeDebts(balances);
    // Total transferred must equal 50000
    const totalTransferred = txs.reduce((sum, t) => sum + t.amount, 0);
    expect(totalTransferred).toBe(50000);

    // Verify reconciliation for every participant
    const reconciled = { A: 0, B: 0, C: 0, D: 0 };
    for (const tx of txs) {
      reconciled[tx.from] -= tx.amount;
      reconciled[tx.to] += tx.amount;
    }
    expect(reconciled.A).toBe(balances.A);
    expect(reconciled.B).toBe(balances.B);
    expect(reconciled.C).toBe(balances.C);
    expect(reconciled.D).toBe(balances.D);
  });

  it('Scenario 5: Circular debts resulting in net zero balances', () => {
    // In a circular debt where everyone spent equal amounts and owes equal amounts, net balances are 0
    const balances = {
      alice: 0,
      bob: 0,
      charlie: 0,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toEqual([]);
  });

  it('Scenario 6: Handles zero balances alongside active debts without creating self or zero transactions', () => {
    const balances = {
      activeDebtor: -25000,
      settledMember: 0,
      activeCreditor: 25000,
      anotherSettled: 0,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toEqual([
      { from: 'activeDebtor', to: 'activeCreditor', amount: 25000 },
    ]);
  });

  it('Scenario 7: Exact paise preservation without losing rounding remainders', () => {
    // 3 participants each owe 3333, 3333, 3334 paise, total 10000 paise owed to 1 creditor
    const balances = {
      p1: -3334,
      p2: -3333,
      p3: -3333,
      creditor: 10000,
    };
    const txs = minimizeDebts(balances);
    expect(txs).toHaveLength(3);
    const sum = txs.reduce((acc, curr) => acc + curr.amount, 0);
    expect(sum).toBe(10000);
    expect(txs.every((t) => t.amount > 0)).toBe(true);
    expect(txs.every((t) => t.from !== t.to)).toBe(true);
  });
});

describe('Currency Utility', () => {
  it('formatCurrency formats Indian Rupee amounts correctly', () => {
    expect(formatCurrency(150000)).toBe('₹1,500.00');
    expect(formatCurrency(10000000)).toBe('₹1,00,000.00');
    expect(formatCurrency(0)).toBe('₹0.00');
    expect(formatCurrency(50)).toBe('₹0.50');
    expect(formatCurrency(-150000)).toBe('-₹1,500.00');
  });

  it('parseCurrencyInput converts various input strings to paise', () => {
    expect(parseCurrencyInput('1500')).toBe(150000);
    expect(parseCurrencyInput('1,500')).toBe(150000);
    expect(parseCurrencyInput('1500.50')).toBe(150050);
    expect(parseCurrencyInput('₹1,500.50')).toBe(150050);
    expect(parseCurrencyInput('Rs. 1,500')).toBe(150000);
    expect(parseCurrencyInput(1500)).toBe(150000);
  });

  it('toPaise and toRupees convert properly', () => {
    expect(toPaise(1500)).toBe(150000);
    expect(toRupees(150000)).toBe(1500);
  });
});

describe('Validation Utility', () => {
  it('validates email addresses', () => {
    expect(validateEmail('test@example.com')).toBeNull();
    expect(validateEmail('invalid-email')).not.toBeNull();
    expect(validateEmail('')).not.toBeNull();
  });

  it('validates passwords', () => {
    expect(validatePassword('secret123')).toBeNull();
    expect(validatePassword('12345')).not.toBeNull();
  });

  it('validates required fields', () => {
    expect(validateRequired('Campus', 'Group')).toBeNull();
    expect(validateRequired('', 'Group')).not.toBeNull();
    expect(validateRequired('   ', 'Group')).not.toBeNull();
  });

  it('validates amount', () => {
    expect(validateAmount(100)).toBeNull();
    expect(validateAmount('100')).toBeNull();
    expect(validateAmount(0)).not.toBeNull();
    expect(validateAmount(-10)).not.toBeNull();
  });

  it('validates file size and type', () => {
    const mockFile = { size: 500, type: 'image/png' };
    expect(validateFileSize(mockFile, 1000)).toBeNull();
    expect(validateFileSize(mockFile, 100)).not.toBeNull();
    expect(validateFileType(mockFile, ['image/png', 'image/jpeg'])).toBeNull();
    expect(validateFileType(mockFile, ['application/pdf'])).not.toBeNull();
  });

  it('validates password match', () => {
    expect(validatePasswordMatch('pass1', 'pass1')).toBeNull();
    expect(validatePasswordMatch('pass1', 'pass2')).not.toBeNull();
  });
});

describe('Date Utility', () => {
  it('formats dates and date times', () => {
    expect(formatDate('2026-11-24')).toBe('Nov 24, 2026');
    expect(formatDateTime('2026-11-24T11:30:00')).toContain('Nov 24, 2026');
    expect(formatDateTime('2026-11-24T11:30:00')).toContain('11:30 AM');
  });

  it('returns month name and month year', () => {
    expect(getMonthName(0)).toBe('January');
    expect(getMonthName(10)).toBe('November');
    expect(getMonthYear(2026, 10)).toBe('November 2026');
  });

  it('checks isInMonth and getMonthDateRange', () => {
    expect(isInMonth('2026-11-24', 2026, 10)).toBe(true);
    expect(isInMonth('2026-10-24', 2026, 10)).toBe(false);

    const range = getMonthDateRange(2026, 10);
    expect(range.start).toBeDefined();
    expect(range.end).toBeDefined();
    const [start, end] = range;
    expect(start).toBe(range.start);
    expect(end).toBe(range.end);
  });

  it('toISODateString formats properly', () => {
    expect(toISODateString('2026-11-24T15:30:00.000Z')).toBe('2026-11-24');
    expect(toISODateString('2026-11-24')).toBe('2026-11-24');
  });
});
