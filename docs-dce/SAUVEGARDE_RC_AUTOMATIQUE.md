# 💾 Sauvegarde automatique du Règlement de Consultation

## 🎯 Problème résolu

Le Règlement de Consultation (RC) ne se sauvegardait nulle part. Les saisies étaient perdues lors du changement d'onglet ou de la fermeture du module DCE.

## ✅ Solutions implémentées

### 1. Synchronisation en temps réel avec le DCE

**Modifications** :
- ✅ Ajout de la prop `onDataChange` au composant `ReglementConsultation`
- ✅ Notification automatique du parent à chaque modification de données (via `useEffect`)
- ✅ Connexion au système de sauvegarde DCE via le wrapper

**Fichiers modifiés** :
- `components/redaction/ReglementConsultation.tsx`
- `components/dce-complet/modules/ReglementConsultationLegacyWrapper.tsx`
- `components/dce-complet/DCEComplet.tsx`

### 2. Sauvegarde automatique au changement d'onglet

**Comportement** :
- Lorsque l'utilisateur change d'onglet avec des modifications non sauvegardées
- Une boîte de dialogue demande : "Voulez-vous sauvegarder ?"
- Si oui → Sauvegarde automatique en base de données
- Si non → Les modifications restent en mémoire (pas perdues, mais pas en base)

**Fonction** : `handleSectionChange()`

## 🔄 Flux de données

```
┌─────────────────────────────────────────────────────────┐
│  UTILISATEUR édite le RC                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  ReglementConsultation.tsx                              │
│  • useState(formData)                                   │
│  • updateField(), addArrayItem(), etc.                  │
│  • useEffect → onDataChange(formData) ← NOUVEAU         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  ReglementConsultationLegacyWrapper.tsx                 │
│  • Reçoit onDataChange via prop                         │
│  • Transmet au DCEComplet via onSave                    │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  DCEComplet.tsx                                         │
│  • handleSectionSave('reglementConsultation', data)     │
│  • updateSectionLocal('reglementConsultation', data)    │
│  • isDirty = true (badge orange)                        │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓ (au changement d'onglet)
┌─────────────────────────────────────────────────────────┐
│  handleSectionChange(newSection)                        │
│  • Détecte isDirty = true                               │
│  • Demande confirmation                                 │
│  • saveDCE() → Supabase                                 │
└────────────────────┬────────────────────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────────────────────┐
│  TABLE: dce                                             │
│  • reglement_consultation (JSONB)                       │
│  • Données sauvegardées ✅                              │
└─────────────────────────────────────────────────────────┘
```

## 📝 Détails techniques

### Ajout de `onDataChange` prop

```typescript
interface ReglementConsultationProps {
  initialNumeroProcedure?: string;
  onDataChange?: (data: RapportCommissionData) => void; // ← NOUVEAU
}
```

### Notification automatique

```typescript
// Dans ReglementConsultation.tsx
useEffect(() => {
  if (onDataChange) {
    onDataChange(formData);
  }
}, [formData, onDataChange]);
```

**Déclencheurs** :
- `updateField()` → Change formData → useEffect → onDataChange()
- `addArrayItem()` → Change formData → useEffect → onDataChange()
- `removeArrayItem()` → Change formData → useEffect → onDataChange()
- Auto-fill depuis procédure → Change formData → useEffect → onDataChange()

### Wrapper connecté

```typescript
// ReglementConsultationLegacyWrapper.tsx
export function ReglementConsultationLegacyWrapper({ numeroProcedure, onSave }) {
  return (
    <ReglementConsultation 
      initialNumeroProcedure={numeroProcedure}
      onDataChange={onSave} // ← Connexion au DCE
    />
  );
}
```

### Sauvegarde au changement d'onglet

```typescript
// DCEComplet.tsx
const handleSectionChange = async (newSection: DCESectionType) => {
  // Si modifications non sauvegardées
  if (isDirty && activeSection && activeSection !== newSection) {
    const shouldSave = window.confirm(
      'Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder maintenant ?'
    );
    
    if (shouldSave) {
      await saveDCE(); // ← Sauvegarde en base
    }
  }
  
  setActiveSection(newSection);
};
```

## 🧪 Test

### Scénario 1 : Sauvegarde automatique

