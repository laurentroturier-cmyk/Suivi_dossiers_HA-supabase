# 🎨 Design System GestProjet

Design system moderne avec esthétique "arrondie" pour l'application de suivi des dossiers d'achats publics.

## 📁 Structure

```
design-system/
├── tokens/              # Design tokens (couleurs, espacements, etc.)
│   ├── colors.ts        # Palette de couleurs
│   ├── radius.ts        # Border-radius (8px à 40px)
│   ├── spacing.ts       # Espacements (4px à 96px)
│   ├── typography.ts    # Typographie
│   ├── shadows.ts       # Ombres
│   └── index.ts         # Export centralisé
│
├── theme/               # Gestion du thème
│   ├── theme.css        # Variables CSS globales
│   └── ThemeProvider.tsx # Provider React
│
├── components/          # Composants UI réutilisables
│   ├── Button/
│   ├── Card/
│   ├── Input/
│   ├── Modal/
│   └── index.ts
│
├── hooks/               # Hooks personnalisés
│   └── index.ts
│
└── index.ts             # Export principal
```

## 🚀 Utilisation rapide

### 1. Import du CSS

Le CSS du design system est déjà importé dans `index.tsx` :

```tsx
import './design-system/theme/theme.css';
```

### 2. Utilisation des composants

```tsx
import { Button, Card, Input, Modal } from './design-system';

function MyComponent() {
  return (
    <Card rounded="2xl" padding="lg">
      <h2>Mon titre</h2>
      <Input label="Email" placeholder="email@exemple.com" />
      <Button variant="primary" rounded="pill">
        Envoyer
      </Button>
    </Card>
  );
}
```

### 3. Utilisation du hook de thème

```tsx
import { useTheme } from './design-system';

function MyComponent() {
  const { resolvedTheme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      Mode actuel : {resolvedTheme}
    </button>
  );
}
```

## 🎨 Composants disponibles

### Button

Bouton avec 5 variantes, 3 tailles et 3 niveaux d'arrondi.

```tsx
<Button 
  variant="primary" // primary | secondary | outline | ghost | danger
  size="md"         // sm | md | lg
  rounded="pill"    // md | lg | pill
  icon={<CheckIcon />}
  loading={false}
  fullWidth={false}
>
  Cliquez-moi
</Button>
```

### Card

Carte pour structurer le contenu.

```tsx
<Card
  variant="elevated"  // elevated | outlined | filled
  rounded="2xl"       // lg | xl | 2xl
  padding="lg"        // sm | md | lg
  hover={true}        // Animation au survol
>
  Contenu de la carte
</Card>
```

### Input

Champ de saisie avec label, erreur, helper text et icône.

```tsx
<Input
  label="Nom"
  placeholder="Entrez votre nom"
  error="Champ requis"
  helperText="Au moins 3 caractères"
  icon={<UserIcon />}
  iconPosition="left"  // left | right
/>
```

### Modal

Modale avec 5 tailles et fermeture automatique.

```tsx
<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirmation"
  size="md"              // sm | md | lg | xl | full
  showCloseButton={true}
>
  Contenu de la modale
</Modal>
```

## 🎨 Tokens de design

### Couleurs

```typescript
import { colors } from './design-system/tokens';

// Primaire (vert)
colors.primary[500]  // #0f8a6a
colors.primary[600]  // #0c6f56

// Accents
colors.cyan[400]     // #40E0D0
colors.orange[400]   // #FFA500
colors.violet[400]   // #A020F0

// Mode clair
colors.light.background.primary    // #f4f7f6
colors.light.text.primary          // #0f172a

// Mode sombre
colors.dark.background.primary     // #1a202c
colors.dark.text.primary           // #e8eaed
```

### Variables CSS

```css
/* Backgrounds */
var(--bg-primary)
var(--bg-secondary)
var(--bg-tertiary)

/* Text */
var(--text-primary)
var(--text-secondary)
var(--text-tertiary)

/* Borders */
var(--border-strong)
var(--border-soft)
var(--border-subtle)

/* Radius */
var(--radius-sm)    /* 8px */
var(--radius-md)    /* 12px */
var(--radius-lg)    /* 16px */
var(--radius-xl)    /* 24px */
var(--radius-2xl)   /* 32px */
var(--radius-3xl)   /* 40px */

/* Shadows */
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
var(--shadow-xl)

/* Transitions */
var(--transition-fast)  /* 150ms */
var(--transition-base)  /* 250ms */
var(--transition-slow)  /* 350ms */
```

