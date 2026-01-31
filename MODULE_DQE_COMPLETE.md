# Module DQE - Copie Conforme du Module BPU

## 📋 Vue d'ensemble

Le module DQE (Décompte Quantitatif Estimatif) est une copie conforme du module BPU avec toutes les fonctionnalités suivantes :

## ✨ Fonctionnalités

### 1. **Tableau Éditable Multi-Lots**
- Ouverture directe en pleine page
- Navigation entre lots (précédent/suivant + dropdown)
- 18 colonnes personnalisables avec largeurs ajustées
- Ajout/suppression de lignes et colonnes
- Édition des en-têtes de colonnes

### 2. **Import Excel/CSV**
- Import intelligent avec détection automatique de l'onglet "DQE" ou "Décompte"
- Détection automatique de la ligne d'en-tête (mots-clés DQE)
- Mapping intelligent des colonnes avec normalisation des chaînes
- Support des fichiers CSV et Excel (.xlsx, .xls)

### 3. **Export Avancé**

#### Export ZIP (1 fichier par lot)
- Génère un fichier ZIP contenant un fichier Excel par lot
- Format des noms : `[NuméroProcédure]_DQE_LOT[Numéro]_[Nom du lot].xlsx`
- Exemple : `25001_DQE_LOT1_Terrassements généraux & VRD.xlsx`
- Options : tous les lots ou sélection manuelle

#### Export Consolidé (1 fichier multi-onglets)
- Page de garde avec informations de procédure et liste des lots
- Un onglet par lot sélectionné
- Format du fichier : `[NuméroProcédure]_DQE_Consolidé_[Nb]_lots.xlsx`
- Exemple : `25001_DQE_Consolidé_39_lots.xlsx`

### 4. **Duplication Multi-Lots**
- Dupliquer le tableau actuel vers d'autres lots
- Options : tous les lots ou sélection manuelle
- Sauvegarde automatique du lot source avant duplication
- Mise à jour en masse dans Supabase

### 5. **Gestion des Données**
- **Enregistrement** : Sauvegarde dans la table `dqes` de Supabase
- **Effacement** : Réinitialisation du tableau avec confirmation
- **Auto-chargement** : Les données sont automatiquement chargées depuis `dqes`

## 🗂️ Fichiers Créés/Modifiés

### Composants
- ✅ `components/dce-complet/components/modules/DQEForm.tsx` - Composant principal (remplacé)
- ✅ `components/dce-complet/components/modules/DQEMultiLots.tsx` - Wrapper multi-lots (remplacé)

### SQL
- ✅ `sql/alter-dqes-add-type.sql` - Migration pour ajouter la colonne `type_dqe`
- ✅ La table `dqes` existe déjà dans `sql/create_all_lots_tables.sql`

### Types
- ✅ Les types `DQEData`, `DQEColumn`, etc. existent déjà dans `components/dce-complet/types/index.ts`

## 🔧 Intégration

Le module DQE est déjà intégré dans :
- ✅ `components/dce-complet/components/DCEComplet.tsx` (onglet "DQE")
- ✅ Navigation principale du DCE Complet

## 📊 Structure de la Table Supabase

```sql
CREATE TABLE public.dqes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT NOT NULL,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  type_dqe TEXT NOT NULL DEFAULT 'standard', -- 🆕 À ajouter avec alter-dqes-add-type.sql
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT dqes_unique_lot UNIQUE (procedure_id, numero_lot)
);
```

## 🔄 Différences avec BPU

Toutes les références ont été changées :
- `BPU` → `DQE`
- `bpus` (table) → `dqes`
- `Bordereau de Prix Unitaires` → `Décompte Quantitatif Estimatif`
- `type_bpu` → `type_dqe`

## 🚀 Migration à Exécuter

Avant d'utiliser le module DQE, exécuter la migration SQL :

```bash
# Dans Supabase SQL Editor ou via CLI
psql -h [host] -U [user] -d [database] -f sql/alter-dqes-add-type.sql
```

Ou directement dans l'éditeur SQL de Supabase :
```sql
-- Copier-coller le contenu de sql/alter-dqes-add-type.sql
```

## ✅ Checklist de Vérification

- [x] Fichier `DQEForm.tsx` créé avec toutes les fonctionnalités
- [x] Fichier `DQEMultiLots.tsx` créé
- [x] Migration SQL pour `type_dqe` créée
- [x] Table `dqes` existe dans le schéma
- [x] Types TypeScript existent
- [x] Module intégré dans `DCEComplet.tsx`
- [ ] Migration SQL exécutée sur Supabase
- [ ] Test de l'import Excel
- [ ] Test de l'export ZIP
- [ ] Test de l'export consolidé
- [ ] Test de la duplication
- [ ] Test de la sauvegarde

## 📝 Notes

1. Les lots sont passés via props (`lotsConfig`) depuis la Configuration Globale
2. Le module utilise les mêmes colonnes par défaut que le BPU (18 colonnes)
3. Les exports respectent le format : `[NuméroProcédure]_DQE_LOT[Numéro]_[Nom du lot].xlsx`
4. La duplication sauvegarde toujours le lot source avant de dupliquer

## 🎯 Prochaines Étapes

1. Exécuter la migration SQL `alter-dqes-add-type.sql`
2. Tester le module DQE dans l'interface
3. Vérifier que tous les imports/exports fonctionnent correctement
4. Tester la duplication multi-lots
