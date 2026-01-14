# Guide de test - Sauvegarde/Chargement des Rapports de Présentation

## 🚀 Configuration initiale

### 1. Créer la table dans Supabase

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Exécutez le fichier [`sql/create-rapports-presentation.sql`](../sql/create-rapports-presentation.sql)
4. Vérifiez que la table `rapports_presentation` est créée dans l'onglet **Table Editor**

### 2. Vérifier les permissions

La table utilise Row Level Security (RLS) avec les politiques suivantes :
- ✅ **SELECT** : Tous les utilisateurs authentifiés
- ✅ **INSERT** : Tous les utilisateurs authentifiés
- ✅ **UPDATE** : Tous les utilisateurs authentifiés
- ✅ **DELETE** : Admins uniquement

## 🧪 Scénarios de test

### Test 1 : Sauvegarder un rapport

1. Ouvrez l'application et allez dans **Rapport de Présentation**
2. Sélectionnez une procédure
3. Chargez les fichiers requis (Dépôts, Retraits, AN01)
4. Cliquez sur **Générer le Rapport de Présentation**
5. Cliquez sur le bouton **Sauvegarder** (orange)
6. Dans le dialogue :
   - Saisissez un titre : "Rapport de présentation - Test v1"
   - Ajoutez des notes (optionnel) : "Première version pour validation"
   - Cliquez sur **Enregistrer**

**Résultat attendu :**
- ✅ Message de confirmation "Rapport enregistré avec succès"
- ✅ Le dialogue se ferme automatiquement après 2 secondes
- ✅ Le bouton "Charger" affiche maintenant "(1)"

### Test 2 : Charger un rapport sauvegardé

1. Cliquez sur le bouton **Charger** (violet)
2. Dans la liste, vous devriez voir votre rapport avec :
   - 📋 Titre
   - 🏷️ Badge "Brouillon" (gris)
   - 🏷️ Badge "v1"
   - 🕒 Date de création
3. Cliquez sur **Charger**

**Résultat attendu :**
- ✅ Message "Rapport chargé avec succès"
- ✅ Le dialogue se ferme
- ✅ Toutes les données du rapport sont restaurées
- ✅ Les contenus manuels (chapitres 3, 4, 10) sont rechargés

### Test 3 : Modifier et mettre à jour un rapport

1. Chargez un rapport existant
2. Modifiez le contenu d'un chapitre manuel (ex: Chapitre 3)
3. Cliquez sur **Sauvegarder**
4. Modifiez le titre si nécessaire ou laissez-le
5. Cliquez sur **Mettre à jour**

**Résultat attendu :**
- ✅ Message "Rapport mis à jour avec succès"
- ✅ Dans le dialogue Charger, la date de modification est affichée
- ✅ Le numéro de version reste identique (pas de nouvelle version)

### Test 4 : Créer une nouvelle version

1. Chargez un rapport existant
2. Apportez des modifications importantes
3. Cliquez sur **Sauvegarder**
4. Changez le titre : "Rapport de présentation - Test v2"
5. Cliquez sur **Enregistrer** (pas "Mettre à jour")

**Résultat attendu :**
- ✅ Un nouveau rapport est créé avec version = 2
- ✅ Le bouton "Charger" affiche maintenant "(2)"
- ✅ Les deux versions sont listées dans le dialogue Charger

### Test 5 : Changer le statut d'un rapport

1. Cliquez sur **Charger**
2. Dans la liste des rapports, utilisez le menu déroulant pour changer le statut
3. Sélectionnez "En révision"

**Résultat attendu :**
- ✅ Message "Statut mis à jour avec succès"
- ✅ Le badge change de couleur :
   - Brouillon : gris
   - En révision : bleu
   - Validé : vert
   - Publié : violet

### Test 6 : Supprimer un rapport

1. Cliquez sur **Charger**
2. Cliquez sur le bouton **Suppr.** (rouge) d'un rapport
3. Confirmez la suppression

**Résultat attendu :**
- ✅ Dialogue de confirmation
- ✅ Message "Rapport supprimé avec succès"
- ✅ Le rapport disparaît de la liste
- ✅ Le compteur du bouton "Charger" est décrémenté

### Test 7 : Workflow complet multi-utilisateur

#### Utilisateur 1 (créateur)
1. Crée un rapport "Analyse marché travaux"
2. Statut : Brouillon
3. Sauvegarde

#### Utilisateur 2 (réviseur)
1. Charge le rapport "Analyse marché travaux"
2. Apporte des corrections
3. Change le statut à "En révision"
4. Sauvegarde (mise à jour)

#### Utilisateur 1 (créateur)
1. Recharge le rapport
2. Vérifie les modifications
3. Change le statut à "Validé"
4. Exporte en DOCX

**Résultat attendu :**
- ✅ Les modifications sont visibles pour tous les utilisateurs
- ✅ L'historique des modifications est préservé
- ✅ Le workflow de validation fonctionne

