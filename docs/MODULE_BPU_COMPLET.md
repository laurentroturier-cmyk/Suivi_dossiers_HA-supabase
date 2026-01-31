# Module BPU (Bordereau de Prix Unitaires) - Version Complète

## 📋 Vue d'ensemble

Le module BPU permet de créer une maquette complète de bordereau de prix avec un tableau entièrement personnalisable. Ce module offre une expérience de travail optimale en mode pleine page.

## ✨ Fonctionnalités principales

### 1. **Mode Pleine Page**
- Bouton d'ouverture depuis la vue par défaut
- Bouton de retour pour revenir au DCE Complet
- Confort maximal pour travailler sur de grandes tables

### 2. **En-tête de Procédure**
Affiche automatiquement :
- Numéro de procédure
- Titre du marché
- Nom de l'acheteur

### 3. **Tableau Dynamique**

#### Structure par défaut (18 colonnes)
1. **Code Article**
2. **Catégorie**
3. **Désignation de l'article**
4. **Unité**
5. **Qté dans le cond.**
6. **Réf. Fournisseur**
7. **Désignation Fournisseur**
8. **Caractéristique technique du produit** (Dimension, Puissance, etc.)
9. **Marque Fabricant**
10. **hmbghn**
11. **Qté dans le conditionnement**
12. **Prix à l'unité de vente HT**
13. **Prix à l'Unité HT**
14. **Éco-contribution HT**
15. **Lien URL pour la photo du produit**
16. **Lien URL pour la fiche de données de sécurité**
17. **Lien URL pour la fiche technique**
18. **Lien URL pour le document supplémentaire**

