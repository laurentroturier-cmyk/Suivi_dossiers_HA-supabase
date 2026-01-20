# ✅ Déconnexion de la table `reglements_consultation`

## 🎯 Modifications effectuées

Le Règlement de Consultation (RC) est maintenant géré **uniquement** via la colonne `reglement_consultation` de la table `dce`. La table `reglements_consultation` n'est plus utilisée.

## 🗑️ Ce qui a été retiré

### 1. Boutons "Charger (DB)" et "Sauvegarder (DB)"

**Fichier** : `components/redaction/ReglementConsultation.tsx`

- ❌ Bouton "Charger (DB)" supprimé
- ❌ Bouton "Sauvegarder (DB)" supprimé
- ❌ États `isSavingSupabase` et `isLoadingSupabase` retirés
- ❌ Fonctions `handleSaveSupabase()` et `handleLoadSupabase()` supprimées
- ❌ Import de `saveReglementConsultation` et `loadReglementConsultation` retiré

### 2. Synchronisation avec `reglements_consultation`

**Fichier** : `components/dce-complet/services/dceService.ts`

#### Dans `updateSection()` :
```typescript
// ❌ RETIRÉ
if (section === 'reglementConsultation' && data) {
  await supabase
    .from('reglements_consultation')
    .upsert(rcRecord, ...);
}
```

#### Dans `saveDCE()` :
```typescript
// ❌ RETIRÉ
if (dceState.reglementConsultation) {
  await supabase
    .from('reglements_consultation')
    .upsert(rcRecord, ...);
}
```

#### Backfill depuis `reglements_consultation` :
```typescript
// ❌ RETIRÉ dans loadDCE()
if (!existingDCE.reglement_consultation) {
  const rcRecord = await this.loadExistingRC(numeroProcedure);
  // ...copie depuis reglements_consultation
}

// ❌ RETIRÉ dans createDCE()
const rcRecord = await this.loadExistingRC(numeroProcedure);

// ❌ Fonction loadExistingRC() complètement supprimée
```

## ✅ Nouveau fonctionnement

### Architecture simplifiée

```
┌─────────────────────────────────────────────────┐
│  MODULE DCE COMPLET                             │
│                                                 │
│  Section: Règlement de Consultation            │
│  ↓                                              │
│  Utilise: ReglementConsultationLegacyWrapper    │
│  ↓                                              │
│  Appelle: ReglementConsultation (formulaire)    │
│                                                 │
│  Actions disponibles:                           │
│  • Éditer le formulaire RC                      │
│  • Télécharger Word                             │
│  • Mode édition/navigation                      │
│                                                 │
│  ❌ PLUS de boutons Charger/Sauvegarder DB      │
└─────────────────────────────────────────────────┘
         ↓
         ↓ handleSectionSave()
         ↓
┌─────────────────────────────────────────────────┐
│  SAUVEGARDE (via DCE Complet)                   │
│                                                 │
│  1. Clic sur "Enregistrer la section"           │
│     → updateSectionLocal('reglementConsultation')│
│     → Mise à jour en mémoire uniquement         │
│                                                 │
│  2. Clic sur "💾 Sauvegarder" (global)          │
│     → saveDCE()                                 │
│     → INSERT/UPDATE dans dce.reglement_consultation│
│     → ✅ AUCUNE synchro avec reglements_consultation│
└─────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────┐
│  TABLE: dce                                     │
│                                                 │
│  reglement_consultation (JSONB)                 │
│  {                                              │
│    enTete: { ... },                             │
│    pouvoirAdjudicateur: { ... },                │
│    objet: { ... },                              │
│    ...                                          │
│  }                                              │
└─────────────────────────────────────────────────┘
```

### Flux de données

```
Utilisateur → Formulaire RC → Mémoire locale → Bouton "Sauvegarder" → dce.reglement_consultation
                                                                         (JSONB)
```

**Plus aucune interaction avec** :
- ❌ Table `reglements_consultation`
- ❌ Colonnes `titre_marche`, `numero_marche`, `data`
- ❌ Triggers ou politiques RLS sur `reglements_consultation`

## 📊 Données stockées

### Table `dce` - Colonne `reglement_consultation`

Structure JSONB complète du RC :

```json
{
  "enTete": {
    "numeroProcedure": "25006",
    "titreMarche": "Fourniture de...",
    "numeroMarche": "2025-001",
    "typeMarcheTitle": "MARCHE PUBLIC DE...",
    "dateLimiteOffres": "2025-03-15",
    ...
  },
  "pouvoirAdjudicateur": {
    "nom": "Agence pour la formation...",
    "adresseVoie": "3 rue Franklin",
    ...
  },
  "objet": { ... },
  "conditions": { ... },
  "typeMarche": { ... },
  "dce": { ... },
  "remise": { ... },
  "jugement": { ... },
  ...
}
```

