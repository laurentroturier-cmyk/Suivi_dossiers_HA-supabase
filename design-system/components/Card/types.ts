import React from 'react';

export type CardVariant = 'elevated' | 'outlined' | 'filled';
export type CardRounded = 'lg' | 'xl' | '2xl';
export type CardPadding = 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  rounded?: CardRounded;
  padding?: CardPadding;
  hover?: boolean;
}
