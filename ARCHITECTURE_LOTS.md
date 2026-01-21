# Architecture : Gestion des N lots par procédure

**Date :** 20 janvier 2026  
**Contexte :** Migration de la structure DCE pour supporter plusieurs lots par procédure  
**Statut :** 📋 Analyse et recommandation - Implémentation à venir

---

## 🎯 Problématique

### Situation actuelle
Une procédure peut avoir **N lots** (exemple : procédure 25091 avec 39 lots).

Chaque lot nécessite ses propres documents :
- ✅ **Règlement de Consultation (RC)** : 1 seul par procédure (global)
- ❌ **Acte d'Engagement (AE)** : 1 par lot → 39 documents
- ❌ **Questionnaire Technique (QT)** : 1 par lot → 39 documents
- ❌ **CCTP** : 1 par lot → 39 documents
- ❌ **CCAP** : 1 par lot → 39 documents
- ❌ **BPU** : 1 par lot → 39 documents
- ❌ **DQE** : 1 par lot → 39 documents
- ❌ **DPGF** : 1 par lot → 39 documents

### Contrainte actuelle
- **Table `dce`** : 1 ligne par procédure → **impossible de stocker N lots**
- **Table `questionnaires_techniques`** : déjà conçue pour N lots ✓

**Besoin :** Adapter l'architecture pour supporter N enregistrements par module et par procédure.

---

## 📊 Solutions analysées

### Option 1 : Modèle "1 table par type de document" ⭐ RECOMMANDÉ

#### Structure proposée
```
procedures (source of truth - existante)
  ↓
dce (RC uniquement - 1 par procédure)
  └─ reglement_consultation (JSONB)

actes_engagement (nouvelle - N par procédure)
  ├─ id (PK)
  ├─ procedure_id (FK → procedures)
  ├─ numero_lot
  ├─ libelle_lot
  ├─ data (JSONB)
  └─ created_at, updated_at

questionnaires_techniques (existante ✓ - N par procédure)
  ├─ procedure_id
  ├─ numero_lot
  └─ data (JSONB)

cctps (nouvelle - N par procédure)
  ├─ id (PK)
  ├─ procedure_id
  ├─ numero_lot
  ├─ libelle_lot
  ├─ data (JSONB)
  └─ created_at, updated_at

ccaps (nouvelle - N par procédure)
bpus (nouvelle - N par procédure)
dqes (nouvelle - N par procédure)
dpgfs (nouvelle - N par procédure)
```

#### ✅ Avantages
- **Cohérence** : suit le modèle `questionnaires_techniques` existant
- **Simplicité** : requêtes SQL directes (`SELECT * FROM actes_engagement WHERE procedure_id = '25091'`)
- **Performance** : index sur `(procedure_id, numero_lot)`
- **Indépendance** : chaque module géré séparément
- **Migration progressive** : table par table, sans tout casser
- **RLS facile** : politiques par table
- **Scalabilité** : support de milliers de lots sans problème

#### ❌ Inconvénients
- Multiplication des tables (6 nouvelles tables)
- Répétition de la structure (procedure_id, numero_lot dans chaque table)

---

### Option 2 : Modèle avec table pivot "lots"

#### Structure proposée
```
procedures (existante)
  ↓
lots (nouvelle - normalisation)
  ├─ id (PK)
  ├─ procedure_id (FK → procedures)
  ├─ numero_lot
  ├─ libelle_lot
  ├─ montant_estime
  └─ created_at, updated_at
  ↓
actes_engagement
  ├─ id
  ├─ lot_id (FK → lots)
  └─ data (JSONB)

questionnaires_techniques
  ├─ id
  ├─ lot_id (FK → lots)
  └─ data (JSONB)

cctps, ccaps, bpus, dqes, dpgfs...
  ├─ id
  ├─ lot_id (FK → lots)
  └─ data (JSONB)
```

