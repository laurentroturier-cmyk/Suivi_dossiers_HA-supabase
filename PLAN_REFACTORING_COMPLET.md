# 🚀 PLAN DE REFACTORING COMPLET - TOUS LES MODULES

**Date** : 2026-01-25  
**Objectif** : Application 100% clean et cohérente  
**Scope** : Réorganisation complète de 6 modules + correction de tous les imports + nettoyage

---

## 📊 RÉSUMÉ EXÉCUTIF

### Modules à réorganiser : 5 modules (an01 déjà fait ✅)
1. **redaction** - 31 fichiers à déplacer
2. **dce-complet** - 28 fichiers à réorganiser
3. **analyse** - 8 fichiers à réorganiser
4. **immobilier** - 6 fichiers à réorganiser
5. **auth** - 4 fichiers à réorganiser

### Fichiers impactés globalement : ~150 fichiers
- **Fichiers à déplacer** : ~77 fichiers
- **Fichiers avec imports à corriger** : ~50 fichiers
- **Fichiers orphelins à supprimer** : 1 fichier (`an01-utils/types.ts`)

### Estimation totale :
- **Déplacements** : 77 fichiers
- **Corrections d'imports** : ~200 imports
- **Créations** : 5 fichiers `index.tsx` (barrels)
- **Suppressions** : 1 fichier orphelin

---

## 📋 PHASE 1 - RÉORGANISATION COMPLÈTE DES MODULES

### MODULE 1 : redaction ⚠️ PRIORITÉ HAUTE

#### Structure actuelle :
```
components/redaction/
├── DCESection.tsx
├── MultiLotsDashboard.tsx
├── Noti1MultiModal.tsx
├── NOTI1Section.tsx
├── Noti3MultiModal.tsx
├── Noti3Section.tsx
├── Noti5MultiModal.tsx
├── NOTI5Section.tsx
├── NotificationsQuickAccess.tsx
├── NotiMultiAttributaires.tsx
├── RedactionPlaceholder.tsx
├── ReglementConsultation.tsx
├── questionnaire/
│   ├── QuestionnaireTechnique.tsx
│   ├── questionnaireTechniqueStorage.ts
│   └── types.ts
├── services/
│   ├── multiLotsAnalyzer.ts
│   ├── noti1AutoFill.ts
│   ├── noti1AutoFillFromMultipleSources.ts
│   ├── noti1AutoFillFromRapport.ts
│   ├── noti1EnrichFromRegistres.ts
│   ├── noti1Generator.ts
│   ├── noti1Storage.ts
│   ├── noti3Generator.ts
│   ├── noti5Generator.ts
│   ├── noti5Storage.ts
│   ├── procedureAutoFill.ts
│   ├── rapportCommissionGenerator.ts
│   ├── reglementConsultationGenerator.ts
│   └── reglementConsultationStorage.ts
└── types/
    ├── multiLots.ts
    ├── noti1.ts
    ├── noti3.ts
    ├── noti5.ts
    └── rapportCommission.ts
```

#### Structure cible :
```
components/redaction/
├── components/
│   ├── DCESection.tsx
│   ├── MultiLotsDashboard.tsx
│   ├── Noti1MultiModal.tsx
│   ├── NOTI1Section.tsx
│   ├── Noti3MultiModal.tsx
│   ├── Noti3Section.tsx
│   ├── Noti5MultiModal.tsx
│   ├── NOTI5Section.tsx
│   ├── NotificationsQuickAccess.tsx
│   ├── NotiMultiAttributaires.tsx
│   ├── RedactionPlaceholder.tsx
│   ├── ReglementConsultation.tsx
│   └── QuestionnaireTechnique.tsx
├── utils/
│   ├── multiLotsAnalyzer.ts
│   ├── noti1AutoFill.ts
│   ├── noti1AutoFillFromMultipleSources.ts
│   ├── noti1AutoFillFromRapport.ts
│   ├── noti1EnrichFromRegistres.ts
│   ├── noti1Generator.ts
│   ├── noti1Storage.ts
│   ├── noti3Generator.ts
│   ├── noti5Generator.ts
│   ├── noti5Storage.ts
│   ├── procedureAutoFill.ts
│   ├── rapportCommissionGenerator.ts
│   ├── reglementConsultationGenerator.ts
│   ├── reglementConsultationStorage.ts
│   └── questionnaireTechniqueStorage.ts
├── types/
│   ├── index.ts (barrel - réexporte tous les types)
│   ├── multiLots.ts
│   ├── noti1.ts
│   ├── noti3.ts
│   ├── noti5.ts
│   ├── rapportCommission.ts
│   └── questionnaire.ts (depuis questionnaire/types.ts)
└── index.tsx (barrel principal)
```

