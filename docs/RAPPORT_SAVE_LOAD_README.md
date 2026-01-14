# 💾 Sauvegarde et Chargement des Rapports de Présentation

## Vue d'ensemble

Cette fonctionnalité permet de sauvegarder et charger les rapports de présentation générés, évitant ainsi de devoir re-télécharger les fichiers et re-saisir les contenus manuels à chaque session.

## Fonctionnalités principales

### ✨ Sauvegarde
- **Sauvegarde complète** : Toutes les données du rapport (sections automatiques + contenus manuels)
- **Métadonnées** : Titre, notes, auteur, dates de création/modification
- **Versioning automatique** : Numéro de version incrémenté automatiquement
- **Workflow de statut** : Brouillon → En révision → Validé → Publié

### 📂 Chargement
- **Liste des rapports** : Affichage de tous les rapports sauvegardés pour la procédure
- **Informations détaillées** : Titre, version, statut, dates, notes
- **Restauration complète** : Rechargement de toutes les données du rapport
- **Gestion des versions** : Plusieurs versions par procédure

### 🔄 Gestion
- **Mise à jour** : Modification d'un rapport existant
- **Changement de statut** : Workflow de validation intégré
- **Suppression** : Avec confirmation (admin uniquement)
- **Partage** : Visible par tous les utilisateurs authentifiés

## Interface utilisateur

### Boutons principaux

1. **Sauvegarder** (orange, icône Save)
   - Visible uniquement quand un rapport est généré
   - Ouvre un dialogue pour saisir titre et notes
   - Bouton : "Enregistrer" ou "Mettre à jour"

2. **Charger** (violet, icône FolderOpen)
   - Affiche le nombre de rapports disponibles : "Charger (3)"
   - Ouvre la liste des rapports sauvegardés
   - Désactivé si aucun rapport sauvegardé

3. **Exporter en DOCX** (vert, icône Download)
   - Fonctionne avec les rapports chargés ou nouvellement générés

### Dialogue de sauvegarde

```
┌─────────────────────────────────────┐
│ Sauvegarder le rapport         [X]  │
├─────────────────────────────────────┤
│ Titre du rapport *                  │
│ [Rapport de présentation - v1    ]  │
│                                      │
│ Notes (optionnel)                    │
│ [Version initiale pour révision   ]  │
│ [                                 ]  │
│                                      │
│ [Enregistrer]  [Annuler]            │
└─────────────────────────────────────┘
```

### Dialogue de chargement

```
┌──────────────────────────────────────────────────────┐
│ Charger un rapport sauvegardé                   [X]  │
├──────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────┐ │
│ │ 📄 Rapport de présentation - v2                  │ │
│ │ [Validé] [v2]                                    │ │
│ │ 🕒 Créé le 15/01/2024 14:30                      │ │
│ │ ✏️ Modifié le 15/01/2024 16:45                   │ │
│ │ "Version finale après corrections"               │ │
│ │                          [Charger] [En révision▼]│ │
│ │                                        [Suppr.]  │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│ ┌──────────────────────────────────────────────────┐ │
│ │ 📄 Rapport de présentation - v1                  │ │
│ │ [Brouillon] [v1]                                 │ │
│ │ ...                                              │ │
│ └──────────────────────────────────────────────────┘ │
│                                                       │
│                                          [Fermer]     │
└──────────────────────────────────────────────────────┘
```

## Structure des données

### Table Supabase

```sql
rapports_presentation
├── id (UUID, PK)
├── num_proc (TEXT, FK → procédures)
├── titre (TEXT)
├── auteur (TEXT)
├── date_creation (TIMESTAMPTZ)
├── date_modification (TIMESTAMPTZ)
├── statut (TEXT: brouillon|en_revision|valide|publie)
├── version (INTEGER)
├── rapport_data (JSONB) ← Toutes les données du rapport
├── fichiers_sources (JSONB) ← Métadonnées des fichiers
└── notes (TEXT)
```

### Contenu JSONB rapport_data

```json
{
  "section1_contexte": { ... },
  "section2_deroulement": { ... },
  "section5_proposition": { ... },
  "section6_conformite": { ... },
  "section7_admissibilite": { ... },
  "section8_performances": { ... },
  "section9_attributaires": { ... },
  "contenuChapitre3": "Texte manuel...",
  "contenuChapitre4": "Texte manuel...",
  "contenuChapitre10": "Texte manuel..."
}
```

### Contenu JSONB fichiers_sources

```json
{
  "depots": true,
  "retraits": true,
  "an01": true
}
```

## Workflow typique

### 1. Première création

```
Sélectionner procédure
  ↓
Upload fichiers (Dépôts, Retraits, AN01)
  ↓
Générer rapport
  ↓
Saisir contenus manuels (chapitres 3, 4, 10)
  ↓
Cliquer "Sauvegarder"
  ↓
Titre: "Rapport initial"
Statut: Brouillon (par défaut)
Version: 1 (auto)
```

