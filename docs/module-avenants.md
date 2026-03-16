# Module Avenants — Documentation technique

> **Format cible :** EXE10 — Avenant au marché public
> **Localisation :** `components/avenants/`
> **Version :** 2025

---

## Table des matières

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture des fichiers](#2-architecture-des-fichiers)
3. [Modèle de données](#3-modèle-de-données)
4. [Workflow utilisateur](#4-workflow-utilisateur)
5. [Formulaire — sections et champs](#5-formulaire--sections-et-champs)
6. [Calculs financiers](#6-calculs-financiers)
7. [Tables Supabase](#7-tables-supabase)
8. [Export PDF](#8-export-pdf)
9. [Aperçu (Preview)](#9-aperçu-preview)
10. [Patterns techniques notables](#10-patterns-techniques-notables)

---

## 1. Vue d'ensemble

Le module **Avenants** permet de créer, gérer et exporter des avenants à des marchés publics selon le formulaire réglementaire **EXE10**. Il couvre :

- La recherche et sélection d'un contrat existant (`TBL_Contrats`)
- L'identification automatique du titulaire via le référentiel fournisseurs
- Le calcul financier multi-avenants avec historique et cumul
- La gestion des modifications de délai
- L'export PDF officiel au format EXE10
- Un aperçu HTML fidèle au rendu final

**Statuts possibles :** `brouillon` | `validé`

---

## 2. Architecture des fichiers

```
components/avenants/
├── index.tsx                          # Barrel export (point d'entrée public)
├── types/
│   └── index.ts                       # Interface AvenantData + constante AVENANT_EMPTY
├── components/
│   ├── AvenantsList.tsx               # Liste, recherche, actions CRUD (~293 lignes)
│   ├── AvenantForm.tsx                # Formulaire de saisie complet (~931 lignes)
│   ├── AvenantPreview.tsx             # Aperçu HTML formaté EXE10 (~351 lignes)
│   └── AvenantPDF.tsx                 # Composant React PDF pour export (~499 lignes)
└── utils/
    └── avenantPdfExport.ts            # Fonction d'export (génération Blob + download)
```

### Dépendances externes

| Package | Usage |
|---|---|
| `@react-pdf/renderer` | Génération du PDF EXE10 |
| `file-saver` | Téléchargement côté navigateur |
| `lucide-react` | Icônes |
| `RichTextEditor` | Éditeur texte riche (Tiptap, depuis `dce-complet`) |

---

## 3. Modèle de données

### Interface `AvenantData`

```typescript
interface AvenantData {
  id?: string;

  // En-tête
  demande: string;                     // Référence de la demande (ex: "23333-8-Avenant 2")
  demandeur: string;                   // Nom du demandeur

  // Contrat sélectionné (depuis TBL_Contrats)
  contrat_reference: string;           // Numéro de marché (Agreement Number)
  contrat_libelle: string;             // Objet du marché
  titulaire: string;                   // Fournisseur du contrat (brut)

  // Titulaire — identification officielle (depuis Referentiel_Fournisseurs)
  titulaire_nom: string;               // Nom officiel
  titulaire_siret: string;             // N° SIRET
  titulaire_adresse: string;           // Adresse complète (composée)
  titulaire_email: string;             // Courriel

  // Prestations modifiées
  description_avenant: string;         // HTML riche (RichTextEditor)

  // Impact financier
  incidence_financiere: boolean;       // true = Oui, false = Non
  montant_initial_ht: number | null;   // Montant initial du marché (€ HT)
  montant_precedent_ht: number | null; // Montant avant cet avenant (€ HT)
  montant_avenant_ht: number | null;   // Montant de l'avenant (±, € HT)
  taux_tva: string;                    // Taux de TVA (ex: "20.0%")

  // Délai
  nouvelle_date_fin: string | null;    // Nouvelle date de fin (YYYY-MM-DD)

  // Rédaction
  redige_par: string;                  // Auteur de l'avenant
  numero_avenant: number | null;       // Numéro (calculé automatiquement)
  frn_nom_signataire: string;          // Signataire fournisseur — nom
  frn_fonction_signataire: string;     // Signataire fournisseur — fonction
  duree_marche: string;                // Durée du marché (ex: "48 mois")
  date_notification: string | null;    // Date de notification du marché

  // Métadonnées
  statut: 'brouillon' | 'valide';
  created_at?: string;
  updated_at?: string;
}
```

### Valeurs par défaut (`AVENANT_EMPTY`)

| Champ | Valeur par défaut |
|---|---|
| `incidence_financiere` | `true` |
| `taux_tva` | `"20.0%"` |
| `statut` | `"brouillon"` |
| Tous les textes | `""` |
| Tous les montants | `null` |

---

## 4. Workflow utilisateur

```
┌─────────────────┐
│   AvenantsList  │  Vue liste de tous les avenants (filtrables)
└────────┬────────┘
         │ Clic "Nouveau" ou "Modifier"
         ▼
┌─────────────────┐
│   AvenantForm   │
│                 │
│  A. En-tête     │  Référence demande, demandeur
│  B. Contrat     │  Recherche dans TBL_Contrats (debounce 300ms)
│  C. Titulaire   │  2 étapes : entête Réf. Fournisseurs → site
│  D. Prestations │  Éditeur texte riche (HTML)
│  E. Montant     │  Calculs automatiques + historique avenants
│  F. Délai       │  Nouvelle date de fin (optionnel)
│  G. Rédaction   │  Auteur, numéro, signataires, statut
└────────┬────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌────────┐ ┌────────┐
│Aperçu  │ │  PDF   │
│(HTML)  │ │ EXE10  │
└────────┘ └────────┘
```

### Barre de résumé financier (sticky)

Affichée en permanence en haut du formulaire lorsqu'une incidence financière est activée :

```
Montant initial   |   Avenant N°X (+/- xxx €)   |   Nouveau total   |   % courant   |   % cumulé
```

---

## 5. Formulaire — sections et champs

### A. En-tête

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `demande` | Texte | ✅ | Référence de la demande (ex : `23333-8-Avenant 2`) |
| `demandeur` | Texte | ✅ | Nom du demandeur interne |

---

### B. Contrat

Recherche dans `TBL_Contrats` avec debounce 300 ms (min. 2 caractères).
La recherche porte sur : Numéro de marché, Description, Fournisseur.

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `contrat_reference` | Recherche dropdown | ✅ | Numéro Agreement — auto-complété |
| `contrat_libelle` | Texte (auto) | — | Objet du marché — rempli automatiquement |
| `titulaire` | Texte (auto) | — | Fournisseur du contrat |
| `duree_marche` | Texte | — | Ex : `48 mois` |
| `date_notification` | Date | — | Date de notification du marché |

> À la sélection d'un contrat, le numéro d'avenant et le montant initial sont pré-remplis automatiquement.

---

### C. Identification du titulaire

Sélection en **deux étapes** :

**Étape 1 — Recherche entête (`Referentiel_Fournisseurs_Entete`)**
- Recherche par nom ou numéro fournisseur (filtre Statut = `Actif`)
- Déclenchée automatiquement depuis le nom titulaire du contrat

**Étape 2 — Sélection du site (`Referentiel_Fournisseur_Site`)**
- Liste des sites rattachés au fournisseur sélectionné
- Sélection automatique si un seul site

| Champ | Source | Description |
|---|---|---|
| `titulaire_nom` | Référentiel Fournisseurs | Nom officiel |
| `titulaire_siret` | Site fournisseur | Numéro SIRET |
| `titulaire_adresse` | Site fournisseur | Composée : Ligne 1 + Ligne 2 + CP + Ville |
| `titulaire_email` | Site fournisseur | Courriel de contact |

---

### D. Modification des prestations

| Champ | Type | Description |
|---|---|---|
| `description_avenant` | RichTextEditor (HTML) | Description des modifications apportées par l'avenant |

---

### E. Modification du montant

Activée ou désactivée via le toggle **Incidence financière (Oui/Non)**.

**Champs saisis :**

| Champ | Type | Description |
|---|---|---|
| `montant_initial_ht` | Nombre | Montant initial du marché (€ HT) |
| `montant_precedent_ht` | Nombre | Montant du marché avant cet avenant (€ HT) |
| `montant_avenant_ht` | Nombre | Montant de l'avenant — positif ou négatif (€ HT) |
| `taux_tva` | Texte | Taux de TVA (ex : `20.0%`) |

**Champs calculés (affichage uniquement) :**

| Champ calculé | Formule |
|---|---|
| Montant avenant TTC | `montant_avenant_ht × (1 + TVA)` |
| Nouveau montant total HT | `montant_precedent_ht + montant_avenant_ht` |
| Nouveau montant total TTC | `nouveau_total_ht × (1 + TVA)` |
| % avenant courant | `(montant_avenant_ht / montant_initial_ht) × 100` |
| % cumulé | `(somme tous avenants / montant_initial_ht) × 100` |

**Historique des avenants** : tableau automatique des avenants précédents sur ce contrat (numéro, montant HT, % vs initial, statut). La ligne courante est mise en évidence.

---

### F. Modification du délai

| Champ | Type | Description |
|---|---|---|
| `nouvelle_date_fin` | Date | Nouvelle date de fin du marché — laisser vide si aucun changement |

> Si renseignée, la date apparaît dans un bloc ambré dans l'aperçu et le PDF.

---

### G. Rédaction

| Champ | Type | Obligatoire | Description |
|---|---|---|---|
| `redige_par` | Texte | ✅ | Nom du rédacteur de l'avenant |
| `numero_avenant` | Nombre | ✅ | Calculé automatiquement (`max existant + 1`), modifiable |
| `frn_nom_signataire` | Texte | — | Nom du signataire côté fournisseur |
| `frn_fonction_signataire` | Texte | — | Fonction du signataire fournisseur |
| `statut` | Enum | ✅ | `brouillon` ou `valide` |

---

## 6. Calculs financiers

```
Données connues
├── montant_initial_ht         → Référence (initial)
├── montant_precedent_ht       → Avant cet avenant
├── montant_avenant_ht         → Modification introduite (± €)
└── taux_tva                   → "20.0%" → parsing : 20.0 / 100 = 0.20

Calculs immédiats
├── montant_avenant_ttc        = montant_avenant_ht × (1 + 0.20)
├── nouveau_montant_total_ht   = montant_precedent_ht + montant_avenant_ht
├── nouveau_montant_total_ttc  = nouveau_montant_total_ht × (1 + 0.20)
├── pct_avenant_courant        = (montant_avenant_ht / montant_initial_ht) × 100
└── pct_cumule                 = (Σ tous avenants sur ce contrat / montant_initial_ht) × 100
```

**Affichage :**
- Montants positifs → texte vert
- Montants négatifs → texte rouge
- % cumulé → texte bleu
- Format : locale `fr-FR`, 2 décimales (ex : `1 234,56 € HT`)

---

## 7. Tables Supabase

| Table | Mode | Usage |
|---|---|---|
| `avenants` | Lecture / Écriture | Stockage principal des avenants |
| `TBL_Contrats` | Lecture seule | Recherche et sélection de contrats |
| `Referentiel_Fournisseurs_Entete` | Lecture seule | Recherche fournisseur (nom, numéro) |
| `Referentiel_Fournisseur_Site` | Lecture seule | Sites du fournisseur (SIRET, adresse, email) |

### Patterns de requêtes clés

```typescript
// Recherche de contrats (debounce 300ms)
supabase.from('TBL_Contrats')
  .select('*')
  .or(`"Agreement Number".ilike.%${q}%,"Supplier".ilike.%${q}%`)
  .limit(20)

// Recherche fournisseur (Actif uniquement)
supabase.from('Referentiel_Fournisseurs_Entete')
  .select('*')
  .or(`"Nom du fournisseur".ilike.%${q}%,"Numero du fournisseur".ilike.%${q}%`)
  .eq('Statut', 'Actif')
  .limit(20)

// Historique des avenants du contrat
supabase.from('avenants')
  .select('id, numero_avenant, montant_avenant_ht, statut, created_at')
  .eq('contrat_reference', contratRef)
  .order('numero_avenant', { ascending: true })

// Sauvegarde (insert ou update selon présence de data.id)
supabase.from('avenants').insert(payload).select().single()
supabase.from('avenants').update(payload).eq('id', id).select().single()
```

---

## 8. Export PDF

### Bibliothèque

`@react-pdf/renderer` + `file-saver`

### Nommage du fichier

```
Avenant_[numero]_[contrat_reference]_[AAAAMMJJ].pdf
Exemple : Avenant_2_23333-8-MARCHE_20260313.pdf
```

### Structure du document EXE10

Le PDF est structuré selon le formulaire réglementaire EXE10 :

| Section | Contenu |
|---|---|
| **En-tête fixe** | Logo AFPA + Marianne, titre ministère, bordure teal |
| **Bandeau** | "Marchés publics" · "Avenant au marché public" · Code `EXE10` · "AVENANT N°X au marché [ref]" |
| **A. Pouvoir adjudicateur** | Afpa - Agence pour la formation professionnelle des adultes, 3 rue Franklin, 93100 MONTREUIL (statique) |
| **B. Titulaire du marché** | titulaire_nom, SIRET, adresse, email |
| **C. Objet du marché public** | Description, date notification, durée, montant initial (HT + TTC + TVA) |
| **D. Objet de l'avenant** | Description HTML → texte, case incidence financière, montants calculés, nouvelle date si applicable |
| **E. Signature titulaire** | Tableau signataire fournisseur (nom, fonction, date, signature) |
| **F. Signature pouvoir adjudicateur** | Bloc signature autorité |
| **Pied de page fixe** | `EXE10 – Avenant` · référence contrat · `Page X / N` |

### Processus de génération

```
1. Charger les logos (fetch → Base64)
   └── Fallback silencieux si indisponibles

2. Rendre <AvenantPDF data={...} logos={...} />
   └── React PDF → flux PDF binaire

3. Créer un Blob PDF
   └── saveAs(blob, filename)  →  téléchargement navigateur
```

### Rendu conditionnel dans le PDF

```typescript
// Incidence financière
if (data.incidence_financiere) {
  // Afficher les montants, %, nouveau total
}

// Modification de délai
if (data.nouvelle_date_fin) {
  // Bloc ambré : "Nouvelle date de fin : DD/MM/YYYY"
}
```

---

## 9. Aperçu (Preview)

`AvenantPreview.tsx` génère un rendu HTML fidèle au PDF, visible dans le navigateur sans téléchargement.

**Caractéristiques :**
- Mise en page identique au PDF (sections A–F)
- En-tête avec logos, bandeau EXE10
- Rendu HTML de `description_avenant` via `dangerouslySetInnerHTML`
- Affichage conditionnel identique au PDF (incidence financière, délai)
- Adapté à l'impression (`@media print`)
- Responsive : scroll vertical pour les grands documents

---

## 10. Patterns techniques notables

### Recherche avec debounce

```typescript
// Attente 300ms après la dernière frappe avant d'appeler Supabase
const timer = setTimeout(() => fetchContrats(query), 300);
return () => clearTimeout(timer);  // nettoyage sur chaque changement
```

### Sélection fournisseur en deux étapes

```
Titulaire (brut, du contrat)
    │
    ▼  auto-trigger (via useEffect)
Referentiel_Fournisseurs_Entete  → 1 entête sélectionnée
    │
    ▼  requête automatique
Referentiel_Fournisseur_Site  → liste des sites
    │
    ├── 1 seul site ? → auto-sélection
    └── Plusieurs sites ? → dropdown utilisateur
```

### Numérotation automatique des avenants

```typescript
// Calculé à partir de l'historique du contrat
const existingNums = historiqueAvenants
  .filter(a => a.id !== data.id)  // exclure l'avenant en cours d'édition
  .map(a => a.numero_avenant || 0);
const nextNum = Math.max(0, ...existingNums) + 1;
setData(prev => ({ ...prev, numero_avenant: nextNum }));
```

### Conversion HTML → texte pour le PDF

Les champs RichTextEditor stockent du HTML. La fonction `htmlToText()` convertit le HTML en texte brut pour l'intégration dans `@react-pdf/renderer` (qui ne supporte pas le HTML natif).

### Gestion des dates

```typescript
// Stockage : YYYY-MM-DD uniquement (pas d'heure)
const dateOnly = isoString.split('T')[0];

// Affichage : format français DD/MM/YYYY
new Date(date).toLocaleDateString('fr-FR')
```

### Fermeture des dropdowns au clic extérieur

```typescript
useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
      setDropdownOpen(false);
    }
  };
  document.addEventListener('mousedown', handler);
  return () => document.removeEventListener('mousedown', handler);
}, []);
```

---

## Annexe — Correspondance champs / formulaire EXE10

| Section EXE10 | Champs `AvenantData` |
|---|---|
| Pouvoir adjudicateur | Statique AFPA |
| Titulaire | `titulaire_nom`, `titulaire_siret`, `titulaire_adresse`, `titulaire_email` |
| Objet du marché | `contrat_libelle`, `date_notification`, `duree_marche`, `montant_initial_ht`, `taux_tva` |
| Objet de l'avenant | `description_avenant`, `incidence_financiere`, `montant_avenant_ht`, `nouvelle_date_fin` |
| Signature titulaire | `frn_nom_signataire`, `frn_fonction_signataire` |
| Référence document | `numero_avenant`, `contrat_reference` |

---

*Documentation générée le 13/03/2026 — Module version EXE10*
