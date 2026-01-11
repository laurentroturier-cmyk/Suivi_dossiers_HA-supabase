/**
 * Hook de gestion de l'historique de navigation interne
 * 
 * Permet de :
 * - Empiler les états de navigation (pages visitées)
 * - Naviguer en arrière sans utiliser les boutons du navigateur
 * - Retourner au menu principal à tout moment
 * - Empêcher les navigations circulaires infinies
 * 
 * @example
 * const { goBack, goToHome, canGoBack, pushNavigation } = useNavigationHistory();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { TableType } from '../types';

/**
 * Interface représentant un état de navigation
 */
export interface NavigationState {
  /** Type de page/tab actif */
  tab: TableType;
  /** Titre de la page pour affichage */
  title: string;
  /** Sous-onglet actif (optionnel) */
  subTab?: string;
  /** Section spécifique (optionnel) */
  section?: string;
  /** Timestamp de création pour éviter les doublons */
  timestamp: number;
}

/**
 * Options de configuration du hook
 */
interface UseNavigationHistoryOptions {
  /** Page d'accueil par défaut */
  homePage?: TableType;
  /** Titre de la page d'accueil */
  homeTitle?: string;
  /** Taille maximale de l'historique (prévention des fuites mémoire) */
  maxHistorySize?: number;
  /** Callback appelé lors d'un changement de page */
  onNavigate?: (state: NavigationState) => void;
}

/**
 * Hook personnalisé pour gérer l'historique de navigation
 */
export const useNavigationHistory = (options: UseNavigationHistoryOptions = {}) => {
  const {
    homePage = 'home' as TableType,
    homeTitle = 'Accueil',
    maxHistorySize = 50,
    onNavigate,
  } = options;

  // Pile d'historique de navigation
  const [history, setHistory] = useState<NavigationState[]>([]);
  
  // État actuel de la navigation
  const [currentState, setCurrentState] = useState<NavigationState>({
    tab: homePage,
    title: homeTitle,
    timestamp: Date.now(),
  });

  // Référence pour éviter les effets de bord dans useEffect
  const isNavigatingRef = useRef(false);
  const navigationBlockedRef = useRef(false);

  /**
   * Empêche l'utilisation du bouton retour natif du navigateur
   * Intercepte l'événement popstate et empêche le comportement par défaut
   */
  useEffect(() => {
    const preventNativeNavigation = (e: PopStateEvent) => {
      if (!navigationBlockedRef.current) {
        e.preventDefault();
        window.history.pushState(null, '', window.location.pathname);
        console.warn('⚠️ Navigation native bloquée - Utilisez les boutons de l\'application');
      }
    };

    // Pousser un état initial pour bloquer le retour arrière
    window.history.pushState(null, '', window.location.pathname);
    
    window.addEventListener('popstate', preventNativeNavigation);

    // Message de confirmation si l'utilisateur tente de quitter
    const beforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    window.addEventListener('beforeunload', beforeUnload);

    return () => {
      window.removeEventListener('popstate', preventNativeNavigation);
      window.removeEventListener('beforeunload', beforeUnload);
    };
  }, []);

  /**
   * Vérifie si deux états de navigation sont identiques
   * Évite les doublons dans l'historique
   */
  const areStatesEqual = useCallback((state1: NavigationState, state2: NavigationState): boolean => {
    return (
      state1.tab === state2.tab &&
      state1.subTab === state2.subTab &&
      state1.section === state2.section
    );
  }, []);

  /**
   * Ajoute un nouvel état à l'historique de navigation
   * 
   * @param tab - Type de page à naviguer
   * @param title - Titre de la page
   * @param subTab - Sous-onglet optionnel
   * @param section - Section optionnelle
   */
  const pushNavigation = useCallback((
    tab: TableType,
    title: string,
    subTab?: string,
    section?: string
  ) => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const newState: NavigationState = {
      tab,
      title,
      subTab,
      section,
      timestamp: Date.now(),
    };

    setHistory((prevHistory) => {
      // Ne pas empiler si on est déjà sur cette page
      if (areStatesEqual(currentState, newState)) {
        isNavigatingRef.current = false;
        return prevHistory;
      }

      // Ajouter l'état actuel à l'historique avant de naviguer
      const updatedHistory = [...prevHistory, currentState];

      // Limiter la taille de l'historique
      if (updatedHistory.length > maxHistorySize) {
        updatedHistory.shift(); // Supprimer le plus ancien
      }

      return updatedHistory;
    });

    setCurrentState(newState);
    
    if (onNavigate) {
      onNavigate(newState);
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [currentState, maxHistorySize, onNavigate, areStatesEqual]);

  /**
   * Retourne à l'état précédent dans l'historique
   * 
   * @returns true si la navigation a réussi, false sinon
   */
  const goBack = useCallback((): boolean => {
    if (isNavigatingRef.current || history.length === 0) {
      return false;
    }

    isNavigatingRef.current = true;

    setHistory((prevHistory) => {
      if (prevHistory.length === 0) {
        isNavigatingRef.current = false;
        return prevHistory;
      }

      // Récupérer et retirer le dernier état
      const newHistory = [...prevHistory];
      const previousState = newHistory.pop();

      if (previousState) {
        setCurrentState(previousState);
        
        if (onNavigate) {
          onNavigate(previousState);
        }
      }

      setTimeout(() => {
        isNavigatingRef.current = false;
      }, 100);

      return newHistory;
    });

    return true;
  }, [history.length, onNavigate]);

  /**
   * Retourne directement au menu principal
   * Vide l'historique de navigation
   */
  const goToHome = useCallback(() => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;

    const homeState: NavigationState = {
      tab: homePage,
      title: homeTitle,
      timestamp: Date.now(),
    };

    // Vider l'historique et retourner à l'accueil
    setHistory([]);
    setCurrentState(homeState);

    if (onNavigate) {
      onNavigate(homeState);
    }

    setTimeout(() => {
      isNavigatingRef.current = false;
    }, 100);
  }, [homePage, homeTitle, onNavigate]);

  /**
   * Vérifie si on peut naviguer en arrière
   */
  const canGoBack = history.length > 0;

  /**
   * Vérifie si on est sur la page d'accueil
   */
  const isHome = currentState.tab === homePage;

  /**
   * Obtient le chemin de navigation actuel (breadcrumb)
   */
  const getBreadcrumb = useCallback((): NavigationState[] => {
    return [...history, currentState];
  }, [history, currentState]);

  /**
   * Efface l'historique sans changer la page actuelle
   * Utile pour réinitialiser après une action majeure
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    // États
    currentState,
    history,
    canGoBack,
    isHome,
    
    // Actions
    pushNavigation,
    goBack,
    goToHome,
    clearHistory,
    getBreadcrumb,
  };
};

export default useNavigationHistory;