#### Fichiers à déplacer (31 fichiers) :
1. `DCESection.tsx` → `components/DCESection.tsx`
2. `MultiLotsDashboard.tsx` → `components/MultiLotsDashboard.tsx`
3. `Noti1MultiModal.tsx` → `components/Noti1MultiModal.tsx`
4. `NOTI1Section.tsx` → `components/NOTI1Section.tsx`
5. `Noti3MultiModal.tsx` → `components/Noti3MultiModal.tsx`
6. `Noti3Section.tsx` → `components/Noti3Section.tsx`
7. `Noti5MultiModal.tsx` → `components/Noti5MultiModal.tsx`
8. `NOTI5Section.tsx` → `components/NOTI5Section.tsx`
9. `NotificationsQuickAccess.tsx` → `components/NotificationsQuickAccess.tsx`
10. `NotiMultiAttributaires.tsx` → `components/NotiMultiAttributaires.tsx`
11. `RedactionPlaceholder.tsx` → `components/RedactionPlaceholder.tsx`
12. `ReglementConsultation.tsx` → `components/ReglementConsultation.tsx`
13. `questionnaire/QuestionnaireTechnique.tsx` → `components/QuestionnaireTechnique.tsx`
14. `questionnaire/questionnaireTechniqueStorage.ts` → `utils/questionnaireTechniqueStorage.ts`
15. `questionnaire/types.ts` → `types/questionnaire.ts`
16-29. Tous les fichiers de `services/` → `utils/` (14 fichiers)
30. Créer `types/index.ts` (barrel des types)
31. Créer `index.tsx` (barrel principal)

#### Imports internes à corriger dans redaction (~40 imports) :
- `./services/...` → `../utils/...`
- `./types/...` → `../types` (via barrel)
- `./questionnaire/...` → `../components/QuestionnaireTechnique` ou `../utils/questionnaireTechniqueStorage`
- `../../lib/supabase` → `../../../lib/supabase` (après déplacement)

#### Imports externes à corriger (9 fichiers) :
1. `App.tsx` (7 imports) :
   - `from './components/redaction/RedactionPlaceholder'` → `from './components/redaction'`
   - `from './components/redaction/DCESection'` → `from './components/redaction'`
   - `from './components/redaction/questionnaire/QuestionnaireTechnique'` → `from './components/redaction'`
   - `from './components/redaction/ReglementConsultation'` → `from './components/redaction'`
   - `from './components/redaction/NOTI1Section'` → `from './components/redaction'`
   - `from './components/redaction/NotificationsQuickAccess'` → `from './components/redaction'`
   - `from './components/redaction/NotiMultiAttributaires'` → `from './components/redaction'`

2. `components/analyse/RapportPresentation.tsx` (2 imports) :
   - `from '../redaction/NotificationsQuickAccess'` → `from '@/components/redaction'`
   - `from '../redaction/NotiMultiAttributaires'` → `from '@/components/redaction'`

3. `components/analyse/Noti1Modal.tsx` :
   - `from '../redaction/NOTI1Section'` → `from '@/components/redaction'`
   - `from '../redaction/types/noti1'` → `from '@/components/redaction'`

