# 🚀 Quick Reference - Versioning

## Commandes principales

```bash
# Bump de version automatique
npm run version:bump      # Patch: 1.0.1 → 1.0.2 (bugs)
npm run version:minor     # Minor: 1.0.1 → 1.1.0 (features)
npm run version:major     # Major: 1.0.1 → 2.0.0 (breaking)

# Pousser sur GitHub (après bump)
git push origin main
git push origin v1.0.2    # Remplacer par votre version
```

## Intégration UI rapide

```tsx
import { AppVersion } from './components/AppVersion';

// Header sombre (comme mockup)
<header className="bg-[#1a1a1a] px-6 py-2.5">
  <AppVersion className="text-gray-400 text-xs" />
</header>
```

## Hook useVersion

```tsx
import { useVersion } from './components/AppVersion';

const { version, name, lastUpdate, build } = useVersion();
```

## Workflow

1. Développer feature
2. Commit changements
3. `npm run version:minor`
4. Décrire changements
5. Push avec tag

## Fichiers clés

- `version.json` - Config version
- `CHANGELOG.md` - Historique auto
- `components/AppVersion.tsx` - Composant UI

## Docs complètes

- [VERSIONING_GUIDE.md](VERSIONING_GUIDE.md)
- [VERSIONING_COMPLETE.md](VERSIONING_COMPLETE.md)
- [docs/UI_VERSION_EXAMPLES.md](docs/UI_VERSION_EXAMPLES.md)
