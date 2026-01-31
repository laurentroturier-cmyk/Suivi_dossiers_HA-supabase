# Actions restantes pour le refactoring des lots

## ✅ FAIT (Phase 1 & début Phase 2)

1. ✅ Configuration Globale - Ajout modale + import/export Excel
2. ✅ Passage des lots à ReglementConsultationLegacyWrapper
3. ✅ Ajout prop `lotsFromConfigurationGlobale` à ReglementConsultation
4. ✅ Modification fonction `ConditionsSection` :
   - Suppression des fonctions de gestion manuelle des lots
   - Utilisation de `lotsFromConfigurationGlobale` pour calculer le total et le nombre

## 🔄 EN COURS (Phase 2 - Règlement de Consultation)

### Problème actuel
Le fichier `ReglementConsultation.tsx` (ligne 1255-1520) contient encore :
- Des références à des fonctions supprimées (`openLotsModal`, `handleExportExcel`, `handleImportExcel`)
- Des états supprimés (`newLot`, `fileInputRef`, `importError`, `modalLots`, `isLotsModalOpen`)
- Toute la modale de configuration des lots (lignes 1414-1518)
- Les champs de saisie manuelle des lots

### Actions nécessaires dans `ConditionsSection` (lignes 1312-1520)

#### 1. Supprimer les boutons obsolètes (lignes 1313-1348)
Remplacer par :
```jsx
<div className="border-t border-gray-200 dark:border-gray-700 pt-4">
  {/* En-tête Lots */}
  <div className="flex items-center justify-between mb-3">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Lots</h3>
  </div>
```

#### 2. Ajouter message d'information
```jsx
<div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
  <div className="flex items-start gap-3">
    <AlertCircle className="w-5 h-5 text-blue-700 dark:text-blue-400" />
    <div>
      <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
        Les lots sont gérés dans le module "Configuration Globale"
      </p>
      <p className="text-xs text-blue-700 dark:text-blue-400">
        Pour modifier les lots, utilisez le module <strong>⚙️ Configuration Globale</strong>.
      </p>
    </div>
  </div>
</div>
```

#### 3. Remplacer affichage des lots (lignes 1357-1374)
```jsx
{lotsFromConfigurationGlobale && lotsFromConfigurationGlobale.length > 0 ? (
  <div className="space-y-2">
    {lotsFromConfigurationGlobale.map((lot: any, index: number) => (
      <div key={index} className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="font-medium text-gray-900 dark:text-white">
          Lot n°{lot.numero}: {lot.intitule}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Montant estimé: {parseFloat(lot.montant || '0').toLocaleString('fr-FR')} € HT
        </div>
        {lot.description && (
          <div className="text-xs text-gray-500 mt-1">{lot.description}</div>
        )}
      </div>
    ))}
  </div>
) : (
  <div className="text-center py-8 text-gray-500">
    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
    <p className="text-sm">Aucun lot configuré.</p>
  </div>
)}
```

#### 4. Supprimer les champs de saisie (lignes 1376-1411)
Supprimer complètement le formulaire d'ajout de lot.

#### 5. Supprimer la modale complète (lignes 1414-1518)
Supprimer tout le code de la modale.

### Autres modifications nécessaires

#### Dans ReglementConsultation.tsx (composant principal)
Trouver où `ConditionsSection` est appelé et ajouter le prop :
```jsx
<ConditionsSection
  data={formData.conditions}
  updateField={updateField}
  addArrayItem={addArrayItem}
  removeArrayItem={removeArrayItem}
  lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}  // 🆕 AJOUTER
/>
```

## 📋 PHASE 3 À FAIRE (Modules DCE)

### Supprimer useLotsFromRC

Dans `DCEComplet.tsx` :
```typescript
// ❌ SUPPRIMER
const { lots: lotsFromRC, getLotByNumero } = useLotsFromRC(
  numeroProcedure.length === 5 ? numeroProcedure : null
);
```

### Mettre à jour les modules

Tous les modules qui reçoivent `lotsFromRC` :
```typescript
// Remplacer partout
lotsFromRC={lotsFromRC}
// Par :
lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
```

