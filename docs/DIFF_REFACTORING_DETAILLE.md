# 🔍 DIFF DÉTAILLÉ - REFACTORING COMPLET

**Date** : 2026-01-25  
**Document** : Diff complet de toutes les modifications prévues

---

## 📋 MODULE 1 : redaction

### FICHIERS À DÉPLACER (31 fichiers)

#### Composants → components/ (13 fichiers)
```
components/redaction/DCESection.tsx
  → components/redaction/components/DCESection.tsx

components/redaction/MultiLotsDashboard.tsx
  → components/redaction/components/MultiLotsDashboard.tsx

components/redaction/Noti1MultiModal.tsx
  → components/redaction/components/Noti1MultiModal.tsx

components/redaction/NOTI1Section.tsx
  → components/redaction/components/NOTI1Section.tsx

components/redaction/Noti3MultiModal.tsx
  → components/redaction/components/Noti3MultiModal.tsx

components/redaction/Noti3Section.tsx
  → components/redaction/components/Noti3Section.tsx

components/redaction/Noti5MultiModal.tsx
  → components/redaction/components/Noti5MultiModal.tsx

components/redaction/NOTI5Section.tsx
  → components/redaction/components/NOTI5Section.tsx

components/redaction/NotificationsQuickAccess.tsx
  → components/redaction/components/NotificationsQuickAccess.tsx

components/redaction/NotiMultiAttributaires.tsx
  → components/redaction/components/NotiMultiAttributaires.tsx

components/redaction/RedactionPlaceholder.tsx
  → components/redaction/components/RedactionPlaceholder.tsx

components/redaction/ReglementConsultation.tsx
  → components/redaction/components/ReglementConsultation.tsx

components/redaction/questionnaire/QuestionnaireTechnique.tsx
  → components/redaction/components/QuestionnaireTechnique.tsx
```

#### Services → utils/ (15 fichiers)
```
components/redaction/services/multiLotsAnalyzer.ts
  → components/redaction/utils/multiLotsAnalyzer.ts

components/redaction/services/noti1AutoFill.ts
  → components/redaction/utils/noti1AutoFill.ts

components/redaction/services/noti1AutoFillFromMultipleSources.ts
  → components/redaction/utils/noti1AutoFillFromMultipleSources.ts

components/redaction/services/noti1AutoFillFromRapport.ts
  → components/redaction/utils/noti1AutoFillFromRapport.ts

components/redaction/services/noti1EnrichFromRegistres.ts
  → components/redaction/utils/noti1EnrichFromRegistres.ts

components/redaction/services/noti1Generator.ts
  → components/redaction/utils/noti1Generator.ts

components/redaction/services/noti1Storage.ts
  → components/redaction/utils/noti1Storage.ts

components/redaction/services/noti3Generator.ts
  → components/redaction/utils/noti3Generator.ts

components/redaction/services/noti5Generator.ts
  → components/redaction/utils/noti5Generator.ts

components/redaction/services/noti5Storage.ts
  → components/redaction/utils/noti5Storage.ts

components/redaction/services/procedureAutoFill.ts
  → components/redaction/utils/procedureAutoFill.ts

components/redaction/services/rapportCommissionGenerator.ts
  → components/redaction/utils/rapportCommissionGenerator.ts

components/redaction/services/reglementConsultationGenerator.ts
  → components/redaction/utils/reglementConsultationGenerator.ts

components/redaction/services/reglementConsultationStorage.ts
  → components/redaction/utils/reglementConsultationStorage.ts

components/redaction/questionnaire/questionnaireTechniqueStorage.ts
  → components/redaction/utils/questionnaireTechniqueStorage.ts
```

#### Types → types/ (1 fichier)
```
components/redaction/questionnaire/types.ts
  → components/redaction/types/questionnaire.ts
```

#### Fichiers à créer (2 fichiers)
```
components/redaction/types/index.ts (NOUVEAU - barrel des types)
components/redaction/index.tsx (NOUVEAU - barrel principal)
```

### IMPORTS À CORRIGER DANS redaction

#### ReglementConsultation.tsx
```typescript
// AVANT
import { generateReglementConsultationWord } from './services/reglementConsultationGenerator';
import { autoFillRCFromProcedure } from './services/procedureAutoFill';
import type { RapportCommissionData } from './types/rapportCommission';
import { supabase } from '../../lib/supabase';

// APRÈS
import { generateReglementConsultationWord } from '../utils/reglementConsultationGenerator';
import { autoFillRCFromProcedure } from '../utils/procedureAutoFill';
import type { RapportCommissionData } from '../types';
import { supabase } from '../../../lib/supabase';
```

