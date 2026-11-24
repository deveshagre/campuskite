import React from 'react';
import { DollarSign, Receipt, Tag, TrendingUp } from 'lucide-react';
import { formatCurrency } from '../../utils/currency';

/**
 * MonthlySummary Component
 * Displays 4 stat cards in a grid:
 * - "Total Spent" - yellow bg, large formatted amount, DollarSign icon
 * - "Expenses" - white bg, count number, Receipt icon
 * - "Top Category" - mint bg, category name, Tag icon
 * - "Average" - coral bg, formatted amount, TrendingUp icon
 *
 * @param {Object} props
 * @param {number} props.totalSpending - in integer paise
 * @param {number} props.expenseCount - number of expenses
 * @param {string} props.highestCategory - name of top category
 * @param {number} props.avgPerExpense - average per expense in integer paise
 */
export default function MonthlySummary({
  totalSpending = 0,
  expenseCount = 0,
  highestCategory = 'None',
  avgPerExpense = 0,
}) {
  const cards = [
    {
      id: 'total-spent',
      label: 'Total Spent',
      value: formatCurrency(totalSpending),
      bg: 'var(--primary)',
      icon: DollarSign,
    },
    {
      id: 'expenses',
      label: 'Expenses',
      value: expenseCount ?? 0,
      bg: 'var(--surface)',
      icon: Receipt,
    },
    {
      id: 'top-category',
      label: 'Top Category',
      value: highestCategory || 'None',
      bg: 'var(--mint)',
      icon: Tag,
    },
    {
      id: 'average',
      label: 'Average',
      value: formatCurrency(avgPerExpense),
      bg: 'var(--coral)',
      icon: TrendingUp,
    },
  ];

  return (
    <div className="stats-grid">
      {cards.map((card) => {
        const IconComponent = card.icon;
        return (
          <div
            key={card.id}
            className="stat-card"
            style={{
              backgroundColor: card.bg,
              border: '2px solid var(--border)',
              boxShadow: 'var(--shadow)',
              borderRadius: 'var(--radius)',
              padding: 'var(--space-lg)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 'var(--space-xs)',
              }}
            >
              <span
                className="stat-label"
                style={{
                  color: 'var(--text)',
                  fontWeight: 'var(--font-weight-bold)',
                  fontSize: 'var(--font-size-xs)',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                {card.label}
              </span>
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  backgroundColor: 'var(--surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '2px 2px 0px var(--border)',
                  flexShrink: 0,
                }}
              >
                <IconComponent size={20} color="var(--text)" />
              </div>
            </div>

            <div
              className="stat-value"
              style={{
                color: 'var(--text)',
                fontSize:
                  typeof card.value === 'string' && card.value.length > 10
                    ? 'var(--font-size-2xl)'
                    : 'var(--font-size-3xl)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'var(--font-heading)',
                lineHeight: 'var(--leading-tight)',
                wordBreak: 'break-word',
                marginTop: 'var(--space-xs)',
              }}
            >
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
}
