/**
 * @file currency.js
 * @description Currency utility functions for CampusKite.
 * Handles Indian Rupee (INR) formatting, parsing, and conversions in integer paise.
 */

/**
 * Formats integer paise as an Indian currency string with the Rupee symbol (₹).
 * Uses Indian numbering format (last 3 digits, then groups of 2) with 2 decimal places.
 * Example: 150000 paise -> "₹1,500.00"
 *
 * @param {number} paise - Amount in integer paise
 * @returns {string} Formatted Indian Rupee string
 */
export function formatCurrency(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return '₹0.00';
  }

  const isNegative = paise < 0;
  const absPaise = Math.abs(Math.round(paise));
  const rupees = Math.floor(absPaise / 100);
  const remainingPaise = absPaise % 100;
  const paiseStr = remainingPaise.toString().padStart(2, '0');

  const rupeesStr = rupees.toString();
  let lastThree = rupeesStr.substring(rupeesStr.length - 3);
  const otherNumbers = rupeesStr.substring(0, rupeesStr.length - 3);

  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }

  const formattedRupees = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;

  return `${isNegative ? '-' : ''}₹${formattedRupees}.${paiseStr}`;
}

/**
 * Parses user input string (in Rupees) into an integer paise amount.
 * Handles formats like "1500", "1,500", "1500.50", "₹1,500.50", "Rs 1500".
 *
 * @param {string|number} str - User input string or number
 * @returns {number} Amount in integer paise
 */
export function parseCurrencyInput(str) {
  if (str === null || str === undefined) {
    return 0;
  }

  if (typeof str === 'number') {
    return isNaN(str) ? 0 : Math.round(str * 100);
  }

  const cleaned = String(str)
    .replace(/[₹\s,]/g, '')
    .replace(/^INR/i, '')
    .replace(/^Rs\.?/i, '')
    .trim();

  if (cleaned === '') {
    return 0;
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100);
}

/**
 * Converts rupees to integer paise.
 *
 * @param {number} rupees - Amount in rupees
 * @returns {number} Amount in integer paise
 */
export function toPaise(rupees) {
  if (rupees === null || rupees === undefined || isNaN(rupees)) {
    return 0;
  }
  return Math.round(rupees * 100);
}

/**
 * Converts integer paise to rupees.
 *
 * @param {number} paise - Amount in integer paise
 * @returns {number} Amount in rupees
 */
export function toRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) {
    return 0;
  }
  return paise / 100;
}
