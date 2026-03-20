# Prompt 02 — Refonte du module Rapport de Présentation

> **Instructions pour Claude Code.**
> Tu vas modifier cette application React + TypeScript + Supabase.
> Ce prompt est **autonome** : il contient tout ce qu'il faut pour travailler.
> Ne génère pas de résumé à la fin — le diff parle de lui-même.

---

## Prérequis BLOQUANT

**Ce prompt suppose que le prompt `01-cohesion-an01-foundations.md` a été exécuté.**

Avant de commencer, vérifie :
```sql
-- Via MCP Supabase : execute_sql
SELECT COUNT(*) FROM information_schema.tables
WHERE table_name = 'an01_analyses';
-- Doit retourner 1. Si 0 → exécuter d'abord le prompt 01.

SELECT column_name FROM information_schema.columns
WHERE table_name = 'rapports_presentation'
  AND column_name IN ('sections_editees', 'sections_data', 'sources_snapshot');
-- Doit retourner 3 lignes. Si moins → exécuter d'abord le prompt 01.
```

Si ces vérifications échouent, **arrête-toi et informe l'utilisateur**.

---

## Contexte métier (lis avant de toucher au code)

Le rapport de présentation est le document de synthèse final d'une procédure d'appel d'offres. Il est transmis à l'acheteur pour signature. Il contient 10 sections :

| Section | Contenu | Source principale |
|---|---|---|
| 1 — Contexte | Présentation de la procédure | `projets` |
| 2 — Déroulement | Dépôts, retraits, dates clés | `ouverture_plis` + `projets` |
| 3 — DCE | Liste des documents, critères RC | `dce.reglement_consultation` |
| 4 — Questions/Réponses | Échanges pendant la consultation | Manuel |
| 5 — Candidatures | Candidats, recevabilité | `ouverture_plis.candidats` |
| 6 — Méthodologie | Pondérations et critères | `an01_analyses.metadata` |
| 7 — Valeur des offres | Tableau des offres et scores | `an01_analyses.offres` + `projets` |
| 8 — Performance | Économies, écarts | `an01_analyses.stats` |
| 9 — Attribution | Attributaire pressenti | `an01_analyses.stats.winner` |
| 10 — Calendrier | Suite de la procédure | `projets` (dates) |

---

## Étape 0 — EXPLORATION OBLIGATOIRE

Avant d'écrire une seule ligne de code, lis ces fichiers :

1. `components/analyse/components/RapportPresentation.tsx` — composant actuel (entier)
2. `components/analyse/components/RapportPresentationPreview.tsx` — prévisualisation actuelle
3. `components/analyse/components/RapportPresentationPDF.tsx` — export PDF actuel
4. `components/analyse/utils/generateRapportData.ts` — logique de génération actuelle
5. `components/analyse/types/index.ts` — types du module rapport
6. `components/analyse/utils/rapportPresentationPdfExport.ts` — export PDF (à conserver tel quel)
7. `pages/RapportPresentationPage.tsx` — page d'entrée
8. `hooks/useAN01Analyses.ts` — hook créé dans le prompt 01
9. `hooks/useOuverturePlis.ts` — pour comprendre le pattern de chargement
10. `hooks/useDCELots.ts` — pour comprendre le chargement des lots
11. `sql/create-rapports-presentation.sql` — schéma existant

**Après la lecture, note :**
- La structure de `rapport_data` (JSONB) dans la table `rapports_presentation`
- Le format exact des sections dans `generateRapportData.ts`
- Quels champs de `projets` sont utilisés (noms exacts des colonnes, ex: `Acheteur`, `Nom de la procédure`)
- Si des `console.log` de débogage existent dans le code actuel

---

## Tâche 1 — Créer la structure de fichiers

Crée les dossiers et fichiers vides suivants (sans contenu pour l'instant, juste pour l'organisation) :