4. `components/analyse/Noti3Modal.tsx` :
   - `from '../redaction/Noti3Section'` → `from '@/components/redaction'`
   - `from '../redaction/types/noti3'` → `from '@/components/redaction'`

5. `components/analyse/Noti5Modal.tsx` :
   - `from '../redaction/NOTI5Section'` → `from '@/components/redaction'`

6. `components/dce-complet/DCEComplet.tsx` :
   - `from "../redaction/questionnaire/QuestionnaireTechnique"` → `from '@/components/redaction'`

7. `components/dce-complet/types/index.ts` :
   - `from '../../redaction/types/rapportCommission'` → `from '@/components/redaction'`

8. `components/dce-complet/services/procedureSyncService.ts` :
   - `from '../../redaction/types/rapportCommission'` → `from '@/components/redaction'`

9. `components/dce-complet/modules/*.tsx` (5 fichiers) :
   - Tous les `from '../../redaction/types/rapportCommission'` → `from '@/components/redaction'`
   - `from '../../redaction/ReglementConsultation'` → `from '@/components/redaction'`

---

### MODULE 2 : dce-complet

#### Structure actuelle :
```
components/dce-complet/
├── DCEComplet.tsx (à la racine)
├── hooks/
│   ├── useDCEState.ts
│   └── useProcedureLoader.ts
├── services/
│   ├── acteEngagementGenerator.ts
│   ├── dceMapping.ts
│   ├── dceService.ts
│   └── procedureSyncService.ts
├── shared/
│   ├── ConflictResolverModal.tsx
│   ├── DCEStatusBar.tsx
│   ├── GenericMultiLots.tsx
│   ├── LotSelector.tsx
│   ├── ProcedureDetailsModal.tsx
│   ├── ProcedureHeader.tsx
│   └── ProcedureSelector.tsx
├── modules/
│   ├── ActeEngagementEditor.tsx
│   ├── ActeEngagementForm.tsx
│   ├── ActeEngagementMultiLots.tsx
│   ├── BPUForm.tsx
│   ├── BPUMultiLots.tsx
│   ├── ccapExportPdf.ts
│   ├── ccapExportWord.ts
│   ├── CCAPForm.tsx
│   ├── CCAPMultiLots.tsx
│   ├── ccapTemplates.ts
│   ├── ccapWordParser.ts
│   ├── CCTPForm.tsx
│   ├── CCTPMultiLots.tsx
│   ├── ConfigurationGlobale.tsx
│   ├── CRTForm.tsx
│   ├── defaults.ts
│   ├── DocumentsAnnexesForm.tsx
│   ├── DPGFForm.tsx
│   ├── DPGFMultiLots.tsx
│   ├── DQEForm.tsx
│   ├── DQEMultiLots.tsx
│   ├── QTForm.tsx
│   ├── ReglementConsultationForm.tsx
│   └── ReglementConsultationLegacyWrapper.tsx
├── types/
│   ├── acteEngagement.ts
│   └── index.ts
└── index.ts (pas .tsx)
```

#### Structure cible :
```
components/dce-complet/
├── components/
│   ├── DCEComplet.tsx
│   ├── shared/
│   │   ├── ConflictResolverModal.tsx
│   │   ├── DCEStatusBar.tsx
│   │   ├── GenericMultiLots.tsx
│   │   ├── LotSelector.tsx
│   │   ├── ProcedureDetailsModal.tsx
│   │   ├── ProcedureHeader.tsx
│   │   └── ProcedureSelector.tsx
│   └── modules/
│       ├── ActeEngagementEditor.tsx
│       ├── ActeEngagementForm.tsx
│       ├── ActeEngagementMultiLots.tsx
│       ├── BPUForm.tsx
│       ├── BPUMultiLots.tsx
│       ├── CCAPForm.tsx
│       ├── CCAPMultiLots.tsx
│       ├── CCTPForm.tsx
│       ├── CCTPMultiLots.tsx
│       ├── ConfigurationGlobale.tsx
│       ├── CRTForm.tsx
│       ├── DocumentsAnnexesForm.tsx
│       ├── DPGFForm.tsx
│       ├── DPGFMultiLots.tsx
│       ├── DQEForm.tsx
│       ├── DQEMultiLots.tsx
│       ├── QTForm.tsx
│       ├── ReglementConsultationForm.tsx
│       └── ReglementConsultationLegacyWrapper.tsx
├── hooks/
│   ├── useDCEState.ts
│   └── useProcedureLoader.ts
├── utils/
│   ├── acteEngagementGenerator.ts
│   ├── ccapExportPdf.ts
│   ├── ccapExportWord.ts
│   ├── ccapTemplates.ts
│   ├── ccapWordParser.ts
│   ├── defaults.ts
│   ├── dceMapping.ts
│   ├── dceService.ts
│   └── procedureSyncService.ts
├── types/
│   ├── acteEngagement.ts
│   └── index.ts
└── index.tsx (renommer index.ts)
```

