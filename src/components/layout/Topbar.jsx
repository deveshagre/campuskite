import React from 'react';
import { useLocation } from 'react-router-dom';
import { Plus } from 'lucide-react';
import Button from '../common/Button';
import useAuth from '../../hooks/useAuth';

const ROUTE_TITLES = {
  '/dashboard': 'Dashboard',
  '/groups': 'My Groups',
  '/settlements': 'Settlements',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/expenses': 'Expenses',
  '/login': 'Sign In',
  '/register': 'Register',
};

/**
 * Derives a clean page title from pathname
 *
 * @param {string} pathname
 * @returns {string} Page title
 */
function getPageTitle(pathname) {
  if (ROUTE_TITLES[pathname]) {
    return ROUTE_TITLES[pathname];
  }

  if (pathname.startsWith('/groups/')) {
    return 'Group Details';
  }
  if (pathname.startsWith('/expenses/')) {
    return 'Expense Details';
  }

  const segment = pathname.replace(/^\//, '').split('/')[0];
  if (segment) {
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }

  return 'Dashboard';
}

/**
 * Topbar Component
 * Title from current route + Add Expense button and user avatar initial.
 */
export default function Topbar() {
  const location = useLocation();
  const { user } = useAuth();
  const title = getPageTitle(location.pathname);
  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <header className="topbar">
      <h1 className="topbar-title">{title}</h1>

      <div className="topbar-actions">
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={18} />}
          onClick={() => {
            // Visual Add Expense action button
          }}
        >
          Add Expense
        </Button>

        <button
          type="button"
          className="avatar avatar-sm avatar-yellow"
          title={user?.name || 'User Profile'}
          aria-label={user?.name ? `${user.name}'s profile` : 'User profile'}
          style={{
            cursor: 'pointer',
            border: '2px solid var(--border)',
            fontWeight: 700,
            color: 'var(--text)',
            fontSize: '0.85rem',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initial}
        </button>
      </div>
    </header>
  );
}

export { Topbar };
