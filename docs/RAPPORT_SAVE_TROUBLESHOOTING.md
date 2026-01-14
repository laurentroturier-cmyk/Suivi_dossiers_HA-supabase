# 🔧 Dépannage - Sauvegarde des Rapports

## Problèmes fréquents et solutions

### ❌ Erreur : "Permission denied for table rapports_presentation"

**Cause** : Row Level Security (RLS) non configuré ou politiques manquantes.

**Solution** :

1. Vérifier que RLS est activé :
```sql
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rapports_presentation';
```

2. Vérifier les politiques :
```sql
SELECT * FROM pg_policies 
WHERE tablename = 'rapports_presentation';
```

3. Si aucune politique, ré-exécuter le script :
```sql
-- Exécuter sql/create-rapports-presentation.sql dans Supabase
```

---

### ❌ Le bouton "Charger" reste à (0)

**Causes possibles** :
1. Table non créée
2. Aucun rapport sauvegardé
3. Procédure non sélectionnée
4. Erreur RLS

**Solutions** :

1. Vérifier que la table existe :
```sql
SELECT COUNT(*) FROM rapports_presentation;
```

2. Vérifier les rapports pour la procédure :
```sql
SELECT * FROM rapports_presentation 
WHERE num_proc = 'P2024-001';  -- Remplacez par votre num_proc
```

3. Vérifier la console navigateur (F12) pour les erreurs

4. Vérifier que l'utilisateur est authentifié :
```sql
SELECT auth.uid(), auth.role();
```

---

### ❌ Erreur : "duplicate key value violates unique constraint"

**Cause** : Un rapport avec la même version existe déjà pour cette procédure.

**Explication** : Contrainte `UNIQUE(num_proc, version)`

**Solution** :

1. Vérifier les versions existantes :
```sql
SELECT num_proc, version, titre, date_creation
FROM rapports_presentation
WHERE num_proc = 'P2024-001'
ORDER BY version;
```

2. Supprimer un doublon si nécessaire :
```sql
DELETE FROM rapports_presentation
WHERE id = 'uuid-du-doublon';
```

3. Ou créer une nouvelle version manuellement :
```sql
-- La version sera automatiquement incrémentée lors de la sauvegarde
```

---

### ❌ Les données du rapport ne se chargent pas complètement

**Causes possibles** :
1. Structure JSONB incorrecte
2. Champs manquants
3. Corruption de données

**Solutions** :

1. Vérifier la structure JSONB :
```sql
SELECT 
  titre,
  jsonb_pretty(rapport_data)
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

2. Vérifier les champs essentiels :
```sql
SELECT 
  rapport_data ? 'section1_contexte' as has_section1,
  rapport_data ? 'section8_performances' as has_section8,
  rapport_data ? 'contenuChapitre3' as has_chapitre3
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

3. Si corruption, supprimer et regénérer :
```sql
DELETE FROM rapports_presentation WHERE id = 'votre-uuid';
-- Puis regénérer le rapport dans l'interface
```

---

### ❌ Le trigger de modification ne fonctionne pas

**Symptôme** : `date_modification` reste NULL après une mise à jour.

**Solution** :

1. Vérifier que le trigger existe :
```sql
SELECT tgname, tgtype 
FROM pg_trigger 
WHERE tgrelid = 'rapports_presentation'::regclass;
```

2. Recréer le trigger :
```sql
DROP TRIGGER IF EXISTS trigger_update_rapport_modification_date 
ON rapports_presentation;

DROP FUNCTION IF EXISTS update_rapport_modification_date();

CREATE OR REPLACE FUNCTION update_rapport_modification_date()
RETURNS TRIGGER AS $$
BEGIN
  NEW.date_modification = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_rapport_modification_date
  BEFORE UPDATE ON public.rapports_presentation
  FOR EACH ROW
  EXECUTE FUNCTION update_rapport_modification_date();
```

3. Tester :
```sql
UPDATE rapports_presentation
SET notes = 'Test mise à jour'
WHERE id = 'votre-uuid';

SELECT titre, date_creation, date_modification
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

---

### ❌ Impossible de supprimer un rapport

**Symptômes** :
- Message "Permission denied"
- Le rapport ne se supprime pas

**Causes** :
1. Utilisateur non admin
2. RLS bloque la suppression

**Solutions** :

1. Vérifier le rôle de l'utilisateur :
```sql
SELECT 
  auth.uid() as user_id,
  p.role as user_role
FROM profiles p
WHERE p.id = auth.uid();
```

2. Si non admin, promouvoir l'utilisateur :
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = auth.uid();
```

3. Ou supprimer directement via SQL (contourne RLS) :
```sql
DELETE FROM rapports_presentation WHERE id = 'votre-uuid';
```

---

### ❌ Le bouton "Sauvegarder" n'apparaît pas

**Causes possibles** :
1. Rapport non généré
2. État React incorrect

**Solutions** :

1. Vérifier que le rapport est généré :
   - Le bouton "Exporter en DOCX" doit être visible
   - Les chapitres doivent afficher des données (pas "Données seront remplies...")

2. Vérifier dans la console React DevTools :
   - `state.rapportGenere` doit être un objet (pas `null`)

3. Regénérer le rapport :
   - Cliquer sur "Regénérer le Rapport de Présentation"

---

### ❌ Erreur : "Invalid input syntax for type uuid"

**Cause** : ID invalide ou format incorrect.

**Solution** :

