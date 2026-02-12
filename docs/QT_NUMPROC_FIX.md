# 🔧 Fix : Résolution du NumProc complet pour QT

## 📋 Problème identifié

Les données du Questionnaire Technique (QT) ne remontaient pas dans le DCE, alors que le module historique les chargeait correctement.

### Cause racine
La table `questionnaires_techniques` stocke les données avec le **NumProc complet** (ex: `"1013-1"`), mais le DCE utilise le **numero court** (5 chiffres : `25006`).

```
DCE reçoit:     25006 (5 chiffres)
questionnaires_techniques stocke: 1013-1 (NumProc complet)
❌ Mismatch → pas de données trouvées
```

## ✅ Solution implémentée

### Le pattern correct (copié du module historique)

Le module historique **ne cherche PAS directement** dans questionnaires_techniques avec le code court.
Il **recherche d'abord dans `procédures`** avec le code court pour obtenir le NumProc complet !

```typescript
// Module historique (QuestionnaireTechnique.tsx ligne 82-93)
const { data, error: err } = await supabase
  .from('procédures')
  .select('NumProc, ...')
  .ilike('numero court procédure afpa', `%${query}%`)  // ← Code court
  .limit(10);

// Récupère le NumProc complet
results = data.map(proc => ({
  NumProc: proc['NumProc'],  // ← NumProc complet
  'numero court procédure afpa': proc['numero court procédure afpa']
}));
```

### Mon fix applique le même pattern

```typescript
// questionnaireTechniqueStorage.ts
async function getFullNumProcFromShortCode(numeroProcedureShort: string) {
  // 1. Chercher dans procédures avec .ilike (comme le module)
  const { data } = await supabase
    .from('procédures')
    .select('NumProc')
    .ilike('numero court procédure afpa', `%${numeroProcedureShort}%`)
    .maybeSingle();
  
  // 2. Retourner le NumProc complet
  return data?.NumProc || null;
}

// Ensuite, utiliser le NumProc complet pour les requêtes
const fullNumProc = await getFullNumProcFromShortCode("25006");  // → "1013-1"
.eq('num_proc', fullNumProc)  // ✅ Requête correcte
```

## 📋 Modifications dans `questionnaireTechniqueStorage.ts`

### Avant
```typescript
// ❌ Bug: cherchait avec le code court (5 chiffres)
.eq('num_proc', numeroProcedure)  // numeroProcedure = "25006"
// Jamais trouvé car table contient "1013-1"
```

### Après
```typescript
// ✅ Fixe: résout le NumProc complet d'abord
let fullNumProc = numeroProcedure;
if (numeroProcedure.length === 5) {
  const resolved = await getFullNumProcFromShortCode(numeroProcedure);
  if (resolved) fullNumProc = resolved;  // fullNumProc = "1013-1"
}

// Puis utilise le NumProc complet
.eq('num_proc', fullNumProc)  // ✅ Cherche avec "1013-1"
```

### Trois fonctions mises à jour
1. **`saveQuestionnaireTechnique()`** - Résout le NumProc avant d'insérer
2. **`loadQuestionnaireTechnique()`** - Résout le NumProc avant de chercher
3. **`loadExistingQT()`** - Résout le NumProc pour le backfill

## 🔄 Flux corrigé

```
DCE demande chargement avec numero_procedure="25006"
                    ↓
getFullNumProcFromShortCode("25006")
                    ↓
Requête: procédures.ilike('numero court procédure afpa', '%25006%')
                    ↓
Résultat: NumProc="1013-1"
                    ↓
Cherche dans questionnaires_techniques.eq('num_proc', '1013-1')
                    ↓
✅ Données trouvées et remontent dans le DCE
```

## 📊 Impact

| Composant | Avant | Après |
|-----------|-------|-------|
| DCE avec 25006 | ❌ "Non renseigné" | ✅ Données du QT chargées |
| QuestionnaireTechnique.tsx | ❌ Aucune donnée au démarrage | ✅ Auto-chargement via props |
| questionnaireTechniqueStorage.ts | ❌ Cherchait avec code court | ✅ Résout NumProc complet (pattern module) |
| dceService.ts | ❌ Backfill échouait | ✅ Backfill fonctionne |

## 🧪 À tester

```bash
1. Aller dans DCE > Procédure 25006
2. Cliquer sur "Questionnaire Technique"
3. ✅ Les données doivent charger automatiquement si elles existent
4. ✅ La sauvegarde doit synchroniser vers questionnaires_techniques
5. ✅ Le rechargement doit retrouver les données
```

### Test rapide (console navigateur)
```javascript
// Dans la console du navigateur du DCE
import { testQTLoading } from './components/redaction/questionnaire/questionnaireTechniqueTest';
await testQTLoading('25006');
// Affichera les étapes de résolution et cherche
```

## 🎯 Logs de débogage

Le code affiche des logs avec emoji pour suivre la résolution :
```
🔍 Recherche NumProc pour code court: 25006
✅ Mapping trouvé: 25006 → 1013-1
📝 Sauvegarde QT avec NumProc: 1013-1
✅ QT trouvé et chargé pour NumProc: 1013-1
```

## 📌 Points clés du pattern

✅ **Même approche que le module historique** :
- Chercher dans `procédures` avec `.ilike()` et le code court
- Obtenir le `NumProc` complet
- Utiliser ce NumProc pour interroger `questionnaires_techniques`

✅ **Cohérent avec RC** :
- Non-critique synchro (warn si fail, mais continue)
- Bidirectionnelle (questionnaires_techniques ↔ dce.qt)
- Backfill au chargement du DCE
- Sync lors de la sauvegarde d'une section

✅ **Futures améliorations** :
- Supprimer les tables historiques après confirmation
- Unifier la synchronisation des tables legacy
- Ajouter un audit trail des migrations


