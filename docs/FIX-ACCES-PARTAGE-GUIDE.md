# 🔧 Correction Accès Partagé - Guide d'Application

## 📋 Résumé du Problème

Vous avez identifié que les utilisateurs non-admin ne pouvaient pas accéder aux données de la procédure 25006 (et autres procédures) créées par d'autres utilisateurs. Le problème venait de deux sources :

1. **Politiques RLS trop restrictives** en base de données (Supabase)
2. **Filtres `user_id` côté client** dans le code de l'application

## ✅ Ce qui a été corrigé

### 1. Base de données (Supabase)

**Script à exécuter :** [`sql/FIX-MASTER-ACCES-PARTAGE.sql`](sql/FIX-MASTER-ACCES-PARTAGE.sql)

Ce script corrige les politiques RLS de **10 tables** :
- `dce`, `dce_versions`
- `reglements_consultation`
- `questionnaire_technique`
- `noti5_documents`, `noti1`
- `ouverture_plis`
- `analyse_offres_dqe`, `analyse_offres_dqe_candidats`, `analyse_offres_dqe_lignes`

**Nouvelles règles :**
- ✅ **LECTURE** : Tous les utilisateurs authentifiés peuvent lire toutes les données
- ✅ **MODIFICATION/SUPPRESSION** : Seul le propriétaire ou un admin peut modifier/supprimer
- ✅ **CRÉATION** : Chaque utilisateur crée ses propres enregistrements

### 2. Code de l'application

**Fichiers modifiés :**
- [`components/analyse-offres-dqe/AnalyseOffresDQE.tsx`](components/analyse-offres-dqe/AnalyseOffresDQE.tsx)
- [`components/analyse-offres-dqe/services/analyseOffresDQEService.ts`](components/analyse-offres-dqe/services/analyseOffresDQEService.ts)
- [`components/dce-complet/utils/dceService.ts`](components/dce-complet/utils/dceService.ts)
- [`components/redaction/utils/reglementConsultationStorage.ts`](components/redaction/utils/reglementConsultationStorage.ts)

**Changements :**
- Suppression des filtres `.eq('user_id', user.id)` sur les requêtes SELECT
- Conservation de l'authentification, mais le RLS gère maintenant les permissions côté serveur

## 🚀 Comment appliquer les corrections

### Étape 1 : Appliquer le script SQL

1. Connectez-vous à votre projet Supabase
2. Allez dans **SQL Editor**
3. Copiez-collez le contenu de [`sql/FIX-MASTER-ACCES-PARTAGE.sql`](sql/FIX-MASTER-ACCES-PARTAGE.sql)
4. Exécutez le script
5. Vérifiez le résultat en fin de script (tableau de vérification)

### Étape 2 : Déployer le code modifié

Les modifications du code ont déjà été appliquées aux fichiers. Il suffit de :

```bash
# Vérifier que tout compile
npm run build

# Ou redémarrer le serveur de dev
npm run dev
```

### Étape 3 : Tester

1. **En tant qu'admin** : Vérifiez que vous voyez toujours la procédure 25006
2. **En tant qu'utilisateur non-admin** : Connectez-vous et vérifiez que vous voyez maintenant la procédure 25006
3. **Test de modification** : Un utilisateur non-admin ne doit pas pouvoir modifier une procédure d'un autre utilisateur (sauf s'il est admin)

## 📊 Résultat Attendu

Après application :

| Utilisateur | Peut VOIR les données | Peut MODIFIER ses données | Peut MODIFIER les données des autres |
|-------------|----------------------|--------------------------|-------------------------------------|
| **Admin** | ✅ Toutes | ✅ Oui | ✅ Oui |
| **User** | ✅ Toutes | ✅ Oui | ❌ Non |

## 🔍 Vérification

Pour vérifier que les politiques RLS sont correctement appliquées, exécutez dans Supabase SQL Editor :

```sql
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' AND qual LIKE '%authenticated%' THEN '✅ Lecture partagée'
    WHEN cmd IN ('UPDATE','DELETE') AND qual LIKE '%admin%' THEN '✅ Modification admin/propriétaire'
    ELSE '⚠️  À vérifier'
  END as statut
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'dce',
    'reglements_consultation',
    'questionnaire_technique',
    'noti5_documents',
    'noti1',
    'ouverture_plis',
    'analyse_offres_dqe'
  )
ORDER BY tablename, cmd;
```

## ⚠️ Notes Importantes

1. **Idempotence** : Le script SQL peut être exécuté plusieurs fois sans problème
2. **Backup** : Aucune donnée n'est supprimée, seules les politiques RLS sont modifiées
3. **Rollback** : Si besoin de revenir en arrière, exécutez les anciens scripts SQL individuels

## 📞 Support

Si vous rencontrez des problèmes :
- Vérifiez les logs Supabase pour les erreurs RLS
- Vérifiez que tous les utilisateurs ont un profil dans la table `profiles`
- Testez avec `EXPLAIN` dans SQL Editor pour voir quelles politiques s'appliquent

## 🎯 Prochaines Étapes (Optionnel)

Pour aller plus loin dans le partage collaboratif :
1. Ajouter un système de "favoris" pour marquer les procédures importantes
2. Ajouter des notifications quand une procédure est modifiée
3. Ajouter un historique des modifications avec utilisateur

---

**Date de correction :** 17 février 2026  
**Version :** 1.0
