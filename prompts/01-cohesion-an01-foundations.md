# Prompt 01 — Cohérence inter-modules : fondations AN01

> **Instructions pour Claude Code.**
> Tu vas modifier cette application React + TypeScript + Supabase.
> Ce prompt est **autonome** : il contient tout ce qu'il faut pour travailler.
> Ne génère pas de résumé à la fin — le diff parle de lui-même.

---

## Contexte métier (lis avant de toucher au code)

L'application gère des procédures d'appels d'offres publics. La chaîne de traitement est :

```
projets (fiche procédure)
  └─► DCE (lots + règlement de consultation avec pondérations)
        └─► ouverture_plis (candidats + recevabilité administrative)
              └─► AN01 (notation financière + technique → attributaire)
                    └─► rapport_presentation (synthèse finale)
```

La clé commune entre toutes les tables est `num_proc` (5 chiffres AFPA).

**Problème principal à résoudre dans ce prompt :**
L'AN01 est le seul module sans table Supabase. Ses données sont volatiles (mémoire React). De plus, certaines données déjà disponibles dans le DCE et l'ouverture des plis sont ressaisies manuellement dans l'AN01. Ce prompt corrige ces deux problèmes.

---

## Étape 0 — EXPLORATION OBLIGATOIRE (fais-la avant tout)

Avant d'écrire une seule ligne de code, lis ces fichiers dans l'ordre :

1. `hooks/useDCELots.ts` — comprendre comment les lots DCE sont chargés
2. `hooks/useOuverturePlis.ts` — comprendre la structure des données candidats
3. `components/an01/utils/fetchCandidatesFromRegistre.ts` — une fonction qui charge déjà les candidats depuis l'ouverture des plis (raison sociale uniquement, pas SIRET ni recevabilité par lot)
4. `components/an01/types/saisie.ts` — types AN01Project, AN01Lot, AN01Candidate
5. `components/an01/types/index.ts` — types Offer, Metadata, AnalysisData, Stats
6. `components/an01/components/An01SaisieWizard.tsx` — structure du wizard 6 étapes
7. `components/an01/components/saisie/An01StepProjet.tsx` — étape saisie des métadonnées projet (TVA, pondérations)
8. `components/an01/components/saisie/An01StepCandidats.tsx` — étape saisie des candidats
9. `components/an01/components/UploadView.tsx` — composant upload Excel AN01
10. `components/an01/utils/excelParser.ts` — utilitaire de parsing Excel
11. `sql/ouverture_plis_setup.sql` — structure JSONB de `candidats` et `recevabilite`
12. `sql/create-rapports-presentation.sql` — schéma existant de rapports_presentation

**Après avoir lu ces fichiers, note :**
- Le nom exact du champ de pondération technique dans `An01StepProjet.tsx`
- Comment `An01StepCandidats.tsx` utilise déjà (ou non) `fetchCandidatesFromOuverturePlis`
- La structure exacte de `ouverture_plis.recevabilite` (JSONB)
- La structure exacte de `ouverture_plis.candidats[].admisRejete`

---

## Tâche 1 — Migration SQL

Crée le fichier `sql/migrations/20260320_an01_analyses_create.sql` :

```sql
-- Migration : création de la table an01_analyses
-- Permet de persister les données AN01 actuellement volatiles en mémoire React.

CREATE TABLE IF NOT EXISTS public.an01_analyses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_proc     TEXT NOT NULL,
  lot_numero   TEXT NOT NULL,
  lot_nom      TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  -- Contient : { tva: number, poidsTechnique: number, poidsFinancier: number,
  --              criteresRC: [{ nom: string, poids: number }] }
  offres       JSONB NOT NULL DEFAULT '[]',
  -- Contient : [{ name: string, siret?: string, technique: number,
  --               financier: number, total: number,
  --               isRejected: boolean, rejectionReason?: string }]
  stats        JSONB NOT NULL DEFAULT '{}',
  -- Contient : { winner?: string, savingAmount?: number,
  --              savingPercent?: number, average?: number }
  source       TEXT NOT NULL DEFAULT 'saisie_wizard'
               CHECK (source IN ('upload_excel', 'saisie_wizard')),
  statut       TEXT NOT NULL DEFAULT 'brouillon'
               CHECK (statut IN ('brouillon', 'valide')),
  version      INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour les requêtes par procédure
CREATE INDEX IF NOT EXISTS an01_analyses_num_proc_idx
  ON public.an01_analyses(num_proc);

-- Contrainte unique : une version par lot par procédure
CREATE UNIQUE INDEX IF NOT EXISTS an01_analyses_unique_version
  ON public.an01_analyses(num_proc, lot_numero, version);

-- RLS
ALTER TABLE public.an01_analyses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "an01_analyses_authenticated" ON public.an01_analyses;
CREATE POLICY "an01_analyses_authenticated"
  ON public.an01_analyses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Trigger pour updated_at automatique
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS an01_analyses_updated_at ON public.an01_analyses;
CREATE TRIGGER an01_analyses_updated_at
  BEFORE UPDATE ON public.an01_analyses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
```

