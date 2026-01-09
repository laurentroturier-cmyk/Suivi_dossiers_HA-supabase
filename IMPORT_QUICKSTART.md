# 📦 Module d'Import de Données - Quick Start

## 🚀 En 3 étapes

### 1️⃣ Créer les tables dans Supabase
```sql
-- Exécuter dans Supabase SQL Editor
-- Fichier : sql/create-tables-import.sql
```
[📖 Guide détaillé](./docs/SUPABASE_SETUP_GUIDE.md)

### 2️⃣ Télécharger le template
```
Dashboard → Import de données → Bouton "Télécharger template"
```

### 3️⃣ Importer vos données
```
1. Remplir le template Excel
2. Charger le fichier
3. Vérifier l'aperçu
4. Cliquer "Importer dans Supabase"
```

## 📁 Fichiers créés

| Fichier | Description |
|---------|-------------|
| `components/auth/DataImport.tsx` | Composant d'import |
| `sql/create-tables-import.sql` | Script SQL des tables |
| `utils/templateGenerator.ts` | Générateur de templates |
| `docs/IMPORT_MODULE.md` | Documentation complète |
| `docs/SUPABASE_SETUP_GUIDE.md` | Guide d'installation SQL |
| `docs/IMPORT_MODULE_SUMMARY.md` | Résumé technique |

## 🎯 Fonctionnalités

- ✅ Import Excel (.xlsx) et CSV
- ✅ Mapping automatique des colonnes
- ✅ Aperçu des données avant import
- ✅ Templates prêts à l'emploi
- ✅ Sécurité RLS (admin uniquement)
- ✅ Gestion d'erreurs complète

## 📊 Tables gérées

- **projets** : 90+ colonnes pour les projets d'achats
- **procedures** : 7 colonnes principales pour les procédures

## 🔐 Accès

**Réservé aux administrateurs**
- Rôle `admin` dans la table `profiles` requis

## 📚 Documentation

- [📖 Guide complet d'utilisation](./docs/IMPORT_MODULE.md)
- [⚙️ Guide d'installation Supabase](./docs/SUPABASE_SETUP_GUIDE.md)
- [📝 Résumé technique](./docs/IMPORT_MODULE_SUMMARY.md)

## 🛠️ Support

Questions ? Consultez la [documentation complète](./docs/IMPORT_MODULE.md) !

---

**Version** : 1.0.0 | **Date** : 2026-01-09
