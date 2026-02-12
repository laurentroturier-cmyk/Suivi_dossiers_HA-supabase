# 🏗️ PROPOSITIONS DÉTAILLÉES D'IMPLÉMENTATION - DCE

## 📐 Diagrammes d'Architecture

### 1. Vue d'ensemble des relations de données

```
┌──────────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                            │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────┐         ┌─────────────────────┐        │
│  │    procedures       │         │       dce           │        │
│  │                     │         │                     │        │
│  │  id (PK)            │◄───────┤procedure_id (FK)    │        │
│  │  numero_procedure   │◄───┐   │numero_procedure     │        │
│  │  numero_marche      │    │   │user_id              │        │
│  │  titre_marche       │    │   │statut               │        │
│  │  acheteur           │    │   │                     │        │
│  │  montant            │    │   │reglement_consultation│JSONB   │
│  │  dates (...)        │    │   │acte_engagement      │JSONB   │
│  │  ...                │    │   │ccap                 │JSONB   │
│  │                     │    │   │cctp                 │JSONB   │
│  └─────────────────────┘    │   │bpu                  │JSONB   │
│                             │   │dqe                  │JSONB   │
│                             │   │documents_annexes   │JSONB   │
│  ┌─────────────────────┐    │   │                     │        │
│  │  dce_versions       │    │   │version              │        │
│  │                     │    │   │updated_at           │        │
│  │  id (PK)            │    │   └─────────────────────┘        │
│  │  dce_id (FK)        │───┘                                    │
│  │  version            │                                        │
│  │  section            │    ┌─────────────────────┐            │
│  │  data_before        │    │  notifications      │            │
│  │  data_after         │    │                     │            │
│  │  modified_by        │    │  id (PK)            │            │
│  │  modified_at        │    │  procedure_id (FK)  │            │
│  └─────────────────────┘    │  dce_id (FK)        │            │
│                             │  type (NOTI1/3/5)  │            │
│                             │  data               │JSONB       │
│                             │  statut             │            │
│                             └─────────────────────┘            │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 2. Flux de données - Saisie à Publication

```
┌─────────────────────────────────────────────────────────────────────┐
│                   UTILISATEUR LANCE L'APPLI                         │
└─────────────────────────────────────────────────────────────────────┘
                                 ↓
                        ┌─────────────────┐
                        │ ProcedureSelector│
                        │  INPUT : 01000   │
                        └─────────────────┘
                                 ↓
                    ┌────────────────────────┐
                    │ useProcedureLoader()   │
                    │ • Valide format        │
                    │ • Requête Supabase     │
                    └────────────────────────┘
                                 ↓
            ┌─────────────────────────────────────────┐
            │     DONNÉES PROCÉDURE CHARGÉES           │
            │                                         │
            │  SELECT * FROM procedures               │
            │  WHERE numero_procedure = '01000'       │
            │                                         │
            │  Retour:                                │
            │  ├─ ID: abc123                         │
            │  ├─ Titre: MOE-EXT-DIJON              │
            │  ├─ Acheteur: Lauriane Malard         │
            │  ├─ Montant: 70000                    │
            │  ├─ Objet: MOE-EXT-DIJON              │
            │  ├─ CPV: 45262700                     │
            │  └─ ...                                │
            └─────────────────────────────────────────┘
                                 ↓
        ┌──────────────────────────────────────────────────┐
        │  RECHERCHE DCE EXISTANT                          │
        │                                                  │
        │  SELECT * FROM dce                              │
        │  WHERE numero_procedure = '01000'               │
        │        AND user_id = 'current_user'             │
        └──────────────────────────────────────────────────┘
                                 ↓
                    ┌─────────────────────────┐
                    │  DCE TROUVÉ ?           │
                    └──────────┬──────────────┘
                        ╱              ╲
                       OUI             NON
                      ╱                 ╲
            ┌──────────────────┐    ┌──────────────────────────┐
            │ Charger DCE      │    │ Créer NOUVEAU DCE        │
            │ existant         │    │                          │
            │                  │    │ INSERT INTO dce (        │
            │ SELECT data      │    │   procedure_id,          │
            │ FROM dce         │    │   numero_procedure,      │
            │ WHERE ...        │    │   statut: 'brouillon',   │
            │                  │    │   reglement_consultation │
            │ ↓                │    │     : mapRC(...),        │
            │ Peupler          │    │   acte_engagement: ...   │
            │ useDCEState      │    │ )                        │
            └──────────────────┘    └──────────────────────────┘
                      ╲                           ╱
                       ╲___________↓______________╱
                                 ↓
                    ┌─────────────────────────┐
                    │ AFFICHER DCE COMPLET    │
                    │                         │
                    │ ├─ Tabs (RC|AE|...)    │
                    │ ├─ Procedure Header    │
                    │ ├─ Status Bar          │
                    │ └─ Module Actif        │
                    └─────────────────────────┘
                                 ↓
        ┌──────────────────────────────────────────────────┐
        │  BOUCLE D'ÉDITION                                │
        │                                                  │
        │  1. Utilisateur clique Tab "Réglement"          │
        │                                                  │
        │  2. ReglementConsultationModule charge data     │
        │     from useDCEState.reglementConsultation      │
        │                                                  │
        │  3. Utilisateur édite formulaire                │
        │                                                  │
        │  4. onChange → updateDCEState()                 │
        │                                                  │
        │  5. Async save → dceService.updateSection()     │
        │     UPDATE dce SET reglement_consultation = ... │
        │                                                  │
        │  6. Créer version (optionnel)                   │
        │     INSERT INTO dce_versions (...)              │
        │                                                  │
        │  7. Répéter pour les autres modules             │
        │                                                  │
        └──────────────────────────────────────────────────┘
                                 ↓
        ┌──────────────────────────────────────────────────┐
        │  FINALISATION                                    │
        │                                                  │
        │  Bouton "Exporter DCE":                         │
        │  ├─ Charger toutes les sections                 │
        │  ├─ Générer Word/PDF pour chacune               │
        │  ├─ Fusionner ou créer ZIP                      │
        │  └─ Télécharger                                 │
        │                                                  │
        │  Bouton "Publier DCE":                          │
        │  ├─ Valider complétude                          │
        │  ├─ UPDATE dce SET statut = 'publié'           │
        │  ├─ Optionnel: Créer NOTI1                      │
        │  └─ Optionnel: Injecter dans registres          │
        │                                                  │
        └──────────────────────────────────────────────────┘
