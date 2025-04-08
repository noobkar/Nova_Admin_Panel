import React from 'react';
import { AlertTriangle } from 'react-feather';
import './ErrorMessage.scss';

export const ErrorMessage = ({ 
  message = 'An error occurred. Please try again.',
  retryAction = null
}) => {
  return (
    <div className="error-message">
      <AlertTriangle className="error-message__icon" size={28} />
      <p className="error-message__text">{message}</p>
      {retryAction && (
        <button 
          className="error-message__retry"
          onClick={retryAction}
        >
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;