#### Fichiers à déplacer (28 fichiers) :
1. `DCEComplet.tsx` → `components/DCEComplet.tsx`
2-7. Tous les fichiers de `shared/` → `components/shared/` (6 fichiers)
8-23. Tous les `.tsx` de `modules/` → `components/modules/` (16 fichiers)
24-27. Fichiers utilitaires de `modules/` → `utils/` (4 fichiers : ccapExportPdf.ts, ccapExportWord.ts, ccapTemplates.ts, ccapWordParser.ts, defaults.ts)
28. `services/*.ts` → `utils/*.ts` (4 fichiers)
29. Renommer `index.ts` → `index.tsx`

#### Imports internes à corriger (~30 imports) :
- `./shared/...` → `../components/shared/...`
- `./modules/...` → `../components/modules/...`
- `./services/...` → `../utils/...`
- `./hooks/...` → `../hooks/...` (déjà OK)
- `./types/...` → `../types/...` (déjà OK)

#### Imports externes à corriger (1 fichier) :
1. `App.tsx` :
   - `from './components/dce-complet/DCEComplet'` → `from './components/dce-complet'`

---

### MODULE 3 : analyse

#### Structure actuelle :
```
components/analyse/
├── generateRapportData.ts (à la racine)
├── Noti1Modal.tsx
├── Noti3Modal.tsx
├── Noti5Modal.tsx
├── OuverturePlis.tsx
├── RapportPresentation.tsx
├── RecevabiliteOffres.tsx
└── types.ts (à la racine)
```

#### Structure cible :
```
components/analyse/
├── components/
│   ├── Noti1Modal.tsx
│   ├── Noti3Modal.tsx
│   ├── Noti5Modal.tsx
│   ├── OuverturePlis.tsx
│   ├── RapportPresentation.tsx
│   └── RecevabiliteOffres.tsx
├── utils/
│   └── generateRapportData.ts
├── types/
│   └── index.ts (depuis types.ts)
└── index.tsx (barrel principal)
```

#### Fichiers à déplacer (8 fichiers) :
1-6. Tous les `.tsx` → `components/` (6 fichiers)
7. `generateRapportData.ts` → `utils/generateRapportData.ts`
8. `types.ts` → `types/index.ts`
9. Créer `index.tsx` (barrel principal)

#### Imports internes à corriger (~10 imports) :
- `./types` → `../types` (via barrel)
- `./generateRapportData` → `../utils/generateRapportData`

#### Imports externes à corriger (2 fichiers) :
1. `App.tsx` :
   - `from './components/analyse/OuverturePlis'` → `from './components/analyse'`
   - `from './components/analyse/RapportPresentation'` → `from './components/analyse'`

2. `components/analyse/components/RapportPresentation.tsx` :
   - `from './generateRapportData'` → `from '../utils/generateRapportData'`
   - `from './types'` → `from '../types'`

---

### MODULE 4 : immobilier

