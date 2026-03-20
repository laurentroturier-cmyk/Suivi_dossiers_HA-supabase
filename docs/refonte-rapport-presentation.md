# Refonte du module Rapport de Présentation — Analyse et projet de développement

> Document de travail — généré le 2026-03-20
> Contexte : module construit avant DCE, Ouverture des Plis et AN01. Adaptations successives ayant fragilisé l'ensemble.

---

## 1. Diagnostic : points de fragilité du système actuel

### 1.1 Données dupliquées dans trois endroits différents

Les entreprises candidates sont enregistrées dans trois tables sans lien entre elles :

| Source | Table Supabase | Champ | Format |
|---|---|---|---|
| Dépôts/Retraits | `procédures` | `depots`, `retraits` | JSONB stocké comme string |
| Ouverture des plis | `ouverture_plis` | `candidats` | JSONB structuré |
| Analyse AN01 | aucune (mémoire React) | — | Objet JS temporaire |

**Conséquence** : une même entreprise peut apparaître sous trois orthographes différentes. Le rapport n'a aucun moyen de réconcilier ces sources de façon fiable.

---

### 1.2 Parsing JSON fragile sur les dépôts et retraits

```typescript
// Fragile : on ne sait pas si c'est une string ou un objet
const depotsDataParsed = typeof data.depots === 'string'
  ? JSON.parse(data.depots)
  : data.depots;
```

Les colonnes `depots` et `retraits` de la table `procédures` sont stockées comme des chaînes JSON et non comme du JSONB natif. Un enregistrement malformé fait crasher le rapport sans message d'erreur clair.

---

### 1.3 Regex fragile pour extraire le numéro de procédure

Le rapport accède à la table `dce` avec les 5 premiers chiffres extraits du champ `Numéro de procédure (Afpa)` :

```typescript
const numero5chiffres = numeroAfpa?.match(/^(\d{5})/)?.[1];
```

Si le format du numéro AFPA évolue ou est mal renseigné, la récupération des données DCE échoue silencieusement. Pas de fallback, pas de message d'erreur explicite.

---

### 1.4 L'AN01 est volatile — aucune persistence

Le fichier Excel AN01 est parsé côté client et stocké uniquement en mémoire React. Si l'utilisateur ferme ou recharge la page, il doit re-uploader le fichier. Les données AN01 ne sont jamais sauvegardées dans Supabase.

Le rapport sauvegarde bien son contenu généré (`rapport_data` en JSONB), mais pas la source brute qui a permis de le générer. Impossible de régénérer le rapport à l'identique si des données changent entre-temps.

---

### 1.5 Édits manuels perdus à la régénération

Le module permet d'éditer manuellement les chapitres 3 et 4 (via un éditeur rich-text). Mais si l'utilisateur clique sur "Régénérer le rapport", tout le contenu édité est écrasé :

```typescript
const rapportContent = generateRapportData({...});  // Régénère tout
setState(prev => ({
  ...prev,
  rapportGenere: rapportContent,  // Écrase les édits précédents
}));
```

Pas de versioning, pas de fusion intelligente, pas d'avertissement à l'utilisateur.

---

### 1.6 Calculs reconstruits à chaque génération plutôt que lus depuis la base

Les chiffres clés du rapport (nombre de candidats, montants, économies) sont recalculés à chaque génération à partir des sources. Si les données d'une source ont changé entre la génération et la relecture d'un rapport sauvegardé, les chiffres divergent.

Exemples :
- Nombre de plis reçus : recalculé depuis `depots.stats`
- Montant estimé TTC : recalculé avec TVA à 20% par défaut si non renseignée
- Attributaire pressenti : dérivé de `an01Data.stats.winner` (qui peut ne plus exister)

---

### 1.7 Deux sources parallèles et divergentes pour les rejets

- La table `ouverture_plis` enregistre les candidats avec leur statut (`admisRejete`, `recevable`)
- L'AN01 contient aussi des offres avec statut accepté/rejeté

Ces deux listes ne sont jamais synchronisées. Le rapport utilise uniquement l'AN01 pour les rejets (sections 5, 7, 8, 9), ignorant ce qui est dans `ouverture_plis`.

---

### 1.8 Le DCE est sous-exploité

Le module DCE contient 8 modules structurés (RC, AE, CCAP, CCTP, BPU, DQE, etc.). Le rapport de présentation n'utilise qu'une seule donnée issue du DCE : la liste des documents du règlement de consultation, et seulement si l'utilisateur clique manuellement sur le bouton "Charger les données DCE".