```

### 3. Architecture des Composants - Organisation Hiérarchique

```
DCEComplet (Page maître)
│
├── [Tab Selection]
│   ├─ Réglement
│   ├─ Acte
│   ├─ CCAP
│   ├─ CCTP
│   ├─ BPU
│   ├─ DQE
│   └─ Annexes
│
├── [Top Bar]
│   ├─ ProcedureSelector
│   │  └─ Input numero procédure
│   │     ├─ useProcedureLoader
│   │     ├─ procedureService
│   │     └─ Validation format
│   │
│   ├─ ProcedureHeader
│   │  └─ Affichage read-only:
│   │     ├─ Acheteur
│   │     ├─ Titre
│   │     ├─ Montant
│   │     └─ Dates
│   │
│   └─ DCEStatusBar
│      ├─ Statut (Brouillon|En-cours|Publié)
│      ├─ % Complétude
│      ├─ Dernière modif.
│      └─ Version
│
├── [Active Module - Tabs content]
│   │
│   ├─ ReglementConsultationModule
│   │  ├─ useReglementConsultation
│   │  ├─ data from useDCEState
│   │  ├─ Sections (EnTete, Objet, Conditions, etc.)
│   │  └─ onUpdate → dceService.updateSection()
│   │
│   ├─ ActeEngagementModule
│   │  ├─ useActeEngagement
│   │  ├─ Sections
│   │  └─ onUpdate
│   │
│   ├─ CCAPModule
│   │  ├─ useCCAP
│   │  ├─ Template + Édition
│   │  └─ onUpdate
│   │
│   ├─ CCTPModule
│   │  └─ ...
│   │
│   ├─ DocumentsPrixModule
│   │  ├─ BPUModule (Bordereau Prix Unitaires)
│   │  ├─ DQEModule (Détail Quantitatif Estimatif)
│   │  └─ DPGFModule (Décompte Paiement Gestion Finances)
│   │
│   └─ DocumentsAnnexesModule
│      ├─ Liste des fichiers attachés
│      ├─ Upload/Download
│      └─ Métadonnées
│
└── [Bottom Bar]
    ├─ Bouton "Sauvegarder"
    │  └─ dceService.saveDCE()
    │     └─ UPDATE dce SET ...
    │
    ├─ Bouton "Publier"
    │  └─ dceService.publishDCE()
    │     ├─ Valider complétude
    │     └─ UPDATE statut = 'publié'
    │
    ├─ Bouton "Exporter"
    │  └─ dceExportService.generateExport()
    │     ├─ Format: Word/PDF/ZIP
    │     └─ Inclure toutes sections
    │
    ├─ Bouton "Créer NOTI1"
    │  └─ notificationService.createNotification('NOTI1')
    │     ├─ Pré-remplir depuis DCE
    │     └─ Ouvrir modal NOTI1
    │
    └─ Bouton "Historique"
       └─ dceVersionService.loadVersions()
          └─ Afficher timeline modifications
