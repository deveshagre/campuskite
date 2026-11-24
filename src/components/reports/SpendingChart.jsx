import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency, toRupees } from '../../utils/currency';

function CustomBarTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    const currentItem = payload[0];
    const paise = currentItem.payload.paise ?? Math.round((currentItem.value || 0) * 100);
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
        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text)' }}>
          {label}
        </div>
        <div
          style={{
            marginTop: '4px',
            fontWeight: 700,
            fontSize: '1rem',
            color: 'var(--text)',
          }}
        >
          {formatCurrency(paise)}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * SpendingChart Component
 * Displays spending trend across past months in a neobrutalist BarChart.
 *
 * @param {Object} props
 * @param {Array<{ month: string, amount: number, totalSpending?: number, monthName?: string }>} props.data
 */
export default function SpendingChart({ data = [] }) {
  const chartData = (data || []).map((item) => {
    const rawPaise = item.amount !== undefined ? item.amount : item.totalSpending || 0;
    const monthLabel =
      item.month || (item.monthName ? item.monthName.slice(0, 3) : '');
    return {
      month: monthLabel,
      amount: toRupees(rawPaise),
      paise: rawPaise,
    };
  });

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
          Spending Trend
        </h3>
      </div>
      <div className="card-body" style={{ padding: 'var(--space-lg)' }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={chartData}
            margin={{ top: 15, right: 15, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(23, 23, 23, 0.15)" />
            <XAxis
              dataKey="month"
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)', strokeWidth: 2 }}
              tick={{
                fontWeight: 'bold',
                fill: '#171717',
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
              }}
            />
            <YAxis
              tickLine={{ stroke: 'var(--border)' }}
              axisLine={{ stroke: 'var(--border)', strokeWidth: 2 }}
              tickFormatter={(val) => `₹${val}`}
              tick={{
                fontWeight: 600,
                fill: '#77736B',
                fontFamily: 'var(--font-heading)',
                fontSize: 11,
              }}
            />
            <Tooltip
              content={<CustomBarTooltip />}
              formatter={(value) => [
                formatCurrency(Math.round(Number(value || 0) * 100)),
                'Spending',
              ]}
            />
            <Bar
              dataKey="amount"
              fill="#FFDE59"
              stroke="#171717"
              strokeWidth={2}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
