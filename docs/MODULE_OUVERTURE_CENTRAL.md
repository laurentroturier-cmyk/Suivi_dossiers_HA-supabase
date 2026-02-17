# Module Ouverture Central - Documentation

**Date de création :** 17 février 2026  
**Version :** 1.0.0

## 📋 Vue d'ensemble

Le **Module Ouverture Central** regroupe trois fonctionnalités précédemment séparées en une unité logique cohérente :

1. **Registre des retraits** - Consultation des entreprises ayant retiré le DCE
2. **Registre des dépôts** - Consultation des candidatures déposées
3. **Ouverture des plis** - Analyse des candidatures et recevabilité des offres

## 🎯 Objectifs

- **Centraliser** les trois modules liés au processus d'ouverture des plis
- **Mémoriser** automatiquement le numéro de procédure extrait des registres
- **Faciliter** la navigation entre les différentes étapes du workflow
- **Proposer** automatiquement le chargement de la procédure mémorisée
- **Conserver** la flexibilité de charger manuellement une autre procédure

## 🏗️ Architecture

### Composant principal : `ModuleOuvertureCentral.tsx`

Ce composant gère :
- L'**affichage de la page d'accueil** avec 3 tuiles de navigation
- Le **routage interne** entre les 4 vues (home, retraits, dépôts, ouverture-plis)
- La **mémorisation du numéro de procédure** (5 chiffres) extrait des registres
- La **communication** entre les sous-modules

### Props du composant

```typescript
interface ModuleOuvertureCentralProps {
  onBack: () => void;                          // Retour vers l'écran précédent (ex: Accueil)
  supabaseClient: SupabaseClient | null;       // Client Supabase pour les requêtes
  procedures: any[];                            // Liste des procédures
  dossiers: any[];                              // Liste des dossiers
  onOpenProcedure?: (numeroAfpa: string) => void; // Callback pour ouvrir une procédure
  onProcedureUpdated?: () => void;             // Callback après mise à jour d'une procédure
  initialView?: ViewType;                       // Vue initiale à afficher ('home' | 'retraits' | 'depots' | 'ouverture-plis')
}
```

## 🔄 Workflow utilisateur

### Scénario 1 : Via l'onglet "Ouverture des plis"

1. L'utilisateur clique sur **"Ouverture des plis"** dans le menu
2. Il arrive sur la **page d'accueil** du module avec 3 tuiles
3. Il choisit une tuile :
   - **Registre des retraits** → Charge et consulte les retraits
   - **Registre des dépôts** → Charge et consulte les dépôts
   - **Ouverture des plis** → Accès direct à l'analyse

### Scénario 2 : Via l'onglet "Registre des retraits"

1. L'utilisateur clique sur **"Registre des retraits"** dans le menu
2. Il arrive **directement** sur la vue du registre des retraits
3. Il charge un fichier PDF contenant le registre
4. Le **numéro de procédure (5 chiffres)** est automatiquement extrait et mémorisé
5. Un bouton **"Continuer vers l'ouverture (25006)"** apparaît dans le header
6. En cliquant, il accède à l'ouverture des plis avec le numéro pré-rempli
7. Il peut aussi cliquer sur le **bouton retour** pour revenir à la page d'accueil du module

### Scénario 3 : Via l'onglet "Registre des dépôts"

Identique au scénario 2, mais pour les dépôts.

## 💡 Fonctionnalités clés

### 1. Mémorisation du numéro de procédure

Lorsqu'un registre (retraits ou dépôts) est chargé :

```typescript
const handleRegistreLoaded = (reference: string, source: 'retraits' | 'depots') => {
  const numero = extractNumeroAfpa(reference); // Ex: "25006"
  if (numero) {
    setMemorizedNumero(numero);
    setFromRegistre(source);
  }
};
```

Le numéro est extrait via regex : `/^(\d{5})/`

### 2. Indicateur visuel du numéro mémorisé

Dans les registres (avant et après chargement), un encadré bleu indique :
- Le **numéro mémorisé** (ex: 25006)
- La **source** (depuis le registre des retraits/dépôts)
- Un **bouton "Aller à l'ouverture"** pour continuer

### 3. Navigation retour intelligente

Chaque sous-module (retraits, dépôts, ouverture-plis) affiche :
- Un **bouton retour** (flèche ←) pour revenir à la page d'accueil du module
- Un **bouton "Continuer vers l'ouverture"** quand un numéro est mémorisé

### 4. Proposition automatique dans l'ouverture des plis

Lorsque l'utilisateur arrive dans l'ouverture des plis avec un numéro mémorisé :
- Le champ de recherche est **pré-rempli** avec le numéro
- La procédure est **automatiquement chargée** (si elle existe)
- L'utilisateur peut **toujours modifier** le numéro pour charger une autre procédure

## 📂 Fichiers modifiés

### Nouveaux fichiers

- **`components/ModuleOuvertureCentral.tsx`** (principal)

### Fichiers modifiés

