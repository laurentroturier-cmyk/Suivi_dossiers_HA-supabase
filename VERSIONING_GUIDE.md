# 🔢 Système de Versioning GestProjet

## 📋 Vue d'ensemble

Système automatisé de gestion de version basé sur **Semantic Versioning (SemVer)**.

### Structure de version : `MAJOR.MINOR.PATCH`

- **MAJOR** : Changements incompatibles (breaking changes)
- **MINOR** : Nouvelles fonctionnalités rétrocompatibles
- **PATCH** : Corrections de bugs rétrocompatibles

---

## 🚀 Utilisation

### 1. Mettre à jour la version

```bash
# Patch (1.0.1 → 1.0.2) - Par défaut
npm run version:bump

# Minor (1.0.1 → 1.1.0) - Nouvelle fonctionnalité
npm run version:minor

# Major (1.0.1 → 2.0.0) - Breaking change
npm run version:major

# Ou directement
npm run version:patch
```

Le script va :
1. ✅ Vous demander de décrire les changements
2. ✅ Incrémenter la version automatiquement
3. ✅ Mettre à jour `version.json` et `package.json`
4. ✅ Générer le `CHANGELOG.md`
5. ✅ Créer un commit Git avec tag
6. ✅ Afficher les commandes pour pousser sur GitHub

### 2. Exemple interactif

```bash
$ npm run version:bump

🔄 Mise à jour de version...
   1.0.1 → 1.0.2
   Build: 1 → 2

📝 Décrivez les changements (séparés par des virgules):
> Correction bug authentification, Amélioration performance login

✅ version.json mis à jour
✅ package.json mis à jour
✅ CHANGELOG.md généré
✅ Commit et tag créés

📦 Version 1.0.2 prête !

💡 Pour pousser sur GitHub:
   git push origin main
   git push origin v1.0.2
```

---

## 📁 Fichiers créés

### 1. `version.json`

Configuration centrale de version :

```json
{
  "version": "1.0.1",
  "name": "GestProjet",
  "lastUpdate": "2026-01-10",
  "build": "1",
  "changelog": {
    "1.0.1": {
      "date": "2026-01-10",
      "type": "feature",
      "changes": [
        "Implémentation Design System",
        "ThemeProvider amélioré"
      ]
    }
  }
}
```

### 2. `scripts/bump-version.js`

Script Node.js automatisé qui :
- Incrémente la version selon SemVer
- Demande la description des changements
- Met à jour tous les fichiers
- Crée commit et tag Git
- Génère le CHANGELOG

### 3. `CHANGELOG.md`

Historique auto-généré de toutes les versions :

```markdown
## [1.0.1] - 2026-01-10

✨ **FEATURE**

- Implémentation Design System
- ThemeProvider amélioré
```

### 4. `components/AppVersion.tsx`

Composant React pour afficher la version dans l'UI :

```tsx
import { AppVersion } from './components/AppVersion';

// Dans votre footer ou header
<AppVersion />
// Affiche: "GestProjet v1.0.1 • Mise à jour : 10/01/2026"
```

---

## 🎨 Affichage dans l'UI

### Méthode 1 : Composant `<AppVersion />`

```tsx
import { AppVersion } from './components/AppVersion';

// Footer
<footer className="p-4 border-t border-[var(--border-soft)]">
  <AppVersion className="text-center" />
</footer>

// Header
<header>
  <AppVersion className="ml-auto" />
</header>
```

### Méthode 2 : Hook `useVersion()`

```tsx
import { useVersion } from './components/AppVersion';

function MyComponent() {
  const { version, name, fullVersion, buildInfo } = useVersion();
  
  return (
    <div>
      <h1>{name}</h1>
      <p>Version: {version}</p>
      <small>{buildInfo}</small>
    </div>
  );
}
```

### Méthode 3 : Import direct

```tsx
import version from './version.json';

console.log(`Running ${version.name} v${version.version}`);
```

---

## 📦 Scripts package.json

Ajoutés automatiquement :

```json
{
  "scripts": {
    "version:bump": "node scripts/bump-version.js",
    "version:major": "node scripts/bump-version.js major",
    "version:minor": "node scripts/bump-version.js minor",
    "version:patch": "node scripts/bump-version.js patch"
  }
}
```

---

## 🔄 Workflow complet

### Développement d'une nouvelle feature

```bash
# 1. Créer une branche
git checkout -b feature/nouvelle-feature

# 2. Développer...
git add .
git commit -m "feat: Ma nouvelle feature"

# 3. Merger dans main
git checkout main
git merge feature/nouvelle-feature

# 4. Bumper la version (MINOR)
npm run version:minor
# > Ajouter nouvelle feature X, Amélioration UI, etc.

# 5. Pousser sur GitHub
git push origin main
git push origin v1.1.0
```

### Correction de bug

