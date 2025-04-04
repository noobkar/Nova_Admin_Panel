import React from 'react';
import './Card.scss';

export const Card = ({
  children,
  title,
  subtitle,
  action,
  padding = 'normal',
  className = '',
  ...props
}) => {
  return (
    <div className={`card card--padding-${padding} ${className}`} {...props}>
      {(title || action) && (
        <div className="card__header">
          <div className="card__header-content">
            {title && <h3 className="card__title">{title}</h3>}
            {subtitle && <p className="card__subtitle">{subtitle}</p>}
          </div>
          {action && <div className="card__action">{action}</div>}
        </div>
      )}
      
      <div className="card__content">
        {children}
      </div>
    </div>
  );
};
