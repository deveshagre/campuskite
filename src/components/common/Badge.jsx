import React from 'react'

/**
 * Neobrutalist Badge component.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'success' | 'warning' | 'danger' | 'info' | 'default'} [props.variant='default']
 * @param {'sm' | 'md'} [props.size='sm']
 * @param {string} [props.className='']
 */
export default function Badge({
  children,
  variant = 'default',
  size = 'sm',
  className = '',
  ...rest
}) {
  const variantClass = variant !== 'default' ? `badge-${variant}` : ''
  const sizeClass = size === 'md' ? 'badge-md' : ''

  const classes = ['badge', variantClass, sizeClass, className]
    .filter(Boolean)
    .join(' ')

  const sizeStyle =
    size === 'md'
      ? {
          padding: '6px 12px',
          fontSize: 'var(--font-size-sm, 0.875rem)',
        }
      : undefined

  return (
    <span className={classes} style={sizeStyle} {...rest}>
      {children}
    </span>
  )
}

export { Badge }
