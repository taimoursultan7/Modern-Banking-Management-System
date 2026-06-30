// ============================================================
// LocalStorage Utility Functions
// ============================================================

import { Account, Transaction, User, Notification } from '../types';

const KEYS = {
  ACCOUNTS: 'nexabank_accounts',
  TRANSACTIONS: 'nexabank_transactions',
  USERS: 'nexabank_users',
  NOTIFICATIONS: 'nexabank_notifications',
  CURRENT_USER: 'nexabank_current_user',
  THEME: 'nexabank_theme',
};

// Generic get
function get<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Generic set
function set<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// Accounts
export const getAccounts = (): Account[] => get<Account>(KEYS.ACCOUNTS);
export const saveAccounts = (accounts: Account[]): void => set(KEYS.ACCOUNTS, accounts);

// Transactions
export const getTransactions = (): Transaction[] => get<Transaction>(KEYS.TRANSACTIONS);
export const saveTransactions = (transactions: Transaction[]): void => set(KEYS.TRANSACTIONS, transactions);

// Users
export const getUsers = (): User[] => get<User>(KEYS.USERS);
export const saveUsers = (users: User[]): void => set(KEYS.USERS, users);

// Notifications
export const getNotifications = (): Notification[] => get<Notification>(KEYS.NOTIFICATIONS);
export const saveNotifications = (notifications: Notification[]): void => set(KEYS.NOTIFICATIONS, notifications);

// Current User Session
export const getCurrentUser = (): User | null => {
  try {
    const data = localStorage.getItem(KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};
export const saveCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(KEYS.CURRENT_USER);
  }
};

// Theme
export const getTheme = (): string => localStorage.getItem(KEYS.THEME) || 'light';
export const saveTheme = (theme: string): void => localStorage.setItem(KEYS.THEME, theme);

// Clear all data
export const clearAll = (): void => {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
};
