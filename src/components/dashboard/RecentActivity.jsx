import { Link } from 'react-router-dom';
import EmptyState from '../common/EmptyState';
import { formatCurrency } from '../../utils/currency';
import { formatDate } from '../../utils/date';
import {
  Utensils,
  ShoppingCart,
  Home,
  Zap,
  Plane,
  Wallet,
  PiggyBank,
  ArrowRight,
} from 'lucide-react';

const TYPE_ICONS = {
  expense: ShoppingCart,
  settlement: PiggyBank,
  Food: Utensils,
  Groceries: ShoppingCart,
  Household: Home,
  Utilities: Zap,
  Travel: Plane,
  General: Wallet,
};

export default function RecentActivity({ activities = [] }) {
  const displayActivities = activities.slice(0, 5);

  const getActivityIcon = (activity) => {
    if (activity.type === 'settlement') {
      return PiggyBank;
    }
    if (activity.category && TYPE_ICONS[activity.category]) {
      return TYPE_ICONS[activity.category];
    }
    return TYPE_ICONS[activity.type] || Wallet;
  };

  return (
    <div className="card" style={{ marginBottom: 'var(--space-xl)' }}>
      <div className="card-header">
        <h3 className="card-title">Recent Activity</h3>
        <Link
          to="/expenses"
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
          View All <ArrowRight size={16} />
        </Link>
      </div>

      <div className="card-body">
        {displayActivities.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No recent activity"
            description="When you or your group members record expenses and settlements, they will appear here."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayActivities.map((activity, index) => {
              const Icon = getActivityIcon(activity);
              const isSettlement = activity.type === 'settlement';

              return (
                <div key={activity.id || index} className="expense-row">
                  <div className="expense-left">
                    <div
                      className="expense-icon"
                      style={{
                        backgroundColor: isSettlement
                          ? 'var(--mint)'
                          : 'var(--primary)',
                      }}
                    >
                      <Icon size={20} />
                    </div>
                    <div className="expense-info">
                      <span className="expense-title">{activity.description}</span>
                      <span className="expense-meta">
                        {activity.userName && `${activity.userName} • `}
                        {activity.groupName && (
                          <span
                            style={{
                              backgroundColor: 'var(--surface-muted)',
                              padding: '2px 6px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-light)',
                              fontWeight: 600,
                            }}
                          >
                            {activity.groupName}
                          </span>
                        )}
                        {activity.date && ` • ${formatDate(activity.date)}`}
                      </span>
                    </div>
                  </div>

                  <div className="expense-right">
                    <span
                      className="expense-amount"
                      style={{
                        color: isSettlement ? 'var(--success)' : 'var(--text)',
                      }}
                    >
                      {formatCurrency(activity.amount)}
                    </span>
                    <span className="expense-split-tag">
                      {isSettlement ? 'Settled debt' : activity.type || 'Expense'}
                    </span>
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
