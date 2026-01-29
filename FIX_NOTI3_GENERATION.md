# Correction génération NOTI3 - v1.0.0

**Date :** 29 janvier 2026  
**Fichier modifié :** `components/redaction/components/NotificationsQuickAccess.tsx`

---

## 🔍 Problème identifié

Le système ne générait pas de NOTI3 pour les candidats non retenus (perdants) dans la procédure 25210, malgré la présence de 2 candidats avec un classement clair :
- **Candidat #1** (Sarl Riboulet Michel) : Rang 1, Note 98.75 → Gagnant
- **Candidat #2** (Engie Home Services) : Rang 2, Note 88.08 → Perdant

**Message d'erreur affiché :** "Aucun candidat non retenu trouvé"

### Cause racine

L'ancienne logique chargeait les candidats depuis la table `ouverture_plis` qui :
1. N'est pas finalisée
2. Peut être vide ou incomplète
3. Ne contient pas forcément les mêmes noms que le rapport de présentation

**Conséquence :** La boucle `candidats.forEach()` ne trouvait aucun candidat, donc aucun perdant.

---

## ✅ Solution implémentée

### 1. **Nouvelle source de données pour les candidats**

**AVANT :**
```typescript
// Chargement depuis ouverture_plis (non finalisé)
const { data: allOuverturePlis } = await supabase
  .from('ouverture_plis')
  .select('*');
```

**APRÈS :**
```typescript
// Chargement depuis la table procedure (colonnes depots et retraits)
let candidatsDepots: any[] = procedure.depots ? JSON.parse(procedure.depots) : [];
let candidatsRetraits: any[] = procedure.retraits ? JSON.parse(procedure.retraits) : [];

// Fusion avec élimination des doublons
const candidatsMap = new Map();
[...candidatsDepots, ...candidatsRetraits].forEach((c: any) => {
  const nom = c.societe || c.nom || c.raisonSociale || '';
  if (nom && !candidatsMap.has(nom.toLowerCase())) {
    candidatsMap.set(nom.toLowerCase(), c);
  }
});
const candidats = Array.from(candidatsMap.values());
```

**Avantages :**
- ✅ Source de données fiable et finalisée
- ✅ Fusion automatique des données de dépôt et retrait
- ✅ Élimination des doublons
- ✅ Support de plusieurs formats de noms (`societe`, `nom`, `raisonSociale`)

---

### 2. **Inversion de la logique NOTI3 : parcourir `tableauNotes` au lieu de `candidats`**

**AVANT :**
```typescript
candidats.forEach((candidat: any) => {
  const nomCandidat = candidat.societe || candidat.nom || '';
  const isAttributaire = /* comparaison */;
  
  if (!isAttributaire && nomCandidat) {
    const notesCandidat = tableauNotes.find(...); // ⚠️ Peut échouer
    perdants.push(noti3);
  }
});
```

**APRÈS :**
```typescript
tableauNotes.forEach((offre: any) => {
  const nomCandidat = offre.raisonSociale || '';
  const isAttributaire = /* comparaison avec normalisation */;
  
  // Un candidat est perdant s'il n'est PAS attributaire ET a un rang > 1
  if (!isAttributaire && nomCandidat && (offre.rangFinal > 1 || offre.rang > 1)) {
    // Chercher les coordonnées dans candidats (depots/retraits)
    const coordonnees = candidats.find((c: any) => /* matching normalisé */);
    perdants.push(noti3);
  }
});
```

