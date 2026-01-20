# 🔄 Synchronisation bidirectionnelle DCE ↔ Procédures

## 🎯 Fonctionnalité implémentée

Un système complet de synchronisation automatique et de résolution de conflits entre la table `dce` et la table `procedures`.

### Principe de fonctionnement

```
┌────────────────────────────────────────────────────────────────────┐
│  PRIORITÉ : Table procédures = Source de vérité                    │
└────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────────────┐
│  CHARGEMENT DCE                                                     │
│  1. Charger DCE existant (ou créer nouveau)                        │
│  2. Charger procédure depuis table "procedures"                    │
│  3. Pré-remplir DCE avec données procedures                        │
│  4. Détecter conflits (comparaison champ par champ)                │
│  5. ⚠️ Si conflits → Afficher modal de résolution                  │
└────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────────────┐
│  ÉDITION FORMULAIRE RC                                             │
│  - Utilisateur modifie titre, dates, CPV, etc.                     │
│  - Modifications stockées en mémoire (updateSectionLocal)          │
│  - Badge orange : "Modifications non sauvegardées"                 │
└────────────────────────────────────────────────────────────────────┘
         │
         ↓
┌────────────────────────────────────────────────────────────────────┐
│  SAUVEGARDE DCE                                                    │
│  1. Utilisateur clique sur "💾 Sauvegarder"                       │
│  2. Détecter conflits avec table procedures                        │
│  3. Si conflits → Modal de résolution :                            │
│     • Garder valeur procedures (écraser DCE)                       │
│     • Garder valeur DCE (mettre à jour procedures)                 │
│     • Ignorer ce champ                                             │
│  4. Appliquer résolutions                                          │
│  5. Sauvegarder DCE en base                                        │
│  6. Si choisi : Mettre à jour table procedures                     │
└────────────────────────────────────────────────────────────────────┘
```

## 📋 Mapping des champs

### DCE → Procédures

| Champ DCE | Colonne Procédures | Priorité |
|-----------|-------------------|----------|
| `reglementConsultation.enTete.titreMarche` | `Nom de la procédure` | **procedures** |
| `reglementConsultation.enTete.numeroMarche` | `Numéro de procédure (Afpa)` | **procedures** |
| `reglementConsultation.enTete.dateLimiteOffres` | `Date de remise des offres` | **procedures** |
| `reglementConsultation.objet.description` | `Objet court` | **procedures** |
| `reglementConsultation.objet.cpvPrincipal` | `Code CPV Principal` | **procedures** |
| `reglementConsultation.conditions.modePassation` | `Type de procédure` | **procedures** |
| `reglementConsultation.conditions.nbLots` | `Nombre de lots` | **procedures** |
| `reglementConsultation.typeMarche.forme` | `Forme du marché` | **procedures** |
| `reglementConsultation.typeMarche.dureeInitiale` | `Durée du marché (en mois)` | **procedures** |
| `reglementConsultation.remise.delaiValiditeOffres` | `Durée de validité des offres (en jours)` | **procedures** |
| `titreMarche` (global) | `Nom de la procédure` | **procedures** |

## 🔧 Composants créés

### 1. `procedureSyncService.ts`

**Service de synchronisation bidirectionnelle**

#### Fonctions principales :

```typescript
// Détecte les conflits entre DCE et procedures
detectConflicts(dceState: DCEState, procedure: ProjectData): ConflictDetectionResult

// Charge et fusionne les données de procedures dans le DCE
loadAndMergeProcedureData(numeroProcedure: string, currentDCE: DCEState): Promise<{
  mergedDCE: DCEState;
  procedure: ProjectData | null;
  conflicts: ConflictDetectionResult;
}>

// Applique les résolutions de conflits choisies par l'utilisateur
resolveConflicts(
  conflicts: DataConflict[],
  resolutions: Record<string, ConflictResolution>,
  dceState: DCEState,
  procedure: ProjectData
): Promise<{
  updatedDCE: DCEState;
  updatedProcedure: Partial<ProjectData>;
  needsDCEUpdate: boolean;
  needsProcedureUpdate: boolean;
}>

// Met à jour la table procedures dans Supabase
updateProcedure(numeroProcedure: string, updates: Partial<ProjectData>): Promise<{
  success: boolean;
  error?: string;
}>
```

