# 🚀 Quick Start - Design System

## ✅ Ce qui a été fait

Le design system est **100% opérationnel** et prêt à l'emploi !

### Structure créée

```
design-system/
├── tokens/              ✅ Tokens de design (couleurs, radius, spacing, etc.)
├── theme/               ✅ ThemeProvider + theme.css
├── components/          ✅ Button, Card, Input, Modal
├── hooks/               ✅ useTheme hook
├── index.ts             ✅ Export central
└── README.md            ✅ Documentation complète
```

### Intégrations

- ✅ CSS importé dans `index.tsx`
- ✅ ThemeProvider remplace l'ancien de `contexts/ThemeContext`
- ✅ ThemeToggle mis à jour pour utiliser le nouveau provider
- ✅ ExampleDesignSystem créé pour démonstration
- ✅ Aucune erreur TypeScript

## 🎯 Utilisation immédiate

### 1. Voir la démo

Le serveur dev tourne sur **http://localhost:3000**

Pour voir tous les composants en action, ajoutez temporairement dans `App.tsx` :

```tsx
import { ExampleDesignSystem } from './components/ExampleDesignSystem';

// Quelque part dans votre rendu :
<ExampleDesignSystem />
```

### 2. Utiliser les composants

**Button**
```tsx
import { Button } from './design-system';

<Button variant="primary" rounded="pill" icon={<CheckIcon />}>
  Valider
</Button>
```

**Card**
```tsx
import { Card } from './design-system';

<Card variant="elevated" rounded="2xl" padding="lg" hover>
  <h2>Mon contenu</h2>
</Card>
```

**Input**
```tsx
import { Input } from './design-system';

<Input 
  label="Email" 
  placeholder="email@exemple.com"
  icon={<MailIcon />}
  helperText="Entrez votre email professionnel"
/>
```

**Modal**
```tsx
import { Modal } from './design-system';

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Confirmation">
  <p>Êtes-vous sûr ?</p>
  <Button onClick={handleConfirm}>Oui</Button>
</Modal>
```

### 3. Utiliser les variables CSS

```css
/* Dans vos composants */
background-color: var(--bg-primary);
color: var(--text-primary);
border-radius: var(--radius-xl);
box-shadow: var(--shadow-lg);
```

```tsx
/* Ou avec les classes utilitaires */
<div className="surface-primary rounded-2xl">
  <p className="text-primary">Mon texte</p>
</div>
```

## 📋 Prochaines étapes (Migration)

### Phase 1 : Migration progressive des composants

**Priorité 1 - Login & Auth**
- [ ] `components/auth/Login.tsx` → Utiliser Button, Input, Card
- [ ] `components/auth/AdminDashboard.tsx` → Utiliser Card, Button

**Priorité 2 - Landing Page**
- [ ] `components/LandingPage.tsx` → Utiliser Card, Button
  - Remplacer les 7+ objets de couleurs hardcodés
  - Utiliser les variants du design system

**Priorité 3 - Tables & Registres**
- [ ] `components/Contrats.tsx`
- [ ] `components/RegistreDepots.tsx`
- [ ] `components/RegistreRetraits.tsx`

**Priorité 4 - Module AN01**
- [ ] `components/an01/Dashboard.tsx`
- [ ] `components/an01/TechnicalAnalysisView.tsx`
- [ ] Autres composants an01/*

### Phase 2 : Nettoyage CSS

Une fois les composants migrés :

1. Supprimer les couleurs hardcodées
2. Simplifier `dark-theme.css`
3. Merger les variables redondantes dans `index.css`

### Phase 3 : Nouveaux composants

Créer selon les besoins :
- [ ] Table
- [ ] Badge
- [ ] Tabs
- [ ] Dropdown
- [ ] Alert
- [ ] Toast

## 🛠️ Commandes utiles

```bash
# Démarrer le dev server
npm run dev

# Build
npm run build

# Vérifier les types
npx tsc --noEmit
```

## 📚 Documentation

- **[design-system/README.md](design-system/README.md)** - Doc complète du design system
- **[DESIGN_SYSTEM_AUDIT.md](DESIGN_SYSTEM_AUDIT.md)** - Audit et spécifications
- **[components/ExampleDesignSystem.tsx](components/ExampleDesignSystem.tsx)** - Démo interactive

## ✨ Avantages immédiats

1. **Cohérence** : Plus de couleurs hardcodées dispersées
2. **Maintenance** : Changement global en 1 seul endroit
3. **Performance** : Composants optimisés
4. **TypeScript** : Autocomplete et typage complet
5. **Edge compatible** : ThemeProvider robuste testé
6. **Accessibilité** : ARIA labels intégrés
7. **Dark mode** : Support natif parfait

## 🎨 Personnalisation rapide

### Changer la couleur primaire

Éditez `design-system/tokens/colors.ts` :
```typescript
primary: {
  500: '#VOTRE_COULEUR', // Au lieu de #0f8a6a
}
```

### Changer les arrondis

Éditez `design-system/tokens/radius.ts` :
```typescript
xl: '32px',  // Au lieu de 24px
```

Les changements sont automatiquement répercutés partout ! 🚀

## ⚡ Test rapide

1. Ouvrir http://localhost:3000
2. L'app devrait tourner normalement
3. Le toggle dark/light fonctionne
4. Aucune régression visuelle

Pour tester les nouveaux composants :
1. Décommenter `<ExampleDesignSystem />` dans App.tsx
2. Naviguer pour voir tous les composants
3. Tester le toggle dark/light
4. Tester sur Edge ET Chrome

## 🐛 En cas de problème

### Le thème ne s'applique pas

Vérifier que `design-system/theme/theme.css` est bien importé dans `index.tsx` :
```tsx
import './design-system/theme/theme.css';
```

### Les composants ne sont pas trouvés

Vérifier l'import :
```tsx
import { Button, Card, Input, Modal } from './design-system';
```

### Erreurs TypeScript

Toutes les erreurs ont été corrigées. Si nouvelles erreurs :
```bash
npx tsc --noEmit
```

## 🎉 C'est parti !

Le design system est **production-ready**. Vous pouvez :

1. **Utiliser les composants immédiatement** dans vos nouvelles features
2. **Migrer progressivement** les composants existants
3. **Étendre** en créant de nouveaux composants suivant la structure

**Documentation complète** : [design-system/README.md](design-system/README.md)

Bon développement ! 🚀
