# Module NOTI Par Lots - Guide Utilisateur

## 📋 Vue d'ensemble

Le module **NOTI Par Lots** est une nouvelle approche pour gérer les notifications (NOTI1, NOTI3, NOTI5) dans le cadre de procédures multi-lots. Il complète l'approche existante "par fournisseur" en proposant une navigation systématique lot par lot.

## 🎯 Objectif

Permettre une vérification méthodique des notifications pour chaque lot d'une procédure multi-lots, avec des options d'export flexibles.

## 🚀 Accès au module

1. **Depuis le rapport de présentation** :
   - Cliquez sur "Générer NOTI"
   - Si la procédure est multi-lots, un sélecteur de mode s'affiche

2. **Choix du mode** :
   - **Par Fournisseur** : Approche classique centrée sur les candidats
   - **Par Lots** : Nouvelle approche lot par lot (NOUVEAU)

## 🔄 Workflow - Mode "Par Lots"

### 1. Navigation entre les lots

- **Liste déroulante** : Sélection rapide d'un lot spécifique
- **Boutons de navigation** : Passer au lot précédent/suivant
- **Indicateur de progression** : "Lot X sur Y"

### 2. Informations du lot

Pour chaque lot, visualisation de :
- Numéro et intitulé du lot
- Liste des candidats attributaires
- Liste des candidats perdants

### 3. Vérification des NOTI

Pour chaque type de notification :

#### NOTI1 - Notification d'attribution
- 👁️ **Prévisualiser** : Ouvrir le modal de génération/édition
- ✅ **Vérifier** : Marquer comme vérifié (bouton check)
- Visible uniquement si le lot a des attributaires

#### NOTI3 - Notification de rejet
- 👁️ **Prévisualiser** : Voir tous les NOTI3 des perdants
- ✅ **Vérifier** : Marquer comme vérifié
- Visible uniquement si le lot a des perdants

#### NOTI5 - Notification du marché public
- 👁️ **Prévisualiser** : Ouvrir le modal de génération/édition
- ✅ **Vérifier** : Marquer comme vérifié
- Visible uniquement si le lot a des attributaires

### 4. Passage au lot suivant

Une fois les vérifications effectuées, cliquez sur le bouton de navigation pour passer au lot suivant.

## 📦 Export ZIP - 3 Options

### Option 1 : Export par lot
**Description** : 1 fichier ZIP par lot contenant tous les NOTI de ce lot

**Contenu d'un ZIP** :
- Tous les NOTI1 des attributaires du lot
- Tous les NOTI3 des perdants du lot
- Tous les NOTI5 des attributaires du lot

**Nomenclature** :
```
25006_Lot1_AlphaTech_NOTI1.pdf
25006_Lot1_AlphaTech_NOTI5.pdf
25006_Lot1_BetaCorp_NOTI3.pdf
25006_Lot1_GammaSAS_NOTI3.pdf
```

**Nom du ZIP** : `25006_Lot1_NOTI_20260217.zip`

### Option 2 : Export par fournisseur
**Description** : 1 fichier ZIP par fournisseur contenant tous ses NOTI (tous lots confondus)

**Contenu d'un ZIP** :
- Tous les NOTI1 du fournisseur (tous lots gagnés)
- Tous les NOTI3 du fournisseur (tous lots perdus)
- Tous les NOTI5 du fournisseur (tous lots gagnés)

**Nomenclature** :
```
25006_Lot1_AlphaTech_NOTI1.pdf
25006_Lot2_AlphaTech_NOTI1.pdf
25006_Lot3_AlphaTech_NOTI3.pdf
25006_Lot1_AlphaTech_NOTI5.pdf
25006_Lot2_AlphaTech_NOTI5.pdf
```

**Nom du ZIP** : `25006_AlphaTech_NOTI_20260217.zip`

### Option 3 : Export par type de NOTI
**Description** : 3 fichiers ZIP (NOTI1, NOTI3, NOTI5) contenant tous les documents de chaque type

**ZIP NOTI1** : Tous les NOTI1 de tous les lots et fournisseurs
```
25006_Lot1_AlphaTech_NOTI1.pdf
25006_Lot2_BetaCorp_NOTI1.pdf
25006_Lot3_GammaSAS_NOTI1.pdf
```