```
components/rapport-presentation/
  ├── RapportPresentationPage.tsx          (remplacera pages/RapportPresentationPage.tsx)
  ├── components/
  │   ├── RapportSourcesPanel.tsx
  │   ├── RapportSectionEditor.tsx
  │   ├── RapportPreview.tsx
  │   └── sections/
  │       ├── Section1Contexte.tsx
  │       ├── Section2Deroulement.tsx
  │       ├── Section3DCE.tsx
  │       ├── Section4QuestionsReponses.tsx
  │       ├── Section5Candidatures.tsx
  │       ├── Section6Methodologie.tsx
  │       ├── Section7Offres.tsx
  │       ├── Section8Performance.tsx
  │       ├── Section9Attribution.tsx
  │       └── Section10Calendrier.tsx
  ├── hooks/
  │   ├── useRapportSources.ts
  │   ├── useRapportGeneration.ts
  │   └── useRapportPersistence.ts
  ├── utils/
  │   ├── generateSection.ts
  │   ├── mergeSections.ts
  │   └── exportPdf.ts
  └── types/
      └── index.ts
```

---

## Tâche 2 — Types `components/rapport-presentation/types/index.ts`

Crée ce fichier de types. Base-toi sur les types existants dans `components/analyse/types/index.ts` — adapte sans dupliquer :

```typescript
// Les sources disponibles pour une procédure
export interface RapportSources {
  numProc: string;
  projet: ProjetSource | null;
  dce: DCESource | null;
  ouverturePlis: OuverturePlisSource | null;
  an01: AN01Source[];   // un enregistrement par lot
}

export interface ProjetSource {
  // Reprend les champs réels de la table projets utilisés par le rapport.
  // À définir après avoir lu RapportPresentation.tsx (Étape 0).
  nomProcedure: string;
  acheteur: string;
  // ... autres champs utilisés
}

export interface DCESource {
  lots: Array<{ numero: string; intitule: string }>;
  documentsRC: string[];
  criteresRC: Array<{ nom: string; poids: number }>;
  poidsTechnique: number;
  poidsFinancier: number;
}

export interface OuverturePlisSource {
  candidats: CandidatOP[];
  raisonInfructuosite?: string;
  lotsInfructueux?: string[];
}

export interface CandidatOP {
  societe: string;
  siret?: string;
  lot?: string;
  admisRejete?: string;
  motifRejet?: string;
}

export interface AN01Source {
  lotNumero: string;
  lotNom: string | null;
  metadata: {
    tva?: number;
    poidsTechnique?: number;
    poidsFinancier?: number;
    criteresRC?: Array<{ nom: string; poids: number }>;
  };
  offres: AN01Offre[];
  stats: {
    winner?: string;
    savingAmount?: number;
    savingPercent?: number;
    average?: number;
  };
}

export interface AN01Offre {
  name: string;
  siret?: string;
  technique: number;
  financier: number;
  total: number;
  isRejected: boolean;
  rejectionReason?: string;
}

// Statut de disponibilité d'une source
export type SourceStatus = 'disponible' | 'partielle' | 'manquante';

export interface SourceStatusMap {
  projet: SourceStatus;
  dce: SourceStatus;
  ouverturePlis: SourceStatus;
  an01: SourceStatus;
  an01ParLot: Record<string, SourceStatus>;
}

// Structure du rapport
export interface RapportSection {
  numero: number;
  titre: string;
  contenu: string;        // HTML sanitisé
  estModifieManuel: boolean;
  sourceStatus: SourceStatus;
}

export type SectionsMap = Record<number, RapportSection>;
```

---

## Tâche 3 — Hook `useRapportSources`

Crée `components/rapport-presentation/hooks/useRapportSources.ts`.

Ce hook charge toutes les sources pour une procédure et calcule leur statut :

```typescript
export function useRapportSources(numProc: string | null): {
  sources: RapportSources | null;
  statusMap: SourceStatusMap | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
}
```

Logique interne :
1. Charger `projets` (filtrer sur le champ `Numéro de procédure (Afpa)` via regex `^${numProc}` ou sur `NumProc` — **vérifie le nom exact dans le code existant**)
2. Charger `dce` via `numero_procedure = numProc`
3. Charger `ouverture_plis` via `num_proc = numProc` (type_analyse 'candidature' ou 'complet')
4. Charger `an01_analyses` via `num_proc = numProc` (via `useAN01Analyses`)
5. Calculer `SourceStatusMap` :
   - `disponible` : données complètes et statut 'valide' ou 'publie'
   - `partielle` : données présentes mais statut 'brouillon' ou champs manquants
   - `manquante` : aucun enregistrement trouvé

