import React from 'react';
import { formatCurrency } from '../../utils/currency';
import Button from '../common/Button';
import EmptyState from '../common/EmptyState';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

/**
 * SettlementSuggestions Component
 *
 * Displays optimized settlements calculated by minimizeDebts.
 * Only the designated payer can mark a suggested transaction as paid.
 *
 * @param {Object} props
 * @param {Array<Object>} props.suggestions - List of suggestions ({ from, to, amount, fromName, toName, groupId })
 * @param {string} props.currentUserId - Currently logged in user ID
 * @param {Function} props.onSettle - Callback (from, to, amount, suggestionObj)
 */
export default function SettlementSuggestions({
  suggestions = [],
  currentUserId,
  onSettle,
}) {
  return (
    <div style={{ marginBottom: 'var(--space-xl)' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={20} color="var(--primary-hover, #F0CF45)" />
          <h3
            style={{
              margin: 0,
              fontFamily: 'var(--font-heading)',
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'bold',
            }}
          >
            Suggested Settlements
          </h3>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 size={36} color="var(--success)" />}
          title="All settled up!"
          description="There are no pending debts or settlements needed among members. Everyone is squared away!"
        />
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 'var(--space-md)',
          }}
        >
          {suggestions.map((item, index) => {
            const isPayer = item.from === currentUserId;
            const fromDisplayName = isPayer ? 'You' : item.fromName || 'Unknown';
            const toDisplayName = item.to === currentUserId ? 'You' : item.toName || 'Unknown';

            return (
              <div
                key={`suggestion-${item.from}-${item.to}-${index}`}
                className="card"
                style={{
                  backgroundColor: isPayer ? '#FFFDF0' : 'var(--surface)',
                  border: isPayer ? '2px solid var(--border)' : 'var(--border-thin) solid var(--border)',
                  boxShadow: isPayer ? 'var(--shadow)' : 'var(--shadow-sm)',
                  padding: 'var(--space-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: 'var(--space-md)',
                }}
              >
                {/* Transaction description & Amount */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 600,
                      color: 'var(--text-secondary)',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ color: isPayer ? 'var(--text)' : 'inherit', fontWeight: isPayer ? 'bold' : 600 }}>
                      {fromDisplayName}
                    </span>
                    <ArrowRight size={16} color="var(--text)" />
                    <span style={{ color: item.to === currentUserId ? 'var(--text)' : 'inherit', fontWeight: item.to === currentUserId ? 'bold' : 600 }}>
                      {toDisplayName}
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 'var(--font-size-2xl)',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 'bold',
                      color: 'var(--text)',
                      lineHeight: 'var(--leading-none)',
                    }}
                  >
                    {formatCurrency(item.amount)}
                  </div>

                  {item.groupName && (
                    <div
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-secondary)',
                        marginTop: 6,
                      }}
                    >
                      Group: {item.groupName}
                    </div>
                  )}
                </div>

                {/* Action button */}
                <div>
                  {isPayer ? (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onSettle?.(item.from, item.to, item.amount, item)}
                      style={{ width: '100%' }}
                    >
                      Mark as Paid
                    </Button>
                  ) : (
                    <div title="Only the payer can mark this" style={{ width: '100%' }}>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled
                        style={{ width: '100%', opacity: 0.6 }}
                      >
                        Mark as Paid
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
