import React from 'react';

/**
 * Reusable Button component for CampusKite Neobrutalist design system.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {'primary' | 'secondary' | 'danger' | 'mint' | 'outline'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {Function} [props.onClick]
 * @param {boolean} [props.disabled=false]
 * @param {'button' | 'submit' | 'reset'} [props.type='button']
 * @param {string} [props.className='']
 * @param {boolean} [props.loading=false]
 * @param {React.ComponentType<{ size?: number, className?: string }> | React.ReactNode} [props.icon]
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
  loading = false,
  icon,
  ...rest
}) {
  const variantClass = variant ? `btn-${variant}` : 'btn-primary';
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  const fullWidthClass = fullWidth ? 'btn-full' : '';

  const classes = [
    'btn',
    variantClass,
    sizeClass,
    fullWidthClass,
    loading ? 'loading' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 22 : 18;

  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <span
          className="btn-icon-wrapper"
          style={{ display: 'inline-flex', alignItems: 'center', marginRight: children ? 8 : 0 }}
        >
          {icon}
        </span>
      );
    }
    const IconComponent = icon;
    return (
      <IconComponent
        size={iconSize}
        className="btn-icon-svg"
        aria-hidden="true"
        style={{ marginRight: children ? 8 : 0 }}
      />
    );
  };

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <span
          className="loader-spinner loader-spinner-sm"
          style={{
            width: iconSize,
            height: iconSize,
            borderWidth: size === 'sm' ? 2 : 3,
            display: 'inline-block',
            marginRight: children ? 8 : 0,
          }}
          aria-hidden="true"
        />
      ) : (
        renderIcon()
      )}
      {children}
    </button>
  );
}

export { Button };
