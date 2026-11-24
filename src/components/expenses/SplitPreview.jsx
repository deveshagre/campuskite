import React from 'react';
import { formatCurrency } from '../../utils/currency';
import { AlertCircle } from 'lucide-react';

/**
 * SplitPreview Component
 *
 * Displays a breakdown of how an expense is split among members.
 *
 * @param {Object} props
 * @param {'equal'|'custom'} props.splitType
 * @param {number} props.totalAmountPaise - Total expense amount in paise
 * @param {Array<{ userId: string, name: string, amount: number }>} props.participants
 */
export default function SplitPreview({
  splitType = 'equal',
  totalAmountPaise = 0,
  participants = [],
}) {
  const sumShares = participants.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const isMismatch = Math.round(sumShares) !== Math.round(totalAmountPaise);
  const diffPaise = Math.round(totalAmountPaise) - Math.round(sumShares);

  const avgShare =
    participants.length > 0
      ? formatCurrency(participants[0]?.amount || 0)
      : formatCurrency(0);

  return (
    <div className="split-preview" style={{ marginTop: 'var(--space-md)' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontWeight: 'var(--font-weight-bold)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Split Breakdown
        </span>
        {splitType === 'equal' && participants.length > 0 && (
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              fontWeight: 'var(--font-weight-semibold)',
            }}
          >
            (each pays {avgShare})
          </span>
        )}
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--font-size-sm)' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--border)' }}>
              <th
                style={{
                  textAlign: 'left',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'uppercase',
                }}
              >
                Member
              </th>
              <th
                style={{
                  textAlign: 'right',
                  padding: '8px 10px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-xs)',
                  textTransform: 'uppercase',
                }}
              >
                Share
              </th>
            </tr>
          </thead>
          <tbody>
            {participants.length === 0 ? (
              <tr>
                <td
                  colSpan={2}
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    color: 'var(--text-secondary)',
                    fontStyle: 'italic',
                  }}
                >
                  No participants selected
                </td>
              </tr>
            ) : (
              participants.map((p) => (
                <tr
                  key={p.userId}
                  style={{ borderBottom: '1px dashed var(--border-light, rgba(23, 23, 23, 0.15))' }}
                >
                  <td style={{ padding: '8px 10px', fontWeight: 500 }}>{p.name || 'Unknown'}</td>
                  <td
                    style={{
                      padding: '8px 10px',
                      textAlign: 'right',
                      fontFamily: 'var(--font-heading)',
                      fontWeight: 600,
                    }}
                  >
                    {formatCurrency(p.amount || 0)}
                  </td>
                </tr>
              ))
            )}
            <tr
              style={{
                borderTop: '2px solid var(--border)',
                fontWeight: 'bold',
                backgroundColor: 'rgba(255, 222, 89, 0.15)',
              }}
            >
              <td
                style={{
                  padding: '10px',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                Total
              </td>
              <td
                style={{
                  padding: '10px',
                  textAlign: 'right',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                {formatCurrency(sumShares)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {isMismatch && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px',
            backgroundColor: '#FFF5F5',
            border: '2px solid var(--danger)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--danger)',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 600,
            marginTop: 'var(--space-xs)',
          }}
        >
          <AlertCircle size={16} />
          <span>
            {diffPaise > 0
              ? `Shares total ${formatCurrency(sumShares)} — remaining ${formatCurrency(diffPaise)} to allocate`
              : `Shares total ${formatCurrency(sumShares)} — exceeds expense total by ${formatCurrency(Math.abs(diffPaise))}`}
          </span>
        </div>
      )}
    </div>
  );
}