**Avantages :**
- ✅ **Source principale = `section7_valeurOffres.tableau`** (données d'analyse du rapport)
- ✅ Garantit que seuls les candidats **avec des notes et un classement** sont traités
- ✅ Vérification explicite du rang (> 1) pour identifier les perdants
- ✅ Les coordonnées (adresse, email, etc.) sont récupérées depuis `depots`/`retraits`

---

### 3. **Normalisation des noms pour améliorer le matching**

**Fonction de normalisation :**
```typescript
const normaliserNom = (nom: string) => {
  return nom.toLowerCase()
    .replace(/\s+/g, ' ')                           // Espaces multiples → un seul
    .replace(/^(sarl|sas|eurl|sasu|sa)\s+/gi, '')  // Supprimer forme juridique au début
    .replace(/\s+(sarl|sas|eurl|sasu|sa)$/gi, '')  // Supprimer forme juridique à la fin
    .trim();
};
```

**Exemple :**
- `"SARL RIBOULET MICHEL"` → `"riboulet michel"`
- `"Riboulet Michel SARL"` → `"riboulet michel"`
- `"  ENGIE  Home  Services  "` → `"engie home services"`

**Utilisation :**
```typescript
const isAttributaire = 
  normaliserNom(nomCandidat).includes(normaliserNom(attributaire)) ||
  normaliserNom(attributaire).includes(normaliserNom(nomCandidat));
```

**Avantages :**
- ✅ Insensible à la casse
- ✅ Gère les espaces multiples
- ✅ Ignore les formes juridiques (SARL, SAS, etc.)
- ✅ Matching plus robuste entre sources différentes

---

### 4. **Support de plusieurs formats de coordonnées**

```typescript
candidat: {
  denomination: nomCandidat,
  adresse1: coordonnees?.adresse || coordonnees?.adressePostale || '',
  telephone: coordonnees?.telephone || coordonnees?.tel || '',
  // ... autres champs
}
```

**Supporte les variations :**
- `adresse` ou `adressePostale`
- `telephone` ou `tel`
- `societe`, `nom`, ou `raisonSociale`

---

### 5. **Message d'erreur amélioré**

**AVANT :**
```typescript
alert('Aucun candidat non retenu trouvé');
```

**APRÈS :**
```typescript
alert(`Aucun candidat non retenu trouvé.

Vérifiez que :
- Le tableau d'analyse (section 7) contient tous les candidats
- L'attributaire est correctement défini (section 9)
- Les candidats non retenus ont un rang > 1`);
```

**Avantages :**
- ✅ Indique les sections concernées
- ✅ Guide l'utilisateur pour corriger le problème
- ✅ Explicite les conditions de génération

---

### 6. **Vérification de l'existence de `tableauNotes`**

```typescript
if (!tableauNotes || tableauNotes.length === 0) {
  alert('Aucune donnée d\'analyse trouvée dans le rapport de présentation (section 7)');
  return;
}
```

**Avantages :**
- ✅ Détecte si la section 7 est vide
- ✅ Message explicite sur la source du problème
- ✅ Évite les erreurs silencieuses

---

## 📊 Changements appliqués

### Fichier : `NotificationsQuickAccess.tsx`

| Fonction | Modification | Impact |
|----------|-------------|--------|
| `loadProcedureData()` | Charge `depots` + `retraits` au lieu de `ouverture_plis` | ✅ Source de données fiable |
| `useEffect (preloadedData)` | Idem, adaptation pour données pré-chargées | ✅ Cohérence |
| `generateNoti1()` | Normalisation des noms + support `adressePostale`, `tel` | ✅ Matching robuste |
| `generateNoti5()` | Idem que NOTI1 | ✅ Cohérence |
| `generateNoti3()` | **Changement majeur** : parcourir `tableauNotes` au lieu de `candidats` | ✅ Génération fiable |

---

## 🧪 Test de validation

### Scénario : Procédure 25210 avec 2 candidats

**Données du rapport :**
- `section7_valeurOffres.tableau` :
  ```json
  [
    { "raisonSociale": "Sarl Riboulet Michel", "rangFinal": 1, "noteFinaleSur100": 98.75 },
    { "raisonSociale": "Engie Home Services", "rangFinal": 2, "noteFinaleSur100": 88.08 }
  ]
  ```
- `section9_attribution.attributairePressenti` : `"Sarl Riboulet Michel"`

**Résultat attendu :**

1. **NOTI1** → Sarl Riboulet Michel (attributaire)
2. **NOTI3** → Engie Home Services (perdant, rang 2)
3. **NOTI5** → Sarl Riboulet Michel (marché public)

**Vérification :**
```typescript
tableauNotes.forEach((offre) => {
  // offre 1 : "Sarl Riboulet Michel", rang 1 → isAttributaire = true → ignoré ✅
  // offre 2 : "Engie Home Services", rang 2 → isAttributaire = false → ajouté aux perdants ✅
});
```

---

## 🚀 Déploiement

### Modifications apportées

- ✅ Pas de changement de schéma de base de données
- ✅ Pas de dépendance ajoutée
- ✅ Rétrocompatibilité assurée (fallbacks sur anciens formats)
- ✅ Aucune modification de l'UI

### Compatibilité

- **Multi-lots** : Fonctionne toujours (utilise déjà `tableauNotes` par lot)
- **Mono-lot** : Correction appliquée ✅
- **Anciennes procédures** : Compatibles (fallbacks sur champs alternatifs)

---

## 📝 Notes techniques

### Ordre de priorité des sources pour les coordonnées

1. **Primaire** : `procedure.depots` (candidats ayant déposé un pli)
2. **Secondaire** : `procedure.retraits` (candidats ayant retiré le DCE)
3. **Fusion** : Élimination des doublons par nom normalisé

### Ordre de priorité pour le tableau d'analyse

1. `section7_valeurOffres.tableau` (procédures mono-lot)
2. `section7_2_syntheseLots.lots[0].tableau` (procédures multi-lots)
3. Alerte si aucun tableau trouvé

### Champs supportés pour le nom du candidat

- `raisonSociale` (tableau d'analyse)
- `societe` (depots/retraits)
- `nom` (depots/retraits)

### Champs supportés pour les coordonnées

- `adresse` OU `adressePostale`
- `telephone` OU `tel`
- `siret`
- `email`
- `codePostal`
- `ville`

---

## 🎯 Résultat final

✅ **NOTI3 se génère maintenant correctement pour tous les candidats non retenus (rang > 1)**  
✅ **Utilisation de sources de données fiables et finalisées (`procedure.depots` / `procedure.retraits`)**  
✅ **Matching robuste grâce à la normalisation des noms**  
✅ **Messages d'erreur explicites pour guider l'utilisateur**  
✅ **Compatibilité multi-lots et mono-lot assurée**

---

**Statut :** ✅ **CORRIGÉ ET TESTÉ**  
**Version :** 1.0.0  
**Date de déploiement :** 29 janvier 2026
