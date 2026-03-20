# Analyse de cohérence inter-modules et stratégie de données partagées

> Document de travail — 2026-03-20
> Périmètre : chaîne complète Projet → DCE → Ouverture des plis → AN01 → Rapport de Présentation

---

## 1. La chaîne de valeur métier — ce qu'elle produit

```
[FICHE PROJET]
     │
     ├─ Identité de la procédure (acheteur, objet, montant estimé, dates)
     ├─ Numéro de procédure AFPA (num_proc 5 chiffres) ← clé commune
     └─ Définition des lots
          │
          ▼
[DCE — Dossier de Consultation]
     │
     ├─ Règlement de Consultation → critères de sélection, pondérations
     ├─ AE / CCTP / CCAP / BPU / DQE par lot
     └─ Cadre attendu des réponses candidats
          │
          ▼
[OUVERTURE DES PLIS]
     │
     ├─ Liste définitive des candidats (dépôts validés)
     ├─ Recevabilité administrative (DC1, DC2, assurances)
     └─ Recevabilité technique par lot (offre acceptable / infructueux)
          │
          ▼
[ANALYSE AN01]
     │
     ├─ Notation financière par lot (normalisée sur la moins-disante)
     ├─ Notation technique par lot (pondération des critères du RC)
     ├─ Score final pondéré = sélection de l'attributaire pressenti
     └─ Statistiques : économies, écarts, palmarès
          │
          ▼
[RAPPORT DE PRÉSENTATION]
     │
     └─ Synthèse documentaire de toute la chaîne ci-dessus
        → transmis à l'acheteur pour signature et notification
```

Le rapport de présentation est donc la **lecture finale d'une base de données déjà complète**. Il ne doit produire aucune donnée propre — il les agrège et les formate.

---

## 2. Diagnostic de cohérence — état actuel

### 2.1 Les candidats vivent dans quatre endroits différents

| Étape | Où sont les candidats | Format | Persisté |
|---|---|---|---|
| Registre dépôts/retraits | `procédures.depots`, `procédures.retraits` | JSONB-as-string | Oui |
| Ouverture des plis | `ouverture_plis.candidats` | JSONB structuré | Oui |
| AN01 Saisie Wizard | `AN01Project.lots[].candidates[]` | Objet React en mémoire | **Non** |
| AN01 Upload Excel | `an01Data` (state React) | Objet React en mémoire | **Non** |

Conséquence directe : une même entreprise peut avoir quatre orthographes différentes, aucun SIRET commun, et le rapport ne peut pas les réconcilier fiablement.

### 2.2 La liste des lots est reconstruite à chaque module

Les lots sont définis dans le DCE (`dce.configuration_globale`). Mais chaque module suivant reconstitue sa propre liste de lots :

- **Ouverture des plis** : saisit manuellement les lots par l'utilisateur
- **AN01 Saisie Wizard** : charge les lots via `useDCELots` (bonne pratique, mais optionnel)
- **AN01 Upload Excel** : les lots sont inférés du fichier Excel

Si le DCE définit 3 lots et que l'utilisateur en saisit 4 dans l'AN01, le rapport présentera 4 lots sans avertissement.

### 2.3 Les critères de pondération sont définis deux fois

- **DCE / Règlement de Consultation** : critères de sélection avec pondérations (ex : technique 60%, prix 40%)
- **AN01** : l'utilisateur ressaisit ces pondérations (`financial_weight`, critères techniques)

Ces deux sources ne sont jamais comparées. Un écart de pondération entre le RC publié et l'analyse AN01 constitue une non-conformité juridique dans un marché public.

### 2.4 Aucun signal de complétion entre modules

L'utilisateur doit mentalement savoir que :
1. Le DCE est publié avant d'ouvrir les plis
2. L'ouverture des plis est terminée avant de lancer l'AN01
3. L'AN01 est terminé avant de générer le rapport

