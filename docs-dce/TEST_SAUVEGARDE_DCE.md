# 🧪 Guide de test - Sauvegarde DCE Complet

## ⚡ Test rapide (5 minutes)

### Pré-requis

- Application lancée (`npm run dev`)
- Connecté à Supabase
- Accès à la table `dce` dans Supabase

### Test 1 : Vérifier la sauvegarde globale

1. **Ouvrir le module DCE Complet**
   - Cliquer sur "Rédaction" → "DCE Complet ✨"

2. **Créer un nouveau DCE**
   - Entrer un numéro de procédure test : `99999`
   - Appuyer sur Entrée
   - ✅ Le DCE doit se créer automatiquement

3. **Modifier plusieurs sections**
   
   **Section Règlement de Consultation :**
   - Cliquer sur "Règlement de Consultation"
   - Modifier le titre du marché : "Test Sauvegarde Globale"
   - Cliquer sur "Enregistrer" dans le formulaire
   
   **Section Acte d'Engagement :**
   - Cliquer sur "Acte d'Engagement"
   - Remplir le montant : 50000
   - Cliquer sur "Enregistrer" dans le formulaire
   
   **Section CCAP :**
   - Cliquer sur "CCAP"
   - Ajouter une clause : "Clause de test"
   - Cliquer sur "Enregistrer" dans le formulaire

4. **Vérifier le badge orange**
   - ✅ Un badge orange "🟠 Modifications non sauvegardées" doit apparaître en haut

5. **Sauvegarder globalement**
   - Cliquer sur le bouton **"💾 Sauvegarder"** (en haut à droite)
   - ✅ Une alerte "✓ DCE sauvegardé avec succès dans la base de données" doit s'afficher

6. **Vérifier le badge vert**
   - ✅ Le badge doit passer à "✓ Tout est sauvegardé" (vert)

7. **Vérifier dans Supabase**
   - Ouvrir Supabase > Table Editor > `dce`
   - Chercher la ligne avec `numero_procedure = '99999'`
   - Cliquer sur la colonne `reglement_consultation` (JSONB)
   - ✅ Le titre du marché doit être "Test Sauvegarde Globale"
   - Cliquer sur la colonne `acte_engagement` (JSONB)
   - ✅ Le montant doit être 50000
   - Cliquer sur la colonne `ccap` (JSONB)
   - ✅ La clause de test doit être présente

### Test 2 : Vérifier l'annulation

1. **Modifier une section**
   - Modifier le titre du marché : "Titre modifié mais non sauvegardé"
   - Cliquer sur "Enregistrer" dans le formulaire
   - ✅ Badge orange apparaît

2. **Rafraîchir sans sauvegarder**
   - Cliquer sur le bouton **"🔄 Rafraîchir"**
   - ✅ Le titre doit revenir à "Test Sauvegarde Globale"
   - ✅ Badge vert "Tout est sauvegardé" s'affiche

### Test 3 : Vérifier le rechargement

1. **Recharger la page du navigateur** (F5)
2. **Rouvrir le module DCE Complet**
   - Entrer le numéro `99999`
3. **Vérifier les données**
   - Ouvrir "Règlement de Consultation"
   - ✅ Le titre doit être "Test Sauvegarde Globale"
   - Ouvrir "Acte d'Engagement"
   - ✅ Le montant doit être 50000

## 🔍 Résultats attendus

### Console du navigateur (F12)

Lors de la modification d'une section :
```
📝 Section reglementConsultation modifiée localement (pas encore sauvegardée en base)
📝 updateSectionLocal: Modification locale de reglementConsultation (non sauvegardée)
```

Lors du clic sur "Sauvegarder" :
```
💾 Sauvegarde globale du DCE: { numeroProcedure: '99999', sections: [...] }
```

### Interface

| État | Badge affiché |
|------|---------------|
| Modifications en cours | 🟠 Modifications non sauvegardées (orange) |
| Après sauvegarde | ✓ Tout est sauvegardé (vert) |
| DCE nouveau | Rien (pas de badge) |

### Base de données Supabase

Après sauvegarde :

```sql
SELECT 
  numero_procedure,
  statut,
  titre_marche,
  reglement_consultation->>'enTete' as rc_entete,
  acte_engagement->>'montant' as ae_montant,
  ccap->>'clauses' as ccap_clauses,
  updated_at
FROM dce
WHERE numero_procedure = '99999';
```

Résultat attendu :
```
numero_procedure | 99999
statut           | brouillon
titre_marche     | Test Sauvegarde Globale
rc_entete        | {"titreMarche":"Test Sauvegarde Globale",...}
ae_montant       | 50000
ccap_clauses     | ["Clause de test",...]
updated_at       | 2026-01-20 10:30:15.123+00
```

## ❌ Problèmes possibles

### Problème 1 : Badge orange ne disparaît pas après sauvegarde

**Cause** : Erreur de sauvegarde en base

**Solution** :
1. Ouvrir la console (F12)
2. Chercher les erreurs Supabase
3. Vérifier les politiques RLS sur la table `dce`

### Problème 2 : Données non présentes dans Supabase

**Cause** : La sauvegarde n'a pas été effectuée

**Solution** :
1. Vérifier que le bouton "Sauvegarder" a bien été cliqué
2. Vérifier l'alerte de confirmation
3. Rafraîchir la table Supabase

### Problème 3 : "Utilisateur non authentifié"

**Cause** : Session Supabase expirée

**Solution** :
1. Se reconnecter à l'application
2. Recharger la page

## 📋 Checklist complète

- [ ] Module DCE Complet accessible
- [ ] Création d'un nouveau DCE fonctionne
- [ ] Modification de sections met le badge orange
- [ ] Bouton "Sauvegarder" envoie les données en base
- [ ] Badge passe au vert après sauvegarde
- [ ] Données visibles dans Supabase table `dce`
- [ ] Rafraîchir annule les modifications non sauvegardées
- [ ] Rechargement de page conserve les données sauvegardées
- [ ] Toutes les sections (RC, AE, CCAP, etc.) sont sauvegardées
- [ ] `updated_at` est mis à jour automatiquement

## ✅ Validation finale

Si tous les tests passent :

✅ **Le système de sauvegarde fonctionne correctement**

- Les modifications sont stockées localement
- Le bouton "Sauvegarder" enregistre TOUT dans la table `dce`
- Le feedback visuel indique clairement l'état
- Les données persistent après rechargement

---

**Durée estimée** : 5-10 minutes  
**Difficulté** : Facile  
**Pré-requis** : Connexion Supabase active