### 2. Modification et révision

```
Cliquer "Charger"
  ↓
Sélectionner rapport (v1)
  ↓
Charger → Données restaurées
  ↓
Modifier contenu
  ↓
Cliquer "Sauvegarder"
  ↓
Option 1: Mettre à jour (même version)
Option 2: Nouvelle version (v2)
```

### 3. Validation et publication

```
Charger rapport
  ↓
Changer statut → "En révision"
  ↓
Relecture et corrections
  ↓
Changer statut → "Validé"
  ↓
Export DOCX final
  ↓
Changer statut → "Publié"
```

## Badges de statut

| Statut | Couleur | Usage |
|--------|---------|-------|
| **Brouillon** | Gris | Version de travail initiale |
| **En révision** | Bleu | En cours de relecture |
| **Validé** | Vert | Approuvé, prêt à publier |
| **Publié** | Violet | Version finale diffusée |

## Sécurité (RLS)

### Politiques Supabase

- ✅ **SELECT** : Tous les utilisateurs authentifiés
- ✅ **INSERT** : Tous les utilisateurs authentifiés
- ✅ **UPDATE** : Tous les utilisateurs authentifiés
- ⚠️ **DELETE** : Admins uniquement

### Collaboration

- Tous les utilisateurs voient tous les rapports
- Partage instantané entre utilisateurs
- Traçabilité : auteur et dates de modification
- Workflow commun via changement de statut

## Performance

### Optimisations

- **Index B-tree** sur `num_proc`, `statut`, `date_creation`
- **Index GIN** sur `rapport_data` (JSONB)
- **Contrainte unique** sur `(num_proc, version)` → Pas de doublons

### Métriques

- Sauvegarde : < 2 secondes
- Chargement : < 2 secondes
- Taille moyenne : 50-200 KB par rapport

## Fichiers modifiés

```
components/analyse/RapportPresentation.tsx
  ├── Imports: Save, FolderOpen, Clock, useEffect, supabase
  ├── Interface: RapportSauvegarde
  ├── State: rapportsSauvegardes, rapportActuelId, dialogues, messages
  ├── Functions: loadRapportsList, handleSaveRapport, handleLoadRapport, 
  │             deleteRapport, changeStatut
  └── UI: Boutons Sauvegarder/Charger, Dialogues modaux

sql/create-rapports-presentation.sql
  ├── Table: rapports_presentation
  ├── Indexes: num_proc, statut, date_creation, rapport_data (GIN)
  ├── Trigger: update_rapport_modification_date
  └── RLS: Politiques SELECT/INSERT/UPDATE/DELETE

docs/RAPPORT_SAVE_LOAD_GUIDE.md
  └── Guide de test complet
```

## Installation

### 1. Créer la table Supabase

```bash
# Connectez-vous à Supabase
# Allez dans SQL Editor
# Exécutez le fichier sql/create-rapports-presentation.sql
```

### 2. Vérifier les permissions

```sql
-- Vérifier RLS
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rapports_presentation';

-- Vérifier les politiques
SELECT * FROM pg_policies 
WHERE tablename = 'rapports_presentation';
```

### 3. Tester

Voir le guide complet : [`docs/RAPPORT_SAVE_LOAD_GUIDE.md`](./RAPPORT_SAVE_LOAD_GUIDE.md)

## Cas d'usage

### 📝 Analyse progressive

Un analyste peut travailler sur un rapport en plusieurs sessions sans perdre son travail.

### 🔄 Workflow de validation

Plusieurs versions permettent de suivre l'évolution du rapport (brouillon → validé → publié).

### 📊 Comparaison de scénarios

Créer plusieurs versions pour comparer différentes hypothèses (lot unique vs multi-lots).

### 🗂️ Historique et traçabilité

Conserver l'historique complet des rapports avec dates et auteurs.

## Roadmap

### Version actuelle (v1.0)

- ✅ Sauvegarde/chargement de base
- ✅ Versioning automatique
- ✅ Workflow de statut
- ✅ Partage multi-utilisateurs

### Futures améliorations

- [ ] Export depuis un rapport sauvegardé (sans regénération)
- [ ] Comparaison de versions côte à côte
- [ ] Historique des modifications détaillé
- [ ] Templates de rapports réutilisables
- [ ] Champs auteur automatique (depuis profil utilisateur)
- [ ] Notifications de changement de statut
- [ ] Commentaires collaboratifs

## Support

Pour toute question ou problème :
1. Consultez [`docs/RAPPORT_SAVE_LOAD_GUIDE.md`](./RAPPORT_SAVE_LOAD_GUIDE.md)
2. Vérifiez les politiques RLS dans Supabase
3. Consultez la console du navigateur pour les erreurs

