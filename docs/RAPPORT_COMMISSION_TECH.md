# Module Rapport Commission - Documentation Technique

## Architecture

### Vue d'ensemble

Le module Rapport Commission suit une architecture en couches :

```
┌─────────────────────────────────────────┐
│         RapportCommission.tsx           │  ← Composant principal (UI)
│  (Navigation, État, Formulaires)        │
├─────────────────────────────────────────┤
│     types/rapportCommission.ts          │  ← Définitions TypeScript
│  (RapportCommissionData interface)      │
├─────────────────────────────────────────┤
│ services/rapportCommissionGenerator.ts  │  ← Logique de génération
│  (Transformation Data → Word)           │
└─────────────────────────────────────────┘
```

## Composants

### 1. RapportCommission.tsx (Composant principal)

**Responsabilités :**
- Gestion de l'état du formulaire
- Navigation entre chapitres
- Affichage conditionnel des sous-composants
- Sauvegarde/Chargement localStorage
- Déclenchement de la génération Word

**État principal :**

```typescript
const [formData, setFormData] = useState<RapportCommissionData>({
  identification: { ... },
  commission: { ... },
  objetReunion: { ... },
  contexte: { ... },
  deroulement: { ... },
  analyse: { ... },
  propositions: { ... },
  decisions: { ... },
});
```

**Fonctions de mise à jour :**

```typescript
// Mise à jour simple
updateField(chapter: string, field: string, value: any)

// Mise à jour nested
updateNestedField(chapter: string, parent: string, field: string, value: any)

// Ajout dans un tableau
addArrayItem(chapter: string, field: string, item: any)

// Suppression d'un élément
removeArrayItem(chapter: string, field: string, index: number)
```

### 2. Composants de formulaire par chapitre

Chaque chapitre a son propre composant :

```typescript
function IdentificationChapter({ data, updateField }: any)
function CommissionChapter({ data, updateField, updateNestedField, addArrayItem, removeArrayItem }: any)
function ObjetReunionChapter({ data, updateField }: any)
function ContexteChapter({ data, updateField, updateNestedField, addArrayItem, removeArrayItem }: any)
function DeroulementChapter({ data, updateField, addArrayItem, removeArrayItem }: any)
function AnalyseChapter({ data, updateField, addArrayItem, removeArrayItem }: any)
function PropositionsChapter({ data, updateField, updateNestedField }: any)
function DecisionsChapter({ data, updateField }: any)
```

### 3. PreviewContent (Prévisualisation)

**Responsabilité :** Afficher un aperçu formaté du document final

```typescript
function PreviewContent({ data }: { data: RapportCommissionData })
```

