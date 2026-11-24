import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  BarChart3,
  Settings2,
} from 'lucide-react';

/**
 * MobileNavigation - Sticky bottom navigation for mobile screens
 * Touch-friendly (56px height minimum)
 */
export default function MobileNavigation() {
  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/groups', label: 'My Groups', icon: Users },
    { to: '/settlements', label: 'Settlements', icon: ArrowLeftRight },
    { to: '/reports', label: 'Reports', icon: BarChart3 },
    { to: '/settings', label: 'Settings', icon: Settings2 },
  ];

  return (
    <nav className="mobile-nav" aria-label="Mobile Navigation" style={{ minHeight: '56px' }}>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
            style={{ minHeight: '56px' }}
          >
            <Icon size={20} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

export { MobileNavigation };
