import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../common/Toast';
import * as groupService from '../../services/groupService';
import { Check } from 'lucide-react';

const COLOR_SWATCHES = [
  { name: 'Yellow', hex: '#FFDE59' },
  { name: 'Mint', hex: '#B8E0D2' },
  { name: 'Coral', hex: '#FF8066' },
  { name: 'Blue', hex: '#93C5FD' },
  { name: 'Lavender', hex: '#C4B5FD' },
];

export default function CreateGroupModal({ isOpen, onClose, onCreated, currentUserId }) {
  const auth = useAuth?.() || {};
  const user = auth.user;
  const creatorId = user?.id || currentUserId;
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFDE59');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClose = () => {
    setName('');
    setDescription('');
    setSelectedColor('#FFDE59');
    setError('');
    onClose?.();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Group name is required');
      return;
    }

    if (!creatorId) {
      setError('You must be signed in to create a group');
      return;
    }

    setLoading(true);
    try {
      const newGroup = await groupService.createGroup(
        name.trim(),
        description.trim(),
        selectedColor,
        creatorId
      );
      toast.success('Group created successfully!');
      onCreated?.(newGroup);
      handleClose();
    } catch (err) {
      setError(err.message || 'Failed to create group');
      toast.error(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Create New Group"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmit} loading={loading}>
            Create Group
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
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
          label="Group Name"
          placeholder="e.g. Apartment 4B, Goa Trip, Mess Squad"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoFocus
        />

        <div className="input-group">
          <label className="input-label" htmlFor="group-desc">
            Description
          </label>
          <textarea
            id="group-desc"
            className="input"
            rows={3}
            placeholder="What is this group for? (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <div className="input-group">
          <label className="input-label">Theme Color</label>
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginTop: '6px' }}>
            {COLOR_SWATCHES.map((swatch) => {
              const isSelected = selectedColor === swatch.hex;
              return (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => setSelectedColor(swatch.hex)}
                  title={swatch.name}
                  aria-label={`Select ${swatch.name} color`}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: swatch.hex,
                    border: '3px solid var(--border)',
                    boxShadow: isSelected ? '0 0 0 2px var(--border), 4px 4px 0px var(--border)' : '3px 3px 0px var(--border)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: isSelected ? 'scale(1.1)' : 'none',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  {isSelected && <Check size={20} strokeWidth={3} color="var(--text)" />}
                </button>
              );
            })}
          </div>
        </div>
      </form>
    </Modal>
  );
}
