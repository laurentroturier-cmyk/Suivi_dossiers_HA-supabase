# Guide d'Import Excel/CSV - Module BPU

## 📥 Vue d'ensemble

Le module BPU permet désormais d'importer des données depuis des fichiers Excel (.xlsx, .xls) ou CSV (.csv) pour remplir automatiquement le tableau.

## ✨ Fonctionnalités

### Import automatique
- ✅ **Formats supportés** : Excel (.xlsx, .xls) et CSV (.csv)
- ✅ **Mapping automatique** : Les colonnes sont automatiquement associées
- ✅ **Ajout de lignes** : Si l'Excel contient plus de lignes, elles sont ajoutées
- ✅ **Preservation des données** : Si l'Excel a moins de lignes, les lignes existantes sont conservées

## 🎯 Comment utiliser

### 1. Préparer votre fichier Excel/CSV

#### Structure requise
Votre fichier doit avoir :
- **Première ligne** : En-têtes de colonnes
- **Lignes suivantes** : Données

#### Exemple de structure Excel/CSV

| Code Article | Catégorie | Désignation de l'article | Unité | Prix à l'Unité HT | ... |
|--------------|-----------|--------------------------|-------|-------------------|-----|
| ART001       | Bureau    | Chaise ergonomique       | Unité | 125.50            | ... |
| ART002       | IT        | Clavier mécanique        | Unité | 89.90             | ... |
| ART003       | Bureau    | Bureau réglable          | Unité | 450.00            | ... |

### 2. Importer le fichier

1. Ouvrez le module BPU en pleine page
2. Cliquez sur le bouton **"Importer Excel/CSV"** (icône Upload)
3. Sélectionnez votre fichier (.xlsx, .xls ou .csv)
4. Attendez le message de confirmation

### 3. Résultats

Après l'import, vous verrez un message :
- ✅ **Succès** : "✅ X lignes importées (Y lignes ajoutées)"
- ❌ **Erreur** : "❌ Erreur lors de la lecture du fichier"

## 📤 Export Excel

L'export Excel génère maintenant **deux feuilles** :

### Feuille 1 : "Informations"
Contient les métadonnées complètes :
- Numéro de procédure
- Titre du marché
- Acheteur
- **Numéro de lot**
- **Nom du lot**
- Date d'export
- Statistiques (nombre de lignes et colonnes)
- **Message d'attention** sur les exigences de complétude et conformité

### Feuille 2 : "BPU"
Contient le tableau complet avec :
- Toutes les colonnes avec leurs en-têtes personnalisés
- Toutes les lignes de données
- Largeurs de colonnes adaptées

## 🔄 Mapping automatique des colonnes

Le système essaie de mapper automatiquement les colonnes en comparant les en-têtes :

### Correspondances exactes
Si votre Excel a une colonne "Code Article", elle sera automatiquement liée à la colonne "Code Article" du BPU.

### Correspondances partielles
Le système cherche aussi des correspondances partielles :
- "Prix Unité" → "Prix à l'Unité HT"
- "Désignation" → "Désignation de l'article"
- "Réf Fournisseur" → "Réf. Fournisseur"

### Colonnes non mappées
Si une colonne de l'Excel ne correspond à aucune colonne du BPU, ses données ne seront pas importées.

## 📊 Cas d'usage

### Cas 1 : Import de 50 lignes dans un tableau vide (10 lignes)
**Résultat** : 50 lignes importées, 40 lignes ajoutées automatiquement

### Cas 2 : Import de 5 lignes dans un tableau de 20 lignes
**Résultat** : Les 5 premières lignes sont remplacées, les 15 autres restent intactes

### Cas 3 : Import de 20 lignes dans un tableau de 20 lignes
**Résultat** : Remplacement complet des 20 lignes

## 💡 Bonnes pratiques

### 1. Nommage des colonnes
Pour un meilleur mapping, utilisez des noms de colonnes similaires à ceux du BPU :
- ✅ "Code Article" au lieu de "Code"
- ✅ "Prix à l'Unité HT" au lieu de "Prix"
- ✅ "Désignation de l'article" au lieu de "Nom"

### 2. Format des données

