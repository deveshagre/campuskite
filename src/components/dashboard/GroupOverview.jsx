import { Link, useNavigate } from 'react-router-dom';
import EmptyState from '../common/EmptyState';
import { formatCurrency } from '../../utils/currency';
import { Users, ArrowRight } from 'lucide-react';

export default function GroupOverview({ groups = [], onCreateGroup }) {
  const navigate = useNavigate();

  return (
    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="card-header">
        <h3 className="card-title">Your Groups</h3>
        <Link
          to="/groups"
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '0.875rem',
            color: 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            textDecoration: 'none',
          }}
        >
          See All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="card-body">
        {groups.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No groups yet"
            description="Create your first group to start splitting dorm, mess, or trip expenses."
            actionText="Create Your First Group"
            onAction={onCreateGroup || (() => navigate('/groups'))}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 'var(--space-md)',
            }}
          >
            {groups.map((group) => {
              const balance = group.balance || 0;
              const isPositive = balance > 0;
              const isNegative = balance < 0;
              const isZero = balance === 0;

              return (
                <div
                  key={group.id}
                  onClick={() => navigate(`/groups/${group.id}`)}
                  className="card card-interactive"
                  style={{
                    padding: 'var(--space-md)',
                    borderLeft: `8px solid ${group.color || 'var(--primary)'}`,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    minHeight: '130px',
                  }}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/groups/${group.id}`);
                    }
                  }}
                >
                  <div>
                    <h4
                      style={{
                        margin: 0,
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 700,
                        fontSize: '1.15rem',
                        color: 'var(--text)',
                        marginBottom: '4px',
                      }}
                    >
                      {group.name}
                    </h4>
                    {group.description && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.85rem',
                          color: 'var(--text-secondary)',
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
                      borderTop: '1px solid var(--border-light)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Users size={16} />
                      <span>
                        {group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <span
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
                          ? 'Settled up'
                          : isPositive
                          ? `+${formatCurrency(balance)}`
                          : `-${formatCurrency(Math.abs(balance))}`}
                      </span>
                      {!isZero && (
                        <div
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: isPositive ? 'var(--success)' : 'var(--danger)',
                          }}
                        >
                          {isPositive ? 'owed to you' : 'you owe'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
