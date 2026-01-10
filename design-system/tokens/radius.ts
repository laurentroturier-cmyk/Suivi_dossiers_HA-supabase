export const radius = {
  none: '0',
  sm: '8px',      // Petits éléments (badges, chips)
  md: '12px',     // Inputs, petits boutons
  lg: '16px',     // Cards, modales
  xl: '24px',     // Headers, sections
  '2xl': '32px',  // Hero sections
  '3xl': '40px',  // Éléments exceptionnels
  full: '9999px', // Boutons pill, avatars
} as const;

export type Radius = typeof radius;
