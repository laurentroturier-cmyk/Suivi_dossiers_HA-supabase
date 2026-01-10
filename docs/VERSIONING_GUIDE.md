# 📦 Guide de Versioning - ImmoVision

## 🎯 Vue d'ensemble

Votre application utilise un système de versioning automatisé basé sur le fichier `version.json` et les scripts npm.

### Affichage actuel
- **Header** : À côté du titre "ImmoVision"
- **Footer** : En bas de page
- **Format** : `ImmoVision v1.0.2 • Mise à jour : 10/01/2026`

## 🚀 Commandes de versioning

### Bump automatique de version

```bash
# Patch (1.0.2 → 1.0.3) - Corrections de bugs
npm run version:patch

# Minor (1.0.2 → 1.1.0) - Nouvelles fonctionnalités
npm run version:minor

# Major (1.0.2 → 2.0.0) - Breaking changes
npm run version:major
```

### Bump manuel avec changelog

```bash
node scripts/bump-version.js patch "Description du changement"
node scripts/bump-version.js minor "Nouvelle fonctionnalité X"
node scripts/bump-version.js major "Refonte complète module Y"
```

## 📝 Workflow recommandé

### 1. Avant de déployer une nouvelle version

```bash
# Vérifier les changements
git status

# Bumper la version selon le type de changement
npm run version:patch  # ou minor/major

# Commit automatique (le script bump-version le fait)
# ou commit manuel si nécessaire
git add version.json package.json
git commit -m "chore: bump version to vX.X.X"

# Push
git push
```

### 2. Convention de nommage des versions

**Format** : `MAJOR.MINOR.PATCH`

- **MAJOR (1.x.x → 2.x.x)** : Changements incompatibles (breaking changes)
  - Refonte complète d'un module
  - Changement de structure de base de données
  - Migration vers nouvelle techno

- **MINOR (x.1.x → x.2.x)** : Nouvelles fonctionnalités compatibles
  - Nouveau module (ex: Immobilier)
  - Nouvelles features dans module existant
  - Amélioration majeure UI/UX

- **PATCH (x.x.1 → x.x.2)** : Corrections de bugs
  - Correction de bugs
  - Petites améliorations
  - Optimisations performance

## 🔧 Personnalisation

### Modifier le nom de l'application

Éditez `version.json` :
```json
{
  "name": "ImmoVision",  // ← Changez ici
  "version": "1.0.2",
  "lastUpdate": "2026-01-10"
}
```

### Changer le style d'affichage

Éditez `components/AppVersion.tsx` et ajustez les classes Tailwind :
```tsx
<div className={`text-sm text-tertiary ${className}`}>
  {/* Modifier ici */}
</div>
```

### Ajouter la version ailleurs

Dans n'importe quel composant :
```tsx
import { AppVersion } from '@/components/AppVersion';

// Dans le JSX
<AppVersion className="mon-style" />
```

Ou utiliser le hook :
```tsx
import { useVersion } from '@/components/AppVersion';

const MyComponent = () => {
  const { version, name, fullVersion } = useVersion();
  return <div>{fullVersion}</div>;
};
```

## 📊 Changelog automatique

Le fichier `version.json` garde un historique des changements :

```json
{
  "changelog": {
    "1.0.2": {
      "date": "2026-01-10",
      "type": "patch",
      "changes": [
        "Correction bug filtres",
        "Amélioration performance"
      ]
    }
  }
}
```

## 🎨 Exemples d'affichage

### Variante inline (défaut)
```tsx
<AppVersion />
// → ImmoVision v1.0.2 • Mise à jour : 10/01/2026
```

### Dans le header
```tsx
<AppVersion className="text-lg font-bold" />
```

### Dans le footer
```tsx
<AppVersion className="text-center text-gray-500" />
```

## ✅ Checklist avant release

- [ ] Tous les tests passent
- [ ] Aucune erreur console
- [ ] Version bumpée correctement
- [ ] Changelog mis à jour
- [ ] Git commit + push
- [ ] Build production testé
- [ ] Déploiement réussi

## 🛠️ Troubleshooting

### La version ne s'affiche pas
1. Vérifiez que `version.json` existe à la racine
2. Vérifiez l'import dans le composant
3. Redémarrez le serveur de dev

### La date n'est pas au bon format
Le format est automatique : `DD/MM/YYYY` en français via `toLocaleDateString('fr-FR')`

### Je veux afficher seulement le numéro de version
```tsx
import { useVersion } from '@/components/AppVersion';
const { version } = useVersion();
// → "1.0.2"
```

## 📚 Ressources

- [Semantic Versioning](https://semver.org/lang/fr/)
- [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/)
- [Conventional Commits](https://www.conventionalcommits.org/fr/)

---

**Dernière mise à jour** : 10/01/2026  
**Maintenu par** : Équipe ImmoVision