1. **`components/RegistreRetraits.tsx`**
   - Ajout des props : `onBack`, `onNavigateToOuverturePlis`, `memorizedNumero`
   - Ajout du bouton retour dans le header
   - Ajout de l'indicateur de numéro mémorisé
   - Notification au parent lors du chargement d'un fichier

2. **`components/RegistreDepots.tsx`**
   - Modifications identiques au registre des retraits

3. **`App.tsx`**
   - Ajout de l'import de `ModuleOuvertureCentral`
   - Remplacement des 3 onglets séparés par le module centralisé avec `initialView`

## 🎨 Design

### Page d'accueil du module

- **3 tuiles** stylisées avec animations au survol
- Couleurs distinctes pour chaque tuile :
  - Bleu pour les retraits
  - Vert pour les dépôts
  - Violet pour l'ouverture des plis
- **Indicateur de numéro mémorisé** au-dessus des tuiles (si disponible)
- **Section informative** en bas avec le workflow recommandé

### Headers des registres

- **Bouton retour** discret à gauche
- **Logo et titre** du registre
- **Bouton "Continuer vers l'ouverture"** bien visible (violet) quand un numéro est mémorisé
- Design cohérent entre retraits et dépôts

## 🔧 Intégration dans l'application

Dans `App.tsx`, les 3 onglets utilisent maintenant le même composant avec des vues initiales différentes :

```tsx
// Onglet "Registre des retraits"
{activeTab === 'retraits' && (
  <ModuleOuvertureCentral
    initialView="retraits"
    {...otherProps}
  />
)}

// Onglet "Registre des dépôts"
{activeTab === 'depots' && (
  <ModuleOuvertureCentral
    initialView="depots"
    {...otherProps}
  />
)}

// Onglet "Ouverture des plis"
{activeTab === 'ouverture-plis' && (
  <ModuleOuvertureCentral
    initialView="home"  // Page d'accueil avec tuiles
    {...otherProps}
  />
)}
```

## ✅ Avantages de cette architecture

1. **Cohérence** : Les 3 modules sont unifiés conceptuellement
2. **Flexibilité** : Chaque onglet peut charger directement sa vue ou la page d'accueil
3. **UX améliorée** : Le workflow est guidé avec mémorisation automatique
4. **Maintenabilité** : Code centralisé et réutilisable
5. **Rétrocompatibilité** : Les anciennes fonctionnalités sont préservées

## 🚀 Utilisation

### Pour l'utilisateur final

**Cas d'usage typique :**

1. Clic sur "Registre des retraits"
2. Upload du PDF du registre → numéro 25006 mémorisé
3. Clic sur "Continuer vers l'ouverture (25006)"
4. Analyse automatiquement chargée pour la procédure 25006
5. Validation des candidatures et recevabilité

**Alternative :**

1. Clic sur "Ouverture des plis" (page d'accueil)
2. Choix entre les 3 tuiles selon le besoin
3. Navigation fluide entre les vues

### Pour le développeur

Le module est totalement autonome. Pour l'intégrer ailleurs :

```tsx
import ModuleOuvertureCentral from './components/ModuleOuvertureCentral';

<ModuleOuvertureCentral
  onBack={() => console.log('Retour')}
  supabaseClient={supabase}
  procedures={[...]}
  dossiers={[...]}
  initialView="home"  // ou "retraits" | "depots" | "ouverture-plis"
/>
```

## 📝 Notes techniques

### Extraction du numéro AFPA

Le numéro court (5 chiffres) est extrait des références de procédure via :

```typescript
const extractNumeroAfpa = (reference: string): string | null => {
  const match = reference.match(/^(\d{5})/);
  return match ? match[1] : null;
};
```

**Exemples :**
- `"25006-2024-AFPA"` → `"25006"`
- `"24128 DCE"` → `"24128"`
- `"PROC-123"` → `null` (pas de match)

### Réinitialisation de la vue

Quand l'utilisateur change d'onglet dans le menu principal, la vue est automatiquement réinitialisée :

```typescript
React.useEffect(() => {
  setCurrentView(initialView);
}, [initialView]);
```

Cela évite de rester bloqué dans une vue interne après avoir changé d'onglet.

## 🐛 Points d'attention

1. **Numéro mémorisé** : Reste en mémoire tant que le composant n'est pas démonté
2. **Props optionnelles** : `onBack`, `onNavigateToOuverturePlis` sont optionnelles pour rétrocompatibilité
3. **Compatibilité** : Les anciens composants `RegistreRetraits` et `RegistreDepots` peuvent toujours être utilisés seuls

## 🔮 Évolutions futures possibles

1. Sauvegarder le numéro mémorisé dans le localStorage
2. Ajouter un historique des procédures récemment consultées
3. Permettre de mémoriser plusieurs numéros simultanément
4. Ajouter des raccourcis clavier pour la navigation

---

**Auteur :** GitHub Copilot  
**Modèle :** Claude Sonnet 4.5  
**Dernière mise à jour :** 17 février 2026
