# Intégration du Module BPU TMA v2 - Résumé

## ✅ Statut : TERMINÉ

Le module BPU TMA v2 (Version forfait global) a été intégré au système DCE Complet en complément du module BPU TMA initial.

## 🆕 Différences entre BPU TMA et BPU TMA v2

### BPU TMA (version Applications)
- Liste détaillée d'applications (20 applications)
- Phase 1 : Prise de connaissance par application (durée + prix forfaitaire)
- Phase 2 : UO-M mensuelles par application (nombre + prix unitaire)
- Adapté pour les marchés avec facturation par application

### BPU TMA v2 (version Forfait global)
- Prix forfaitaire global pour la prise de connaissance
- Prix unitaire unique pour l'UO-M
- Taux de dégressivité sur 4 ans
- Autres unités d'œuvre (UO-V, UO-A, UO-I)
- UO-R (Réversibilité) avec nombre estimé
- Prestations d'expertise (10 prestations)
- Prestations de réalisation (4 prestations)
- Calcul automatique de l'UO-S (moyenne des réalisations)
- Adapté pour le marché N° 25162_AOO_TMMA_LAY

## 📋 Fichiers créés

### Composants TypeScript
1. `components/dce-complet/components/modules/BPUTMAv2Form.tsx` - Formulaire complet
2. `components/dce-complet/components/modules/BPUTMAv2MultiLots.tsx` - Wrapper multi-lots

### Scripts SQL
1. `sql/create-bpus-tma-v2-table.sql` - Création de la table
2. `sql/add-bpu-tma-v2-column-to-dce.sql` - Ajout de la colonne dans dce

### Documentation
1. `BPU_TMA_V2_INTEGRATION.md` - Ce fichier

## 🔧 Fichiers modifiés

1. **components/dce-complet/types/index.ts**
   - Ajout du type `BPUTMAv2Data`
   - Ajout de `bpuTMAv2` dans `DCEState`
   - Ajout de `bpu_tma_v2` dans `DCERecord`
   - Ajout de `'bpuTMAv2'` dans `DCESectionType`
   - Ajout de `bpuTMAv2` dans `DCECompleteness`

2. **components/dce-complet/components/DCEComplet.tsx**
   - Import de `BPUTMAv2MultiLots`
   - Ajout de l'entrée de menu "BPU TMA v2 (Forfait)"
   - Rendu de la section `bpuTMAv2`

3. **services/lotService.ts**
   - Ajout de `'bpu_tma_v2'` au type `ModuleType`
   - Ajout de la table `'bpus_tma_v2'` dans `TABLE_MAPPING`

4. **components/dce-complet/utils/dceService.ts**
   - Support de `bpu_tma_v2` dans toutes les opérations
   - Conversions State ↔ Record
   - Mapping des colonnes

5. **components/dce-complet/utils/dceMapping.ts**
   - Initialisation de `bpuTMAv2: null`

6. **components/dce-complet/components/modules/defaults.ts**
   - Fonction `createDefaultBPUTMAv2()`
   - Fonction `ensureBPUTMAv2()`

## 🎯 Fonctionnalités du BPU TMA v2

### Section 1 : Prise de Connaissance
- Prix forfaitaire global HT
- Calcul automatique du TTC
- Unité : Forfait

### Section 2 : Unité d'Œuvre de Maintenance (UO-M)
- Prix unitaire HT
- Calcul automatique du TTC
- Unité : Unitaire

### Section 3 : Taux de Dégressivité
- Année 2 / Année 1 (%)
- Année 3 / Année 2 (%)
- Année 4 / Année 3 (%)

### Section 4 : Autres Unités d'Œuvre
- **UO-V** : Cycle en V (évolutions)
- **UO-A** : AGILE (évolutions)
- **UO-I** : Innovation (POC, prototypes)

### Section 5 : UO-R - Réversibilité
- Nombre d'UO-R estimé
- Prix unitaire HT
- Total estimé TTC calculé

### Section 6 : Prestations d'Expertise
10 prestations prédéfinies :
- EXP01 à EXP09 (Production dossier type)
- ACP01, ACP02, ACP05 (Contribution et suivi)

### Section 7 : Prestations de Réalisation
4 prestations prédéfinies :
- REA01 : Spécifications
- REA02 : Réalisation
- REA03 : Conception plan recette
- REA04 : Réalisation recette
- **UO-S** : Moyenne automatique des 4 prestations

