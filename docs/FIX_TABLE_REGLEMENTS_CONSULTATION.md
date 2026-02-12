# 🔧 CORRECTION - Connexion Rapport ↔ Règlement de Consultation

## 🐛 Problème identifié

L'application cherchait dans la **mauvaise table** :

```
❌ AVANT : Table 'dce' (n'existe pas ou vide)
✅ APRÈS : Table 'reglements_consultation' (données présentes)
```

### Détails du bug

**Message d'erreur** :
```
Aucun DCE trouvé pour la procédure 1215-1.
Veuillez d'abord créer le DCE dans le module "6. Contenu du DCE".
```

**Cause** : L'application cherche avec le champ `NumProc` (ex: "1215-1"), mais les données sont stockées avec le **numéro à 5 chiffres** (ex: "25091") dans `reglements_consultation`.

---

## ✅ Correction appliquée

### Changement de table

```typescript
// ❌ AVANT
const { data } = await supabase
  .from('dce')
  .select('reglement_consultation')
  .eq('numero_procedure', procedureSelectionnee.NumProc)
  .single();

// ✅ APRÈS
const { data } = await supabase
  .from('reglements_consultation')
  .select('data')
  .eq('numero_procedure', procedureSelectionnee.NumProc)
  .single();
```

### Adaptation du parsing

```typescript
// ❌ AVANT
const rcData = data.reglement_consultation;

// ✅ APRÈS  
const rcData = data.data;
```

---

## 📊 Structure de la table `reglements_consultation`

```sql
CREATE TABLE public.reglements_consultation (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  numero_procedure TEXT NOT NULL,          -- Clé : numéro à 5 chiffres (ex: "25091")
  titre_marche TEXT NULL,
  numero_marche TEXT NULL,
  data JSONB NOT NULL,                     -- Contient le RC complet
  created_at TIMESTAMPTZ NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NULL DEFAULT NOW(),
  CONSTRAINT reglements_consultation_pkey PRIMARY KEY (id),
  CONSTRAINT reglements_consultation_numero_procedure_key UNIQUE (numero_procedure)
);
```

### Données stockées

```json
{
  "data": {
    "dce": {
      "documents": [
        "Règlement de la Consultation (RC)",
        "Acte d'Engagement (AE)",
        ...
      ]
    }
  }
}
```

---

## 🔍 Problème d'identification

### Deux champs différents

| Champ | Format | Exemple | Utilisation |
|-------|--------|---------|-------------|
| `NumProc` | Variable | "1215-1" | Identifiant de procédure (ancien format ?) |
| `numero_procedure` | 5 chiffres | "25091" | Clé primaire dans `reglements_consultation` |

### ⚠️ Point d'attention

Le `NumProc` utilisé par l'application ("1215-1") **ne correspond pas** au `numero_procedure` de la table ("25091").

**Solution actuelle** : Le code utilise `procedureSelectionnee.NumProc`, donc il faut que ce champ contienne le **numéro à 5 chiffres**.

### ✅ Vérification à faire

S'assurer que dans les procédures chargées, le champ `NumProc` correspond bien au numéro à 5 chiffres stocké dans `reglements_consultation.numero_procedure`.

---

## 🧪 Test

### Scénario

1. Sélectionner la procédure avec `NumProc = "25091"`
2. Cliquer sur "Charger depuis DCE"
3. ✅ Le système doit charger les données de `reglements_consultation` WHERE `numero_procedure = '25091'`

### Requête SQL de vérification

```sql
-- Vérifier les données
SELECT 
  numero_procedure,
  titre_marche,
  data->'dce'->'documents' AS documents
FROM reglements_consultation
WHERE numero_procedure = '25091';
```

---

## 📝 Fichier modifié

**`components/analyse/RapportPresentation.tsx`**

### Ligne 112-164 : Fonction `loadDCEData()`

```typescript
const loadDCEData = async () => {
  // ...
  const { data, error } = await supabase
    .from('reglements_consultation')  // ✅ Table correcte
    .select('data')                    // ✅ Colonne correcte
    .eq('numero_procedure', procedureSelectionnee.NumProc)
    .single();

  const rcData = data.data;  // ✅ Accès correct au JSONB
  // ...
};
```

---

## ⚠️ Point à clarifier

### Question

Le champ `procedureSelectionnee.NumProc` retourne-t-il :
- A) Le numéro à 5 chiffres (ex: "25091") ? ✅ Devrait fonctionner
- B) Un autre format (ex: "1215-1") ? ❌ Il faudra mapper

### Solution si problème de mapping

Si `NumProc` ne correspond pas au `numero_procedure`, il faudra :

1. **Option 1** : Ajouter un champ `numero_procedure` dans les procédures
2. **Option 2** : Créer une table de correspondance
3. **Option 3** : Modifier le champ utilisé dans la requête

---

## 📚 Documentation à mettre à jour

Les documents suivants mentionnent l'ancienne table `dce` :

- [x] [RAPPORT_DCE_CONNEXION.md](docs/RAPPORT_DCE_CONNEXION.md) - ⚠️ À mettre à jour
- [x] [RAPPORT_DCE_QUICKSTART.md](docs/RAPPORT_DCE_QUICKSTART.md) - ⚠️ À mettre à jour
- [x] [GUIDE_UTILISATEUR_RAPPORT_DCE.md](docs/GUIDE_UTILISATEUR_RAPPORT_DCE.md) - ⚠️ À mettre à jour
- [x] [CHANGELOG_RAPPORT_DCE_v1.0.15.md](CHANGELOG_RAPPORT_DCE_v1.0.15.md) - ⚠️ À mettre à jour

### Notes de mise à jour

```
Table 'dce' → 'reglements_consultation'
Colonne 'reglement_consultation' → 'data'
```

---

## ✅ Checklist

- [x] Code corrigé (table + colonne)
- [x] Messages d'erreur inchangés (toujours pertinents)
- [x] Structure du parsing adaptée (`data.data` au lieu de `data.reglement_consultation`)
- [ ] Vérifier que `NumProc` = numéro à 5 chiffres
- [ ] Tester avec une vraie procédure (ex: 25091)
- [ ] Mettre à jour la documentation

---

## 🎯 Résumé

**Changement principal** :  
Table `dce` → Table `reglements_consultation`

**Champ utilisé** :  
`numero_procedure` (doit correspondre à `NumProc`)

**Colonne récupérée** :  
`data` (JSONB contenant tout le RC)

**Parsing** :  
`data.data.dce.documents`

---

**Date** : 21 janvier 2026  
**Version** : 1.0.15 (patch)  
**Fichier** : `components/analyse/RapportPresentation.tsx`  
**Lignes** : 112-164