1. Ouvrir le module **DCE Complet**
2. Saisir un numéro de procédure : `26008`
3. Ouvrir **Règlement de Consultation**
4. Modifier le titre du marché
5. **Observer** : Badge orange "🟠 Modifications non sauvegardées"
6. Cliquer sur un autre onglet (ex: **Acte d'Engagement**)
7. **Boîte de dialogue** : "Vous avez des modifications non sauvegardées..."
8. Cliquer **OK**
9. **Résultat attendu** : 
   - ✅ Sauvegarde effectuée
   - ✅ Badge vert "✓ Tout est sauvegardé"
   - ✅ Changement d'onglet effectué

### Scénario 2 : Vérification en base

```sql
SELECT 
  numero_procedure,
  reglement_consultation->>'enTete' as rc_entete,
  updated_at
FROM dce
WHERE numero_procedure = '26008';
```

**Résultat attendu** :
```json
{
  "numeroProcedure": "26008",
  "titreMarche": "Titre modifié",
  ...
}
```

### Scénario 3 : Sauvegarde manuelle

1. Modifier le RC
2. Badge orange visible
3. Cliquer sur **💾 Sauvegarder** (bouton global)
4. **Résultat** : Sauvegarde immédiate sans changer d'onglet

## 🎨 Indicateurs visuels

### Badge de statut

| État | Badge | Description |
|------|-------|-------------|
| **Clean** | ✅ `✓ Tout est sauvegardé` (vert) | Aucune modification en attente |
| **Dirty** | ⚠️ `🟠 Modifications non sauvegardées` (orange) | Modifications en mémoire, pas encore en base |

### Workflow utilisateur

```
RC modifié → Badge orange → Changement d'onglet → Confirmation → Sauvegarde → Badge vert
```

## ⚙️ Configuration

### Désactiver la confirmation (optionnel)

Pour sauvegarder automatiquement **sans** confirmation :

```typescript
// Dans handleSectionChange()
if (isDirty && activeSection && activeSection !== newSection) {
  await saveDCE(); // Pas de window.confirm()
}
```

### Sauvegarde automatique périodique (optionnel)

```typescript
// Dans DCEComplet.tsx
useEffect(() => {
  if (!isDirty) return;
  
  const timer = setTimeout(() => {
    saveDCE();
    console.log('🕒 Sauvegarde automatique après 30 secondes');
  }, 30000); // 30 secondes
  
  return () => clearTimeout(timer);
}, [isDirty, saveDCE]);
```

## 📊 Comparaison avant/après

| Aspect | Avant | Après |
|--------|-------|-------|
| **Sauvegarde RC** | ❌ Aucune (données perdues) | ✅ Automatique + Manuelle |
| **Changement d'onglet** | ❌ Données perdues | ✅ Confirmation de sauvegarde |
| **Indicateur visuel** | ❌ Aucun | ✅ Badge orange/vert |
| **Bouton Sauvegarder** | ✅ Sauvegarde globale | ✅ Inclut maintenant le RC |
| **Table utilisée** | ❌ `reglements_consultation` (obsolète) | ✅ `dce.reglement_consultation` |

## 🔗 Documents liés

- [DECONNEXION_REGLEMENTS_CONSULTATION.md](./DECONNEXION_REGLEMENTS_CONSULTATION.md) - Architecture de sauvegarde
- [REPARATION_SAUVEGARDE_DCE.md](./REPARATION_SAUVEGARDE_DCE.md) - Système de sauvegarde global
- [TEST_SAUVEGARDE_DCE.md](./TEST_SAUVEGARDE_DCE.md) - Tests du système de sauvegarde

## ✨ Résumé

### Avant
```
RC modifié → Aucune sauvegarde → Données perdues ❌
```

### Après
```
RC modifié → onDataChange → updateSectionLocal → Badge orange
          ↓
Changement d'onglet → Confirmation → saveDCE() → Supabase ✅
          OU
Bouton "Sauvegarder" → saveDCE() → Supabase ✅
```

---

**Date** : 20 janvier 2026  
**Fichiers modifiés** : 3  
**Fonctions ajoutées** : 2 (onDataChange, handleSectionChange)  
**Problème résolu** : Perte de données du RC ✅