Il n'existe aucun indicateur dans l'UI (statut, badge, blocage) qui matérialise ces dépendances.

### 2.5 La TVA est renseignée à deux endroits

- Dans la fiche projet / procédure : `Taux TVA` (si présent)
- Dans l'AN01 : `metadata.tva_rate` (ressaisi par l'utilisateur)

Si elles divergent, le rapport calcule des montants TTC incorrects. Il n'y a pas de validation croisée.

---

## 3. Modèle de données unifié — ce qui devrait changer

### 3.1 Principe : une seule écriture, plusieurs lectures

```
ÉCRITURE                    LECTURES
────────                    ────────
projets                ──►  DCE (infos procédure)
                       ──►  Ouverture des plis (titre, acheteur, dates)
                       ──►  AN01 (même infos)
                       ──►  Rapport (section 1 : contexte)

dce.configuration_globale ──►  Ouverture des plis (liste des lots)
                          ──►  AN01 (liste des lots)
                          ──►  Rapport (section 3 : DCE)

dce.reglement_consultation ──►  AN01 (critères de pondération)
                           ──►  Rapport (section 3 + section 6)

ouverture_plis ──►  AN01 (liste des candidats recevables par lot)
               ──►  Rapport (sections 2, 5, 7)

an01_analyses  ──►  Rapport (sections 6, 7, 8, 9)
```

### 3.2 Table `an01_analyses` — à créer

La donnée AN01 doit être persistée. Structure proposée :

```sql
CREATE TABLE public.an01_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_proc     TEXT NOT NULL,
  lot_numero   TEXT NOT NULL,              -- identifiant du lot (ex : '1', '2', 'lot-3')
  lot_nom      TEXT,                       -- libellé lisible
  metadata     JSONB,                      -- { tva, poidsTechnique, poidsFinancier, criteresRC }
  offres       JSONB,                      -- [{ name, siret, technique, financier, total, isRejected }]
  stats        JSONB,                      -- { winner, savingAmount, savingPercent, average }
  source       TEXT,                       -- 'upload_excel' | 'saisie_wizard'
  version      INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(num_proc, lot_numero, version)
);
```

### 3.3 Champs à ajouter dans `rapports_presentation`

```sql
ALTER TABLE public.rapports_presentation ADD COLUMN IF NOT EXISTS
  sections_editees   JSONB DEFAULT '{}',   -- { "3": true, "4": true }
  sections_data      JSONB DEFAULT '{}',   -- { "1": "...", "2": "..." } contenu HTML par section
  sources_snapshot   JSONB DEFAULT '{}';   -- snapshot horodaté des sources utilisées
```

---

## 4. Stratégie de saisie — éviter la ressaisie et les doublons

### 4.1 Flux recommandé par étape

#### Étape 0 : Fiche projet / procédure
- Saisit : nom procédure, acheteur, objet, montant estimé HT, taux TVA, dates
- **Produit** : `num_proc`, fiche de référence pour tous les modules suivants
- **Ne doit jamais être ressaisi** dans les modules suivants

#### Étape 1 : DCE
- Importe depuis la fiche projet : acheteur, objet, dates, montant estimé
- **Produit** :
  - `dce.configuration_globale` → liste des lots (numéro, libellé, nature)
  - `dce.reglement_consultation` → critères de sélection avec pondérations

#### Étape 2 : Ouverture des plis
- Importe depuis le DCE : liste des lots (`useDCELots` — déjà implémenté)
- **Saisit** : les entreprises candidates par lot (raison sociale, SIRET, statut recevabilité)
- **Produit** : liste canonique des candidats recevables par lot

#### Étape 3 : AN01
- Importe depuis le DCE : liste des lots + critères de pondération du RC
- Importe depuis l'ouverture des plis : liste des candidats recevables par lot (pré-rempli)
- **Saisit** : scores techniques et montants financiers par candidat et par lot
- **Produit** : `an01_analyses` (persisté en base)

