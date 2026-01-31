# Architecture BPU Unifiée

## 📋 Vue d'ensemble

Tous les types de BPU (Bordereau de Prix Unitaires) utilisent désormais **une seule table `bpus`** avec un champ `type_bpu` pour différencier les variantes.

## 🗄️ Schéma de la table `bpus`

```sql
CREATE TABLE public.bpus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT NULL,
  type_bpu TEXT NOT NULL DEFAULT 'standard', -- 🆕 Type de BPU
  data JSONB NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NULL DEFAULT now(),
  
  -- Un lot = un seul type de BPU
  CONSTRAINT bpus_unique_lot UNIQUE (procedure_id, numero_lot)
);

-- Index pour optimiser les requêtes
CREATE INDEX idx_bpus_procedure ON public.bpus(procedure_id);
CREATE INDEX idx_bpus_lot ON public.bpus(numero_lot);
CREATE INDEX idx_bpus_type ON public.bpus(type_bpu);
CREATE INDEX idx_bpus_procedure_type ON public.bpus(procedure_id, type_bpu);
```

## 🎯 Types de BPU supportés

| Module Type | Type BPU | Description |
|-------------|----------|-------------|
| `bpu` | `standard` | BPU classique avec lignes de prix unitaires |
| `bpu_tma` | `tma` | BPU TMA avec forfait global, dégressivité, expertises |
| (futur) `bpu_travaux` | `travaux` | BPU spécifique aux marchés de travaux |
| (futur) `bpu_services` | `services` | BPU spécifique aux marchés de services |

## 🔧 Service `lotService`

Le service a été adapté pour :
- **Filtrer automatiquement** par `type_bpu` lors des requêtes
- **Insérer automatiquement** le `type_bpu` lors de la sauvegarde
- **Gérer la coexistence** des anciennes tables (`actes_engagement`, `questionnaires_techniques`, etc.) et de la nouvelle table unifiée `bpus`

### Mapping des types

```typescript
const TABLE_MAPPING: Record<ModuleType, string> = {
  bpu: 'bpus',
  bpu_tma: 'bpus', // ✅ Même table
  // ... autres modules avec leurs tables dédiées
};

const BPU_TYPE_MAPPING: Record<ModuleType, string | null> = {
  bpu: 'standard',
  bpu_tma: 'tma',
  // null pour les modules qui n'utilisent pas la table bpus
};
```

### Exemples d'utilisation

```typescript
// Récupérer tous les lots BPU standard d'une procédure
const lotsStandard = await lotService.getLotsForProcedure('12345', 'bpu');
// → SELECT * FROM bpus WHERE procedure_id = '12345' AND type_bpu = 'standard'

// Récupérer tous les lots BPU TMA d'une procédure
const lotsTMA = await lotService.getLotsForProcedure('12345', 'bpu_tma');
// → SELECT * FROM bpus WHERE procedure_id = '12345' AND type_bpu = 'tma'

// Sauvegarder un lot BPU TMA
await lotService.saveLot('12345', 1, dataLot, 'bpu_tma', 'Lot 1 - TMA');
// → INSERT/UPDATE bpus avec type_bpu = 'tma'
```

## ✅ Avantages de cette architecture

1. **Simplicité** : Une seule table à gérer pour tous les types de BPU
2. **Extensibilité** : Ajouter un nouveau type de BPU = 0 migration SQL
3. **Maintenabilité** : Pas de duplication de schéma, RLS, ou index
4. **Flexibilité** : Le JSONB permet toutes les variations de structure
5. **Performance** : Index optimisés pour les requêtes par type
6. **Cohérence** : Contrainte d'unicité garantit 1 lot = 1 type de BPU

## 🔄 Migration

Pour migrer une base existante :

```bash
# 1. Ajouter le champ type_bpu à la table bpus
psql -f sql/alter-bpus-add-type.sql

# 2. Si vous aviez déjà créé bpus_tma, migrer les données
# (script à créer si nécessaire)
```

## 📝 Ajouter un nouveau type de BPU

1. **Créer les composants React** :
   - `BPUNouveauForm.tsx` : Formulaire spécifique
   - `BPUNouveauMultiLots.tsx` : Wrapper avec GenericMultiLots

2. **Ajouter le type dans les enums** :

```typescript
// services/lotService.ts
export type ModuleType = ... | 'bpu_nouveau';

const TABLE_MAPPING: Record<ModuleType, string> = {
  // ...
  bpu_nouveau: 'bpus', // ✅ Utilise la table bpus
};

const BPU_TYPE_MAPPING: Record<ModuleType, string | null> = {
  // ...
  bpu_nouveau: 'nouveau', // ✅ Type dans la colonne type_bpu
};

// components/dce-complet/types/index.ts
export interface BPUNouveauData {
  // Structure spécifique
}

export interface DCEState {
  // ...
  bpuNouveau: BPUNouveauData | null;
}

export type DCESectionType = ... | 'bpuNouveau';
```

3. **Ajouter dans DCEComplet** :
   - Import du composant
   - Entrée dans le menu `sections`
   - Case dans `renderSectionContent`

4. **Créer les valeurs par défaut** :
   - `createDefaultBPUNouveau()` dans `defaults.ts`

**C'est tout ! Aucune migration SQL nécessaire.** 🎉

## 🔐 RLS (Row Level Security)

Les politiques RLS existantes sur la table `bpus` s'appliquent à tous les types de BPU automatiquement.

## 📊 Requêtes utiles

```sql
-- Compter les BPU par type
SELECT type_bpu, COUNT(*) 
FROM bpus 
GROUP BY type_bpu;

-- Voir tous les BPU TMA d'une procédure
SELECT * 
FROM bpus 
WHERE procedure_id = '12345' 
  AND type_bpu = 'tma';

-- Lister les procédures ayant plusieurs types de BPU
SELECT procedure_id, COUNT(DISTINCT type_bpu) as nb_types
FROM bpus
GROUP BY procedure_id
HAVING COUNT(DISTINCT type_bpu) > 1;
```

## 🚀 Prochaines étapes possibles

- Ajouter d'autres types de BPU (travaux, services, etc.)
- Créer un sélecteur de type de BPU dans l'interface
- Permettre la conversion d'un type de BPU à un autre
- Ajouter des templates par type de BPU
