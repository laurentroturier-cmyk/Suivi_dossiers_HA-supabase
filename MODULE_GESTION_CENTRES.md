# Module Gestion des Centres - Multi-Régions

## 📋 Vue d'ensemble

Module admin exclusif pour l'import, l'analyse et la gestion des données financières de centres de restauration répartis sur 13 régions.

## 🎯 Fonctionnalités principales

### 1. Import de fichiers Excel
- **Import multiple** : Jusqu'à 13 fichiers Excel simultanément
- **Parsing intelligent** : 
  - Nom du fichier = Région (ex: "AURA - ANNECY.xlsx")
  - Chaque onglet = Centre
  - Détection automatique des années en colonnes
  - Extraction de toutes les lignes de données financières

### 2. Structure des données importées

#### Données de repas
- Nombre de repas
- Dont repas stagiaires
- Dont repas salariés
- Autres repas (invités, entreprises, etc.)

#### Données financières
- Produits d'activités
- Dont collectivités territoriales, subventions et AP
- Charges directes
- Dont énergie et fluides
- Dont charges de personnel

#### Marges
- Marge sur coûts directs - EBE
- Dotations aux amortissements
- Charges structures
- Total charges
- Marge sur coûts complets

### 3. Visualisation des données
- **Tableau de synthèse** : Vue complète avec filtres avancés
- **Filtres** :
  - Par région
  - Par centre
  - Par année
  - Recherche textuelle
- **Export Excel** : Extraction des données filtrées

### 4. Statistiques par région
- Nombre de centres
- Nombre d'années couvertes
- Total des repas
- Total des produits
- Date de dernière mise à jour

### 5. Historique des imports
- Suivi de chaque import
- Statut (En cours / Terminé / Erreur)
- Nombre d'onglets traités
- Nombre de lignes importées
- Messages d'erreur détaillés

## 🗄️ Base de données

### Tables créées

#### `centres_donnees_financieres`
Table principale stockant toutes les données des centres.