Fichiers concernés :
- `DCEComplet.tsx` : Cas `'bpu'` et `'bpuTMA'`
- `BPUMultiLots.tsx` : Prop
- `BPUTMAMultiLots.tsx` : Prop
- `GenericMultiLots.tsx` : Prop et logique

### Mettre à jour GenericMultiLots

Remplacer :
```typescript
lotsFromRC?: LotInfo[];
```
Par :
```typescript
lotsFromConfigurationGlobale?: LotConfiguration[];
```

Et dans la logique :
```typescript
numeroLot: (() => {
  // Priorité 1: Config Globale
  const lotFromConfig = lotsFromConfigurationGlobale.find(l => l.numero === currentLot.toString());
  if (lotFromConfig) return lotFromConfig.numero;
  
  // Priorité 2: Lot depuis la Configuration Globale des lots (ancien système)
  const currentConfigLot = configLots.find(l => parseInt(l.numero) === currentLot);
  if (currentConfigLot) return currentConfigLot.numero;
  
  // Fallback
  return currentLot.toString();
})(),
libelleLot: (() => {
  const lotFromConfig = lotsFromConfigurationGlobale.find(l => l.numero === currentLot.toString());
  if (lotFromConfig) return lotFromConfig.intitule;
  
  const currentConfigLot = configLots.find(l => parseInt(l.numero) === currentLot);
  if (currentConfigLot) return currentConfigLot.intitule;
  
  return lotLibelle;
})(),
```

## 📋 PHASE 4 À FAIRE (Nettoyage)

### Fichiers à supprimer
```bash
rm components/dce-complet/hooks/useLotsFromRC.ts
rm components/dce-complet/utils/reglementConsultationService.ts
rm docs/BPU_INTEGRATION_RC.md
```

### Fichiers à mettre à jour
- `CHANGELOG_BPU_v2.1.0.md` : Supprimer section sur useLotsFromRC
- Tous les README mentionnant useLotsFromRC

## 📋 PHASE 5 À FAIRE (Migration données)

### Script SQL de migration
```sql
-- Copier les lots du RC vers Configuration Globale si vide
UPDATE public.dce d
SET configuration_globale = jsonb_set(
  COALESCE(configuration_globale, '{}'::jsonb),
  '{lots}',
  (
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'numero', lot->>'numero',
          'intitule', lot->>'intitule',
          'montant', lot->>'montantMax',  -- Mapper montantMax -> montant
          'description', ''
        )
      ),
      '[]'::jsonb
    )
    FROM public.reglements_consultation rc,
    jsonb_array_elements(rc.data->'conditions'->'lots') AS lot
    WHERE rc.numero_procedure = d.numero_procedure
  )
)
WHERE 
  (configuration_globale->'lots' IS NULL OR 
   jsonb_array_length(configuration_globale->'lots') = 0)
  AND EXISTS (
    SELECT 1 FROM public.reglements_consultation rc
    WHERE rc.numero_procedure = d.numero_procedure
    AND jsonb_array_length(rc.data->'conditions'->'lots') > 0
  );
```

## 🔍 TESTS À FAIRE

1. [ ] Créer nouveau DCE → Config Globale → Ajouter lots
2. [ ] Ouvrir RC → Voir lots en readonly
3. [ ] Modifier lots dans Config Globale → Vérifier dans RC
4. [ ] Ouvrir BPU → Vérifier que lots s'affichent
5. [ ] Export Word RC → Vérifier lots dans document
6. [ ] Import/Export Excel Config Globale → Données OK
7. [ ] Migration données existantes → Vérifier intégrité

---

**Prochaine étape immédiate** : 
Terminer Phase 2 en modifiant manuellement `ReglementConsultation.tsx` lignes 1312-1520 selon les instructions ci-dessus.

**Fichier concerné** : 
`c:\Users\laure\Documents\GitHub\Suivi_dossiers_HA-supabase\components\redaction\components\ReglementConsultation.tsx`

**Statut** : 🔄 40% terminé (Phases 1 & 2 partielles)
