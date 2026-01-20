# 📋 ANALYSE DE L'ARCHITECTURE DCE - Propositions d'Amélioration

## 1. 📊 ÉTAT ACTUEL DE L'APPLICATION

### 1.1 Structures de Données Existantes

#### **Base Supabase (supabase-setup.sql)**
```
Tables disponibles :
├── public.profiles          (Utilisateurs + Rôles)
├── public.mes_donnees       (Données de démonstration)
└── public.access_requests   (Demandes d'accès)

⚠️ Tables DE RÉDACTION découvertes (non dans supabase-setup.sql) :
├── procédures              (ProjectData - données d'entrée)
├── reglements_consultation (Règlements de consultation)
├── noti1                   (Notifications NOTI1)
└── noti5                   (Notifications NOTI5)
```

#### **Données Sources (TypeScript)**
```
ProjectData (types.ts)
├── IDProjet
├── NumProc (N° 5 chiffres - clé de liaison)
├── Acheteur
├── Nom de la procédure
├── Objet court
├── Montant de la procédure
├── Dates (DCE, offres, ouverture)
├── Statut consultation
└── ... 50+ champs métier

DossierData (types.ts)
├── IDProjet (liaison avec ProjectData)
├── Titre du dossier
├── Statut (1-5 : Programmation → Abandonné)
├── Dates (lancement, déploiement)
├── Montants + Économies
└── Validations (MSA, CA, CODIR)
```

#### **Modules de Rédaction (Fragmentés)**
```
Components :
├── components/redaction/DCESection.tsx
│   └── Sous-sections : Questionnaire, CCTP, BPU
├── components/redaction/ReglementConsultation.tsx
├── components/redaction/NOTI1Section.tsx
├── components/redaction/RapportCommission.tsx
└── ... NOTI3, NOTI5, etc. (modules isolés)

Types de données :
├── RapportCommissionData     (Règlement Consultation)
├── Noti1Data                 (NOTI1)
├── Noti3Data                 (NOTI3)
├── Noti5Data                 (NOTI5)
└── (Structures non alignées)

Services de persistance :
├── reglementConsultationStorage.ts
├── noti1Storage.ts
├── noti5Storage.ts
└── (COUPLAGE avec Supabase, pas de centralisation)
```

### 1.2 Flux Actuel de Saisie

```
Utilisateur saisit données
    ↓
Local State (useState)
    ↓
Génération Document (Word/PDF)
    ↓
Sauvegarde Supabase (si implémentée)
    ↓
Chargement ultérieur ❌ (Fragmenté, no unified flow)
```

### 1.3 Problèmes Identifiés

| Problème | Impact | Critique |
|----------|--------|----------|
| **Données redondantes** | Même info saisie plusieurs fois (acheteur, dates, etc.) | ⚠️ Moyen |
| **Modules isolés** | Pas de liaison entre DCE → RC → NOTI1 → NOTI5 | 🔴 ÉLEVÉ |
| **Types désalignés** | Chaque module a sa propre structure de données | ⚠️ Moyen |
| **Rôle de la clé NumProc flou** | Parfois 5 chiffres, parfois format complet | ⚠️ Moyen |
| **Pas de flux global** | Pas de "page DCE" unitaire avec tous les modules | 🔴 ÉLEVÉ |
| **Auto-remplissage ad-hoc** | Logic dispersée dans procedureAutoFill.ts | ⚠️ Moyen |
| **Gestion état locale** | Perte d'état lors de changement de tab | ⚠️ Moyen |
| **Pas d'historique versions** | Aucun suivi des modifications | ⚠️ Moyen |

---

## 2. 🎯 ARCHITECTURE PROPOSÉE

### 2.1 Nouvelle Structure de Base de Données

