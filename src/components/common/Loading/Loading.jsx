import React from 'react';
import { Loader } from 'react-feather';
import './Loading.scss';

export const Loading = ({ message = 'Loading...' }) => {
  return (
    <div className="loading">
      <Loader className="loading__icon" size={24} />
      <span className="loading__text">{message}</span>
    </div>
  );
};

export default Loading;