## 🔄 Migration des données existantes

Si vous avez des RC dans l'ancienne table `reglements_consultation`, ils **ne seront plus chargés automatiquement**.

### Option 1 : Script de migration (recommandé)

```sql
-- Copier tous les RC de reglements_consultation vers dce
INSERT INTO dce (
  user_id, 
  numero_procedure, 
  titre_marche, 
  statut, 
  version, 
  reglement_consultation
)
SELECT 
  rc.user_id,
  rc.numero_procedure,
  rc.titre_marche,
  'brouillon',
  1,
  rc.data
FROM reglements_consultation rc
WHERE NOT EXISTS (
  SELECT 1 FROM dce 
  WHERE dce.numero_procedure = rc.numero_procedure 
  AND dce.user_id = rc.user_id
);
```

### Option 2 : Migration manuelle

1. Ouvrir le module DCE Complet
2. Saisir le numéro de procédure
3. Saisir manuellement le RC
4. Cliquer sur "Sauvegarder"

## 📋 Checklist de vérification

- [x] Boutons "Charger (DB)" et "Sauvegarder (DB)" retirés de l'interface
- [x] Fonctions `handleSaveSupabase` et `handleLoadSupabase` supprimées
- [x] Import de `reglementConsultationStorage` retiré
- [x] Synchronisation avec `reglements_consultation` dans `updateSection()` retirée
- [x] Synchronisation avec `reglements_consultation` dans `saveDCE()` retirée
- [x] Backfill depuis `reglements_consultation` dans `loadDCE()` retiré
- [x] Backfill depuis `reglements_consultation` dans `createDCE()` retiré
- [x] Fonction `loadExistingRC()` supprimée
- [x] Aucune erreur de compilation

## ✅ Test du nouveau système

### 1. Créer un nouveau RC

1. Ouvrir le module **DCE Complet**
2. Saisir un numéro de procédure : `99999`
3. Cliquer sur **Règlement de Consultation**
4. Remplir le formulaire
5. Cliquer sur **Enregistrer la section** (en haut)
   - ✅ Badge orange "Modifications non sauvegardées"
6. Cliquer sur **💾 Sauvegarder** (en haut à droite)
   - ✅ Badge vert "Tout est sauvegardé"

### 2. Vérifier dans Supabase

```sql
SELECT 
  numero_procedure,
  titre_marche,
  reglement_consultation->>'enTete' as rc_entete,
  updated_at
FROM dce
WHERE numero_procedure = '99999';
```

**Résultat attendu** :
```
numero_procedure | 99999
titre_marche     | (titre saisi)
rc_entete        | {"numeroProcedure":"99999",...}
updated_at       | 2026-01-20 ...
```

### 3. Vérifier que `reglements_consultation` n'est plus utilisée

```sql
-- Cette requête ne doit rien retourner de nouveau
SELECT * FROM reglements_consultation
WHERE numero_procedure = '99999'
AND created_at > NOW() - INTERVAL '1 hour';
```

**Résultat attendu** : Aucune ligne (0 rows)

## 📁 Fichiers modifiés

| Fichier | Modifications |
|---------|---------------|
| `components/redaction/ReglementConsultation.tsx` | ✅ Boutons DB retirés, fonctions supprimées |
| `components/dce-complet/services/dceService.ts` | ✅ Synchro `reglements_consultation` retirée |

## 🗄️ Ancienne table `reglements_consultation`

### Statut

- ⚠️ **Non utilisée** par le code
- ⚠️ **Données historiques** préservées
- ✅ **Peut être conservée** pour archivage
- ✅ **Peut être supprimée** si migration effectuée

### Si vous voulez supprimer la table

```sql
-- ATTENTION : Sauvegardez d'abord !
DROP TABLE IF EXISTS reglements_consultation CASCADE;
```

## 🎯 Résumé

### Avant
```
RC → Table reglements_consultation (principal)
  └→ Table dce.reglement_consultation (copie)
```

### Après
```
RC → Table dce.reglement_consultation (unique source)
```

✅ **Architecture simplifiée**  
✅ **Une seule source de vérité**  
✅ **Moins de code de synchronisation**  
✅ **Plus facile à maintenir**

---

**Date** : 20 janvier 2026  
**Fichiers modifiés** : 2  
**Fonctions supprimées** : 3  
**Tables déconnectées** : 1 (`reglements_consultation`)