#### Étape 4 : Rapport de Présentation
- Lit tout depuis les tables — aucune saisie utilisateur pour les sections générées
- **Saisit** : uniquement les sections 4 (Q&R) et 10 (calendrier) qui sont purement narratives
- **Produit** : rapport PDF signé

### 4.2 Tableau de saisie unique vs ressaisie

| Donnée | Saisie unique à | Lue dans |
|---|---|---|
| Numéro de procédure | `projets` | DCE, ouverture_plis, AN01, rapport |
| Acheteur | `projets` | DCE (import), rapport |
| Objet de la consultation | `projets` | DCE (import), rapport |
| Montant estimé HT | `projets` | AN01 (référence), rapport |
| Taux TVA | `projets` | AN01 (import), rapport |
| Dates (lancement, remise) | `projets` | DCE (import), rapport |
| Définition des lots | `dce.configuration_globale` | ouverture_plis, AN01, rapport |
| Critères de pondération | `dce.reglement_consultation` | AN01 (import), rapport |
| Liste des candidats | `ouverture_plis.candidats` | AN01 (pré-rempli), rapport |
| Recevabilité | `ouverture_plis.recevabilite` | rapport |
| Scores et notes | `an01_analyses.offres` | rapport |
| Attributaire pressenti | `an01_analyses.stats.winner` | rapport |

---

## 5. Mécanismes de cohérence à implémenter

### 5.1 Statut de complétion par module

Ajouter un champ `statut` structuré dans les tables clés :

```
projets       → statut : 'brouillon' | 'actif' | 'clos'
dce           → statut : 'brouillon' | 'publie' | 'archive'  (déjà présent)
ouverture_plis → statut : 'brouillon' | 'en_cours' | 'valide' | 'archive'  (déjà présent)
an01_analyses  → statut : 'brouillon' | 'valide'  (à ajouter)
rapports_presentation → statut : 'brouillon' | 'en_revision' | 'valide' | 'publie'  (déjà présent)
```

### 5.2 Panneau de dépendances dans le rapport

Le composant `RapportSourcesPanel` (à créer) doit afficher avant toute génération :

```
┌─────────────────────────────────────────────────────┐
│  Sources pour la procédure 12345                    │
├────────────────────────┬────────────────────────────┤
│ Fiche projet           │ ✓ Complète                 │
│ DCE                    │ ✓ Publié — 3 lots définis  │
│ Ouverture des plis     │ ✓ Validée — 5 candidats    │
│ AN01 — Lot 1           │ ✓ Sauvegardé               │
│ AN01 — Lot 2           │ ✓ Sauvegardé               │
│ AN01 — Lot 3           │ ⚠ Manquant                 │
└────────────────────────┴────────────────────────────┘
  → Génération partielle possible (lot 3 sera vide)
```

### 5.3 Validation des pondérations avant génération

Avant de générer les sections 6 et 7 du rapport :
- Lire les pondérations dans `dce.reglement_consultation`
- Lire les pondérations dans `an01_analyses.metadata`
- Si écart > 0 : afficher un avertissement bloquant ou une demande de confirmation

### 5.4 Identifiant SIRET comme clé de réconciliation des candidats

L'ouverture des plis collecte les SIRET. L'AN01 nomme les candidats. En utilisant le SIRET comme clé de jointure :
- Pré-remplir automatiquement les noms d'entreprises dans l'AN01 depuis l'ouverture des plis
- Éviter les variantes orthographiques entre modules
- Permettre au rapport de présenter un nom unique par entreprise

---

## 6. Implémentation — ordre de priorité

### Priorité 1 : Fondations de données (sans impact UI)

1. Créer la table `an01_analyses` avec SIRET dans les offres
2. Modifier `rapports_presentation` (colonnes `sections_editees`, `sections_data`, `sources_snapshot`)
3. Ajouter le champ `taux_tva` dans `projets` s'il n'existe pas
4. Ajouter le champ `statut` dans `an01_analyses`

