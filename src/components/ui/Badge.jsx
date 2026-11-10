import React from 'react'

export const Badge = ({
  children,
  variant = 'default', // 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral'
  size = 'md',        // 'sm' | 'md'
  className = '',
  icon: Icon
}) => {
  return (
    <span className={`ui-badge ui-badge-${variant} ui-badge-${size} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 12 : 14} className="ui-badge-icon" />}
      <span>{children}</span>
    </span>
  )
}

export default Badge