#### Types :

```typescript
interface DataConflict {
  field: string; // "Titre du marché"
  dcePath: string; // "reglementConsultation.enTete.titreMarche"
  procedureColumn: string; // "Nom de la procédure"
  dceValue: any;
  procedureValue: any;
  priority: 'procedure' | 'dce';
}

type ConflictResolution = 
  | 'keep-procedure'  // Priorité à procedures
  | 'keep-dce'        // Mettre à jour procedures
  | 'skip-field';     // Ne rien faire
```

### 2. `ConflictResolverModal.tsx`

**Interface utilisateur pour résoudre les conflits**

#### Fonctionnalités :

- ✅ Liste tous les conflits détectés
- ✅ Affiche les valeurs côte à côte (procedures vs DCE)
- ✅ 3 options par conflit :
  - Conserver valeur procedures (vert)
  - Conserver valeur DCE (bleu)
  - Ignorer (gris)
- ✅ Résumé des choix en bas de modal
- ✅ Bouton "Appliquer les résolutions"

### 3. Hook `useDCEState` amélioré

**Nouvelles propriétés et méthodes** :

```typescript
const {
  // ... Propriétés existantes
  
  // 🆕 Nouvelles propriétés
  conflicts: ConflictDetectionResult | null,
  resolveConflicts: (resolutions: Record<string, ConflictResolution>) => Promise<boolean>,
  checkConflicts: () => Promise<void>,
} = useDCEState({ numeroProcedure, autoLoad });
```

#### Comportement modifié :

**`loadDCE()`** :
- Charge le DCE
- Charge la procédure correspondante
- Fusionne automatiquement les données (priorité à procedures)
- Détecte les conflits
- Stocke les conflits dans le state

**`saveDCE()`** :
- Détecte les conflits avant sauvegarde (si procédure chargée)
- Si conflits → Affiche le modal de résolution
- Sinon → Sauvegarde normale

**`resolveConflicts(resolutions)`** :
- Applique les choix utilisateur
- Met à jour le DCE si nécessaire
- Met à jour la table procedures si nécessaire
- Sauvegarde les changements
- Réinitialise les conflits

### 4. `DCEStatusBar` amélioré

**Nouveau badge de conflits** :

```tsx
{conflicts && conflicts.hasConflicts && (
  <button
    onClick={onShowConflicts}
    className="amber-badge"
  >
    <GitCompare />
    {conflicts.conflicts.length} conflit{conflicts.conflicts.length > 1 ? 's' : ''}
  </button>
)}
```

Affiche :
- 🟨 Badge orange avec icône GitCompare
- Nombre de conflits détectés
- Cliquable pour ouvrir le modal

### 5. `DCEComplet.tsx` enrichi

**Nouveau workflow** :

```typescript
// Au chargement
useEffect(() => {
  if (conflicts?.hasConflicts) {
    setShowConflictModal(true); // Ouvre automatiquement le modal
  }
}, [conflicts]);

// Handler de résolution
const handleResolveConflicts = async (resolutions) => {
  const success = await resolveConflicts(resolutions);
  if (success) {
    setShowConflictModal(false);
    await loadDCE(); // Recharge pour afficher les données mises à jour
  }
};
```

## 🧪 Scénarios de test

### Test 1 : Détection de conflits au chargement

**Setup** :
- Table `procedures` : `Nom de la procédure = "Fourniture matériel informatique"`
- Table `dce` : `titreMarche = "Achat ordinateurs"`