### Priorité 2 : Import des pondérations DCE dans AN01

Modifier le module AN01 Saisie Wizard pour :
- Proposer le chargement des critères depuis `dce.reglement_consultation`
- Pré-remplir `poidsTechnique`, `poidsFinancier`, `criteresRC` depuis le DCE
- Afficher un badge "Conforme au RC" / "⚠ Diverge du RC" si modifié manuellement

### Priorité 3 : Import des candidats OP dans AN01

Modifier le module AN01 Saisie Wizard pour :
- Charger automatiquement la liste des candidats recevables depuis `ouverture_plis.candidats`
- Pré-remplir les lignes candidats par lot (nom, SIRET)
- Permettre à l'utilisateur d'ajouter ou supprimer (cas de rectification)

### Priorité 4 : Persistance AN01

- Sauvegarder automatiquement l'état AN01 dans `an01_analyses` (auto-save comme pour l'ouverture des plis)
- En cas d'upload Excel : parser → sauvegarder → afficher confirmation

### Priorité 5 : Refonte du rapport de présentation

Sur la base des données maintenant propres et persistées :
- Implémenter le `RapportSourcesPanel`
- Génération section par section depuis les sources uniques
- Fusion édits manuels / régénération
- Export PDF

---

## 7. Ce qu'il ne faut pas faire

- **Ne pas créer une table `candidats` centralisée** : les candidats ont des statuts différents selon la phase (recevable en OP, rejeté en AN01 pour offre anormalement basse) — `ouverture_plis` reste la référence pour la phase administrative, `an01_analyses` pour la phase technique
- **Ne pas coupler les modules par des events ou des stores globaux** : la communication doit passer par Supabase (source de vérité partagée), pas par des états React transversaux
- **Ne pas bloquer l'utilisateur** si une source est manquante : générer ce qui est disponible, signaler ce qui manque
- **Ne pas toucher au module DCE** pour cette refonte : il produit déjà les bonnes données, il faut seulement mieux les consommer

---

## 8. Prompt pour agent IA — implémentation

Le prompt ci-dessous est destiné à Claude Code ou un agent équivalent. Il couvre les priorités 1 à 4 (fondations + cohérence AN01 ↔ DCE ↔ OP). La priorité 5 (refonte rapport) est couverte dans le document `refonte-rapport-presentation.md`.

---

```
## Contexte

Tu travailles sur une application React + TypeScript + Supabase de gestion de procédures d'appels d'offres publics. L'application comporte ces modules principaux :

- `projets` : fiche projet / procédure (table `projets`)
- `dce` : dossier de consultation (tables `dce`, `actes_engagement`, etc.)
- `ouverture_plis` : analyse des candidatures (table `ouverture_plis`)
- `an01` : analyse technique et financière (actuellement sans table dédiée)
- `rapport_presentation` : rapport de synthèse final (table `rapports_presentation`)

La clé commune entre tous les modules est `num_proc` (5 chiffres AFPA, extrait de `projets['Numéro de procédure (Afpa)']`).

## Objectif général

Améliorer la cohérence inter-modules pour éviter les ressaisies et les divergences de données. Le rapport de présentation est la résultante de tous les modules précédents — il doit pouvoir lire des données déjà structurées et validées dans chaque module.

## Tâche 1 — Migration SQL

### 1.1 Créer la table `an01_analyses`

```sql
CREATE TABLE public.an01_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_proc     TEXT NOT NULL,
  lot_numero   TEXT NOT NULL,
  lot_nom      TEXT,
  metadata     JSONB DEFAULT '{}',
  -- { tva: number, poidsTechnique: number, poidsFinancier: number,
  --   criteresRC: [{ nom: string, poids: number }],
  --   consultation: string, date: string }
  offres       JSONB DEFAULT '[]',
  -- [{ name: string, siret: string, technique: number, financier: number,
  --    total: number, isRejected: boolean, rejectionReason?: string }]
  stats        JSONB DEFAULT '{}',
  -- { winner: string, savingAmount: number, savingPercent: number, average: number }
  source       TEXT CHECK (source IN ('upload_excel', 'saisie_wizard')),
  statut       TEXT DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'valide')),
  version      INTEGER DEFAULT 1,
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX ON public.an01_analyses(num_proc, lot_numero, version);

