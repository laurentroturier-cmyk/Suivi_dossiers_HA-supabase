import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

/**
 * Composant Input standardisé avec palette de couleurs cohérente
 * Utilise les variables CSS du design system
 */
export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  icon,
  iconPosition = 'left',
  fullWidth = true,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseStyles = 'w-full px-4 py-2.5 rounded-xl border transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]';
  
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-[var(--border-soft)] focus:border-[var(--accent-green)] focus:ring-[var(--accent-green)]';
  
  const iconPaddingStyle = icon
    ? iconPosition === 'left' ? 'pl-11' : 'pr-11'
    : '';
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  return (
    <div className={widthStyle}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && iconPosition === 'left' && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`${baseStyles} ${stateStyles} ${iconPaddingStyle} ${className}`}
          {...props}
        />
        
        {icon && iconPosition === 'right' && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] pointer-events-none">
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
        <p className="mt-1.5 text-sm text-[var(--color-text-tertiary)]">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;
