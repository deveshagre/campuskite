import React from 'react'
import { Inbox } from 'lucide-react'
import Button from './Button'

/**
 * Neobrutalist EmptyState placeholder component.
 *
 * @param {Object} props
 * @param {React.ComponentType<{ size?: number, className?: string }>} [props.icon=Inbox]
 * @param {string} props.title
 * @param {string} [props.description]
 * @param {string} [props.actionLabel]
 * @param {Function} [props.onAction]
 * @param {string} [props.className='']
 */
export default function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  actionText,
  onAction,
  action,
  children,
  className = '',
}) {
  const btnLabel = actionLabel || actionText

  const renderIcon = () => {
    if (!Icon) return <Inbox size={32} aria-hidden="true" />
    if (React.isValidElement(Icon)) return Icon
    return <Icon size={32} aria-hidden="true" />
  }

  return (
    <div className={`empty-state ${className || ''}`.trim()}>
      <div className="empty-state-icon">
        {renderIcon()}
      </div>
      {title && <h3 className="empty-state-title">{title}</h3>}
      {description && <p className="empty-state-desc">{description}</p>}
      {action && <div style={{ marginTop: 'var(--space-sm)' }}>{action}</div>}
      {children}
      {btnLabel && onAction && (
        <div style={{ marginTop: 'var(--space-sm)' }}>
          <Button variant="primary" onClick={onAction}>
            {btnLabel}
          </Button>
        </div>
      )}
    </div>
  )
}

export { EmptyState }
