/**
 * @file calculations.js
 * @description Core financial calculation engine for CampusKite.
 * Pure functions with no side effects. All monetary calculations are performed in integer paise.
 */

/**
 * Calculates net balances for all members across expenses, splits, and settlements.
 *
 * Balance convention:
 * - Positive balance (> 0): User is owed money (creditor)
 * - Negative balance (< 0): User owes money (debtor)
 * - Zero balance (= 0): User is all settled up
 *
 * Rules:
 * - For each expense: paidBy gets +amount, each split participant gets -splitAmount
 * - For each completed settlement: payer gets -amount, receiver gets +amount
 *
 * @param {Array<Object>} expenses - List of group expenses
 * @param {Array<Object>} splits - List of expense splits
 * @param {Array<Object>} settlements - List of settlements
 * @returns {Record<string, number>} Map of userId to balance in paise
 */
export function calculateMemberBalances(expenses = [], splits = [], settlements = []) {
  const balances = {};

  // Process expenses: paidBy gets +amount
  if (Array.isArray(expenses)) {
    for (const expense of expenses) {
      if (!expense || !expense.paidBy || typeof expense.amount !== 'number') continue;
      balances[expense.paidBy] = (balances[expense.paidBy] || 0) + Math.round(expense.amount);
    }
  }

  // Process splits: each participant gets -splitAmount
  if (Array.isArray(splits)) {
    for (const split of splits) {
      if (!split || !split.userId || typeof split.amount !== 'number') continue;
      balances[split.userId] = (balances[split.userId] || 0) - Math.round(split.amount);
    }
  }

  // Process settlements: for completed settlements, payer gets -amount, receiver gets +amount
  if (Array.isArray(settlements)) {
    for (const settlement of settlements) {
      if (!settlement || settlement.status !== 'completed' || typeof settlement.amount !== 'number') {
        continue;
      }
      const amount = Math.round(settlement.amount);
      if (settlement.payerId) {
        balances[settlement.payerId] = (balances[settlement.payerId] || 0) - amount;
      }
      if (settlement.receiverId) {
        balances[settlement.receiverId] = (balances[settlement.receiverId] || 0) + amount;
      }
    }
  }

  return balances;
}

/**
 * Minimizes group debts to reduce the total number of transactions required to settle up.
 *
 * Algorithm:
 * - Filters out zero balances
 * - Separates members into creditors (positive balance) and debtors (negative balance)
 * - Greedily matches largest debtor with largest creditor
 * - Transfers min(abs(debtor), creditor), updates balances, and repeats until settled
 *
 * @param {Record<string, number>} balances - Map of userId to balance in paise
 * @returns {Array<{ from: string, to: string, amount: number }>} Minimized settlement transactions
 */
export function minimizeDebts(balances = {}) {
  if (!balances || typeof balances !== 'object') {
    return [];
  }

  const creditors = [];
  const debtors = [];

  for (const [userId, balance] of Object.entries(balances)) {
    const rounded = Math.round(balance);
    if (rounded > 0) {
      creditors.push({ userId, amount: rounded });
    } else if (rounded < 0) {
      debtors.push({ userId, amount: Math.abs(rounded) });
    }
  }

  const transactions = [];

  while (debtors.length > 0 && creditors.length > 0) {
    // Sort descending by amount to greedily pair largest debtor and creditor
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const debtor = debtors[0];
    const creditor = creditors[0];

    if (debtor.userId === creditor.userId) {
      debtors.shift();
      continue;
    }

    const transfer = Math.min(debtor.amount, creditor.amount);

    if (transfer > 0) {
      transactions.push({
        from: debtor.userId,
        to: creditor.userId,
        amount: transfer,
      });

      debtor.amount -= transfer;
      creditor.amount -= transfer;
    }

    if (debtor.amount === 0) {
      debtors.shift();
    }
    if (creditor.amount === 0) {
      creditors.shift();
    }
  }

  return transactions;
}

/**
 * Splits an amount equally among a given number of participants in integer paise.
 * If totalPaise is not evenly divisible, remaining paise are distributed 1 paise each to the first participants.
 *
 * @param {number} totalPaise - Total amount in paise (must be non-negative integer)
 * @param {number} numParticipants - Number of participants (must be positive integer)
 * @returns {number[]} Array of paise amounts for each participant
 * @throws {Error} If inputs are invalid or sum does not match totalPaise
 */
export function equalSplit(totalPaise, numParticipants) {
  if (!Number.isInteger(numParticipants) || numParticipants <= 0) {
    throw new Error('Number of participants must be a positive integer');
  }
  if (!Number.isInteger(totalPaise) || totalPaise < 0) {
    throw new Error('Total paise must be a non-negative integer');
  }

  const base = Math.floor(totalPaise / numParticipants);
  const remainder = totalPaise % numParticipants;

  const splits = [];
  for (let i = 0; i < numParticipants; i++) {
    splits.push(i < remainder ? base + 1 : base);
  }

  const sum = splits.reduce((acc, curr) => acc + curr, 0);
  if (sum !== totalPaise) {
    throw new Error(`Split sum verification failed: expected ${totalPaise}, calculated ${sum}`);
  }

  return splits;
}

/**
 * Validates a custom split array against the expected total paise.
 *
 * @param {number[]} amounts - Array of individual split amounts in paise
 * @param {number} totalPaise - Expected total amount in paise
 * @returns {{ valid: boolean, isValid: boolean, error: string | null }} Validation result
 */
export function validateCustomSplit(amounts, totalPaise) {
  if (!Array.isArray(amounts)) {
    return { valid: false, isValid: false, error: 'Amounts must be an array' };
  }
  if (!Number.isInteger(totalPaise) || totalPaise < 0) {
    return { valid: false, isValid: false, error: 'Total amount must be a non-negative integer' };
  }
  if (amounts.length === 0) {
    return { valid: false, isValid: false, error: 'At least one participant amount is required' };
  }

  let sum = 0;
  for (let i = 0; i < amounts.length; i++) {
    const val = amounts[i];
    if (!Number.isInteger(val) || val < 0) {
      return {
        valid: false,
        isValid: false,
        error: `Amount at index ${i} must be a non-negative integer`,
      };
    }
    sum += val;
  }

  if (sum !== totalPaise) {
    return {
      valid: false,
      isValid: false,
      error: `Sum of split amounts (${sum} paise) does not match total amount (${totalPaise} paise)`,
    };
  }

  return { valid: true, isValid: true, error: null };
}
