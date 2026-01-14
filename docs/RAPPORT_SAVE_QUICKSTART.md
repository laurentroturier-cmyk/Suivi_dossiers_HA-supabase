# 🚀 Guide de démarrage rapide - Sauvegarde de Rapports

## Installation (5 minutes)

### 1. Créer la table Supabase

```bash
# 1. Connectez-vous à votre projet Supabase
# 2. Allez dans "SQL Editor"
# 3. Copiez-collez le contenu du fichier ci-dessous
# 4. Cliquez sur "Run"
```

**Fichier** : [`sql/create-rapports-presentation.sql`](../sql/create-rapports-presentation.sql)

### 2. Vérifier l'installation

```sql
-- Dans SQL Editor de Supabase
SELECT COUNT(*) FROM rapports_presentation;
-- Devrait retourner : 0 (table vide mais créée)
```

### 3. Tester la fonctionnalité

1. Lancez l'application : `npm run dev`
2. Allez dans **Rapport de Présentation**
3. Vous devriez voir le bouton **"Charger (0)"** dans le header

✅ **Installation terminée !**

---

## Utilisation rapide

### Sauvegarder un rapport

```
1. Générer un rapport normalement
   └─ Upload fichiers + Générer

2. Cliquer sur le bouton "Sauvegarder" (orange)
   └─ Dans le dialogue :
      ├─ Titre : "Mon rapport test"
      ├─ Notes : "Version initiale" (optionnel)
      └─ Cliquer "Enregistrer"

3. Confirmation : "Rapport enregistré avec succès"
   └─ Le bouton "Charger" affiche maintenant "(1)"
```

### Charger un rapport sauvegardé

```
1. Cliquer sur le bouton "Charger" (violet)
   └─ Liste des rapports s'affiche

2. Sélectionner un rapport
   └─ Cliquer "Charger"

3. Toutes les données sont restaurées
   └─ Prêt à exporter en DOCX
```

### Créer une nouvelle version

```
1. Charger un rapport existant (v1)
2. Apporter des modifications
3. Cliquer "Sauvegarder"
4. Changer le titre : "Mon rapport v2"
5. Cliquer "Enregistrer" (pas "Mettre à jour")
   └─ Nouvelle version créée (v2)
```

---

## Badges de statut

| Badge | Signification |
|-------|---------------|
| ![Brouillon](https://img.shields.io/badge/Brouillon-gray) | Travail en cours |
| ![En révision](https://img.shields.io/badge/En_révision-blue) | En relecture |
| ![Validé](https://img.shields.io/badge/Validé-green) | Approuvé |
| ![Publié](https://img.shields.io/badge/Publié-purple) | Version finale |

**Changer le statut** : Menu déroulant dans la liste des rapports

---

## Troubleshooting rapide

### ❌ "Permission denied for table rapports_presentation"

**Solution** : RLS non configuré correctement

```sql
-- Vérifier dans Supabase SQL Editor
SELECT * FROM pg_policies WHERE tablename = 'rapports_presentation';
-- Devrait afficher 4 politiques
```

Si vide, ré-exécutez le script `sql/create-rapports-presentation.sql`

### ❌ Le bouton "Charger" reste à (0)

**Vérifications** :
1. La table existe-t-elle ? → Table Editor
2. Y a-t-il des rapports ? → `SELECT * FROM rapports_presentation`
3. La procédure est-elle sélectionnée ?

### ❌ Les données ne se chargent pas complètement

**Solution** : Structure JSONB incorrecte

```sql
-- Vérifier la structure
SELECT jsonb_pretty(rapport_data) 
FROM rapports_presentation 
LIMIT 1;
```

---

## Raccourcis clavier (à venir)

- `Ctrl + S` : Sauvegarder le rapport
- `Ctrl + O` : Ouvrir le dialogue de chargement
- `Ctrl + E` : Exporter en DOCX

---

## Ressources

📖 **Documentation complète** : [`docs/RAPPORT_SAVE_LOAD_README.md`](./RAPPORT_SAVE_LOAD_README.md)  
🧪 **Guide de test** : [`docs/RAPPORT_SAVE_LOAD_GUIDE.md`](./RAPPORT_SAVE_LOAD_GUIDE.md)  
📝 **Changelog** : [`CHANGELOG_RAPPORT_SAVE.md`](../CHANGELOG_RAPPORT_SAVE.md)

---

## Support

Problème non résolu ? Vérifiez :
1. Console navigateur (F12) → Erreurs JavaScript
2. Supabase Dashboard → Logs
3. RLS activé sur `rapports_presentation`

