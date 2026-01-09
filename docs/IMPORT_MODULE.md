# Module d'Import de Données

## 📋 Vue d'ensemble

Ce module permet d'importer des données depuis des fichiers Excel (.xlsx) ou CSV dans les tables Supabase `projets` et `procedures`. Il offre une interface intuitive pour charger, visualiser et valider les données avant l'import.

## ✨ Fonctionnalités

### 1. **Sélection de la table de destination**
- Choix entre `projets` et `procedures`
- Interface visuelle avec boutons dédiés
- Réinitialisation automatique lors du changement de table

### 2. **Chargement de fichiers**
- Support des formats Excel (.xlsx, .xls) et CSV
- Drag & drop ou sélection de fichier
- Lecture automatique des en-têtes de colonnes
- Détection automatique du nombre de lignes

### 3. **Mapping automatique des colonnes**
- Mapping automatique selon les en-têtes Excel
- Code couleur pour visualiser les mappings :
  - 🟢 **Vert** : Mapping automatique détecté
  - 🟡 **Jaune** : Colonne déduite automatiquement
- Affichage du mapping complet Excel → Supabase

### 4. **Aperçu des données**
- Visualisation des 10 premières lignes
- Affichage des 8 premières colonnes + indicateur pour les colonnes supplémentaires
- Vérification visuelle avant import

### 5. **Import vers Supabase**
- Bouton d'import sécurisé (admin uniquement)
- Barre de progression pendant l'import
- Messages de succès/erreur clairs
- Réinitialisation automatique après succès

## 🚀 Utilisation

### Prérequis

1. **Tables Supabase créées**
   ```bash
   # Exécuter le script SQL dans Supabase
   sql/create-tables-import.sql
   ```

2. **Rôle administrateur**
   - L'import est réservé aux utilisateurs avec le rôle `admin`

### Étapes d'import

1. **Accéder au module**
   - Connectez-vous avec un compte admin
   - Cliquez sur "Dashboard" dans le header
   - Sélectionnez l'onglet "Import de données"

2. **Sélectionner la table**
   - Cliquez sur "Projets" ou "Procédures"

3. **Charger le fichier**
   - Cliquez sur la zone de dépôt
   - Sélectionnez votre fichier Excel ou CSV
   - Attendez la lecture automatique

4. **Vérifier le mapping**
   - Consultez le mapping des colonnes
   - Vérifiez que les colonnes correspondent

5. **Prévisualiser les données**
   - Vérifiez l'aperçu des 10 premières lignes
   - Assurez-vous que les données sont correctes

6. **Lancer l'import**
   - Cliquez sur "Importer dans Supabase"
   - Attendez la confirmation de succès

## 📊 Structure des fichiers Excel

### Table Projets

Le fichier Excel doit contenir les colonnes suivantes (en-têtes exactes) :

```
IDProjet
Acheteur
Famille Achat Principale
Numéro de procédure (Afpa)
Prescripteur
Client Interne
Statut du Dossier
Programme
Opération
Levier Achat
Renouvellement de marché
Date de lancement de la consultation
Date de déploiement prévisionnelle du marché
Perf achat prévisionnelle (en %)
Montant prévisionnel du marché (€ HT)
... (voir liste complète dans DataImport.tsx)
```

### Table Procédures

Colonnes principales :
```
Numéro de procédure (Afpa)
Nom de la procédure
Type de procédure
Statut de la consultation
Date de lancement de la consultation
Date de remise des offres
Objet court
```

## 🎨 Mapping des colonnes

### Projets

Le mapping automatique convertit les en-têtes Excel en noms de colonnes Supabase :

| Excel | Supabase |
|-------|----------|
| IDProjet | id_projet |
| Acheteur | acheteur |
| Famille Achat Principale | famille_achat_principale |
| Numéro de procédure (Afpa) | numero_procedure_afpa |
| ... | ... |

### Procédures

| Excel | Supabase |
|-------|----------|
| Numéro de procédure (Afpa) | numero_procedure |
| Nom de la procédure | nom_procedure |
| Type de procédure | type_procedure |
| ... | ... |

## 🔒 Sécurité

### Row Level Security (RLS)

Les tables sont protégées par RLS :
- ✅ **Lecture** : Tous les utilisateurs authentifiés
- ✅ **Écriture** : Admins uniquement (INSERT, UPDATE, DELETE)

### Validation des données

