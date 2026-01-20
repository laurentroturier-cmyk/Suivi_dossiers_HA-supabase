# Module DCE Complet - Documentation

## 📋 Vue d'ensemble

Le module **DCE Complet** est une interface centralisée pour la rédaction et la gestion de tous les documents constituant un Dossier de Consultation des Entreprises (DCE).

### ✨ Fonctionnalités principales

1. **Interface unifiée** : Un seul point d'entrée pour tous les documents du DCE
2. **Auto-remplissage intelligent** : Récupération automatique des données depuis la procédure
3. **Sauvegarde centralisée** : Une seule table Supabase pour toutes les sections
4. **Gestion des versions** : Historique automatique des modifications
5. **Progression visuelle** : Barre de statut montrant l'avancement
6. **Multi-utilisateur** : Chaque utilisateur a son propre DCE par procédure

## 🏗️ Architecture

```
components/dce-complet/
├── types/               # Définitions TypeScript
│   └── index.ts        # Types DCEState, sections, résultats
├── services/           # Logique métier
│   ├── dceService.ts   # CRUD operations Supabase
│   └── dceMapping.ts   # Mapping procédure → DCE
├── hooks/              # React hooks
│   ├── useDCEState.ts          # État centralisé du DCE
│   └── useProcedureLoader.ts   # Chargement des procédures
├── shared/             # Composants réutilisables
│   ├── ProcedureSelector.tsx   # Sélecteur avec autocomplete
│   ├── ProcedureHeader.tsx     # En-tête de procédure
│   └── DCEStatusBar.tsx        # Barre de progression
├── modules/            # Futurs formulaires par section
│   ├── ReglementConsultation.tsx
│   ├── ActeEngagement.tsx
│   └── ... (à implémenter)
├── DCEComplet.tsx      # Composant principal
└── index.ts            # Exports publics
```

## 📊 Base de données

### Table `dce`

```sql
CREATE TABLE dce (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  numero_procedure TEXT NOT NULL,
  procedure_id INTEGER REFERENCES procédures(id),
  statut TEXT DEFAULT 'brouillon',
  titre_marche TEXT,
  version INTEGER DEFAULT 1,
  notes TEXT,
  reglement_consultation JSONB,
  acte_engagement JSONB,
  ccap JSONB,
  cctp JSONB,
  bpu JSONB,
  dqe JSONB,
  dpgf JSONB,
  documents_annexes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(numero_procedure, user_id)
);
```

### Table `dce_versions`

```sql
CREATE TABLE dce_versions (
  id SERIAL PRIMARY KEY,
  dce_id INTEGER REFERENCES dce(id),
  version INTEGER,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Installation

### 1. Créer les tables Supabase

Exécutez le script SQL :

```bash
# Dans l'éditeur SQL de Supabase
\i sql/dce-complet-schema.sql
```

### 2. Vérifier les imports

Les imports sont déjà configurés dans `App.tsx` :

```tsx
import { DCEComplet } from './components/dce-complet/DCEComplet';

// ...

{activeTab === 'dce-complet' && (
  <DCEComplet onClose={() => handleGoBack()} />
)}
```

### 3. Tuile dans LandingPage

La tuile "DCE Complet ✨" est déjà ajoutée dans la section "Rédaction".

## 🚀 Utilisation

### Workflow utilisateur

1. **Accéder au module** : Cliquer sur "DCE Complet ✨" dans la section Rédaction
2. **Sélectionner une procédure** : Saisir un numéro court (5 chiffres)
3. **Auto-création** : Le DCE est créé automatiquement avec pré-remplissage
4. **Navigation** : Sélectionner une section dans le menu latéral
5. **Édition** : Modifier les champs (sauvegarde automatique)
6. **Suivi** : Barre de progression montrant l'avancement
7. **Publication** : Changer le statut pour publier le DCE

### Exemple de code

#### Utiliser le hook useDCEState

```tsx
import { useDCEState } from './components/dce-complet';

function MyComponent() {
  const { 
    dceState, 
    isLoading, 
    updateSection, 
    saveDCE 
  } = useDCEState({
    numeroProcedure: '20241',
    autoLoad: true
  });

  const handleUpdate = async () => {
    await updateSection('reglementConsultation', {
      acheteur: 'Afpa',
      objetMarche: 'Fourniture de matériel informatique'
    });
  };

  return <div>{dceState?.titreMarche}</div>;
}
```

#### Charger une procédure

```tsx
import { useProcedure } from './components/dce-complet';

