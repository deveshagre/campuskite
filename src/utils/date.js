/**
 * @file date.js
 * @description Date formatting and manipulation utilities for CampusKite.
 */

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/**
 * Safely parses a date input into a Date object.
 *
 * @param {string|Date|number} input - Date string, Date instance, or timestamp
 * @returns {Date} Parsed Date object
 */
function parseDateSafely(input) {
  if (input instanceof Date) {
    return new Date(input.getTime());
  }

  if (typeof input === 'string') {
    // If it's a date-only string like YYYY-MM-DD, parse parts directly to avoid timezone day shifts
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day, 12, 0, 0);
    }
  }

  return new Date(input);
}

/**
 * Formats a date string as "Nov 24, 2026".
 *
 * @param {string|Date|number} dateStr - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = parseDateSafely(dateStr);
  if (isNaN(date.getTime())) return '';

  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  return `${month} ${day}, ${year}`;
}

/**
 * Formats a date string with time as "Nov 24, 2026 11:30 AM".
 *
 * @param {string|Date|number} dateStr - Date to format
 * @returns {string} Formatted date and time string
 */
export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const date = parseDateSafely(dateStr);
  if (isNaN(date.getTime())) return '';

  const month = MONTH_NAMES_SHORT[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 hour is 12 AM

  return `${month} ${day}, ${year} ${hours}:${minutes} ${ampm}`;
}

/**
 * Returns the full month name for a 0-indexed month (0 = January, 11 = December).
 *
 * @param {number} monthIndex - Month index (0 to 11)
 * @returns {string} Full month name
 */
export function getMonthName(monthIndex) {
  const index = Math.max(0, Math.min(11, Math.floor(monthIndex)));
  return MONTH_NAMES[index] || '';
}

/**
 * Returns month and year string, e.g. "November 2026".
 * Accepts 0-indexed month (0 = January, 10 = November, 11 = December).
 *
 * @param {number} year - Four-digit year
 * @param {number} month - 0-indexed month (0 to 11)
 * @returns {string} "Month Year" string
 */
export function getMonthYear(year, month) {
  return `${getMonthName(month)} ${year}`;
}

/**
 * Checks if a given date string falls within the specified year and month.
 *
 * @param {string|Date|number} dateStr - Date to check
 * @param {number} year - Four-digit year
 * @param {number} month - 0-indexed month (0 to 11)
 * @returns {boolean} True if the date falls in the given year and month
 */
export function isInMonth(dateStr, year, month) {
  if (!dateStr) return false;
  const date = parseDateSafely(dateStr);
  if (isNaN(date.getTime())) return false;

  return date.getFullYear() === year && date.getMonth() === month;
}

/**
 * Returns the start and end ISO date strings for a given month and year.
 * The return value can be destructured as an object ({ start, end }) or as an array ([start, end]).
 *
 * @param {number} year - Four-digit year
 * @param {number} month - 0-indexed month (0 to 11)
 * @returns {{ start: string, end: string, [Symbol.iterator]: Function }} Start and end date strings
 */
export function getMonthDateRange(year, month) {
  // First day of month at midnight UTC
  const startDate = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
  // Last day of month at 23:59:59.999 UTC (day 0 of next month is last day of current month)
  const endDate = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999));

  const start = startDate.toISOString();
  const end = endDate.toISOString();

  const range = {
    start,
    end,
    [Symbol.iterator]: function* () {
      yield start;
      yield end;
    },
  };

  return range;
}

/**
 * Formats a Date or date string safely as YYYY-MM-DD.
 *
 * @param {Date|string|number} date - Date to format
 * @returns {string} ISO date string in YYYY-MM-DD format
 */
export function toISODateString(date) {
  if (!date) return '';

  if (typeof date === 'string') {
    const match = date.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) {
      return match[1];
    }
  }

  const d = parseDateSafely(date);
  if (isNaN(d.getTime())) return '';

  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');

  return `${year}-${month}-${day}`;
}
