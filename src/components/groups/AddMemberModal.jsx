import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useToast } from '../common/Toast';
import * as groupService from '../../services/groupService';

export default function AddMemberModal({
  isOpen,
  onClose,
  groupId,
  onMemberAdded,
  existingMembers = [],
}) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setEmail('');
    setError('');
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Please enter a member's email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    // Check if member already in group
    const isAlreadyMember = existingMembers.some(
      (m) => (m.email || '').toLowerCase() === normalizedEmail
    );
    if (isAlreadyMember) {
      setError('Already a member of this group');
      return;
    }

    setLoading(true);
    try {
      const addedMember = await groupService.addMember(groupId, normalizedEmail);
      toast.success('Member added successfully!');
      onMemberAdded?.(addedMember);
      handleClose();
    } catch (err) {
      let message = err.message || 'Failed to add member';
      if (message.includes('User not found')) {
        message = 'No account found with this email';
      } else if (message.includes('already a member')) {
        message = 'Already a member of this group';
      }
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Member to Group"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Add Member
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {error && (
          <div
            style={{
              padding: '10px 14px',
              backgroundColor: '#FFF5F5',
              border: '2px solid var(--danger)',
              borderRadius: 'var(--radius)',
              color: 'var(--danger)',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        )}

        <Input
          label="Member's Email"
          type="email"
          placeholder="Enter registered email (e.g. friend@campus.edu)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          helperText="The person must have a CampusKite account"
          required
          autoFocus
        />
      </form>
    </Modal>
  );
}