#### Structure actuelle :
```
components/immobilier/
├── ImmobilierCharts.tsx
├── ImmobilierDashboard.tsx
├── ImmobilierDetailModal.tsx
├── ImmobilierTable.tsx
├── ImmobilierTableFilters.tsx
└── index.ts (pas .tsx)

types/immobilier.ts (à la racine du projet)
```

#### Structure cible :
```
components/immobilier/
├── components/
│   ├── ImmobilierCharts.tsx
│   ├── ImmobilierDashboard.tsx
│   ├── ImmobilierDetailModal.tsx
│   ├── ImmobilierTable.tsx
│   └── ImmobilierTableFilters.tsx
├── types/
│   └── index.ts (depuis types/immobilier.ts)
└── index.tsx (renommer index.ts)
```

#### Fichiers à déplacer (6 fichiers) :
1-5. Tous les `.tsx` → `components/` (5 fichiers)
6. `types/immobilier.ts` → `components/immobilier/types/index.ts`
7. Renommer `index.ts` → `index.tsx`

#### Imports internes à corriger (~5 imports) :
- Aucun import interne détecté (composants indépendants)

#### Imports externes à corriger (2 fichiers) :
1. `App.tsx` :
   - `from './pages/ImmobilierPage'` → Pas de changement (déjà dans pages/)

2. `pages/ImmobilierPage.tsx` :
   - `from '@/components/immobilier'` → Déjà OK si index.tsx exporte correctement

---

### MODULE 5 : auth

#### Structure actuelle :
```
components/auth/
├── AccessRequestForm.tsx
├── AdminDashboard.tsx
├── DataImport.tsx
└── Login.tsx

types/auth.ts (à la racine du projet)
```

#### Structure cible :
```
components/auth/
├── components/
│   ├── AccessRequestForm.tsx
│   ├── AdminDashboard.tsx
│   ├── DataImport.tsx
│   └── Login.tsx
├── types/
│   └── index.ts (depuis types/auth.ts)
└── index.tsx (barrel principal)
```

#### Fichiers à déplacer (4 fichiers) :
1-4. Tous les `.tsx` → `components/` (4 fichiers)
5. `types/auth.ts` → `components/auth/types/index.ts`
6. Créer `index.tsx` (barrel principal)

#### Imports internes à corriger (~2 imports) :
- Aucun import interne détecté (composants indépendants)

#### Imports externes à corriger (3 fichiers) :
1. `App.tsx` (2 imports) :
   - `from './components/auth/Login'` → `from './components/auth'`
   - `from './components/auth/AdminDashboard'` → `from './components/auth'`

2. `App.tsx` (1 import de type) :
   - `from './types/auth'` → `from './components/auth'` (ou garder depuis types/ pour compatibilité)

3. `pages/AdminPage.tsx` (si existe) :
   - Vérifier les imports

---

## 📋 PHASE 2 - CORRECTION AUTOMATIQUE DES IMPORTS

### Fichiers avec imports à corriger : ~50 fichiers

#### App.tsx (9 imports) :
```typescript
// AVANT
import RedactionPlaceholder from './components/redaction/RedactionPlaceholder';
import DCESection from './components/redaction/DCESection';
import QuestionnaireTechnique from './components/redaction/questionnaire/QuestionnaireTechnique';
import ReglementConsultation from './components/redaction/ReglementConsultation';
import NOTI1Section from './components/redaction/NOTI1Section';
import NotificationsQuickAccess from './components/redaction/NotificationsQuickAccess';
import NotiMultiAttributaires from './components/redaction/NotiMultiAttributaires';
import { DCEComplet } from './components/dce-complet/DCEComplet';
import Login from './components/auth/Login';
import AdminDashboard from './components/auth/AdminDashboard';
import OuverturePlis from './components/analyse/OuverturePlis';
import RapportPresentation from './components/analyse/RapportPresentation';

// APRÈS
import { 
  RedactionPlaceholder,
  DCESection,
  QuestionnaireTechnique,
  ReglementConsultation,
  NOTI1Section,
  NotificationsQuickAccess,
  NotiMultiAttributaires
} from './components/redaction';
import { DCEComplet } from './components/dce-complet';
import { Login, AdminDashboard } from './components/auth';
import { OuverturePlis, RapportPresentation } from './components/analyse';
```