### Classes utilitaires

```css
/* Surfaces (adaptatif mode clair/sombre) */
.surface-primary
.surface-secondary
.surface-tertiary

/* Text */
.text-primary
.text-secondary
.text-tertiary

/* Border radius */
.rounded-sm     /* 8px */
.rounded-md     /* 12px */
.rounded-lg     /* 16px */
.rounded-xl     /* 24px */
.rounded-2xl    /* 32px */
.rounded-3xl    /* 40px */
.rounded-pill   /* 9999px */

/* Transitions */
.transition-fast
.transition-base
.transition-slow
```

## 🌗 Thème

Le design system supporte 3 modes :
- **light** : Mode clair
- **dark** : Mode sombre
- **system** : Suit les préférences système

Le ThemeProvider :
- Persiste le thème dans localStorage
- Écoute les changements système
- Force le retrait de la classe `.dark` en mode clair (compatible Edge)
- Utilise `requestAnimationFrame` pour garantir l'application du thème

## 📚 Exemple complet

Voir `components/ExampleDesignSystem.tsx` pour une démonstration complète de tous les composants.

Pour l'activer temporairement dans votre app :

```tsx
import { ExampleDesignSystem } from './components/ExampleDesignSystem';

// Dans App.tsx, ajouter temporairement :
<ExampleDesignSystem />
```

## 🔄 Migration

### Étape 1 : Remplacer les boutons

**Avant :**
```tsx
<button className="bg-[#0f8a6a] text-white px-4 py-2 rounded-lg">
  Cliquer
</button>
```

**Après :**
```tsx
import { Button } from './design-system';

<Button variant="primary" rounded="lg">
  Cliquer
</Button>
```

### Étape 2 : Remplacer les cartes

**Avant :**
```tsx
<div className="bg-white dark:bg-[#252525] p-6 rounded-2xl shadow-lg">
  Contenu
</div>
```

**Après :**
```tsx
import { Card } from './design-system';

<Card variant="elevated" rounded="2xl" padding="lg">
  Contenu
</Card>
```

### Étape 3 : Remplacer les inputs

**Avant :**
```tsx
<input 
  className="border px-4 py-2 rounded-md"
  placeholder="Email"
/>
```

**Après :**
```tsx
import { Input } from './design-system';

<Input 
  label="Email" 
  placeholder="email@exemple.com"
/>
```

## ✅ Avantages

1. **Cohérence** : Design uniforme sur toute l'application
2. **Maintenance** : Changements centralisés
3. **Performance** : Composants optimisés
4. **TypeScript** : Typage complet
5. **Accessibilité** : ARIA labels et gestion clavier
6. **Thème** : Support natif mode clair/sombre
7. **Edge compatible** : Gestion robuste des classes CSS

## 🛠️ Personnalisation

### Modifier les couleurs

Éditez `design-system/tokens/colors.ts` :

```typescript
export const colors = {
  primary: {
    500: '#VOTRE_COULEUR',
    // ...
  }
}
```

### Modifier les arrondis

Éditez `design-system/tokens/radius.ts` :

```typescript
export const radius = {
  xl: '32px',  // Au lieu de 24px
  // ...
}
```

### Ajouter un nouveau composant

1. Créer le dossier : `design-system/components/NouveauComposant/`
2. Créer `types.ts`, `NouveauComposant.tsx`, `index.ts`
3. Exporter dans `design-system/components/index.ts`

## 📖 Documentation

- [DESIGN_SYSTEM_AUDIT.md](../DESIGN_SYSTEM_AUDIT.md) - Audit complet et spécifications
- [AUTH_SETUP.md](../AUTH_SETUP.md) - Configuration Supabase
- [TEST_GUIDE.md](../TEST_GUIDE.md) - Guide de test

## 🤝 Contribution

Lors de l'ajout de nouveaux composants :

1. Suivre la structure existante (types, composant, index)
2. Utiliser les tokens du design system
3. Supporter le mode clair et sombre
4. TypeScript strict
5. Ajouter des exemples dans ExampleDesignSystem

## 📝 Changelog

### v1.0.0 - 2026-01-10
- ✅ Création du design system
- ✅ Tokens : colors, radius, spacing, typography, shadows
- ✅ Composants : Button, Card, Input, Modal
- ✅ ThemeProvider avec support Edge
- ✅ Classes utilitaires CSS
- ✅ Documentation complète