**ZIP NOTI3** : Tous les NOTI3 de tous les lots et fournisseurs
```
25006_Lot1_DeltaLtd_NOTI3.pdf
25006_Lot2_EpsilonSA_NOTI3.pdf
```

**ZIP NOTI5** : Tous les NOTI5 de tous les lots et fournisseurs
```
25006_Lot1_AlphaTech_NOTI5.pdf
25006_Lot2_BetaCorp_NOTI5.pdf
```

**Noms des ZIP** :
- `25006_NOTI1_20260217.zip`
- `25006_NOTI3_20260217.zip`
- `25006_NOTI5_20260217.zip`

## 📝 Nomenclature des fichiers

**Format standard** : `{numeroCourt}_Lot{numeroLot}_{nomCandidat}_{typeNoti}.pdf`

**Exemples** :
- `25006_Lot1_Tartempion_NOTI1.pdf`
- `25006_Lot2_AlphaTechnologies_NOTI3.pdf`
- `25006_Lot3_BetaCorporation_NOTI5.pdf`

**Règles** :
- Numéro court = 5 premiers chiffres du numéro AFPA
- Numéro de lot sans zéro initial (Lot1, pas Lot01)
- Nom du candidat nettoyé (caractères spéciaux remplacés, max 50 caractères)
- Type de NOTI en majuscules

## 🔄 Retour en arrière

À tout moment, vous pouvez :
- **Retour au choix de mode** : Bouton en bas de l'écran
- **Choisir une autre procédure** : Bouton en haut de l'écran (réinitialise tout)

## 💡 Cas d'usage recommandés

### Mode "Par Lots" idéal pour :
- Procédures avec plusieurs lots (>2)
- Vérification systématique et exhaustive
- Besoin de suivre l'avancement lot par lot
- Export organisé par structure (lot/fournisseur/type)

### Mode "Par Fournisseur" idéal pour :
- Vue d'ensemble par candidat
- Génération groupée par fournisseur
- Suivi fournisseur prioritaire

## ⚙️ Architecture technique

### Composants principaux

1. **NotiModeSelector** : Sélecteur de mode (par candidat vs par lots)
2. **NotiParLots** : Interface de navigation et vérification lot par lot
3. **MultiLotsDashboard** : Interface existante par fournisseur

### Types de données

- `LotNotiStatus` : État de vérification d'un lot
- `NotiVerification` : État de vérification des 3 types de NOTI
- `ExportZipOption` : Options d'export ZIP

### Fonctions d'export

- `exportParLot()` : Génération de ZIP par lot
- `exportParFournisseur()` : Génération de ZIP par fournisseur
- `exportParTypeNoti()` : Génération de ZIP par type de NOTI
- `generateNotiFileName()` : Génération du nom de fichier selon la nomenclature
- `generateZipFileName()` : Génération du nom du fichier ZIP

## 🐛 Dépannage

### Problème : Pas de bouton "Par Lots"
**Cause** : La procédure n'est pas détectée comme multi-lots
**Solution** : Vérifier que le rapport de présentation contient plusieurs lots dans la section d'analyse

### Problème : NOTI manquants dans l'export
**Cause** : Données incomplètes dans le rapport
**Solution** : Vérifier que tous les candidats sont présents dans le tableau d'analyse (section 7)

### Problème : Nom de fichier tronqué
**Cause** : Nom de candidat très long
**Solution** : Limitation technique à 50 caractères pour éviter les erreurs système

## 📚 Documentation connexe

- [ARCHITECTURE_LOTS.md](./ARCHITECTURE_LOTS.md) : Architecture technique multi-lots
- [IMPORT_MODULE.md](./IMPORT_MODULE.md) : Chargement des données candidats
- [TEST_GUIDE.md](./TEST_GUIDE.md) : Tests et validation

## 🔄 Changelog

### v1.0.0 (2026-02-17)
- ✨ Création du module NOTI Par Lots
- ✨ Sélecteur de mode (par candidat vs par lots)
- ✨ Navigation lot par lot avec vérification
- ✨ 3 options d'export ZIP (par lot/fournisseur/type)
- ✨ Nomenclature standardisée des fichiers
- 🔗 Intégration avec NotificationsQuickAccess

---

**Date de création** : 17 février 2026  
**Version** : 1.0.0  
**Auteur** : Laurent Roturier / GitHub Copilot