```sql
-- Table centrale : PROCÉDURES (source de vérité)
CREATE TABLE public.procedures (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  numero_procedure VARCHAR(5) UNIQUE NOT NULL,  -- Clé de liaison
  numero_marche VARCHAR(255),                    -- NumProc complet
  titre_marche VARCHAR(255),
  acheteur VARCHAR(255),
  montant NUMERIC(15,2),
  ...
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table centrale : DCE (agrège tous les modules)
CREATE TABLE public.dce (
  id UUID PRIMARY KEY,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  numero_procedure VARCHAR(5) NOT NULL,
  statut VARCHAR(50) DEFAULT 'brouillon',  -- brouillon, en-cours, finalisé, publié
  
  -- Sections du DCE (JSON ou colonnes)
  reglement_consultation JSONB,
  acte_engagement JSONB,
  ccap JSONB,
  cctp JSONB,
  bpu JSONB,
  dqe JSONB,
  documents_annexes JSONB,
  
  -- Métadonnées
  date_creation TIMESTAMPTZ DEFAULT NOW(),
  date_derniere_modification TIMESTAMPTZ DEFAULT NOW(),
  version INT DEFAULT 1,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : HISTORIQUE des modifications (optionnel mais recommandé)
CREATE TABLE public.dce_versions (
  id UUID PRIMARY KEY,
  dce_id UUID NOT NULL REFERENCES public.dce(id) ON DELETE CASCADE,
  version INT,
  section VARCHAR(50),  -- 'reglement', 'acte', 'ccap', etc.
  data_before JSONB,
  data_after JSONB,
  modified_by UUID REFERENCES auth.users(id),
  modified_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table : NOTIFICATIONS (NOTI1, NOTI3, NOTI5)
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY,
  procedure_id UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  dce_id UUID REFERENCES public.dce(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  numero_procedure VARCHAR(5) NOT NULL,
  type VARCHAR(10),  -- 'NOTI1', 'NOTI3', 'NOTI5'
  statut VARCHAR(50) DEFAULT 'brouillon',
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 Nouvelle Architecture de Composants

```
📁 components/redaction/
├── 📄 DCEComplet.tsx              ⭐ NOUVEAU - Page maître
│   ├── Barre de navigation DCE
│   ├── Sélecteur de procédure (Input numéro 5 chiffres)
│   ├── Affichage données procédure (Read-only)
│   └── Tabs / Sidebar pour modules
│
├── 📁 modules/
│   ├── ReglementConsultation/
│   │   ├── ReglementConsultationModule.tsx
│   │   ├── hooks/useReglementConsultation.ts
│   │   ├── types/reglementConsultation.ts
│   │   └── services/reglementConsultationService.ts
│   │
│   ├── ActeEngagement/
│   │   ├── ActeEngagementModule.tsx
│   │   ├── hooks/useActeEngagement.ts
│   │   ├── types/acteEngagement.ts
│   │   └── services/acteEngagementService.ts
│   │
│   ├── CCAP/
│   │   ├── CCAPModule.tsx
│   │   ├── hooks/useCCAP.ts
│   │   └── ...
│   │
│   ├── CCTP/
│   │   └── CCTPModule.tsx
│   │
│   ├── DocumentsPrix/
│   │   ├── BPUModule.tsx
│   │   ├── DQEModule.tsx
│   │   ├── DPGFModule.tsx
│   │   └── DocumentsPrixModule.tsx
│   │
│   └── DocumentsAnnexes/
│       └── DocumentsAnnexesModule.tsx
│
├── 📁 shared/
│   ├── ProcedureSelector.tsx       ⭐ NOUVEAU - Saisie + chargement
│   ├── ProcedureHeader.tsx         ⭐ NOUVEAU - Affichage info procédure
│   ├── DCEStatusBar.tsx            ⭐ NOUVEAU - État du DCE
│   ├── hooks/useProcedureLoader.ts ⭐ NOUVEAU
│   ├── hooks/useDCEState.ts        ⭐ NOUVEAU
│   └── utils/dceMapping.ts         ⭐ NOUVEAU
│
├── 📁 notifications/
│   ├── NOTI1Module.tsx
│   ├── NOTI3Module.tsx
│   └── NOTI5Module.tsx
│
└── 📁 services/
    ├── dceService.ts               ⭐ NOUVEAU - CENTRAL
    ├── procedureService.ts         ⭐ NOUVEAU
    ├── notificationService.ts      ⭐ NOUVEAU
    └── export/
        ├── dceWordExport.ts
        ├── reglementWordExport.ts
        └── multiDocumentsExport.ts