Vérifier le format de l'ID :
```sql
SELECT id FROM rapports_presentation LIMIT 1;
-- Format attendu : xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

Si IDs malformés, recréer la table :
```sql
DROP TABLE rapports_presentation CASCADE;
-- Puis ré-exécuter sql/create-rapports-presentation.sql
```

---

### ❌ Performance lente lors du chargement

**Symptômes** :
- Liste des rapports met >5 secondes à s'afficher
- Chargement d'un rapport lent

**Causes** :
1. Indexes manquants
2. Trop de rapports
3. JSONB trop volumineux

**Solutions** :

1. Vérifier les indexes :
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'rapports_presentation';
```

2. Recréer les indexes si manquants :
```sql
CREATE INDEX IF NOT EXISTS idx_rapports_presentation_num_proc 
ON public.rapports_presentation(num_proc);

CREATE INDEX IF NOT EXISTS idx_rapports_presentation_date_creation 
ON public.rapports_presentation(date_creation);

CREATE INDEX IF NOT EXISTS idx_rapports_presentation_rapport_data 
ON public.rapports_presentation USING GIN (rapport_data);
```

3. Archiver les anciens rapports :
```sql
-- Créer une table d'archive
CREATE TABLE rapports_presentation_archive 
AS SELECT * FROM rapports_presentation 
WHERE date_creation < NOW() - INTERVAL '1 year';

-- Supprimer de la table principale
DELETE FROM rapports_presentation 
WHERE date_creation < NOW() - INTERVAL '1 year';
```

---

### ❌ Statut ne change pas

**Symptômes** :
- Changement de statut sans effet
- Badge reste gris

**Solutions** :

1. Vérifier la contrainte CHECK :
```sql
SELECT consrc 
FROM pg_constraint 
WHERE conname LIKE '%statut%' 
AND conrelid = 'rapports_presentation'::regclass;
```

2. Valeurs autorisées : `brouillon`, `en_revision`, `valide`, `publie`

3. Forcer une mise à jour :
```sql
UPDATE rapports_presentation
SET statut = 'valide'
WHERE id = 'votre-uuid';
```

4. Recharger la liste dans l'interface

---

### ❌ Message "Rapport chargé" mais rien ne change

**Causes** :
1. État React non mis à jour
2. Données JSONB vides

**Solutions** :

1. Vérifier que `rapport_data` n'est pas vide :
```sql
SELECT 
  titre,
  jsonb_typeof(rapport_data) as data_type,
  jsonb_object_keys(rapport_data) as keys
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

2. Vérifier la console navigateur (F12) pour les erreurs

3. Recharger la page et réessayer

---

### ❌ Erreur lors de l'export DOCX après chargement

**Causes** :
1. Structure de données incompatible
2. Champs manquants dans JSONB

**Solutions** :

1. Vérifier la structure complète :
```sql
SELECT rapport_data->'section8_performances'->'tableaux' 
FROM rapports_presentation
WHERE id = 'votre-uuid';
```

2. Si structure invalide, regénérer le rapport

3. Vérifier les logs de console pour l'erreur exacte

---

## 🔍 Outils de diagnostic

### Script SQL complet de vérification

```sql
-- 1. Table existe ?
SELECT COUNT(*) as table_exists 
FROM information_schema.tables 
WHERE table_name = 'rapports_presentation';

-- 2. RLS activé ?
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'rapports_presentation';

-- 3. Politiques RLS ?
SELECT COUNT(*) as nb_policies 
FROM pg_policies 
WHERE tablename = 'rapports_presentation';

-- 4. Indexes ?
SELECT COUNT(*) as nb_indexes 
FROM pg_indexes 
WHERE tablename = 'rapports_presentation';

-- 5. Trigger ?
SELECT COUNT(*) as nb_triggers 
FROM pg_trigger 
WHERE tgrelid = 'rapports_presentation'::regclass;

-- 6. Nombre de rapports ?
SELECT COUNT(*) as nb_rapports 
FROM rapports_presentation;

-- 7. Utilisateur authentifié ?
SELECT auth.uid() as user_id, auth.role() as role;

-- 8. Rôle de l'utilisateur ?
SELECT p.role 
FROM profiles p 
WHERE p.id = auth.uid();
```

### Console navigateur (F12)

Cherchez ces erreurs :
- `Permission denied`
- `Invalid input syntax`
- `Duplicate key value`
- `Cannot read property of null`

---

## 📞 Support avancé

Si le problème persiste après avoir essayé ces solutions :

1. **Logs Supabase** :
   - Dashboard Supabase → Logs → Database
   - Chercher les erreurs récentes

2. **Console React** :
   - F12 → Console
   - Chercher les erreurs JavaScript

3. **Network Tab** :
   - F12 → Network
   - Filtrer "Fetch/XHR"
   - Vérifier les requêtes vers Supabase

4. **Réinitialisation complète** :
```sql
-- ⚠️ ATTENTION : Supprime toutes les données !
DROP TABLE IF EXISTS rapports_presentation CASCADE;
-- Puis ré-exécuter sql/create-rapports-presentation.sql
```

---

## ✅ Checklist de vérification

Avant de signaler un bug :

- [ ] Table `rapports_presentation` existe
- [ ] RLS est activé
- [ ] 4 politiques RLS créées
- [ ] 4 indexes créés
- [ ] Trigger `update_rapport_modification_date` existe
- [ ] Utilisateur est authentifié
- [ ] Console navigateur sans erreurs
- [ ] Script SQL de vérification exécuté sans erreur
- [ ] Documentation consultée

