# 🚀 Quick Start - Module BPU v2.0

## Votre nouveau module BPU est prêt ! 🎉

### Ce qui a changé

Le module BPU a été **complètement refondu** pour correspondre exactement à vos besoins :

✅ **Mode pleine page** avec bouton retour  
✅ **En-tête** avec infos de procédure (numéro, marché, acheteur)  
✅ **18 colonnes par défaut** selon votre modèle  
✅ **10 lignes minimum** au démarrage  
✅ **Édition de l'en-tête** : modifier les titres de colonnes  
✅ **Ajouter des lignes** : boîte de dialogue personnalisable  
✅ **Ajouter des colonnes** : boîte de dialogue personnalisable  
✅ **Supprimer des colonnes** : bouton au survol  
✅ **Import Excel/CSV** : remplir le tableau depuis un fichier 🆕  
✅ **Export Excel** : un clic pour tout exporter  
✅ **Double scroll** : barre de défilement en haut et en bas  

---

## Comment l'utiliser ?

### 1. Accéder au module
```
DCE Complet > BPU
```

### 2. Vue d'accueil
Vous verrez un bouton **"Ouvrir en pleine page"** → Cliquez dessus

### 3. Interface pleine page

#### En haut
```
[← Retour] ............. [Importer Excel/CSV] [Exporter Excel] [Enregistrer]
```

#### Zone d'infos
```
Procédure : 12345  |  Marché : Titre  |  Acheteur : AFPA
```

#### Barre d'outils
```
[✏️ Modifier en-tête] [+ Ajouter lignes] [+ Ajouter colonnes]    15 lignes × 18 colonnes
```

#### Tableau
- **Colonne #** : Numérotation auto
- **18 colonnes éditables** : Code Article, Catégorie, Désignation, etc.
- **Colonne Actions** : Bouton poubelle pour supprimer une ligne

---

## 🎯 Actions rapides

### Remplir le tableau
1. Cliquer dans une cellule
2. Taper votre texte
3. Tab pour passer à la cellule suivante

### Modifier un titre de colonne
1. Cliquer sur **"Modifier en-tête"**
2. Cliquer dans le titre de colonne
3. Modifier le texte
4. Cliquer à nouveau sur **"Terminer édition en-tête"**

### Ajouter 20 lignes d'un coup
1. Cliquer sur **"Ajouter des lignes"**
2. Taper `20`
3. Cliquer sur **"Ajouter"**

### Ajouter 3 colonnes personnalisées
1. Cliquer sur **"Ajouter des colonnes"**
2. Taper `3`
3. Cliquer sur **"Ajouter"**
4. Renommer les colonnes via "Modifier en-tête"

### Supprimer une colonne inutile
1. Passer la souris sur le titre de la colonne
2. Cliquer sur le bouton **poubelle** qui apparaît

### Importer des données depuis Excel/CSV 🆕
1. Préparer un fichier Excel ou CSV avec une ligne d'en-tête
2. Cliquer sur **"Importer Excel/CSV"**
3. Sélectionner votre fichier
4. Les données sont automatiquement mappées et importées
5. Si le fichier contient plus de lignes, elles sont ajoutées automatiquement

### Exporter en Excel
1. Cliquer sur **"Exporter Excel"**
2. Le fichier `BPU_12345_2026-01-31.xlsx` se télécharge automatiquement
3. Le fichier contient **deux feuilles** :
   - **"Informations"** : Données de la procédure (numéro, marché, acheteur), informations du lot (numéro et nom), statistiques et message d'attention
   - **"BPU"** : Tableau complet des données

### Sauvegarder
1. Cliquer sur **"Enregistrer"**
2. Attendre le message de confirmation

---

## 📋 Les 18 colonnes par défaut

1. **Code Article** - Référence interne
2. **Catégorie** - Type de produit
3. **Désignation de l'article** - Nom complet
4. **Unité** - Unité de vente
5. **Qté dans le cond.** - Quantité par conditionnement
6. **Réf. Fournisseur** - Référence fournisseur
7. **Désignation Fournisseur** - Désignation du fournisseur
8. **Caractéristique technique** - Dimensions, puissance, etc.
9. **Marque Fabricant** - Marque du produit
10. **hmbghn** - Champ spécifique
11. **Qté dans le conditionnement** - Quantité conditionnée
12. **Prix à l'unité de vente HT** - Prix unitaire HT
13. **Prix à l'Unité HT** - Prix à l'unité HT
14. **Éco-contribution HT** - Contribution environnementale
15. **Lien URL photo produit** - https://...
16. **Lien URL fiche sécurité** - https://...
17. **Lien URL fiche technique** - https://...
18. **Lien URL document supplémentaire** - https://...

> 💡 Vous pouvez **renommer** toutes ces colonnes selon vos besoins !

---

## 💾 Gestion multi-lots

### Si vous avez plusieurs lots

1. **Configuration Globale** : Définissez vos lots (Lot 1, Lot 2, etc.)
2. **Sélecteur de lot** : En haut de la page BPU
3. **BPU par lot** : Chaque lot a son propre BPU indépendant

### Chaque lot peut avoir :
- Des colonnes différentes
- Des lignes différentes  
- Des labels personnalisés différents

---

## 🎨 Personnalisation avancée

### Exemple : BPU pour fournitures de bureau
1. Supprimer les colonnes URL (pas nécessaires)
2. Renommer "hmbghn" en "Stock disponible"
3. Ajouter une colonne "Délai livraison"
4. Ajouter une colonne "Observations"

### Exemple : BPU pour produits dangereux
1. Garder toutes les colonnes URL (importantes)
2. Renommer "Caractéristique technique" en "Risques et précautions"
3. Ajouter une colonne "Pictogramme danger"
4. Ajouter une colonne "EPI requis"

---

## ❓ FAQ Rapide

**Q : Combien de lignes puis-je ajouter ?**  
R : Jusqu'à ~500 lignes restent performantes.

**Q : Puis-je supprimer toutes les colonnes ?**  
R : Non, minimum 1 colonne doit rester.

**Q : L'export Excel garde les modifications d'en-tête ?**  
R : Oui, les labels personnalisés sont exportés.

**Q : Que se passe-t-il si je ferme sans enregistrer ?**  
R : Vos modifications sont perdues. Pensez à enregistrer !

**Q : Puis-je importer depuis Excel ?**  
R : Oui ! Cliquez sur "Importer Excel/CSV" et sélectionnez votre fichier.

---

## 🆘 En cas de problème

1. **Le tableau ne s'affiche pas** :
   - Vérifier la console développeur (F12)
   - Rafraîchir la page

2. **L'enregistrement échoue** :
   - Vérifier votre connexion Internet
   - Vérifier que la table `bpus` existe dans Supabase
   - Vérifier que le champ `type_bpu` a été ajouté

3. **L'export Excel ne fonctionne pas** :
   - Vérifier que le package `xlsx` est installé
   - Essayer un autre navigateur

---

## 📚 Documentation complète

Pour en savoir plus :
- **MODULE_BPU_COMPLET.md** : Documentation technique
- **IMPORT_BPU_GUIDE.md** : Guide d'import Excel/CSV 🆕
- **CHANGELOG_BPU_COMPLET_v2.0.0.md** : Détails des changements
- **ARCHITECTURE_BPU_UNIQUE.md** : Architecture de la base de données

---

## 🎉 Bon travail !

Votre module BPU est maintenant **100% opérationnel**.

Profitez de toutes les nouvelles fonctionnalités pour créer vos bordereaux de prix ! 🚀

---

**Version** : 2.0.0  
**Date** : 31 janvier 2026  
**Statut** : ✅ Production Ready