### Test 8 : Gestion des versions pour une même procédure

1. Sélectionnez la procédure "P2024-001"
2. Créez 3 versions différentes :
   - v1 : Première analyse (brouillon)
   - v2 : Ajout détails financiers (en révision)
   - v3 : Version finale (validé)
3. Changez de procédure et revenez

**Résultat attendu :**
- ✅ Les 3 versions sont affichées dans le dialogue Charger
- ✅ Triées par date de création (plus récentes en premier)
- ✅ Chaque version a un numéro unique (1, 2, 3)
- ✅ Statuts différenciés par couleur

## 🔍 Vérifications dans Supabase

### Vérifier les données enregistrées

1. Allez dans **Table Editor** > `rapports_presentation`
2. Vérifiez les colonnes :
   - `id` : UUID unique
   - `num_proc` : Référence correcte à la procédure
   - `titre` : Titre saisi
   - `statut` : Valeur parmi (brouillon, en_revision, valide, publie)
   - `version` : Incrémenté automatiquement
   - `rapport_data` : Objet JSON avec toutes les sections
   - `fichiers_sources` : Métadonnées des fichiers

### Vérifier le contenu JSONB

```sql
-- Voir la structure du rapport_data
SELECT 
  titre,
  version,
  rapport_data->'section1_contexte' as contexte,
  rapport_data->'section8_performances' as performances
FROM rapports_presentation
WHERE num_proc = 'P2024-001';
```

### Vérifier le trigger de modification

```sql
-- Mettre à jour un rapport
UPDATE rapports_presentation
SET notes = 'Test mise à jour'
WHERE id = 'votre-uuid';

-- Vérifier que date_modification a été mise à jour automatiquement
SELECT titre, date_creation, date_modification
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

## 🐛 Dépannage

### Erreur "Permission denied for table rapports_presentation"

**Solution :** Vérifier que RLS est bien activé et que les politiques sont créées.

```sql
-- Vérifier RLS
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rapports_presentation';

-- Voir les politiques
SELECT * FROM pg_policies 
WHERE tablename = 'rapports_presentation';
```

### Erreur "duplicate key value violates unique constraint"

**Solution :** Un rapport avec la même version existe déjà pour cette procédure.

```sql
-- Voir les versions existantes
SELECT num_proc, version, titre
FROM rapports_presentation
WHERE num_proc = 'P2024-001'
ORDER BY version;
```

### Le rapport ne se charge pas complètement

**Vérification :** La structure JSONB doit correspondre à RapportContent.

```sql
-- Vérifier la structure
SELECT 
  titre,
  jsonb_pretty(rapport_data)
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

### Le trigger ne met pas à jour date_modification

**Solution :** Recréer le trigger.

```sql
DROP TRIGGER IF EXISTS trigger_update_rapport_modification_date ON rapports_presentation;
DROP FUNCTION IF EXISTS update_rapport_modification_date();

-- Puis ré-exécuter le script de création
```

## ✅ Checklist de validation

Avant de considérer la fonctionnalité comme validée :

- [ ] La table `rapports_presentation` est créée
- [ ] Les politiques RLS fonctionnent correctement
- [ ] Sauvegarde d'un nouveau rapport ✓
- [ ] Chargement d'un rapport sauvegardé ✓
- [ ] Mise à jour d'un rapport existant ✓
- [ ] Création de nouvelles versions ✓
- [ ] Changement de statut ✓
- [ ] Suppression de rapport (admin uniquement) ✓
- [ ] Affichage correct des dates et métadonnées ✓
- [ ] Gestion des notes ✓
- [ ] Export DOCX depuis un rapport chargé ✓
- [ ] Persistance des contenus manuels (chapitres 3, 4, 10) ✓
- [ ] Le trigger de modification fonctionne ✓
- [ ] Multi-utilisateurs : les rapports sont partagés ✓

## 📊 Métriques de succès

- **Temps de sauvegarde** : < 2 secondes
- **Temps de chargement** : < 2 secondes
- **Taille moyenne d'un rapport** : 50-200 KB (JSONB)
- **Nombre de versions par procédure** : Illimité
- **Partage entre utilisateurs** : Instantané

## 🎯 Cas d'usage réels

### Cas 1 : Analyse en plusieurs étapes

Jour 1 : Upload des fichiers, génération rapport (brouillon)
Jour 2 : Ajout contenu manuel chapitres 3 et 4 (en révision)
Jour 3 : Relecture, corrections (validé)
Jour 4 : Export final (publié)

### Cas 2 : Comparaison de scénarios

- Version 1 : Analyse avec lot unique
- Version 2 : Analyse avec lots multiples
- Version 3 : Analyse après négociation

### Cas 3 : Audit et traçabilité

- Historique complet des modifications
- Identification de l'auteur
- Horodatage précis
- Notes de révision