Le potentiel d'alimentation automatique du rapport depuis le DCE n'est pas exploité.

---

### 1.9 Logs de débogage actifs en production

```typescript
console.log('🔍 DEBUG MONTANT ESTIMÉ:');
console.log('  - Procédure [Montant de la procédure]:', ...);
```

Ces logs sont présents dans `generateRapportData.ts` et s'exécutent en production.

---

### 1.10 Construction HTML non sécurisée pour le chapitre 3

```typescript
const docsHtml = rcData.dce.documents
  .map((doc: string) => `<li><p>${doc}</p></li>`)
  .join('');
```

Le contenu DCE est interpolé directement dans du HTML sans échappement. Risque XSS si le champ contient des balises inattendues.

---

## 2. Axes d'amélioration pour la refonte

### 2.1 Principe directeur

> Le rapport de présentation doit être un **lecteur** de données déjà structurées et validées dans d'autres modules — pas un agrégateur qui reconstruit tout à la volée depuis des sources hétérogènes.

---

### 2.2 Définir une source unique de vérité par concept métier

| Concept | Source unique à utiliser | Table Supabase |
|---|---|---|
| Liste des retraits | Module Ouverture des Plis | `ouverture_plis` |
| Liste des dépôts / candidats | Module Ouverture des Plis | `ouverture_plis` |
| Recevabilité des candidatures | Module Ouverture des Plis | `ouverture_plis` |
| Documents du DCE | Module DCE | `dce` |
| Critères de pondération | Module AN01 | `an01_analyses` (à créer) |
| Offres et scores | Module AN01 | `an01_analyses` (à créer) |
| Attributaire pressenti | Module AN01 | `an01_analyses` (à créer) |
| Informations procédure | Table `projets` | `projets` |
| Montant estimé | Table `projets` ou `dossiers` | `projets` / `dossiers` |

---

### 2.3 Persister les données AN01 dans Supabase

Créer une table `an01_analyses` :

```sql
CREATE TABLE public.an01_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  num_proc TEXT NOT NULL,
  lot_nom TEXT,
  metadata JSONB,        -- tva, pondérations, dates
  offres JSONB,          -- liste des offres avec scores
  stats JSONB,           -- winner, économies, moyenne
  source TEXT,           -- 'upload_excel' | 'saisie_wizard'
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

Le rapport lit depuis cette table plutôt que depuis un état React temporaire.

---

### 2.4 Utiliser `ouverture_plis` comme source unique des candidats

Le rapport doit construire ses sections 2 (déroulement), 5 (analyse des candidatures) et 9 (attribution) directement depuis `ouverture_plis`, en enrichissant avec les scores AN01 par jointure sur le SIRET ou la raison sociale normalisée.

---

### 2.5 Préserver les édits manuels lors d'une régénération

Implémenter une logique de fusion :
- Les sections auto-générées (2, 5, 6, 7, 8, 9) sont régénérées si les données sources ont changé
- Les sections avec édits manuels (3, 4, et toute section modifiée) sont conservées sauf si l'utilisateur confirme explicitement l'écrasement
- Ajouter un indicateur visuel par section : "généré automatiquement" vs "modifié manuellement"

---

### 2.6 Alimenter automatiquement le rapport depuis les modules existants

Au lieu de boutons manuels "Charger les données DCE" ou "Uploader l'AN01", le rapport doit :
1. Détecter automatiquement quelles données sont disponibles dans les autres modules pour cette procédure
2. Afficher un tableau de bord des sources : "DCE disponible ✓", "Ouverture des plis complète ✓", "AN01 disponible ✓ / manquant ✗"
3. Générer les sections correspondantes automatiquement

---

### 2.7 Identifier la procédure par une clé stable et unique

Unifier la clé de liaison à `num_proc` (5 chiffres AFPA) dans toutes les tables. Éliminer la dépendance à la regex sur `Numéro de procédure (Afpa)`. Ajouter une colonne dérivée calculée dans `projets` si nécessaire.

---

## 3. Projet de prompt pour développement par agent IA

Le prompt ci-dessous est destiné à être soumis à un agent IA de développement (Claude Code ou équivalent) pour la refonte complète du module.

---

```
## Contexte du projet

Tu travailles sur une application React + TypeScript + Supabase de gestion de procédures d'appel d'offres publics (marchés publics). L'application comporte plusieurs modules :

- **DCE** : rédaction du dossier de consultation (table `dce`, clé `numero_procedure` VARCHAR(5))
- **Ouverture des plis** : enregistrement des candidatures et analyse de recevabilité (table `ouverture_plis`, clé `num_proc` TEXT)
- **AN01** : analyse technique et financière des offres (pas encore de table Supabase dédiée — données actuellement volatiles en mémoire React)
- **Rapport de Présentation** : document de synthèse final (table `rapports_presentation`, clé `num_proc` TEXT)