Crée également le fichier `sql/migrations/20260320_rapports_presentation_add_columns.sql` :

```sql
-- Migration : ajout des colonnes de gestion des édits manuels et snapshots sources
-- Prérequis pour la refonte du module rapport de présentation.

ALTER TABLE public.rapports_presentation
  ADD COLUMN IF NOT EXISTS sections_editees  JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sections_data     JSONB NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sources_snapshot  JSONB NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.rapports_presentation.sections_editees IS
  'Map des sections modifiées manuellement. Ex: {"3": true, "4": true}';
COMMENT ON COLUMN public.rapports_presentation.sections_data IS
  'Contenu HTML de chaque section stocké indépendamment. Ex: {"1": "<p>...</p>"}';
COMMENT ON COLUMN public.rapports_presentation.sources_snapshot IS
  'Snapshot horodaté des données sources utilisées à la génération.';
```

**Applique les deux migrations via l'outil Supabase MCP** (`mcp__claude_ai_Supabase__apply_migration`), dans l'ordre.

---

## Tâche 2 — Hook `useAN01Analyses`

Crée le fichier `hooks/useAN01Analyses.ts`.

Ce hook doit suivre le même pattern que `hooks/useOuverturePlis.ts` (auto-save, états loading/error/data).

```typescript
// hooks/useAN01Analyses.ts

import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

// --- Types ---

export interface AN01AnalysisRecord {
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

export type AN01AnalysisInsert = Omit<AN01AnalysisRecord,
  'id' | 'created_at' | 'updated_at'>;

// --- Hook ---

export function useAN01Analyses() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Charge toutes les analyses pour une procédure (tous lots, toutes versions).
   * Retourne la version la plus récente de chaque lot.
   */
  const loadByNumProc = useCallback(async (
    numProc: string
  ): Promise<AN01AnalysisRecord[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('an01_analyses')
        .select('*')
        .eq('num_proc', numProc)
        .order('version', { ascending: false });

      if (err) throw err;
      return (data as AN01AnalysisRecord[]) ?? [];
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Sauvegarde ou met à jour une analyse de lot.
   * Si (num_proc, lot_numero, version) existe déjà → crée une nouvelle version.
   * Retourne l'enregistrement sauvegardé.
   */
  const saveOrUpdate = useCallback(async (
    record: AN01AnalysisInsert
  ): Promise<AN01AnalysisRecord | null> => {
    setLoading(true);
    setError(null);
    try {
      // Vérifier si la version existe déjà
      const { data: existing } = await supabase
        .from('an01_analyses')
        .select('id, version')
        .eq('num_proc', record.num_proc)
        .eq('lot_numero', record.lot_numero)
        .eq('version', record.version)
        .maybeSingle();

      if (existing) {
        // Update de l'enregistrement existant
        const { data, error: err } = await supabase
          .from('an01_analyses')
          .update({
            lot_nom: record.lot_nom,
            metadata: record.metadata,
            offres: record.offres,
            stats: record.stats,
            source: record.source,
            statut: record.statut,
          })
          .eq('id', existing.id)
          .select()
          .single();
        if (err) throw err;
        return data as AN01AnalysisRecord;
      } else {
        // Insert
        const { data, error: err } = await supabase
          .from('an01_analyses')
          .insert(record)
          .select()
          .single();
        if (err) throw err;
        return data as AN01AnalysisRecord;
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Supprime toutes les versions d'un lot pour une procédure.
   */
  const deleteByLot = useCallback(async (
    numProc: string,
    lotNumero: string
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('an01_analyses')
        .delete()
        .eq('num_proc', numProc)
        .eq('lot_numero', lotNumero);
      if (err) throw err;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Passe une analyse au statut 'valide'.
   */
  const updateStatut = useCallback(async (
    id: string,
    statut: 'brouillon' | 'valide'
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase
        .from('an01_analyses')
        .update({ statut })
        .eq('id', id);
      if (err) throw err;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, loadByNumProc, saveOrUpdate, deleteByLot, updateStatut };
}
```

