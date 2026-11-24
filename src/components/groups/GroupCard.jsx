import { useNavigate } from 'react-router-dom';
import { Users } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

export default function GroupCard({ group, onClick }) {
  const navigate = useNavigate();
  const balance = group.balance || 0;
  const isPositive = balance > 0;
  const isNegative = balance < 0;
  const isZero = balance === 0;

  const handleClick = () => {
    if (onClick) {
      onClick(group);
    } else {
      navigate(`/groups/${group.id}`);
    }
  };

  return (
    <div
      className="card card-interactive"
      onClick={handleClick}
      style={{
        borderLeft: `8px solid ${group.color || 'var(--primary)'}`,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        minHeight: '160px',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontFamily: 'var(--font-heading)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: 'var(--text)',
            marginBottom: '6px',
          }}
        >
          {group.name}
        </h3>
        {group.description && (
          <p
            style={{
              margin: 0,
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {group.description}
          </p>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 'var(--space-md)',
          paddingTop: 'var(--space-sm)',
          borderTop: '2px solid var(--border-light)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          <Users size={18} />
          <span>
            {group.memberCount || 0}{' '}
            {group.memberCount === 1 ? 'member' : 'members'}
          </span>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 800,
              fontSize: '1.05rem',
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
              fontSize: '0.75rem',
              fontWeight: 600,
              color: isPositive
                ? 'var(--success)'
                : isNegative
                ? 'var(--danger)'
                : 'var(--text-secondary)',
            }}
          >
            {isZero ? 'All settled' : isPositive ? 'owed to you' : 'you owe'}
          </span>
        </div>
      </div>
    </div>
  );
}
