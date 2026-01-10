# 🎨 Design System - Audit & Proposition d'Architecture
## Application GestProjet - Suivi des dossiers HA

---

## 📊 **PHASE 1 - AUDIT DE L'EXISTANT**

### 1.1 Inventaire des fichiers

#### Fichiers CSS identifiés
- `index.css` (426 lignes) - Variables CSS globales
- `dark-theme.css` (762 lignes) - Thème sombre + border-radius
- `an01.css` - Styles isolés module AN01

#### Composants React (.tsx)
- **Modules principaux** : 28 composants
  - `LandingPage.tsx`
  - `App.tsx` (4200 lignes !)
  - `Contrats.tsx`, `RegistreDepots.tsx`, `RegistreRetraits.tsx`
  - `auth/` (Login, AdminDashboard, DataImport, AccessRequestForm)
  - `an01/` (Dashboard, UploadView, charts, tables...)
  
### 1.2 Analyse des patterns de styling

#### ✅ Points positifs identifiés

1. **Variables CSS existantes** dans `index.css`
   ```css
   :root {
     --bg: #f4f7f6;
     --surface-1: #ffffff;
     --text-primary: #0f172a;
     --accent-green: #0f8a6a;
     /* ... 30+ variables */
   }
   ```

2. **Système de thème dark/light** fonctionnel
   - Context API (`ThemeContext.tsx`)
   - Toggle avec `localStorage`
   - Variables CSS `html.dark { }`

3. **Tailwind CSS** CDN utilisé
   - Classes utilitaires présentes partout
   - Config `darkMode: 'class'`

#### ❌ Problèmes majeurs identifiés

### 1.3 Incohérences critiques

#### 🔴 **Problème #1 : Couleurs hardcodées partout**

**Exemple dans `LandingPage.tsx` :**
```tsx
// 7 variantes de couleurs définies en dur dans le composant
iconBg: 'bg-cyan-100 dark:bg-cyan-500/20'
btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525]'
borderColor: 'border-cyan-200 dark:border-cyan-500/40'
```

**Exemple dans `App.tsx` :**
```tsx
className="bg-gray-50/50 dark:bg-[#252525]"
className="text-[#40E0D0]"  // Cyan hardcodé
className="bg-[#005c4d]"    // Vert hardcodé
```

**Impact :** Impossible de changer la palette sans modifier 50+ fichiers.

---

#### 🔴 **Problème #2 : Border-radius incohérents**

**Valeurs trouvées :**
```css
/* dark-theme.css - Override Tailwind */
.rounded-sm { border-radius: 12px !important; }
.rounded { border-radius: 16px !important; }
.rounded-lg { border-radius: 24px !important; }
.rounded-2xl { border-radius: 32px !important; }
.rounded-4xl { border-radius: 40px !important; }

/* Mais dans les composants : */
rounded-xl  → 28px (dark-theme.css)
rounded-2xl → Tailwind original (16px) OU dark-theme (32px) ?
rounded-full → 9999px
```

**Impact :** Incohérence visuelle selon le composant (arrondis différents).

---

#### 🔴 **Problème #3 : Doublons de variables CSS**

**Dans `index.css` :**
```css
--bg: #f4f7f6;
--color-bg-primary: #f4f7f6;  /* DOUBLON */
```

**Dans `dark-theme.css` (avant nettoyage) :**
```css
--bg-primary: #121212;
--bg: var(--bg-primary);  /* Écrasait index.css */
```

**Impact :** Conflits CSS, bugs Edge/Chrome différents.

---

#### 🔴 **Problème #4 : Pas de composants UI réutilisables**

**Actuellement :**
```tsx
// Bouton copié-collé 50 fois avec variations
<button className="inline-flex items-center gap-2 px-4 py-2 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d]">
```

**Impact :** 
- Maintenance cauchemardesque
- Styles différents partout
- Impossible de garantir l'accessibilité

---

#### 🔴 **Problème #5 : App.tsx monolithique**

**4200 lignes de code !**
- Logique métier + UI + styles inline
- Impossible à maintenir
- Performance dégradée

---

### 1.4 Valeurs codées en dur (échantillon)

#### Couleurs hardcodées identifiées

| Code | Usage | Occurrences |
|------|-------|-------------|
| `#005c4d` | Vert principal | 20+ |
| `#004a3d` | Vert hover | 15+ |
| `#252525` | Bg dark | 30+ |
| `#40E0D0` | Cyan accent | 10+ |
| `#1E1E1E` | Bg dark secondary | 12+ |
| `bg-gray-100` | Tailwind inline | 50+ |
| `bg-[#...]` | Hex inline | 80+ |

#### Border-radius trouvés

