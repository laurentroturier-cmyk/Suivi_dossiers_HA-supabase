# 🎨 Composants UI Standardisés

Bibliothèque de composants UI réutilisables avec palette de couleurs cohérente.

## 📦 Installation

Les composants sont déjà disponibles dans `components/ui/` et peuvent être importés directement :

```typescript
import { Button, Input, Card } from '@/components/ui';
```

---

## 🎯 Button

Composant bouton avec 8 variantes, 3 tailles et support des icônes.

### Variantes

- `primary` - Vert principal (par défaut)
- `secondary` - Fond secondaire avec bordure
- `outline` - Contour vert
- `ghost` - Transparent avec hover
- `danger` - Rouge pour actions destructives
- `success` - Vert pour actions positives
- `info` - Bleu pour actions informatives
- `warning` - Orange pour avertissements

### Tailles

- `sm` - Petit
- `md` - Moyen (par défaut)
- `lg` - Grand

### Exemples

```tsx
// Bouton primary simple
<Button onClick={handleClick}>
  Cliquer
</Button>

// Bouton avec icône
<Button 
  variant="primary"
  icon={<Icon />}
  iconPosition="left"
>
  Sauvegarder
</Button>

// Bouton avec état de chargement
<Button 
  loading={isLoading}
  disabled={isLoading}
>
  Envoyer
</Button>

// Bouton pleine largeur
<Button fullWidth>
  Valider
</Button>

// Bouton avec différentes variantes
<Button variant="success">Succès</Button>
<Button variant="danger">Supprimer</Button>
<Button variant="info">Information</Button>
<Button variant="warning">Attention</Button>
```

---

## 📝 Input

Champ de saisie avec label, erreur, helper text et support des icônes.

### Exemples

```tsx
// Input simple
<Input 
  label="Email"
  placeholder="email@exemple.com"
/>

// Input avec erreur
<Input 
  label="Email"
  error="Email invalide"
/>

// Input avec helper text
<Input 
  label="Mot de passe"
  helperText="Au moins 8 caractères"
/>

// Input avec icône
<Input 
  label="Recherche"
  icon={<SearchIcon />}
  iconPosition="left"
/>

// Input avec type spécifique
<Input 
  type="date"
  label="Date de naissance"
/>
```

---

## 🃏 Card

Carte pour structurer le contenu avec différentes variantes.

### Variantes

- `elevated` - Avec ombre (par défaut)
- `outlined` - Avec bordure épaisse
- `filled` - Fond coloré
- `flat` - Plat avec bordure subtile

### Exemples

```tsx
// Card simple
<Card>
  <h2>Titre</h2>
  <p>Contenu</p>
</Card>

// Card avec hover
<Card hover>
  Contenu interactif
</Card>

// Card avec padding personnalisé
<Card padding="lg">
  Contenu avec plus d'espace
</Card>

// Card avec border-radius personnalisé
<Card rounded="2xl">
  Contenu avec coins très arrondis
</Card>
```

---

## 🎨 Palette de couleurs

Tous les composants utilisent les variables CSS du design system :

- `--accent-green` : Couleur principale (#0f8a6a)
- `--accent-green-hover` : Hover state (#0c6f56)
- `--color-bg-primary` : Fond principal
- `--color-bg-secondary` : Fond secondaire
- `--color-text-primary` : Texte principal
- `--color-text-secondary` : Texte secondaire
- `--border-soft` : Bordure douce
- `--border-strong` : Bordure forte

---

## ✅ Bonnes pratiques

1. **Utiliser les variantes standard** : Préférer les variantes prédéfinies aux classes custom
2. **Cohérence des tailles** : Utiliser `sm` pour les actions secondaires, `md` pour les actions principales
3. **Accessibilité** : Toujours fournir un label pour les inputs
4. **États de chargement** : Utiliser la prop `loading` au lieu de désactiver manuellement
5. **Dark mode** : Les composants s'adaptent automatiquement via les variables CSS

---

## 🔄 Migration depuis les anciens composants

### Avant (design-system)
```tsx
import { Button } from '@/design-system';
<Button variant="primary">Cliquer</Button>
```

### Après (components/ui)
```tsx
import { Button } from '@/components/ui';
<Button variant="primary">Cliquer</Button>
```

Les props sont compatibles, seul l'import change.

---

**Version** : 1.0.0  
**Dernière mise à jour** : 2026-01-25
