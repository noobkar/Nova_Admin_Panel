import React from 'react';
import { AlertCircle } from 'react-feather';
import './EmptyState.scss';

export const EmptyState = ({ 
  message = 'No data found',
  icon: CustomIcon = AlertCircle,
  action = null
}) => {
  return (
    <div className="empty-state">
      <CustomIcon className="empty-state__icon" size={48} />
      <p className="empty-state__message">{message}</p>
      {action && (
        <div className="empty-state__action">
          {action}
        </div>
      )}
    </div>
  );
};

export default EmptyState;