### Fonctionnalités transversales
- Calcul automatique TTC avec taux TVA configurable
- Export CSV complet
- Sauvegarde dans Supabase
- Support multi-lots
- Intégration avec Configuration Globale

## 📦 Installation

### 1. Base de données

Exécuter les scripts SQL :

```bash
# 1. Créer la table bpus_tma_v2
psql -h [host] -U [user] -d [database] -f sql/create-bpus-tma-v2-table.sql

# 2. Ajouter la colonne bpu_tma_v2 à la table dce
psql -h [host] -U [user] -d [database] -f sql/add-bpu-tma-v2-column-to-dce.sql
```

Ou via l'interface Supabase (SQL Editor).

### 2. Application

Tous les fichiers TypeScript sont déjà en place. Redémarrer l'application.

## 🧪 Test

1. Démarrer l'application
2. Ouvrir "DCE Complet"
3. Sélectionner une procédure
4. Cliquer sur "BPU TMA v2 (Forfait)"
5. Remplir les sections
6. Sauvegarder
7. Tester l'export CSV

## 🎨 Interface utilisateur

- Design sombre moderne (slate-900)
- Sections numérotées (01 à 06)
- Badges colorés par type d'unité
- Calculs en temps réel
- Tableaux pour expertises et réalisations
- Instructions d'utilisation intégrées

## 📊 Structure de données

### Table `bpus_tma_v2`

```sql
id              UUID PRIMARY KEY
procedure_id    TEXT NOT NULL
numero_lot      INTEGER NOT NULL
libelle_lot     TEXT
data            JSONB NOT NULL
created_at      TIMESTAMPTZ
updated_at      TIMESTAMPTZ
```

### Type TypeScript

```typescript
interface BPUTMAv2Data {
  nomCandidat: string;
  tauxTVA: number;
  priseConnaissance: { forfaitGlobal: number };
  uom: { prixUnitaire: number };
  tauxDegressivite: {
    annee2: number;
    annee3: number;
    annee4: number;
  };
  autresUO: {
    uoV: number;  // Cycle en V
    uoA: number;  // AGILE
    uoI: number;  // Innovation
  };
  uoR: {
    nombreEstime: number;
    prixUnitaire: number;
  };
  expertises: Array<{
    ref: string;
    designation: string;
    prix: number;
  }>;
  realisations: Array<{
    ref: string;
    designation: string;
    prix: number;
  }>;
}
```

## 🔐 Sécurité

- RLS activé sur `bpus_tma_v2`
- 4 politiques (SELECT, INSERT, UPDATE, DELETE)
- Accès réservé aux utilisateurs authentifiés

## 📈 Performance

- Index sur `procedure_id`
- Index sur `numero_lot`
- JSONB pour flexibilité
- Contrainte d'unicité

## 💡 Cas d'usage

### Marché avec structure forfait + UO
1. Prise de connaissance : Forfait global
2. Maintenance : Prix unitaire par UO-M
3. Évolutions : UO-V, UO-A ou UO-I selon méthodologie
4. Réversibilité : UO-R avec nombre estimé
5. Prestations d'expertise à la demande
6. Prestations de réalisation classiques

### Avantages
- Simplicité de saisie
- Calcul automatique UO-S
- Dégressivité intégrée
- Adapté aux marchés Afpa
- Export CSV standardisé

## 📝 Notes

- Les deux modules BPU TMA (Applications et Forfait) coexistent
- Chaque procédure peut utiliser l'un ou l'autre selon le type de marché
- Les données sont stockées dans des tables séparées (bpus_tma et bpus_tma_v2)
- Les colonnes dans la table dce sont également distinctes (bpu_tma et bpu_tma_v2)

## 🎉 Résultat

Les utilisateurs disposent maintenant de **DEUX** modèles de BPU TMA :

1. **BPU TMA (Applications)** : Pour les marchés avec liste détaillée d'applications
2. **BPU TMA v2 (Forfait)** : Pour les marchés avec forfait global et expertises

---

**Date d'intégration :** 30 janvier 2026  
**Version :** 1.0.0  
**Statut :** ✅ Production Ready  
**Complément du module :** BPU TMA (Applications)
