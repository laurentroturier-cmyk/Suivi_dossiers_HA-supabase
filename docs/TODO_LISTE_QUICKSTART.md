# 🚀 Guide Rapide - TODO Liste

## ⚡ Démarrage en 3 étapes

### 1️⃣ Exécuter le script SQL
Dans Supabase, exécutez :
```sql
ALTER TABLE procedures 
ADD COLUMN IF NOT EXISTS "TODOlisteP" TEXT;
```

### 2️⃣ Accéder à une TODO liste
1. Allez dans **Procédures**
2. Cliquez sur le bouton **TODO** (🗂️ amber) d'une procédure

### 3️⃣ Créer votre première tâche
1. Cliquez sur **"Nouvelle tâche"**
2. Remplissez :
   - Titre : "Rédiger le CCAP"
   - Assigné à : "Jean Dupont"
   - Échéance : Choisir une date
3. Cliquez sur **"Créer"**

## 📊 Statistiques affichées

| Carte | Description |
|-------|-------------|
| **Total** | Nombre total de tâches |
| **En attente** | Tâches non démarrées |
| **Terminées** | Tâches complétées |
| **En retard** | Tâches dépassant l'échéance |

## ⚡ Actions Rapides

| Action | Raccourci |
|--------|-----------|
| Marquer terminée | Clic sur la checkbox ⭕ |
| Modifier | Icône crayon 📝 |
| Supprimer | Icône corbeille 🗑️ |
| Rechercher | Barre de recherche 🔍 |

## 📥 Exports

### Excel (.xlsx)
- Cliquez sur **"Exporter"** → **"Export Excel"**
- Fichier : `TODO_Procedure_[NumProc]_[Date].xlsx`

### PDF
- Cliquez sur **"Exporter"** → **"Export PDF"**
- Fichier : `TODO_Procedure_[NumProc]_[Date].pdf`

## 🎨 Code Couleurs

| Statut | Couleur | Badge |
|--------|---------|-------|
| En attente | Gris | ![#f5f5f5](https://via.placeholder.com/15/f5f5f5/000000?text=+) |
| En cours | Bleu | ![#DBEAFE](https://via.placeholder.com/15/DBEAFE/000000?text=+) |
| Terminée | Vert | ![#D1FAE5](https://via.placeholder.com/15/D1FAE5/000000?text=+) |
| En retard | Rouge (fond) | ![#FEE2E2](https://via.placeholder.com/15/FEE2E2/000000?text=+) |

## ⚠️ Indicateurs Visuels

- 🔴 **Ligne rouge** : Tâche en retard
- ⚠️ **Triangle orange** : Échéance dépassée
- ✅ **Icône verte** : Tâche terminée
- ⭕ **Cercle vide** : Tâche non terminée

## 🔍 Recherche

Tapez dans la barre de recherche pour filtrer par :
- Titre de la tâche
- Personne assignée
- Notes

## 💡 Astuces

### Créer plusieurs tâches rapidement
1. Créez la première tâche
2. Le modal reste ouvert
3. Changez les informations
4. Cliquez sur "Créer" à nouveau

### Changer le statut sans ouvrir le modal
- Cliquez directement sur la checkbox (⭕ ou ✅)
- Le statut bascule entre "En attente" et "Terminée"
- La date de réalisation est ajoutée automatiquement

### Exporter uniquement certaines tâches
Pour l'instant, l'export inclut toutes les tâches.
Utilisez la fonctionnalité de recherche pour filtrer avant d'exporter.

## 🐛 Dépannage

### Les tâches ne se sauvegardent pas
- Vérifiez la connexion Supabase
- Contrôlez les permissions RLS
- Consultez la console développeur (F12)

### Le bouton TODO n'apparaît pas
- Le bouton n'est visible que dans l'onglet **Procédures**
- Vérifiez que vous n'êtes pas dans "Projets achats"

### Erreur lors de l'export PDF
- Vérifiez que jsPDF est installé
- Contrôlez la console pour les détails

## 📱 Responsive

Le module s'adapte automatiquement :
- **Desktop** : Vue complète avec toutes les colonnes
- **Tablette** : Scroll horizontal pour le tableau
- **Mobile** : Adaptation des cartes statistiques

## ⌨️ Raccourcis Clavier (à venir)

Fonctionnalités prévues :
- `N` : Nouvelle tâche
- `Echap` : Fermer le modal
- `Ctrl+F` : Focus recherche

## 📈 Bonnes Pratiques

### Titres de Tâches
✅ Bon : "Rédiger le CCAP - Section 5"
❌ Éviter : "Tâche 1"

### Assignation
✅ Bon : "Jean Dupont" (nom complet)
❌ Éviter : "JD" (initiales)

### Échéances
✅ Bon : Dates réalistes avec marge
❌ Éviter : Échéances trop courtes

### Notes
✅ Bon : Informations contextuelles utiles
❌ Éviter : Répéter le titre

## 🎯 Exemples d'Utilisation

### Procédure de Marché Public

| N° | Titre | Assigné à | Échéance |
|----|-------|-----------|----------|
| 1 | Rédiger le CCAP | Marie Martin | 15/03/2024 |
| 2 | Valider le RC | Pierre Durand | 20/03/2024 |
| 3 | Préparer le DCE complet | Sophie Bernard | 25/03/2024 |
| 4 | Publier l'avis d'appel public | Jean Dupont | 30/03/2024 |

### Phases d'une Consultation

| Phase | Tâches Typiques |
|-------|----------------|
| **Préparation** | Étude de marché, Sourcing, Stratégie achat |
| **Rédaction** | CCAP, RC, DQE, Pièces techniques |
| **Publication** | Avis BOAMP, Profil acheteur, Communication |
| **Analyse** | Ouverture plis, Analyse offres, Rapport |
| **Attribution** | Notification, Signature, DECP |

## 📞 Contact & Support

Documentation complète : `README_TODO_LISTE.md`

---

**Version** : 1.0.0  
**Mise à jour** : 2026-02-10
