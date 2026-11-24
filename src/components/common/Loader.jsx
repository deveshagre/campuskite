import React from 'react'

/**
 * Neobrutalist Loader component.
 *
 * @param {Object} props
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullPage=false]
 * @param {string} [props.text]
 * @param {string} [props.className='']
 */
export default function Loader({
  size = 'md',
  fullPage = false,
  text,
  className = '',
}) {
  const sizeClass =
    size === 'sm'
      ? 'loader-spinner-sm'
      : size === 'lg'
        ? 'loader-spinner-lg'
        : ''

  if (fullPage) {
    return (
      <div
        className={`loader-fullpage ${className || ''}`.trim()}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          width: '100%',
          backgroundColor: 'var(--bg, #F5F0E8)',
          gap: 'var(--space-md, 16px)',
          padding: 'var(--space-xl, 32px)',
        }}
        role="status"
        aria-live="polite"
      >
        <div className={`loader-spinner ${sizeClass}`.trim()} />
        {text && (
          <p
            style={{
              fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
              fontWeight: 'var(--font-weight-bold, 700)',
              color: 'var(--text, #171717)',
              margin: 0,
            }}
          >
            {text}
          </p>
        )}
      </div>
    )
  }

  return (
    <div
      className={`loader ${className || ''}`.trim()}
      role="status"
      aria-live="polite"
    >
      <div className={`loader-spinner ${sizeClass}`.trim()} />
      {text && (
        <span
          style={{
            fontFamily: 'var(--font-heading, "Space Grotesk", sans-serif)',
            fontWeight: 'var(--font-weight-semibold, 600)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            color: 'var(--text, #171717)',
          }}
        >
          {text}
        </span>
      )}
    </div>
  )
}

export { Loader }