#### ✅ Avantages
- **Normalisation** : métadonnées du lot centralisées (DRY)
- **Cohérence** : gestion des lots indépendante des documents
- **Requêtes riches** : JOIN faciles pour analyses croisées

#### ❌ Inconvénients
- **Complexité** : JOIN systématique pour chaque requête
- **Migration lourde** : refonte de `questionnaires_techniques` existante
- **Overhead** : performance impactée pour les requêtes simples
- **Risque** : migration cassante

---

### Option 3 : Modèle hybride "dce étendu" (À ÉVITER)

#### Structure (ne pas implémenter)
```
dce
  ├─ procedure_id
  ├─ reglement_consultation (JSONB)
  ├─ actes_engagement (JSONB[]) ← array de 39 objets
  ├─ questionnaires_techniques (JSONB[])
  ├─ cctps (JSONB[])
  └─ ...
```

#### ❌ Pourquoi éviter
- **Mauvaise performance** : parsing d'array JSONB coûteux
- **Impossible à indexer** : pas d'index sur éléments d'array JSONB
- **Limite PostgreSQL** : 1 GB max par row
- **Requêtes complexes** : filtrer par lot = parcourir tout l'array
- **Mise à jour inefficace** : modifier 1 lot = réécrire tout l'array
- **Anti-pattern** : contraire aux bonnes pratiques PostgreSQL

---

## 🏆 Recommandation : Option 1

### Pourquoi Option 1 ?
| Critère | Option 1 | Option 2 | Option 3 |
|---------|----------|----------|----------|
| Performance | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Simplicité | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐ |
| Migration | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐ |
| Cohérence | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐ |
| Scalabilité | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |

**Décision :** Créer 6 nouvelles tables avec le pattern `questionnaires_techniques`.

---

## 🔧 Plan d'implémentation

### Phase 1 : Création des tables Supabase

#### Exemple SQL - Table `actes_engagement`
```sql
-- Création de la table
CREATE TABLE public.actes_engagement (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  procedure_id TEXT REFERENCES procedures("Numéro de procédure (Afpa)") ON DELETE CASCADE,
  numero_lot INTEGER NOT NULL,
  libelle_lot TEXT,
  data JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte : 1 seul enregistrement par (procédure, lot)
  CONSTRAINT actes_engagement_unique_lot UNIQUE (procedure_id, numero_lot)
);

-- Index pour performance
CREATE INDEX idx_actes_engagement_procedure ON actes_engagement(procedure_id);
CREATE INDEX idx_actes_engagement_lot ON actes_engagement(numero_lot);

-- Row Level Security
ALTER TABLE actes_engagement ENABLE ROW LEVEL SECURITY;

-- Politique : utilisateurs authentifiés peuvent lire
CREATE POLICY "Authenticated users can view"
  ON actes_engagement FOR SELECT
  USING (auth.role() = 'authenticated');

-- Politique : utilisateurs authentifiés peuvent modifier
CREATE POLICY "Authenticated users can modify"
  ON actes_engagement FOR ALL
  USING (auth.role() = 'authenticated');

-- Trigger pour updated_at
CREATE TRIGGER update_actes_engagement_updated_at
  BEFORE UPDATE ON actes_engagement
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

#### Tables à créer (même pattern)
1. ✅ `actes_engagement`
2. ✅ `cctps`
3. ✅ `ccaps`
4. ✅ `bpus`
5. ✅ `dqes`
6. ✅ `dpgfs`

---

### Phase 2 : Migration des données existantes

#### Étape 1 : Exporter les données de `dce`
```sql
-- Si des AE existent dans dce.acte_engagement
INSERT INTO actes_engagement (procedure_id, numero_lot, libelle_lot, data)
SELECT 
  procedure_id,
  1 as numero_lot, -- lot unique par défaut pour données existantes
  'Lot unique' as libelle_lot,
  acte_engagement as data
FROM dce
WHERE acte_engagement IS NOT NULL AND acte_engagement != '{}'::jsonb;