La table principale des procédures est `projets` avec les champs :
- `NumProc` : identifiant interne
- `Numéro de procédure (Afpa)` : numéro AFPA au format `XXXXX_RP_...` (5 premiers chiffres = clé commune)
- `Nom de la procédure`, `Acheteur`, dates, montants, etc.

## Problème à résoudre

Le module Rapport de Présentation actuel a été construit avant les modules DCE, Ouverture des plis et AN01. Il en résulte :
- Des données dupliquées dans plusieurs tables sans synchronisation
- Un fichier AN01 chargé manuellement à chaque session (non persisté en base)
- Des édits manuels de chapitres perdus à chaque régénération
- Une connexion fragile aux autres modules (regex, chargement manuel, sources divergentes)
- Un composant principal de plus de 1400 lignes difficile à maintenir

## Objectif

Développer un nouveau module **Rapport de Présentation** complet, qui remplace l'existant. Ce module doit :

### A. Architecture Supabase

1. Créer une table `an01_analyses` pour persister les données AN01 :
   ```sql
   CREATE TABLE public.an01_analyses (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     num_proc TEXT NOT NULL,
     lot_nom TEXT,
     metadata JSONB,   -- { tva, poidsTechnique, poidsFinancier, consultation, date }
     offres JSONB,     -- [{ name, siret, technique, financier, total, isRejected, rejectionReason }]
     stats JSONB,      -- { winner, savingAmount, savingPercent, average }
     source TEXT,      -- 'upload_excel' | 'saisie_wizard'
     version INTEGER DEFAULT 1,
     created_at TIMESTAMPTZ DEFAULT now(),
     updated_at TIMESTAMPTZ DEFAULT now()
   );
   ```

2. Modifier la table `rapports_presentation` pour ajouter :
   - `sections_editees JSONB` : map des sections modifiées manuellement (ex: `{ "3": true, "4": true }`)
   - `sections_data JSONB` : contenu de chaque section (1 à 10) stocké séparément du `rapport_data` global
   - `sources_snapshot JSONB` : snapshot horodaté des données sources utilisées à la génération

### B. Composants React à créer

Structure recommandée :

```
components/rapport-presentation/
  ├── RapportPresentationPage.tsx        -- Page d'entrée
  ├── components/
  │   ├── RapportSourcesPanel.tsx        -- Tableau de bord des sources disponibles
  │   ├── RapportSectionEditor.tsx       -- Éditeur d'une section avec mode auto/manuel
  │   ├── RapportPreview.tsx             -- Prévisualisation complète
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
  │   ├── useRapportSources.ts           -- Charge et surveille les données sources
  │   ├── useRapportGeneration.ts        -- Logique de génération et merge
  │   └── useRapportPersistence.ts       -- Sauvegarde / chargement depuis Supabase
  ├── utils/
  │   ├── generateSection.ts             -- Génération section par section
  │   ├── mergeSections.ts               -- Fusion édits manuels + nouvelles données
  │   └── exportPdf.ts                   -- Export PDF
  └── types/
      └── index.ts
```

### C. Comportement attendu

#### Chargement des sources

À l'ouverture du rapport pour une procédure donnée, le module doit :

1. Lire depuis `projets` : informations de la procédure (nom, acheteur, dates, montants)
2. Lire depuis `dce` via `numero_procedure` (5 premiers chiffres du numéro AFPA) : liste des documents, critères du RC
3. Lire depuis `ouverture_plis` via `num_proc` : candidats, statuts de recevabilité, motifs de rejet
4. Lire depuis `an01_analyses` via `num_proc` : offres, scores, pondérations, attributaire pressenti, TVA
5. Afficher dans un panneau `RapportSourcesPanel` l'état de chaque source : disponible / partielle / manquante

#### Génération des sections

Chaque section est générée indépendamment depuis sa ou ses sources :

| Section | Source principale | Source secondaire |
|---|---|---|
| 1 - Contexte | `projets` | — |
| 2 - Déroulement | `ouverture_plis` (dépôts, retraits) | `projets` (dates) |
| 3 - DCE | `dce.reglement_consultation` | Manuel si DCE absent |
| 4 - Questions/Réponses | Manuel | — |
| 5 - Candidatures | `ouverture_plis` (candidats + recevabilité) | — |
| 6 - Méthodologie | `an01_analyses.metadata` (pondérations) | — |
| 7 - Valeur des offres | `an01_analyses.offres` + `projets` (montant) | `an01_analyses.metadata.tva` |
| 8 - Performance | `an01_analyses.stats` | — |
| 9 - Attribution | `an01_analyses.stats.winner` | — |
| 10 - Calendrier | `projets` (dates) | Manuel |