```

---

## 🔄 Flux de Synchronisation des Données

### Scénario 1 : Première saisie du DCE

```
UTILISATEUR
├─ Saisit numéro procédure : "01000"
│  └─ useProcedureLoader(['01000'])
│
├─ Charge procédure depuis Supabase
│  └─ SELECT * FROM procedures WHERE numero_procedure = '01000'
│     → { id: proc-123, titre: "MOE-EXT-DIJON", montant: 70000, ... }
│
├─ Recherche DCE existant
│  └─ SELECT * FROM dce WHERE numero_procedure = '01000' AND user_id = current
│     → ERROR: not found (404)
│
├─ Crée nouveau DCE
│  └─ dceService.createDCE('01000')
│     ├─ AUTO-MAP procedure → reglement_consultation
│     │  ├─ enTete.numeroMarche ← procedure.NumProc
│     │  ├─ enTete.titreMarche ← procedure['Nom de la procédure']
│     │  ├─ objet.description ← procedure['Objet court']
│     │  └─ objet.cpvPrincipal ← procedure['Code CPV Principal']
│     │
│     ├─ AUTO-MAP procedure → acte_engagement
│     │  ├─ acheteur.nom ← procedure.Acheteur
│     │  └─ marche.numero ← procedure.NumProc
│     │
│     ├─ INITIALISER TEMPLATES
│     │  ├─ ccap: template standard + data procédure
│     │  ├─ cctp: template standard (à enrichir)
│     │  ├─ bpu: structure vide (à remplir)
│     │  └─ dqe: structure vide (à remplir)
│     │
│     └─ INSERT INTO dce (procedure_id, numero_procedure, statut='brouillon', ...)
│        → { id: dce-456, numero_procedure: '01000', statut: 'brouillon', ... }
│
├─ Peupler useDCEState
│  └─ setState({
│       procedureId: 'proc-123',
│       numeroProcedure: '01000',
│       reglementConsultation: { ... },
│       acteEngagement: { ... },
│       ccap: { ... },
│       cctp: { ... },
│       bpu: { ... },
│       dqe: { ... },
│       documentsAnnexes: []
│     })
│
└─ Afficher DCE complet avec données pré-remplies ✅
```

### Scénario 2 : Édition d'un module

```
UTILISATEUR CLIQUE TAB "Réglement"
│
├─ ReglementConsultationModule(data=useDCEState.reglementConsultation)
│  └─ Afficher formulaire pré-rempli
│
├─ UTILISATEUR ÉDITE
│  ├─ Change enTete.titreMarche : "MOE-EXT-DIJON" → "MOE-EXT-DIJON v2"
│  ├─ Change objet.description : "MOE-EXT-DIJON" → "Maîtrise d'œuvre externalisée..."
│  └─ onChange handlers
│
├─ CHAQUE CHANGEMENT
│  ├─ Mettre à jour l'UI immédiatement (optimistic)
│  │  └─ setState({ reglementConsultation: {...newData} })
│  │
│  ├─ Envoyer PUT à Supabase (debounced 500ms)
│  │  └─ dceService.updateSection('reglement_consultation', {...newData})
│  │     └─ UPDATE dce SET reglement_consultation = $1 WHERE numero_procedure = '01000'
│  │
│  └─ Optionnel: Créer version
│     └─ dceVersionService.createVersion('reglement_consultation', oldData, newData)
│        └─ INSERT INTO dce_versions (dce_id, version, section, data_before, data_after)
│
├─ UTILISATEUR VALIDE (clic "Sauvegarder")
│  ├─ useDCEState.saveDCE()
│  ├─ UPDATE dce SET updated_at = NOW()
│  └─ Afficher toast "Sauvegardé ✅"
│
└─ Données persistées dans Supabase ✅
```

### Scénario 3 : Changement d'onglet

```
UTILISATEUR CLIQUE TAB "CCTP"
│
├─ Tab switch → activeTab = 'cctp'
│
├─ CCTPModule monte
│  ├─ Charger data depuis useDCEState.cctp
│  │  └─ If(!data) { setLoading(true); dceService.loadDCE(...); }
│  │
│  └─ Afficher contenu CCTP
│
├─ UTILISATEUR ÉDITE CCTP
│  └─ Même flux que Scénario 2
│
└─ Quand utilisateur revient à "Réglement"
   ├─ Tab switch → activeTab = 'rc'
   │
   └─ ReglementConsultationModule remonte
      ├─ Récupère data depuis useDCEState.reglementConsultation
      ├─ Data synchronisée (modifications récentes sont là)
      └─ Aucune perte d'édition ! ✅
