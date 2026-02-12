# Changelog BPU - Version 2.1.0

**Date** : 31 janvier 2026  
**Module** : BPU (Bordereau de Prix Unitaires)

---

## 🎉 Nouvelles fonctionnalités

### 1. Import Excel/CSV 📥
- ✅ Support des formats Excel (.xlsx, .xls) et CSV (.csv)
- ✅ Mapping automatique intelligent des colonnes
- ✅ Ajout automatique de lignes si le fichier en contient plus que le tableau actuel
- ✅ Feedback visuel avec messages de confirmation/erreur
- ✅ Préservation des données existantes si import partiel

### 2. Export Excel amélioré 📤
- ✅ **Deux feuilles** dans le fichier Excel :
  - **"Informations"** : Données de la procédure (numéro, titre, acheteur) + **informations du lot** (numéro et nom) + date d'export + statistiques + **message d'attention**
  - **"BPU"** : Tableau complet des données avec toutes les colonnes
- ✅ Largeurs de colonnes adaptées automatiquement
- ✅ Mise en forme professionnelle
- ✅ Message d'attention dans l'Excel sur les exigences de complétude et conformité technique

### 3. Récupération automatique des lots depuis le Règlement de Consultation 🔗
- ✅ **Intégration avec le Règlement de Consultation** : Les numéros et noms de lots sont automatiquement récupérés depuis la table `reglements_consultation`
- ✅ **Affichage dans l'interface** : Le numéro et le nom du lot s'affichent automatiquement dans l'en-tête du BPU
- ✅ **Export dans Excel** : Les informations du lot sont incluses dans la feuille "Informations"
- ✅ **Priorité intelligente** : 
  1. Lots du Règlement de Consultation (priorité maximale)
  2. Lots de la Configuration Globale
  3. Saisie manuelle (fallback)

### 4. Scroll horizontal et vertical 🔄
- ✅ Correction du tableau figé
- ✅ Scroll horizontal fonctionnel pour voir toutes les 18 colonnes
- ✅ Scroll vertical automatique si beaucoup de lignes
- ✅ Double barre de scroll horizontal (haut et bas) synchronisée
- ✅ Colonne "#" fixe à gauche (sticky) même en scrollant

---

## 🔧 Améliorations techniques

### Structure du tableau
- ✅ Tableau avec `minWidth` et `width: max-content` pour activer le scroll
- ✅ Largeurs fixes pour toutes les colonnes (width + minWidth)
- ✅ Largeur totale : ~3000px pour 18 colonnes

### Import intelligent
- ✅ Détection automatique du format (Excel vs CSV)
- ✅ Recherche de correspondances exactes et partielles entre colonnes
- ✅ Gestion des cas d'import de plus ou moins de lignes

### Export structuré
- ✅ Feuille "Informations" avec métadonnées complètes
- ✅ Feuille "BPU" avec données du tableau
- ✅ Largeurs de colonnes optimisées dans Excel

---

## 📊 Workflow complet

### Méthode 1 : Import depuis Excel
1. Exporter le BPU vide pour avoir le modèle
2. Remplir le fichier Excel avec vos données
3. Importer le fichier → Données automatiquement dans le tableau
4. Ajuster si nécessaire
5. Sauvegarder

### Méthode 2 : Saisie manuelle
1. Ouvrir le BPU en pleine page
2. Modifier l'en-tête si nécessaire
3. Ajouter des lignes/colonnes selon besoin
4. Remplir les cellules
5. Exporter en Excel si besoin
6. Sauvegarder

---

## 📝 Fichiers modifiés

### Code
- ✅ `components/dce-complet/components/modules/BPUForm.tsx`
  - Ajout de `handleImportFile()` pour import Excel/CSV
  - Modification de `exportToExcel()` pour deux feuilles
  - Correction du scroll (table width, minWidth, max-content)
  - Ajout de refs et état pour l'import
  - Support des props `numeroLot` et `libelleLot` dans `procedureInfo`
  
- ✅ `components/dce-complet/utils/reglementConsultationService.ts` (nouveau)
  - Service pour récupérer les lots depuis `reglements_consultation`
  - Fonctions `getLotsFromReglementConsultation()` et `getLotByNumero()`
  
- ✅ `components/dce-complet/hooks/useLotsFromRC.ts` (nouveau)
  - Hook pour charger automatiquement les lots du Règlement de Consultation
  - Gestion du chargement et des erreurs
  
- ✅ `components/dce-complet/components/DCEComplet.tsx`
  - Intégration du hook `useLotsFromRC`
  - Passage des lots aux modules BPU et BPU TMA
  
- ✅ `components/dce-complet/components/shared/GenericMultiLots.tsx`
  - Ajout du prop `lotsFromRC`
  - Logique de priorité pour récupérer les informations de lots
  - Enrichissement automatique de `procedureInfo`
  
- ✅ `components/dce-complet/components/modules/BPUMultiLots.tsx`
  - Support du prop `lotsFromRC`
  
- ✅ `components/dce-complet/components/modules/BPUTMAMultiLots.tsx`
  - Support du prop `lotsFromRC`

### Documentation
- ✅ `docs/IMPORT_BPU_GUIDE.md` (nouveau)
  - Guide complet d'import Excel/CSV
  - Exemples, bonnes pratiques, dépannage
- ✅ `QUICK_START_BPU_v2.md` (mise à jour)
  - Ajout des nouvelles fonctionnalités
  - Section import et export améliorée
- ✅ `CHANGELOG_BPU_v2.1.0.md` (ce fichier)

---

## 🎯 Statistiques

### Fonctionnalités totales
- ✅ 18 colonnes par défaut
- ✅ Import Excel/CSV
- ✅ Export Excel multi-feuilles
- ✅ Scroll horizontal et vertical
- ✅ Double scroll synchronisé
- ✅ Édition en ligne
- ✅ Ajout/suppression lignes et colonnes
- ✅ Édition des en-têtes
- ✅ Mode pleine page

### Formats supportés
- ✅ Excel (.xlsx, .xls)
- ✅ CSV (.csv)

---

## 🔍 Points d'attention

### Import
- Le mapping se fait sur les noms de colonnes (pas la position)
- Colonnes non reconnues sont ignorées
- Limite recommandée : 500 lignes pour performances optimales

### Export
- Feuille "Informations" toujours en premier
- Feuille "BPU" contient TOUTES les données
- Nom de fichier : `BPU_{numeroProcedure}_{date}.xlsx`

### Scroll
- Tableau total : ~3000px de large
- Colonne "#" reste fixe à gauche (sticky)
- Scroll vertical automatique selon nombre de lignes

---

## 🚀 Prochaines étapes possibles

- [ ] Import CSV avec détection automatique du séparateur
- [ ] Export PDF du BPU
- [ ] Calculs automatiques dans les colonnes prix
- [ ] Templates de BPU pré-remplis
- [ ] Validation des données saisies (prix, quantités)
- [ ] Copier/coller depuis Excel (clipboard)
- [ ] Recherche/filtrage dans le tableau

---

**Version précédente** : 2.0.0  
**Version actuelle** : 2.1.0  
**Statut** : ✅ Production ready

**Auteur** : Assistant IA  
**Date de publication** : 31 janvier 2026
