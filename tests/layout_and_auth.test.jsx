import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

import AppLayout from '../src/components/layout/AppLayout';
import Sidebar from '../src/components/layout/Sidebar';
import Topbar from '../src/components/layout/Topbar';
import MobileNavigation from '../src/components/layout/MobileNavigation';

import Login from '../src/pages/Login';
import Register from '../src/pages/Register';
import NotFound from '../src/pages/NotFound';

import * as authService from '../src/services/authService';
import * as demoDataService from '../src/services/demoDataService';

describe('Layout and Authentication Components', () => {
  const mockUser = {
    id: 'user-001',
    name: 'Rohit Sharma',
    email: 'rohit@campus.edu',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'login').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'register').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'logout').mockReturnValue();
    vi.spyOn(demoDataService, 'isDemoDataLoaded').mockResolvedValue(true);
  });

  describe('TASK 1: AppLayout Component', () => {
    it('renders with sidebar, topbar, mobile nav, and children content in app-layout structure', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <AppLayout>
            <div data-testid="test-content">Dashboard Content</div>
          </AppLayout>
        </MemoryRouter>
      );

      // Check outer layout
      const layoutDiv = container.querySelector('.app-layout');
      expect(layoutDiv).toBeInTheDocument();

      // Check sidebar
      const sidebar = container.querySelector('aside.sidebar');
      expect(sidebar).toBeInTheDocument();

      // Check main layout container
      const mainContainer = container.querySelector('.app-layout__main');
      expect(mainContainer).toBeInTheDocument();

      // Check topbar
      const topbar = container.querySelector('.topbar');
      expect(topbar).toBeInTheDocument();

      // Check content container with children
      const content = container.querySelector('main.app-layout__content');
      expect(content).toBeInTheDocument();
      expect(screen.getByTestId('test-content')).toBeInTheDocument();

      // Check mobile navigation
      const mobileNav = container.querySelector('nav.mobile-nav');
      expect(mobileNav).toBeInTheDocument();
    });
  });

  describe('TASK 2: Sidebar Component', () => {
    it('renders brand kite logo and title, 5 navigation links, user initial, and logout button', async () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/dashboard']}>
          <Sidebar />
        </MemoryRouter>
      );

      // Check sidebar element and dark background
      const aside = container.querySelector('aside.sidebar');
      expect(aside).toBeInTheDocument();

      // Brand logo and title
      const brand = container.querySelector('.sidebar-brand');
      expect(brand).toBeInTheDocument();
      expect(screen.getByText('CampusKite')).toBeInTheDocument();
      const svgLogo = brand.querySelector('svg');
      expect(svgLogo).toBeInTheDocument();

      // 5 Navigation links matching routes
      const navLinks = container.querySelectorAll('.sidebar-nav a.sidebar-link');
      expect(navLinks).toHaveLength(5);

      const navLabels = ['Dashboard', 'My Groups', 'Settlements', 'Reports', 'Settings'];
      navLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });

      // Active class on current route /dashboard
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveClass('active');

      // Sidebar footer with user info & logout
      const footer = container.querySelector('.sidebar-footer');
      expect(footer).toBeInTheDocument();

      const logoutBtn = footer.querySelector('button[aria-label="Sign out"]');
      expect(logoutBtn).toBeInTheDocument();

      // Click logout triggers logout
      fireEvent.click(logoutBtn);
      expect(authService.logout).toHaveBeenCalled();
    });
  });

  describe('TASK 3: Topbar Component', () => {
    it('displays mapped route title and topbar actions with Add Expense button and user avatar', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/groups']}>
          <Topbar />
        </MemoryRouter>
      );

      const topbar = container.querySelector('.topbar');
      expect(topbar).toBeInTheDocument();

      // /groups maps to 'My Groups'
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveTextContent('My Groups');

      // Actions
      expect(screen.getByText('Add Expense')).toBeInTheDocument();
      const avatarBtn = container.querySelector('.avatar');
      expect(avatarBtn).toBeInTheDocument();
    });
  });

  describe('TASK 4: MobileNavigation Component', () => {
    it('renders 5 touch-friendly navigation items with icons and active state', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/settlements']}>
          <MobileNavigation />
        </MemoryRouter>
      );

      const nav = container.querySelector('nav.mobile-nav');
      expect(nav).toBeInTheDocument();

      const links = container.querySelectorAll('a.mobile-nav-link');
      expect(links).toHaveLength(5);

      // Check Settlements link has active class
      const settleLink = screen.getByText('Settlements').closest('a');
      expect(settleLink).toHaveClass('active');
    });
  });

  describe('TASK 5: Login Page', () => {
    beforeEach(() => {
      // Unauthenticated state for login test
      vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(null);
    });

    it('renders two-column layout with branding on left and form card on right', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      expect(container.querySelector('.auth-page')).toBeInTheDocument();
      expect(container.querySelector('.auth-branding')).toBeInTheDocument();
      expect(screen.getByText('Split expenses, not friendships')).toBeInTheDocument();
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();

      expect(screen.getByPlaceholderText('you@campus.edu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Register/i })).toBeInTheDocument();
    });

    it('validates email and password on empty submit', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Email is required/i)).toBeInTheDocument();
        expect(screen.getByText(/Password is required/i)).toBeInTheDocument();
      });
      expect(authService.login).not.toHaveBeenCalled();
    });

    it('calls login service with email and password on valid submit', async () => {
      render(
        <MemoryRouter initialEntries={['/login']}>
          <Login />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('you@campus.edu'), {
        target: { value: 'alice@campus.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText('••••••••'), {
        target: { value: 'demo123' },
      });

      const submitBtn = screen.getByRole('button', { name: /Sign In/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(authService.login).toHaveBeenCalledWith('alice@campus.edu', 'demo123');
      });
    });
  });

  describe('TASK 6: Register Page', () => {
    beforeEach(() => {
      vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(null);
    });

    it('renders form fields for name, email, password, and confirm password', () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Register />
        </MemoryRouter>
      );

      expect(screen.getByRole('heading', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Rohit Sharma')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('you@campus.edu')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('At least 6 characters')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Re-enter your password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /Sign In/i })).toBeInTheDocument();
    });

    it('validates password mismatch', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Register />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Rohit Sharma'), {
        target: { value: 'Rohit Sharma' },
      });
      fireEvent.change(screen.getByPlaceholderText('you@campus.edu'), {
        target: { value: 'rohit@campus.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'differentpass' },
      });

      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText(/Passwords do not match/i)).toBeInTheDocument();
      });
      expect(authService.register).not.toHaveBeenCalled();
    });

    it('calls register service on valid submission', async () => {
      render(
        <MemoryRouter initialEntries={['/register']}>
          <Register />
        </MemoryRouter>
      );

      fireEvent.change(screen.getByPlaceholderText('Rohit Sharma'), {
        target: { value: 'Rohit Sharma' },
      });
      fireEvent.change(screen.getByPlaceholderText('you@campus.edu'), {
        target: { value: 'rohit@campus.edu' },
      });
      fireEvent.change(screen.getByPlaceholderText('At least 6 characters'), {
        target: { value: 'password123' },
      });
      fireEvent.change(screen.getByPlaceholderText('Re-enter your password'), {
        target: { value: 'password123' },
      });

      const submitBtn = screen.getByRole('button', { name: /Create Account/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          'Rohit Sharma',
          'rohit@campus.edu',
          'password123'
        );
      });
    });
  });

  describe('TASK 7: NotFound Page', () => {
    it('renders large 404, heading, description, Back to Dashboard button, and geometric accents', () => {
      const { container } = render(
        <MemoryRouter initialEntries={['/unknown-path']}>
          <NotFound />
        </MemoryRouter>
      );

      expect(screen.getByText('404')).toBeInTheDocument();
      expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
      expect(
        screen.getByText(/The page you're looking for doesn't exist or has been moved/i)
      ).toBeInTheDocument();

      const backBtn = screen.getByRole('button', { name: /Back to Dashboard/i });
      expect(backBtn).toBeInTheDocument();

      // Check geometric elements and svg
      expect(container.querySelectorAll('svg')).toHaveLength(2); // Kite graphic + Home icon
    });
  });
});