---

## Tâche 3 — Étendre `fetchCandidatesFromRegistre.ts`

**Lis d'abord** `components/an01/utils/fetchCandidatesFromRegistre.ts` pour voir l'implémentation actuelle.

La fonction `fetchCandidatesFromOuverturePlis` retourne uniquement des `string[]` (noms d'entreprise). Elle doit être enrichie pour retourner aussi le SIRET et la recevabilité par lot.

**Ajoute** (sans supprimer ni modifier les fonctions existantes) une nouvelle fonction exportée dans ce même fichier :

```typescript
export interface CandidatRecevable {
  societe: string;
  siret?: string;
  /** true = admis, false = rejeté, undefined = non renseigné */
  recevable?: boolean;
  motifRejet?: string;
}

/**
 * Charge les candidats avec leur statut de recevabilité pour un lot donné.
 * Complète fetchCandidatesFromOuverturePlis (qui ne retourne que les noms).
 */
export async function fetchCandidatsRecevablesParLot(
  numProc5: string,
  lotNumero?: string
): Promise<CandidatRecevable[]>
```

Implémente cette fonction en :
1. Lisant `ouverture_plis.candidats` (type_analyse: 'candidature' ou 'complet')
2. Mappant chaque candidat vers `CandidatRecevable` en utilisant les champs réels de la table
3. Si `lotNumero` est fourni, filtrant les candidats dont le lot correspond
4. Retournant uniquement les candidats `admisRejete === 'Admis'` (ou valeur équivalente — **vérifie la valeur exacte dans le SQL d'ouverture_plis**)

> ⚠️ La valeur exacte de `admisRejete` pour un candidat admis est dans `sql/ouverture_plis_setup.sql`. Lis ce fichier avant d'écrire la comparaison. Ne suppose pas que c'est `'Admis'`.

---

## Tâche 4 — Import des pondérations DCE dans `An01StepProjet.tsx`

**Lis d'abord** `components/an01/components/saisie/An01StepProjet.tsx` en entier.

Dans ce composant, à côté des champs de pondération technique/financière, ajoute :

1. Un bouton **"Charger depuis le RC"** (RC = Règlement de Consultation du DCE)

2. Ce bouton déclenche une requête Supabase :
   ```sql
   SELECT reglement_consultation FROM dce
   WHERE numero_procedure = $numProc5
   LIMIT 1
   ```
   Utilise `supabase` depuis `lib/supabase` — **pas d'appel direct dans le composant**. Crée une fonction utilitaire dans `components/an01/utils/loadProjectFromProcedure.ts` (ce fichier existe déjà — ajoute la fonction dedans sans casser l'existant).

3. Depuis les données RC récupérées, extrais les pondérations. **Lis le RC dans le code pour trouver les vrais champs** — cherche dans les composants DCE comment le RC stocke les pondérations (grep sur `poidsTechnique`, `poidsFinancier`, `critereTechnique`, `ponderation` dans `components/dce-complet/`).

4. Pré-remplis les champs de pondération du formulaire avec les valeurs trouvées.

5. Ajoute un badge sous les champs de pondération :
   - Badge vert **"✓ Conforme au RC"** si les valeurs actuelles correspondent à celles du DCE
   - Badge orange **"⚠ Modifié — vérifier la conformité au RC"** si l'utilisateur a changé une valeur après le chargement

6. Si le DCE est introuvable (`error` ou `data === null`) : n'affiche pas d'erreur bloquante, affiche un message discret "DCE non trouvé pour cette procédure" et laisse la saisie libre.

---

## Tâche 5 — Import des candidats recevables dans `An01StepCandidats.tsx`

**Lis d'abord** `components/an01/components/saisie/An01StepCandidats.tsx` en entier.

Ce composant utilise probablement déjà `fetchCandidatesFromOuverturePlis` (noms seulement). Remplace ou complète cet usage par la nouvelle fonction `fetchCandidatsRecevablesParLot` (créée en Tâche 3).

Modifications à faire :

1. Au chargement de l'étape pour un lot donné, appeler `fetchCandidatsRecevablesParLot(numProc5, lotNumero)`

2. Afficher un banner d'information :
   - Si des candidats recevables sont trouvés : **"N candidats recevables importés depuis l'Ouverture des Plis"**
   - Si aucun : **"Aucun candidat recevable trouvé — saisie manuelle"** (pas d'erreur, pas de blocage)

3. Pré-remplir la liste des candidats avec les données importées (nom + SIRET si disponible)

4. Conserver la possibilité d'ajouter des candidats manuellement et d'en supprimer

5. Ajouter une icône distinctive par candidat : "Importé depuis l'OP" vs "Saisi manuellement"

---

## Tâche 6 — Auto-save dans `An01SaisieWizard.tsx` et `UploadView.tsx`

**Lis d'abord** les deux fichiers :
- `components/an01/components/An01SaisieWizard.tsx`
- `components/an01/components/UploadView.tsx`

### 6.1 Wizard — auto-save debounced

Dans `An01SaisieWizard.tsx` :

1. Importer `useAN01Analyses` (créé en Tâche 2)
2. À chaque changement d'état qui modifie les données d'un lot (notes, montants, candidats), déclencher un auto-save avec un debounce de 800ms via `saveOrUpdate`
3. Afficher un indicateur de sauvegarde dans le header du wizard :
   - "Sauvegarde en cours..." (pendant le debounce ou la requête)
   - "Sauvegardé ✓" (après succès)
   - "Erreur de sauvegarde ⚠" (après échec)

Modèle à suivre : le comportement de l'auto-save dans `hooks/useOuverturePlis.ts`.

### 6.2 Upload Excel — sauvegarde au parsing

Dans `UploadView.tsx`, après le parsing du fichier Excel via `excelParser.ts` :

1. Appeler `saveOrUpdate` pour chaque lot parsé
2. Si une entrée existe déjà pour `(num_proc, lot_numero)` à la version courante : afficher une `Dialog` (utilise les composants UI existants dans le projet) avec trois options :
   - **"Écraser"** : update l'enregistrement existant (même version)
   - **"Nouvelle version"** : incrémenter le numéro de version et créer un nouvel enregistrement
   - **"Annuler"** : ne rien sauvegarder
3. Afficher un message de confirmation après sauvegarde réussie

---

## Contraintes à respecter dans tout ce travail

- **TypeScript strict** — pas de `any` sauf pour les données JSONB brutes (`Record<string, unknown>` ou `unknown[]`)
- **Pas de console.log en production** — remplacer les `console.log` existants par `if (import.meta.env.DEV) console.log(...)`
- **Pas d'appel Supabase dans les composants** — toujours passer par un hook ou une fonction utilitaire
- **Ne pas modifier** les modules DCE et Ouverture des Plis — lecture seule depuis l'AN01
- **Ne pas casser** les fonctionnalités AN01 existantes (upload Excel, export PDF, dashboard d'analyse)
- **Exporter le hook** depuis `hooks/index.ts` si ce fichier existe

---

## Ordre d'exécution recommandé

1. Exploration (Étape 0) — **obligatoire**
2. Migration SQL (Tâche 1) — via MCP Supabase
3. Hook `useAN01Analyses` (Tâche 2)
4. Extension de `fetchCandidatesFromRegistre.ts` (Tâche 3)
5. Import pondérations DCE → AN01 (Tâche 4)
6. Import candidats OP → AN01 (Tâche 5)
7. Auto-save (Tâche 6)

Si une tâche bloque, passe à la suivante et documente le blocage en commentaire dans le code.
