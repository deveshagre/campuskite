/**
 * @file validation.js
 * @description Input validation utilities for CampusKite forms and operations.
 */

/**
 * Validates an email address.
 *
 * @param {string} email - Email string to validate
 * @returns {string|null} Error message or null if valid
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string' || email.trim() === '') {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address';
  }

  return null;
}

/**
 * Validates password strength (minimum 6 characters).
 *
 * @param {string} password - Password string to validate
 * @returns {string|null} Error message or null if valid
 */
export function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return 'Password is required';
  }

  if (password.length < 6) {
    return 'Password must be at least 6 characters';
  }

  return null;
}

/**
 * Validates that a required field is non-empty after trimming.
 *
 * @param {*} value - Value to check
 * @param {string} [fieldName='Field'] - Name of the field for the error message
 * @returns {string|null} Error message or null if valid
 */
export function validateRequired(value, fieldName = 'Field') {
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }

  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }

  return null;
}

/**
 * Validates that an amount is a positive number.
 *
 * @param {number|string} value - Amount value to check
 * @returns {string|null} Error message or null if valid
 */
export function validateAmount(value) {
  if (value === null || value === undefined || value === '') {
    return 'Amount is required';
  }

  const num = typeof value === 'number' ? value : Number(value);

  if (isNaN(num)) {
    return 'Amount must be a valid number';
  }

  if (num <= 0) {
    return 'Amount must be greater than zero';
  }

  return null;
}

/**
 * Validates that a file's size does not exceed the maximum allowed bytes.
 *
 * @param {File|Blob|null} file - File object to check
 * @param {number} maxBytes - Maximum allowed size in bytes
 * @returns {string|null} Error message or null if valid
 */
export function validateFileSize(file, maxBytes) {
  if (!file) {
    return null;
  }

  if (typeof file.size === 'number' && file.size > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    return `File size exceeds the maximum limit of ${maxMb} MB`;
  }

  return null;
}

/**
 * Validates that a file's MIME type is in the allowed list.
 *
 * @param {File|Blob|null} file - File object to check
 * @param {string[]} allowedTypes - Array of allowed MIME types (e.g. ['image/jpeg', 'image/png'])
 * @returns {string|null} Error message or null if valid
 */
export function validateFileType(file, allowedTypes) {
  if (!file) {
    return null;
  }

  if (!Array.isArray(allowedTypes)) {
    return null;
  }

  if (!file.type || !allowedTypes.includes(file.type)) {
    return `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`;
  }

  return null;
}

/**
 * Validates that two password inputs match.
 *
 * @param {string} password - Main password
 * @param {string} confirmPassword - Password confirmation
 * @returns {string|null} Error message or null if valid
 */
export function validatePasswordMatch(password, confirmPassword) {
  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
}
