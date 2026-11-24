import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency } from '../../utils/currency';

export const CATEGORIES = ['Food', 'Groceries', 'Rent', 'Utilities', 'Travel', 'Other'];

export const CATEGORY_COLORS = {
  Food: '#FF8066',
  Groceries: '#4D9868',
  Rent: '#FFDE59',
  Utilities: '#B8E0D2',
  Travel: '#6C63FF',
  Other: '#77736B',
};

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '2px solid var(--border)',
          boxShadow: '3px 3px 0px var(--border)',
          padding: '8px 12px',
          borderRadius: 'var(--radius-sm)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>
          {item.category}
        </div>
        <div style={{ marginTop: '2px', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>
          {formatCurrency(item.amount)} ({item.percentage}%)
        </div>
      </div>
    );
  }
  return null;
}

/**
 * CategoryBreakdown Component
 * Displays spending breakdown by category with PieChart and horizontal progress bars.
 *
 * @param {Object} props
 * @param {Array<{ category: string, amount: number, percentage: number }>} props.data
 */
export default function CategoryBreakdown({ data = [] }) {
  const validData = Array.isArray(data)
    ? data.filter((item) => item && typeof item.amount === 'number' && item.amount > 0)
    : [];

  const isEmpty = validData.length === 0;

  return (
    <div
      className="card"
      style={{
        border: '2px solid var(--border)',
        boxShadow: 'var(--shadow)',
        marginBottom: 'var(--space-xl)',
      }}
    >
      <div
        className="card-header"
        style={{
          borderBottom: '2px solid var(--border)',
          padding: 'var(--space-md) var(--space-lg)',
          backgroundColor: 'var(--surface-alt)',
        }}
      >
        <h3
          className="card-title"
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Category Breakdown
        </h3>
      </div>

      <div className="card-body" style={{ padding: 'var(--space-lg)' }}>
        {isEmpty ? (
          <div
            className="empty-state"
            style={{
              padding: 'var(--space-xl)',
              margin: 'var(--space-sm) 0',
              border: '2px dashed var(--border)',
            }}
          >
            <div className="empty-state-icon" style={{ backgroundColor: 'var(--primary)' }}>
              🏷️
            </div>
            <h4 className="empty-state-title" style={{ margin: 'var(--space-xs) 0' }}>
              No Category Data
            </h4>
            <p className="empty-state-desc" style={{ margin: 0 }}>
              No expenses recorded for this selection yet.
            </p>
          </div>
        ) : (
          <div>
            {/* Pie Chart */}
            <div style={{ width: '100%', height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={validData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={95}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ category, percentage }) => `${category} (${percentage}%)`}
                    labelLine={{ stroke: 'var(--border)', strokeWidth: 1.5 }}
                  >
                    {validData.map((entry) => {
                      const color = CATEGORY_COLORS[entry.category] || CATEGORY_COLORS.Other;
                      return (
                        <Cell
                          key={`cell-${entry.category}`}
                          fill={color}
                          stroke="#171717"
                          strokeWidth={2}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Horizontal Bar Breakdown */}
            <div
              style={{
                marginTop: 'var(--space-lg)',
                display: 'flex',
                flexDirection: 'column',
                gap: 'var(--space-md)',
              }}
            >
              {validData.map((item) => {
                const color = CATEGORY_COLORS[item.category] || CATEGORY_COLORS.Other;
                return (
                  <div key={item.category} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            backgroundColor: color,
                            border: '1.5px solid var(--border)',
                            borderRadius: '2px',
                            display: 'inline-block',
                          }}
                        />
                        {item.category}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{formatCurrency(item.amount)}</span>
                        <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                          ({item.percentage}%)
                        </span>
                      </span>
                    </div>

                    {/* Progress track */}
                    <div
                      style={{
                        width: '100%',
                        height: 14,
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg)',
                        overflow: 'hidden',
                        boxShadow: '2px 2px 0px var(--border)',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(100, Math.max(0, item.percentage))}%`,
                          height: '100%',
                          backgroundColor: color,
                          borderRight:
                            item.percentage < 100 ? '2px solid var(--border)' : 'none',
                          transition: 'width 0.3s ease',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
