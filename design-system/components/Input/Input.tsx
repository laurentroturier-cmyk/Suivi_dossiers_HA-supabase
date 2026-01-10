import React from 'react';
import { InputProps } from './types';

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'w-full px-4 py-2 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-[#0f8a6a] disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--bg-secondary)] text-[var(--text-primary)]';
  
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-[var(--border-soft)] focus:border-[#0f8a6a]';
  
  const iconPaddingStyle = icon
    ? iconPosition === 'left' ? 'pl-10' : 'pr-10'
    : '';
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-primary mb-1.5">
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`${baseStyles} ${stateStyles} ${iconPaddingStyle} ${className}`}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">
            {icon}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-tertiary">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
