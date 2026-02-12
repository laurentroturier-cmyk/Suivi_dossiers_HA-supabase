# 📊 Audit de l'architecture - GestProjet

> **Date :** Janvier 2025  
> **Version de l'application :** 1.0.2  
> **Type d'audit :** Architecture, Code, Styling, Dette technique

---

## 📋 Table des matières

1. [Vue d'ensemble de l'architecture](#1-vue-densemble-de-larchitecture)
2. [Analyse des composants](#2-analyse-des-composants)
3. [Analyse du styling](#3-analyse-du-styling)
4. [Analyse du thème (clair/sombre)](#4-analyse-du-thème-clairsombre)
5. [Points de fragilité et dette technique](#5-points-de-fragilité-et-dette-technique)
6. [Priorités de refactorisation](#6-priorités-de-refactorisation)

---

## 1. Vue d'ensemble de l'architecture

### 1.1 Stack technique

| Technologie | Version | Rôle |
|------------|---------|------|
| **React** | 19.2.3 | Framework UI |
| **TypeScript** | 5.8.2 | Typage statique |
| **Vite** | 6.2.0 | Build tool & dev server |
| **Supabase** | 2.48.1 | Backend (auth + BDD PostgreSQL) |
| **Tailwind CSS** | - | Framework CSS (CDN) |
| **lucide-react** | 0.562.0 | Bibliothèque d'icônes |
| **xlsx** | 0.18.5 | Import/export Excel |
| **docx** | 9.5.1 | Export DOCX |
| **recharts** | 3.6.0 | Graphiques |
| **jspdf + html2canvas** | 3.0.4 + 1.4.1 | Export PDF |

### 1.2 Structure des dossiers

```
/workspaces/Suivi_dossiers_HA-supabase/
├── App.tsx                    # 🔴 MONOLITH (4199 lignes)
├── index.tsx                  # Point d'entrée React
├── constants.tsx              # Constantes métier (225 lignes)
├── types.ts                   # Types globaux (106 lignes)
│
├── components/                # Composants React
│   ├── Contrats.tsx           # 🟠 1341 lignes (très volumineux)
│   ├── LandingPage.tsx        # 231 lignes
│   ├── RegistreDepots.tsx     # 485 lignes
│   ├── RegistreRetraits.tsx   # 485 lignes
│   ├── DocumentViewer.tsx
│   ├── Modal.tsx
│   ├── ThemeToggle.tsx
│   ├── AppVersion.tsx         # Versioning
│   ├── ExampleDesignSystem.tsx
│   │
│   ├── auth/                  # Module d'authentification
│   │   ├── AdminDashboard.tsx # 🟠 866 lignes
│   │   ├── DataImport.tsx     # 🟠 630 lignes
│   │   ├── Login.tsx
│   │   └── AccessRequestForm.tsx
│   │
│   └── an01/                  # Module d'analyse AN01
│       ├── Dashboard.tsx      # 🟠 733 lignes
│       ├── GlobalTableView.tsx
│       ├── LotSelectionView.tsx
│       ├── TechnicalAnalysisView.tsx
│       ├── UploadView.tsx
│       ├── PriceChart.tsx
│       ├── ScoreChart.tsx
│       ├── TrendChart.tsx
│       ├── SidePanel.tsx
│       ├── ExportSelectModal.tsx
│       └── types.ts
│
├── design-system/             # ⚠️ Design system NON INTÉGRÉ
│   ├── components/
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── Input/
│   │   └── Modal/
│   ├── theme/
│   │   ├── ThemeProvider.tsx
│   │   └── theme.css
│   ├── tokens/                # Design tokens
│   │   ├── colors.ts
│   │   ├── spacing.ts
│   │   ├── radius.ts
│   │   ├── typography.ts
│   │   └── shadows.ts
│   ├── hooks/
│   └── README.md
│
├── contexts/
│   └── ThemeContext.tsx       # ⚠️ Ancien provider de thème
│
├── lib/
│   └── supabase.ts            # Configuration Supabase
│
├── types/                     # Types par module
│   ├── auth.ts
│   ├── contrats.ts
│   ├── depots.ts
│   └── retraits.ts
│
├── utils/                     # Utilitaires
│   ├── csvParser.ts
│   ├── dateUtils.ts
│   ├── depotsParser.ts
│   ├── retraitsParser.ts
│   └── templateGenerator.ts
│
├── an01-utils/
│   ├── services/
│   │   └── excelParser.ts
│   └── types.ts
│
├── public/
├── sql/                       # Scripts SQL Supabase
│   └── create-tables-import.sql
│
├── scripts/
│   └── bump-version.js        # Script de versioning
│
├── index.css                  # 🟡 426 lignes (styles globaux)
├── dark-theme.css             # 🟡 762 lignes (thème sombre)
├── an01.css                   # 🟡 Styles module AN01
│
└── docs/                      # Documentation
    ├── AUTH_SETUP.md
    ├── TEST_GUIDE.md
    ├── IMPORT_MODULE.md
    └── ...
```

### 1.3 Architecture applicative

**Flux principal :**

```
index.tsx
  ↓ (ThemeProvider from design-system)
  ↓
App.tsx (4199 lignes)
  ├─→ Authentification Supabase (onAuthStateChange)
  │    ├─ Si non connecté → Login.tsx
  │    └─ Si connecté → Récupération profil (public.profiles)
  │
  ├─→ Navigation principale (état local avec useState)
  │    ├─ view === 'landing' → LandingPage
  │    ├─ view === 'projets' → Tableau projets (inline dans App.tsx)
  │    ├─ view === 'procédures' → Tableau dossiers (inline dans App.tsx)
  │    ├─ view === 'contrats' → Contrats.tsx
  │    ├─ view === 'retraits' → RegistreRetraits.tsx
  │    ├─ view === 'depots' → RegistreDepots.tsx
  │    ├─ showAdminDashboard → AdminDashboard.tsx
  │    └─ AN01 states → UploadView / LotSelectionView / Dashboard / GlobalTableView
  │
  ├─→ Gestion d'état (20+ useState hooks dans App.tsx)
  │    ├─ Données (projets, dossiers, contrats)
  │    ├─ Navigation (view, showAdminDashboard, etc.)
  │    ├─ Filtres et recherche
  │    ├─ Upload/loading states
  │    └─ AN01 analysis data
  │
  └─→ Logique métier (tout dans App.tsx)
       ├─ Supabase queries (select, insert, update, delete)
       ├─ Parsing fichiers (PDF, CSV, Excel)
       ├─ Export/import
       └─ Calculs statistiques
```

**⚠️ Point critique :** App.tsx = orchestrateur monolithique

---

## 2. Analyse des composants

### 2.1 Catégorisation des composants

#### 📄 Composants "Pages" (haut niveau)

| Composant | Lignes | Rôle | État local | Dépendances Supabase |
|-----------|--------|------|------------|---------------------|
| **App.tsx** | 🔴 **4199** | Orchestrateur principal | ✅ 20+ useState | ✅ Oui (auth, CRUD) |
| **Contrats.tsx** | 🟠 **1341** | Module de gestion des contrats | ✅ Oui | ✅ Oui (table contrats) |
| **AdminDashboard.tsx** | 🟠 **866** | Dashboard admin | ✅ Oui | ✅ Oui (profiles, requests) |
| **DataImport.tsx** | 🟠 **630** | Import CSV → Supabase | ✅ Oui | ✅ Oui (insert bulk) |
| **Dashboard.tsx** (an01) | 🟠 **733** | Analyse AN01 | ✅ Oui | ❌ Non (données en props) |
| **LandingPage.tsx** | 🟢 **231** | Page d'accueil | ❌ Non | ❌ Non |
| **RegistreRetraits.tsx** | 🟢 **485** | Registre des retraits | ✅ Oui | ❌ Non (parsing local) |
| **RegistreDepots.tsx** | 🟢 **485** | Registre des dépôts | ✅ Oui | ❌ Non (parsing local) |
| **Login.tsx** | 🟢 - | Formulaire de connexion | ✅ Oui | ✅ Oui (auth.signIn) |

#### 🎨 Composants UI / Présentationnels

| Composant | Lignes | Props | Réutilisable | Où utilisé |
|-----------|--------|-------|--------------|-----------|
| **ThemeToggle.tsx** | - | - | ✅ | Header global |
| **AppVersion.tsx** | - | className? | ✅ | Header global |
| **Modal.tsx** | - | isOpen, onClose, title, children | ✅ | App.tsx (multiples endroits) |
| **DocumentViewer.tsx** | - | documentUrl, onClose | ✅ | App.tsx |
| **ExportSelectModal.tsx** | - | onSelect, onClose | ✅ | an01/ (multiples) |
| **PriceChart.tsx** | - | offers, currency | ✅ | an01/Dashboard |
| **ScoreChart.tsx** | - | offers | ✅ | an01/Dashboard |
| **TrendChart.tsx** | - | offers | ✅ | an01/Dashboard |
| **SidePanel.tsx** | - | offer, winner, onClose | ✅ | an01/Dashboard |

**Design System (NON utilisés actuellement) :**
- `design-system/components/Button`
- `design-system/components/Card`
- `design-system/components/Input`
- `design-system/components/Modal`

#### 🔧 Composants "Containers" / Logiques

| Composant | Rôle | Pattern | Observations |
|-----------|------|---------|--------------|
| **UploadView** (an01) | Upload fichier Excel AN01 | Smart component | Parsing + validation |
| **LotSelectionView** (an01) | Sélection de lot | Smart component | Filtrage + navigation |
| **GlobalTableView** (an01) | Vue tableau global | Smart component | Tri + export |
| **TechnicalAnalysisView** (an01) | Analyse technique | Smart component | Affichage + export |

### 2.2 Patterns d'importation

**Imports relatifs (structure actuelle) :**

```typescript
// Depuis App.tsx (racine)
import { ProjectData, DossierData } from './types';
import { supabase } from './lib/supabase';
import Login from './components/auth/Login';
import Dashboard from './components/an01/Dashboard';

// Depuis components/auth/AdminDashboard.tsx
import { supabase } from '../../lib/supabase';
import { UserProfile } from '../../types/auth';
import { PROJECT_FIELDS } from '../../constants';

// Depuis components/an01/Dashboard.tsx
import { AnalysisData, Offer } from './types';
import ScoreChart from './ScoreChart';
```

**⚠️ Observations :**
- Imports relatifs (`../../`) partout → fragilité lors de refactoring
- Pas d'alias TypeScript (`@/lib/supabase`, `@/components/...`)
- Duplication de logique d'import

### 2.3 Duplication de code identifiée

**useState répétés :**
- `const [loading, setLoading] = useState(false)` → présent dans 10+ composants
- `const [searchTerm, setSearchTerm] = useState('')` → 5+ composants

**Formatage de dates :**
- `formatDisplayDate`, `parseDate` → dupliqué dans Contrats.tsx ET utils/dateUtils.ts

**Formatage de devises :**
- `formatCurrency`, `formatNumber` → dupliqué dans Contrats.tsx ET an01/Dashboard.tsx

**Parsing de fichiers :**
- Logique CSV/Excel dispersée entre `utils/csvParser.ts`, `an01-utils/services/excelParser.ts`, `components/auth/DataImport.tsx`

---

## 3. Analyse du styling

### 3.1 Systèmes de styling coexistants

| Système | Fichier | Lignes | Usage | Périmètre |
|---------|---------|--------|-------|-----------|
| **CSS Global (light)** | `index.css` | 426 | Variables CSS `:root` | Toute l'app |
| **CSS Global (dark)** | `dark-theme.css` | 762 | Variables CSS `html.dark` | Mode sombre |
| **CSS Module AN01** | `an01.css` | - | Styles isolés `.an01-wrapper` | Module AN01 uniquement |
| **Design System CSS** | `design-system/theme/theme.css` | 125 | Variables modernes `:root` | ⚠️ NON UTILISÉ |
| **Tailwind CSS** | - | - | Classes utilitaires | Partout (inline dans JSX) |
| **Inline styles** | - | - | `style={{...}}` | Quelques composants |

### 3.2 Variables CSS définies

#### Dans `index.css` (426 lignes)

```css
:root {
  --background: #f4f7f6;
  --foreground: #0f172a;
  --card-background: #fff;
  --primary: #0f8a6a;
  --primary-foreground: #ffffff;
  --secondary: #f2f5fa;
  --muted: #8b95a5;
  --border: #edf1f7;
  --radius: 2rem;
  /* + 20+ autres variables */
}

html.dark {
  --background: #0c1015;
  --foreground: #e5e7eb;
  --card-background: #161b22;
  --primary: #10b981;
  /* Mode sombre */
}
```

#### Dans `dark-theme.css` (762 lignes)

```css
html.dark {
  --background: #0c1015;
  --card-background: #161b22;
  --surface-elevated: #1f2937;
  /* + styles pour scrollbar, border-radius overrides, etc. */
}

/* Border-radius overrides avec !important */
.rounded-sm { border-radius: 8px !important; }
.rounded-md { border-radius: 12px !important; }
.rounded-lg { border-radius: 16px !important; }
.rounded-2xl { border-radius: 32px !important; }
```

#### Dans `design-system/theme/theme.css` (125 lignes) ⚠️ NON UTILISÉ

```css
:root {
  --color-primary-500: #0f8a6a;
  --color-primary-900: #004d3d;
  --radius-sm: 8px;
  --radius-2xl: 32px;
  --radius-pill: 9999px;
  /* Design tokens modernes */
}
```

### 3.3 Couleurs hardcodées (Tailwind arbitrary values)

**Recherche : `bg-[#...]`, `text-[#...]`**

**Exemples trouvés (20+ occurrences) :**

| Fichier | Ligne | Code | Couleur |
|---------|-------|------|---------|
| LandingPage.tsx | - | `bg-[#252525]` | Fond sombre |
| LandingPage.tsx | - | `text-[10px]` | Taille texte |
| App.tsx | - | `bg-[#0f8a6a]` | Vert primaire |
| App.tsx | - | `text-[#40E0D0]` | Cyan |
| App.tsx | - | `text-[#FFA500]` | Orange |
| App.tsx | - | `text-[#A020F0]` | Violet |
| Contrats.tsx | - | Couleurs inline pour KPI tiles | Multiples |

**⚠️ Problème :** Ces couleurs ne sont PAS des variables CSS → impossible de thématiser

### 3.4 Cohérence du border-radius

**3 systèmes différents :**

1. **index.css** : `--radius: 2rem` (32px)
2. **dark-theme.css** : Classes `.rounded-*` avec `!important`
3. **design-system/theme/theme.css** : `--radius-sm` à `--radius-pill`

**Observation :** Conflits potentiels, surcharges avec `!important` → fragilité

### 3.5 Synthèse des incohérences

| Type | Problème | Impact |
|------|----------|--------|
| **Variables dupliquées** | 3 fichiers CSS définissent les mêmes variables | Maintenance difficile |
| **Couleurs hardcodées** | 20+ `bg-[#...]` en Tailwind | Thématisation impossible |
| **!important overload** | dark-theme.css utilise `!important` partout | Spécificité excessive |
| **Design system non utilisé** | Tokens modernes définis mais ignorés | Gaspillage de code |
| **Border-radius incohérent** | 3 systèmes de border-radius | Confusion |

---

## 4. Analyse du thème (clair/sombre)

### 4.1 Systèmes de thème détectés

#### 🔴 Ancien système : `contexts/ThemeContext.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  // Logique de thème + localStorage
  // Applique la classe "dark" sur <html>
};

export const useTheme = () => { /* ... */ };
```

**Utilisé par :** Non utilisé actuellement (remplacé ?)

#### 🟢 Nouveau système : `design-system/theme/ThemeProvider.tsx`

```typescript
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  // Logique modernisée
  // Gère localStorage + détection système + toggleTheme()
};

export const useTheme = () => { /* ... */ };
```

**Utilisé par :** `index.tsx` (wraps `<App />`)

#### 🎨 ThemeToggle : `components/ThemeToggle.tsx`

```typescript
import { useTheme } from '../design-system/theme/ThemeProvider';

export const ThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  // Bouton de switch clair/sombre
};
```

**Utilisé par :** Header de App.tsx

### 4.2 Mécanisme d'application

**Fonctionnement actuel :**

1. `index.tsx` → wraps `<App />` dans `<ThemeProvider>` (design-system)
2. `ThemeProvider` lit `localStorage.getItem('theme')` ou détecte le système
3. Applique `document.documentElement.classList.add('dark')` si mode sombre
4. CSS `html.dark { ... }` s'applique via `index.css` et `dark-theme.css`

**Variables CSS utilisées :**

- Mode clair : `:root { --background: #f4f7f6; }`
- Mode sombre : `html.dark { --background: #0c1015; }`

### 4.3 Contraintes actuelles

| Contrainte | Description | Exemple |
|------------|-------------|---------|
| **Couleurs hardcodées** | Tailwind `bg-[#252525]` ignore le thème | LandingPage.tsx |
| **!important dans dark-theme.css** | Surcharge brutale des border-radius | Tous les `.rounded-*` |
| **2 providers de thème** | ThemeContext.tsx + ThemeProvider.tsx | Confusion |
| **CSS non centralisé** | index.css + dark-theme.css + an01.css | Fragmentation |
| **Design system ignoré** | Variables modernes définies mais inutilisées | design-system/tokens/ |

### 4.4 État du switch clair/sombre

✅ **Ce qui fonctionne :**
- Toggle clair/sombre opérationnel
- Persistance dans localStorage
- Variables CSS bien appliquées (pour les styles qui les utilisent)

❌ **Ce qui ne fonctionne PAS :**
- Couleurs hardcodées (`bg-[#252525]`) → ne changent jamais
- Composants avec inline styles → ne réagissent pas au thème
- AN01 module avec an01.css isolé → styles partiellement thématisés

---

## 5. Points de fragilité et dette technique

### 5.1 Monolithe App.tsx (4199 lignes)

**Problèmes identifiés :**

| Problème | Conséquence | Priorité |
|----------|-------------|----------|
| **20+ useState hooks** | État complexe, difficile à suivre | 🔴 CRITIQUE |
| **Toute la logique métier** | Couplage fort, tests impossibles | 🔴 CRITIQUE |
| **Routing inline** | Pas de solution de routing (React Router) | 🟠 ÉLEVÉE |
| **Supabase queries dispersées** | Pas de couche de service | 🟠 ÉLEVÉE |
| **Composants inline** | Tableaux de 500+ lignes dans App.tsx | 🟠 ÉLEVÉE |

**Exemple de useState :**

```typescript
const [projectSearch, setProjectSearch] = useState('');
const [procedureSearch, setProcedureSearch] = useState('');
const [isLoading, setIsLoading] = useState(false);
const [isSaving, setIsSaving] = useState(false);
const [isUploading, setIsUploading] = useState(false);
const [showAdminDashboard, setShowAdminDashboard] = useState(false);
const [an01IsLoading, setAn01IsLoading] = useState(false);
const [tableScrollWidth, setTableScrollWidth] = useState(0);
// ... + 12 autres useState
```

### 5.2 Pas de gestion d'état centralisée

**Observation :**
- Pas de Redux, Zustand, ou Context API personnalisé
- Props drilling à travers 3-4 niveaux de composants
- État dupliqué entre composants (ex: `loading` dans 10+ composants)

**Exemple de props drilling :**

```typescript
App.tsx (data) 
  → LotSelectionView (data) 
    → Dashboard (data) 
      → SidePanel (selectedOffer)
```

### 5.3 Absence de routing

**Situation actuelle :**
- Navigation gérée par `const [view, setView] = useState<'landing' | 'projets' | ...>('landing')`
- Pas d'URL mapping → impossible de partager un lien vers une page spécifique
- Pas de navigation navigateur (back/forward)

**Impact :**
- Mauvaise UX
- SEO impossible (SPA sans routing)
- Pas de deep linking

### 5.4 Logique métier dispersée

**Services manquants :**

| Service attendu | Réalité actuelle | Impact |
|----------------|------------------|--------|
| `services/supabase/projects.ts` | Queries inline dans App.tsx | Duplication + pas testable |
| `services/supabase/contrats.ts` | Queries inline dans Contrats.tsx | Duplication + pas testable |
| `services/auth.ts` | Logique inline dans Login.tsx et App.tsx | Couplage fort |
| `services/fileParser.ts` | 3 parsers différents (utils/, an01-utils/, composants) | Duplication |

### 5.5 Parsing de fichiers fragmenté

**Situation :**

```
utils/
  ├── csvParser.ts          # Parse CSV générique
  ├── depotsParser.ts       # Parse PDF dépôts
  └── retraitsParser.ts     # Parse PDF retraits

an01-utils/services/
  └── excelParser.ts        # Parse Excel AN01

components/auth/
  └── DataImport.tsx        # Parse CSV projets/dossiers (inline)
```

**Problème :** Logique similaire (lecture de fichier, parsing, validation) dispersée

### 5.6 Types TypeScript fragmentés

**Situation :**

```
types.ts                    # ProjectData, DossierData, SegmentationRow
types/auth.ts               # UserProfile, AuthState, AccessRequest
types/contrats.ts           # Contrat, ContratsStats, ContratsFilters
types/depots.ts             # DepotsData, EntrepriseDepot
types/retraits.ts           # RetraitsData, EntrepriseRetrait
components/an01/types.ts    # AnalysisData, Offer, Stats, ...
```

**Observation :** Bonne organisation modulaire MAIS :
- Duplication possible (ex: `formatCurrency` défini dans multiples endroits)
- Imports relatifs (`../../types/auth`) → fragilité

### 5.7 Styling non centralisé

**Récapitulatif :**

| Problème | Fichiers concernés | Impact |
|----------|-------------------|--------|
| 3 fichiers CSS globaux | index.css, dark-theme.css, an01.css | Conflits potentiels |
| Variables CSS dupliquées | index.css + design-system/theme/theme.css | Maintenance double |
| Design system non intégré | design-system/ complet mais inutilisé | Gaspillage |
| Couleurs hardcodées | 20+ occurrences de `bg-[#...]` | Thématisation bloquée |
| !important excessif | dark-theme.css | Spécificité CSS cassée |

### 5.8 Tests absents

**Constat :**
- Aucun fichier de test détecté (pas de `.test.tsx`, `.spec.ts`)
- Pas de configuration Jest ou Vitest
- Impossible de valider les régressions

---

## 6. Priorités de refactorisation

### 6.1 Axes de refactorisation (par priorité)

#### 🔴 **PRIORITÉ 1 : Décomposer App.tsx (monolithe)**

**Objectif :** Passer de 4199 lignes à <500 lignes

**Actions recommandées :**

1. **Extraire les tableaux inline en composants**
   - Tableau projets → `components/ProjetsList.tsx`
   - Tableau dossiers → `components/DossiersList.tsx`
   - Chaque composant gère son propre état (filtres, tri, pagination)

2. **Introduire React Router**
   - Routes : `/`, `/projets`, `/procedures`, `/contrats`, `/retraits`, `/depots`, `/an01`, `/admin`
   - URL mapping → deep linking
   - Navigation navigateur (back/forward)

3. **Créer une couche de services Supabase**
   ```
   services/
     ├── supabase/
     │   ├── projects.ts       # getProjects(), createProject(), updateProject(), deleteProject()
     │   ├── dossiers.ts        # getDossiers(), ...
     │   ├── contrats.ts        # getContrats(), ...
     │   └── auth.ts            # signIn(), signOut(), getProfile()
   ```

4. **Extraire la logique métier en hooks personnalisés**
   ```typescript
   hooks/
     ├── useProjects.ts         # const { projects, loading, error, refetch } = useProjects()
     ├── useDossiers.ts
     ├── useContrats.ts
     ├── useAuth.ts             # const { user, profile, signIn, signOut } = useAuth()
   ```

**Impact :** Maintenabilité +++, Testabilité +++, Lisibilité +++

---

#### 🔴 **PRIORITÉ 2 : Centraliser la gestion d'état**

**Objectif :** Éliminer le props drilling, centraliser l'état global

**Solutions recommandées :**

1. **Option 1 : Context API + useReducer (React natif)**
   ```typescript
   contexts/
     ├── AppContext.tsx         # État global (navigation, user, etc.)
     ├── ProjectsContext.tsx    # État projets
     ├── DossiersContext.tsx    # État dossiers
   ```

2. **Option 2 : Zustand (léger, moderne)**
   ```typescript
   stores/
     ├── useAuthStore.ts        # create((set) => ({ user, profile, signIn, signOut }))
     ├── useProjectsStore.ts
     ├── useDossiersStore.ts
   ```

3. **Option 3 : Redux Toolkit (si app très complexe)**
   - Overkill pour la taille actuelle de l'app

**Recommandation :** **Zustand** (simple, performant, petite taille bundle)

---

#### 🟠 **PRIORITÉ 3 : Unifier le système de styling**

**Objectif :** 1 seul système de styling cohérent

**Actions recommandées :**

1. **Migrer vers le design system existant**
   - Remplacer progressivement les styles inline par les composants `design-system/`
   - Utiliser les tokens (`colors.ts`, `spacing.ts`, `radius.ts`) partout
   - Supprimer `index.css`, `dark-theme.css`, `an01.css` au profit de `design-system/theme/theme.css`

2. **Éliminer les couleurs hardcodées**
   - Rechercher tous les `bg-[#...]`, `text-[#...]`
   - Remplacer par des classes Tailwind standard (`bg-primary-500`) ou variables CSS

3. **Configurer Tailwind avec le design system**
   ```javascript
   // tailwind.config.js
   module.exports = {
     theme: {
       extend: {
         colors: {
           primary: {
             50: 'var(--color-primary-50)',
             500: 'var(--color-primary-500)',
             // ...
           }
         },
         borderRadius: {
           sm: 'var(--radius-sm)',
           '2xl': 'var(--radius-2xl)',
           // ...
         }
       }
     }
   }
   ```

4. **Supprimer le `!important` de dark-theme.css**
   - Réécrire les styles sans surcharges brutales

**Impact :** Cohérence visuelle, thématisation complète, maintenance simplifiée

---

#### 🟠 **PRIORITÉ 4 : Refactoriser les composants volumineux**

**Objectif :** Tous les composants <300 lignes

**Composants à refactoriser :**

| Composant | Lignes actuelles | Actions |
|-----------|------------------|---------|
| **Contrats.tsx** | 1341 | Extraire : KPITile, SimpleBarChart, Tableau, Filtres |
| **AdminDashboard.tsx** | 866 | Extraire : UserManagement, AccessRequests, StatsCards |
| **DataImport.tsx** | 630 | Extraire : UploadZone, MappingTable, PreviewTable |
| **Dashboard.tsx** (an01) | 733 | Extraire : OffersTable, ExportButtons, Pagination |

**Pattern recommandé :**

```
components/contrats/
  ├── ContratsPage.tsx         # Composant principal (<200 lignes)
  ├── KPISection.tsx            # KPIs
  ├── FiltersPanel.tsx          # Filtres
  ├── ContratsTable.tsx         # Tableau
  ├── ContratDetailsModal.tsx   # Modale détails
  └── hooks/
      └── useContratsData.ts    # Logique métier
```

---

#### 🟡 **PRIORITÉ 5 : Centraliser le parsing de fichiers**

**Objectif :** 1 seul service de parsing par type de fichier

**Actions recommandées :**

```
services/
  ├── parsers/
  │   ├── csvParser.ts          # Parse CSV générique
  │   ├── excelParser.ts        # Parse Excel générique
  │   ├── pdfParser.ts          # Parse PDF générique
  │   └── index.ts              # Export centralisé
```

**Avantage :** Réutilisabilité, tests unitaires faciles

---

#### 🟡 **PRIORITÉ 6 : Ajouter des tests**

**Objectif :** Couvrir au minimum les hooks et services critiques

**Tests prioritaires :**

1. **Hooks personnalisés**
   - `useProjects.test.ts`
   - `useAuth.test.ts`
   - `useContratsData.test.ts`

2. **Services Supabase**
   - `projects.test.ts` (mock Supabase)
   - `auth.test.ts`

3. **Parsers**
   - `csvParser.test.ts`
   - `excelParser.test.ts`

**Setup :**
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

---

### 6.2 Feuille de route suggérée (6 mois)

| Phase | Durée | Objectifs | Livrables |
|-------|-------|-----------|-----------|
| **Phase 1** | 1 mois | Décomposer App.tsx | Composants extraits, React Router, services Supabase |
| **Phase 2** | 1 mois | Centraliser l'état | Zustand stores, hooks personnalisés |
| **Phase 3** | 2 mois | Unifier le styling | Design system intégré, Tailwind configuré, couleurs hardcodées supprimées |
| **Phase 4** | 1 mois | Refactoriser composants | Contrats, AdminDashboard, DataImport, Dashboard (an01) |
| **Phase 5** | 2 semaines | Centraliser parsers | Service de parsing unifié |
| **Phase 6** | 2 semaines | Tests | Couverture minimale (hooks + services) |

---

### 6.3 Quick wins (gains rapides <1 semaine)

| Action | Impact | Effort |
|--------|--------|--------|
| **Configurer alias TypeScript** (`@/lib`, `@/components`) | Imports moins fragiles | 🟢 Faible |
| **Supprimer ThemeContext.tsx** (ancien provider) | Réduire confusion | 🟢 Faible |
| **Remplacer 5 couleurs hardcodées** (les plus visibles) | Thématisation partielle | 🟢 Faible |
| **Extraire SearchableSelect en composant** | Réutilisabilité | 🟢 Faible |
| **Documenter les constantes métier** | Compréhension | 🟢 Faible |

---

## 📊 Résumé exécutif

### Points forts ✅

- **Stack moderne** : React 19, TypeScript, Vite, Supabase
- **Design system complet** : `design-system/` bien structuré (tokens, composants, hooks)
- **Modules métier identifiés** : auth/, an01/, contrats, retraits, dépôts
- **Authentification fonctionnelle** : Supabase Auth + RLS
- **Versioning implémenté** : version.json, scripts, AppVersion component
- **Documentation solide** : README, AUTH_SETUP, TEST_GUIDE, IMPORT_MODULE

### Points critiques 🔴

- **App.tsx monolithique** : 4199 lignes, 20+ useState, toute la logique métier
- **Pas de routing** : Navigation par état local, pas d'URL mapping
- **Pas de gestion d'état centralisée** : Props drilling, état dupliqué
- **3 systèmes de styling** : index.css, dark-theme.css, design-system (non utilisé)
- **Couleurs hardcodées** : 20+ `bg-[#...]` → thématisation bloquée
- **Composants volumineux** : Contrats (1341L), AdminDashboard (866L), DataImport (630L)
- **Pas de tests** : Aucune couverture de test

### Recommandations immédiates

1. **Décomposer App.tsx** → passer à <500 lignes (React Router + services + hooks)
2. **Adopter Zustand** → centraliser l'état global
3. **Migrer vers le design system** → supprimer index.css/dark-theme.css
4. **Refactoriser les 4 composants >600 lignes** → pattern "page + sous-composants + hook"
5. **Ajouter tests unitaires** → hooks + services prioritaires

### Métriques

| Métrique | Valeur actuelle | Cible | Priorité |
|----------|----------------|-------|----------|
| **Lignes App.tsx** | 4199 | <500 | 🔴 Critique |
| **Composants >500 lignes** | 5 | 0 | 🔴 Critique |
| **Systèmes de styling** | 3 | 1 | 🟠 Élevée |
| **Couleurs hardcodées** | 20+ | 0 | 🟠 Élevée |
| **Couverture de tests** | 0% | 60% | 🟡 Moyenne |
| **Imports relatifs** | 100% | 0% (alias) | 🟡 Moyenne |

---

**Audit réalisé le :** Janvier 2025  
**Prochaine révision suggérée :** Après Phase 1 (décomposition App.tsx)