function ProcedureInfo({ numero }: { numero: string }) {
  const { procedure, isLoading, error, isValid } = useProcedure(numero);

  if (isLoading) return <div>Chargement...</div>;
  if (!isValid) return <div>Procédure introuvable</div>;

  return <div>{procedure['Intitulé']}</div>;
}
```

## 📝 Structure des données

### DCEState (Type principal)

```typescript
interface DCEState {
  id?: number;
  numeroProcedure: string;
  procedureId?: number;
  userId: string;
  statut: 'brouillon' | 'en_cours' | 'en_attente_validation' | 'publié' | 'archivé';
  titreMarche: string;
  version: number;
  notes: string;
  
  // 8 sections du DCE
  reglementConsultation: ReglementConsultationData;
  acteEngagement: ActeEngagementData;
  ccap: CCAPData;
  cctp: CCTPData;
  bpu: BPUData;
  dqe: DQEData;
  dpgf: DPGFData;
  documentsAnnexes: DocumentsAnnexesData;
  
  createdAt?: string;
  updatedAt?: string;
}
```

### Exemple de section (ReglementConsultation)

```typescript
interface ReglementConsultationData {
  // Identification acheteur
  acheteur: string;
  adresseAcheteur: string;
  telephoneAcheteur: string;
  emailAcheteur: string;
  
  // Objet du marché
  objetMarche: string;
  naturePrestations: string;
  lieuExecution: string;
  
  // Type de procédure
  typeProcedure: string;
  accordCadre: boolean;
  dureeAccord: string;
  
  // ... autres champs
}
```

## 🔐 Sécurité (RLS)

Les politiques Row Level Security garantissent :

- ✅ Chaque utilisateur ne voit que ses propres DCE
- ✅ Les admins peuvent voir tous les DCE
- ✅ Isolation stricte entre utilisateurs
- ✅ Pas de fuite de données

### Politiques appliquées

```sql
-- Les users voient leurs propres DCE
CREATE POLICY "users_own_dce_select" ON dce
  FOR SELECT USING (auth.uid() = user_id);

-- Les admins voient tout
CREATE POLICY "admins_all_dce_select" ON dce
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

## 🎯 Roadmap

### ✅ Phase 1 : Infrastructure (TERMINÉ)
- [x] Tables Supabase
- [x] Types TypeScript
- [x] Services CRUD
- [x] Hooks React
- [x] Composants de base
- [x] Intégration App.tsx

### 🚧 Phase 2 : Formulaires de section (À FAIRE)
- [ ] Formulaire Règlement de Consultation
- [ ] Formulaire Acte d'Engagement
- [ ] Formulaire CCAP
- [ ] Formulaire CCTP
- [ ] Formulaires BPU/DQE/DPGF
- [ ] Gestion des documents annexes

### 🔮 Phase 3 : Fonctionnalités avancées
- [ ] Exports Word/PDF par section
- [ ] Exports complets (DCE entier)
- [ ] Modèles personnalisables
- [ ] Validation de complétude
- [ ] Notifications de changement
- [ ] Collaboration multi-utilisateur

## 🐛 Dépannage

### Le DCE ne se crée pas

**Cause** : Procédure introuvable
**Solution** : Vérifier que le numéro est correct (5 chiffres) et qu'une procédure existe dans `procédures` avec ce préfixe.

### Erreur RLS "Permission denied"

**Cause** : Politiques RLS bloquent l'accès
**Solution** : Vérifier que l'utilisateur est authentifié et que les politiques sont actives.

```sql
-- Vérifier les politiques
SELECT * FROM pg_policies WHERE tablename = 'dce';
```

### Les données ne se sauvegardent pas

**Cause** : Erreur réseau ou Supabase
**Solution** : Ouvrir la console → Network → Vérifier les requêtes Supabase

## 📚 Références

- [AUTH_SETUP.md](../../AUTH_SETUP.md) - Configuration authentification
- [ANALYSE_DCE_ARCHITECTURE.md](../../docs-dce/ANALYSE_DCE_ARCHITECTURE.md) - Analyse complète
- [PROPOSITIONS_DCE_IMPLEMENTATION.md](../../docs-dce/PROPOSITIONS_DCE_IMPLEMENTATION.md) - Implémentation détaillée

## 🤝 Contribution

Pour ajouter une nouvelle section :

1. Créer le type dans `types/index.ts`
2. Ajouter la colonne JSONB dans `dce` (migration SQL)
3. Mettre à jour `mapProcedureToDCE()` pour auto-remplissage
4. Créer le formulaire dans `modules/`
5. Ajouter au menu dans `DCEComplet.tsx`

## 📄 Licence

Propriété de l'Afpa - Usage interne uniquement