ALTER TABLE public.an01_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage an01_analyses"
  ON public.an01_analyses FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 1.2 Modifier `rapports_presentation`

```sql
ALTER TABLE public.rapports_presentation
  ADD COLUMN IF NOT EXISTS sections_editees  JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sections_data     JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sources_snapshot  JSONB DEFAULT '{}';
```

### 1.3 Ajouter `taux_tva` dans `projets` si absent

Vérifier d'abord si la colonne existe avant de l'ajouter :

```sql
ALTER TABLE public.projets ADD COLUMN IF NOT EXISTS taux_tva NUMERIC(5,2);
```

## Tâche 2 — Hook `useAN01Analyses`

Créer le fichier `hooks/useAN01Analyses.ts` avec les fonctions suivantes :

```typescript
interface AN01AnalysisRecord {
  id: string;
  num_proc: string;
  lot_numero: string;
  lot_nom: string | null;
  metadata: Record<string, unknown>;
  offres: unknown[];
  stats: Record<string, unknown>;
  source: 'upload_excel' | 'saisie_wizard';
  statut: 'brouillon' | 'valide';
  version: number;
  created_at: string;
  updated_at: string;
}

// Fonctions à implémenter :
// - loadByNumProc(num_proc: string): Promise<AN01AnalysisRecord[]>
//   → charge toutes les analyses pour une procédure (toutes versions, tous lots)
// - saveOrUpdate(record: Omit<AN01AnalysisRecord, 'id' | 'created_at' | 'updated_at'>): Promise<AN01AnalysisRecord>
//   → upsert avec gestion de version (si version existe → créer nouvelle version)
// - deleteByLot(num_proc: string, lot_numero: string): Promise<void>
// - updateStatut(id: string, statut: 'brouillon' | 'valide'): Promise<void>
```

Contraintes :
- Pas d'appel Supabase direct dans les composants, toujours passer par ce hook
- Gérer les états loading / error / data
- Pas de console.log en production (utiliser `if (import.meta.env.DEV) console.log(...)`)

## Tâche 3 — Import DCE → AN01 : pondérations du RC

Dans le module AN01 Saisie Wizard (`components/an01/components/An01SaisieWizard.tsx` ou équivalent), à l'étape où l'utilisateur définit les pondérations techniques/financières :

1. Ajouter un bouton "Charger depuis le RC" qui lit `dce.reglement_consultation` pour ce `num_proc`
2. Extraire les champs suivants si présents dans le RC :
   - `poidsFinancier` (ou champ équivalent) → remplir `metadata.poidsFinancier`
   - `poidsTechnique` (ou champ équivalent) → remplir `metadata.poidsTechnique`
   - Liste des critères techniques avec leurs pondérations → remplir `metadata.criteresRC`
3. Afficher un badge de conformité :
   - "✓ Conforme au RC" si les pondérations correspondent à celles du DCE
   - "⚠ Diverge du RC — vérifier avant validation" si l'utilisateur a modifié manuellement

Ne pas bloquer la saisie si le DCE est absent : afficher un message informatif "DCE non trouvé pour cette procédure" et permettre la saisie libre.

Note : lire le DCE en SQL via `SELECT reglement_consultation FROM dce WHERE numero_procedure = $num_proc LIMIT 1`. Adapter la clé si le champ s'appelle différemment.