Pas d'appel Supabase direct dans ce hook sauf pour projets et dce — pour le reste, réutiliser `useOuverturePlis` et `useAN01Analyses`.

---

## Tâche 4 — Composant `RapportSourcesPanel`

Crée `components/rapport-presentation/components/RapportSourcesPanel.tsx`.

Ce composant affiche l'état des sources avant génération :

```
┌─────────────────────────────────────────────────────┐
│  Sources de données — Procédure 12345               │
├────────────────────────┬────────────────────────────┤
│ Fiche projet           │ ✓ Disponible               │
│ DCE                    │ ✓ Publié — 3 lots          │
│ Ouverture des plis     │ ✓ Validée — 5 candidats    │
│ AN01 — Lot 1           │ ✓ Sauvegardé               │
│ AN01 — Lot 2           │ ⚠ Brouillon                │
│ AN01 — Lot 3           │ ✗ Manquant                 │
└────────────────────────┴────────────────────────────┘
  → Génération partielle possible (lot 3 sera vide)
```

Utilise les composants UI existants dans le projet (pas de nouvelle bibliothèque).

Props :
```typescript
interface RapportSourcesPanelProps {
  statusMap: SourceStatusMap;
  sources: RapportSources;
  onGenerate: () => void;
  generating: boolean;
}
```

Le bouton "Générer le rapport" dans ce composant appelle `onGenerate`. Il est toujours cliquable (génération partielle autorisée), mais affiche un avertissement si des sources sont manquantes ou partielles.

---

## Tâche 5 — Logique de génération `generateSection.ts`

Crée `components/rapport-presentation/utils/generateSection.ts`.

Ce fichier exporte une fonction par section. Chaque fonction prend `RapportSources` et retourne du HTML en string :

```typescript
import DOMPurify from 'dompurify';

/** Sanitise le HTML avant injection */
function sanitize(html: string): string {
  return DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
}

export function generateSection1(sources: RapportSources): string
export function generateSection2(sources: RapportSources): string
export function generateSection3(sources: RapportSources): string
// ... sections 4 à 10

/** Génère toutes les sections disponibles */
export function generateAllSections(sources: RapportSources): SectionsMap
```

**Règles de génération par section :**

- **Section 1** : utilise `sources.projet` (nom, acheteur, objet, dates). Si `sources.projet === null` : retourner un placeholder `<p>[Données projet manquantes]</p>`
- **Section 2** : utilise `sources.ouverturePlis.candidats` pour lister les dépôts. Si manquant : placeholder
- **Section 3** : utilise `sources.dce.documentsRC`. **Sanitiser** chaque nom de document avec `DOMPurify` avant injection dans `<li>`. Si DCE absent : placeholder + note "À compléter manuellement"
- **Section 4** : toujours retourner `<p>[À compléter manuellement]</p>` — section 100% manuelle
- **Section 5** : utilise `sources.ouverturePlis.candidats` — tableau avec colonnes societe, lot, statut recevabilité
- **Section 6** : utilise `sources.an01[0].metadata.criteresRC` et pondérations. Si multi-lots : une sous-section par lot
- **Section 7** : utilise `sources.an01[].offres` + montant estimé de `sources.projet`. Afficher un avertissement si `sources.an01[].metadata.tva` est null ou undefined (ne pas calculer de TTC silencieusement)
- **Section 8** : utilise `sources.an01[].stats` (économies, palmarès)
- **Section 9** : utilise `sources.an01[].stats.winner`. Si multi-lots : un attributaire par lot
- **Section 10** : utilise les dates de `sources.projet`. Retourner un template de calendrier pré-rempli avec les dates disponibles

**Important :** réutilise la logique métier de `components/analyse/utils/generateRapportData.ts` — ne la réécris pas depuis zéro, adapte-la.

---

