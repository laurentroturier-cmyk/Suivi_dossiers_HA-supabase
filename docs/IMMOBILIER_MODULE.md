# Module ImmoVision - Integration Guide

## 📋 Résumé de l'implémentation

Un nouveau module **ImmoVision** a été créé et intégré à l'application GestProjet pour piloter et analyser le portefeuille immobilier.

## 🏗️ Architecture du module

### Structure créée

```
gestprojet/
├── types/
│   └── immobilier.ts          # Types TypeScript pour immobilier
├── services/supabase/
│   └── immobilier.ts          # Service Supabase pour immobilier
├── stores/
│   └── useImmobilierStore.ts  # Store Zustand pour immobilier
├── hooks/
│   └── useImmobilier.ts       # Hook React personnalisé
├── components/immobilier/
│   ├── ImmobilierDashboard.tsx     # Tableau de bord KPI
│   ├── ImmobilierTable.tsx         # Tableau des projets
│   ├── ImmobilierTableFilters.tsx  # Filtres avancés
│   └── index.ts                    # Exports
└── pages/
    └── ImmobilierPage.tsx     # Page principale du module
```

## 🔧 Composants créés

### 1. **Types (`types/immobilier.ts`)**
- Interface `Immobilier` : Représente un projet immobilier avec tous les champs de la table
- Interface `ImmobilierStats` : Statistiques agrégées
- Interface `ImmobilierFilters` : Structure de filtrage avancé
- Interface `ImmobilierColumn` : Configuration des colonnes

### 2. **Service Supabase (`services/supabase/immobilier.ts`)**
Méthodes disponibles:
- `getAll()` : Récupérer tous les projets
- `getByCodeDemande(codeDemande)` : Récupérer un projet spécifique
- `create(project)` : Créer un nouveau projet
- `update(codeDemande, updates)` : Mettre à jour un projet
- `delete(codeDemande)` : Supprimer un projet
- `search(filters)` : Rechercher avec filtres
- `bulkInsert(projects)` : Importer plusieurs projets
- `getStats()` : Calculer les statistiques

### 3. **Store Zustand (`stores/useImmobilierStore.ts`)**
Gère l'état global avec:
- États : `projets`, `stats`, `loading`, `error`, `selectedProjet`
- Actions CRUD : `createProjet`, `updateProjet`, `deleteProjet`
- Actions de chargement : `loadProjets`, `loadStats`
- Recherche : `searchProjets`, `bulkImport`

### 4. **Hook React (`hooks/useImmobilier.ts`)**
Interface simplifiée pour utiliser le store avec:
- Accès direct à l'état
- Méthodes de filtrage : `getProjetsParRegion()`, `getProjetsParStatut()`, etc.
- Recherche rapide : `searchProjetsQuick()`

### 5. **Composants UI**

#### `ImmobilierDashboard.tsx`
Affiche les indicateurs clés:
- Nombre total de projets
- Budget total engagé
- Budget réalisé
- Taux moyen de réalisation
- Projets en cours / terminés