#### QuestionnaireTechnique.tsx
```typescript
// AVANT
import { Critere, SousCritere, Question, QuestionnaireState, Procedure } from './types';
import { saveQuestionnaireTechnique, loadQuestionnaireTechnique, loadExistingQT } from './questionnaireTechniqueStorage';
import { supabase } from '@/lib/supabase';

// APRÈS
import { Critere, SousCritere, Question, QuestionnaireState, Procedure } from '../types';
import { saveQuestionnaireTechnique, loadQuestionnaireTechnique, loadExistingQT } from '../utils/questionnaireTechniqueStorage';
import { supabase } from '@/lib/supabase'; // Pas de changement (alias @/)
```

#### Tous les fichiers dans services/ → utils/
```typescript
// AVANT (dans chaque fichier utils/)
import type { Noti1Data } from '../types/noti1';
import { supabase } from '../../../lib/supabase';

// APRÈS
import type { Noti1Data } from '../types'; // Via barrel
import { supabase } from '../../../lib/supabase'; // Ajuster selon niveau
```

### IMPORTS EXTERNES À CORRIGER

#### App.tsx (7 imports)
```typescript
// AVANT
import RedactionPlaceholder from './components/redaction/RedactionPlaceholder';
import DCESection from './components/redaction/DCESection';
import QuestionnaireTechnique from './components/redaction/questionnaire/QuestionnaireTechnique';
import ReglementConsultation from './components/redaction/ReglementConsultation';
import NOTI1Section from './components/redaction/NOTI1Section';
import NotificationsQuickAccess from './components/redaction/NotificationsQuickAccess';
import NotiMultiAttributaires from './components/redaction/NotiMultiAttributaires';

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
```

#### components/analyse/RapportPresentation.tsx (2 imports)
```typescript
// AVANT
import NotificationsQuickAccess from '../redaction/NotificationsQuickAccess';
import NotiMultiAttributaires from '../redaction/NotiMultiAttributaires';

// APRÈS
import { NotificationsQuickAccess, NotiMultiAttributaires } from '@/components/redaction';
```

#### components/analyse/Noti1Modal.tsx (2 imports)
```typescript
// AVANT
import NOTI1Section from '../redaction/NOTI1Section';
import type { Noti1Data } from '../redaction/types/noti1';

// APRÈS
import { NOTI1Section, type Noti1Data } from '@/components/redaction';
```

#### components/analyse/Noti3Modal.tsx (2 imports)
```typescript
// AVANT
import Noti3Section from '../redaction/Noti3Section';
import type { Noti3Data } from '../redaction/types/noti3';

// APRÈS
import { Noti3Section, type Noti3Data } from '@/components/redaction';
```

#### components/analyse/Noti5Modal.tsx (1 import)
```typescript
// AVANT
import NOTI5Section from '../redaction/NOTI5Section';

// APRÈS
import { NOTI5Section } from '@/components/redaction';
```

#### components/dce-complet/DCEComplet.tsx (1 import)
```typescript
// AVANT
import QuestionnaireTechnique from "../redaction/questionnaire/QuestionnaireTechnique";

// APRÈS
import { QuestionnaireTechnique } from '@/components/redaction';
```

#### components/dce-complet/types/index.ts (1 import)
```typescript
// AVANT
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// APRÈS
import type { RapportCommissionData } from '@/components/redaction';
```

#### components/dce-complet/services/procedureSyncService.ts (1 import)
```typescript
// AVANT
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// APRÈS
import type { RapportCommissionData } from '@/components/redaction';
```

#### components/dce-complet/modules/*.tsx (5 fichiers - 6 imports)
```typescript
// AVANT (dans chaque fichier)
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';
import ReglementConsultation from '../../redaction/ReglementConsultation';

// APRÈS
import type { RapportCommissionData, ReglementConsultation } from '@/components/redaction';
```

---

## 📋 MODULE 2 : dce-complet

### FICHIERS À DÉPLACER (28 fichiers)

#### Composant principal
```
components/dce-complet/DCEComplet.tsx
  → components/dce-complet/components/DCEComplet.tsx
```

