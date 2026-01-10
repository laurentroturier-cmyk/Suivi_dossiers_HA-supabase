import React from 'react';
import { ButtonProps } from './types';

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles = {
    primary: 'bg-[#0f8a6a] text-white hover:bg-[#0c6f56] focus:ring-[#0f8a6a]',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
    outline: 'border-2 border-[#0f8a6a] text-[#0f8a6a] hover:bg-[#e4f4ee] dark:hover:bg-[#004d3d]/20',
    ghost: 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  };
  
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-base px-4 py-2 gap-2',
    lg: 'text-lg px-6 py-3 gap-3',
  };
  
  const roundedStyles = {
    md: 'rounded-md',
    lg: 'rounded-lg',
    pill: 'rounded-pill',
  };
  
  const widthStyle = fullWidth ? 'w-full' : '';
  
  const classes = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${roundedStyles[rounded]}
    ${widthStyle}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <button
      className={classes}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      
      {!loading && icon && iconPosition === 'left' && icon}
      {children}
      {!loading && icon && iconPosition === 'right' && icon}
    </button>
  );
};

export default Button;