```

### 2.3 Flux de Données Proposé (Centralisé)

```
┌─────────────────────────────────────────────────────────────────┐
│                    DCE COMPLET (Page Maître)                    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌──────────────────┐
                    │ ProcedureSelector│ (INPUT: numéro 5 chiffres)
                    └──────────────────┘
                              ↓
                    useProcedureLoader.ts
                    ├─ Fetch procedures table
                    ├─ Fetch dce table (si existe)
                    └─ Populate all modules
                              ↓
    ┌─────────────────────────────────────────────────────┐
    │          Données de PROCÉDURE Chargées              │
    │  (Read-only : Acheteur, Montant, Dates, etc.)      │
    └─────────────────────────────────────────────────────┘
                              ↓
    ┌────────────────────────────────────────────────────────────┐
    │            DCE State (useDCEState hook)                    │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │ reglementConsultation:    RCData                     │  │
    │  │ acteEngagement:           AEData                     │  │
    │  │ ccap:                     CCAPData                   │  │
    │  │ cctp:                     CCTPData                   │  │
    │  │ bpu:                      BPUData                    │  │
    │  │ dqe:                      DQEData                    │  │
    │  │ documentsAnnexes:         AnnexesData               │  │
    │  └──────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────┘
                              ↓
    ┌────────────────────────────────────────────────────────────┐
    │              Modules DCE (Tabs/Sidebar)                    │
    │                                                            │
    │  [Réglement] [Acte] [CCAP] [CCTP] [Prix] [Annexes]       │
    │       ↓        ↓       ↓       ↓      ↓         ↓          │
    │   useRC   useAE   useCCAP useCCTP ...         ...          │
    │       │        │       │       │      │         │          │
    │       └────────┴───────┴───────┴──────┴─────────┘          │
    │              (Tous accèdent à useDCEState)                 │
    └────────────────────────────────────────────────────────────┘
                              ↓
    ┌────────────────────────────────────────────────────────────┐
    │              dceService.ts (CENTRAL)                       │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │ saveDCE()        - Sauvegarde la section modifiée    │  │
    │  │ loadDCE()       - Charge DCE complet                │  │
    │  │ updateSection() - Met à jour une section           │  │
    │  │ publishDCE()    - Change statut à "publié"         │  │
    │  │ createVersion() - Enregistre une version           │  │
    │  └──────────────────────────────────────────────────────┘  │
    └────────────────────────────────────────────────────────────┘
                              ↓
                   ┌──────────────────────┐
                   │  SUPABASE (BDD)      │
                   │                      │
                   │ dce (table)          │
                   │ procedures (table)   │
                   │ dce_versions (table) │
                   └──────────────────────┘