#### Shared → components/shared/ (6 fichiers)
```
components/dce-complet/shared/ConflictResolverModal.tsx
  → components/dce-complet/components/shared/ConflictResolverModal.tsx

components/dce-complet/shared/DCEStatusBar.tsx
  → components/dce-complet/components/shared/DCEStatusBar.tsx

components/dce-complet/shared/GenericMultiLots.tsx
  → components/dce-complet/components/shared/GenericMultiLots.tsx

components/dce-complet/shared/LotSelector.tsx
  → components/dce-complet/components/shared/LotSelector.tsx

components/dce-complet/shared/ProcedureDetailsModal.tsx
  → components/dce-complet/components/shared/ProcedureDetailsModal.tsx

components/dce-complet/shared/ProcedureHeader.tsx
  → components/dce-complet/components/shared/ProcedureHeader.tsx

components/dce-complet/shared/ProcedureSelector.tsx
  → components/dce-complet/components/shared/ProcedureSelector.tsx
```

#### Modules → components/modules/ (16 fichiers .tsx)
```
components/dce-complet/modules/ActeEngagementEditor.tsx
  → components/dce-complet/components/modules/ActeEngagementEditor.tsx

components/dce-complet/modules/ActeEngagementForm.tsx
  → components/dce-complet/components/modules/ActeEngagementForm.tsx

components/dce-complet/modules/ActeEngagementMultiLots.tsx
  → components/dce-complet/components/modules/ActeEngagementMultiLots.tsx

components/dce-complet/modules/BPUForm.tsx
  → components/dce-complet/components/modules/BPUForm.tsx

components/dce-complet/modules/BPUMultiLots.tsx
  → components/dce-complet/components/modules/BPUMultiLots.tsx

components/dce-complet/modules/CCAPForm.tsx
  → components/dce-complet/components/modules/CCAPForm.tsx

components/dce-complet/modules/CCAPMultiLots.tsx
  → components/dce-complet/components/modules/CCAPMultiLots.tsx

components/dce-complet/modules/CCTPForm.tsx
  → components/dce-complet/components/modules/CCTPForm.tsx

components/dce-complet/modules/CCTPMultiLots.tsx
  → components/dce-complet/components/modules/CCTPMultiLots.tsx

components/dce-complet/modules/ConfigurationGlobale.tsx
  → components/dce-complet/components/modules/ConfigurationGlobale.tsx

components/dce-complet/modules/CRTForm.tsx
  → components/dce-complet/components/modules/CRTForm.tsx

components/dce-complet/modules/DocumentsAnnexesForm.tsx
  → components/dce-complet/components/modules/DocumentsAnnexesForm.tsx

components/dce-complet/modules/DPGFForm.tsx
  → components/dce-complet/components/modules/DPGFForm.tsx

components/dce-complet/modules/DPGFMultiLots.tsx
  → components/dce-complet/components/modules/DPGFMultiLots.tsx

components/dce-complet/modules/DQEForm.tsx
  → components/dce-complet/components/modules/DQEForm.tsx

components/dce-complet/modules/DQEMultiLots.tsx
  → components/dce-complet/components/modules/DQEMultiLots.tsx

components/dce-complet/modules/QTForm.tsx
  → components/dce-complet/components/modules/QTForm.tsx

components/dce-complet/modules/ReglementConsultationForm.tsx
  → components/dce-complet/components/modules/ReglementConsultationForm.tsx

components/dce-complet/modules/ReglementConsultationLegacyWrapper.tsx
  → components/dce-complet/components/modules/ReglementConsultationLegacyWrapper.tsx
```

#### Utilitaires modules → utils/ (5 fichiers .ts)
```
components/dce-complet/modules/ccapExportPdf.ts
  → components/dce-complet/utils/ccapExportPdf.ts

components/dce-complet/modules/ccapExportWord.ts
  → components/dce-complet/utils/ccapExportWord.ts

components/dce-complet/modules/ccapTemplates.ts
  → components/dce-complet/utils/ccapTemplates.ts

components/dce-complet/modules/ccapWordParser.ts
  → components/dce-complet/utils/ccapWordParser.ts

components/dce-complet/modules/defaults.ts
  → components/dce-complet/utils/defaults.ts
```

#### Services → utils/ (4 fichiers)
```
components/dce-complet/services/acteEngagementGenerator.ts
  → components/dce-complet/utils/acteEngagementGenerator.ts

components/dce-complet/services/dceMapping.ts
  → components/dce-complet/utils/dceMapping.ts

components/dce-complet/services/dceService.ts
  → components/dce-complet/utils/dceService.ts

components/dce-complet/services/procedureSyncService.ts
  → components/dce-complet/utils/procedureSyncService.ts
```

#### Renommage
```
components/dce-complet/index.ts
  → components/dce-complet/index.tsx (renommer)
```

