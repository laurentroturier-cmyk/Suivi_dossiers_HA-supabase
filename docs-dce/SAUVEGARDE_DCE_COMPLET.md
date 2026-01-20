# 💾 Système de sauvegarde - Module DCE Complet

## 🎯 Principe de fonctionnement

Le module DCE Complet utilise un système de **sauvegarde globale** pour tous les documents du DCE.

### Flux de travail

```
┌─────────────────────────────────────────────────────────────┐
│  1. CHARGEMENT / CRÉATION                                   │
│  ─────────────────────────────────────────────────────────  │
│  • Saisie du numéro de procédure (5 chiffres)              │
│  • Chargement du DCE depuis Supabase                        │
│  • Si nouveau : création automatique avec auto-remplissage │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  2. MODIFICATION DES SECTIONS                               │
│  ─────────────────────────────────────────────────────────  │
│  • Cliquer sur une section (RC, AE, CCAP, etc.)            │
│  • Modifier les champs                                      │
│  • Cliquer sur "Enregistrer" dans le formulaire            │
│  • ⚠️ Modifications stockées EN MÉMOIRE uniquement          │
│  • Badge orange "Modifications non sauvegardées" affiché   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│  3. SAUVEGARDE GLOBALE                                      │
│  ─────────────────────────────────────────────────────────  │
│  • Cliquer sur le bouton "Sauvegarder" (header)            │
│  • TOUTES les sections sont envoyées vers Supabase         │
│  • Sauvegarde dans la table `dce`                           │
│  • Badge vert "Tout est sauvegardé" affiché                │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Table Supabase

### Structure de la table `dce`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Identifiant unique |
| `user_id` | UUID | Utilisateur propriétaire |
| `numero_procedure` | TEXT | Numéro de procédure (5 chiffres) |
| `procedure_id` | TEXT | ID de la procédure source |
| `statut` | TEXT | État du DCE (brouillon, publié, etc.) |
| `titre_marche` | TEXT | Titre du marché |
| `version` | INTEGER | Numéro de version |
| `notes` | TEXT | Notes libres |
| **Sections JSONB** | | |
| `reglement_consultation` | JSONB | Données du Règlement de Consultation |
| `acte_engagement` | JSONB | Données de l'Acte d'Engagement |
| `ccap` | JSONB | Données du CCAP |
| `cctp` | JSONB | Données du CCTP |
| `bpu` | JSONB | Données du BPU |
| `dqe` | JSONB | Données du DQE |
| `dpgf` | JSONB | Données du DPGF |
| `documents_annexes` | JSONB | Documents annexes |
| `crt` | JSONB | Cadre de Réponse Technique |
| `qt` | JSONB | Questionnaire Technique |
| **Métadonnées** | | |
| `created_at` | TIMESTAMP | Date de création |
| `updated_at` | TIMESTAMP | Date de dernière modification |

### Contrainte unique

```sql
CONSTRAINT dce_user_id_numero_procedure_key UNIQUE (user_id, numero_procedure)
```

⚠️ **Important** : Un utilisateur ne peut avoir qu'un seul DCE par numéro de procédure.

## 🔧 Implémentation technique

### Hook `useDCEState`

Le hook fournit 3 fonctions principales :

#### 1. `updateSectionLocal(section, data)`

Met à jour une section **en mémoire uniquement** (pas de sauvegarde en base).

```typescript
updateSectionLocal('acteEngagement', {
  enTete: { titreMarche: 'Mon marché' },
  // ... autres données
});
```

#### 2. `saveDCE()`

Sauvegarde **toutes les sections** en une seule fois dans Supabase.

```typescript
const success = await saveDCE();
if (success) {
  console.log('✓ DCE sauvegardé');
}
```

**Ce qui est sauvegardé** :
- Toutes les sections modifiées (RC, AE, CCAP, CCTP, BPU, DQE, DPGF, Documents annexes, CRT, QT)
- Les métadonnées (statut, version, notes, titre du marché)
- La date de mise à jour (`updated_at`)

#### 3. `updateSection(section, data)`

⚠️ **Ancienne méthode** : Sauvegarde immédiate d'une section (non utilisée actuellement).

### Service `dceService`

Le service `dceService.saveDCE()` effectue :

1. **Conversion** du `DCEState` (React) vers un record Supabase
2. **Upsert** dans la table `dce` (création ou mise à jour)
3. **Synchronisation** du RC dans l'ancienne table `reglements_consultation` (rétrocompatibilité)
4. **Retour** du DCE sauvegardé

```typescript
// dceService.ts
async saveDCE(dceState: DCEState): Promise<DCEOperationResult> {
  const record = this.stateToRecord(dceState, userId);
  
  const { data, error } = await supabase
    .from('dce')
    .upsert(record, {
      onConflict: 'numero_procedure,user_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();
    
  // Synchro RC legacy...
  return { success: true, data: this.recordToState(data) };
}
```

## ✅ Avantages du système

1. **Atomicité** : Toutes les sections sont sauvegardées ensemble
2. **Cohérence** : Évite les états intermédiaires incohérents
3. **Performance** : Une seule requête au lieu de 10 (une par section)
4. **UX** : Indicateur visuel clair des modifications non sauvegardées
5. **Réversibilité** : Possibilité d'annuler en rechargeant depuis Supabase

## 🎨 Feedback visuel

### Badge "Modifications non sauvegardées"

```
┌───────────────────────────────────────┐
│ 🟠 Modifications non sauvegardées     │
└───────────────────────────────────────┘
```

- **Couleur** : Orange (fond clair, bordure orange)
- **Icône** : Point orange pulsant
- **Quand** : `isDirty === true`

### Badge "Tout est sauvegardé"

```
┌───────────────────────────────────────┐
│ ✓ Tout est sauvegardé                 │
└───────────────────────────────────────┘
```

- **Couleur** : Vert (fond clair, bordure verte)
- **Icône** : Coche verte
- **Quand** : `isDirty === false && !isNew`

## 🔄 Gestion de l'état `isDirty`

L'état `isDirty` indique si des modifications non sauvegardées existent.

**Détection automatique** :
```typescript
useEffect(() => {
  if (dceState && savedVersion) {
    const currentVersion = JSON.stringify(dceState);
    setIsDirty(currentVersion !== savedVersion);
  }
}, [dceState, savedVersion]);
```

**Quand `isDirty` devient `true`** :
- Appel de `updateSectionLocal()`
- Modification manuelle de `dceState`

**Quand `isDirty` devient `false`** :
- Sauvegarde réussie via `saveDCE()`
- Rechargement via `loadDCE()`

## 🚀 Utilisation

### Exemple complet

```typescript
function MonComposant() {
  const { dceState, isDirty, updateSectionLocal, saveDCE } = useDCEState({
    numeroProcedure: '12345',
    autoLoad: true,
  });

  // 1. Modifier une section (en mémoire)
  const handleModifierRC = () => {
    updateSectionLocal('reglementConsultation', {
      enTete: { titreMarche: 'Nouveau titre' },
    });
    // isDirty passe à true
  };

  // 2. Sauvegarder tout
  const handleSauvegarder = async () => {
    const success = await saveDCE();
    if (success) {
      // isDirty repasse à false
      alert('✓ Sauvegardé');
    }
  };

  return (
    <div>
      {isDirty && <div>⚠️ Modifications non sauvegardées</div>}
      <button onClick={handleModifierRC}>Modifier RC</button>
      <button onClick={handleSauvegarder}>Sauvegarder tout</button>
    </div>
  );
}
```

## 📝 Notes importantes

1. **Auto-remplissage** : Lors de la création d'un nouveau DCE, toutes les sections sont pré-remplies depuis la procédure
2. **Backfill** : Si un DCE existant n'a pas de RC ou QT, il est automatiquement complété depuis les anciennes tables
3. **Synchronisation legacy** : Le RC est dupliqué dans `reglements_consultation` pour compatibilité
4. **Trigger `updated_at`** : La date de modification est mise à jour automatiquement par Supabase

## 🐛 Dépannage

### Problème : "Modifications non sauvegardées" reste affiché

**Cause** : Le state local est différent du state sauvegardé

**Solution** :
1. Vérifier que `saveDCE()` retourne `success: true`
2. Vérifier la console pour les erreurs Supabase
3. Recharger le DCE avec `refreshDCE()`

### Problème : Les modifications disparaissent

**Cause** : Rechargement de la page sans sauvegarder

**Solution** :
1. Toujours sauvegarder avant de quitter
2. Ajouter un warning `beforeunload` si `isDirty === true`

```typescript
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isDirty) {
      e.preventDefault();
      e.returnValue = 'Vous avez des modifications non sauvegardées';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isDirty]);
```

## ✨ Améliorations futures possibles

- [ ] Auto-sauvegarde toutes les 30 secondes si `isDirty === true`
- [ ] Historique des versions (utiliser le champ `version`)
- [ ] Export PDF/DOCX de tout le DCE
- [ ] Workflow de validation avec commentaires
- [ ] Notifications en temps réel entre utilisateurs

---

**Auteur** : GitHub Copilot  
**Date** : 20 janvier 2026  
**Version** : 1.0
