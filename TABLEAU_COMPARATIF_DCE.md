# 📊 TABLEAU COMPARATIF DÉTAILLÉ - Architecture DCE

## Synthèse Visuelle : AVANT vs APRÈS

### 1️⃣ Expérience Utilisateur

#### AVANT (Fragmenté)

```
UTILISATEUR CRÉE DCE
│
├─ "Où commencer ?"
│  └─ Va dans Rédaction → DCE → ???
│
├─ Clique "Réglement de Consultation"
│  ├─ Affichage modal/page
│  ├─ Saisit : numéro, titre, acheteur, montant, etc.
│  ├─ Enregistre (ou oublie)
│  └─ Revient
│
├─ Clique "Acte d'Engagement"
│  ├─ MÊME ÉCRAN RECOMMENCE
│  ├─ "Où saisir le numéro ?"
│  ├─ "Qui est l'acheteur ?"
│  ├─ Re-saisit infos déjà saisies ❌
│  └─ Perte de temps
│
├─ Clique "CCAP"
│  ├─ Même problème...
│  └─ Frustration croissante ❌
│
└─ "Quand j'ai sauvegardé ?"
   └─ Données où ? Pas de repère... ❌
```

#### APRÈS (Centralisé)

```
UTILISATEUR CRÉE DCE
│
├─ Saisit : numéro procédure "01000"
│  └─ Appui "Charger" (ou auto-load)
│
├─ ✅ TOUTES infos apparaissent automatiquement
│  ├─ Acheteur : Lauriane Malard ✅
│  ├─ Titre : MOE-EXT-DIJON ✅
│  ├─ Montant : 70 000€ ✅
│  ├─ Dates : auto-remplies ✅
│  └─ CPV : auto-rempli ✅
│
├─ Clique Tab "Réglement"
│  └─ Formulaire PRÉ-REMPLI ✅ (pas de re-saisie)
│
├─ Édite ce qui manque
│  ├─ Auto-sauvegarde ✅
│  └─ UI immédiate (pas de lag)
│
├─ Clique Tab "Acte"
│  └─ Données DÉJÀ LÀ ✅ (synchronisées)
│
├─ Barre de progrès
│  └─ "DCE 80% complet" - Je sais où j'en suis ✅
│
└─ Clique "Publier"
   └─ "DCE publié ✅" - Simple et clair ✅
```

---

### 2️⃣ Gestion des Données

#### AVANT (Redondante)

```
Base Supabase (fragmentée)
│
├─ reglements_consultation table
│  ├─ id: 123
│  ├─ numero_procedure: '01000'
│  ├─ titre_marche: "MOE-EXT-DIJON"
│  ├─ acheteur: "Lauriane Malard"  ← REDONDANT
│  ├─ montant: "70000"             ← REDONDANT
│  └─ ...
│
├─ noti1 table
│  ├─ id: 456
│  ├─ numero_procedure: '01000'
│  ├─ titre_marche: "MOE-EXT-DIJON"
│  ├─ acheteur: "Lauriane Malard"  ← REDONDANT (encore!)
│  ├─ montant: "70000"             ← REDONDANT (encore!)
│  └─ ...
│
├─ acte_engagement table (si créée)
│  ├─ id: 789
│  ├─ numero_procedure: '01000'
│  ├─ titre_marche: "MOE-EXT-DIJON"
│  ├─ acheteur: "Lauriane Malard"  ← REDONDANT (x3!)
│  └─ ...
│
└─ ❌ PROBLÈME : Si acheteur change → UPDATE 3+ tables !
```

#### APRÈS (Centralisé)

```
Base Supabase (source unique)
│
├─ procedures table (source de vérité)
│  ├─ id: proc-123
│  ├─ numero_procedure: '01000'
│  ├─ titre_marche: "MOE-EXT-DIJON"
│  ├─ acheteur: "Lauriane Malard"  ✅ SOURCE UNIQUE
│  ├─ montant: "70000"             ✅ SOURCE UNIQUE
│  └─ ...
│
├─ dce table (agrège tous les modules)
│  ├─ id: dce-456
│  ├─ procedure_id: proc-123  ← LIAISON
│  ├─ numero_procedure: '01000'
│  ├─ reglement_consultation: {...}  ← Références proc-123
│  ├─ acte_engagement: {...}         ← Références proc-123
│  ├─ ccap: {...}                    ← Références proc-123
│  ├─ cctp: {...}
│  ├─ bpu: {...}
│  ├─ dqe: {...}
│  └─ documents_annexes: {...}
│
└─ ✅ AVANTAGE : Si acheteur change → UPDATE procedures + done !
   (DCE utilise référence, pas copie)
```

---

### 3️⃣ Architecture Code

#### AVANT (Fragmentée)

