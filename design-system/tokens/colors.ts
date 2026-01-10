export const colors = {
  // Palette principale
  primary: {
    50: '#e4f4ee',
    100: '#b3e0d4',
    500: '#0f8a6a',    // Vert principal
    600: '#0c6f56',    // Vert hover
    700: '#095a46',
    900: '#004d3d',
  },
  
  // Palette neutre (gris)
  neutral: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
  },
  
  // Accents
  cyan: {
    400: '#40E0D0',
    500: '#22d3c5',
    600: '#14b8a6',
  },
  
  orange: {
    400: '#FFA500',
    500: '#ff8800',
  },
  
  violet: {
    400: '#A020F0',
    500: '#8b1ad1',
  },
  
  // Sémantique
  success: {
    light: '#10b981',
    DEFAULT: '#059669',
    dark: '#047857',
  },
  
  error: {
    light: '#ef4444',
    DEFAULT: '#dc2626',
    dark: '#b91c1c',
  },
  
  warning: {
    light: '#f59e0b',
    DEFAULT: '#d97706',
    dark: '#b45309',
  },
  
  info: {
    light: '#3b82f6',
    DEFAULT: '#2563eb',
    dark: '#1d4ed8',
  },
  
  // Mode clair
  light: {
    background: {
      primary: '#f4f7f6',
      secondary: '#ffffff',
      tertiary: '#f2f5fa',
    },
    text: {
      primary: '#0f172a',
      secondary: '#4b5563',
      tertiary: '#8b95a5',
    },
    border: {
      strong: '#e4e7ed',
      soft: '#edf1f7',
      subtle: '#eef2f7',
    },
  },
  
  // Mode sombre
  dark: {
    background: {
      primary: '#1a202c',
      secondary: '#2d3748',
      tertiary: '#252f3f',
    },
    text: {
      primary: '#e8eaed',
      secondary: '#b4bcc4',
      tertiary: '#8e99a8',
    },
    border: {
      strong: '#3d4454',
      soft: '#34404d',
      subtle: '#2f3a47',
    },
  },
} as const;

export type Colors = typeof colors;