```bash
# 1. Fix le bug
git add .
git commit -m "fix: Correction bug login"

# 2. Bumper la version (PATCH)
npm run version:patch
# > Correction bug login

# 3. Pousser
git push origin main
git push origin v1.0.2
```

### Breaking change

```bash
# 1. Implémenter le changement
git add .
git commit -m "feat!: Refonte complète auth"

# 2. Bumper la version (MAJOR)
npm run version:major
# > Refonte architecture authentification (breaking)

# 3. Pousser
git push origin main
git push origin v2.0.0
```

---

## 🎯 Bonnes pratiques

### ✅ À faire

- Bumper la version **après** avoir mergé dans `main`
- Décrire précisément les changements
- Utiliser PATCH pour les bugs
- Utiliser MINOR pour les features
- Utiliser MAJOR pour les breaking changes
- Pousser les tags sur GitHub (`git push origin v1.0.1`)

### ❌ À éviter

- Ne pas bumper manuellement dans `version.json`
- Ne pas oublier de pousser les tags
- Ne pas sauter de numéros de version
- Ne pas bumper pour des changements minuscules (typos, etc.)

---

## 📊 Affichage recommandé

### Footer de l'application

```tsx
<footer className="fixed bottom-0 left-0 right-0 p-3 surface-secondary border-t border-[var(--border-soft)]">
  <div className="container mx-auto flex justify-between items-center">
    <div className="text-xs text-tertiary">
      © 2026 GestProjet - Tous droits réservés
    </div>
    <AppVersion />
  </div>
</footer>
```

### Header (comme votre mockup)

```tsx
<header className="bg-[#1a1a1a] text-white px-4 py-2">
  <AppVersion className="text-gray-400" />
</header>
```

### Page "À propos"

```tsx
import { useVersion } from './components/AppVersion';
import { Card } from './design-system';

function AboutPage() {
  const { version, name, lastUpdate, build, changelog } = useVersion();
  
  return (
    <Card variant="elevated" rounded="2xl" padding="lg">
      <h1>{name}</h1>
      <p>Version {version}</p>
      <p>Build {build}</p>
      <p>Dernière mise à jour : {lastUpdate}</p>
      
      <h2>Historique des versions</h2>
      {Object.entries(changelog).map(([v, info]) => (
        <div key={v}>
          <h3>v{v} - {info.date}</h3>
          <ul>
            {info.changes.map((change, i) => (
              <li key={i}>{change}</li>
            ))}
          </ul>
        </div>
      ))}
    </Card>
  );
}
```

---

## 🔍 Informations disponibles

Via `useVersion()` :

```tsx
{
  version: "1.0.1",              // Version actuelle
  name: "GestProjet",            // Nom de l'app
  lastUpdate: "2026-01-10",      // Date dernière MAJ
  build: "1",                     // Numéro de build
  changelog: {...},               // Historique complet
  fullVersion: "GestProjet v1.0.1",  // Format complet
  buildInfo: "Build 1 - 2026-01-10"  // Info build
}
```

---

## 🚀 GitHub Releases (Optionnel)

Après avoir poussé un tag, créez une release sur GitHub :

1. Aller sur GitHub → Releases → Draft a new release
2. Choisir le tag (ex: `v1.0.1`)
3. Copier-coller la section du CHANGELOG
4. Publish release

Ou automatiser avec GitHub CLI :

```bash
gh release create v1.0.1 --title "Version 1.0.1" --notes-file CHANGELOG.md
```

---

## 📝 Exemple CHANGELOG généré

```markdown
# 📝 Changelog - GestProjet

## [1.2.0] - 2026-01-15

✨ **MINOR**

- Ajout module rapports avancés
- Export PDF des analyses
- Graphiques interactifs

## [1.1.1] - 2026-01-12

🐛 **PATCH**

- Correction bug pagination
- Amélioration performance chargement

## [1.1.0] - 2026-01-11

✨ **MINOR**

- Nouveau tableau de bord
- Filtres avancés

## [1.0.1] - 2026-01-10

✨ **FEATURE**

- Design System complet
- ThemeProvider amélioré
```

---

## ✅ Checklist d'utilisation

- [x] `version.json` créé
- [x] `scripts/bump-version.js` créé
- [x] Scripts ajoutés à `package.json`
- [x] `CHANGELOG.md` initialisé
- [x] `AppVersion` component créé
- [x] `useVersion` hook disponible
- [ ] Ajouter `<AppVersion />` dans votre UI
- [ ] Tester `npm run version:bump`
- [ ] Pousser avec tags sur GitHub

---

## 🎉 C'est prêt !

Votre système de versioning est **100% automatisé** et prêt à l'emploi.

**Prochaine action :** Ajoutez `<AppVersion />` dans votre footer/header pour afficher la version comme dans votre mockup !
