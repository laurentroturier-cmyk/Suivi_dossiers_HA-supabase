# Analyse : Récupération du numéro de procédure dans le module Rapport de Présentation

> Document de référence technique — généré le 2026-03-20

---

## 1. Fichiers clés du module

| Rôle | Fichier |
|---|---|
| Page d'entrée | `pages/RapportPresentationPage.tsx` |
| Composant principal (logique + data fetching) | `components/analyse/components/RapportPresentation.tsx` |
| Composant de prévisualisation | `components/analyse/components/RapportPresentationPreview.tsx` |
| Rendu PDF | `components/analyse/components/RapportPresentationPDF.tsx` |
| Génération des données du rapport | `components/analyse/utils/generateRapportData.ts` |
| Export PDF | `components/analyse/utils/rapportPresentationPdfExport.ts` |
| Export depuis workflow | `components/analyse/utils/exportRapportPresentationFromWorkflow.ts` |
| Types TypeScript | `components/analyse/types/index.ts` |
| Schéma SQL de la table rapports | `sql/create-rapports-presentation.sql` |
| Politiques RLS | `sql/rapports-presentation-rls.sql` |

---

## 2. Les trois formats du numéro de procédure

Le système manipule **trois représentations** du numéro de procédure, toutes issues de la table `projets` :

| Format | Champ Supabase | Exemple | Usage |
|---|---|---|---|
| Identifiant interne | `NumProc` | `42` | Clé de liaison principale entre toutes les tables |
| Numéro Afpa complet | `Numéro de procédure (Afpa)` | `25006_RP_...` | Affichage dans l'interface |
| 5 chiffres extraits | Regex appliquée sur le champ Afpa | `25006` | Clé de recherche dans la table `dce` |

---

## 3. Flux de données étape par étape

### Étape 1 — Chargement de la liste des procédures

Au démarrage du composant, le hook `useProjects` (store Zustand) charge tous les projets :

```sql
SELECT * FROM projets ORDER BY IDProjet DESC
```

L'utilisateur sélectionne ensuite une procédure dans la liste déroulante.

### Étape 2 — Résolution de la procédure sélectionnée

Dans `RapportPresentation.tsx` :

```typescript
const procedureSelectionnee = procedures.find(
  p => p.NumProc === state.procedureSelectionnee
);
```

Le `NumProc` issu de la sélection devient la **clé pivot** de toutes les requêtes suivantes.

### Étape 3 — Chargements automatiques via `useEffect`

Dès qu'un `NumProc` est disponible, trois effets se déclenchent en parallèle :

#### 3a. Rapports déjà sauvegardés

Table : `rapports_presentation`

```typescript
supabase
  .from('rapports_presentation')
  .select('*')
  .eq('num_proc', procedureSelectionnee.NumProc)
  .order('date_creation', { ascending: false })
```

#### 3b. Dépôts et Retraits

Table : `procédures`

```typescript
supabase
  .from('procédures')
  .select('depots, retraits')
  .eq('NumProc', procedureSelectionnee.NumProc)
  .single()
```

#### 3c. Données DCE (règlement de consultation)

Table : `dce` — avec extraction du numéro à 5 chiffres via regex :

```typescript
const numero5chiffres = numeroAfpa?.match(/^(\d{5})/)?.[1]  // ex: "25006"

supabase
  .from('dce')
  .select('reglement_consultation')
  .eq('numero_procedure', numero5chiffres)
  .single()
```

---

## 4. Tableau récapitulatif des requêtes Supabase

| Table | Clé de recherche | Champ cible | Données récupérées |
|---|---|---|---|
| `projets` | — (liste complète) | `IDProjet`, `NumProc`, `Numéro de procédure (Afpa)`, etc. | Toutes les procédures disponibles |
| `rapports_presentation` | `num_proc = NumProc` | `*` | Rapports déjà sauvegardés pour cette procédure |
| `procédures` | `NumProc = NumProc` | `depots`, `retraits` | Données de dépôts et retraits |
| `dce` | `numero_procedure = 5 premiers chiffres du n° Afpa` | `reglement_consultation` | Règlement de consultation |

---

## 5. Champs Supabase exploités depuis la table `projets`

| Champ | Usage dans le rapport |
|---|---|
| `NumProc` | Identifiant interne, clé de toutes les jointures |
| `Numéro de procédure (Afpa)` | Affichage + extraction du code 5 chiffres pour `dce` |
| `Nom de la procédure` | Titre du rapport |
| `Acheteur` | Identification du pouvoir adjudicateur |
| `IDProjet` | Lien vers le dossier projet |
| `Date de lancement_de_la_consultation` | Chronologie |
| `Date de remise des offres` | Chronologie |
| `Date d'ouverture des offres` | Chronologie |
| `Support de procédure` | Plateforme de dépôt |
| `Montant de la procédure` | Données financières |

---

## 6. Schéma de la table `rapports_presentation`

```sql
CREATE TABLE public.rapports_presentation (
  id                  UUID PRIMARY KEY,
  num_proc            TEXT NOT NULL,         -- Lien vers NumProc de projets
  titre               TEXT NOT NULL,
  auteur              TEXT,
  date_creation       TIMESTAMPTZ,           -- Auto-renseigné à la création
  date_modification   TIMESTAMPTZ,           -- Auto-mis à jour
  statut              TEXT,                  -- brouillon | en_revision | valide | publie
  version             INTEGER,
  rapport_data        JSONB NOT NULL,        -- Contenu complet du rapport
  fichiers_sources    JSONB,                 -- Métadonnées fichiers (dépôts, retraits, AN01)
  notes               TEXT,
  UNIQUE(num_proc, version)
);
```

**Index :**
- `num_proc` — filtrage rapide par procédure
- `statut` — filtrage par état
- `date_creation` — tri chronologique
- `rapport_data` (GIN) — recherche dans le JSONB

---

## 7. Sauvegarde d'un rapport

**Création :**
```typescript
supabase.from('rapports_presentation').insert({
  num_proc:        procedureSelectionnee.NumProc,
  titre,
  rapport_data,    // JSONB : contenu complet des sections
  fichiers_sources,
  notes,
  version,
  statut
})
```

**Mise à jour :**
```typescript
supabase.from('rapports_presentation')
  .update({ titre, rapport_data, fichiers_sources, notes, statut })
  .eq('id', rapportActuelId)
```

---

## 8. Point critique — Jointure indirecte avec `dce`

La liaison entre `projets` et `dce` n'est **pas une jointure directe par clé étrangère**.

Le système extrait les 5 premiers chiffres du champ `Numéro de procédure (Afpa)` via la regex `/^(\d{5})/` et utilise ce résultat comme valeur de `dce.numero_procedure`.

**Conséquence :** si le champ `Numéro de procédure (Afpa)` est absent, vide ou mal formaté dans `projets`, la récupération des données DCE **échoue silencieusement** (pas d'erreur bloquante, juste des données manquantes).

---

## 9. Source des données non issues de Supabase

Le fichier **AN01** (Excel contenant la liste des candidats et offres) est chargé **manuellement par l'utilisateur** via un upload dans l'interface. Il n'est pas stocké dans Supabase mais ses données alimentent le rapport généré.

---

## 10. Sécurité

- Toutes les opérations sur `rapports_presentation` sont protégées par des **politiques RLS** (Row Level Security).
- L'accès requiert une authentification Supabase valide.
- Pas d'accès en lecture ou écriture possible sans session active.