**Caractéristiques :**
- Rendu conditionnel (n'affiche que les sections remplies)
- Formatage des dates en français
- Styling proche du document final

## Types TypeScript

### RapportCommissionData

```typescript
export interface RapportCommissionData {
  identification: {
    numProcedure: string;
    objet: string;
    typeMarche: string;
    modePassation: string;
    montantEstime: string;
    codeCPV: string;
  };
  
  commission: {
    dateReunion: string;
    lieuReunion: string;
    president: {
      nom: string;
      fonction: string;
    };
    membres: Array<{
      nom: string;
      fonction: string;
    }>;
    absents: Array<{
      nom: string;
      fonction: string;
    }>;
    invites: Array<{
      nom: string;
      fonction: string;
    }>;
  };
  
  // ... (autres sections)
}
```

## Générateur Word

### Bibliothèque : docx

Documentation : [https://docx.js.org](https://docx.js.org)

### Fonction principale

```typescript
export async function generateRapportCommissionWord(data: RapportCommissionData)
```

**Workflow :**

1. **Création du document**
   ```typescript
   const doc = new Document({
     sections: [{ ... }]
   });
   ```

2. **Ajout des paragraphes**
   ```typescript
   new Paragraph({
     text: "RAPPORT DE PRÉSENTATION",
     heading: HeadingLevel.TITLE,
     alignment: AlignmentType.CENTER,
   })
   ```

3. **Création de tableaux**
   ```typescript
   function createTableAnalyse(candidats: Array<...>): Table
   ```

4. **Export en Blob**
   ```typescript
   const blob = await Packer.toBlob(doc);
   saveAs(blob, fileName);
   ```

### Fonctions utilitaires

```typescript
// Créer un titre de chapitre
function createChapterHeading(text: string): Paragraph

// Créer un label-value
function createLabelValue(label: string, value: string): Paragraph

// Formater une date
function formatDate(dateString: string): string

// Créer un tableau
function createTableAnalyse(candidats: Array<...>): Table
```

### Éléments docx utilisés

```typescript
import {
  Document,        // Document principal
  Packer,          // Convertir en blob
  Paragraph,       // Paragraphe de texte
  TextRun,         // Fragment de texte (gras, italique, etc.)
  HeadingLevel,    // Niveaux de titres
  AlignmentType,   // Alignement (CENTER, LEFT, etc.)
  Table,           // Tableau
  TableCell,       // Cellule de tableau
  TableRow,        // Ligne de tableau
  WidthType,       // Type de largeur
  BorderStyle,     // Style de bordure
  convertInchesToTwip  // Conversion d'unités
} from 'docx';
```

## Persistance

### localStorage

**Clé utilisée :** `rapportCommissionData`

**Sauvegarde :**
```typescript
const handleSaveData = () => {
  localStorage.setItem('rapportCommissionData', JSON.stringify(formData));
  alert('Données sauvegardées !');
};
```

**Chargement :**
```typescript
const handleLoadData = () => {
  const saved = localStorage.getItem('rapportCommissionData');
  if (saved) {
    setFormData(JSON.parse(saved));
    alert('Données chargées !');
  }
};
```

**Auto-chargement au démarrage :**
```typescript
useEffect(() => {
  const saved = localStorage.getItem('rapportCommissionData');
  if (saved) {
    setFormData(JSON.parse(saved));
  }
}, []);
```

### Migration vers Supabase (Future)

Pour migrer vers Supabase :

1. **Créer une table**
   ```sql
   CREATE TABLE rapport_commission (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID REFERENCES auth.users(id),
     num_procedure TEXT,
     data JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW(),
     updated_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```

2. **Modifier les fonctions**
   ```typescript
   const handleSaveData = async () => {
     const { error } = await supabase
       .from('rapport_commission')
       .upsert({
         user_id: user.id,
         num_procedure: formData.identification.numProcedure,
         data: formData,
       });
   };
   ```

## Styling

### Tailwind CSS

Tous les composants utilisent Tailwind CSS avec support du dark mode :

```typescript
className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
```

### Icônes

Bibliothèque : `lucide-react`

Icônes utilisées :
- `FileText` - Document
- `Users` - Commission
- `Calendar` - Dates
- `Building` - Contexte
- `FileCheck` - Validation
- `AlertCircle` - Alertes
- `Download` - Téléchargement
- `Eye` - Prévisualisation
- `Save` - Sauvegarde
- `ChevronRight` - Navigation

## Tests

### Tests manuels recommandés

1. **Navigation entre chapitres**
   - Cliquer sur chaque chapitre
   - Vérifier le changement d'état actif

2. **Saisie de données**
   - Remplir tous les types de champs
   - Tester les listes dynamiques (ajouter/supprimer)

3. **Prévisualisation**
   - Activer/désactiver la prévisualisation
   - Vérifier la mise à jour en temps réel

4. **Sauvegarde/Chargement**
   - Sauvegarder des données
   - Rafraîchir la page
   - Vérifier le chargement automatique

5. **Génération Word**
   - Générer un document avec toutes les sections remplies
   - Générer un document avec sections partielles
   - Vérifier le formatage dans Word

### Tests unitaires (Future)

```typescript
describe('RapportCommission', () => {
  it('should save data to localStorage', () => { ... });
  it('should load data from localStorage', () => { ... });
  it('should generate Word document', () => { ... });
  it('should handle nested field updates', () => { ... });
});
```

## Performance

### Optimisations possibles

1. **Mémoization des composants**
   ```typescript
   const IdentificationChapter = React.memo(({ data, updateField }) => { ... });
   ```

2. **Debouncing des sauvegardes**
   ```typescript
   const debouncedSave = useMemo(
     () => debounce(handleSaveData, 1000),
     []
   );
   ```

3. **Lazy loading de la prévisualisation**
   ```typescript
   const PreviewContent = React.lazy(() => import('./PreviewContent'));
   ```

## Extensibilité

### Ajouter un nouveau chapitre

1. **Mettre à jour le type**
   ```typescript
   export interface RapportCommissionData {
     // ... autres chapitres
     nouveauChapitre: {
       champ1: string;
       champ2: string;
     };
   }
   ```

2. **Ajouter au composant principal**
   ```typescript
   const [formData, setFormData] = useState<RapportCommissionData>({
     // ... autres chapitres
     nouveauChapitre: {
       champ1: '',
       champ2: '',
     },
   });
   ```

3. **Créer le composant de formulaire**
   ```typescript
   function NouveauChapitreComponent({ data, updateField }: any) {
     return (
       <div className="space-y-6">
         {/* Champs du formulaire */}
       </div>
     );
   }
   ```

4. **Ajouter au switch**
   ```typescript
   case 'nouveauChapitre':
     return <NouveauChapitreComponent data={formData.nouveauChapitre} updateField={updateField} />;
   ```

5. **Mettre à jour le générateur Word**
   ```typescript
   ...(data.nouveauChapitre.champ1 ? [
     createLabelValue("Champ 1", data.nouveauChapitre.champ1),
   ] : []),
   ```

### Ajouter un type de champ personnalisé

```typescript
// Exemple: Champ de sélection multiple
function MultiSelect({ options, selected, onChange }: any) {
  return (
    <div className="space-y-2">
      {options.map((opt: string) => (
        <label key={opt} className="flex items-center">
          <input
            type="checkbox"
            checked={selected.includes(opt)}
            onChange={() => {
              if (selected.includes(opt)) {
                onChange(selected.filter((s: string) => s !== opt));
              } else {
                onChange([...selected, opt]);
              }
            }}
            className="mr-2"
          />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}
```

## Bonnes pratiques

### Code

1. **Typage strict** : Toujours utiliser TypeScript avec types explicites
2. **Composants purs** : Éviter les side effects dans les composants de formulaire
3. **Naming** : Noms de variables descriptifs (ex: `handleSaveData`, pas `save`)
4. **Comments** : Commenter les sections complexes

### UI/UX

1. **Feedback utilisateur** : Toujours donner un retour visuel (spinners, alertes)
2. **Validation** : Valider les champs avant génération
3. **Accessibilité** : Labels pour tous les champs, navigation au clavier
4. **Responsive** : Tester sur mobile, tablette, desktop

### Performance

1. **Lazy loading** : Charger la prévisualisation uniquement si activée
2. **Debouncing** : Éviter les sauvegardes trop fréquentes
3. **Mémoization** : Utiliser `useMemo` et `useCallback` pour les calculs coûteux

## Dépendances

```json
{
  "dependencies": {
    "docx": "^9.5.1",
    "file-saver": "^2.0.5",
    "lucide-react": "^0.562.0",
    "react": "^19.2.3",
    "react-dom": "^19.2.3"
  },
  "devDependencies": {
    "@types/file-saver": "^2.0.7"
  }
}
```

## Ressources

- [docx.js Documentation](https://docx.js.org)
- [Tailwind CSS](https://tailwindcss.com)
- [lucide-react](https://lucide.dev)
- [React Hooks](https://react.dev/reference/react)

## Changelog

### Version 1.0.0 (Janvier 2025)
- ✅ Interface complète avec 8 chapitres
- ✅ Génération Word avec formatage professionnel
- ✅ Prévisualisation en temps réel
- ✅ Sauvegarde localStorage
- ✅ Support du dark mode
- ✅ Navigation fluide par chapitres
- ✅ Gestion des listes dynamiques (membres, critères, offres, candidats)

### Roadmap

- [ ] Sauvegarde Supabase
- [ ] Export PDF
- [ ] Templates personnalisables
- [ ] Import depuis d'autres modules (AN01, Ouverture Plis)
- [ ] Historique des versions
- [ ] Partage et collaboration