```

### Scénario 4 : Publication du DCE

```
UTILISATEUR CLIQUE "Publier DCE"
│
├─ dceService.publishDCE('01000')
│  │
│  ├─ Valider complétude
│  │  ├─ Si reglement_consultation.enTete.numeroProcedure == ''  → ERROR
│  │  ├─ Si acte_engagement.acheteur.nom == ''                   → ERROR
│  │  ├─ Si cctp.sections.length == 0                            → WARNING
│  │  └─ Continuer même avec warnings
│  │
│  ├─ Créer snapshot pour audit
│  │  └─ INSERT INTO dce_versions (version: 'PUBLISHED', ...)
│  │
│  ├─ Changer statut
│  │  └─ UPDATE dce SET statut = 'publié', updated_at = NOW()
│  │
│  ├─ Optionnel: Générer NOTI1 automatiquement
│  │  ├─ INSERT INTO notifications (type: 'NOTI1', data: {...})
│  │  └─ Pré-remplir depuis DCE publié
│  │
│  └─ Optionnel: Injecter dans registres
│     ├─ UPDATE dossiers SET dce_id = dce-456
│     └─ UPDATE dossiers SET statut = '3.2 - Publiée'
│
├─ Rafraîchir UI
│  └─ useDCEState.setState({ statut: 'publié' })
│
└─ Afficher confirmation "DCE publié ✅"
```

---

## 📋 Matrice de Décision : Options d'Implémentation

### A. Structure des Données DCE

| Option | Avantages | Inconvénients | Recommandé |
|--------|-----------|---------------|-----------| 
| **Tout en JSONB** | Flexible, evolv facilement | Requêtes complexes, pas de index | ⭐ Pour sections |
| **Colonnes séparées** | Optimisé, queryable | Schéma rigide, migrations coûteuses | ⭐ Pour métadonnées |
| **Hybrid** (Chose) | Meilleur des 2 | Plus complexe | ✅ **RECOMMANDÉ** |

**Proposition** :
```sql
dce (
  -- Métadonnées (colonnes)
  id, procedure_id, user_id, numero_procedure, statut, version, 
  
  -- Données (JSONB)
  reglement_consultation JSONB,
  acte_engagement JSONB,
  ccap JSONB,
  cctp JSONB,
  bpu JSONB,
  dqe JSONB,
  documents_annexes JSONB
)
```

### B. Persistance des Modifications

| Option | Avantages | Inconvénients | Recommandé |
|--------|-----------|---------------|-----------| 
| **Auto-save** | Zéro perte | Requêtes réseau fréquentes | ✅ **RECOMMANDÉ** |
| **Sauvegarder manuellement** | Moins de charge | Risque de perte | ❌ Non recommandé |
| **Sauvegarder par section** | Granulaire | Confus pour l'utilisateur | ⚠️ Possible |

**Proposition** : Auto-save debounced (500ms) + bouton explicite

### C. Versioning

| Option | Avantages | Inconvénients | Recommandé |
|--------|-----------|---------------|-----------| 
| **Aucun** | Simple | Zéro traçabilité | ❌ Non recommandé |
| **Complet** | Audit trail | Stockage important | ✅ Mais optionnel |
| **Snapshots** (publié) | Compromis | Revisions limitées | ⚠️ Possible |

**Proposition** : Versioning complet pour sections modifiées + snapshot à la publication

### D. Exports

| Option | Avantages | Inconvénients | Recommandé |
|--------|-----------|---------------|-----------| 
| **Document unique** | Simple | Très volumineux | ⚠️ Possible |
| **7 docs séparés** | Modulaire | Lourd à gérer | ✅ Actuellement |
| **Choix utilisateur** | Flexible | Plus complexe | ✅ **RECOMMANDÉ** |

**Proposition** : Offrir choix : "Export unique" vs "Export multi-fichiers"

### E. Notifications (NOTI)

| Option | Avantages | Inconvénients | Recommandé |
|--------|-----------|---------------|-----------| 
| **Créer manuellement** | Utilisateur contrôle | Redondant | ❌ Frustrant |
| **Auto-générer** | Rapide, pré-rempli | Rigide | ⚠️ Bon pour brouillon |
| **Proposer comme template** | Meilleur des 2 | À implémenter | ✅ **RECOMMANDÉ** |

**Proposition** : Bouton "Créer NOTI1 depuis DCE" qui pré-remplit les champs

---

## 🎨 Wireframes - UI Proposée

### Écran 1 : Sélection Procédure

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 📋 Dossier de Consultation - Sélection Procédure       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Entrez le numéro de procédure (5 chiffres)             │  │
│  │                                                         │  │
│  │ ┌────────────────────────────────────────────────────┐ │  │
│  │ │ 01000                                       🔍      │ │  │
│  │ └────────────────────────────────────────────────────┘ │  │
│  │                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ✅ Procédure trouvée                                    │  │
│  │                                                         │  │
│  │  Acheteur      : Lauriane Malard                       │  │
│  │  Titre         : MOE-EXT-DIJON                         │  │
│  │  Objet         : Maitrise d'oeuvre externalisée ...    │  │
│  │  Montant       : 70 000 €                              │  │
│  │  Dates         : 19/12/2024 - 16/01/2025              │  │
│  │  Type procédure: Procédure Négociée                    │  │
│  │  CCAG          : MOE                                   │  │
│  │  Nombre de lots: 1                                     │  │
│  │                                                         │  │
│  │  ┌───────────────────┐  ┌──────────────────────────┐  │  │
│  │  │ ✏️ Créer nouveau  │  │ 📂 Continuer existant  │  │  │
│  │  │    DCE            │  │    (si brouillon)      │  │  │
│  │  └───────────────────┘  └──────────────────────────┘  │  │
│  │                                                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Écran 2 : DCE Complet - Page Maître

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│ 📋 Dossier de Consultation (DCE) — Édition Complète                     │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Procédure: 01000 | MOE-EXT-DIJON | Montant: 70 000€                   │
│  Acheteur: Lauriane Malard                                              │
│  Statut: 🟡 BROUILLON | Version: 1 | Modifié: 20 jan 14:32              │
│  Complétude: ████████░░ 80%                                             │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Réglement] [Acte] [CCAP] [CCTP] [BPU] [DQE] [Annexes]                │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  RÉGLEMENT DE CONSULTATION                                              │
│  ═══════════════════════════════════════════════════════════════════    │
│                                                                          │
│  EN-TÊTE                                                                │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ N° de procédure      : 01000            [auto-rempli]           │ │
│  │ Titre du marché      : [MOE-EXT-DIJON]                          │ │
│  │ Type                 : ☑ Marché public                          │ │
│  │ Date limite offres   : [16/01/2025]                             │ │
│  │ Heure limite         : [14:00]                                  │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  OBJET                                                                  │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Description           : [Maîtrise d'oeuvre externalisée...]      │ │
│  │ CPV Principal         : [45262700] [auto-rempli]                │ │
│  │ CPV Secondaires       : [Ajouter]                               │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  CONDITIONS                                                             │
│  ┌───────────────────────────────────────────────────────────────────┐ │
│  │ Mode de passation     : Procédure Négociée                       │ │
│  │ Nombre de lots        : 1                                        │ │
│  │ Variantes autorisées  : ☐ Non                                    │ │
│  │ CCAG applicable       : ☑ CCAG-MOE                              │ │
│  │ Délai validité offres : 150 jours                                │ │
│  └───────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  [Continuer vers module suivant] [Auto-save ✅]                        │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  [Sauvegarder] [Publier DCE] [Exporter] [NOTI1] [Historique]            │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### Écran 3 : Historique des Versions (Optionnel)

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│ 📜 Historique des modifications — 01000 (MOE-EXT-DIJON)            │
│                                                                      │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│ Version 3 [20 jan 14:32] - Modification réglement ⭐ Actuelle        │
│ ├─ Section: Réglement Consultation                                 │
│ ├─ Modifié par: Laurent Dupont                                     │
│ ├─ Changements:                                                    │
│ │  ├─ enTete.titreMarche: "MOE-EXT" → "MOE-EXT-DIJON"           │
│ │  └─ remise.delaiValiditeOffres: "120" → "150"                 │
│ └─ [Restaurer cette version]                                      │
│                                                                      │
│ Version 2 [20 jan 13:15] - Modification CCTP                       │
│ ├─ Section: CCTP                                                   │
│ ├─ Modifié par: Laurent Dupont                                     │
│ └─ [Restaurer cette version]                                       │
│                                                                      │
│ Version 1 [20 jan 12:00] - Création initiale ⭐ Publiée            │
│ ├─ Auto-créée depuis procédure                                     │
│ └─ [Restaurer cette version]                                       │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Permissions & Sécurité (RLS)

### Politiques Supabase Proposées

```sql
-- Table: procedures
CREATE POLICY "Users can view procedure"
  ON public.procedures
  FOR SELECT
  USING (true);  -- Tous voient les procédures (données publiques)