### IMPORTS À CORRIGER DANS dce-complet

#### DCEComplet.tsx
```typescript
// AVANT
import { ProcedureSelector } from './shared/ProcedureSelector';
import { ProcedureHeader } from './shared/ProcedureHeader';
import { DCEStatusBar } from './shared/DCEStatusBar';
import { ConflictResolverModal } from './shared/ConflictResolverModal';
import { useDCEState } from './hooks/useDCEState';
import { useProcedure } from './hooks/useProcedureLoader';
import type { DCESectionType } from './types';
import { ConfigurationGlobaleForm } from './modules/ConfigurationGlobale';
import { ReglementConsultationLegacyWrapper } from './modules/ReglementConsultationLegacyWrapper';
import QuestionnaireTechnique from "../redaction/questionnaire/QuestionnaireTechnique";
import {
  ensureActeEngagement,
  ensureBPU,
  ensureCCAP,
  ensureCCTP,
  ensureDPGF,
  ensureDQE,
  ensureDocumentsAnnexes,
  ensureCRT,
  ensureReglementConsultation,
} from './modules/defaults';

// APRÈS
import { ProcedureSelector } from './components/shared/ProcedureSelector';
import { ProcedureHeader } from './components/shared/ProcedureHeader';
import { DCEStatusBar } from './components/shared/DCEStatusBar';
import { ConflictResolverModal } from './components/shared/ConflictResolverModal';
import { useDCEState } from './hooks/useDCEState';
import { useProcedure } from './hooks/useProcedureLoader';
import type { DCESectionType } from './types';
import { ConfigurationGlobaleForm } from './components/modules/ConfigurationGlobale';
import { ReglementConsultationLegacyWrapper } from './components/modules/ReglementConsultationLegacyWrapper';
import { QuestionnaireTechnique } from '@/components/redaction';
import {
  ensureActeEngagement,
  ensureBPU,
  ensureCCAP,
  ensureCCTP,
  ensureDPGF,
  ensureDQE,
  ensureDocumentsAnnexes,
  ensureCRT,
  ensureReglementConsultation,
} from './utils/defaults';
```

#### Tous les fichiers dans modules/ → components/modules/
```typescript
// AVANT
import { ProcedureSelector } from '../shared/ProcedureSelector';
import { defaults } from './defaults';
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// APRÈS
import { ProcedureSelector } from '../shared/ProcedureSelector';
import { defaults } from '../../utils/defaults';
import type { RapportCommissionData } from '@/components/redaction';
```

### IMPORTS EXTERNES À CORRIGER

#### App.tsx (1 import)
```typescript
// AVANT
import { DCEComplet } from './components/dce-complet/DCEComplet';

// APRÈS
import { DCEComplet } from './components/dce-complet';
```

---

## 📋 MODULE 3 : analyse

### FICHIERS À DÉPLACER (8 fichiers)

#### Composants → components/ (6 fichiers)
```
components/analyse/Noti1Modal.tsx
  → components/analyse/components/Noti1Modal.tsx

components/analyse/Noti3Modal.tsx
  → components/analyse/components/Noti3Modal.tsx

components/analyse/Noti5Modal.tsx
  → components/analyse/components/Noti5Modal.tsx

components/analyse/OuverturePlis.tsx
  → components/analyse/components/OuverturePlis.tsx

components/analyse/RapportPresentation.tsx
  → components/analyse/components/RapportPresentation.tsx

components/analyse/RecevabiliteOffres.tsx
  → components/analyse/components/RecevabiliteOffres.tsx
```

#### Utilitaires → utils/ (1 fichier)
```
components/analyse/generateRapportData.ts
  → components/analyse/utils/generateRapportData.ts
```

#### Types → types/ (1 fichier)
```
components/analyse/types.ts
  → components/analyse/types/index.ts
```

#### Fichiers à créer (1 fichier)
```
components/analyse/index.tsx (NOUVEAU - barrel principal)
```

### IMPORTS À CORRIGER DANS analyse

#### RapportPresentation.tsx
```typescript
// AVANT
import { RapportContent, RapportState } from './types';
import { generateRapportData } from './generateRapportData';
import NotificationsQuickAccess from '../redaction/NotificationsQuickAccess';
import NotiMultiAttributaires from '../redaction/NotiMultiAttributaires';

// APRÈS
import { RapportContent, RapportState } from '../types';
import { generateRapportData } from '../utils/generateRapportData';
import { NotificationsQuickAccess, NotiMultiAttributaires } from '@/components/redaction';
```

