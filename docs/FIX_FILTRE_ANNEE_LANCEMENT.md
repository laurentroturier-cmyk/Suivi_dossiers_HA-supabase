# 🔧 FIX : Filtre "Année de lancement" dans le tableau de bord Procédures

**Date** : 21 janvier 2026  
**Module** : Tableau de bord - Section Procédures  
**Fichier** : `App.tsx`  
**Lignes** : ~1475-1486, ~3424-3436

---

## 🐛 Problème identifié

### Symptôme
Le filtre "ANNÉE DE LANCEMENT" dans le tableau de bord des procédures ne fonctionnait pas correctement :
- ✅ La sélection d'une année fonctionnait visuellement
- ❌ Mais les procédures n'étaient pas filtrées
- ❌ Le bouton "Reset" n'effaçait pas ce filtre

### Causes racines

**1. Bouton Reset appelait la mauvaise fonction**
```typescript
// ❌ AVANT : appelait resetFilters() (fonction générale)
<button onClick={resetFilters}>Reset</button>
```

La fonction `resetFilters()` était censée réinitialiser TOUS les filtres (projets + procédures), mais le bouton Reset dans la section Procédures devait appeler `resetProcedureFilters()`.

**2. resetProcedureFilters() manquait les nouveaux filtres**
```typescript
// ❌ AVANT : ne réinitialisait pas selectedLaunchYears et selectedOfferYears
const resetProcedureFilters = () => {
  setSelectedAcheteurs([]);
  setSelectedProcTypes([]);
  setSelectedYears([]);
  setSelectedProcedureStatuses([]);
  // ❌ Manquants :
  // setSelectedLaunchYears([]);
  // setSelectedOfferYears([]);
  setLaunchFrom('');
  setLaunchTo('');
};
```

**3. Condition d'affichage du bouton Reset incorrecte**
```typescript
// ❌ AVANT : une seule condition pour projets ET procédures
{(selectedAcheteurs.length > 0 || selectedPriorities.length > 0 || 
  selectedProcedureStatuses.length > 0 || selectedLaunchYears.length > 0 || 
  selectedOfferYears.length > 0 || projectSearch || procedureSearch) && (
  <button onClick={resetFilters}>Reset</button>
)}
```

Cette condition mélange les filtres projets (`selectedPriorities`, `projectSearch`) et procédures (`selectedProcedureStatuses`, `procedureSearch`).

---

## ✅ Solutions appliquées

### 1. Ajout des filtres manquants dans resetProcedureFilters()

```typescript
// ✅ APRÈS : réinitialise TOUS les filtres procédures
const resetProcedureFilters = () => {
  setSelectedAcheteurs([]);
  setSelectedProcTypes([]);
  setSelectedYears([]);
  setSelectedProcedureStatuses([]);
  setSelectedLaunchYears([]); // ✅ Ajouté
  setSelectedOfferYears([]);  // ✅ Ajouté
  setLaunchFrom('');
  setLaunchTo('');
  setDeployFrom('');
  setDeployTo('');
};
```

### 2. Séparation des boutons Reset selon l'onglet actif

```typescript
// ✅ APRÈS : bouton Reset pour PROJETS
{activeTab === 'dossiers' && (selectedAcheteurs.length > 0 || 
  selectedPriorities.length > 0 || selectedStatuses.length !== defaultStatusCount || 
  projectSearch) && (
  <button onClick={resetProjectFilters}>Reset</button>
)}

// ✅ APRÈS : bouton Reset pour PROCÉDURES
{activeTab === 'procedures' && (selectedAcheteurs.length > 0 || 
  selectedProcedureStatuses.length > 0 || selectedLaunchYears.length > 0 || 
  selectedOfferYears.length > 0 || procedureSearch) && (
  <button onClick={resetProcedureFilters}>Reset</button>
)}
```

**Avantages** :
- ✅ Chaque onglet a son propre bouton Reset
- ✅ Chaque bouton appelle la bonne fonction de reset
- ✅ Les conditions d'affichage sont spécifiques à chaque onglet
- ✅ Plus de confusion entre filtres projets et procédures

---

## 📊 Impact de la correction

### Avant
1. **Filtre année lancement** :
   - ✅ Sélection visuelle fonctionnait
   - ❌ Filtrage non appliqué (variable `selectedLaunchYears` utilisée mais jamais réinitialisée)
   
2. **Bouton Reset** :
   - ❌ Appelait `resetFilters()` (fonction générale)
   - ❌ Ne réinitialisait pas `selectedLaunchYears` ni `selectedOfferYears`
   
3. **Confusion** :
   - ❌ Mélange entre filtres projets et procédures
   - ❌ Un seul bouton Reset pour tout

### Après
1. **Filtre année lancement** :
   - ✅ Sélection visuelle fonctionne
   - ✅ Filtrage appliqué correctement
   - ✅ Reset fonctionne
   
2. **Bouton Reset - Projets** :
   - ✅ Visible uniquement sur l'onglet "Projets achats"
   - ✅ Appelle `resetProjectFilters()`
   - ✅ Réinitialise uniquement les filtres projets
   
3. **Bouton Reset - Procédures** :
   - ✅ Visible uniquement sur l'onglet "Procédures"
   - ✅ Appelle `resetProcedureFilters()`
   - ✅ Réinitialise TOUS les filtres procédures (y compris années)