```
components/redaction/
├── ReglementConsultation.tsx
│   ├── useState(formData)
│   ├── manual fill logic
│   ├── save to supabase (direct)
│   └── ❌ Pas de liaison avec autre modules
│
├── ActeEngagement.tsx
│   ├── useState(formData) ← STATE DUPLIQUÉ
│   ├── manual fill logic ← LOGIC DUPLIQUÉE
│   ├── save to supabase (different) ← PATTERN DUPLIQUÉ
│   └─ ❌ Pas de données du Réglement
│
├── CCAP/
│   ├── useState(formData) ← STATE DUPLIQUÉ x3
│   ├── manual fill logic ← LOGIC DUPLIQUÉE x3
│   └─ ❌ Pas d'auto-remplissage
│
└── ... (repeated patterns = DRY violation)

services/
├── procedureAutoFill.ts ← Ad-hoc
├── reglementConsultationStorage.ts ← Spécifique
├── noti1Storage.ts ← Spécifique
└── ❌ Pas de hub central
```

#### APRÈS (Centralisé & DRY)

```
components/redaction/
├── DCEComplet.tsx ← PAGE MAÎTRE (orchestration)
│   ├── <ProcedureSelector />
│   ├── <ProcedureHeader />
│   ├── <Tabs>
│   │   ├─ <ReglementModule />
│   │   ├─ <ActeModule />
│   │   └─ ...
│   └── useDCEState() ← ÉTAT CENTRALISÉ ✅
│
├── modules/
│   ├── ReglementConsultationModule.tsx
│   │   ├── useReglement() hook
│   │   └── data from useDCEState ✅
│   │
│   ├── ActeEngagementModule.tsx
│   │   ├── useActe() hook
│   │   └── data from useDCEState ✅
│   │
│   └── ... (patterns consistents)
│
├── shared/
│   ├── ProcedureSelector.tsx ← RÉUTILISABLE
│   ├── ProcedureHeader.tsx
│   └── DCEStatusBar.tsx ✅ COMPOSANTS RÉUTILISABLES
│
└── services/
    └── dceService.ts ← HUB CENTRAL ✅
        ├─ loadDCE()
        ├─ createDCE()
        ├─ updateSection()
        └─ publishDCE()

hooks/
├── useDCEState.ts ← STATE CENTRALISÉ ✅
├── useProcedureLoader.ts ← RÉUTILISABLE
└── ... (hooks génériques, réutilisables)
```

---

### 4️⃣ Persistance & Synchronisation

#### AVANT (Ad-hoc)

```
ReglementConsultation.tsx:
├─ setState({...})  ← Local state
├─ onClick "Sauvegarder"
│  └─ reglementConsultationStorage.saveRC()
│     └─ INSERT/UPDATE reglements_consultation table
│
ActeEngagement.tsx:
├─ setState({...})  ← LOCAL STATE INDÉPENDANT
├─ onClick "Sauvegarder"
│  └─ acteEngagementStorage.saveAE()
│     └─ INSERT/UPDATE acte_engagement table
│
❌ PROBLÈME :
├─ Changements dans Réglement → pas synchronisés à Acte
├─ État fragmenté
├─ Pas de history
└─ Utilisateur peut perdre du travail en changeant tab
```

#### APRÈS (Centralisé & Synchronisé)

```
DCEComplet.tsx:
├─ useDCEState(numeroProcedure)
│  └─ state = {
│       reglement_consultation: {...},
│       acte_engagement: {...},
│       ccap: {...},
│       ... (tous les modules)
│     }
│
ReglementModule.tsx:
├─ onChange field
│  ├─ setState (optimistic UI) ← IMMÉDIAT
│  └─ dceService.updateSection('reglement_consultation', data)
│     ├─ UPDATE dce table (async)
│     ├─ Créer version (optionnel)
│     └─ À la fin → useDCEState se met à jour
│
ActeModule.tsx:
├─ onChange field
│  └─ Même pattern
│
✅ AVANTAGES :
├─ État unique = source de vérité
├─ Changements immédiatement visibles
├─ Synchronisation automatique
├─ Versioning possible
└─ Zéro perte de données
```

---

### 5️⃣ Auto-Remplissage & Mapping

#### AVANT (Dispersé)

```
procedureAutoFill.ts:
├─ PROCEDURE_TO_RC_MAPPING = { ... }
│  └─ Mapping statique, incomplete
├─ fetchProcedureByNumeroCourt()
│  └─ Logique complexe, ad-hoc
├─ mapProcedureToRC()
│  └─ Conversion manuelle
└─ ❌ Utilisé SEULEMENT pour Réglement
   (pas pour Acte, pas pour CCAP, etc.)

ReglementConsultation.tsx:
├─ <ProcedureSelector /> (custom input)
│  └─ Recherche manuelle
├─ onClick "Auto-remplir"
│  └─ autoFillRCFromProcedure()
│     └─ Charge depuis API, maps manuellement
└─ ❌ PROBLÈME :
   ├─ Logic fragile et ad-hoc
   ├─ Utilisé par 1 module seulement
   ├─ Difficile de tester
   └─ Difficile à maintenir
```