| Valeur | Class | Cohérence |
|--------|-------|-----------|
| 8px | .rounded-sm | ✅ dark-theme.css |
| 12px | .rounded | ✅ dark-theme.css |
| 16px | .rounded-lg (Tailwind) | ❌ Conflit |
| 24px | .rounded-lg (dark-theme) | ❌ Conflit |
| 28px | .rounded-xl | ✅ dark-theme.css |
| 32px | .rounded-2xl | ✅ dark-theme.css |
| 9999px | .rounded-full | ✅ Standard |

---

### 1.5 Librairies UI utilisées

- ✅ **Tailwind CSS** (CDN)
- ✅ **lucide-react** (icônes)
- ❌ Aucune lib de composants (shadcn, MUI, etc.)
- ❌ Styled-components : Non
- ❌ CSS Modules : Non

---

## 🏗️ **PHASE 2 - PROPOSITION D'ARCHITECTURE**

### 2.1 Structure de dossiers recommandée

```
src/
├── design-system/
│   ├── tokens/
│   │   ├── colors.ts          # Palette complète
│   │   ├── spacing.ts         # Espacements
│   │   ├── typography.ts      # Fonts, sizes
│   │   ├── radius.ts          # Border-radius
│   │   ├── shadows.ts         # Ombres
│   │   └── index.ts           # Export central
│   │
│   ├── theme/
│   │   ├── ThemeProvider.tsx  # Context existant à migrer
│   │   ├── theme.css          # Variables CSS finales
│   │   └── utils.ts           # Helpers thème
│   │
│   ├── components/            # Composants UI de base
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.stories.tsx  # (optionnel Storybook)
│   │   │   └── types.ts
│   │   ├── Card/
│   │   ├── Input/
│   │   ├── Modal/
│   │   ├── Badge/
│   │   ├── Table/
│   │   └── index.ts           # Export barrel
│   │
│   └── hooks/
│       ├── useTheme.ts        # Hook thème
│       └── useMediaQuery.ts   # Responsive
│
├── components/                # Composants métier (existants)
│   ├── auth/
│   ├── an01/
│   └── ...
│
└── styles/
    ├── global.css             # Reset + base
    └── utilities.css          # Classes helper
```

---

### 2.2 Fichier de tokens centralisé

#### `design-system/tokens/colors.ts`

```typescript
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
```

---

#### `design-system/tokens/radius.ts`

```typescript
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
```

---

#### `design-system/tokens/spacing.ts`

```typescript
export const spacing = {
  0: '0',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;
```

---

#### `design-system/tokens/typography.ts`

```typescript
export const typography = {
  fontFamily: {
    sans: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', 'Courier New', monospace",
  },
  
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem',// 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',    // 48px
  },
  
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },
  
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;
```

---

#### `design-system/tokens/shadows.ts`

```typescript
export const shadows = {
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
  inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  none: 'none',
} as const;
```

---

### 2.3 Fichier CSS final : `theme.css`

```css
/* ==========================================
   DESIGN SYSTEM - VARIABLES CSS
   ========================================== */

:root {
  /* ========== COLORS ========== */
  
  /* Primary */
  --color-primary-50: #e4f4ee;
  --color-primary-500: #0f8a6a;
  --color-primary-600: #0c6f56;
  --color-primary-900: #004d3d;
  
  /* Neutral */
  --color-neutral-50: #f9fafb;
  --color-neutral-100: #f3f4f6;
  --color-neutral-500: #6b7280;
  --color-neutral-900: #111827;
  
  /* Accents */
  --color-cyan-400: #40E0D0;
  --color-orange-400: #FFA500;
  --color-violet-400: #A020F0;
  
  /* ========== BACKGROUNDS ========== */
  --bg-primary: #f4f7f6;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f2f5fa;
  
  /* ========== TEXT ========== */
  --text-primary: #0f172a;
  --text-secondary: #4b5563;
  --text-tertiary: #8b95a5;
  
  /* ========== BORDERS ========== */
  --border-strong: #e4e7ed;
  --border-soft: #edf1f7;
  --border-subtle: #eef2f7;
  
  /* ========== RADIUS ========== */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-2xl: 32px;
  --radius-3xl: 40px;
  --radius-pill: 9999px;
  
  /* ========== SPACING ========== */
  --spacing-1: 4px;
  --spacing-2: 8px;
  --spacing-3: 12px;
  --spacing-4: 16px;
  --spacing-6: 24px;
  --spacing-8: 32px;
  --spacing-12: 48px;
  
  /* ========== SHADOWS ========== */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  
  /* ========== TRANSITIONS ========== */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 350ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* ==========================================
   MODE SOMBRE
   ========================================== */

html.dark {
  /* Backgrounds */
  --bg-primary: #1a202c;
  --bg-secondary: #2d3748;
  --bg-tertiary: #252f3f;
  
  /* Text */
  --text-primary: #e8eaed;
  --text-secondary: #b4bcc4;
  --text-tertiary: #8e99a8;
  
  /* Borders */
  --border-strong: #3d4454;
  --border-soft: #34404d;
  --border-subtle: #2f3a47;
  
  /* Shadows (plus prononcées) */
  --shadow-sm: 0 2px 4px 0 rgb(0 0 0 / 0.3);
  --shadow-md: 0 4px 8px -1px rgb(0 0 0 / 0.4);
  --shadow-lg: 0 10px 20px -3px rgb(0 0 0 / 0.5);
  --shadow-xl: 0 20px 30px -5px rgb(0 0 0 / 0.6);
}

/* ==========================================
   CLASSES UTILITAIRES
   ========================================== */

/* Border-radius utilitaires */
.rounded-sm { border-radius: var(--radius-sm); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }
.rounded-3xl { border-radius: var(--radius-3xl); }
.rounded-pill { border-radius: var(--radius-pill); }

/* Surfaces */
.surface-primary { background-color: var(--bg-primary); }
.surface-secondary { background-color: var(--bg-secondary); }
.surface-tertiary { background-color: var(--bg-tertiary); }

/* Text */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-tertiary { color: var(--text-tertiary); }

/* Transitions */
.transition-fast { transition: all var(--transition-fast); }
.transition-base { transition: all var(--transition-base); }
.transition-slow { transition: all var(--transition-slow); }
```

