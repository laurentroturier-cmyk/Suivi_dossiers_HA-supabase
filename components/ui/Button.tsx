import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 
  | 'primary' 
  | 'secondary' 
  | 'outline' 
  | 'ghost' 
  | 'danger'
  | 'success'
  | 'info'
  | 'warning';

export type ButtonSize = 'sm' | 'md' | 'lg';

export type ButtonRounded = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: ButtonRounded;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  children: React.ReactNode;
}

/**
 * Composant Button standardisé avec palette de couleurs cohérente
 * Utilise les variables CSS du design system
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  rounded = 'lg',
  icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green-hover)] focus:ring-[var(--accent-green)] shadow-md hover:shadow-lg',
    secondary: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--border-soft)] hover:bg-[var(--color-bg-tertiary)] focus:ring-[var(--accent-green)]',
    outline: 'border-2 border-[var(--accent-green)] text-[var(--accent-green)] hover:bg-[var(--accent-green-soft)] dark:hover:bg-[var(--accent-green-soft)]/20 focus:ring-[var(--accent-green)]',
    ghost: 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] focus:ring-[var(--accent-green)]',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md hover:shadow-lg',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md hover:shadow-lg',
    info: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md hover:shadow-lg',
    warning: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-500 shadow-md hover:shadow-lg',
  };
  
  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-sm px-3 py-1.5 gap-1.5',
    md: 'text-base px-4 py-2 gap-2',
    lg: 'text-lg px-6 py-3 gap-3',
  };
  
  const roundedStyles: Record<ButtonRounded, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
    full: 'rounded-full',
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
        <Loader2 className="animate-spin" style={{ width: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px', height: size === 'sm' ? '14px' : size === 'md' ? '16px' : '20px' }} />
      )}
      
      {!loading && icon && iconPosition === 'left' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span>{children}</span>
      {!loading && icon && iconPosition === 'right' && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </button>
  );
};

export default Button;