#### APRÈS (Centralisé & Générique)

```
useProcedureLoader.ts:
├─ Valider format numéro (5 chiffres)
├─ Fetch procédures table
│  └─ SELECT * WHERE numero_procedure = '01000'
├─ Charger DCE existant (si existe)
│  └─ SELECT * FROM dce WHERE numero_procedure
├─ Auto-map procédure → toutes les sections
│  └─ dceMapping.mapProcedureToDCE()
│     ├─ Appliquer PROCEDURE_TO_RC_MAPPING
│     ├─ Appliquer PROCEDURE_TO_AE_MAPPING
│     ├─ Appliquer PROCEDURE_TO_CCAP_MAPPING
│     └─ ... (repeatable pour tous)
│
└─ ✅ AVANTAGES :
   ├─ Logic centralisée et réutilisable
   ├─ Utilisée par TOUS les modules
   ├─ Facile à tester (fonction pure)
   ├─ Facile à maintenir
   └─ Extensible (ajouter PROCEDURE_TO_CCTP_MAPPING, etc.)
```

---

### 6️⃣ Exports & Génération

#### AVANT (Décentralisé)

```
ReglementConsultation.tsx:
├─ onClick "Exporter"
│  └─ generateReglementConsultationWord()
│     └─ Génère 1 fichier Word
│
ActeEngagement.tsx:
├─ onClick "Exporter"
│  └─ generateActeEngagementWord()
│     └─ Génère 1 fichier Word (séparé)
│
CCAP:
├─ generateCCAPWord()
│
CCTP:
├─ generateCCTPWord()
│
... (x7 modules = x7 fichiers générés individuellement)

❌ PROBLÈME :
├─ Utilisateur doit exporter 7 fois
├─ Pas de fusion (7 fichiers separate)
├─ Pas de page de garde unique
├─ Pas de table des matières

❌ CODE :
├─ Logique export répétée
├─ Pas de cohérence (layout, styles, headers)
└─ Difficile à maintenir
```

#### APRÈS (Orchestré)

```
DCEComplet.tsx:
├─ <BottomBar>
│  ├─ Bouton "Exporter DCE"
│  │  └─ onClick()
│  │     ├─ dceExportService.generateExport({
│  │     │    format: 'word' | 'pdf' | 'zip',
│  │     │    modules: ['reglement', 'acte', 'ccap', ...]
│  │     │  })
│  │     │
│  │     ├─ Charger TOUS les modules depuis useDCEState
│  │     ├─ Générer page de garde + TOC
│  │     ├─ Générer chaque section
│  │     ├─ Fusionner en 1 document (ou ZIP)
│  │     └─ Télécharger
│  │
│  └─ Utilisateur clique 1 fois = 1 fichier cohérent ✅
│
dceExportService.ts:
├─ generateExport() ← ORCHESTRATION CENTRALE
│  ├─ generateReglementSection()
│  ├─ generateActeSection()
│  ├─ generateCCAPSection()
│  ├─ generateCCTPSection()
│  ├─ generateBPUSection()
│  ├─ generateDQESection()
│  └─ generateAnnexesSection()
│     └─ Fusionner tous les sections
│
✅ AVANTAGES :
├─ UX simple (1 clic = DCE complet)
├─ Cohérence garantie (styles, headers, numérotation)
├─ Extensible (ajouter sections facilement)
├─ Testable (chaque section en isolation)
└─ Maintenable (logic centralisée)
```

---

### 7️⃣ Flux Utilisateur - Journey Map

#### AVANT

```
Jour 1:
├─ 14:00 → Commence Réglement, saisit infos
├─ 14:45 → Voir les détails → MODAL/AUTRE PAGE
├─ 15:00 → "J'ai oublié où j'étais avant"
├─ 15:15 → Va ailleurs
│
Jour 2:
├─ 09:00 → "Où j'en suis ?"
├─ 09:15 → Recharge Réglement
├─ 09:30 → "Faut que je continue l'Acte"
├─ 09:35 → Change de module
├─ 09:50 → Re-saisit acheteur (oubli que c'est dans Réglement)
├─ 10:30 → "Données où ?" → aucune indication
│
Jour 3:
├─ Utilisateur abandonne → trop confus
└─ DCE jamais terminé ❌
```

#### APRÈS