## Tâche 4 — Import Ouverture des Plis → AN01 : candidats pré-remplis

Dans le module AN01 Saisie Wizard, à l'étape de saisie des candidats par lot :

1. Au chargement du lot, lire automatiquement `ouverture_plis` pour ce `num_proc`
2. Extraire les candidats dont le statut est `recevable: true` (ou équivalent) pour ce lot
3. Pré-remplir la liste des candidats avec : raison sociale, SIRET (si disponible)
4. Afficher un badge "Importé depuis l'Ouverture des Plis — N candidats recevables"
5. Permettre à l'utilisateur d'ajouter des candidats supplémentaires ou d'en supprimer

Si l'ouverture des plis est absente ou non validée : afficher un avertissement mais permettre la saisie libre.

Structure de `ouverture_plis.candidats` à consulter :
- C'est un JSONB qui contient une liste de candidats avec leurs statuts par lot
- Adapter la lecture à la structure réelle trouvée dans la table

## Tâche 5 — Auto-save AN01 dans `an01_analyses`

Dans le module AN01 (Saisie Wizard et Upload Excel) :

1. **Saisie Wizard** : à chaque modification significative (changement d'une note, d'un montant), déclencher un debounced auto-save (500ms) via `useAN01Analyses.saveOrUpdate()`
2. **Upload Excel** : après parsing du fichier, déclencher immédiatement la sauvegarde dans `an01_analyses`
   - Si une entrée existe déjà pour ce `(num_proc, lot_numero)` : afficher une boîte de dialogue "Une analyse existe déjà pour le lot X. Écraser / Créer une nouvelle version / Annuler"
3. Afficher un indicateur de sauvegarde (analogue à ce qui existe dans l'ouverture des plis)

Réutiliser l'utilitaire de parsing Excel existant (`components/an01/utils/parseExcelFile.ts`) — ne pas en créer un nouveau.

## Contraintes techniques à respecter

- TypeScript strict — pas de `any` sauf pour les données JSONB brutes de Supabase
- Pas de console.log en production
- Tout HTML injecté via `dangerouslySetInnerHTML` doit être sanitisé avec DOMPurify
- Pas d'appel Supabase dans les composants — passer par des hooks
- Gérer explicitement les états : chargement / disponible / manquant / erreur
- Ne pas modifier les modules DCE et Ouverture des Plis — le AN01 lit leurs données en lecture seule

## Ce qu'il ne faut PAS faire

- Ne pas créer une table `candidats` centralisée — les candidats ont des statuts différents selon la phase
- Ne pas créer de store Zustand global inter-modules — la communication passe par Supabase
- Ne pas bloquer l'utilisateur si une source est absente — signaler et permettre la saisie manuelle
- Ne pas toucher aux exports PDF existants

## Livraison attendue

1. Fichier de migration SQL (`sql/migrations/YYYYMMDD_an01_cohesion.sql`)
2. Hook `hooks/useAN01Analyses.ts`
3. Modifications du composant AN01 Saisie Wizard pour les tâches 3, 4, 5
4. Modifications du gestionnaire d'upload Excel AN01 pour la tâche 5
```

---

## 9. Ce document en relation avec les autres analyses

| Document | Lien |
|---|---|
| `docs/refonte-rapport-presentation.md` | Refonte complète du module rapport — à faire après ce travail de cohérence |
| `docs/analyse-rapport-presentation-supabase.md` | Analyse Supabase du module rapport |
| `docs/ARCHITECTURE_LOTS.md` | Architecture multi-lots du DCE |
| `docs/AUDIT_ARCHITECTURE.md` | Audit complet de l'architecture |

L'ordre d'exécution recommandé est :
1. **Ce document** — fondations de cohérence (migration SQL + import DCE→AN01 + import OP→AN01 + auto-save AN01)
2. **`refonte-rapport-presentation.md`** — refonte du rapport, qui peut maintenant lire des données propres et persistées
