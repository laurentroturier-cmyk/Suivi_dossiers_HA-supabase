# Guide de test - Module Acte d'Engagement Multi-Lots

**Date :** 21 janvier 2026  
**Module :** Acte d'Engagement avec support multi-lots  
**Statut :** ✅ Prêt à tester

---

## 🎯 Objectif

Valider le fonctionnement du module Acte d'Engagement avec la nouvelle architecture multi-lots :
- Navigation entre lots
- Création/Suppression/Duplication de lots
- Sauvegarde indépendante par lot
- Chargement des données par lot

---

## 📋 Prérequis

### 1. Exécuter le script SQL dans Supabase

1. Allez dans **Supabase Dashboard** > **SQL Editor**
2. Ouvrez le fichier `/sql/create_actes_engagement_table.sql`
3. Copiez-collez le contenu dans l'éditeur SQL
4. Cliquez sur **Run**

**Résultat attendu :** Message "Table actes_engagement créée avec succès"

### 2. Vérifier la structure de la table

```sql
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'actes_engagement'
ORDER BY ordinal_position;
```

**Colonnes attendues :**
- `id` (uuid)
- `procedure_id` (text)
- `numero_lot` (integer)
- `libelle_lot` (text)
- `data` (jsonb)
- `created_at` (timestamptz)
- `updated_at` (timestamptz)

### 3. Vérifier les politiques RLS

```sql
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'actes_engagement';
```

**Politiques attendues :**
- Authenticated users can view actes_engagement (SELECT)
- Authenticated users can insert actes_engagement (INSERT)
- Authenticated users can update actes_engagement (UPDATE)
- Authenticated users can delete actes_engagement (DELETE)

---

## 🧪 Scénarios de test

### Test 1 : Création du premier lot

1. Lancez l'application : `npm run dev`
2. Naviguez vers **DCE Complet** > **Acte d'Engagement**
3. Sélectionnez une procédure (ex: 25091)

**Résultat attendu :**
- ✅ LotSelector visible en haut
- ✅ "Lot 1 / 1" affiché
- ✅ Bouton "Nouveau lot" visible
- ✅ Boutons "Dupliquer" et "Supprimer" visibles
- ✅ Formulaire vide affiché

### Test 2 : Remplir et sauvegarder le lot 1

1. Remplissez les champs du formulaire :
   - Acheteur > Nom : "AFPA"
   - Acheteur > SIRET : "12345678900001"
   - Marché > Numéro : "AE-LOT-001"
   - Marché > Objet : "Travaux de plomberie"
   - Prix > Montant HT : "50000"

2. Modifiez le libellé du lot : "Lot 1 - Plomberie"

3. Cliquez sur **Enregistrer la section**

