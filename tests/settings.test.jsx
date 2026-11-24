import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Settings from '../src/pages/Settings';
import { AuthProvider } from '../src/context/AuthContext';
import * as authService from '../src/services/authService';
import * as demoDataService from '../src/services/demoDataService';
import * as storageService from '../src/services/storageService';

describe('Settings Page', () => {
  const mockUser = {
    id: 'user-123',
    name: 'Alice Johnson',
    email: 'alice@campus.edu',
    createdAt: '2026-08-15T10:00:00.000Z',
  };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(authService, 'getCurrentUser').mockResolvedValue(mockUser);
    vi.spyOn(authService, 'updateProfile').mockResolvedValue({
      ...mockUser,
      name: 'Alice Cooper',
    });
    vi.spyOn(authService, 'changePassword').mockResolvedValue({
      ...mockUser,
    });
    vi.spyOn(authService, 'logout').mockReturnValue();
    vi.spyOn(demoDataService, 'loadDemoData').mockResolvedValue({
      users: [],
      groups: [],
    });
    vi.spyOn(demoDataService, 'clearAllData').mockResolvedValue();
    vi.spyOn(storageService, 'exportAllData').mockResolvedValue({
      users: [mockUser],
      groups: [],
    });
    vi.spyOn(storageService, 'importAllData').mockResolvedValue(true);
  });

  function renderWithProviders(ui) {
    return render(
      <MemoryRouter>
        <AuthProvider>{ui}</AuthProvider>
      </MemoryRouter>
    );
  }

  it('renders all 6 distinct settings sections with h3 headings and card containers', async () => {
    const { container } = renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Account Information')).toBeInTheDocument();
    });

    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Demo Data')).toBeInTheDocument();
    expect(screen.getByText('Data Management')).toBeInTheDocument();
    expect(screen.getByText('About CampusKite')).toBeInTheDocument();
    expect(screen.getByText('Sign Out')).toBeInTheDocument();

    const sections = container.querySelectorAll('.card.settings-section');
    expect(sections.length).toBe(6);
  });

  it('Section 1: updates profile display name when saved', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText(/display name/i)).toHaveValue('Alice Johnson');
    });

    const nameInput = screen.getByLabelText(/display name/i);
    fireEvent.change(nameInput, { target: { value: 'Alice Cooper' } });

    const saveButton = screen.getByRole('button', { name: /^save$/i });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(authService.updateProfile).toHaveBeenCalledWith('user-123', {
        name: 'Alice Cooper',
      });
    });
  });

  it('Section 2: validates password fields and calls changePassword on valid input', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    });

    const currentPass = screen.getByLabelText(/current password/i);
    const newPass = screen.getByLabelText(/^new password/i);
    const confirmPass = screen.getByLabelText(/confirm new password/i);
    const changeBtn = screen.getByRole('button', { name: /change password/i });

    // 1. Test empty fields validation
    fireEvent.click(changeBtn);
    expect(screen.getByText(/all password fields are required/i)).toBeInTheDocument();

    // 2. Test short password
    fireEvent.change(currentPass, { target: { value: 'demo123' } });
    fireEvent.change(newPass, { target: { value: '123' } });
    fireEvent.change(confirmPass, { target: { value: '123' } });
    fireEvent.click(changeBtn);
    expect(screen.getByText('New password must be at least 6 characters')).toBeInTheDocument();

    // 3. Test mismatch password
    fireEvent.change(newPass, { target: { value: 'secret123' } });
    fireEvent.change(confirmPass, { target: { value: 'secret456' } });
    fireEvent.click(changeBtn);
    expect(screen.getByText(/do not match/i)).toBeInTheDocument();

    // 4. Test valid submission
    fireEvent.change(confirmPass, { target: { value: 'secret123' } });
    fireEvent.click(changeBtn);

    await waitFor(() => {
      expect(authService.changePassword).toHaveBeenCalledWith(
        'user-123',
        'demo123',
        'secret123'
      );
    });
  });

  it('Section 3: triggers confirmation dialogs for loading and clearing demo data', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /load demo data/i })).toBeInTheDocument();
    });

    // Test Load Demo Data Dialog
    fireEvent.click(screen.getByRole('button', { name: /load demo data/i }));
    expect(screen.getByText('Load Demo Data?')).toBeInTheDocument();

    const confirmLoadBtn = screen.getAllByRole('button', { name: /load demo data/i })[1];
    fireEvent.click(confirmLoadBtn);

    await waitFor(() => {
      expect(demoDataService.loadDemoData).toHaveBeenCalled();
    });

    // Test Clear All Data Dialog
    fireEvent.click(screen.getByRole('button', { name: /clear all data/i }));
    expect(screen.getByText('Clear All Data?')).toBeInTheDocument();

    const confirmClearBtn = screen.getByRole('button', { name: /delete all data/i });
    fireEvent.click(confirmClearBtn);

    await waitFor(() => {
      expect(demoDataService.clearAllData).toHaveBeenCalled();
    });
  });

  it('Section 4: triggers export download when clicking Export Data', async () => {
    // Mock URL methods
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export data/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /export data/i }));

    await waitFor(() => {
      expect(storageService.exportAllData).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
    });
  });

  it('Section 5: displays About CampusKite version and badges', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
      expect(screen.getByText('Frontend-only application')).toBeInTheDocument();
      expect(
        screen.getByText('All data is stored locally in your browser')
      ).toBeInTheDocument();
      expect(
        screen.getByText('Data does not sync across devices or browsers')
      ).toBeInTheDocument();
    });
  });

  it('Section 6: handles Sign Out confirmation dialog', async () => {
    renderWithProviders(<Settings />);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /sign out of campuskite/i })
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /sign out of campuskite/i }));
    expect(screen.getByText('Sign Out?')).toBeInTheDocument();

    const confirmSignOut = screen.getByRole('button', { name: /^sign out$/i });
    fireEvent.click(confirmSignOut);

    await waitFor(() => {
      expect(authService.logout).toHaveBeenCalled();
    });
  });
});
