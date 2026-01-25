import React from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'filled' | 'flat';

export type CardRounded = 'sm' | 'md' | 'lg' | 'xl' | '2xl';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  rounded?: CardRounded;
  padding?: CardPadding;
  hover?: boolean;
  children: React.ReactNode;
}

/**
 * Composant Card standardisé avec palette de couleurs cohérente
 * Utilise les variables CSS du design system
 */
export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  rounded = 'xl',
  padding = 'md',
  hover = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'bg-[var(--color-bg-secondary)] transition-all duration-200';
  
  const variantStyles: Record<CardVariant, string> = {
    elevated: 'shadow-lg border border-[var(--border-subtle)]',
    outlined: 'border-2 border-[var(--border-strong)]',
    filled: 'bg-[var(--color-bg-tertiary)] border border-[var(--border-soft)]',
    flat: 'border border-[var(--border-subtle)]',
  };
  
  const roundedStyles: Record<CardRounded, string> = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };
  
  const paddingStyles: Record<CardPadding, string> = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
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