## Tâche 6 — Logique de fusion `mergeSections.ts`

Crée `components/rapport-presentation/utils/mergeSections.ts` :

```typescript
/**
 * Fusionne les sections nouvellement générées avec les édits manuels existants.
 *
 * Pour chaque section :
 * - Si sections_editees[N] === true : conserver le contenu actuel (edict manuel)
 * - Sinon : remplacer par le contenu nouvellement généré
 *
 * @param current  Sections actuellement en base (avec édits manuels)
 * @param generated Nouvelles sections générées
 * @param sectionsEditees Map des sections éditées manuellement
 * @returns Sections fusionnées
 */
export function mergeSections(
  current: SectionsMap,
  generated: SectionsMap,
  sectionsEditees: Record<number, boolean>
): SectionsMap

/**
 * Calcule la liste des sections qui ont des édits manuels ET de nouvelles données générées.
 * Utilisé pour afficher la boîte de dialogue de confirmation avant régénération.
 */
export function detectConflicts(
  sectionsEditees: Record<number, boolean>,
  generated: SectionsMap
): number[]
```

---

## Tâche 7 — Hook `useRapportPersistence`

Crée `components/rapport-presentation/hooks/useRapportPersistence.ts`.

Gère le chargement et la sauvegarde depuis `rapports_presentation` :

```typescript
export function useRapportPersistence(numProc: string | null): {
  rapport: RapportRecord | null;
  loading: boolean;
  error: string | null;
  save: (sections: SectionsMap, sectionsEditees: Record<number, boolean>, snapshot: unknown) => Promise<void>;
  markSectionEdited: (sectionNumero: number) => Promise<void>;
}
```

`save` fait un upsert sur `rapports_presentation` :
- `sections_data` : le contenu HTML de toutes les sections
- `sections_editees` : la map des édits manuels
- `sources_snapshot` : le snapshot des sources (date + résumé des données utilisées)
- `rapport_data` : conserver la compatibilité avec l'ancien format (pour ne pas casser l'export PDF existant)

---

## Tâche 8 — Hook `useRapportGeneration`

Crée `components/rapport-presentation/hooks/useRapportGeneration.ts`.

Orchestre la génération et la fusion :

```typescript
export function useRapportGeneration(
  sources: RapportSources | null,
  currentSections: SectionsMap,
  sectionsEditees: Record<number, boolean>
): {
  generating: boolean;
  conflicts: number[];     // sections avec édits manuels qui seraient écrasées
  generate: () => void;    // lance la génération (avec détection de conflits)
  confirmGenerate: (sectionsToRegenerate: number[]) => void;  // après confirmation utilisateur
  cancelGenerate: () => void;
}
```

