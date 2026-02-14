/**
 * Composant de contrôles de navigation interne
 * 
 * Affiche les boutons de navigation (Retour, Accueil) de manière contextuelle
 * Remplace l'utilisation des boutons natifs du navigateur
 * 
 * @example
 * <NavigationControls
 *   onBack={goBack}
 *   onHome={goToHome}
 *   canGoBack={canGoBack}
 *   isHome={isHome}
 *   currentPageTitle="Détails du projet"
 * />
 */

import React from 'react';
import { Home, ChevronLeft, X } from 'lucide-react';

interface NavigationControlsProps {
  /** Callback pour le bouton retour */
  onBack: () => void;
  /** Callback pour le bouton accueil */
  onHome: () => void;
  /** Indique si on peut naviguer en arrière */
  canGoBack: boolean;
  /** Indique si on est sur la page d'accueil */
  isHome: boolean;
  /** Titre de la page actuelle (optionnel) */
  currentPageTitle?: string;
  /** Classe CSS personnalisée (optionnel) */
  className?: string;
  /** Mode d'affichage : 'full' | 'minimal' */
  mode?: 'full' | 'minimal';
  /** Afficher le fil d'Ariane */
  showBreadcrumb?: boolean;
  /** Données du fil d'Ariane */
  breadcrumb?: Array<{ title: string; onClick?: () => void }>;
}

/**
 * Composant de contrôles de navigation
 */
export const NavigationControls: React.FC<NavigationControlsProps> = ({
  onBack,
  onHome,
  canGoBack,
  isHome,
  currentPageTitle,
  className = '',
  mode = 'full',
  showBreadcrumb = false,
  breadcrumb = [],
}) => {
  // Mode minimal : uniquement les icônes
  if (mode === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {!isHome && canGoBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Retour"
            aria-label="Retour à la page précédente"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        {!isHome && (
          <button
            onClick={onHome}
            className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            title="Accueil"
            aria-label="Retour au menu principal"
          >
            <Home className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
      </div>
    );
  }

  // Mode complet : avec labels et fil d'Ariane
  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Boutons de navigation */}
          <div className="flex items-center gap-3">
            {/* Bouton Retour */}
            {!isHome && canGoBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold transition-all hover:shadow-md"
                aria-label="Retour à la page précédente"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Retour</span>
              </button>
            )}

            {/* Bouton Accueil */}
            {!isHome && (
              <button
                onClick={onHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-b from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white font-semibold transition-all shadow-lg shadow-blue-400/30"
                aria-label="Retour au menu principal"
              >
                <Home className="w-5 h-5" />
                <span className="hidden sm:inline">Menu Principal</span>
              </button>
            )}

            {/* Séparateur */}
            {!isHome && (canGoBack || showBreadcrumb) && (
              <div className="h-8 w-px bg-gray-300 dark:bg-gray-600 mx-2" />
            )}

            {/* Titre de la page ou fil d'Ariane */}
            {showBreadcrumb && breadcrumb.length > 0 ? (
              <nav className="flex items-center gap-2 text-sm" aria-label="Fil d'Ariane">
                {breadcrumb.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && (
                      <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                    )}
                    {crumb.onClick ? (
                      <button
                        onClick={crumb.onClick}
                        className="text-gray-600 dark:text-gray-400 hover:text-[#004d3d] dark:hover:text-[#00d9a3] font-medium transition-colors"
                      >
                        {crumb.title}
                      </button>
                    ) : (
                      <span className="text-gray-900 dark:text-white font-bold">
                        {crumb.title}
                      </span>
                    )}
                  </React.Fragment>
                ))}
              </nav>
            ) : currentPageTitle ? (
              <h1 className="text-lg font-bold text-gray-900 dark:text-white">
                {currentPageTitle}
              </h1>
            ) : null}
          </div>

          {/* Zone droite : indicateurs optionnels */}
          <div className="flex items-center gap-2">
            {/* Indicateur de position dans l'historique (dev mode) */}
            {process.env.NODE_ENV === 'development' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                Historique: {breadcrumb.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Composant compact de navigation flottante
 * Version épurée pour les modals ou vues secondaires
 */
export const FloatingNavigationControls: React.FC<{
  onBack?: () => void;
  onClose?: () => void;
  title?: string;
}> = ({ onBack, onClose, title }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Retour"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        )}
        {title && (
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {title}
          </h2>
        )}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Fermer"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      )}
    </div>
  );
};

export default NavigationControls;
