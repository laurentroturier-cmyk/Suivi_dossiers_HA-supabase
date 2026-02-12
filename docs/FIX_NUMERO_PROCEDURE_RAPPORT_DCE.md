# 🔧 FIX : Utilisation du bon numéro de procédure pour charger le DCE

**Date** : 21 janvier 2026
**Module** : Rapport de Présentation
**Fichier** : `components/analyse/RapportPresentation.tsx`
**Version** : 1.0.15+

---

## 🐛 Problème identifié

### Symptôme
L'application cherchait un DCE avec le numéro "1215-1" mais la table `reglements_consultation` stocke les données avec le **numéro à 5 chiffres** (exemple : "25091").

### Cause racine
La fonction `loadDCEData()` utilisait `procedureSelectionnee.NumProc` pour la requête :

```typescript
// ❌ AVANT : utilisait NumProc (format "1215-1")
.eq('numero_procedure', procedureSelectionnee.NumProc)
```

**Mais** :
- `procedureSelectionnee.NumProc` = format "1215-1" (numéro interne)
- `reglements_consultation.numero_procedure` = format "25091" (5 chiffres)

→ **Incompatibilité de format = aucun résultat trouvé**

---

## ✅ Solution appliquée

### Extraction du numéro à 5 chiffres

Le code extrait maintenant le numéro correct depuis le champ `'Numéro de procédure (Afpa)'` :

```typescript
// ✅ APRÈS : extrait les 5 premiers chiffres
const numeroAfpa = procedureSelectionnee['Numéro de procédure (Afpa)'];
const numero5chiffres = numeroAfpa?.match(/^(\d{5})/)?.[1] || procedureSelectionnee['NumeroAfpa5Chiffres'];

if (!numero5chiffres) {
  alert(`Impossible de trouver le numéro à 5 chiffres pour la procédure ${procedureSelectionnee.NumProc}`);
  return;
}

// Utilise le numéro à 5 chiffres pour la requête
.eq('numero_procedure', numero5chiffres)
```

### Logique d'extraction

1. **Priorité 1** : Extraire les 5 premiers chiffres de `'Numéro de procédure (Afpa)'`
   - Exemple : `"25091-AFFAIRE-XXX"` → `"25091"`
   
2. **Priorité 2** : Utiliser le champ `'NumeroAfpa5Chiffres'` s'il existe
   - Champ pré-calculé disponible dans certaines procédures

3. **Fallback** : Alerter l'utilisateur si aucun numéro valide n'est trouvé

---

## 📋 Structure des données

### Table `procédures`

| Champ | Exemple | Utilisation |
|-------|---------|-------------|
| `NumProc` | `"1215-1"` | Identifiant interne, clé primaire |
| `Numéro de procédure (Afpa)` | `"25091"` ou `"25091-XXX"` | Numéro métier AFPA |
| `NumeroAfpa5Chiffres` | `"25091"` | Version pré-calculée (optionnel) |

### Table `reglements_consultation`

| Champ | Type | Exemple |
|-------|------|---------|
| `numero_procedure` | TEXT | `"25091"` (5 chiffres uniquement) |
| `data` | JSONB | `{ "dce": { "documents": [...] } }` |

### Point de jonction

```
procédures['Numéro de procédure (Afpa)'].match(/^(\d{5})/)
          ↓
reglements_consultation['numero_procedure']
```

---

## 🧪 Test de validation

### Scénario 1 : Numéro AFPA simple

```
Procédure :
- NumProc = "1215-1"
- Numéro de procédure (Afpa) = "25091"

Résultat :
✅ numero5chiffres = "25091"
✅ Requête : .eq('numero_procedure', '25091')
```

### Scénario 2 : Numéro AFPA composé

```
Procédure :
- NumProc = "1215-1"
- Numéro de procédure (Afpa) = "25091-MARCHE-TRAVAUX"

Résultat :
✅ numero5chiffres = "25091" (extraction regex)
✅ Requête : .eq('numero_procedure', '25091')
```

### Scénario 3 : Numéro pré-calculé

```
Procédure :
- NumProc = "1215-1"
- NumeroAfpa5Chiffres = "25091"
- Numéro de procédure (Afpa) = null

Résultat :
✅ numero5chiffres = "25091" (fallback)
✅ Requête : .eq('numero_procedure', '25091')
```

