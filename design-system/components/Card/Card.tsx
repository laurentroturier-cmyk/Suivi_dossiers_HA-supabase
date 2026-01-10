import React from 'react';
import { CardProps } from './types';

const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  rounded = 'xl',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'surface-secondary transition-all';
  
  const variantStyles = {
    elevated: 'shadow-lg',
    outlined: 'border border-[var(--border-soft)]',
    filled: 'bg-neutral-50 dark:bg-neutral-800/50',
  };
  
  const roundedStyles = {
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };
  
  const paddingStyles = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const hoverStyle = hover ? 'hover:shadow-xl hover:scale-[1.01] cursor-pointer' : '';
  
  const classes = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${roundedStyles[rounded]}
    ${paddingStyles[padding]}
    ${hoverStyle}
    ${className}
  `.trim().replace(/\s+/g, ' ');
  
  return (
    <div className={classes} {...props}>
      {children}
    </div>
  );
};

export default Card;
