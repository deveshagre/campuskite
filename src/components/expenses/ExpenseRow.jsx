import React from 'react';
import {
  Utensils,
  ShoppingCart,
  Home,
  Zap,
  Plane,
  MoreHorizontal,
  FileText,
} from 'lucide-react';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';

export const CATEGORY_ICONS = {
  Food: Utensils,
  Groceries: ShoppingCart,
  Rent: Home,
  Utilities: Zap,
  Travel: Plane,
  Other: MoreHorizontal,
};

export const CATEGORY_COLORS = {
  Food: '#FF8066',
  Groceries: '#4D9868',
  Rent: '#FFDE59',
  Utilities: '#B8E0D2',
  Travel: '#6C63FF',
  Other: '#77736B',
};

/**
 * ExpenseRow Component
 *
 * @param {Object} props
 * @param {Object} props.expense
 * @param {string} props.currentUserId
 * @param {Function} props.onClick
 * @param {Record<string, string>} [props.memberMap={}]
 */
export default function ExpenseRow({
  expense,
  currentUserId,
  onClick,
  memberMap = {},
}) {
  if (!expense) return null;

  const isYouPaid = expense.paidBy === currentUserId;
  const payerName = isYouPaid ? 'You' : memberMap[expense.paidBy] || 'Unknown';

  const categoryName = expense.category || 'Other';
  const CategoryIcon = CATEGORY_ICONS[categoryName] || CATEGORY_ICONS.Other;
  const categoryColor = CATEGORY_COLORS[categoryName] || CATEGORY_COLORS.Other;

  // Split details
  const splits = Array.isArray(expense.splits) ? expense.splits : [];
  const participantCount = splits.length || (Array.isArray(expense.participants) ? expense.participants.length : 0);
  const mySplit = splits.find((s) => s.userId === currentUserId);
  const myShareAmount = mySplit ? mySplit.amount : null;

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="expense-row card-interactive"
      style={{
        backgroundColor: isYouPaid ? '#FFFDF0' : 'var(--surface)',
        borderLeft: isYouPaid ? '6px solid var(--primary)' : 'var(--border-thin) solid var(--border)',
        cursor: 'pointer',
        padding: 'var(--space-md)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-sm)',
        marginBottom: 'var(--space-sm)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          gap: 'var(--space-md)',
        }}
      >
        {/* Left: Category Icon & Description */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', minWidth: 0, flex: 1 }}>
          <div
            className="expense-icon"
            style={{
              backgroundColor: categoryColor,
              color: '#171717',
              flexShrink: 0,
            }}
            title={categoryName}
          >
            <CategoryIcon size={20} strokeWidth={2.5} />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <h4
              className="expense-title"
              style={{
                margin: 0,
                fontSize: 'var(--font-size-base)',
                fontWeight: 'bold',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {expense.description}
            </h4>
            <div className="expense-meta" style={{ marginTop: 2 }}>
              <span
                style={{
                  fontWeight: isYouPaid ? 'bold' : 'normal',
                  color: isYouPaid ? 'var(--text)' : 'var(--text-secondary)',
                }}
              >
                {isYouPaid ? 'You paid' : `Paid by ${payerName}`}
              </span>
              <span>•</span>
              <span>{categoryName}</span>
              {expense.receiptId && (
                <>
                  <span>•</span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      color: 'var(--text-secondary)',
                    }}
                    title="Has attached receipt"
                  >
                    <FileText size={12} />
                    <span>Receipt</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right: Amount & Date */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            className="expense-amount"
            style={{
              fontSize: 'var(--font-size-lg)',
              fontWeight: 'bold',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {formatCurrency(expense.amount)}
          </div>
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--text-secondary)',
              marginTop: 2,
            }}
          >
            {formatDate(expense.date)}
          </div>
        </div>
      </div>

      {/* Bottom: Participant count & Your share info */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px dashed var(--border-light, rgba(23, 23, 23, 0.15))',
          paddingTop: '6px',
          fontSize: 'var(--font-size-xs)',
          color: 'var(--text-secondary)',
        }}
      >
        <span>
          {participantCount > 0
            ? `Split between ${participantCount} ${participantCount === 1 ? 'person' : 'people'}`
            : 'Equal split'}
        </span>

        <div>
          {myShareAmount !== null ? (
            isYouPaid ? (
              <span style={{ color: 'var(--success)', fontWeight: 600 }}>
                Your share: {formatCurrency(myShareAmount)} (you lent {formatCurrency(expense.amount - myShareAmount)})
              </span>
            ) : (
              <span style={{ color: 'var(--danger)', fontWeight: 600 }}>
                Your share: {formatCurrency(myShareAmount)}
              </span>
            )
          ) : (
            <span>Not in split</span>
          )}
        </div>
      </div>
    </div>
  );
}