CREATE POLICY "Admins can manage procedures"
  ON public.procedures
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Table: dce
CREATE POLICY "Users can view own DCE"
  ON public.dce
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own DCE"
  ON public.dce
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own DCE"
  ON public.dce
  FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert DCE"
  ON public.dce
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Table: dce_versions
CREATE POLICY "Users can view own DCE versions"
  ON public.dce_versions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.dce d
      WHERE d.id = dce_versions.dce_id
      AND d.user_id = auth.uid()
    )
  );
```

---

## 📊 Indicateurs de Succès

| KPI | Cible | Vérification |
|-----|-------|-------------|
| **Réduction saisies** | -70% | Nombre de champs saisis 1 seule fois |
| **Temps création DCE** | -50% | Chronométrage avant/après |
| **Taux rétention données** | 100% | 0 perte lors changement module |
| **Satisfaction UX** | >4/5 | Questionnaire utilisateur |
| **Performance** | <500ms | Temps réponse API Supabase |
| **Couverture types** | 100% | Tout est TypeScript |

---

## 🚀 Déploiement Progressif

### Phase 1 (Semaine 1)
```
✅ Infra (DB + Types + Services)
✅ Composants publics (Selector, Header)
Ancien système = encore opérationnel
```

### Phase 2 (Semaine 2-3)
```
✅ Modules modulaires (Réglement, Acte, CCAP, CCTP)
✅ Page maître (DCEComplet) parallèle à l'ancien système
Ancien système = feature flag pour off
```

### Phase 3 (Semaine 4)
```
✅ Migration données existantes
✅ Tests intégration complète
Ancien système = suppression
```

### Phase 4 (Semaine 5)
```
✅ Optimisation performance
✅ Documentation finale
✅ Formation utilisateurs
```

---

## ✅ Checklist de Conformité

- [ ] Respecte architecture Supabase (RLS, Auth)
- [ ] Pas de données dupliquées en client
- [ ] Versioning pour audit trail
- [ ] Validation des champs obligatoires
- [ ] Gestion erreurs robuste (offline, timeout, etc.)
- [ ] Accessible (WCAG AA minimum)
- [ ] Performance >60fps
- [ ] Tests unitaires (services)
- [ ] Tests E2E (workflows)
- [ ] Documentation complète