#### Gestion des édits manuels

- Chaque section affiche un badge : "Automatique" ou "Modifié manuellement"
- Quand l'utilisateur édite une section manuellement, le flag `sections_editees[N]` est mis à `true`
- Lors d'une régénération, une boîte de dialogue liste les sections éditées manuellement et demande pour chacune si elle doit être régénérée ou conservée
- Le contenu de chaque section est sauvegardé dans `sections_data[N]` indépendamment

#### Clé de liaison stable

Utiliser `num_proc` (5 chiffres) comme clé unique entre tous les modules. Extraire ce numéro une seule fois depuis `projets['Numéro de procédure (Afpa)']` avec validation, et l'exposer clairement dans l'état du composant. Ne jamais recalculer la regex ailleurs.

#### Persistence de l'AN01

Si l'utilisateur uploade un fichier Excel AN01, les données parsées doivent être automatiquement sauvegardées dans `an01_analyses`. Si une entrée existe déjà pour ce `num_proc`, proposer de remplacer ou créer une nouvelle version.

### D. Contraintes techniques

- TypeScript strict (pas de `any` sauf pour les données JSONB brutes de Supabase)
- Pas de `console.log` en production (utiliser un utilitaire de log conditionnel sur `import.meta.env.DEV`)
- Tout HTML injecté via `dangerouslySetInnerHTML` doit être sanitisé avec `DOMPurify`
- Pas d'appel Supabase dans les composants : passer par des hooks dédiés
- Gérer explicitement les états : chargement / données disponibles / données manquantes / erreur
- Les calculs financiers (TVA, montants) ne doivent jamais avoir de valeur par défaut silencieuse : afficher un avertissement explicite si la TVA n'est pas renseignée
- Export PDF via les bibliothèques existantes (`jsPDF` + `autoTable`) en conservant la charte graphique actuelle

### E. Ce qu'il ne faut PAS faire

- Ne pas toucher aux modules DCE, Ouverture des Plis et AN01 — le nouveau module Rapport de Présentation doit lire leurs données sans les modifier
- Ne pas supprimer la table `rapports_presentation` existante — migrer les données vers le nouveau schéma
- Ne pas recréer un composant monolithique de 1000+ lignes — découper en composants et hooks comme indiqué
- Ne pas réimplémenter le parsing Excel dans le rapport — réutiliser l'utilitaire existant de l'AN01

### F. Livraison attendue

1. Migration SQL pour la table `an01_analyses` et les colonnes additionnelles de `rapports_presentation`
2. Tous les composants, hooks et utilitaires listés dans la structure
3. Mise à jour de `RapportPresentationPage.tsx` pour pointer sur le nouveau module
4. Les anciens fichiers du module peuvent être supprimés une fois le nouveau validé
```

---

## 4. Fichiers actuels à conserver comme référence pendant la refonte

| Fichier | Utilité pendant la refonte |
|---|---|
| `components/analyse/utils/generateRapportData.ts` | Logique métier de génération des sections — à réécrire proprement section par section |
| `components/analyse/types/index.ts` | Types existants à réutiliser ou adapter |
| `sql/create-rapports-presentation.sql` | Schéma de la table à migrer |
| `components/analyse/utils/rapportPresentationPdfExport.ts` | Export PDF à réutiliser tel quel |
| `components/an01/utils/parseExcelFile.ts` | Parser Excel AN01 à réutiliser |

---

## 5. Ordre de développement recommandé

1. **Migration SQL** : créer `an01_analyses`, modifier `rapports_presentation`
2. **Hook `useRapportSources`** : charge et expose toutes les sources pour une procédure
3. **`RapportSourcesPanel`** : tableau de bord visuel des données disponibles
4. **Génération section par section** : implémenter `generateSection.ts` pour chacune des 10 sections
5. **`mergeSections`** : logique de fusion édits manuels / régénération
6. **Éditeur de section** : composant `RapportSectionEditor` avec mode auto/manuel
7. **Prévisualisation et export PDF**
8. **Persistence AN01** : sauvegarde automatique dans `an01_analyses` lors d'un upload
9. **Tests** : valider les cas limites (sources manquantes, multi-lots, édits partiels)
10. **Migration données existantes** et bascule
