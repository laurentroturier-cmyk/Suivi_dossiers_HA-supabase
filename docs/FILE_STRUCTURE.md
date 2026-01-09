# 📂 Structure des fichiers - Module d'Import de Données

## 🌳 Arborescence

```
/workspaces/Suivi_dossiers_HA-supabase/
│
├── components/
│   └── auth/
│       ├── AdminDashboard.tsx         [MODIFIÉ] Tab "Import de données"
│       └── DataImport.tsx              [NOUVEAU]  Composant principal
│
├── sql/
│   └── create-tables-import.sql        [NOUVEAU]  Script création tables
│
├── utils/
│   └── templateGenerator.ts            [NOUVEAU]  Générateur templates Excel
│
├── docs/
│   ├── IMPORT_MODULE.md                [NOUVEAU]  Documentation complète
│   ├── SUPABASE_SETUP_GUIDE.md         [NOUVEAU]  Guide installation SQL
│   ├── IMPORT_MODULE_SUMMARY.md        [NOUVEAU]  Résumé technique
│   └── COLUMN_MAPPING_REFERENCE.md     [NOUVEAU]  Référence mappings
│
├── IMPORT_QUICKSTART.md                [NOUVEAU]  Guide démarrage rapide
└── CHANGELOG_IMPORT.md                 [NOUVEAU]  Notes de version
```

---

## 📄 Détail des fichiers

### 🎨 Composants React

#### `components/auth/DataImport.tsx` (514 lignes)
**Rôle :** Composant principal d'import de données

**Contenu :**
- Interface de sélection de table (projets/procedures)
- Zone de dépôt de fichier (Excel/CSV)
- Affichage du mapping automatique des colonnes
- Tableau d'aperçu des données
- Bouton d'import vers Supabase
- Bouton de téléchargement de template
- Gestion d'erreurs complète

**Exports :**
- `default function DataImport()`

**Dépendances :**
- `react`
- `lucide-react` (icônes)
- `xlsx` (parsing Excel)
- `supabase` (client)
- `templateGenerator` (download)

**État local :**
```typescript
- selectedTable: 'projets' | 'procedures'
- importedData: ImportedData | null
- loading: boolean
- uploading: boolean
- message: { type, text } | null
- columnMappings: ColumnMapping[]
- previewData: any[]
```

---

#### `components/auth/AdminDashboard.tsx` (862 lignes)
**Modifications :**
1. Import de `DataImport` (ligne 26)
2. Ajout de `'import'` dans le type de `activeTab` (ligne 39)
3. Bouton "Import de données" dans la navigation (lignes 326-334)
4. Rendu conditionnel du composant (lignes 857-860)

**Lignes ajoutées :** ~15
**Lignes modifiées :** 3

---

### 🗄️ SQL

#### `sql/create-tables-import.sql` (297 lignes)
**Rôle :** Script de création des tables et politiques RLS

**Contenu :**
- Table `projets` (93 colonnes + 3 système)
- Table `procedures` (7 colonnes + 3 système)
- 10 index de performance
- 8 politiques RLS (4 par table)
- 2 triggers de mise à jour
- Commentaires SQL

**Sections :**
```sql
1. Création table projets (lignes 10-134)
2. Index projets (lignes 136-140)
3. RLS projets (lignes 142-181)
4. Création table procedures (lignes 183-213)
5. Index procedures (lignes 215-217)
6. RLS procedures (lignes 219-258)
7. Triggers (lignes 260-280)
8. Commentaires (lignes 282-297)
```

---

### 🛠️ Utilitaires

#### `utils/templateGenerator.ts` (321 lignes)
**Rôle :** Génération de fichiers Excel templates

**Exports :**
```typescript
- generateProjectsTemplate(): WorkBook
- generateProceduresTemplate(): WorkBook
- downloadTemplate(type: 'projets' | 'procedures'): void
```

**Contenu :**
- Headers pour table `projets` (93 colonnes)
- Lignes d'exemple (2 projets)
- Feuille "Instructions"
- Headers pour table `procedures` (7 colonnes)
- Lignes d'exemple (2 procédures)

**Dépendances :**
- `xlsx`

---

### 📚 Documentation

#### `docs/IMPORT_MODULE.md` (487 lignes)
**Guide complet d'utilisation**

