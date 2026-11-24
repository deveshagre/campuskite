import { useState } from 'react';
import ConfirmDialog from '../common/ConfirmDialog';
import { formatCurrency } from '../../utils/currency';
import { X } from 'lucide-react';

const AVATAR_COLORS = [
  'avatar-yellow',
  'avatar-mint',
  'avatar-coral',
  'avatar-purple',
  'avatar-blue',
  'avatar-orange',
];

function getAvatarColor(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name = '') {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export default function MemberList({
  members = [],
  groupId,
  currentUserId,
  onRemoveMember,
  memberBalances = {},
}) {
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleConfirmRemove = async () => {
    if (!memberToRemove) return;
    setIsRemoving(true);
    try {
      await onRemoveMember?.(memberToRemove.userId);
      setMemberToRemove(null);
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
        {members.map((member) => {
          const memberId = member.userId || member.id;
          const isCurrentUser = memberId === currentUserId;
          const balance = memberBalances[memberId] || 0;
          const isPositive = balance > 0;
          const isNegative = balance < 0;
          const isZero = balance === 0;
          const canRemove = !isCurrentUser && isZero;
          const avatarColorClass = getAvatarColor(member.name || member.email);

          return (
            <div
              key={member.id || member.userId}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                border: '2px solid var(--border)',
                borderRadius: 'var(--radius)',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-sm)',
                gap: 'var(--space-md)',
              }}
            >
              {/* Member avatar and info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0, flex: 1 }}>
                <div className={`avatar avatar-md ${avatarColorClass}`}>
                  {getInitials(member.name || member.email)}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text)',
                      }}
                    >
                      {member.name || 'Member'}
                    </span>
                    {isCurrentUser && (
                      <span
                        style={{
                          backgroundColor: 'var(--primary)',
                          border: '1.5px solid var(--border)',
                          padding: '1px 6px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        You
                      </span>
                    )}
                  </div>
                  <div
                    style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {member.email}
                  </div>
                </div>
              </div>

              {/* Balance and Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: isPositive
                        ? 'var(--success)'
                        : isNegative
                        ? 'var(--danger)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isZero
                      ? 'Settled'
                      : isPositive
                      ? `+${formatCurrency(balance)}`
                      : `-${formatCurrency(Math.abs(balance))}`}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: isPositive
                        ? 'var(--success)'
                        : isNegative
                        ? 'var(--danger)'
                        : 'var(--text-secondary)',
                    }}
                  >
                    {isZero ? '₹0.00' : isPositive ? 'gets back' : 'owes'}
                  </span>
                </div>

                {canRemove && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(member)}
                    title={`Remove ${member.name} from group`}
                    aria-label={`Remove ${member.name} from group`}
                    style={{
                      width: '32px',
                      height: '32px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: 'var(--surface)',
                      boxShadow: '2px 2px 0px var(--border)',
                      cursor: 'pointer',
                      transition: 'transform 0.1s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--coral)';
                      e.currentTarget.style.transform = 'translate(1px, 1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--surface)';
                      e.currentTarget.style.transform = 'none';
                    }}
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        isOpen={!!memberToRemove}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleConfirmRemove}
        title="Remove Member"
        message={`Are you sure you want to remove ${memberToRemove?.name || 'this member'} from the group?`}
        confirmText="Remove Member"
        danger={true}
        loading={isRemoving}
      />
    </>
  );
}
