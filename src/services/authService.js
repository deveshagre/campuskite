/**
 * @file authService.js
 * @description Local authentication service using IndexedDB and SubtleCrypto PBKDF2.
 * Handles user registration, secure password hashing, session management, and profile updates.
 */

import { getById, getByIndex, put } from './database.js';
import { validateEmail, validatePassword, validateRequired } from '../utils/validation.js';

export const SESSION_KEY = 'campuskite_session';

/**
 * Encodes an ArrayBuffer or Uint8Array into a lowercase hexadecimal string.
 *
 * @param {ArrayBuffer|Uint8Array} buffer - Buffer to encode
 * @returns {string} Hexadecimal string
 */
export function hexEncode(buffer) {
  const byteArray = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let hex = '';
  for (let i = 0; i < byteArray.length; i++) {
    hex += byteArray[i].toString(16).padStart(2, '0');
  }
  return hex;
}

/**
 * Decodes a hexadecimal string into a Uint8Array.
 *
 * @param {string} hex - Hexadecimal string to decode
 * @returns {Uint8Array} Decoded byte array
 */
export function hexDecode(hex) {
  if (typeof hex !== 'string') {
    throw new Error('hexDecode expects a hexadecimal string');
  }
  const cleanHex = hex.trim();
  const length = cleanHex.length / 2;
  const uint8 = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    uint8[i] = parseInt(cleanHex.substring(i * 2, i * 2 + 2), 16);
  }
  return uint8;
}

/**
 * Generates a cryptographically random 16-byte salt as a hex string.
 *
 * @returns {string} 32-character hex salt
 */
export function generateSalt() {
  const saltBytes = new Uint8Array(16);
  crypto.getRandomValues(saltBytes);
  return hexEncode(saltBytes);
}

/**
 * Derives a PBKDF2 hash using SubtleCrypto (100,000 iterations, SHA-256, 256 bits).
 *
 * @param {string} password - Raw password
 * @param {string|Uint8Array} salt - Hex salt string or Uint8Array
 * @returns {Promise<string>} Derived hex hash string
 */
export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const saltBuffer = typeof salt === 'string' ? hexDecode(salt) : salt;

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  return hexEncode(derivedBits);
}

/**
 * Sanitizes a user object by removing passwordHash and salt.
 *
 * @param {Object|null} user - Raw user record
 * @returns {Object|null} Sanitized user record
 */
function sanitizeUser(user) {
  if (!user) return null;
  const safeUser = { ...user };
  delete safeUser.passwordHash;
  delete safeUser.salt;
  return safeUser;
}

/**
 * Registers a new user in the database.
 * Validates inputs, ensures unique email, hashes password with PBKDF2, saves record, and stores session.
 *
 * @param {string} name - User full name
 * @param {string} email - User email address
 * @param {string} password - User plain text password
 * @returns {Promise<Object>} Sanitized user object
 * @throws {Error} If validation fails or email already registered
 */
export async function register(name, email, password) {
  const nameError = validateRequired(name, 'Name');
  if (nameError) throw new Error(nameError);

  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  const passwordError = validatePassword(password);
  if (passwordError) throw new Error(passwordError);

  const normalizedEmail = email.trim().toLowerCase();

  // Check for duplicate email
  const existingUsers = await getByIndex('users', 'email', normalizedEmail);
  if (existingUsers && existingUsers.length > 0) {
    throw new Error('A user with this email already exists');
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);

  const newUser = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash,
    salt,
    createdAt: new Date().toISOString(),
  };

  await put('users', newUser);

  // Store active session
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: newUser.id, loginTime: new Date().toISOString() })
    );
  }

  return sanitizeUser(newUser);
}

/**
 * Authenticates a user by email and password.
 * On success, stores session in localStorage and returns the sanitized user.
 *
 * @param {string} email - User email
 * @param {string} password - User plain text password
 * @returns {Promise<Object>} Sanitized user object
 * @throws {Error} If credentials are invalid
 */
export async function login(email, password) {
  const emailError = validateEmail(email);
  if (emailError) throw new Error(emailError);

  if (!password) {
    throw new Error('Password is required');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const users = await getByIndex('users', 'email', normalizedEmail);
  const user = users && users[0];

  if (!user) {
    throw new Error('Invalid email or password');
  }

  const computedHash = await hashPassword(password, user.salt);
  if (computedHash !== user.passwordHash) {
    throw new Error('Invalid email or password');
  }

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(
      SESSION_KEY,
      JSON.stringify({ userId: user.id, loginTime: new Date().toISOString() })
    );
  }

  return sanitizeUser(user);
}

/**
 * Logs out the current user by clearing the session from localStorage.
 */
export function logout() {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}

/**
 * Retrieves the currently logged in user from localStorage and IndexedDB.
 *
 * @returns {Promise<Object|null>} Sanitized user object or null if not authenticated
 */
export async function getCurrentUser() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) {
    return null;
  }

  try {
    const session = JSON.parse(sessionStr);
    if (!session || !session.userId) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    const user = await getById('users', session.userId);
    if (!user) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }

    return sanitizeUser(user);
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

/**
 * Updates a user's profile information (name only).
 *
 * @param {string} userId - User ID
 * @param {{ name?: string }} updates - Updates object containing name
 * @returns {Promise<Object>} Updated sanitized user object
 * @throws {Error} If user not found or name invalid
 */
export async function updateProfile(userId, updates) {
  const user = await getById('users', userId);
  if (!user) {
    throw new Error(`User not found with id '${userId}'`);
  }

  if (updates && updates.name !== undefined) {
    const nameError = validateRequired(updates.name, 'Name');
    if (nameError) throw new Error(nameError);
    user.name = updates.name.trim();
  }

  user.updatedAt = new Date().toISOString();
  await put('users', user);

  return sanitizeUser(user);
}

/**
 * Changes a user's password after verifying the old password.
 *
 * @param {string} userId - User ID
 * @param {string} oldPassword - Current password
 * @param {string} newPassword - New password (must be at least 6 chars)
 * @returns {Promise<Object>} Updated sanitized user object
 * @throws {Error} If old password incorrect or new password invalid
 */
export async function changePassword(userId, oldPassword, newPassword) {
  const user = await getById('users', userId);
  if (!user) {
    throw new Error(`User not found with id '${userId}'`);
  }

  const oldHash = await hashPassword(oldPassword, user.salt);
  if (oldHash !== user.passwordHash) {
    throw new Error('Current password is incorrect');
  }

  const newPasswordError = validatePassword(newPassword);
  if (newPasswordError) {
    throw new Error(newPasswordError);
  }

  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);

  user.salt = newSalt;
  user.passwordHash = newHash;
  user.updatedAt = new Date().toISOString();

  await put('users', user);

  return sanitizeUser(user);
}
