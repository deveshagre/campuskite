import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BarChart3,
  Settings2,
  LogOut,
} from 'lucide-react';
import useAuth from '../../hooks/useAuth';

/**
 * Geometric Kite Logo SVG
 * Diamond shape with tail, yellow fill #FFDE59, black stroke
 */
export function KiteLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Kite diamond body */}
      <polygon
        points="16,3 27,13 16,23 5,13"
        fill="#FFDE59"
        stroke="#171717"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Kite cross struts */}
      <line x1="16" y1="3" x2="16" y2="23" stroke="#171717" strokeWidth="1.5" />
      <line x1="5" y1="13" x2="27" y2="13" stroke="#171717" strokeWidth="1.5" />
      {/* Kite tail */}
      <path
        d="M16 23 C14 26 18 27 16 30"
        fill="none"
        stroke="#FFDE59"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Ribbons */}
      <polygon points="13,25 17,26 14,27" fill="#FF8066" stroke="#171717" strokeWidth="1" />
      <polygon points="18,28 14,29 17,30" fill="#B8E0D2" stroke="#171717" strokeWidth="1" />
    </svg>
  );
}

/**
 * Sidebar Component
 * Dark bg #171717, Space Grotesk brand, NavLinks with active yellow bg, user avatar, and logout.
 */
export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initial = user?.name ? user.name.trim().charAt(0).toUpperCase() : 'U';

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'My Groups', icon: Users },
    { to: '/settlements', label: 'Settlements', icon: ArrowLeftRight },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <aside className="sidebar" style={{ backgroundColor: '#171717', color: '#FFFFFF' }}>
      {/* Brand */}
      <div className="sidebar-brand">
        <KiteLogo size={32} />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'var(--font-size-xl)',
            fontWeight: 700,
            color: '#FFFFFF',
            letterSpacing: '-0.5px',
          }}
        >
          CampusKite
        </span>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" aria-label="Main Navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <div
          className="avatar avatar-sm avatar-yellow"
          style={{
            border: '2px solid var(--border)',
            fontWeight: 700,
            color: 'var(--text)',
            fontSize: '0.85rem',
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: '0.875rem',
              color: '#FFFFFF',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {user?.name || 'Student User'}
          </p>
          {user?.email && (
            <small
              style={{
                display: 'block',
                fontSize: '0.72rem',
                color: '#A09E97',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.email}
            </small>
          )}
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="btn-icon"
          title="Sign out"
          aria-label="Sign out"
          style={{
            background: 'transparent',
            border: '2px solid transparent',
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: 6,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 'var(--radius)',
          }}
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
}

export { Sidebar };