-- Répéter pour cctp, ccap, bpu, dqe, dpgf...
```

#### Étape 2 : Nettoyer la table `dce`
```sql
-- Garder uniquement le RC dans dce
UPDATE dce SET
  acte_engagement = NULL,
  questionnaire_technique = NULL,
  cctp = NULL,
  ccap = NULL,
  bpu = NULL,
  dqe = NULL,
  dpgf = NULL;

-- Optionnel : supprimer les colonnes (après validation)
ALTER TABLE dce 
  DROP COLUMN acte_engagement,
  DROP COLUMN questionnaire_technique,
  DROP COLUMN cctp,
  DROP COLUMN ccap,
  DROP COLUMN bpu,
  DROP COLUMN dqe,
  DROP COLUMN dpgf;
```

---

### Phase 3 : Service de gestion des lots (TypeScript)

#### Nouveau service `lotService.ts`
```typescript
// services/lotService.ts
import { supabase } from '../lib/supabase';

export type ModuleType = 'ae' | 'qt' | 'cctp' | 'ccap' | 'bpu' | 'dqe' | 'dpgf';

const TABLE_MAPPING: Record<ModuleType, string> = {
  ae: 'actes_engagement',
  qt: 'questionnaires_techniques',
  cctp: 'cctps',
  ccap: 'ccaps',
  bpu: 'bpus',
  dqe: 'dqes',
  dpgf: 'dpgfs',
};

export class LotService {
  /**
   * Récupère tous les lots d'une procédure pour un module donné
   */
  async getLotsForProcedure(procedureId: string, moduleType: ModuleType) {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('procedure_id', procedureId)
      .order('numero_lot', { ascending: true });
    
    if (error) throw error;
    return data || [];
  }

  /**
   * Récupère un lot spécifique
   */
  async getLot(procedureId: string, numeroLot: number, moduleType: ModuleType) {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('procedure_id', procedureId)
      .eq('numero_lot', numeroLot)
      .single();
    
    if (error) throw error;
    return data;
  }

  /**
   * Crée ou met à jour un lot
   */
  async saveLot(
    procedureId: string,
    numeroLot: number,
    data: any,
    moduleType: ModuleType,
    libelleLot?: string
  ) {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { data: result, error } = await supabase
      .from(tableName)
      .upsert({
        procedure_id: procedureId,
        numero_lot: numeroLot,
        libelle_lot: libelleLot,
        data,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'procedure_id,numero_lot'
      })
      .select()
      .single();
    
    if (error) throw error;
    return result;
  }

  /**
   * Supprime un lot
   */
  async deleteLot(procedureId: string, numeroLot: number, moduleType: ModuleType) {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('procedure_id', procedureId)
      .eq('numero_lot', numeroLot);
    
    if (error) throw error;
  }

  /**
   * Duplique un lot existant vers un nouveau numéro
   */
  async duplicateLot(
    procedureId: string,
    fromLot: number,
    toLot: number,
    moduleType: ModuleType
  ) {
    const sourceLot = await this.getLot(procedureId, fromLot, moduleType);
    
    await this.saveLot(
      procedureId,
      toLot,
      sourceLot.data,
      moduleType,
      `${sourceLot.libelle_lot || 'Lot'} (copie)`
    );
  }

  /**
   * Compte le nombre de lots pour une procédure
   */
  async countLots(procedureId: string, moduleType: ModuleType): Promise<number> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('procedure_id', procedureId);
    
    if (error) throw error;
    return count || 0;
  }
}

export const lotService = new LotService();
```

---

### Phase 4 : UI - Composant de sélection de lot

#### Composant `LotSelector.tsx`
```tsx
// components/dce-complet/shared/LotSelector.tsx
import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2 } from 'lucide-react';

interface LotSelectorProps {
  procedureId: string;
  totalLots: number;
  currentLot: number;
  onLotChange: (lotNumber: number) => void;
  onAddLot?: () => void;
  onDuplicateLot?: () => void;
  onDeleteLot?: () => void;
}

