# Refactoring : Source Unique pour les Lots

## 📋 Problème identifié

Actuellement, les lots sont définis à **2 endroits différents** :

1. **Configuration Globale** (`dce.configuration_globale.lots`)
   - Système simple
   - Pas d'import/export Excel
   - Pas de modale de configuration

2. **Règlement de Consultation** (`reglements_consultation.data.conditions.lots`)
   - Système abouti
   - Modale de configuration (`LotsConfigurationModal`)
   - Import/Export Excel (`lotsExcelService`)

### Conséquences

❌ **Incohérence des données** : Les lots de Config Globale et RC peuvent être différents  
❌ **Confusion** : Lequel utiliser ?  
❌ **Code dupliqué** : Hook `useLotsFromRC` inutile  
❌ **BPU affiche "lot auvergne"** au lieu des 9 lots détaillés du RC

## 🎯 Solution adoptée

### Principe : Configuration Globale = Source unique de vérité

**Configuration Globale** devient la **source unique** pour les lots avec le système abouti du RC.

### Architecture cible

```
┌──────────────────────────────────────┐
│  Configuration Globale               │
│  (dce.configuration_globale.lots)    │
│                                      │
│  ✅ Modale de configuration          │
│  ✅ Import/Export Excel              │
│  ✅ Source unique de vérité          │
└───────────────┬──────────────────────┘
                │
                │ Lecture seule
                ▼
     ┌──────────────────────────┐
     │ Règlement de Consultation│
     │ (affichage readonly)     │
     └──────────────────────────┘
                │
                │ configurationGlobale.lots
                ▼
        ┌───────────────┐
        │ Tous les      │
        │ modules DCE   │
        │               │
        │ • BPU         │
        │ • BPU TMA     │
        │ • DQE         │
        │ • DPGF        │
        │ • Acte Eng.   │
        │ • CCAP        │
        │ • CCTP        │
        └───────────────┘
```

## 📝 Modifications effectuées

### 1. ✅ Configuration Globale (FAIT)

**Fichier** : `components/dce-complet/components/modules/ConfigurationGlobale.tsx`

**Ajouts** :
- Import de `LotsConfigurationModal`
- Import de `exportLotsToExcel`, `importLotsFromExcel`
- État pour la modale : `isLotsModalOpen`
- État pour les erreurs d'import : `importError`
- Ref pour l'input file : `fileInputRef`
- Fonctions :
  - `lotsToExcel()` : Convertir les lots en format Excel
  - `handleLotsFromModal()` : Mettre à jour depuis la modale
  - `handleExportExcel()` : Exporter vers Excel
  - `handleImportExcel()` : Importer depuis Excel
  - `triggerFileImport()` : Déclencher l'input file

**Interface modifiée** :
- Boutons ajoutés : "Configurer", "Export Excel", "Import Excel"
- Modale intégrée en bas du composant

### 2. ✅ Passage des lots au Règlement de Consultation (FAIT)

**Fichiers modifiés** :

1. `DCEComplet.tsx` :
   ```typescript
   <ReglementConsultationLegacyWrapper 
     lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
   />
   ```

2. `ReglementConsultationLegacyWrapper.tsx` :
   - Ajout du prop `lotsFromConfigurationGlobale`
   - Transmission au composant `ReglementConsultation`

3. `components/redaction/components/ReglementConsultation.tsx` :
   - Interface `LotConfiguration` ajoutée
   - Prop `lotsFromConfigurationGlobale` ajouté à `ReglementConsultationProps`

### 3. 🔄 Modification du Règlement de Consultation (EN COURS)

**À FAIRE** :

1. Afficher les lots depuis `lotsFromConfigurationGlobale` en lecture seule
2. Remplacer la zone de saisie manuelle par un affichage readonly
3. Ajouter un lien/bouton vers Configuration Globale pour modifier les lots
4. Supprimer la logique de saisie/édition des lots
5. Supprimer la modale de configuration des lots du RC
6. Supprimer les boutons Import/Export Excel du RC

### 4. 🔄 Mise à jour des modules utilisant les lots (À FAIRE)

**Modules concernés** :
- ✅ BPU : Utilise déjà `configurationGlobale.lots` via `GenericMultiLots`
- ✅ BPU TMA : Idem
- ❌ DQE : À vérifier
- ❌ DPGF : À vérifier
- ❌ Acte d'Engagement : À vérifier
- ❌ CCAP : À vérifier
- ❌ CCTP : À vérifier

**Hook à supprimer** :
- `useLotsFromRC` → Remplacer par accès direct à `configurationGlobale.lots`
- `reglementConsultationService.ts` → Supprimer ou adapter

### 5. 🗑️ Nettoyage (À FAIRE)

**Fichiers à supprimer/adapter** :
- `components/dce-complet/hooks/useLotsFromRC.ts` → ❌ SUPPRIMER
- `components/dce-complet/utils/reglementConsultationService.ts` → ❌ SUPPRIMER ou ADAPTER
- `docs/BPU_INTEGRATION_RC.md` → ❌ SUPPRIMER (obsolète)

**Fichiers à mettre à jour** :
- `DCEComplet.tsx` : Supprimer `useLotsFromRC`
- Tous les modules utilisant `lotsFromRC` : Remplacer par `configurationGlobale.lots`