Flux :
1. `generate()` → calcule les nouvelles sections via `generateAllSections`
2. Détecte les conflits via `detectConflicts`
3. Si conflits → expose `conflicts` (l'UI affiche la boîte de dialogue)
4. `confirmGenerate(sectionsToRegenerate)` → merge en régénérant uniquement les sections confirmées
5. `cancelGenerate()` → annule, conserve tout

---

## Tâche 9 — Composant `RapportSectionEditor`

Crée `components/rapport-presentation/components/RapportSectionEditor.tsx`.

Un éditeur pour une section du rapport :

```typescript
interface RapportSectionEditorProps {
  section: RapportSection;
  onEdit: (contenu: string) => void;   // déclenche markSectionEdited
  readOnly?: boolean;
}
```

- Affiche le titre de la section
- Badge **"Automatique"** (gris) ou **"Modifié manuellement"** (bleu) selon `section.estModifieManuel`
- Badge de statut source : ✓ vert / ⚠ orange / ✗ rouge selon `section.sourceStatus`
- Mode lecture : affiche le HTML sanitisé via `dangerouslySetInnerHTML`
- Mode édition : utilise le même éditeur rich-text que l'ancien module rapport (retrouve quel composant éditeur est utilisé dans `RapportPresentation.tsx`)
- Bouton pour basculer entre lecture et édition

---

## Tâche 10 — Page principale `RapportPresentationPage.tsx`

Crée `components/rapport-presentation/RapportPresentationPage.tsx`.

C'est le composant principal qui orchestre tout. Props : `{ numProc: string }` (ou équivalent selon comment la navigation passe les paramètres — vérifie dans `pages/RapportPresentationPage.tsx` existant).

Structure :

```typescript
export function RapportPresentationPage({ numProc }: { numProc: string }) {
  // 1. Charger les sources
  const { sources, statusMap, loading: sourcesLoading } = useRapportSources(numProc);

  // 2. Charger la persistance
  const { rapport, save, markSectionEdited } = useRapportPersistence(numProc);

  // 3. Orchestrer la génération
  const { generating, conflicts, generate, confirmGenerate, cancelGenerate } =
    useRapportGeneration(sources, currentSections, sectionsEditees);

  // Rendu :
  // - Panneau sources (RapportSourcesPanel) en haut
  // - Si conflits : Dialog listant les sections en conflit
  // - Liste des sections (RapportSectionEditor pour chaque section)
  // - Bouton export PDF
}
```

La boîte de dialogue de confirmation doit lister les sections en conflit par leur nom (ex: "Section 3 — DCE") et pour chacune proposer une case à cocher "Régénérer" (décoché par défaut = conserver l'édit manuel).

---

## Tâche 11 — Export PDF `exportPdf.ts`

Crée `components/rapport-presentation/utils/exportPdf.ts`.

**Ne réimplémente pas l'export PDF.** Ce fichier doit simplement réexporter depuis l'utilitaire existant en adaptant les types :

```typescript
// Réexporte et adapte l'utilitaire existant
export { rapportPresentationPdfExport } from '../../analyse/utils/rapportPresentationPdfExport';
```

Si l'utilitaire existant attend un format différent de `SectionsMap`, écris une fonction de transformation `sectionsMapToLegacyFormat(sections: SectionsMap): LegacyRapportData`.

---

## Tâche 12 — Câblage dans la navigation

Modifie `pages/RapportPresentationPage.tsx` pour pointer vers le nouveau composant :

```typescript
// Avant : import { RapportPresentation } from '../components/analyse/components/RapportPresentation';
// Après :
import { RapportPresentationPage as NewRapportPage } from '../components/rapport-presentation/RapportPresentationPage';
```

Assure-toi que les props sont compatibles (même signature que l'ancien composant). Si ce n'est pas le cas, adapte le câblage dans la page.

**Ne supprime pas encore l'ancien module** `components/analyse/components/RapportPresentation.tsx` — laisse-le en place jusqu'à validation.

---

## Contraintes à respecter dans tout ce travail

- **TypeScript strict** — pas de `any` sauf JSONB brut
- **Pas de console.log en production** — utiliser `if (import.meta.env.DEV) console.log(...)`
- **DOMPurify obligatoire** sur tout HTML injecté via `dangerouslySetInnerHTML`
- **Pas d'appel Supabase dans les composants** — uniquement dans les hooks
- **Pas de calcul TTC silencieux** — si TVA absente, afficher `[TVA non renseignée]` dans le rapport, pas 0%
- **Pas de valeur par défaut silencieuse** pour les montants — toujours afficher un avertissement si une donnée financière est manquante
- **Ne pas modifier** DCE, Ouverture des Plis, AN01 (modules en lecture seule depuis le rapport)
- **Réutiliser** les composants UI existants dans le projet (boutons, dialogs, badges) — ne pas importer de nouvelle bibliothèque

---

## Ordre d'exécution recommandé

1. Étape 0 : Exploration — **obligatoire**
2. Vérification prérequis (tables Supabase) — **bloquant**
3. Types (Tâche 2)
4. Hook `useRapportSources` (Tâche 3)
5. Hook `useRapportPersistence` (Tâche 7)
6. `generateSection.ts` (Tâche 5)
7. `mergeSections.ts` (Tâche 6)
8. Hook `useRapportGeneration` (Tâche 8)
9. Composants (Tâches 4, 9, 10, 11)
10. Câblage navigation (Tâche 12)

Si une tâche bloque, passe à la suivante et documente le blocage en commentaire dans le code.
