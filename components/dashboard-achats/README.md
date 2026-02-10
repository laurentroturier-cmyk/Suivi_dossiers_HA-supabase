# Dashboard Achats - Module de Reporting

## Vue d'ensemble

Le module **Dashboard Achats** est un outil d'analyse et de visualisation de données d'achats publics. Il permet de charger des fichiers Excel/CSV contenant des données d'achats et de générer automatiquement un tableau de bord complet avec :

- **KPIs** (indicateurs clés de performance)
- **Graphiques interactifs** (barres, camemberts, etc.)
- **Filtres dynamiques** (trimestre, famille, région, statut, catégorie)
- **Tableaux de données** détaillés avec recherche et tri
- **Export CSV** des données filtrées

## Accès au module

1. Depuis la **Landing Page**, cliquer sur la tuile **"Indicateurs & Pilotage"**
2. Sélectionner **"Reporting Achats"** (marqué "NOUVEAU")

## Utilisation

### 1. Chargement des fichiers

- Glisser-déposer vos fichiers Excel (.xlsx, .xls) ou CSV (.csv)
- Ou cliquer pour sélectionner manuellement
- Formats acceptés : `.xlsx`, `.xls`, `.csv`, `.tsv`
- Plusieurs fichiers peuvent être chargés simultanément

### 2. Analyse des données

- Cliquer sur "Analyser les données"
- Le système consolidera automatiquement tous les fichiers
- Les colonnes monétaires seront normalisées

### 3. Navigation dans le dashboard

Le dashboard propose 5 onglets :

#### 📊 Vue d'ensemble
- 6 KPIs principaux (CA Commandé, CA Facturé, CA Livré, Montant Total, Fournisseurs, Commandes)
- 4 graphiques : CA par trimestre, répartition par famille, statut des commandes, top 10 fournisseurs

#### 📂 Familles & Catégories
*(En développement)*
- Analyse détaillée par famille d'achats
- Sous-familles et catégories
- Évolution temporelle

#### 🏢 Fournisseurs
*(En développement)*
- Classement des fournisseurs
- Taux de facturation
- Nombre de commandes

#### 🗺️ Entités & Régions
*(En développement)*
- Répartition géographique
- Centres de responsabilité
- Croisement région × famille

#### 📄 Données détaillées
- Tableau complet de toutes les lignes
- Recherche en temps réel
- Tri par colonne
- Pagination (50 lignes par page)
- Export CSV

### 4. Filtres

Les filtres s'appliquent à tous les onglets :

- **Trimestre** : filtrer par période
- **Famille d'achats** : filtrer par famille
- **Région (CRT)** : filtrer par centre régional
- **Statut** : filtrer par statut de document
- **Catégorie d'achats** : filtrer par catégorie

Cliquer sur "✕ Réinitialiser" pour effacer tous les filtres.

## Structure des données attendues

Le fichier Excel/CSV doit contenir les colonnes suivantes (les noms exacts sont importants) :

### Colonnes obligatoires monétaires
- `Montant de ligne de bon de commande`
- `Montant de ventilation livré`
- `Montant de ventilation facturé`
- `Montant de la ventilation de commande`
- `Montant total`

### Colonnes obligatoires texte
- `Fournisseur`
- `SIREN`
- `Trimestre`
- `N° de contrat`
- `Projet`
- `Ligne`
- `Compte PCG`
- `Famille d'achats`
- `Sous-famille d'achats`
- `Catégorie d'achats`
- `UO`
- `Description de l'UO`
- `CR`
- `Description du CR`
- `CRT`
- `Description du CRT`
- `Commande`
- `Date de création`
- `Description de l'article`
- `Signification du statut du document`
- `Type`
- `Nom du demandeur de l'achat`
- `Commande REGUL`

## Fonctionnalités techniques

### Parsing des données
- Support Excel multi-feuilles (toutes les feuilles sont consolidées)
- Normalisation automatique des montants (gestion des espaces, virgules/points)
- Détection automatique des formats de dates

### Graphiques
- Powered by **Chart.js** et **react-chartjs-2**
- Graphiques réactifs et interactifs
- Tooltips avec formatage monétaire
- Support du mode clair/sombre

### Performance
- Pagination pour les grandes quantités de données
- Filtres optimisés avec React hooks
- Rendu conditionnel pour économiser les ressources

## Architecture du code

```
components/dashboard-achats/
├── index.ts                  # Point d'entrée
├── types.ts                  # Définitions TypeScript
├── constants.ts              # Constantes (couleurs, colonnes, etc.)
├── utils.ts                  # Fonctions utilitaires
├── DashboardAchats.tsx       # Composant principal
├── UploadZone.tsx            # Zone de téléchargement
├── FiltersBar.tsx            # Barre de filtres
├── KPICards.tsx              # Cartes d'indicateurs
├── Charts.tsx                # Graphiques (vue d'ensemble)
└── DataTable.tsx             # Tableau de données
```

## Dépendances

- `chart.js` : bibliothèque de graphiques
- `react-chartjs-2` : wrapper React pour Chart.js
- `xlsx` : lecture de fichiers Excel
- `tailwindcss` : styles
- `lucide-react` : icônes

## Évolutions futures

- ✅ Onglet "Vue d'ensemble" : **Terminé**
- ✅ Onglet "Données détaillées" : **Terminé**
- 🚧 Onglet "Familles & Catégories" : En cours
- 🚧 Onglet "Fournisseurs" : En cours
- 🚧 Onglet "Régions" : En cours
- 📋 Sauvegarde des analyses dans Supabase
- 📋 Génération de rapports PDF
- 📋 Export Excel avancé avec graphiques
- 📋 Comparaison multi-périodes
- 📋 Tableaux croisés dynamiques

## Support & Contact

Pour toute question ou demande d'évolution, contactez l'équipe DNA.

---

**Version** : 1.0.0  
**Date de création** : Février 2026  
**Dernière mise à jour** : Février 2026
