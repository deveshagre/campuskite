import { formatCurrency } from '../../utils/currency';

export default function BalanceCard({
  title,
  amount,
  type = 'net', // 'owe' | 'owed' | 'net'
  icon: Icon,
}) {
  const typeClass =
    type === 'owe' ? 'card-coral' : type === 'owed' ? 'card-mint' : 'card-yellow';

  return (
    <div className={`stat-card ${typeClass}`}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: '8px',
          marginBottom: 'var(--space-xs)',
        }}
      >
        <span
          className="stat-label"
          style={{
            color: 'var(--text)',
            opacity: 0.9,
            fontWeight: 700,
            letterSpacing: '0.05em',
          }}
        >
          {title}
        </span>
        {Icon && (
          <div
            style={{
              width: '36px',
              height: '36px',
              border: '2px solid var(--border)',
              borderRadius: 'var(--radius)',
              backgroundColor: 'var(--surface)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '2px 2px 0px var(--border)',
              flexShrink: 0,
            }}
          >
            <Icon size={20} color="var(--text)" />
          </div>
        )}
      </div>

      <div
        className="stat-value"
        style={{
          color: 'var(--text)',
          fontSize: '2rem',
          fontWeight: 800,
          fontFamily: 'var(--font-heading)',
          lineHeight: 1.1,
        }}
      >
        {formatCurrency(amount)}
      </div>

      <div
        className="stat-meta"
        style={{
          color: 'var(--text)',
          opacity: 0.75,
          fontWeight: 600,
          fontSize: '0.8rem',
          marginTop: 'var(--space-xs)',
        }}
      >
        {type === 'owe'
          ? 'Total debt across all groups'
          : type === 'owed'
          ? 'Total credit due to you'
          : 'Your overall net position'}
      </div>
    </div>
  );
}
