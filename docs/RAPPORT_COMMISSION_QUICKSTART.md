# 📝 Module Rapport de Commission - Guide Rapide

## 🎯 Accès

**Menu :** Rédaction → **Rapport Commission**

## ✨ Fonctionnalités principales

### 1. Saisie des données
- **8 chapitres** structurés pour un rapport complet
- **Navigation latérale** par chapitre
- **Formulaires intelligents** : champs texte, sélections, dates, listes dynamiques

### 2. Prévisualisation
- Bouton **"Prévisualiser"** dans le header
- Aperçu en temps réel du document final
- Affichage dans une colonne latérale

### 3. Sauvegarde
- **Automatique** au démarrage (charge la dernière saisie)
- **Manuelle** via bouton "Sauvegarder"
- Stockage local (navigateur)

### 4. Export Word
- Bouton **"Télécharger Word"** (vert)
- Format `.docx` professionnel
- Nom de fichier : `Rapport_Commission_[NumProc]_[Date].docx`

## 📋 Les 8 chapitres

| # | Chapitre | Informations clés |
|---|----------|-------------------|
| 1 | **Identification du marché** | N° procédure, objet, type, mode passation, montant, CPV |
| 2 | **Composition commission** | Date, lieu, président, membres présents/absents |
| 3 | **Objet de la réunion** | Type d'analyse, date/heure d'ouverture |
| 4 | **Rappel du contexte** | Publication, date limite, critères d'attribution |
| 5 | **Déroulement séance** | Offres reçues/recevables, irrecevables + motifs |
| 6 | **Analyse des offres** | Candidats + notes (technique, financière, globale) |
| 7 | **Propositions** | Attributaire, montant HT/TTC, délai, conditions |
| 8 | **Décisions** | Avis commission, date notification, observations |

## 🚀 Workflow type (5 min)

1. **Chapitre 1** : N° procédure + objet du marché
2. **Chapitre 2** : Date réunion + président + membres
3. **Chapitre 5** : Nombre d'offres reçues/recevables
4. **Chapitre 6** : Ajouter les candidats avec leurs notes
5. **Chapitre 7** : Renseigner l'attributaire et montants
6. **Chapitre 8** : Avis de la commission
7. **Prévisualiser** pour vérifier
8. **Télécharger Word** 🎉

## 💡 Astuces

### Listes dynamiques
- **Membres** : Nom + Fonction → "Ajouter un membre"
- **Critères** : Texte libre → "Ajouter"
- **Offres irrecevables** : Nom + Motif → "Ajouter..."
- **Candidats** : Nom + 3 notes → "Ajouter un candidat"

Cliquez sur **✕** pour supprimer un élément.

### Navigation rapide
Cliquez sur n'importe quel chapitre dans la **sidebar gauche** pour y accéder directement.

### Champs optionnels
Tous les champs sont optionnels, mais un rapport complet doit au minimum contenir :
- N° procédure
- Date de réunion
- Membres de la commission
- Attributaire proposé
- Avis de la commission

## 🎨 Interface

```
┌────────────────────────────────────────────────────────┐
│  📄 Rapport de Commission         [🔵 Prévisualiser]   │
│                         [💾 Sauvegarder] [⬇ Word]      │
├──────────────┬───────────────────────┬─────────────────┤
│              │                       │                 │
│  Sidebar     │   Formulaire actif    │  Prévisualisa-  │
│  Chapitres   │   (chapitre courant)  │  tion (optio.)  │
│              │                       │                 │
│  1. Ident... │  [Champs...]          │  [Aperçu...]    │
│  2. Commi... │                       │                 │
│  3. Objet... │                       │                 │
│  ...         │                       │                 │
│              │                       │                 │
└──────────────┴───────────────────────┴─────────────────┘
```

## 📄 Document Word généré

- **Format professionnel** avec titres numérotés
- **Tableaux** pour l'analyse des candidats
- **Zone de signature** en fin de document
- **Marges** : 2 cm
- **Prêt à imprimer** ou signer électroniquement

## 🔧 Besoin d'aide ?

Consultez la documentation complète :
- **Guide utilisateur** : [docs/RAPPORT_COMMISSION_GUIDE.md](./RAPPORT_COMMISSION_GUIDE.md)
- **Documentation technique** : [docs/RAPPORT_COMMISSION_TECH.md](./RAPPORT_COMMISSION_TECH.md)

---

**Version :** 1.0.0 | **Dernière mise à jour :** Janvier 2025