**Actions** :
1. Ouvrir module DCE Complet
2. Saisir numéro : `26008`

**Résultat attendu** :
- ✅ Modal de conflits s'ouvre automatiquement
- ✅ Affiche : "Titre du marché"
  - Procedures : "Fourniture matériel informatique"
  - DCE : "Achat ordinateurs"
- ✅ Option par défaut : "Conserver valeur procedures" (vert)

### Test 2 : Résolution "Conserver procedures"

**Actions** :
1. Dans le modal, garder l'option par défaut (procedures)
2. Cliquer sur "Appliquer les résolutions"

**Résultat attendu** :
- ✅ Modal se ferme
- ✅ DCE mis à jour avec "Fourniture matériel informatique"
- ✅ Sauvegardé en base
- ✅ Badge conflits disparaît

**Vérification SQL** :
```sql
SELECT reglement_consultation->>'titreMarche' FROM dce WHERE numero_procedure = '26008';
-- Résultat : "Fourniture matériel informatique"
```

### Test 3 : Résolution "Conserver DCE"

**Actions** :
1. Modifier le titre dans le formulaire RC : "Nouveau titre"
2. Cliquer sur "Sauvegarder"
3. Dans le modal, choisir "Conserver valeur DCE et mettre à jour procedures"
4. Cliquer sur "Appliquer"

**Résultat attendu** :
- ✅ Table `dce` sauvegardée avec "Nouveau titre"
- ✅ Table `procedures` mise à jour avec "Nouveau titre"
- ✅ Modal se ferme
- ✅ Badge vert "Tout est sauvegardé"

**Vérification SQL** :
```sql
SELECT "Nom de la procédure" FROM procedures WHERE "numero court procédure afpa" = '26008';
-- Résultat : "Nouveau titre"

SELECT reglement_consultation->>'titreMarche' FROM dce WHERE numero_procedure = '26008';
-- Résultat : "Nouveau titre"
```

### Test 4 : Résolution "Ignorer"

**Actions** :
1. Dans le modal, choisir "Ignorer ce champ"
2. Appliquer

**Résultat attendu** :
- ✅ Aucune modification sur `dce`
- ✅ Aucune modification sur `procedures`
- ✅ Les valeurs restent différentes
- ✅ Badge conflits disparaît (conflits ignorés)

### Test 5 : Plusieurs conflits

**Setup** :
- Différences sur : titre, date limite, CPV

**Actions** :
1. Ouvrir le modal
2. Titre → Conserver procedures
3. Date → Conserver DCE (met à jour procedures)
4. CPV → Ignorer
5. Appliquer

**Résultat attendu** :
- ✅ Titre : Valeur de procedures écrasée dans DCE
- ✅ Date : Valeur DCE copiée dans procedures
- ✅ CPV : Aucun changement
- ✅ Toast de confirmation ou message de succès

## 📊 Architecture technique

### Flux de données

```
[procedures]  ──load──>  [useDCEState]  ──merge──>  [dceState]
    │                         │                          │
    │                    detectConflicts()               │
    │                         │                          │
    │                    [conflicts]                     │
    │                         │                          │
    │                         ↓                          │
    │            ┌──────────────────────┐                │
    │            │ ConflictResolverModal │               │
    │            │  - keep-procedure    │                │
    │            │  - keep-dce          │                │
    │            │  - skip-field        │                │
    │            └──────────────────────┘                │
    │                         │                          │
    │                   resolveConflicts()               │
    │                         │                          │
    ├───update (if needed)────┘                          │
    │                                                    │
    └───────────────────  saveDCE()  ────────────────────┘
```

### Comparaison des valeurs

La fonction `areValuesEqual()` normalise les comparaisons :

```typescript
areValuesEqual(val1, val2):
  - Trim et lowercase
  - Comparaison de dates (formats multiples)
  - Comparaison de nombres
  - Gestion des null/undefined/empty
```

