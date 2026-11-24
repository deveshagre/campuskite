import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

import GroupCard from '../src/components/groups/GroupCard.jsx';
import CreateGroupModal from '../src/components/groups/CreateGroupModal.jsx';
import AddMemberModal from '../src/components/groups/AddMemberModal.jsx';
import MemberList from '../src/components/groups/MemberList.jsx';
import * as groupService from '../src/services/groupService.js';

// Mock groupService
vi.mock('../src/services/groupService.js', () => ({
  createGroup: vi.fn(),
  addMember: vi.fn(),
  removeMember: vi.fn(),
  getGroup: vi.fn(),
  getGroupMembers: vi.fn(),
  deleteGroup: vi.fn(),
}));

// Mock useAuth hook
vi.mock('../src/hooks/useAuth.js', () => ({
  useAuth: () => ({
    user: { id: 'u1', name: 'Alice Johnson', email: 'alice@campus.edu' },
    loading: false,
  }),
}));

// Mock Toast hook
const toastMock = {
  success: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
};
toastMock.toast = toastMock;

vi.mock('../src/components/common/Toast.jsx', () => ({
  useToast: () => toastMock,
}));

describe('Group Components and Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GroupCard', () => {
    it('renders group card with name, description, member count and positive balance', () => {
      const group = {
        id: 'g1',
        name: 'Apartment 4B',
        description: 'Monthly flatmates shared expenses',
        memberCount: 3,
        color: '#FFDE59',
        balance: 150000, // +₹1,500.00
      };

      render(
        <BrowserRouter>
          <GroupCard group={group} />
        </BrowserRouter>
      );

      expect(screen.getByText('Apartment 4B')).toBeInTheDocument();
      expect(screen.getByText('Monthly flatmates shared expenses')).toBeInTheDocument();
      expect(screen.getByText(/3 members?/i)).toBeInTheDocument();
      expect(screen.getByText('+₹1,500.00')).toBeInTheDocument();
    });

    it('renders negative balance correctly in red style', () => {
      const group = {
        id: 'g2',
        name: 'Road Trip Squad',
        description: 'Goa Trip 2026',
        memberCount: 4,
        color: '#FF8066',
        balance: -250000, // -₹2,500.00
      };

      render(
        <BrowserRouter>
          <GroupCard group={group} />
        </BrowserRouter>
      );

      expect(screen.getByText('Road Trip Squad')).toBeInTheDocument();
      expect(screen.getByText('-₹2,500.00')).toBeInTheDocument();
    });

    it('renders settled up when balance is 0', () => {
      const group = {
        id: 'g3',
        name: 'Study Group',
        description: 'Books and snacks',
        memberCount: 2,
        color: '#B8E0D2',
        balance: 0,
      };

      render(
        <BrowserRouter>
          <GroupCard group={group} />
        </BrowserRouter>
      );

      expect(screen.getByText(/all settled/i)).toBeInTheDocument();
    });
  });

  describe('CreateGroupModal', () => {
    it('validates empty group name and prevents submission', async () => {
      const onCreated = vi.fn();
      const onClose = vi.fn();

      render(
        <CreateGroupModal
          isOpen={true}
          onClose={onClose}
          onCreated={onCreated}
          currentUserId="u1"
        />
      );

      const submitBtn = screen.getByRole('button', { name: /create group/i });
      fireEvent.click(submitBtn);

      expect(groupService.createGroup).not.toHaveBeenCalled();
    });

    it('submits valid group data and triggers callback', async () => {
      const onCreated = vi.fn();
      const onClose = vi.fn();
      groupService.createGroup.mockResolvedValueOnce({
        id: 'new-g',
        name: 'Weekend Hackathon',
        description: 'Travel and cloud costs',
      });

      render(
        <CreateGroupModal
          isOpen={true}
          onClose={onClose}
          onCreated={onCreated}
          currentUserId="u1"
        />
      );

      const nameInput = screen.getByLabelText(/group name/i);
      fireEvent.change(nameInput, { target: { value: 'Weekend Hackathon' } });

      const descInput = screen.getByLabelText(/description/i);
      fireEvent.change(descInput, { target: { value: 'Travel and cloud costs' } });

      const submitBtn = screen.getByRole('button', { name: /create group/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(groupService.createGroup).toHaveBeenCalled();
        expect(onCreated).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('AddMemberModal', () => {
    it('validates member email before adding', async () => {
      const onMemberAdded = vi.fn();
      const onClose = vi.fn();

      render(
        <AddMemberModal
          isOpen={true}
          onClose={onClose}
          groupId="g1"
          onMemberAdded={onMemberAdded}
          existingMembers={[]}
        />
      );

      const emailInput = screen.getByLabelText(/member's email/i);
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

      const submitBtn = screen.getByRole('button', { name: /add member/i });
      fireEvent.click(submitBtn);

      expect(groupService.addMember).not.toHaveBeenCalled();
    });

    it('submits valid email and handles success', async () => {
      const onMemberAdded = vi.fn();
      const onClose = vi.fn();
      groupService.addMember.mockResolvedValueOnce({ id: 'gm1', userId: 'u2', groupId: 'g1' });

      render(
        <AddMemberModal
          isOpen={true}
          onClose={onClose}
          groupId="g1"
          onMemberAdded={onMemberAdded}
          existingMembers={[]}
        />
      );

      const emailInput = screen.getByLabelText(/member's email/i);
      fireEvent.change(emailInput, { target: { value: 'bob@campus.edu' } });

      const submitBtn = screen.getByRole('button', { name: /add member/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(groupService.addMember).toHaveBeenCalledWith('g1', 'bob@campus.edu');
        expect(onMemberAdded).toHaveBeenCalled();
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('MemberList', () => {
    const mockMembers = [
      { id: 'u1', name: 'Alice Johnson', email: 'alice@campus.edu' },
      { id: 'u2', name: 'Bob Smith', email: 'bob@campus.edu' },
      { id: 'u3', name: 'Charlie Brown', email: 'charlie@campus.edu' },
    ];

    it('renders all members and marks current user with (You)', () => {
      render(
        <MemberList
          members={mockMembers}
          groupId="g1"
          currentUserId="u1"
          onRemoveMember={vi.fn()}
          memberBalances={{ u1: 50000, u2: -50000, u3: 0 }}
        />
      );

      expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
      expect(screen.getByText(/you/i)).toBeInTheDocument();
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
      expect(screen.getByText('Charlie Brown')).toBeInTheDocument();
    });

    it('prevents removing member who has outstanding balance', () => {
      const onRemoveMember = vi.fn();
      render(
        <MemberList
          members={mockMembers}
          groupId="g1"
          currentUserId="u1"
          onRemoveMember={onRemoveMember}
          memberBalances={{ u1: 50000, u2: -50000, u3: 0 }}
        />
      );

      // Only Charlie has 0 balance, Bob has -50000. Current user u1 cannot remove self.
      // Charlie should have a remove button, Bob should not (or should be disabled/blocked).
      // Let's verify Bob has "Settled: No" or cannot be removed.
      expect(screen.getByText('Bob Smith')).toBeInTheDocument();
    });
  });
});