#### Initialisation
- Le tableau démarre avec **10 lignes** vides
- Colonne numérotée automatiquement (#)
- Colonne Actions pour supprimer des lignes

### 4. **Édition de l'en-tête**
- Bouton **"Modifier en-tête"** pour activer le mode édition
- Cliquer sur n'importe quel titre de colonne pour le modifier
- Les modifications sont sauvegardées avec le lot

### 5. **Gestion des Lignes**
- **Ajouter des lignes** : Boîte de dialogue pour spécifier le nombre (par défaut 10)
- **Supprimer une ligne** : Bouton poubelle sur chaque ligne
- Minimum 1 ligne conservée

### 6. **Gestion des Colonnes**
- **Ajouter des colonnes** : Boîte de dialogue pour spécifier le nombre
- **Supprimer une colonne** : Bouton poubelle au survol du titre (minimum 1 colonne)
- Les nouvelles colonnes sont nommées "Nouvelle colonne 1", "Nouvelle colonne 2", etc.
- Renommables via le mode édition d'en-tête

### 7. **Export Excel**
- Bouton **"Exporter Excel"** dans la barre d'outils
- Format : `BPU_{numeroProcedure}_{date}.xlsx`
- Exporte :
  - En-tête personnalisé (avec les labels modifiés)
  - Toutes les lignes de données
  - Structure conforme au tableau affiché

### 8. **Sauvegarde**
- Bouton **"Enregistrer"** dans la barre d'outils
- Sauvegarde :
  - Structure des colonnes (id, label, width)
  - Labels d'en-tête personnalisés
  - Toutes les lignes de données
- Indicateur visuel pendant l'enregistrement

## 🎨 Interface Utilisateur

### Barre d'outils principale
```
[← Retour] ... [Exporter Excel] [Enregistrer]
```

### Zone d'informations de procédure
```
┌─────────────────────────────────────────────────────────────┐
│ Procédure : 12345  │  Marché : ...  │  Acheteur : ...      │
└─────────────────────────────────────────────────────────────┘
```

### Barre d'outils du tableau
```
[✏️ Modifier en-tête] [+ Ajouter des lignes] [+ Ajouter des colonnes]  15 lignes × 18 colonnes
```

### Tableau
```
┌────┬──────────┬───────────┬─────────────┬───────┬─────┐
│ #  │ Code Art │ Catégorie │ Désignation │ ...   │ 🗑️  │
├────┼──────────┼───────────┼─────────────┼───────┼─────┤
│ 1  │ [input] │  [input]  │   [input]   │ ...   │ 🗑️  │
│ 2  │ [input] │  [input]  │   [input]   │ ...   │ 🗑️  │
│ ...│          │           │             │       │     │
└────┴──────────┴───────────┴─────────────┴───────┴─────┘
```

## 💾 Structure des Données

### Type BPUData
```typescript
interface BPUColumn {
  id: string;           // Identifiant unique
  label: string;        // Label original (référence)
  width?: string;       // Largeur de la colonne (ex: "150px")
}

interface BPURow {
  id: string;           // Identifiant unique de la ligne
  [key: string]: any;   // Valeurs des cellules (clé = columnId)
}

interface BPUData {
  columns: BPUColumn[];                    // Structure des colonnes
  headerLabels: { [key: string]: string }; // Labels personnalisés
  rows: BPURow[];                          // Lignes de données
}
```

### Exemple de données sauvegardées
```json
{
  "columns": [
    { "id": "codeArticle", "label": "Code Article", "width": "100px" },
    { "id": "designation", "label": "Désignation de l'article", "width": "200px" }
  ],
  "headerLabels": {
    "codeArticle": "Code Article",
    "designation": "Désignation complète du produit"
  },
  "rows": [
    {
      "id": "row-1234567890",
      "codeArticle": "ART001",
      "designation": "Bouchon anti bruit"
    }
  ]
}
```

## 🔧 Architecture Technique

### Composants
- **BPUForm.tsx** : Composant principal du formulaire
- **BPUMultiLots.tsx** : Wrapper pour la gestion multi-lots
- **GenericMultiLots.tsx** : Système générique de gestion des lots

### Bibliothèques utilisées
- **xlsx** (v0.18.5) : Export Excel
- **lucide-react** : Icônes
- **React Hooks** : useState, useEffect

### Intégration
```typescript
<BPUMultiLots
  procedureId="12345"
  onSave={() => loadDCE()}
  configurationGlobale={dceState.configurationGlobale}
  procedureInfo={{
    numeroProcedure: "12345",
    titreMarche: "Marché de fournitures",
    acheteur: "AFPA"
  }}
/>
```

## 📊 Stockage

### Base de données (Supabase)
- **Table** : `bpus`
- **Champ** : `type_bpu = 'standard'`
- **Colonne data** : JSONB contenant toute la structure BPUData

### Par lot
Chaque lot a son propre BPU :
- `procedure_id` : "12345"
- `numero_lot` : 1, 2, 3, etc.
- `type_bpu` : "standard"
- `data` : Structure JSON complète

## 🎯 Cas d'usage

### Exemple 1 : BPU simple
1. Ouvrir le BPU en pleine page
2. Utiliser les 18 colonnes par défaut
3. Remplir 10-20 lignes de produits
4. Enregistrer et exporter

### Exemple 2 : BPU personnalisé
1. Ouvrir le BPU
2. Modifier les en-têtes (ex: "Désignation complète")
3. Ajouter 5 colonnes spécifiques au marché
4. Supprimer les colonnes URL non utilisées
5. Ajouter 50 lignes
6. Enregistrer

### Exemple 3 : BPU multi-lots
1. Configurer 3 lots dans Configuration Globale
2. Aller dans BPU > Lot 1
3. Créer le BPU du lot 1
4. Passer au Lot 2
5. Créer le BPU du lot 2 (peut avoir des colonnes différentes)
6. Etc.

## 🚀 Évolutions possibles

### Court terme
- [ ] Import Excel pour pré-remplir le tableau
- [ ] Templates de colonnes par type de marché
- [ ] Copier/coller depuis Excel
- [ ] Calculs automatiques (totaux, sous-totaux)

### Moyen terme
- [ ] Formules dans les cellules
- [ ] Validation des données (formats, plages)
- [ ] Historique des modifications
- [ ] Commentaires sur les cellules

### Long terme
- [ ] Collaboration temps réel
- [ ] Génération PDF du BPU
- [ ] Bibliothèque de produits
- [ ] Import depuis catalogues fournisseurs

## 📝 Notes importantes

1. **Performance** : Le tableau reste performant jusqu'à ~500 lignes
2. **Largeur** : Ajuster les largeurs de colonnes selon vos besoins
3. **Sauvegarde** : Penser à enregistrer régulièrement
4. **Export** : L'export Excel reflète exactement ce qui est affiché
5. **Compatibilité** : Compatible avec tous les navigateurs modernes

## 🆘 Support

Pour toute question ou problème :
1. Vérifier que la table `bpus` existe dans Supabase
2. Vérifier que le champ `type_bpu` est bien ajouté
3. Consulter la console développeur pour les erreurs
4. Vérifier les logs Supabase pour les problèmes de sauvegarde