**Sections :**
1. Vue d'ensemble
2. Fonctionnalités
3. Utilisation (prérequis + étapes)
4. Structure des fichiers Excel
5. Mapping des colonnes
6. Sécurité RLS
7. Personnalisation
8. Format des fichiers
9. Gestion des erreurs
10. Tests
11. Dépendances
12. Workflow complet
13. Conseils
14. Support
15. Améliorations futures

---

#### `docs/SUPABASE_SETUP_GUIDE.md` (203 lignes)
**Guide d'installation SQL dans Supabase**

**Sections :**
1. Objectif
2. Prérequis
3. Installation (4 étapes)
4. Vérification détaillée
5. Résolution de problèmes
6. Structure créée
7. Validation finale
8. Prochaines étapes

---

#### `docs/IMPORT_MODULE_SUMMARY.md` (347 lignes)
**Résumé technique des modifications**

**Sections :**
1. Fichiers créés
2. Fichiers modifiés
3. Fonctionnalités implémentées
4. Mapping des colonnes
5. Architecture
6. Utilisation
7. Statistiques
8. Sécurité RLS
9. Design
10. Performance
11. TODO
12. Tests

---

#### `docs/COLUMN_MAPPING_REFERENCE.md` (272 lignes)
**Référence complète des mappings**

**Contenu :**
- Table complète projets (93 lignes)
- Table procedures (7 lignes)
- Colonnes système
- Règles de conversion
- Formats de données
- Index créés
- Exemples

---

#### `IMPORT_QUICKSTART.md` (51 lignes)
**Guide de démarrage rapide**

**Contenu :**
- 3 étapes pour démarrer
- Liste des fichiers
- Fonctionnalités en bref
- Tables gérées
- Liens vers docs

---

#### `CHANGELOG_IMPORT.md` (135 lignes)
**Notes de version**

**Contenu :**
- Version 1.0.0
- Fonctionnalités ajoutées
- Modifications apportées
- Détails techniques
- Breaking changes
- Migration
- Améliorations futures

---

## 📊 Statistiques globales

| Métrique | Valeur |
|----------|--------|
| **Fichiers créés** | 8 |
| **Fichiers modifiés** | 1 |
| **Lignes de code** | ~1,200 |
| **Lignes de documentation** | ~1,500 |
| **Colonnes gérées** | 100 (93 projets + 7 procedures) |
| **Politiques RLS** | 8 |
| **Index SQL** | 10 |
| **Templates Excel** | 2 |

---

## 🔗 Dépendances entre fichiers

```
DataImport.tsx
  ├─→ supabase (client)
  ├─→ xlsx (parsing)
  └─→ templateGenerator.ts (download)

AdminDashboard.tsx
  └─→ DataImport.tsx

templateGenerator.ts
  └─→ xlsx (generation)

create-tables-import.sql
  └─→ Aucune dépendance
```

---

## 📝 Conventions de nommage

### Fichiers
- Composants React : `PascalCase.tsx`
- Utilitaires : `camelCase.ts`
- SQL : `kebab-case.sql`
- Documentation : `SCREAMING_SNAKE_CASE.md`

### Colonnes SQL
- Format : `snake_case`
- Exemple : `numero_procedure_afpa`

### Composants React
- Format : `PascalCase`
- Exemple : `DataImport`

### Fonctions
- Format : `camelCase`
- Exemple : `downloadTemplate`

---

## 🚀 Commandes utiles

```bash
# Vérifier les erreurs TypeScript
npx tsc --noEmit

# Builder le projet
npm run build

# Lancer en dev
npm run dev

# Vérifier un fichier spécifique
npx tsc components/auth/DataImport.tsx --noEmit
```

---

## 📦 Distribution

### Fichiers à déployer en production
```
✅ components/auth/DataImport.tsx
✅ components/auth/AdminDashboard.tsx (modifié)
✅ utils/templateGenerator.ts
```

### Fichiers SQL (à exécuter manuellement)
```
⚠️ sql/create-tables-import.sql
```

### Documentation (optionnel)
```
📖 docs/*.md
📖 *.md
```

---

**Dernière mise à jour** : 2026-01-09  
**Version du module** : 1.0.0