## 🎨 UI/UX

### Badge de conflits

| État | Affichage | Couleur | Action |
|------|-----------|---------|--------|
| **Aucun conflit** | Masqué | - | - |
| **Conflits détectés** | `🔄 2 conflits` | Amber | Ouvre modal |

### Modal de résolution

**Header** :
- Icône ⚠️ AlertTriangle
- Titre : "Conflits détectés"
- Sous-titre : "X différence(s) entre le DCE et la table procédures"

**Bannière info** :
- 💾 "Priorité recommandée : Conserver les données de la table **procédures** (source de vérité)"

**Chaque conflit** :
- Numéro du conflit (1, 2, 3...)
- Nom convivial du champ
- Comparaison côte à côte :
  - Gauche : 🗄️ Table procédures (vert)
  - Droite : 📄 DCE actuel (bleu)
- 3 radios boutons :
  - ✅ Conserver procédures (vert)
  - ✅ Conserver DCE (bleu)
  - ⭕ Ignorer (gris)

**Footer** :
- Résumé : "3 depuis procedures • 1 depuis DCE • 1 ignoré"
- Boutons :
  - Annuler (gris)
  - Appliquer les résolutions → (bleu)

## 🔒 Sécurité

### Permissions Supabase

**Table `procedures`** :
- Lecture : Tous les utilisateurs authentifiés
- Écriture : **Admins uniquement**

**Table `dce`** :
- Lecture/Écriture : Selon RLS (propriétaire ou admin)

**⚠️ Important** : 
Si l'utilisateur choisit "Conserver DCE", la mise à jour de `procedures` **nécessite un rôle admin**. Sinon, l'erreur SQL sera affichée dans le modal.

## 📝 Logs et débogage

```typescript
// Au chargement
console.warn(`⚠️ ${conflicts.length} conflit(s) détecté(s) entre DCE et procédures`);

// Après résolution
console.log('✅ Table procédures mise à jour avec succès');
console.log('✅ DCE mis à jour avec succès');

// En cas d'erreur
console.error(`❌ Erreur mise à jour procédures: ${error.message}`);
```

## 📚 Fichiers modifiés/créés

| Fichier | Type | Rôle |
|---------|------|------|
| `procedureSyncService.ts` | Service | Logique de détection et résolution |
| `ConflictResolverModal.tsx` | Composant | Interface de résolution |
| `useDCEState.ts` | Hook | Intégration synchronisation |
| `DCEComplet.tsx` | Page | Orchestration et affichage modal |
| `DCEStatusBar.tsx` | Composant | Badge de conflits |

## ✅ Checklist de validation

- [x] Service de détection de conflits créé
- [x] Service de résolution de conflits créé
- [x] Modal de résolution implémenté
- [x] Hook useDCEState enrichi
- [x] Badge de conflits dans status bar
- [x] Auto-ouverture du modal au chargement
- [x] Mapping complet DCE ↔ Procédures
- [x] Mise à jour bidirectionnelle fonctionnelle
- [x] Gestion d'erreurs et logs
- [x] Aucune erreur de compilation

## 🚀 Prochaines améliorations possibles

1. **Historique des synchronisations**
   - Table `procedure_sync_history`
   - Logs des mises à jour automatiques

2. **Mode auto-sync**
   - Option "Toujours priorité procedures" (sans modal)
   - Configuration par utilisateur

3. **Synchronisation en masse**
   - Bouton "Synchroniser tous les DCE"
   - Job cron pour sync périodique

4. **Détection intelligente**
   - Ne pas alerter pour des différences mineures (majuscules, espaces)
   - Seuils de tolérance pour dates/nombres

5. **Audit trail**
   - Qui a modifié quoi et quand
   - Revert possible

---

**Date** : 20 janvier 2026  
**Version** : 1.0  
**Statut** : ✅ Implémenté et fonctionnel