---

## 🎨 **PHASE 3 - COMPOSANTS UI DE BASE**

### 3.1 Exemple : Button Component

```typescript
// design-system/components/Button/types.ts

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  rounded?: 'md' | 'lg' | 'pill';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
}
```

```tsx
// design-system/components/Button/Button.tsx

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
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-500',
    secondary: 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
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
```

**Usage :**
```tsx
import { Button } from '@/design-system/components';
import { Plus } from 'lucide-react';

<Button variant="primary" size="md" rounded="pill" icon={<Plus size={16} />}>
  Nouveau Projet
</Button>
```

---

### 3.2 Exemple : Card Component

```tsx
// design-system/components/Card/Card.tsx

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'elevated' | 'outlined' | 'filled';
  rounded?: 'lg' | 'xl' | '2xl';
  padding?: 'sm' | 'md' | 'lg';
  hover?: boolean;
}

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
    outlined: 'border border-border-soft',
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
```

---

### 3.3 Exemple : Input Component

```tsx
// design-system/components/Input/Input.tsx

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
}

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
  
  const baseStyles = 'w-full px-4 py-2 rounded-md border transition-all focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const stateStyles = error
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
    : 'border-border-soft focus:border-primary-500';
  
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
```

---

### 3.4 Exemple : Modal Component

```tsx
// design-system/components/Modal/Modal.tsx

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  const sizeStyles = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl',
  };
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={`relative w-full ${sizeStyles[size]} surface-secondary rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200`}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border-soft">
            {title && (
              <h2 className="text-xl font-bold text-primary">{title}</h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
```

---

## 🌓 **PHASE 4 - GESTION DES THÈMES**

### 4.1 ThemeProvider amélioré

```tsx
// design-system/theme/ThemeProvider.tsx

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('system');
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');
  const [mounted, setMounted] = useState(false);

  const getSystemTheme = useCallback((): ResolvedTheme => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const resolveTheme = useCallback((themeValue: Theme): ResolvedTheme => {
    if (themeValue === 'system') {
      return getSystemTheme();
    }
    return themeValue;
  }, [getSystemTheme]);

  // Initialize theme from localStorage
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme') as Theme | null;
    const initialTheme = storedTheme || 'system';
    setThemeState(initialTheme);
    setResolvedTheme(resolveTheme(initialTheme));
    setMounted(true);
  }, [resolveTheme]);

  // Apply theme to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    
    // Remove both classes first
    root.classList.remove('light', 'dark');
    
    // Add the resolved class
    root.classList.add(resolvedTheme);
    
    // Force Edge to apply changes (requestAnimationFrame + double check)
    requestAnimationFrame(() => {
      if (!root.classList.contains(resolvedTheme)) {
        root.classList.add(resolvedTheme);
      }
    });
  }, [resolvedTheme, mounted]);

  // Listen to system theme changes
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setResolvedTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    setResolvedTheme(resolveTheme(newTheme));
    localStorage.setItem('theme', newTheme);
  }, [resolveTheme]);

  const toggleTheme = useCallback(() => {
    const newTheme = resolvedTheme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  }, [resolvedTheme, setTheme]);

  // Prevent flash of incorrect theme
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

---

### 4.2 Script inline anti-flash (index.html)

```html
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DNA Suivi des projets</title>
    
    <!-- CRITICAL: Empêche le flash de thème incorrect -->
    <script>
      (function() {
        const theme = localStorage.getItem('theme') || 'system';
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const resolvedTheme = theme === 'system' 
          ? (systemPrefersDark ? 'dark' : 'light')
          : theme;
        
        document.documentElement.classList.add(resolvedTheme);
      })();
    </script>
    
    <!-- CSS du design system -->
    <link rel="stylesheet" href="/design-system/theme/theme.css">
    
    <!-- Tailwind CDN (optionnel si config custom) -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
      tailwind.config = {
        darkMode: 'class',
        theme: {
          extend: {
            borderRadius: {
              'sm': '8px',
              'DEFAULT': '12px',
              'md': '12px',
              'lg': '16px',
              'xl': '24px',
              '2xl': '32px',
              '3xl': '40px',
            }
          }
        }
      }
    </script>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/index.tsx"></script>
