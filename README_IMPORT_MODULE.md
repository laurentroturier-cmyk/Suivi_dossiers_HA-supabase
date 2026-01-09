# 📦 Module d'Import de Données - README

## Vue d'ensemble

Ce module permet d'importer des données depuis Excel ou CSV vers les tables Supabase `projets` et `procedures` via une interface web intuitive réservée aux administrateurs.

---

## 🎯 Objectif

Faciliter la migration et la sauvegarde des données de projets d'achats publics et de procédures de consultation en offrant :
- Import automatisé depuis Excel/CSV
- Mapping automatique des colonnes
- Visualisation avant validation
- Templates prêts à l'emploi

---

## ✨ Fonctionnalités

### Interface utilisateur
- ✅ Sélection de table (projets/procedures)
- ✅ Upload de fichier (drag & drop)
- ✅ Mapping automatique coloré
- ✅ Aperçu des données (10 lignes)
- ✅ Téléchargement de template Excel
- ✅ Messages d'erreur détaillés

### Sécurité
- ✅ RLS activé sur toutes les tables
- ✅ Import réservé aux admins
- ✅ Lecture pour tous les users authentifiés
- ✅ Validation côté serveur

### Performance
- ✅ Index sur colonnes clés
- ✅ Filtrage lignes vides
- ✅ Aperçu limité pour fluidité

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [MODULE_READY.md](./MODULE_READY.md) | **➡️ COMMENCEZ ICI** |
| [IMPORT_QUICKSTART.md](./IMPORT_QUICKSTART.md) | Guide rapide 3 étapes |
| [docs/IMPORT_MODULE.md](./docs/IMPORT_MODULE.md) | Documentation complète |
| [docs/SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md) | Installation SQL |
| [docs/COLUMN_MAPPING_REFERENCE.md](./docs/COLUMN_MAPPING_REFERENCE.md) | Référence colonnes |
| [docs/FILE_STRUCTURE.md](./docs/FILE_STRUCTURE.md) | Structure fichiers |
| [CHANGELOG_IMPORT.md](./CHANGELOG_IMPORT.md) | Notes de version |

---

## 🚀 Installation rapide

### 1. Créer les tables Supabase

```bash
# Dans Supabase SQL Editor, exécuter :
sql/create-tables-import.sql
```

### 2. Lancer l'application

```bash
npm run dev
```

### 3. Utiliser le module

```
1. Se connecter en admin
2. Dashboard → Import de données
3. Télécharger le template
4. Remplir et importer
```

---

## 📊 Tables

### Projets (93 colonnes)
- Gestion complète des projets d'achats
- Dates, montants, statuts, validations
- Index sur colonnes critiques

### Procédures (7 colonnes)
- Suivi des procédures de consultation
- Informations essentielles
- Lien avec projets

---

## 🔒 Sécurité RLS

```sql
SELECT → Tous les users authentifiés
INSERT → Admins uniquement
UPDATE → Admins uniquement
DELETE → Admins uniquement
```

---

## 🎨 Interface

**Navigation :**
```
Dashboard → Onglet "Import de données"
```

**Workflow :**
```
1. Sélection table
2. Upload fichier
3. Vérification mapping
4. Aperçu données
5. Import Supabase
```

---

## 📝 Formats supportés

- Excel : `.xlsx`, `.xls`
- CSV : séparateur virgule ou point-virgule
- UTF-8 recommandé

---

## 🛠️ Fichiers créés

```
components/auth/DataImport.tsx           514 lignes
utils/templateGenerator.ts                321 lignes
sql/create-tables-import.sql             297 lignes
docs/ (7 fichiers)                      ~1500 lignes
examples/exemple-import-projets.csv        4 lignes
```

---

## 📈 Statistiques

- **1,200+ lignes de code**
- **1,500+ lignes de documentation**
- **100 colonnes gérées**
- **8 politiques RLS**
- **10 index SQL**

---

## ✅ Validation

```bash
✅ Build : npm run build
✅ TypeScript : npx tsc --noEmit
✅ Tests : Manuel via interface
```

---

## 💡 Conseils

1. Toujours télécharger le template d'abord
2. Tester avec un petit fichier
3. Vérifier l'aperçu avant import
4. Respecter format dates (AAAA-MM-JJ)
5. Consulter la doc en cas de doute

---

## 🔄 Prochaines étapes

Après installation :
1. ✅ Créer tables Supabase
2. ✅ Télécharger template
3. ✅ Importer données de test
4. ✅ Valider le résultat
5. ✅ Import données production

---

## 📞 Support

- 📖 Lire [IMPORT_MODULE.md](./docs/IMPORT_MODULE.md)
- 🔍 Console navigateur (F12)
- 🗄️ Logs Supabase
- ✅ Guide [SUPABASE_SETUP_GUIDE.md](./docs/SUPABASE_SETUP_GUIDE.md)

---

## 🎯 Résultat attendu

Après installation complète :
- Tables créées dans Supabase
- Interface d'import fonctionnelle
- Templates disponibles
- Import de données réussi

---

**Version** : 1.0.0  
**Date** : 2026-01-09  
**Statut** : ✅ Production Ready

**Commencez par lire [MODULE_READY.md](./MODULE_READY.md) !**