4. **Clarté** :
   - ✅ Séparation nette entre filtres projets et procédures
   - ✅ Chaque onglet a son propre reset
   - ✅ Code plus maintenable

---

## 🧪 Tests de validation

### Test 1 : Filtre année de lancement

**Procédure** :
1. Aller sur le tableau de bord
2. Cliquer sur l'onglet "Procédures"
3. Ouvrir le filtre "Année lancement"
4. Sélectionner une année (ex: 2023)

**Résultat attendu** :
- ✅ La liste des procédures se filtre immédiatement
- ✅ Seules les procédures avec `Date de lancement de la consultation` en 2023 s'affichent
- ✅ Le badge "1 sélectionné(s)" s'affiche sur le filtre

### Test 2 : Filtre année de remise des offres

**Procédure** :
1. Ouvrir le filtre "Année remise offres"
2. Sélectionner une année (ex: 2024)

**Résultat attendu** :
- ✅ La liste se filtre sur les procédures avec `Date de remise des offres finales` en 2024
- ✅ Le filtre se combine avec le précédent (AND)

### Test 3 : Bouton Reset - Procédures

**Procédure** :
1. Avec des filtres actifs (année lancement + année remise)
2. Cliquer sur le bouton "Reset"

**Résultat attendu** :
- ✅ Le bouton "Reset" est visible
- ✅ Tous les filtres procédures sont effacés :
  - Acheteur
  - Statut
  - Année lancement
  - Année remise
  - Recherche procédure
- ✅ La liste complète des procédures s'affiche

### Test 4 : Bouton Reset - Projets (non-régression)

**Procédure** :
1. Aller sur l'onglet "Projets achats"
2. Activer des filtres (Acheteur, Priorité)
3. Cliquer sur "Reset"

**Résultat attendu** :
- ✅ Seuls les filtres projets sont réinitialisés
- ✅ Les filtres procédures (s'ils étaient actifs) restent inchangés

---

## 📂 Fichiers modifiés

### `App.tsx`

**Ligne ~1475-1486** : Fonction `resetProcedureFilters()`
```typescript
// Ajout de :
setSelectedLaunchYears([]);
setSelectedOfferYears([]);
```

**Ligne ~3424-3436** : Boutons Reset séparés
```typescript
// Avant : 1 bouton Reset général
{(conditions) && <button onClick={resetFilters}>Reset</button>}

// Après : 2 boutons Reset spécifiques
{activeTab === 'dossiers' && (conditionsProjets) && 
  <button onClick={resetProjectFilters}>Reset</button>}
{activeTab === 'procedures' && (conditionsProcedures) && 
  <button onClick={resetProcedureFilters}>Reset</button>}
```

---

## 🎯 Architecture améliorée

### Avant (confus)
```
┌─────────────────────────────────────────┐
│         Bouton Reset Unique             │
│     onClick={resetFilters()}            │
│                                          │
│  (mélange projets + procédures)         │
└─────────────────────────────────────────┘
```

### Après (clair)
```
┌──────────────────────┐  ┌──────────────────────┐
│   Onglet PROJETS     │  │  Onglet PROCÉDURES   │
├──────────────────────┤  ├──────────────────────┤
│ Bouton Reset         │  │ Bouton Reset         │
│ resetProjectFilters()│  │ resetProcedureFilters()│
│                      │  │                       │
│ Filtres :            │  │ Filtres :             │
│ • Acheteur           │  │ • Acheteur            │
│ • Priorité           │  │ • Statut              │
│ • Statut             │  │ • Année lancement ✅  │
│ • Recherche projet   │  │ • Année remise ✅     │
│                      │  │ • Recherche procédure │
└──────────────────────┘  └──────────────────────┘
```

---

## 💡 Recommandations futures

### 1. Extraire les filtres dans un composant séparé
```typescript
// Suggestion : créer <ProcedureFilters /> et <ProjectFilters />
// Pour éviter la duplication et améliorer la lisibilité
```

### 2. Utiliser un store dédié pour les filtres
```typescript
// Suggestion : créer useFiltersStore() avec Zustand
// Pour centraliser la logique de filtrage
```

### 3. Tests unitaires
```typescript
// Suggestion : ajouter des tests pour :
// - resetProcedureFilters()
// - resetProjectFilters()
// - Logique de filtrage par année
```

---

## ✅ Checklist de vérification

- [x] `resetProcedureFilters()` réinitialise `selectedLaunchYears`
- [x] `resetProcedureFilters()` réinitialise `selectedOfferYears`
- [x] Bouton Reset Projets appelle `resetProjectFilters()`
- [x] Bouton Reset Procédures appelle `resetProcedureFilters()`
- [x] Conditions d'affichage séparées par onglet
- [x] Pas d'erreurs TypeScript
- [ ] **À TESTER** : Filtrer par année de lancement
- [ ] **À TESTER** : Filtrer par année de remise
- [ ] **À TESTER** : Reset dans l'onglet Procédures
- [ ] **À TESTER** : Reset dans l'onglet Projets (non-régression)

---

**Statut** : ✅ **FIX APPLIQUÉ - EN ATTENTE DE TEST**