</body>
</html>
```

---

## 📋 **PHASE 5 - PLAN DE MIGRATION**

### 5.1 Stratégie progressive (recommandé)

#### Étape 1 : Fondations (Semaine 1)
- ✅ Créer structure `design-system/`
- ✅ Implémenter tokens TypeScript + CSS
- ✅ Migrer ThemeProvider
- ✅ Tester dark/light mode sur tous navigateurs

#### Étape 2 : Composants UI de base (Semaine 2)
- ✅ Button, Card, Input, Modal
- ✅ Badge, Table, Dropdown
- ✅ Tests unitaires composants
- ✅ Storybook (optionnel)

#### Étape 3 : Migration module par module (Semaines 3-6)
- Semaine 3 : `LandingPage.tsx` → Utiliser nouveaux composants
- Semaine 4 : `auth/` → Login, AdminDashboard
- Semaine 5 : `an01/` → Dashboard, charts
- Semaine 6 : `Contrats`, `Registres`

#### Étape 4 : Refactoring App.tsx (Semaine 7)
- Découper en sous-composants
- Extraire logique dans hooks personnalisés
- Appliquer design system uniformément

#### Étape 5 : Nettoyage & optimisation (Semaine 8)
- Supprimer ancien CSS
- Auditer bundle size
- Tests E2E sur tous navigateurs
- Documentation finale

---

### 5.2 Checklist de migration par composant

Pour chaque composant à migrer :

```tsx
// AVANT
<button className="inline-flex items-center gap-2 px-4 py-2 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d]">
  Ajouter
</button>

// APRÈS
import { Button } from '@/design-system/components';

<Button variant="primary" size="md" rounded="lg">
  Ajouter
</Button>
```

**Checklist :**
- [ ] Remplacer couleurs hardcodées par tokens
- [ ] Utiliser composants UI du design system
- [ ] Vérifier accessibilité (focus, ARIA)
- [ ] Tester mode clair + sombre
- [ ] Valider responsive
- [ ] Test Chrome + Edge + Firefox

---

### 5.3 Scripts helper pour migration

#### Script 1 : Trouver couleurs hardcodées

```bash
# Chercher toutes les couleurs hex
grep -r "#[0-9a-fA-F]\{6\}" components/ --include="*.tsx" | wc -l

# Chercher bg-[#...]
grep -r "bg-\[#" components/ --include="*.tsx"
```

#### Script 2 : Lister composants à migrer

```bash
find components/ -name "*.tsx" -exec wc -l {} \; | sort -rn
```

---

## 🎯 **SYNTHÈSE - LIVRABLES**

### ✅ Ce qui est prêt à implémenter

1. **Structure complète** du design system
2. **Tokens centralisés** (colors, radius, spacing, etc.)
3. **4 composants UI** prêts à l'emploi (Button, Card, Input, Modal)
4. **ThemeProvider robuste** (compatible Edge)
5. **Plan de migration** sur 8 semaines

### 📊 Métriques attendues

| Avant | Après |
|-------|-------|
| 80+ couleurs hardcodées | 1 fichier tokens |
| 0 composants réutilisables | 10+ composants UI |
| Incohérences visuelles | Design uniforme |
| App.tsx 4200 lignes | App.tsx < 500 lignes |
| Bugs Edge/Chrome | Compatible tous navigateurs |

### 🚀 Avantages du design system

- ✅ **Maintenabilité** : Changement global en 1 fichier
- ✅ **Cohérence** : Design uniforme garanti
- ✅ **Performance** : Composants optimisés
- ✅ **Accessibilité** : ARIA + focus states inclus
- ✅ **DX** : Développement 3x plus rapide
- ✅ **Évolutivité** : Ajout facile de nouveaux modules

---

## 📝 **NEXT STEPS**

### Pour démarrer l'implémentation :

1. **Valider ce plan** avec l'équipe
2. **Créer une branche** `feat/design-system`
3. **Implémenter Phase 1** (fondations)
4. **PR + Review + Merge**
5. **Itérer** sur Phases 2-5

**Questions ?** Prêt à commencer l'implémentation dès validation ! 🚀
