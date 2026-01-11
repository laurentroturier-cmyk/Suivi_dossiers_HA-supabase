# Guide d'intégration du système de navigation interne

## 📋 Vue d'ensemble

Ce système de navigation interne remplace l'utilisation des boutons natifs du navigateur (retour/avancer) et maintient l'utilisateur dans l'interface de l'application.

## 🎯 Objectifs atteints

✅ Gestionnaire d'historique personnalisé avec pile de navigation  
✅ Boutons de navigation intégrés (Retour, Menu principal)  
✅ Gestion propre des transitions entre pages  
✅ Prévention de l'utilisation des boutons natifs du navigateur  
✅ Gestion des cas limites (première page, accueil, etc.)  
✅ Code modulaire avec séparation des responsabilités  
✅ Gestion d'erreurs explicite  
✅ Commentaires clairs en français  
✅ Performance optimisée (pas de rechargement)  

## 📁 Fichiers créés

### 1. `hooks/useNavigationHistory.ts`
Hook personnalisé React qui gère :
- L'historique de navigation (pile d'états)
- Le blocage des boutons natifs du navigateur
- Les fonctions de navigation (retour, accueil)
- La prévention des navigations circulaires

### 2. `components/NavigationControls.tsx`
Composant d'interface qui fournit :
- Bouton "Retour" (vers la page précédente)
- Bouton "Menu Principal" (vers l'accueil)
- Fil d'Ariane optionnel
- Version compacte pour les modals

### 3. `NAVIGATION_GUIDE.md`
Ce guide d'intégration

## 🔧 Intégration dans App.tsx

### Étape 1 : Importer les dépendances

```typescript
import { useNavigationHistory, NavigationState } from './hooks/useNavigationHistory';
import NavigationControls from './components/NavigationControls';
```

### Étape 2 : Initialiser le hook dans App.tsx

```typescript
function App() {
  const [activeTab, setActiveTab] = useState<TableType>('home');
  const [activeSubTab, setActiveSubTab] = useState<string>('');

  // Initialiser le système de navigation
  const {
    currentState,
    history,
    canGoBack,
    isHome,
    pushNavigation,
    goBack,
    goToHome,
    getBreadcrumb,
  } = useNavigationHistory({
    homePage: 'home',
    homeTitle: 'Accueil',
    maxHistorySize: 50,
    onNavigate: (state: NavigationState) => {
      // Synchroniser avec les états existants
      setActiveTab(state.tab);
      if (state.subTab) {
        setActiveSubTab(state.subTab);
      }
      if (state.section) {
        setRedactionSection(state.section as any);
      }
    },
  });

  // Fonction de navigation mise à jour
  const navigateTo = useCallback((
    tab: TableType,
    title: string,
    subTab?: string,
    section?: string
  ) => {
    pushNavigation(tab, title, subTab, section);
  }, [pushNavigation]);

  // ... reste du code
}
```

### Étape 3 : Ajouter les contrôles de navigation dans l'interface

```typescript
return (
  <div className="App">
    {/* Contrôles de navigation en haut de page */}
    <NavigationControls
      onBack={goBack}
      onHome={goToHome}
      canGoBack={canGoBack}
      isHome={isHome}
      currentPageTitle={currentState.title}
      mode="full"
      showBreadcrumb={true}
      breadcrumb={getBreadcrumb().map((state, index) => ({
        title: state.title,
        onClick: index < getBreadcrumb().length - 1 
          ? () => {
              // Navigation vers cet état spécifique
              // (implémentation selon vos besoins)
            }
          : undefined
      }))}
    />

    {/* Contenu de votre application */}
    <main>
      {activeTab === 'home' && <LandingPage onNavigate={navigateTo} />}
      {activeTab === 'dossiers' && <DossiersView />}
      {/* ... autres vues */}
    </main>
  </div>
);
```

### Étape 4 : Remplacer les setActiveTab par navigateTo

**Avant :**
```typescript
<button onClick={() => setActiveTab('dossiers')}>
  Voir les projets
</button>
```

**Après :**
```typescript
<button onClick={() => navigateTo('dossiers', 'Projets')}>
  Voir les projets
</button>
```

## 🎨 Personnalisation du style

Les composants utilisent vos classes Tailwind existantes. Vous pouvez personnaliser :

```typescript
// Mode minimal (icônes uniquement)
<NavigationControls mode="minimal" />

// Mode complet avec fil d'Ariane
<NavigationControls 
  mode="full" 
  showBreadcrumb={true}
  className="shadow-lg"
/>

// Version flottante pour modals
<FloatingNavigationControls
  onBack={goBack}
  onClose={() => setShowModal(false)}
  title="Détails du projet"
/>
```

## ⚙️ Configuration avancée

### Taille maximale de l'historique

```typescript
const navigation = useNavigationHistory({
  maxHistorySize: 100, // Défaut: 50
});
```

### Désactiver la confirmation de sortie

```typescript
// Dans useNavigationHistory.ts, commenter les lignes :
// window.addEventListener('beforeunload', beforeUnload);
```

### Permettre certaines navigations natives

```typescript
// Dans useNavigationHistory.ts, modifier preventNativeNavigation :
const preventNativeNavigation = (e: PopStateEvent) => {
  // Permettre la navigation native pour certaines URLs
  if (window.location.pathname === '/api/logout') {
    return;
  }
  e.preventDefault();
  window.history.pushState(null, '', window.location.pathname);
};
```

## 🐛 Débogage

### Mode développement

En mode développement, un indicateur affiche la taille de l'historique :

```typescript
{process.env.NODE_ENV === 'development' && (
  <span>Historique: {breadcrumb.length}</span>
)}
```

### Console logs

Le système émet des warnings quand l'utilisateur tente d'utiliser les boutons natifs :
```
⚠️ Navigation native bloquée - Utilisez les boutons de l'application
```

## 📊 Cas d'usage

### 1. Navigation simple entre pages

```typescript
// Aller à la page projets
navigateTo('dossiers', 'Projets');

// Aller au détail d'un projet avec sous-onglet
navigateTo('dossiers', 'Détail Projet', 'general');
```

### 2. Navigation avec sections

```typescript
// Ouvrir la rédaction sur une section spécifique
navigateTo('redaction', 'Rédaction DCE', undefined, 'section-2');
```

### 3. Retour programmé

```typescript
// Retourner à la page précédente
if (canGoBack) {
  goBack();
} else {
  goToHome();
}
```

### 4. Effacer l'historique après action

```typescript
// Après une sauvegarde importante
const handleSave = async () => {
  await saveData();
  clearHistory(); // Empêche le retour arrière
  goToHome();
};
```

## 🔒 Sécurité et performance

### Prévention des fuites mémoire
- Limitation de la taille de l'historique (maxHistorySize)
- Nettoyage automatique des états les plus anciens

### Prévention des boucles infinies
- Vérification des états identiques avant empilage
- Flag `isNavigatingRef` pour empêcher les navigations simultanées
- Timeout de 100ms entre navigations

### Prévention de sortie accidentelle
- Événement `beforeunload` pour confirmer la fermeture de l'onglet
- Blocage du `popstate` pour désactiver les boutons natifs

## 🧪 Tests recommandés

1. **Navigation basique** : Home → Projets → Détail → Retour → Retour
2. **Navigation rapide** : Cliquer rapidement sur plusieurs pages
3. **Navigation circulaire** : Page A → Page B → Page A (vérifier pas de doublon)
4. **Bouton natif** : Tester le bouton retour du navigateur (doit être bloqué)
5. **Rafraîchissement** : F5 sur une page interne (gérer la perte d'état)
6. **Fermeture onglet** : Vérifier le message de confirmation

## 🚀 Prochaines améliorations possibles

- [ ] Persistance de l'historique dans localStorage
- [ ] Support des routes URL (React Router integration)
- [ ] Animations de transition entre pages
- [ ] Gestion des états de formulaire non sauvegardés
- [ ] Raccourcis clavier (Alt+← pour retour)
- [ ] Analytics des parcours utilisateur

## 📞 Support

En cas de problème :
1. Vérifier les imports dans App.tsx
2. Vérifier que `TableType` inclut toutes les pages
3. Consulter la console pour les warnings
4. Vérifier que `onNavigate` synchronise bien les états

---

**Version :** 1.0.0  
**Dernière mise à jour :** Janvier 2026  
**Compatibilité :** React 18+, TypeScript 4.5+