## 🔧 Structure de données

### LotConfiguration (Configuration Globale)

```typescript
interface LotConfiguration {
  numero: string;
  intitule: string;
  montant: string;        // "montant" au lieu de "montantMax"
  description?: string;
}
```

### Lot (Règlement de Consultation) - OBSOLÈTE

```typescript
// ⚠️ NE PLUS UTILISER - Sera supprimé
interface Lot {
  numero: string;
  intitule: string;
  montantMax: string;     // "montantMax" au lieu de "montant"
}
```

### Mapping

Configuration Globale → RC (readonly) :
- `lot.montant` → `lot.montantMax` (juste pour affichage)

## 📊 Base de données

### Table `dce`

```sql
configuration_globale JSONB
-- Exemple :
{
  "lots": [
    {
      "numero": "1",
      "intitule": "Lot 1 – Fourniture de matériel informatique",
      "montant": "20000",
      "description": ""
    },
    {
      "numero": "2",
      "intitule": "Lot 2 – Prestations de maintenance",
      "montant": "30000",
      "description": ""
    }
  ]
}
```

### Table `reglements_consultation`

```sql
data JSONB
-- conditions.lots sera en lecture seule depuis configuration_globale
{
  "conditions": {
    "nbLots": "2",  // Calculé depuis configuration_globale.lots.length
    "lots": []       // ⚠️ Ne sera plus utilisé pour la saisie
  }
}
```

## 🎯 Workflow utilisateur

### Nouveau workflow

1. **Ouvrir Configuration Globale**
2. **Configurer les lots** :
   - Manuellement : Ajouter/Modifier/Supprimer
   - Via modale : Configuration avancée
   - Via Excel : Import/Export
3. **Les lots sont automatiquement disponibles** dans :
   - Règlement de Consultation (affichage readonly)
   - BPU, DQE, DPGF, etc. (sélection des lots)
4. **Export des documents** : Lots cohérents partout

## ✅ Avantages

1. **Source unique de vérité** : Plus de confusion
2. **Cohérence garantie** : Les lots sont identiques partout
3. **Meilleure UX** : Système abouti (modale + Excel) accessible dès le début
4. **Workflow logique** : Configuration → Utilisation
5. **Maintenance simplifiée** : Un seul code à maintenir

## ⚠️ Points d'attention

### Migration des données existantes

Les DCE existants peuvent avoir :
- Des lots dans `configuration_globale.lots` (peut-être vides ou "lot auvergne")
- Des lots dans `reglements_consultation.data.conditions.lots` (les 9 lots détaillés)

**Script de migration nécessaire** :
```sql
-- Copier les lots du RC vers Configuration Globale si Config Globale est vide
UPDATE public.dce d
SET configuration_globale = jsonb_set(
  COALESCE(configuration_globale, '{}'::jsonb),
  '{lots}',
  (
    SELECT rc.data->'conditions'->'lots'
    FROM public.reglements_consultation rc
    WHERE rc.numero_procedure = d.numero_procedure
  )
)
WHERE 
  (configuration_globale->'lots' IS NULL OR 
   jsonb_array_length(configuration_globale->'lots') = 0)
  AND EXISTS (
    SELECT 1 FROM public.reglements_consultation rc
    WHERE rc.numero_procedure = d.numero_procedure
    AND jsonb_array_length(rc.data->'conditions'->'lots') > 0
  );
```

### Tests nécessaires

1. Créer un nouveau DCE → Lots via Config Globale
2. Ouvrir un DCE existant → Migration automatique ?
3. Modifier les lots → Propagation vers RC et modules
4. Import/Export Excel → Données correctes
5. Vérifier tous les exports (Word, PDF) → Lots corrects

## 📅 Plan d'implémentation

### Phase 1 : Configuration Globale ✅ TERMINÉ
- [x] Intégrer modale de configuration
- [x] Intégrer import/export Excel
- [x] Tester l'interface

### Phase 2 : Règlement de Consultation 🔄 EN COURS
- [x] Passer les lots en prop
- [ ] Afficher en lecture seule
- [ ] Ajouter lien vers Config Globale
- [ ] Supprimer saisie manuelle
- [ ] Tester

### Phase 3 : Modules DCE 📋 À FAIRE
- [ ] Vérifier BPU, BPU TMA (déjà OK ?)
- [ ] Adapter DQE, DPGF
- [ ] Adapter Acte d'Engagement
- [ ] Adapter CCAP, CCTP
- [ ] Tester chaque module

### Phase 4 : Nettoyage 🗑️ À FAIRE
- [ ] Supprimer `useLotsFromRC`
- [ ] Supprimer `reglementConsultationService`
- [ ] Supprimer doc obsolète
- [ ] Mettre à jour documentation

### Phase 5 : Migration données 📊 À FAIRE
- [ ] Créer script de migration SQL
- [ ] Tester sur base de dev
- [ ] Exécuter en production
- [ ] Vérifier intégrité

### Phase 6 : Tests finaux ✅ À FAIRE
- [ ] Tests fonctionnels complets
- [ ] Tests de régression
- [ ] Validation utilisateur

---

**Statut** : 🔄 Phase 2 en cours  
**Date** : 31 janvier 2026  
**Responsable** : Assistant IA
