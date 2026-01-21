# Guide de réorganisation du Dashboard - Architecture Accordion

**Date**: 21 janvier 2026  
**Version**: 2.0 - Séparation Projets/Procédures

## 🎯 Objectif

Résoudre la confusion des utilisateurs concernant les filtres du tableau de bord en séparant clairement les sections **Projets** et **Procédures** avec une architecture Accordion.

## ❌ Problème initial

Les utilisateurs ne comprenaient pas que :
- Les filtres "Année de déploiement" affectent uniquement les **projets**
- Les filtres "Année de lancement" affectent uniquement les **procédures**
- Les deux sections partagent certains filtres (acheteur, famille, type procédure) mais pas tous

Résultat : confusion et incompréhension lors de l'utilisation des filtres.

## ✅ Solution implémentée : Proposition 4 (Accordion)

### Architecture

```
┌─────────────────────────────────────────────────┐
│  📊 INDICATEURS GLOBAUX (non filtrés)          │
│  5 KPI principaux                               │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🔵 SECTION PROJETS (Accordion bleu)            │
│  ▼ 🏗️ Projets | 209 projets | 6 filtres actifs │
│  ┌───────────────────────────────────────────┐ │
│  │ 💡 Ces filtres affectent UNIQUEMENT       │ │
│  │    les données projets ci-dessous         │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔍 FILTRES PROJETS                        │ │
│  │ • Acheteur                                │ │
│  │ • Priorité                                │ │
│  │ • Famille d'achat                         │ │
│  │ • Année de Déploiement                    │ │
│  │ • Statut projet                           │ │
│  │ [Bouton: Réinitialiser]                   │ │
│  └───────────────────────────────────────────┘ │
│  📊 4 graphiques projets                       │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🟢 SECTION PROCÉDURES (Accordion vert)         │
│  ▼ 📋 Procédures | 641 procédures | 0 filtre   │
│  ┌───────────────────────────────────────────┐ │
│  │ 💡 Ces filtres affectent UNIQUEMENT       │ │
│  │    les données procédures ci-dessous      │ │
│  └───────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────┐ │
│  │ 🔍 FILTRES PROCÉDURES                     │ │
│  │ • Type de procédure                       │ │
│  │ • Année de Lancement                      │ │
│  │ • Statut procédure                        │ │
│  │ [Bouton: Réinitialiser]                   │ │
│  └───────────────────────────────────────────┘ │
│  📊 8 graphiques procédures                    │
└─────────────────────────────────────────────────┘
```

## 🎨 Caractéristiques visuelles

### Codes couleurs