**Colonnes principales** :
- `region` : Nom de la région (nom du fichier)
- `centre` : Nom du centre (nom de l'onglet)
- `annee` : Année des données
- Toutes les métriques financières et de repas
- Métadonnées d'upload

**Index** :
- Sur `region`, `centre`, `annee` pour performances optimales
- Contrainte unique sur `(region, centre, annee)` pour éviter les doublons

#### `imports_fichiers_centres`
Table de suivi des imports.

**Colonnes** :
- `nom_fichier` : Nom du fichier uploadé
- `region` : Région associée
- `nombre_onglets` : Nombre d'onglets traités
- `nombre_lignes_importees` : Total de lignes insérées
- `statut` : en_cours / termine / erreur
- `message_erreur` : Détails en cas d'erreur

### Vue SQL

#### `synthese_centres`
Vue optimisée pour le reporting rapide.

### Fonctions SQL

#### `stats_par_region()`
Retourne les statistiques agrégées par région.

#### `nettoyer_donnees_region(p_region TEXT)`
Supprime toutes les données d'une région spécifique.

## 🔒 Sécurité (RLS)

### Politiques d'accès

**Admins** :
- ✅ Lecture complète
- ✅ Insertion
- ✅ Mise à jour
- ✅ Suppression

**Users** :
- ✅ Lecture seule
- ❌ Pas de modification

## 🚀 Utilisation

### 1. Configuration Supabase

```bash
# Exécuter le script SQL dans l'éditeur SQL de Supabase
cat supabase-gestion-centres.sql
```

Le script crée :
- Les tables avec RLS
- Les index pour performances
- Les vues et fonctions
- Les politiques de sécurité

### 2. Accès au module

1. Se connecter en tant qu'**admin**
2. Accéder au **Dashboard Admin**
3. Cliquer sur l'onglet **"Gestion Centres"** (icône Building2)

### 3. Import de fichiers

#### Préparation des fichiers Excel

**Structure requise** :
```
Fichier : AURA - ANNECY.xlsx
├── Onglet 1 : GRN 166
│   ├── Ligne d'en-tête avec années : 2019 | 2020 | 2021 | 2022 | 2023 | 2024
│   ├── Nombre de repas
│   ├── Dont repas stagiaires
│   ├── ...
│   └── Marge sur coûts complets
├── Onglet 2 : Centre XYZ
│   └── ...
└── Onglet N : ...
```

**Format des données** :
- Années : Format 4 chiffres (2019, 2020, etc.)
- Nombres : Peuvent contenir des espaces (ex: "14 411" → 14411)
- Valeurs négatives : Supportées
- Cellules vides : Converties en NULL

#### Étapes d'import

1. Cliquer sur **"Import Fichiers"**
2. Sélectionner jusqu'à **13 fichiers Excel**
3. Vérifier la liste des fichiers sélectionnés
4. Cliquer sur **"Importer les fichiers"**
5. Attendre la confirmation

**Gestion des doublons** :
- Si des données existent déjà pour une combinaison `(région, centre, année)`, elles seront **mises à jour** (UPSERT)

### 4. Consultation des données

#### Onglet "Données"

**Filtres disponibles** :
- Recherche textuelle
- Sélection par région
- Sélection par centre
- Sélection par année

**Export** :
- Bouton **"Exporter Excel"** pour télécharger les données filtrées

#### Onglet "Statistiques"

Vue agrégée par région avec :
- Nombre de centres
- Nombre d'années
- Total des repas
- Total des produits
- Date de dernière mise à jour

#### Onglet "Historique"

Liste des 20 derniers imports avec :
- Nom du fichier
- Région
- Nombre d'onglets et lignes
- Statut et erreurs éventuelles

## 🎨 Interface utilisateur

### Navigation par onglets
- **Import Fichiers** : Zone de drop + upload multiple
- **Données** : Tableau avec filtres et export
- **Statistiques** : Cards par région
- **Historique** : Liste des imports

### Indicateurs visuels
- **Statut d'import** : 
  - 🔵 Bleu = En cours
  - 🟢 Vert = Terminé
  - 🔴 Rouge = Erreur
- **Marges** :
  - 🟢 Vert = Positif
  - 🔴 Rouge = Négatif

## 📊 Exemple de mapping des données

### Fichier source
```
Fichier : AURA - ANNECY.xlsx
Onglet : GRN 166

                          | 2019    | 2020   | 2021   | ...
--------------------------|---------|--------|--------|----
Nombre de repas           | 14 411  | 7 196  | 9 462  | ...
Dont repas stagiaires     | 8 797   | 4 449  | 6 375  | ...
Produits d'activités      | 114 482 | 63 880 | 107 266| ...
Charges directes          | -198 988| -148 095|-155 031| ...
Marge sur coûts directs   | -84 506 | -84 215| -47 765| ...
```

### Base de données
```sql
INSERT INTO centres_donnees_financieres (
  region, centre, annee,
  nombre_repas, dont_repas_stagiaires,
  produits_activites, charges_directes,
  marge_couts_directs_ebe, ...
) VALUES (
  'AURA - ANNECY', 'GRN 166', 2019,
  14411, 8797, 114482, -198988, -84506, ...
);
```

## 🛠️ Maintenance

### Suppression de données

**Supprimer toutes les données** :
```typescript
// Via l'interface
Bouton "Tout supprimer" dans l'onglet Import

// Via SQL
DELETE FROM centres_donnees_financieres;
```

**Supprimer une région** :
```sql
SELECT nettoyer_donnees_region('AURA - ANNECY');
```

### Rafraîchissement

Les données sont automatiquement rafraîchies après chaque import. Pour forcer un rafraîchissement manuel :
- Changer d'onglet et revenir
- Ou rafraîchir la page

## 🐛 Dépannage

### Erreur : "Aucune donnée trouvée"
**Cause** : Le format du fichier ne correspond pas
**Solution** :
- Vérifier la présence des années en en-tête
- Vérifier les libellés des lignes de données

### Erreur : "Permission denied"
**Cause** : L'utilisateur n'est pas admin
**Solution** :
- Vérifier le rôle dans `profiles` :
  ```sql
  SELECT * FROM profiles WHERE email = 'user@example.com';
  ```

### Erreur : "Duplicate key"
**Cause** : Import d'une région/centre/année déjà existant
**Solution** : 
- Normal, la fonction UPSERT met à jour automatiquement
- Aucune action requise

### Import lent
**Cause** : Fichiers très volumineux
**Solution** :
- Importer par lots de 3-4 fichiers
- Les index optimisent déjà les performances

## 📈 Évolutions futures possibles

- [ ] Graphiques de tendance par centre
- [ ] Comparaison inter-régions
- [ ] Export PDF des rapports
- [ ] Alertes sur marges négatives
- [ ] Prévisions basées sur historique
- [ ] Import via API REST
- [ ] Webhook Power Automate pour notification d'import

## 📦 Fichiers du module

```
components/auth/components/
├── GestionCentres.tsx          # Composant principal du module

supabase-gestion-centres.sql    # Script SQL de création

MODULE_GESTION_CENTRES.md       # Cette documentation
```

## 🔗 Intégration

Le module s'intègre dans :
- `AdminDashboard.tsx` : Nouvel onglet "Gestion Centres"
- `auth/index.tsx` : Export du composant
- Menu latéral : Accessible uniquement si `role === 'admin'`

## ✅ Checklist de mise en production

- [ ] Exécuter `supabase-gestion-centres.sql` dans Supabase
- [ ] Vérifier les politiques RLS
- [ ] Tester l'import avec 1 fichier
- [ ] Vérifier les données dans la table
- [ ] Tester les filtres et l'export
- [ ] Vérifier les statistiques
- [ ] Tester la suppression (en dev uniquement !)
- [ ] Former les admins à l'utilisation

---

**Module créé le** : 2 février 2026  
**Version** : 1.0.0  
**Accès** : Admin uniquement  
**Stack** : React + TypeScript + Supabase + XLSX