Couleurs : Bleu, Vert, Violet, Orange (cohérent avec l'app)

#### `ImmobilierTableFilters.tsx`
Système de filtres avancés:
- Recherche texte rapide (code, intitulé, site)
- Filtres par : Région, Centre, Statut, Priorité, Chef de Projet, Programme
- Boutons : Rechercher, Réinitialiser
- Interface repliable pour économiser l'espace

#### `ImmobilierTable.tsx`
Tableau interactif des projets:
- Colonnes : Code, Intitulé, Région, Statut, Budget, Progression (barre %)
- Lignes extensibles avec détails complètes
- Détails affichés : Localisation, Équipe, Finances, Dates, Programme
- Icônes Lucide pour chaque catégorie

### 6. **Page (`pages/ImmobilierPage.tsx`)**
Page complète du module avec:
- Titre et description
- Bouton d'export CSV
- Section des indicateurs clés
- Section des filtres
- Section du tableau des projets
- Gestion du chargement

## 🎨 Design & Couleurs

Le module suit les conventions de l'application:

| Élément | Couleur | Classes |
|---------|---------|---------|
| Icône Badge | Amber | `bg-amber-100 dark:bg-amber-500/20`, `text-amber-600` |
| Bordures | Amber | `border-amber-200 dark:border-amber-500/40` |
| Accent | Amber | Cohérent avec Building2 icon |
| Support Thème | ✅ | Dark mode complètement supporté |

**Icône** : `Building2` (lucide-react)

## 🔗 Intégration dans l'application

### Routes
- Route ajoutée : `/immobilier` → `ImmobilierPage`
- Route protégée (nécessite authentification)

### Page d'accueil
- **Placement** : Sous-item de la carte "Projets"
- **Titre** : "ImmoVision"
- **Description** : "Gestion du portefeuille immobilier"
- **Icône** : Building2 (Amber)
- Cartes des sous-items entièrement stylisées

## 🚀 Utilisation

### Pour accéder au module:
1. Cliquer sur "Projets" dans la page d'accueil
2. Un sous-item "ImmoVision" s'affiche
3. Cliquer sur "ImmoVision" pour accéder au module complet
4. Ou naviguer directement via `/immobilier`

### Chargement des données:
```tsx
const { projets, loadProjets, stats } = useImmobilier();

useEffect(() => {
  loadProjets(); // Charger tous les projets au montage
}, []);
```

### Recherche et filtrage:
```tsx
const { searchProjets } = useImmobilier();

await searchProjets({
  search: 'terme',
  region: 'Bretagne',
  statut: 'En cours'
});
```

### Export de données:
Le bouton "Exporter" en haut de page génère un fichier CSV avec:
- Code demande
- Intitulé
- Région / Centre / Statut
- Budget / Progression
- Chef de Projet / Priorité

## 📊 Fonctionnalités activées

✅ **Gestion et Centralisation**
- Import via la table Supabase
- Mémorisation automatique des données

✅ **Pilotage et Indicateurs**
- 4 indicateurs majeurs (projets, budget, engagé, taux réalisation)
- Statistiques supplémentaires (en cours, terminés, réalisé)

✅ **Exploration et Filtrage**
- Recherche texte complète
- 6+ filtres avancés
- Sauvegarde de filtres possible (extension future)

✅ **Détails et Drill-Down**
- Expansion des lignes pour afficher les détails complets
- Navigation intuitive par région/statut

✅ **Exportation**
- Export CSV des données filtrées

✅ **Ergonomie**
- Support du mode sombre complet
- Interface réactive et fluide
- Pagination implicite via virtualisation future (si nécessaire)

## 🔌 Configuration Supabase

Assurez-vous que la table `immobilier` existe avec le schéma fourni:
```sql
create table public.immobilier (
  "Code demande" text not null primary key,
  "Statut" text null,
  "Région" text null,
  -- ... autres champs
) TABLESPACE pg_default;
```

## 🐛 Débogage

### Afficher les logs:
- Ouvrez la console du navigateur (F12)
- Les erreurs Supabase seront affichées

### Vérifier les données:
1. Aller dans Supabase Studio
2. Vérifier que la table `immobilier` a les données
3. Vérifier les permissions RLS si nécessaire

## 📝 Notes

- Zustand a été ajouté aux dépendances (`npm install zustand`)
- Tous les composants supportent le thème sombre
- Les styles utilisent Tailwind CSS (cohérent avec l'app)
- Toutes les icônes proviennent de lucide-react

## 🔄 Prochaines étapes possibles

1. Ajouter un dialogue de création/édition de projets
2. Implémenter les favoris/filtres sauvegardés
3. Ajouter des graphiques supplémentaires (Recharts est installé)
4. Export PDF/Word (docx est déjà installé)
5. Import d'Excel simplifié
6. Notifications en temps réel (Supabase Realtime)