#### Prix
Utilisez le format numérique :
- ✅ 125.50
- ✅ 89.90
- ❌ 125,50 € (peut causer des problèmes)

#### Texte
Pas de limitations particulières, tout texte est accepté.

#### URLs
Incluez le protocole :
- ✅ https://example.com/photo.jpg
- ❌ example.com/photo.jpg

### 3. Ordre des colonnes
L'ordre des colonnes dans votre Excel n'a **pas d'importance**. Le système mappe par nom, pas par position.

### 4. Colonnes supplémentaires
Si votre Excel contient des colonnes qui n'existent pas dans le BPU, elles seront **ignorées** lors de l'import.

## 🔧 Formats de fichiers

### Excel (.xlsx, .xls)
- Format natif Microsoft Excel
- Supporte plusieurs feuilles (seule la première est importée)
- Formats de cellules préservés (nombres, dates, texte)

### CSV (.csv)
- Format texte simple
- Séparateur : virgule (,) ou point-virgule (;)
- Encodage : UTF-8 recommandé

## ⚠️ Limitations

### Taille
- Maximum recommandé : **500 lignes** pour des performances optimales
- Au-delà : l'import fonctionnera mais peut être plus lent

### Plusieurs feuilles Excel
- Seule la **première feuille** est importée
- Si vous avez plusieurs feuilles, copiez les données dans la première feuille avant l'import

### Formules Excel
- Les formules sont **converties en valeurs** lors de l'import
- Ex : `=SOMME(A1:A10)` → la valeur calculée sera importée

## 🛠️ Exemple complet

### Créer un fichier Excel pour import

```excel
Code Article | Catégorie | Désignation de l'article | Unité | Qté dans le cond. | Prix à l'Unité HT
-------------|-----------|--------------------------|-------|-------------------|-------------------
ART001       | Bureau    | Chaise ergonomique       | U     | 1                 | 125.50
ART002       | IT        | Clavier mécanique        | U     | 1                 | 89.90
ART003       | Bureau    | Bureau réglable          | U     | 1                 | 450.00
ART004       | IT        | Souris sans fil          | U     | 1                 | 25.00
ART005       | Bureau    | Lampe de bureau LED      | U     | 1                 | 35.50
```

### Importer
1. Sauvegarder ce fichier en `.xlsx` ou `.csv`
2. BPU > Importer Excel/CSV
3. Sélectionner le fichier
4. ✅ "5 lignes importées"

### Vérifier
- Les 5 lignes sont remplies avec les données
- Les colonnes sont correctement mappées
- Les colonnes non incluses dans l'Excel restent vides

## 🆘 Dépannage

### Problème : "❌ Fichier vide ou invalide"
**Solution** : Vérifiez que votre fichier contient au moins une ligne d'en-tête et une ligne de données.

### Problème : Certaines colonnes ne sont pas remplies
**Solution** : Vérifiez que les noms des colonnes dans votre Excel correspondent aux noms du BPU.

### Problème : Les données sont dans les mauvaises colonnes
**Solution** : Renommez les colonnes de votre Excel pour qu'elles correspondent exactement aux colonnes du BPU.

### Problème : L'import est lent
**Solution** : Réduisez le nombre de lignes dans votre fichier (< 500 lignes recommandé).

## 📝 Notes techniques

### Encodage CSV
- UTF-8 recommandé pour les accents
- Si problème d'accents : ouvrir le CSV avec Excel et sauvegarder en UTF-8

### Séparateur CSV
- Le système détecte automatiquement : `,` ou `;`
- En France : souvent `;` (point-virgule)
- International : souvent `,` (virgule)

## 🎯 Workflow recommandé

1. **Export** : Exporter le BPU vide pour avoir le modèle de colonnes
2. **Remplir** : Remplir le fichier Excel avec vos données
3. **Import** : Importer le fichier rempli
4. **Vérifier** : Vérifier que toutes les données sont correctes
5. **Ajuster** : Modifier manuellement si nécessaire
6. **Sauvegarder** : Enregistrer le BPU dans l'application

---

**Version** : 2.1.0  
**Date** : 31 janvier 2026  
**Statut** : ✅ Fonctionnel
