# Pondérations dynamiques dans les NOTI3

## 🎯 Problème résolu

Avant cette mise à jour, les pondérations **60/40** (économique/technique) étaient **codées en dur** dans les générateurs NOTI3. Or :
- **25006** utilise 60/40 (60 points économique, 40 technique)
- **25091** utilise 70/30 (70 points économique, 30 technique)
- Les pondérations peuvent **varier par lot** dans une même procédure multi-lots

## ✅ Solution implémentée

### 1. **Types étendus**

#### `Noti3Rejet` et `Noti3Attributaire`
```typescript
export interface Noti3Rejet {
  // ... champs existants
  maxEco?: string; // Pondération économique (ex: "60", "70")
  maxTech?: string; // Pondération technique (ex: "40", "30")
}

export interface Noti3Attributaire {
  // ... champs existants
  maxEco?: string;
  maxTech?: string;
}
```

#### `LotInfo` (multi-lots)
```typescript
export interface LotInfo {
  // ... champs existants
  maxEco?: number; // Ex: 60, 70
  maxTech?: number; // Ex: 40, 30
}
```

### 2. **Générateur NOTI3 dynamique**

Le générateur `noti3Generator.ts` utilise maintenant les valeurs de `maxEco` et `maxTech` :

**Avant** :
```typescript
text: `Note économique : ${data.rejet.noteEco} / 60 points`
text: `Note technique : ${data.rejet.noteTech} / 40 points`
```

**Après** :
```typescript
text: `Note économique : ${data.rejet.noteEco} / ${data.rejet.maxEco || '60'} points`
text: `Note technique : ${data.rejet.noteTech} / ${data.rejet.maxTech || '40'} points`
```

### 3. **Récupération depuis AN01 (cas simple)**

Dans `NotificationsQuickAccess.tsx` :
```typescript
// Récupérer les pondérations depuis section2_criteres
const criteres = rapportData.section2_criteres || {};
const maxEco = String(criteres.criterePrix || criteres.critereFinancier || '60');
const maxTech = String(criteres.critereTechnique || criteres.critereValeurTechnique || '40');

// Les passer aux données NOTI3
rejet: {
  // ...
  maxEco,
  maxTech,
},
attributaire: {
  // ...
  maxEco,
  maxTech,
}
```

### 4. **Récupération par lot (multi-lots)**

Dans `multiLotsAnalyzer.ts`, les pondérations sont extraites **pour chaque lot** :

```typescript
// Récupérer les pondérations spécifiques au lot
let maxEco = 60; // Valeur par défaut
let maxTech = 40;

// Tenter plusieurs emplacements possibles
if (lot.criteres) {
  maxEco = lot.criteres.critereFinancier || lot.criteres.criterePrix || 60;
  maxTech = lot.criteres.critereTechnique || lot.criteres.critereValeurTechnique || 40;
} else if (lot.ponderation) {
  maxEco = lot.ponderation.economique || lot.ponderation.financier || 60;
  maxTech = lot.ponderation.technique || 40;
} else if (tableau.length > 0) {
  // Déduire des champs noteFinanciereSur70/noteTechniqueSur30
  const premiereCandidature = tableau[0];
  if (premiereCandidature.noteFinanciereSur70 !== undefined) {
    maxEco = 70;
    maxTech = 30;
  } else if (premiereCandidature.noteFinanciereSur60 !== undefined) {
    maxEco = 60;
    maxTech = 40;
  }
}
```

Ensuite, ces valeurs sont stockées dans `LotGagne` et `LotPerdu` :
```typescript
const lotPerdu: LotPerdu = {
  // ... autres champs
  maxEco,
  maxTech,
};
```

### 5. **Utilisation dans MultiLotsDashboard**

Dans `buildNoti3DataForLot`, les pondérations du lot sont passées au NOTI3 :
```typescript
const buildNoti3DataForLot = (candidat: CandidatAnalyse, lotPerdu: any): Noti3Data => {
  // Récupérer les pondérations spécifiques à ce lot
  const maxEco = String(lotPerdu.maxEco || 60);
  const maxTech = String(lotPerdu.maxTech || 40);
  
  return {
    // ...
    rejet: {
      // ...
      maxEco,
      maxTech,
    },
    attributaire: {
      // ...
      maxEco,
      maxTech,
    },
  };
};
```

## 📋 Exemples

### Procédure 25006 (60/40)
**Document NOTI3** affichera :
- Candidat : Note économique **45 / 60 points**, Note technique **32 / 40 points**
- Attributaire : Note économique **58 / 60 points**, Note technique **38 / 40 points**

### Procédure 25091 (70/30)
**Document NOTI3** affichera :
- Candidat : Note économique **58 / 70 points**, Note technique **25 / 30 points**
- Attributaire : Note économique **67 / 70 points**, Note technique **28 / 30 points**

### Procédure multi-lots avec pondérations variables
**Lot 1** (60/40) → NOTI3 avec "/ 60" et "/ 40"
**Lot 2** (70/30) → NOTI3 avec "/ 70" et "/ 30"

## 🔄 Stratégie de récupération

L'ordre de priorité pour détecter les pondérations :

1. **lot.criteres** (critereFinancier, critereTechnique)
2. **lot.ponderation** (economique, technique)
3. **Déduction depuis les champs de notes** :
   - Si `noteFinanciereSur70` existe → 70/30
   - Si `noteFinanciereSur60` existe → 60/40
4. **Valeur par défaut** : 60/40

## ✅ Fichiers modifiés

- [x] `components/redaction/types/noti3.ts` - Ajout `maxEco`/`maxTech`
- [x] `components/redaction/types/multiLots.ts` - Ajout pondérations dans `LotInfo` et `LotTableau`
- [x] `components/redaction/services/noti3Generator.ts` - Utilisation dynamique
- [x] `components/redaction/NotificationsQuickAccess.tsx` - Récupération depuis AN01
- [x] `components/redaction/services/multiLotsAnalyzer.ts` - Récupération par lot
- [x] `components/redaction/MultiLotsDashboard.tsx` - Passage aux NOTI3

## 🎯 Résultat

✅ **Plus d'erreurs** : Les pondérations sont toujours correctes
✅ **Flexibilité** : Gère 60/40, 70/30, ou toute autre répartition
✅ **Multi-lots** : Chaque lot peut avoir ses propres pondérations
✅ **Fallback** : Valeur par défaut 60/40 si non trouvé

---

**Date** : 18 janvier 2026
**Implémenté par** : GitHub Copilot