#### Noti1Modal.tsx
```typescript
// AVANT
import NOTI1Section from '../redaction/NOTI1Section';
import type { Noti1Data } from '../redaction/types/noti1';

// APRÈS
import { NOTI1Section, type Noti1Data } from '@/components/redaction';
```

#### Noti3Modal.tsx
```typescript
// AVANT
import Noti3Section from '../redaction/Noti3Section';
import type { Noti3Data } from '../redaction/types/noti3';

// APRÈS
import { Noti3Section, type Noti3Data } from '@/components/redaction';
```

#### Noti5Modal.tsx
```typescript
// AVANT
import NOTI5Section from '../redaction/NOTI5Section';

// APRÈS
import { NOTI5Section } from '@/components/redaction';
```

### IMPORTS EXTERNES À CORRIGER

#### App.tsx (2 imports)
```typescript
// AVANT
import OuverturePlis from './components/analyse/OuverturePlis';
import RapportPresentation from './components/analyse/RapportPresentation';

// APRÈS
import { OuverturePlis, RapportPresentation } from './components/analyse';
```

---

## 📋 MODULE 4 : immobilier

### FICHIERS À DÉPLACER (6 fichiers)

#### Composants → components/ (5 fichiers)
```
components/immobilier/ImmobilierCharts.tsx
  → components/immobilier/components/ImmobilierCharts.tsx

components/immobilier/ImmobilierDashboard.tsx
  → components/immobilier/components/ImmobilierDashboard.tsx

components/immobilier/ImmobilierDetailModal.tsx
  → components/immobilier/components/ImmobilierDetailModal.tsx

components/immobilier/ImmobilierTable.tsx
  → components/immobilier/components/ImmobilierTable.tsx

components/immobilier/ImmobilierTableFilters.tsx
  → components/immobilier/components/ImmobilierTableFilters.tsx
```

#### Types (1 fichier)
```
types/immobilier.ts
  → components/immobilier/types/index.ts
```

#### Renommage
```
components/immobilier/index.ts
  → components/immobilier/index.tsx (renommer)
```

### IMPORTS EXTERNES À CORRIGER

#### pages/ImmobilierPage.tsx (déjà OK si index.tsx exporte correctement)
```typescript
// DÉJÀ OK
import { ImmobilierDashboard, ImmobilierTable, ImmobilierTableFilters, ImmobilierDetailModal, ImmobilierCharts } from '@/components/immobilier';
```

---

## 📋 MODULE 5 : auth

### FICHIERS À DÉPLACER (4 fichiers)

#### Composants → components/ (4 fichiers)
```
components/auth/AccessRequestForm.tsx
  → components/auth/components/AccessRequestForm.tsx

components/auth/AdminDashboard.tsx
  → components/auth/components/AdminDashboard.tsx

components/auth/DataImport.tsx
  → components/auth/components/DataImport.tsx

components/auth/Login.tsx
  → components/auth/components/Login.tsx
```

#### Types (1 fichier)
```
types/auth.ts
  → components/auth/types/index.ts
```

#### Fichiers à créer (1 fichier)
```
components/auth/index.tsx (NOUVEAU - barrel principal)
```

### IMPORTS EXTERNES À CORRIGER

#### App.tsx (2 imports)
```typescript
// AVANT
import Login from './components/auth/Login';
import AdminDashboard from './components/auth/AdminDashboard';
import { AuthState } from './types/auth';

// APRÈS
import { Login, AdminDashboard, type AuthState } from './components/auth';
// OU garder types/auth pour compatibilité :
import { Login, AdminDashboard } from './components/auth';
import { AuthState } from './types/auth'; // Optionnel - pour compatibilité
```

---

## 🗑️ NETTOYAGE

### Fichiers à supprimer
```
an01-utils/types.ts (ORPHELIN - types déjà dans an01/types/index.ts)
```

### Dossiers à supprimer (si vide après)
```
an01-utils/ (si vide après suppression de types.ts)
```

---

## 📊 RÉSUMÉ DES MODIFICATIONS

### Total fichiers à déplacer : 77
- redaction : 31
- dce-complet : 28
- analyse : 8
- immobilier : 6
- auth : 4

### Total fichiers à créer : 7
- Barrels index.tsx : 5
- Barrels types/index.ts : 2

### Total fichiers à supprimer : 1
- an01-utils/types.ts

### Total imports à corriger : ~200
- App.tsx : 9
- Fichiers internes : ~150
- Fichiers externes : ~40

---

**Prêt pour validation et exécution** ✅