### Scénario 4 : Aucun numéro valide

```
Procédure :
- NumProc = "1215-1"
- Numéro de procédure (Afpa) = null
- NumeroAfpa5Chiffres = null

Résultat :
⚠️ Alert: "Impossible de trouver le numéro à 5 chiffres..."
❌ Requête annulée
```

---

## 📊 Impact de la correction

### Avant

- ❌ Recherche avec `NumProc = "1215-1"`
- ❌ Aucun résultat dans `reglements_consultation`
- ❌ Message : "Aucun DCE trouvé pour la procédure 1215-1"
- ❌ Utilisateur bloqué

### Après

- ✅ Extraction automatique du numéro à 5 chiffres
- ✅ Recherche avec `numero_procedure = "25091"`
- ✅ Résultats trouvés dans `reglements_consultation`
- ✅ Auto-remplissage du paragraphe 3 fonctionnel
- ✅ Message d'erreur plus explicite : "Aucun DCE trouvé pour la procédure 25091 (1215-1)"

---

## 🔗 Fichiers modifiés

### `components/analyse/RapportPresentation.tsx`

**Lignes modifiées** : ~112-135

**Fonction** : `loadDCEData()`

**Changements** :
1. Ajout de l'extraction du numéro à 5 chiffres
2. Validation avant requête
3. Utilisation du bon numéro dans la clause `.eq()`
4. Message d'erreur amélioré

---

## 📚 Contexte métier

### Pourquoi deux formats de numéro ?

1. **`NumProc` (format "1215-1")** :
   - Numéro interne de l'application
   - Format : `{ID_Projet}-{Index}`
   - Utilisé pour la navigation, les relations parent-enfant
   
2. **`Numéro de procédure (Afpa)` (format "25091")** :
   - Numéro métier AFPA officiel
   - Format : 5 chiffres
   - Utilisé pour les exports, les documents, les références externes

### Pourquoi utiliser le numéro à 5 chiffres pour le DCE ?

Le module **Contenu du DCE** (module 6) enregistre les données avec le **numéro AFPA** car :
- C'est le numéro qui apparaît sur les documents officiels
- C'est le numéro communiqué aux candidats
- C'est le numéro utilisé dans les registres de dépôts/retraits

→ Le Rapport de Présentation doit donc utiliser ce même numéro pour retrouver les données.

---

## ✅ Checklist de vérification

Avant de considérer le bug corrigé :

- [x] Le code extrait le numéro à 5 chiffres
- [x] La requête utilise ce numéro
- [x] Un fallback existe si le numéro n'est pas trouvé
- [x] Le message d'erreur affiche les deux formats
- [x] La documentation explique la logique
- [ ] **À TESTER** : Charger un DCE avec un numéro AFPA
- [ ] **À TESTER** : Vérifier que le paragraphe 3 se remplit
- [ ] **À TESTER** : Tester avec un numéro composé (ex: "25091-XXX")

---

## 🎯 Prochaines étapes

1. **Tester en conditions réelles** avec une vraie procédure
2. **Vérifier** que la table `reglements_consultation` contient bien le numéro à 5 chiffres
3. **Valider** que le champ `'Numéro de procédure (Afpa)'` est bien rempli dans les procédures
4. **Documenter** les résultats dans TEST_GUIDE.md

---

## 💡 Note pour les développeurs

Si vous rencontrez des erreurs de type "Aucun DCE trouvé", vérifiez :

1. Que la procédure a bien un `'Numéro de procédure (Afpa)'` rempli
2. Que ce numéro commence par 5 chiffres
3. Que la table `reglements_consultation` contient une ligne avec `numero_procedure = "25091"`

**SQL de diagnostic** :

```sql
-- Vérifier le contenu de la table reglements_consultation
SELECT numero_procedure, created_at 
FROM reglements_consultation 
WHERE numero_procedure LIKE '25%'
ORDER BY created_at DESC;

-- Vérifier les procédures qui ont un numéro AFPA
SELECT "NumProc", "Numéro de procédure (Afpa)", "NumeroAfpa5Chiffres"
FROM procédures
WHERE "Numéro de procédure (Afpa)" IS NOT NULL
LIMIT 10;
```

---

**Statut** : ✅ **FIX APPLIQUÉ - EN ATTENTE DE TEST**