- Vérification des types de données
- Filtrage des lignes vides
- Gestion des erreurs Supabase
- Messages d'erreur détaillés

## 🛠️ Personnalisation

### Ajouter/Modifier le mapping

Éditez le fichier `components/auth/DataImport.tsx` :

```typescript
const COLUMN_MAPPINGS: Record<string, Record<string, string>> = {
  projets: {
    'Votre Colonne Excel': 'votre_colonne_supabase',
    // ...
  },
  procedures: {
    // ...
  }
};
```

### Modifier le nombre de lignes d'aperçu

```typescript
// Ligne 142 dans DataImport.tsx
const preview = rows.slice(0, 10).map(row => {
  // Modifier 10 par le nombre souhaité
```

### Modifier le nombre de colonnes affichées

```typescript
// Ligne 379 dans DataImport.tsx
{importedData?.headers.slice(0, 8).map((header, index) => (
  // Modifier 8 par le nombre souhaité
```

## 📝 Format des fichiers

### Excel (.xlsx)

- **Première ligne** : En-têtes de colonnes
- **Lignes suivantes** : Données
- **Feuille** : Première feuille du classeur
- **Encodage** : UTF-8 recommandé

### CSV

- **Séparateur** : Virgule (,) ou point-virgule (;)
- **Encodage** : UTF-8
- **Première ligne** : En-têtes

## ⚠️ Gestion des erreurs

### Erreurs courantes

| Erreur | Cause | Solution |
|--------|-------|----------|
| "Permission denied" | Pas de rôle admin | Vérifier le rôle dans `profiles` |
| "Column not found" | Colonne Supabase inexistante | Vérifier le mapping ou créer la colonne |
| "Fichier vide" | Pas de données | Vérifier le fichier Excel/CSV |
| "Duplicate key" | Doublon sur clé unique | Vérifier les données ou supprimer les doublons |

### Debugging

1. **Console navigateur** : Affiche les erreurs détaillées
2. **Messages UI** : Affichage visuel des erreurs
3. **Logs Supabase** : Vérifier les logs dans le dashboard Supabase

## 🧪 Tests

### Fichier de test

Créez un fichier Excel de test avec :
- 3-5 lignes de données
- Toutes les colonnes obligatoires
- Données valides

### Scénarios de test

1. ✅ Import de 5 lignes dans `projets`
2. ✅ Import de 3 lignes dans `procedures`
3. ✅ Gestion d'erreur : fichier vide
4. ✅ Gestion d'erreur : utilisateur non-admin
5. ✅ Visualisation de l'aperçu
6. ✅ Changement de table cible

## 📦 Dépendances

- `xlsx` : Lecture des fichiers Excel
- `lucide-react` : Icônes
- `@supabase/supabase-js` : Client Supabase
- `React` : Framework UI

## 🔄 Workflow complet

```
1. Admin accède au Dashboard
   ↓
2. Sélectionne l'onglet "Import de données"
   ↓
3. Choisit la table (projets/procedures)
   ↓
4. Charge un fichier Excel/CSV
   ↓
5. Le système lit les en-têtes et les données
   ↓
6. Mapping automatique des colonnes
   ↓
7. Affichage de l'aperçu (10 lignes)
   ↓
8. Validation visuelle par l'admin
   ↓
9. Clic sur "Importer dans Supabase"
   ↓
10. Transformation des données selon le mapping
   ↓
11. Insert dans Supabase avec vérification RLS
   ↓
12. Message de confirmation + réinitialisation
```

## 💡 Conseils

- ✅ Toujours prévisualiser avant d'importer
- ✅ Commencer par un petit fichier de test
- ✅ Vérifier le mapping automatique
- ✅ Sauvegarder les données existantes avant import massif
- ✅ Utiliser des noms de colonnes cohérents dans Excel
- ✅ Éviter les caractères spéciaux dans les en-têtes

## 📞 Support

En cas de problème :
1. Vérifier la console navigateur (F12)
2. Vérifier les logs Supabase
3. Vérifier les politiques RLS
4. Vérifier le rôle utilisateur

## 🎯 Améliorations futures

- [ ] Import par batch pour gros fichiers
- [ ] Validation des données avant import
- [ ] Export de template Excel
- [ ] Historique des imports
- [ ] Rollback en cas d'erreur
- [ ] Import incrémental (update des données existantes)

---

**Version** : 1.0.0  
**Date** : 2026-01-09  
**Auteur** : GitHub Copilot
