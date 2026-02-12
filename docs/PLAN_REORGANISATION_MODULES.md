# 📋 Plan de Réorganisation des Modules

## Structure cible pour chaque module :
```
module/
  ├── components/     # Composants React
  ├── hooks/          # Hooks personnalisés
  ├── utils/          # Utilitaires et services
  ├── types/          # Types TypeScript
  └── index.tsx       # Point d'entrée du module
```

## Modules à réorganiser :

### 1. **an01** - Module d'analyse technique
**Structure actuelle :**
- `components/an01/` (composants + types.ts)
- `an01-utils/` (services + types.ts)

**Structure cible :**
- `components/an01/components/` (tous les composants)
- `components/an01/utils/` (services depuis an01-utils)
- `components/an01/types/` (types consolidés)
- `components/an01/index.tsx` (exports)

### 2. **redaction** - Module de rédaction
**Structure actuelle :**
- `components/redaction/` (composants + services/ + types/)

**Structure cible :**
- `components/redaction/components/` (tous les composants)
- `components/redaction/utils/` (services/)
- `components/redaction/types/` (déjà bien placé)
- `components/redaction/index.tsx` (exports)

### 3. **dce-complet** - Module DCE complet
**Structure actuelle :**
- `components/dce-complet/` (DCEComplet.tsx + hooks/ + services/ + types/ + shared/ + modules/)

**Structure cible :**
- `components/dce-complet/components/` (DCEComplet.tsx + shared/ + modules/)
- `components/dce-complet/utils/` (services/)
- `components/dce-complet/hooks/` (déjà bien placé)
- `components/dce-complet/types/` (déjà bien placé)
- `components/dce-complet/index.tsx` (renommer index.ts)

### 4. **analyse** - Module d'analyse
**Structure actuelle :**
- `components/analyse/` (composants + types.ts + generateRapportData.ts)

**Structure cible :**
- `components/analyse/components/` (tous les composants)
- `components/analyse/utils/` (generateRapportData.ts)
- `components/analyse/types/` (types.ts)
- `components/analyse/index.tsx` (exports)

### 5. **immobilier** - Module immobilier
**Structure actuelle :**
- `components/immobilier/` (composants + index.ts)
- `types/immobilier.ts` (à déplacer)

**Structure cible :**
- `components/immobilier/components/` (tous les composants)
- `components/immobilier/types/` (depuis types/immobilier.ts)
- `components/immobilier/index.tsx` (renommer index.ts)

### 6. **auth** - Module d'authentification
**Structure actuelle :**
- `components/auth/` (composants uniquement)
- `types/auth.ts` (à déplacer)

**Structure cible :**
- `components/auth/components/` (tous les composants)
- `components/auth/types/` (depuis types/auth.ts)
- `components/auth/index.tsx` (exports)