export const LotSelector: React.FC<LotSelectorProps> = ({
  procedureId,
  totalLots,
  currentLot,
  onLotChange,
  onAddLot,
  onDuplicateLot,
  onDeleteLot,
}) => {
  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Navigation lots */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onLotChange(currentLot - 1)}
            disabled={currentLot <= 1}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Lot</span>
            <select
              value={currentLot}
              onChange={(e) => onLotChange(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Array.from({ length: totalLots }, (_, i) => i + 1).map((lot) => (
                <option key={lot} value={lot}>
                  {lot}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-600">/ {totalLots}</span>
          </div>

          <button
            onClick={() => onLotChange(currentLot + 1)}
            disabled={currentLot >= totalLots}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onAddLot && (
            <button
              onClick={onAddLot}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <Plus className="w-4 h-4" />
              Nouveau lot
            </button>
          )}
          
          {onDuplicateLot && (
            <button
              onClick={onDuplicateLot}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Copy className="w-4 h-4" />
              Dupliquer
            </button>
          )}

          {onDeleteLot && totalLots > 1 && (
            <button
              onClick={onDeleteLot}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

### Phase 5 : Intégration dans les modules DCE

#### Exemple : Module Acte d'Engagement
```tsx
// components/dce-complet/forms/ActeEngagementForm.tsx
import React, { useState, useEffect } from 'react';
import { LotSelector } from '../shared/LotSelector';
import { lotService } from '../../../services/lotService';

export const ActeEngagementForm = ({ procedureId }: { procedureId: string }) => {
  const [currentLot, setCurrentLot] = useState(1);
  const [totalLots, setTotalLots] = useState(1);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // Charger les données du lot
  useEffect(() => {
    loadLotData();
  }, [currentLot]);

  const loadLotData = async () => {
    setLoading(true);
    try {
      const data = await lotService.getLot(procedureId, currentLot, 'ae');
      setFormData(data?.data || {});
      
      const count = await lotService.countLots(procedureId, 'ae');
      setTotalLots(Math.max(count, 1));
    } catch (error) {
      console.error('Erreur chargement lot:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      await lotService.saveLot(procedureId, currentLot, formData, 'ae');
      // Notification succès
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    }
  };

  const handleAddLot = async () => {
    const newLotNumber = totalLots + 1;
    await lotService.saveLot(procedureId, newLotNumber, {}, 'ae', `Lot ${newLotNumber}`);
    setTotalLots(newLotNumber);
    setCurrentLot(newLotNumber);
  };

  const handleDuplicateLot = async () => {
    const newLotNumber = totalLots + 1;
    await lotService.duplicateLot(procedureId, currentLot, newLotNumber, 'ae');
    setTotalLots(newLotNumber);
    setCurrentLot(newLotNumber);
  };

  const handleDeleteLot = async () => {
    if (totalLots <= 1) return;
    if (!confirm(`Supprimer le lot ${currentLot} ?`)) return;
    
    await lotService.deleteLot(procedureId, currentLot, 'ae');
    setCurrentLot(Math.max(1, currentLot - 1));
    await loadLotData();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Sélecteur de lot */}
      <LotSelector
        procedureId={procedureId}
        totalLots={totalLots}
        currentLot={currentLot}
        onLotChange={setCurrentLot}
        onAddLot={handleAddLot}
        onDuplicateLot={handleDuplicateLot}
        onDeleteLot={handleDeleteLot}
      />

      {/* Formulaire */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div>Chargement...</div>
        ) : (
          <>
            <h2 className="text-xl font-bold mb-4">
              Acte d'Engagement - Lot {currentLot}
            </h2>
            
            {/* Champs du formulaire */}
            {/* ... */}
          </>
        )}
      </div>

      {/* Bouton de sauvegarde */}
      <div className="border-t border-gray-200 px-6 py-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Sauvegarder le lot {currentLot}
        </button>
      </div>
    </div>
  );
};
```

---

## 🚀 Migration - Stratégie recommandée

### Approche progressive (RECOMMANDÉ)

#### Phase 1 : QT (déjà fait ✅)
- Table `questionnaires_techniques` déjà en place
- Pas de migration nécessaire

#### Phase 2 : Acte d'Engagement (prioritaire)
1. Créer table `actes_engagement`
2. Migrer données existantes de `dce`
3. Tester UI + service
4. Valider avec utilisateurs

#### Phase 3 : CCTP
1. Créer table `cctps`
2. Migrer données
3. Adapter UI

#### Phase 4 : CCAP, BPU, DQE, DPGF
- Répéter le processus pour chaque module

### Approche big bang (risqué)
- Créer toutes les tables d'un coup
- Migrer toutes les données
- ⚠️ Risque : si erreur, tout est bloqué

**Recommandation :** Migration progressive (1 module à la fois).

---

## ✅ Décisions à prendre

### Questions ouvertes

1. **Ordre de priorité des modules ?**
   - Proposition : AE → CCTP → CCAP → BPU → DQE → DPGF
   - Raison : AE souvent le 1er document rédigé

2. **Migration immédiate ou progressive ?**
   - ✅ Progressive = moins de risque
   - ❌ Immédiate = plus rapide mais risqué

3. **Garder compatibilité avec ancienne structure `dce` ?**
   - Option A : Supprimer colonnes après migration
   - Option B : Garder en lecture seule temporairement

4. **UI : affichage simultané multi-lots ou lot par lot ?**
   - Option A : 1 lot à la fois (+ simple, recommandé)
   - Option B : Tableau avec tous les lots (+ complexe)

5. **Synchronisation avec `procedures` : lot par lot ou global ?**
   - À définir selon besoins métier

---

## 📋 Checklist de validation

### Avant implémentation
- [ ] Valider l'Option 1 avec équipe
- [ ] Définir ordre de priorité des modules
- [ ] Choisir stratégie de migration (progressive recommandée)
- [ ] Planifier fenêtre de migration (backup DB avant)

### Pendant implémentation (par module)
- [ ] Créer table Supabase avec index
- [ ] Activer RLS + politiques
- [ ] Créer trigger `updated_at`
- [ ] Développer `lotService.ts`
- [ ] Développer composant `LotSelector`
- [ ] Adapter formulaire du module
- [ ] Migrer données existantes
- [ ] Tests unitaires
- [ ] Tests d'intégration

### Après implémentation
- [ ] Tests utilisateurs
- [ ] Vérifier performance (39 lots)
- [ ] Valider sauvegarde/chargement
- [ ] Vérifier navigation entre lots
- [ ] Documenter dans README

---

## 🔗 Liens utiles

- **Table existante :** `questionnaires_techniques` (modèle de référence)
- **Documentation Supabase RLS :** https://supabase.com/docs/guides/auth/row-level-security
- **Pattern JSONB PostgreSQL :** https://www.postgresql.org/docs/current/datatype-json.html

---

## 📝 Notes additionnelles

### Estimation de charge
- Création 1 table : ~30 min (SQL + RLS + tests)
- Service `lotService.ts` : ~2h (développement + tests)
- Composant `LotSelector` : ~2h
- Adaptation 1 formulaire : ~2h
- Migration données 1 module : ~1h
- Tests + validation : ~2h

**Total par module : ~9h**  
**Total 6 modules : ~54h (1-2 semaines)**

### Risques identifiés
- ⚠️ Perte de données si migration mal scriptée → **Solution :** Backup avant migration
- ⚠️ Performance avec 39 lots → **Solution :** Index optimisés
- ⚠️ Confusion utilisateurs avec nouvelle UI → **Solution :** Documentation + formation

---

**Prochaine étape :** Valider cette architecture et commencer Phase 1 (création table `actes_engagement`).
