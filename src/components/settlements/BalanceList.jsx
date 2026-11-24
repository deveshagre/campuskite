import React from 'react';
import { formatCurrency } from '../../utils/currency';
import Button from '../common/Button';
import Badge from '../common/Badge';
import { ArrowUpRight, ArrowDownLeft, CheckCircle2 } from 'lucide-react';

/**
 * BalanceList Component
 *
 * Displays a breakdown of debts: "You Owe" and "Others Owe You".
 *
 * @param {Object} props
 * @param {Array<{ from: string, to: string, amount: number, fromName?: string, toName?: string }>} props.debts
 * @param {string} props.currentUserId
 * @param {Function} [props.onSettle] - Callback when "Settle Up" is clicked for a debt you owe
 */
export default function BalanceList({
  debts = [],
  currentUserId,
  onSettle,
}) {
  const youOwe = debts.filter((d) => d.from === currentUserId);
  const othersOweYou = debts.filter((d) => d.to === currentUserId);

  const getInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 'var(--space-lg)',
        marginBottom: 'var(--space-xl)',
      }}
    >
      {/* SECTION 1: You Owe */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: 'var(--border-thin) solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--border)',
            paddingBottom: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--coral)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowUpRight size={16} strokeWidth={2.5} />
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'bold',
              }}
            >
              You Owe
            </h3>
          </div>
          <Badge variant="danger">{youOwe.length}</Badge>
        </div>

        {youOwe.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-lg)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <CheckCircle2 size={32} color="var(--success)" style={{ margin: '0 auto 8px' }} />
            <p style={{ margin: 0, fontWeight: 600 }}>You don't owe anyone right now! 🎉</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {youOwe.map((item, idx) => {
              const displayName = item.toName || 'Unknown';
              return (
                <div
                  key={`owe-${item.to}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: '#FFF8F8',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      className="avatar avatar-sm avatar-coral"
                      style={{ border: '1.5px solid var(--border)' }}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 'var(--font-size-sm)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayName}
                      </p>
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'bold',
                          color: 'var(--danger)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onSettle?.(item)}
                    style={{ flexShrink: 0, padding: '6px 12px', fontSize: 'var(--font-size-xs)' }}
                  >
                    Settle Up
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: Others Owe You */}
      <div
        className="card"
        style={{
          backgroundColor: 'var(--surface)',
          border: 'var(--border-thin) solid var(--border)',
          borderRadius: 'var(--radius)',
          boxShadow: 'var(--shadow)',
          padding: 'var(--space-lg)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2px solid var(--border)',
            paddingBottom: 'var(--space-sm)',
            marginBottom: 'var(--space-md)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'var(--mint)',
                border: '2px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ArrowDownLeft size={16} strokeWidth={2.5} />
            </div>
            <h3
              style={{
                margin: 0,
                fontFamily: 'var(--font-heading)',
                fontSize: 'var(--font-size-lg)',
                fontWeight: 'bold',
              }}
            >
              Others Owe You
            </h3>
          </div>
          <Badge variant="success">{othersOweYou.length}</Badge>
        </div>

        {othersOweYou.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-lg)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            <p style={{ margin: 0 }}>No one owes you money right now.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            {othersOweYou.map((item, idx) => {
              const displayName = item.fromName || 'Unknown';
              return (
                <div
                  key={`owed-${item.from}-${idx}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 12px',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius)',
                    backgroundColor: '#F6FFF9',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <div
                      className="avatar avatar-sm avatar-mint"
                      style={{ border: '1.5px solid var(--border)' }}
                    >
                      {getInitials(displayName)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontWeight: 600,
                          fontSize: 'var(--font-size-sm)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {displayName}
                      </p>
                      <span
                        style={{
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 'bold',
                          color: 'var(--success)',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {formatCurrency(item.amount)}
                      </span>
                    </div>
                  </div>

                  <span
                    className="badge badge-warning"
                    style={{
                      flexShrink: 0,
                      fontSize: '11px',
                      padding: '4px 8px',
                      cursor: 'default',
                    }}
                    title="Non-actionable notification"
                  >
                    Request
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