```

### 2.4 Flux Détaillé : Saisie Procédure → Rédaction DCE

```
┌──────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 1 : SAISIE DU NUMÉRO DE PROCÉDURE                             │
│                                                                      │
│  ProcedureSelector:                                                 │
│  ┌────────────────────────────────────────────────────────────┐     │
│  │ Entrée : Numéro procédure (5 chiffres)                   │     │
│  │ Ex: "01000"                                              │     │
│  └────────────────────────────────────────────────────────────┘     │
│                          ↓                                          │
│  useProcedureLoader.ts :                                           │
│  1. Valider format (5 chiffres)                                    │
│  2. Chercher dans procedures table                                │
│     SELECT * WHERE numero_procedure = '01000'                     │
│  3. Charger toutes les données procédure:                         │
│     - NumProc, Acheteur, Titre, Objet, Montant, etc.            │
│  4. Chercher si DCE existe déjà:                                 │
│     SELECT * FROM dce WHERE numero_procedure = '01000'           │
│  5. Si DCE existe, charger sections (RC, AE, CCAP, CCTP, etc.)   │
│  6. Peupler useDCEState avec les données                         │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 2 : AFFICHAGE PROCÉDURE + PROPOSITION MODULATION             │
│                                                                      │
│  ProcedureHeader :                                                   │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │ Acheteur : Lauriane Malard      [read-only]               │    │
│  │ Titre    : MOE-EXT-DIJON         [read-only]              │    │
│  │ Montant  : 70 000 €              [read-only]              │    │
│  │ Dates    : 19/12/2024 - 16/01/25 [read-only]             │    │
│  │                                                            │    │
│  │ ✅ Données synchronisées depuis procédures               │    │
│  │ ✅ CCAG proposé : MOE (auto-détecté)                     │    │
│  │ ✅ Type marché proposé : Accord-cadre                    │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  Options présentées :                                               │
│  ├─ ✏️ Créer nouveau DCE (vierge)                                  │
│  ├─ ✏️ Continuer DCE existant (si brouillon)                       │
│  └─ 📋 Lire DCE finalisé (si publié)                               │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 3 : INITIALISATION DCE + AUTO-REMPLISSAGE                    │
│                                                                      │
│  Si nouveau DCE :                                                    │
│  1. Créer record dce (procedure_id, numero_procedure, statut)      │
│  2. Auto-remplir sections avec données procédure:                 │
│                                                                    │
│     RC (Règlement Consultation):                                  │
│     ├─ enTete.numeroMarche       ← procedures.NumProc            │
│     ├─ enTete.titreMarche        ← procedures.Nom de la procédure│
│     ├─ enTete.dateLimiteOffres   ← procedures.Date de remise     │
│     ├─ objet.description         ← procedures.Objet court        │
│     ├─ objet.cpvPrincipal        ← procedures.Code CPV Principal │
│     ├─ conditions.modePassation   ← procedures.Type de procédure │
│     ├─ conditions.nbLots          ← procedures.Nombre de lots    │
│     ├─ typeMarche.dureeInitiale   ← procedures.Durée marché      │
│     └─ remise.delaiValiditeOffres ← procedures.Durée validité    │
│                                                                    │
│     AE (Acte d'Engagement):                                       │
│     ├─ acheteurdataName           ← procedures.Acheteur          │
│     ├─ marche.numero              ← procedures.NumProc           │
│     └─ marche.objet               ← procedures.Objet court       │
│                                                                    │
│     CCAP, CCTP : Templates standards                              │
│     BPU, DQE : À remplir manuellement                             │
│                                                                    │
│  3. Sauvegarder dce dans Supabase avec statut "brouillon"        │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 4 : RÉDACTION + ÉDITION DES MODULES                          │
│                                                                      │
│  Tab : [Réglement] [Acte] [CCAP] [CCTP] [BPU] [DQE] [Annexes]    │
│                                                                      │
│  Clic sur Réglement → ReglementConsultationModule:                 │
│                                                                      │
│  ├─ Charger données depuis useDCEState.reglementConsultation      │
│  ├─ Afficher formulaire pré-rempli                                │
│  ├─ Utilisateur édite le Réglement                                │
│  ├─ onChange → updateDCEState({...reglementConsultation})        │
│  ├─ Sauvegarde Supabase (auto ou clic Save):                     │
│  │  dceService.updateSection('reglement_consultation', data)      │
│  │  → UPDATE dce SET reglement_consultation = $1                  │
│  ├─ Créer version (optionnel):                                    │
│  │  dceService.createVersion(section, before, after)              │
│  └─ Retour au DCE complet avec données synchronisées              │
│                                                                      │
│  Repeat pour les autres modules...                                  │
└──────────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────────┐
│ ÉTAPE 5 : EXPORT + PUBLICATION                                     │
│                                                                      │
│  Bouton "Exporter DCE" :                                            │
│  ├─ Générer Word pour chaque section                              │
│  ├─ Fusionner en 1 document (ou 7 documents séparés)              │
│  ├─ Inclure pages de garde, tables des matières                   │
│  └─ Télécharger ZIP ou fichier unique                             │
│                                                                      │
│  Bouton "Publier DCE" :                                            │
│  ├─ Valider que tous les champs obligatoires sont remplis         │
│  ├─ Changer statut dce → "publié"                                 │
│  ├─ Créer notification NOTI1 (optionnel)                          │
│  └─ Injecter dans registre dépôts/retraits                        │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 3. 🔗 Mapping : Données Procédure → Modules DCE

```typescript
// 📋 Tableau de correspondance (source de vérité unique)

ProjectData (procedures table) → Module de rédaction

// RÉGLEMENT DE CONSULTATION
├─ enTete
│  ├─ numeroMarche                    ← NumProc (complet)
│  ├─ titreMarche                     ← Nom de la procédure
│  ├─ dateLimiteOffres                ← Date de remise des offres
│  ├─ dateLimiteQuestions             ← Date limite questions (si dispo)
│  └─ typeMarcheTitle                 ← Marché public + Type procédure
├─ objet
│  ├─ description                     ← Objet court
│  ├─ cpvPrincipal                    ← Code CPV Principal
│  └─ cpvSecondaires                  ← [À enrichir manuellement]
├─ conditions
│  ├─ modePassation                   ← Type de procédure
│  ├─ nbLots                          ← Nombre de lots
│  ├─ ccagApplicable                  ← [À sélectionner / CCAG]
│  └─ variantesAutorisees             ← [À déterminer]
├─ typeMarche
│  ├─ dureeInitiale                   ← Durée du marché (en mois)
│  ├─ sousTraitanceTotaleInterdite    ← [À déterminer]
│  └─ lieuExecution                   ← [À déterminer]
└─ remise
   └─ delaiValiditeOffres             ← Durée de validité des offres (jours)

// ACTE D'ENGAGEMENT
├─ acheteur
│  └─ nom                             ← Acheteur
├─ marche
│  ├─ numero                          ← NumProc
│  ├─ objet                           ← Objet court
│  ├─ montant                         ← Montant de la procédure
│  └─ duree                           ← Durée du marché
└─ [Reste à déterminer manuellement]

// CCAP / CCTP / BPU / DQE
└─ [À déterminer + enrichir par l'utilisateur]
```

---

## 4. 🛠️ Propositions Détaillées

### 4.1 Hook Central : `useDCEState.ts` (Nouvel)

```typescript
// Remplace la gestion d'état fragmentée
// Centralise tous les modules DCE

interface DCEState {
  procedureId: string;
  numeroProcedure: string;
  statut: 'brouillon' | 'en-cours' | 'finalisé' | 'publié';
  
  reglementConsultation: RapportCommissionData;
  acteEngagement: ActeEngagementData;
  ccap: CCAPData;
  cctp: CCTPData;
  bpu: BPUData;
  dqe: DQEData;
  documentsAnnexes: AnnexesData;
  
  // Métadonnées
  dateCreation: Date;
  dateModification: Date;
  version: number;
  notes: string;
}

export function useDCEState(numeroProcedure: string) {
  const [state, setState] = useState<DCEState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Charger depuis Supabase
  const load = async () => {
    const result = await dceService.loadDCE(numeroProcedure);
    if (result.success) setState(result.data);
  };
  
  // Mettre à jour une section
  const updateSection = async <K extends keyof DCEState>(
    section: K,
    data: DCEState[K]
  ) => {
    setState(prev => ({ ...prev, [section]: data }));
    await dceService.updateSection(numeroProcedure, section, data);
  };
  
  return { state, loading, error, load, updateSection };
}
```

### 4.2 Service Central : `dceService.ts` (Nouvel)

```typescript
// Centralise toutes les opérations Supabase pour le DCE

export class DCEService {
  // Charger DCE complet
  async loadDCE(numeroProcedure: string): Promise<DCEData> {
    const { data, error } = await supabase
      .from('dce')
      .select('*')
      .eq('numero_procedure', numeroProcedure)
      .single();
    
    if (error?.code === 'PGRST116') {
      // Pas de DCE existant, créer nouveau
      return this.createDCE(numeroProcedure);
    }
    
    return data;
  }
  
  // Créer nouveau DCE
  async createDCE(numeroProcedure: string): Promise<DCEData> {
    // 1. Récupérer les données procédure
    const procedure = await this.loadProcedure(numeroProcedure);
    
    // 2. Auto-remplir les sections
    const dceData = dceMapping.mapProcedureToDCE(procedure);
    
    // 3. Sauvegarder dans Supabase
    const { data } = await supabase
      .from('dce')
      .insert([{
        procedure_id: procedure.id,
        numero_procedure: numeroProcedure,
        statut: 'brouillon',
        ...dceData
      }])
      .select()
      .single();
    
    return data;
  }
  
  // Mettre à jour une section
  async updateSection(
    numeroProcedure: string,
    section: string,
    data: any
  ): Promise<void> {
    // Créer version (optionnel)
    if (this.versioningEnabled) {
      await this.createVersion(numeroProcedure, section, null, data);
    }
    
    // Mettre à jour la section
    const updateData = { [section]: data };
    await supabase
      .from('dce')
      .update(updateData)
      .eq('numero_procedure', numeroProcedure);
  }
  
  // Publier le DCE
  async publishDCE(numeroProcedure: string): Promise<void> {
    // Valider que toutes les sections sont remplies
    const dce = await this.loadDCE(numeroProcedure);
    if (!this.validateDCE(dce)) {
      throw new Error('DCE incomplet');
    }
    
    // Changer le statut
    await supabase
      .from('dce')
      .update({ statut: 'publié' })
      .eq('numero_procedure', numeroProcedure);
  }
}
```

### 4.3 Hook de Chargement : `useProcedureLoader.ts` (Nouvel)

```typescript
// Charge la procédure et les données DCE associées

export function useProcedureLoader(numeroProcedure: string) {
  const [procedure, setProcedure] = useState<ProjectData | null>(null);
  const [dce, setDce] = useState<DCEData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // 1. Valider et normaliser le numéro
        const normalized = normalizeProcedureNumber(numeroProcedure);
        
        // 2. Charger procédure
        const proc = await procedureService.loadProcedure(normalized);
        setProcedure(proc);
        
        // 3. Charger DCE (ou créer s'il n'existe pas)
        const dceData = await dceService.loadDCE(normalized);
        setDce(dceData);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    
    if (numeroProcedure) load();
  }, [numeroProcedure]);
  
  return { procedure, dce, loading, error };
}
```

### 4.4 Composant : `ProcedureSelector.tsx` (Nouvel)

```typescript
// Capture le numéro de procédure et lance le chargement

export function ProcedureSelector({ onLoad }: Props) {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { procedure, dce, loading, error } = useProcedureLoader(numeroProcedure);
  
  const handleSearch = async (num: string) => {
    // Valider format
    if (!/^\d{5}$/.test(num.trim())) {
      setError('Numéro invalide');
      return;
    }
    
    setNumeroProcedure(num);
    // useProcedureLoader fera le reste
  };
  
  useEffect(() => {
    if (procedure && dce) {
      onLoad({ procedure, dce });
    }
  }, [procedure, dce]);
  
  return (
    <div>
      <Input
        placeholder="Entrez le n° procédure (5 chiffres)"
        onChange={e => handleSearch(e.target.value)}
        disabled={loading}
      />
      {loading && <Spinner />}
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {procedure && <ProcedureHeader procedure={procedure} />}
    </div>
  );
}
```

### 4.5 Composant : `DCEComplet.tsx` (Nouvel - PAGE MAÎTRE)

```typescript
// Page principale qui orchestral tous les modules

export function DCEComplet() {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const [procedure, setProcedure] = useState<ProjectData | null>(null);
  const dceState = useDCEState(numeroProcedure);
  const [activeTab, setActiveTab] = useState<'rc' | 'ae' | 'ccap' | 'cctp' | 'bpu' | 'dqe' | 'annexes'>('rc');
  
  const handleProcedureLoad = ({ procedure, dce }) => {
    setProcedure(procedure);
    dceState.load();
  };
  
  return (
    <div className="min-h-screen bg-gray-50">
      {!procedure ? (
        // Écran 1 : Saisie du numéro
        <ProcedureSelector onLoad={handleProcedureLoad} />
      ) : (
        // Écran 2 : Rédaction DCE
        <div className="flex flex-col h-screen">
          {/* Barre supérieure */}
          <div className="border-b bg-white p-4">
            <ProcedureHeader procedure={procedure} />
            <DCEStatusBar dce={dceState.state} />
          </div>
          
          {/* Navigation modules */}
          <div className="border-b bg-white">
            <Tabs value={activeTab} onChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="rc">Réglement</TabsTrigger>
                <TabsTrigger value="ae">Acte</TabsTrigger>
                <TabsTrigger value="ccap">CCAP</TabsTrigger>
                <TabsTrigger value="cctp">CCTP</TabsTrigger>
                <TabsTrigger value="bpu">BPU</TabsTrigger>
                <TabsTrigger value="dqe">DQE</TabsTrigger>
                <TabsTrigger value="annexes">Annexes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          {/* Contenu des modules */}
          <div className="flex-1 overflow-auto">
            {activeTab === 'rc' && (
              <ReglementConsultationModule
                data={dceState.state.reglementConsultation}
                onUpdate={(data) => dceState.updateSection('reglementConsultation', data)}
              />
            )}
            {activeTab === 'ae' && (
              <ActeEngagementModule
                data={dceState.state.acteEngagement}
                onUpdate={(data) => dceState.updateSection('acteEngagement', data)}
              />
            )}
            {/* ... autres modules */}
          </div>
          
          {/* Pied de page */}
          <div className="border-t bg-white p-4 flex justify-between">
            <Button onClick={() => dceState.saveDCE()}>Sauvegarder</Button>
            <Button onClick={() => dceState.publishDCE()}>Publier DCE</Button>
            <Button onClick={() => exportDCE(dceState.state)}>Exporter</Button>
          </div>
        </div>
      )}
    </div>
  );
}
```

---

## 5. 📊 Comparaison : AVANT vs APRÈS

| Aspect | AVANT | APRÈS |
|--------|-------|-------|
| **Entrée procédure** | Saisie manuelle dispersée | Recherche centralisée + auto-remplissage |
| **Modules** | 7+ composants isolés | 1 page maître + modules modulaires |
| **État données** | Fragmenté (useState partout) | Centralisé (useDCEState) |
| **Persistance** | Ad-hoc par module | Service central (dceService) |
| **Liaison données** | Pas de liaison | Clé numeroProcedure + mapping |
| **Autocomplétion** | procedureAutoFill.ts | Intégré dans useProcedureLoader |
| **Versioning** | Aucun | Support optionnel (dce_versions) |
| **Flux utilisateur** | "Où saisir ? Où sauvegarder ?" | Clair : saisir → éditer → exporter |
| **Exports** | Générés par module | Orchestrés par dceService |

---

## 6. ✅ Avantages de cette Architecture

### Pour l'utilisateur
- ✅ **Expérience cohérente** : Même flux partout
- ✅ **Données pré-remplies** : Saisie une fois, utilisée partout
- ✅ **Aucune redondance** : Données synchronisées en temps réel
- ✅ **Suivi de progression** : Voir l'état du DCE (brouillon → publié)
- ✅ **Récupération facile** : Revenir au DCE plus tard sans perdre le travail

### Pour le développeur
- ✅ **Maintenabilité** : Une source de vérité unique (types + mapping)
- ✅ **Scalabilité** : Facile d'ajouter des sections ou modules
- ✅ **Testabilité** : Services découplés, testables indépendamment
- ✅ **DRY** : Pas de code en double
- ✅ **Type-safe** : TypeScript partout

---

## 7. 🔨 Roadmap d'Implémentation

### Phase 1 : Infrastructure (Semaine 1)
- [ ] Créer les tables Supabase (procedures, dce, dce_versions, notifications)
- [ ] Créer les types TypeScript (dceTypes.ts, mapping.ts)
- [ ] Créer les services (dceService.ts, procedureService.ts)
- [ ] Créer les hooks (useDCEState.ts, useProcedureLoader.ts)

### Phase 2 : Composants Publics (Semaine 2)
- [ ] Créer ProcedureSelector.tsx
- [ ] Créer ProcedureHeader.tsx
- [ ] Créer DCEStatusBar.tsx
- [ ] Créer DCEComplet.tsx (page maître)

### Phase 3 : Refactorisation Modules (Semaine 3-4)
- [ ] Refactoriser ReglementConsultation → ReglementConsultationModule
- [ ] Refactoriser Acte d'Engagement
- [ ] Refactoriser CCAP, CCTP, BPU, DQE
- [ ] Adapter NotificationsModule (NOTI1, NOTI3, NOTI5)

### Phase 4 : Intégration & Tests (Semaine 5)
- [ ] Tester flux complet
- [ ] Adapter exports (Word, PDF)
- [ ] Migration données existantes (si nécessaire)
- [ ] Documentation utilisateur

---

## 8. ⚠️ Considérations importantes

### 8.1 Migration des données existantes
- Les données actuelles dans `reglements_consultation`, `noti1`, etc. doivent-elles être migrées dans la nouvelle `dce` table ?
- **Proposition** : Script de migration avec mapping automatique

### 8.2 Versioning
- Utiliser `dce_versions` pour l'audit trail ?
- **Proposition** : Oui, important pour la conformité légale (traçabilité)

### 8.3 Permissions & RLS
- Adapter les politiques RLS pour la nouvelle structure
- **Proposition** : Un utilisateur ne peut voir/modifier que ses propres DCE

### 8.4 Notifications
- Créer NOTI1, NOTI3, NOTI5 depuis le DCE finalisé ?
- **Proposition** : Bouton "Créer notification" qui prépopule les données

### 8.5 Exports & Rapports
- Fusionner les 7 documents en 1 PDF/Word ?
- **Proposition** : Donner le choix à l'utilisateur

---

## 9. 🎯 Livrables Proposés

1. **README_DCE_ARCHITECTURE.md** - Documentation technique
2. **MIGRATION_GUIDE.md** - Guide de migration des données
3. **DEVELOPMENT_CHECKLIST.md** - Checklist d'implémentation
4. **DATABASE_SCHEMA_V2.sql** - Schéma SQL complet
5. **TYPES_MAPPING.ts** - Correspondance ProjectData ↔ Modules DCE
6. **USER_GUIDE_DCE.md** - Guide utilisateur (voir aussi TEST_GUIDE.md)

---

## 10. 📌 Conclusion

Cette architecture proposée :

1. **Élimine la redondance** des données (saisies une seule fois)
2. **Centralise le flux** de rédaction du DCE (une page maître)
3. **Lie tous les modules** via la clé numeroProcedure + dceService
4. **Facilite la maintenance** (code modulaire, testable)
5. **Améliore l'UX** (workflow clair et intuitif)
6. **Prépare la scalabilité** (facile d'ajouter sections, notifications)

✅ **Les travaux existants sont CONSERVÉS** - nous les réorganisons dans une structure cohérente.

✅ **Approche progressive possible** - implémenter phase par phase sans casser les fonctionnalités existantes.
