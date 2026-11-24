import React, { useId } from 'react'

/**
 * Form Input component with Neobrutalist styling.
 *
 * @param {Object} props
 * @param {string} [props.label]
 * @param {'text' | 'email' | 'password' | 'number' | 'date'} [props.type='text']
 * @param {string | number} [props.value]
 * @param {Function} [props.onChange]
 * @param {string} [props.placeholder]
 * @param {string} [props.error]
 * @param {boolean} [props.required=false]
 * @param {string} [props.name]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 * @param {React.ComponentType<{ size?: number, className?: string }> | React.ReactNode} [props.icon]
 * @param {number | string} [props.min]
 * @param {number | string} [props.max]
 * @param {number | string} [props.step]
 */
export default function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  name,
  disabled = false,
  className = '',
  icon,
  min,
  max,
  step,
  id,
  ...rest
}) {
  const generatedId = useId()
  const inputId = id || name || generatedId
  const errorId = error ? `${inputId}-error` : undefined

  const renderIcon = () => {
    if (!icon) return null
    if (React.isValidElement(icon)) {
      return icon
    }
    const IconComponent = icon
    return <IconComponent size={18} aria-hidden="true" />
  }

  const hasIcon = Boolean(icon)

  return (
    <div className={`input-group ${className || ''}`.trim()}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          <span>{label}</span>
          {required && (
            <span className="required" aria-hidden="true">
              *
            </span>
          )}
        </label>
      )}

      <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center' }}>
        {hasIcon && (
          <span
            style={{
              position: 'absolute',
              left: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-secondary, #77736B)',
              zIndex: 1,
            }}
          >
            {renderIcon()}
          </span>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={errorId}
          className={`input ${error ? 'input-error' : ''}`.trim()}
          style={hasIcon ? { paddingLeft: '38px' } : undefined}
          {...rest}
        />
      </div>

      {error && (
        <span id={errorId} className="input-error-msg" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export { Input }
