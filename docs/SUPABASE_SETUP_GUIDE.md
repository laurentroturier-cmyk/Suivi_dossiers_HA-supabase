# Guide d'installation des tables - Supabase

## 🎯 Objectif

Créer les tables `projets` et `procedures` dans votre base de données Supabase pour permettre l'import de données via l'interface d'administration.

## 📋 Prérequis

- Accès à votre projet Supabase
- Rôle admin dans Supabase
- Fichier `sql/create-tables-import.sql` disponible

## 🚀 Installation

### Étape 1 : Accéder à Supabase SQL Editor

1. Connectez-vous à [https://supabase.com](https://supabase.com)
2. Sélectionnez votre projet
3. Dans le menu latéral, cliquez sur **SQL Editor**
4. Cliquez sur **New query** (+ New query)

### Étape 2 : Copier le script SQL

1. Ouvrez le fichier `sql/create-tables-import.sql`
2. Copiez **tout le contenu** du fichier (Ctrl+A puis Ctrl+C)
3. Collez dans l'éditeur SQL de Supabase (Ctrl+V)

### Étape 3 : Exécuter le script

1. Vérifiez que tout le script est bien collé
2. Cliquez sur **Run** (ou appuyez sur Ctrl+Enter)
3. Attendez l'exécution (peut prendre 5-10 secondes)

### Étape 4 : Vérifier la création

Vous devriez voir dans les logs :
```
Success. No rows returned
```

Pour vérifier que les tables sont créées :

1. Allez dans **Table Editor** (menu latéral)
2. Vous devriez voir :
   - ✅ `projets`
   - ✅ `procedures`

## 🔍 Vérification détaillée

### Vérifier les tables

Dans SQL Editor, exécutez :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('projets', 'procedures');
```

**Résultat attendu :**
```
projets
procedures
```

### Vérifier les colonnes de la table projets

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projets' 
ORDER BY ordinal_position;
```

**Résultat attendu :** 90+ colonnes

### Vérifier les politiques RLS

```sql
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('projets', 'procedures');
```

**Résultat attendu :** 8 politiques (4 pour projets + 4 pour procedures)

### Vérifier les index

```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE tablename IN ('projets', 'procedures');
```

**Résultat attendu :** Plusieurs index sur les colonnes clés

## ⚠️ Résolution de problèmes

### Erreur : "relation already exists"

**Cause :** Les tables existent déjà

**Solution :** Soit :
1. Supprimer les tables existantes (ATTENTION : perte de données)
   ```sql
   DROP TABLE IF EXISTS public.procedures CASCADE;
   DROP TABLE IF EXISTS public.projets CASCADE;
   ```
   Puis réexécuter le script

2. Ou modifier le script pour utiliser `CREATE TABLE IF NOT EXISTS` (déjà fait)

### Erreur : "permission denied"

**Cause :** Vous n'avez pas les droits

**Solution :** Vérifiez que vous êtes connecté avec le bon projet et que vous avez les droits admin.

### Erreur : "syntax error"

**Cause :** Script incomplet ou mal copié

**Solution :** Recommencez la copie du fichier complet.

## 🎨 Structure créée

### Table `projets`
```
- id (UUID, PK)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- id_projet (TEXT)
- acheteur (TEXT)
- ... (90+ colonnes au total)
```

### Table `procedures`
```
- id (UUID, PK)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
- numero_procedure (TEXT, UNIQUE)
- nom_procedure (TEXT)
- ... (7 colonnes principales)
```

### Politiques RLS

**Projets :**
- `Authenticated users can view projets` (SELECT)
- `Admins can insert projets` (INSERT)
- `Admins can update projets` (UPDATE)
- `Admins can delete projets` (DELETE)

**Procedures :**
- `Authenticated users can view procedures` (SELECT)
- `Admins can insert procedures` (INSERT)
- `Admins can update procedures` (UPDATE)
- `Admins can delete procedures` (DELETE)

### Index créés

**Projets :**
- `idx_projets_id_projet` sur `id_projet`
- `idx_projets_numero_procedure` sur `numero_procedure_afpa`
- `idx_projets_statut` sur `statut_dossier`
- `idx_projets_acheteur` sur `acheteur`
- `idx_projets_date_lancement` sur `date_lancement_consultation`

**Procedures :**
- `idx_procedures_numero` sur `numero_procedure`
- `idx_procedures_statut` sur `statut_consultation`
- `idx_procedures_projet` sur `projet_id`

## ✅ Validation finale

Avant de passer à l'import de données :

- [ ] Les tables `projets` et `procedures` apparaissent dans Table Editor
- [ ] Les politiques RLS sont actives (ALTER TABLE ... ENABLE ROW LEVEL SECURITY)
- [ ] Vous pouvez voir les colonnes dans l'éditeur de table
- [ ] Pas d'erreur dans les logs SQL

## 🔄 Prochaines étapes

1. ✅ Tables créées et configurées
2. ➡️ Télécharger le template Excel depuis l'interface
3. ➡️ Remplir le template avec vos données
4. ➡️ Importer via Dashboard → Import de données

## 📚 Documentation

- [Guide d'utilisation complet](./IMPORT_MODULE.md)
- [Résumé des modifications](./IMPORT_MODULE_SUMMARY.md)
- [Script SQL](../sql/create-tables-import.sql)

---

**Besoin d'aide ?**
- Vérifiez les logs Supabase
- Consultez la documentation Supabase : https://supabase.com/docs
- Vérifiez que votre rôle est bien "admin" dans la table `profiles`

**Date** : 2026-01-09  
**Version** : 1.0.0