| Section | Couleur principale | Couleur secondaire | Icône |
|---------|-------------------|-------------------|-------|
| Projets | Bleu (#3B82F6) | Cyan | 🏗️ |
| Procédures | Vert (#10B981) | Émeraude | 📋 |
| Globaux | Gris ardoise | - | 📊 |

### Éléments interactifs

1. **Headers d'accordion**
   - Cliquables pour replier/déplier
   - Badges de comptage animés
   - Chevrons haut/bas
   - Effet hover subtil

2. **Messages explicatifs**
   - Icône `AlertCircle` de lucide-react
   - Fond coloré selon la section
   - Texte clair et direct

3. **Badges de filtres actifs**
   - Couleur orange avec animation pulse
   - Compteur dynamique
   - Visible en permanence dans le header

4. **Boutons de réinitialisation**
   - Contextuels à chaque section
   - Visible uniquement si filtres actifs
   - Icône `X` claire

## 📁 Fichiers modifiés

### 1. `/pages/DashboardPage.tsx` (NOUVEAU)

**Rôle**: Composant principal du dashboard avec architecture accordion

**Props principales**:
```typescript
interface DashboardPageProps {
  // Données
  kpis: any;
  
  // Filtres projets
  selectedAcheteurs: string[];
  selectedPriorities: string[];
  selectedFamilies: string[];
  selectedDeployYears: string[];
  selectedStatuses: string[];
  
  // Handlers projets
  onToggleAcheteur: (val: string) => void;
  onTogglePriority: (val: string) => void;
  onToggleFamily: (val: string) => void;
  onToggleDeployYear: (val: string) => void;
  onToggleDossierStatus: (val: string) => void;
  onResetProjectFilters: () => void;
  
  // Filtres procédures
  selectedProcTypes: string[];
  selectedYears: string[];
  selectedProcedureStatuses: string[];
  
  // Handlers procédures
  onToggleProcType: (val: string) => void;
  onToggleYear: (val: string) => void;
  onToggleProcedureStatus: (val: string) => void;
  onResetProcedureFilters: () => void;
  
  // Composants
  FilterDropdown: React.FC<any>;
  SimpleBarChart: React.FC<any>;
  KPITile: React.FC<any>;
  
  // Options
  refAcheteurs: any[];
  priorityOptions: string[];
  uniqueFamilies: string[];
  // ... etc
}
```

**États internes**:
```typescript
const [projectsSectionExpanded, setProjectsSectionExpanded] = useState(true);
const [proceduresSectionExpanded, setProceduresSectionExpanded] = useState(true);
```

### 2. `/App.tsx` (MODIFIÉ)

**Modifications**:

1. **Import ajouté** (ligne ~58):
```typescript
import DashboardPage from './pages/DashboardPage';
```

2. **Nouvelles fonctions de reset** (ligne ~1465):
```typescript
// Fonction de reset spécifique aux filtres PROJETS
const resetProjectFilters = () => {
  setSelectedAcheteurs([]);
  setSelectedFamilies([]);
  setSelectedPriorities([]);
  setSelectedDeployYears([]);
  setSelectedStatuses(DOSSIER_STATUS_OPTIONS.filter(s => !s.startsWith('4') && !s.startsWith('5')));
};

// Fonction de reset spécifique aux filtres PROCÉDURES
const resetProcedureFilters = () => {
  setSelectedProcTypes([]);
  setSelectedYears([]);
  setSelectedProcedureStatuses([]);
  setLaunchFrom('');
  setLaunchTo('');
  setDeployFrom('');
  setDeployTo('');
};
```

3. **Remplacement du rendu dashboard** (ligne ~2799):
```typescript
{activeTab === 'dashboard' && (
  <DashboardPage
    kpis={kpis}
    // ... toutes les props
  />
)}
```

## 🚀 Avantages de cette architecture

### Pour les utilisateurs

1. **Clarté immédiate**: Les couleurs et icônes identifient clairement chaque section
2. **Impossible de se tromper**: Messages explicites à chaque section
3. **Feedback permanent**: Badges de comptage toujours visibles
4. **Focus possible**: Peut replier une section pour se concentrer sur l'autre
5. **Réinitialisation facile**: Boutons contextuels par section

### Pour les développeurs

1. **Séparation des préoccupations**: Filtres projets et procédures bien séparés
2. **Composant réutilisable**: `DashboardPage` peut être utilisé ailleurs
3. **Props typées**: Interface claire et documentée
4. **État local minimal**: Seulement les états d'expansion
5. **Maintenabilité**: Code plus lisible et organisé

## 📊 Données affichées

### KPI Globaux (toujours visibles, non filtrés)
- Nombre de projets
- Nombre de procédures
- Total montant projets
- Total montant procédures
- Moyenne montant projets

### Graphiques Projets (4)
1. Top Acheteurs (Projets)
2. Projets par Priorité
3. Projets par Statut
4. Projets par Client Interne

### Graphiques Procédures (8)
1. Top Acheteurs (Procédures)
2. Procédures par Type
3. Procédures par Statut
4. Montant Moyen par Type
5. Dispositions Environnementales
6. Dispositions Sociales
7. Projets Innovants
8. Projets TPE/PME

## 🧪 Test de l'implémentation

### Vérification visuelle

1. ✅ Les sections s'affichent avec les bonnes couleurs (bleu/vert)
2. ✅ Les badges de comptage sont visibles et corrects
3. ✅ Les messages explicatifs sont affichés
4. ✅ Les filtres actifs sont comptés correctement

### Test fonctionnel

1. **Replier/déplier les sections**
   - Cliquer sur le header de la section Projets
   - Vérifier que la section se replie
   - Cliquer à nouveau pour la déplier

2. **Appliquer des filtres projets**
   - Sélectionner un acheteur
   - Vérifier que le badge "filtres actifs" s'affiche
   - Vérifier que les graphiques projets sont filtrés
   - **IMPORTANT**: Vérifier que les graphiques procédures ne changent PAS

3. **Appliquer des filtres procédures**
   - Sélectionner un type de procédure
   - Vérifier que le badge "filtres actifs" s'affiche
   - Vérifier que les graphiques procédures sont filtrés
   - **IMPORTANT**: Vérifier que les graphiques projets ne changent PAS

4. **Réinitialiser par section**
   - Appliquer des filtres projets
   - Cliquer sur "Réinitialiser" dans la section Projets
   - Vérifier que seuls les filtres projets sont réinitialisés

### Test responsive

1. Desktop (>1280px): 4 colonnes pour les graphiques
2. Tablette (768-1280px): 2 colonnes pour les graphiques
3. Mobile (<768px): 1 colonne pour les graphiques

## 🔧 Maintenance future

### Ajouter un nouveau filtre projet

1. Ajouter le state dans `App.tsx`
2. Ajouter le toggle handler dans `App.tsx`
3. Ajouter dans `resetProjectFilters()`
4. Passer la prop à `DashboardPage`
5. Ajouter le `FilterDropdown` dans la section Projets

### Ajouter un nouveau filtre procédure

1. Ajouter le state dans `App.tsx`
2. Ajouter le toggle handler dans `App.tsx`
3. Ajouter dans `resetProcedureFilters()`
4. Passer la prop à `DashboardPage`
5. Ajouter le `FilterDropdown` dans la section Procédures

### Ajouter un nouveau graphique

1. Calculer les données dans `kpis` (`App.tsx`)
2. Ajouter le `SimpleBarChart` dans la section appropriée de `DashboardPage`

## 📝 Notes importantes

1. **KPI Globaux**: Ne sont jamais filtrés, toujours basés sur toutes les données
2. **État d'expansion**: Par défaut, les deux sections sont ouvertes
3. **Performance**: Aucun impact, les calculs KPI restent identiques
4. **Compatibilité**: Fonctionne avec le système de navigation existant
5. **Dark mode**: Tous les styles sont compatibles avec le dark mode

## 🎓 Formation utilisateurs

### Message clé
> "Les filtres bleus affectent les graphiques bleus, les filtres verts affectent les graphiques verts"

### Points à souligner
1. Les badges de comptage indiquent le nombre de filtres actifs
2. Le bouton "Réinitialiser" ne reset que les filtres de sa section
3. On peut replier une section pour mieux voir l'autre
4. Les KPI du haut ne sont jamais filtrés

## 📚 Références

- Composant principal: `/pages/DashboardPage.tsx`
- Intégration: `/App.tsx` (ligne ~2799)
- Icons: `lucide-react` (ChevronDown, ChevronUp, AlertCircle, X)
- Styles: Tailwind CSS avec palette bleu/vert/gris

---

**Auteur**: GitHub Copilot  
**Validation**: Prêt pour production