#### components/analyse/*.tsx (6 fichiers) :
- `RapportPresentation.tsx` : 2 imports vers redaction
- `Noti1Modal.tsx` : 2 imports vers redaction
- `Noti3Modal.tsx` : 2 imports vers redaction
- `Noti5Modal.tsx` : 1 import vers redaction
- `RapportPresentation.tsx` : 1 import interne (generateRapportData)

#### components/dce-complet/*.tsx (9 fichiers) :
- `DCEComplet.tsx` : 1 import vers redaction
- `types/index.ts` : 1 import vers redaction
- `services/procedureSyncService.ts` : 1 import vers redaction
- `modules/*.tsx` : 5 imports vers redaction

#### Autres fichiers (~30 fichiers) :
- Tous les fichiers internes des modules réorganisés
- Imports relatifs à mettre à jour après déplacement

---

## 📋 PHASE 3 - NETTOYAGE

### Fichiers orphelins à supprimer :
1. ✅ `an01-utils/types.ts` - Fichier orphelin (types déjà dans an01/types/index.ts)

### Dossiers à supprimer (après vérification) :
1. `an01-utils/` - Dossier vide après suppression de types.ts

### Imports inutilisés à détecter :
- À analyser après réorganisation complète
- Utiliser ESLint ou TypeScript pour détecter automatiquement

### Variables/fonctions inutilisées :
- À analyser après réorganisation complète

---

## 📋 PHASE 4 - CRÉATION DES BARRELS (index.tsx)

### 1. components/redaction/index.tsx
```typescript
// Composants
export { default as DCESection } from './components/DCESection';
export { default as MultiLotsDashboard } from './components/MultiLotsDashboard';
export { default as Noti1MultiModal } from './components/Noti1MultiModal';
export { default as NOTI1Section } from './components/NOTI1Section';
export { default as Noti3MultiModal } from './components/Noti3MultiModal';
export { default as Noti3Section } from './components/Noti3Section';
export { default as Noti5MultiModal } from './components/Noti5MultiModal';
export { default as NOTI5Section } from './components/NOTI5Section';
export { default as NotificationsQuickAccess } from './components/NotificationsQuickAccess';
export { default as NotiMultiAttributaires } from './components/NotiMultiAttributaires';
export { default as RedactionPlaceholder } from './components/RedactionPlaceholder';
export { default as ReglementConsultation } from './components/ReglementConsultation';
export { default as QuestionnaireTechnique } from './components/QuestionnaireTechnique';

// Types
export * from './types';

// Utilitaires (optionnel - si besoin d'exporter)
// export * from './utils';
```

### 2. components/dce-complet/index.tsx
```typescript
// Renommer index.ts en index.tsx et ajouter :
export { DCEComplet } from './components/DCEComplet';
export * from './types';
export * from './hooks';
export * from './utils';
export * from './components/shared';
export * from './components/modules';
```

### 3. components/analyse/index.tsx
```typescript
// Composants
export { default as Noti1Modal } from './components/Noti1Modal';
export { default as Noti3Modal } from './components/Noti3Modal';
export { default as Noti5Modal } from './components/Noti5Modal';
export { default as OuverturePlis } from './components/OuverturePlis';
export { default as RapportPresentation } from './components/RapportPresentation';
export { default as RecevabiliteOffres } from './components/RecevabiliteOffres';

// Types
export * from './types';

// Utilitaires
export { generateRapportData } from './utils/generateRapportData';
```

### 4. components/immobilier/index.tsx
```typescript
// Renommer index.ts en index.tsx et ajouter :
export { default as ImmobilierDashboard } from './components/ImmobilierDashboard';
export { default as ImmobilierTable } from './components/ImmobilierTable';
export { default as ImmobilierTableFilters } from './components/ImmobilierTableFilters';
export { default as ImmobilierDetailModal } from './components/ImmobilierDetailModal';
export { default as ImmobilierCharts } from './components/ImmobilierCharts';

// Types
export * from './types';
```