```
Jour 1:
├─ 14:00 → Lance app → INPUT "01000"
├─ 14:01 → ✅ TOUTES données procédure apparaissent
├─ 14:02 → Tab "Réglement" → pré-rempli
├─ 14:15 → Tab "Acte" → pré-rempli aussi ✅
├─ 14:30 → "Je suis à 60% complet" (voir barre)
├─ 14:45 → Finish du jour
│
Jour 2:
├─ 09:00 → Lance app → INPUT "01000"
├─ 09:01 → ✅ Exact où j'ai laissé (état persisté)
├─ 09:02 → Continue Acte
├─ 09:30 → Tab "BPU" → template prêt
├─ 10:30 → "Exporter DCE" → 1 clic = fichier complet ✅
│
Jour 2.5:
├─ Utilisateur satisfait
└─ DCE complété et publié ✅✅✅
```

---

### 8️⃣ Maintenance & Scalabilité

#### AVANT (Difficile)

```
SCENARIO : Ajouter un nouveau champ "Descriptif commercial"

ReglementConsultation.tsx:
├─ interface RapportCommissionData
│  └─ Ajouter "descriptifCommercial: string"
├─ Formulaire
│  └─ <input /> pour ce champ
└─ Save logic
   └─ UPDATE reglements_consultation

ActeEngagement.tsx:
├─ REPEAT le code ❌ (duplicated effort)

CCAP.tsx:
├─ REPEAT le code ❌ (duplicated effort)

CCTP.tsx:
├─ REPEAT le code ❌ (duplicated effort)

❌ RÉSULTAT :
├─ 1 changement = modification 7 fichiers
├─ Facile de faire une erreur
├─ Difficile à tester
├─ Long à faire
└─ Fragile
```

#### APRÈS (Facile)

```
SCENARIO : Ajouter "Descriptif commercial"

dceTypes.ts:
├─ interface DCEState
│  ├─ reglement_consultation: RCData
│  └─ Ajouter au type RCData: "descriptifCommercial"

ReglementModule.tsx:
├─ Ajouter <input /> pour ce champ
├─ onChange → useDCEState.updateSection()

✅ C'EST TOUT ! ✅

RÉSULTAT :
├─ 1 changement = modification 2 fichiers (max)
├─ Difficile de faire une erreur (types fortement typés)
├─ Facile à tester
├─ Rapide
└─ Robust
```

---

### 9️⃣ État Pendant Édition

#### AVANT (Incertain)

```
Utilisateur édite ReglementConsultation
│
├─ onChange field
│  ├─ setState(locale)  ← Mise à jour local
│  └─ await reglementStorage.update()  ← Requête async
│
├─ Utilisateur voit changement immédiat (local state)
│
├─ Puis... attend requête
│  ├─ Si réussi → OK
│  └─ Si erreur → "Oops" = état inconsistent ❌
│
├─ Utilisateur change tab
│  └─ "Où est mon changement ?"
│     ├─ Si sauvegardé → OK
│     └─ Si pas sauvegardé → PERTE ❌
│
└─ ❌ PROBLÈME :
   └─ État fragile, incertain
```

#### APRÈS (Cohérent)

```
Utilisateur édite ReglementModule
│
├─ onChange field
│  ├─ useDCEState.reglementConsultation = {...updated}
│  │  └─ setState() → RE-RENDER immédiat ✅
│  │
│  ├─ Affichage mis à jour IMMÉDIATEMENT ✅
│  │
│  └─ Async dceService.updateSection()
│     ├─ Envoi requête Supabase (background)
│     ├─ Si réussi → Rien (déjà affiché)
│     ├─ Si erreur → Afficher toast "Erreur"
│     │            → Proposer retry
│     └─ État local = jamais perdu ✅
│
├─ Utilisateur change tab
│  ├─ Nouvel onglet charge depuis useDCEState
│  └─ Données TOUJOURS à jour ✅
│
└─ ✅ AVANTAGE :
   └─ État cohérent, jamais perdu, toujours synchronisé
```

---

### 🔟 Conclusion Comparative

| Dimension | AVANT | APRÈS |
|-----------|-------|-------|
| **Modules** | 7 isolés | 1 centralisé |
| **Saisies** | Redondantes (x3+) | Uniques |
| **État** | Fragmenté | Centralisé |
| **Synchronisation** | Manuelle | Automatique |
| **Perte données** | Risque élevé | Risque zéro |
| **Auto-remplissage** | Ad-hoc | Systématique |
| **Export** | x7 fichiers | 1 fichier |
| **Temps création** | ~2h | ~45min |
| **Maintenance** | Difficile | Facile |
| **Scalabilité** | Faible | Forte |
| **UX** | Confuse | Claire |
| **Code quality** | Duplicate | DRY |

---

**✅ VERDICT : Architecture proposée est NETTEMENT MEILLEURE sur tous les axes**