**Résultat attendu :**
- ✅ Message de succès (ou pas d'erreur)
- ✅ Données sauvegardées dans Supabase
- ✅ Libellé "Lot 1 - Plomberie" affiché dans le LotSelector

**Vérification en base :**
```sql
SELECT 
  procedure_id,
  numero_lot,
  libelle_lot,
  data->'acheteur'->>'nom' as acheteur_nom,
  data->'marche'->>'numero' as marche_numero
FROM actes_engagement
WHERE procedure_id = '25091';
```

### Test 3 : Créer un deuxième lot

1. Cliquez sur **Nouveau lot**

**Résultat attendu :**
- ✅ Passage automatique à "Lot 2 / 2"
- ✅ Formulaire vide affiché
- ✅ Libellé par défaut "Lot 2"

2. Remplissez les champs :
   - Marché > Numéro : "AE-LOT-002"
   - Marché > Objet : "Travaux d'électricité"
   - Prix > Montant HT : "75000"

3. Sauvegardez

**Vérification en base :**
```sql
SELECT COUNT(*) as total_lots
FROM actes_engagement
WHERE procedure_id = '25091';
-- Résultat attendu: 2
```

### Test 4 : Navigation entre lots

1. Cliquez sur la flèche **◀ (précédent)**

**Résultat attendu :**
- ✅ Retour au "Lot 1 / 2"
- ✅ Données du lot 1 affichées (Plomberie, 50000€)

2. Utilisez le menu déroulant pour aller au Lot 2

**Résultat attendu :**
- ✅ Lot 2 affiché avec ses données (Électricité, 75000€)

3. Cliquez sur la flèche **▶ (suivant)** (devrait être désactivée)

**Résultat attendu :**
- ✅ Bouton désactivé (car déjà sur le dernier lot)

### Test 5 : Dupliquer un lot

1. Allez sur le Lot 1
2. Cliquez sur **Dupliquer**
3. Confirmez l'action

**Résultat attendu :**
- ✅ Création du Lot 3 avec les données du Lot 1
- ✅ Navigation automatique vers "Lot 3 / 3"
- ✅ Libellé "Lot 1 - Plomberie (copie)"
- ✅ Données identiques au Lot 1

**Vérification en base :**
```sql
SELECT 
  numero_lot,
  libelle_lot,
  data->'marche'->>'objet' as objet
FROM actes_engagement
WHERE procedure_id = '25091'
ORDER BY numero_lot;
-- Résultat : 3 lots dont 2 avec "Travaux de plomberie"
```

### Test 6 : Supprimer un lot

1. Restez sur le Lot 3
2. Cliquez sur **Supprimer**
3. Confirmez la suppression

**Résultat attendu :**
- ✅ Message de confirmation affiché
- ✅ Après confirmation : retour au Lot 2
- ✅ Total = "Lot 2 / 2"
- ✅ Lot 3 supprimé de la base

**Vérification en base :**
```sql
SELECT numero_lot, libelle_lot
FROM actes_engagement
WHERE procedure_id = '25091'
ORDER BY numero_lot;
-- Résultat : 2 lots (1 et 2 uniquement)
```

### Test 7 : Impossible de supprimer le dernier lot

1. Supprimez le Lot 2
2. Vous êtes maintenant sur "Lot 1 / 1"
3. Le bouton **Supprimer** doit être invisible ou désactivé

**Résultat attendu :**
- ✅ Bouton "Supprimer" non affiché (car totalLots === 1)
- ✅ Message si tentative : "Impossible de supprimer le dernier lot"

### Test 8 : Tester avec une procédure à 39 lots

**Créer des lots en masse (optionnel) :**
```sql
-- Créer 39 lots pour la procédure 25091
INSERT INTO actes_engagement (procedure_id, numero_lot, libelle_lot, data)
SELECT 
  '25091',
  n,
  'Lot ' || n || ' - Test',
  jsonb_build_object(
    'marche', jsonb_build_object(
      'numero', 'AE-LOT-' || LPAD(n::text, 3, '0'),
      'objet', 'Lot ' || n,
      'montant', (n * 10000)::text
    )
  )
FROM generate_series(1, 39) as n
ON CONFLICT (procedure_id, numero_lot) DO NOTHING;
```

**Test de navigation :**
1. Sélectionnez la procédure 25091
2. Le sélecteur affiche "Lot 1 / 39"
3. Naviguez vers le lot 20 via le menu déroulant
4. Vérifiez que les données s'affichent correctement
5. Testez les flèches précédent/suivant

**Résultat attendu :**
- ✅ Navigation fluide même avec 39 lots
- ✅ Chargement rapide
- ✅ Pas de lag ou freeze

### Test 9 : Gestion des erreurs

**Tester sans connexion Supabase (optionnel) :**
1. Déconnectez-vous de Supabase (ou désactivez RLS temporairement)
2. Tentez de charger un lot

**Résultat attendu :**
- ✅ Message d'erreur clair affiché
- ✅ Interface non bloquée
- ✅ Possibilité de réessayer

---

## ✅ Checklist finale

Avant de valider le module AE multi-lots :

- [ ] Table `actes_engagement` créée dans Supabase
- [ ] RLS activé avec les 4 politiques
- [ ] Premier lot créé et sauvegardé
- [ ] Navigation entre lots fonctionnelle (flèches + dropdown)
- [ ] Création d'un nouveau lot fonctionne
- [ ] Duplication d'un lot fonctionne
- [ ] Suppression d'un lot fonctionne
- [ ] Impossible de supprimer le dernier lot
- [ ] Libellé du lot éditable et sauvegardé
- [ ] Données différentes par lot
- [ ] Test avec plusieurs lots (au moins 3)
- [ ] Pas d'erreur dans la console navigateur
- [ ] Pas d'erreur dans la console Supabase

---

## 🐛 Problèmes connus et solutions

### Problème : "Table actes_engagement does not exist"

**Solution :** Exécutez le script SQL `/sql/create_actes_engagement_table.sql`

### Problème : "Permission denied" ou erreur 403

**Solution :** Vérifiez que RLS est activé et que les politiques sont créées
```sql
SELECT * FROM pg_policies WHERE tablename = 'actes_engagement';
```

### Problème : Les données ne se chargent pas

**Solution :** Vérifiez la console navigateur (F12). Regardez les erreurs Supabase.

### Problème : Le lot ne se sauvegarde pas

**Solution :** Vérifiez que `procedure_id` existe dans la table `procedures`
```sql
SELECT "Numéro de procédure (Afpa)" 
FROM procedures 
WHERE "Numéro de procédure (Afpa)" = '25091';
```

---

## 📊 Requêtes SQL utiles

### Compter les lots par procédure
```sql
SELECT 
  procedure_id,
  COUNT(*) as nb_lots
FROM actes_engagement
GROUP BY procedure_id
ORDER BY nb_lots DESC;
```

### Voir tous les lots d'une procédure
```sql
SELECT 
  numero_lot,
  libelle_lot,
  created_at,
  updated_at,
  jsonb_pretty(data) as data_json
FROM actes_engagement
WHERE procedure_id = '25091'
ORDER BY numero_lot;
```

### Supprimer tous les lots d'une procédure (ATTENTION)
```sql
-- ATTENTION : suppression définitive
DELETE FROM actes_engagement
WHERE procedure_id = '25091';
```

---

## 🚀 Prochaines étapes

Si tous les tests passent :

1. ✅ Valider le module AE multi-lots
2. 📋 Créer les tables pour les autres modules :
   - `cctps`
   - `ccaps`
   - `bpus`
   - `dqes`
   - `dpgfs`
3. 🔄 Répliquer le pattern pour CCTP, CCAP, etc.
4. 📝 Mettre à jour la documentation utilisateur

---

**Bon test ! 🧪**