### 5. components/auth/index.tsx
```typescript
// Composants
export { default as AccessRequestForm } from './components/AccessRequestForm';
export { default as AdminDashboard } from './components/AdminDashboard';
export { default as DataImport } from './components/DataImport';
export { default as Login } from './components/Login';

// Types
export * from './types';
```

---

## 📊 STATISTIQUES GLOBALES

### Fichiers à déplacer :
- **redaction** : 31 fichiers
- **dce-complet** : 28 fichiers
- **analyse** : 8 fichiers
- **immobilier** : 6 fichiers
- **auth** : 4 fichiers
- **TOTAL** : 77 fichiers

### Fichiers à créer :
- **Barrels index.tsx** : 5 fichiers
- **Barrels types/index.ts** : 2 fichiers (redaction, analyse)
- **TOTAL** : 7 fichiers

### Fichiers à supprimer :
- **Orphelins** : 1 fichier (`an01-utils/types.ts`)
- **Dossiers vides** : 1 dossier (`an01-utils/`)

### Imports à corriger :
- **App.tsx** : 9 imports
- **Fichiers internes modules** : ~150 imports
- **Fichiers externes** : ~40 imports
- **TOTAL** : ~200 imports

---

## 🎯 ORDRE D'EXÉCUTION RECOMMANDÉ

### Étape 1 : redaction (priorité haute)
1. Créer structure `components/`, `utils/`, `types/index.ts`
2. Déplacer tous les fichiers
3. Corriger imports internes
4. Créer `index.tsx`
5. Corriger imports externes

### Étape 2 : dce-complet
1. Créer structure `components/`, `utils/`
2. Déplacer tous les fichiers
3. Corriger imports internes
4. Renommer `index.ts` → `index.tsx`
5. Corriger imports externes

### Étape 3 : analyse
1. Créer structure `components/`, `utils/`, `types/`
2. Déplacer tous les fichiers
3. Corriger imports internes
4. Créer `index.tsx`
5. Corriger imports externes

### Étape 4 : immobilier
1. Créer structure `components/`, `types/`
2. Déplacer tous les fichiers
3. Déplacer `types/immobilier.ts`
4. Renommer `index.ts` → `index.tsx`
5. Corriger imports externes

### Étape 5 : auth
1. Créer structure `components/`, `types/`
2. Déplacer tous les fichiers
3. Déplacer `types/auth.ts`
4. Créer `index.tsx`
5. Corriger imports externes

### Étape 6 : Nettoyage final
1. Supprimer `an01-utils/types.ts`
2. Supprimer dossier `an01-utils/` (si vide)
3. Détecter et supprimer imports inutilisés
4. Détecter et supprimer variables/fonctions inutilisées

---

## ✅ VALIDATION FINALE

### Checklist de validation :
- [ ] Tous les modules suivent la structure standard
- [ ] Tous les `index.tsx` exportent correctement
- [ ] Tous les imports externes utilisent les barrels
- [ ] Aucun import cassé
- [ ] Application compile sans erreurs TypeScript
- [ ] Aucun warning TypeScript critique
- [ ] Fichiers orphelins supprimés
- [ ] Imports inutilisés supprimés

---

## 📝 NOTES IMPORTANTES

1. **Ordre d'exécution** : Traiter les modules dans l'ordre pour éviter les dépendances croisées
2. **Tests après chaque module** : Valider que l'application compile après chaque module
3. **Backup** : Considérer un commit git avant chaque phase
4. **Imports relatifs** : Certains imports relatifs dans les composants déplacés devront être ajustés
5. **Types globaux** : Les types dans `types/` à la racine peuvent rester pour compatibilité, mais les modules doivent avoir leurs propres types

---

**Prêt pour validation et exécution** ✅
