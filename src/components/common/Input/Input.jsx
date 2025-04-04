import React, { forwardRef } from 'react';
import './Input.scss';

export const Input = forwardRef(({
  type = 'text',
  label,
  id,
  name,
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  disabled = false,
  className = '',
  ...props
}, ref) => {
  return (
    <div className={`input-group ${fullWidth ? 'input-group--full-width' : ''} ${className}`}>
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      
      <div className={`input-wrapper ${icon ? `input-wrapper--with-icon input-wrapper--icon-${iconPosition}` : ''}`}>
        {icon && iconPosition === 'left' && (
          <div className="input-icon input-icon--left">{icon}</div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={`input ${error ? 'input--error' : ''}`}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="input-icon input-icon--right">{icon}</div>
        )}
      </div>
      
      {error && <div className="input-error">{error}</div>}
    </div>
  );
});
