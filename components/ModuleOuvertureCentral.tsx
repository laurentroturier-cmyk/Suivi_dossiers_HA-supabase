import React, { useState } from 'react';
import { ArrowLeft, PackageOpen, FileText, ClipboardCheck, ChevronRight } from 'lucide-react';
import { SupabaseClient } from '@supabase/supabase-js';
import RegistreRetraits from './RegistreRetraits';
import RegistreDepots from './RegistreDepots';
import { OuverturePlis } from './analyse';

interface ModuleOuvertureCentralProps {
  onBack: () => void;
  supabaseClient: SupabaseClient | null;
  procedures: any[];
  dossiers: any[];
  onOpenProcedure?: (numeroAfpa: string) => void;
  onProcedureUpdated?: () => void;
  /** Vue initiale à afficher au chargement */
  initialView?: ViewType;
}

type ViewType = 'home' | 'retraits' | 'depots' | 'ouverture-plis';

/**
 * Module central unifié pour l'ouverture des plis
 * Regroupe : Registre des retraits, Registre des dépôts, Analyse des candidatures/Recevabilité
 */
const ModuleOuvertureCentral: React.FC<ModuleOuvertureCentralProps> = ({
  onBack,
  supabaseClient,
  procedures,
  dossiers,
  onOpenProcedure,
  onProcedureUpdated,
  initialView = 'home',
}) => {
  const [currentView, setCurrentView] = useState<ViewType>(initialView);
  const [memorizedNumero, setMemorizedNumero] = useState<string>('');
  const [fromRegistre, setFromRegistre] = useState<'retraits' | 'depots' | null>(null);

  // Réinitialiser la vue quand l'onglet change (initialView change)
  React.useEffect(() => {
    setCurrentView(initialView);
  }, [initialView]);

  /**
   * Extrait le numéro AFPA (5 chiffres) depuis une référence de procédure
   */
  const extractNumeroAfpa = (reference: string): string | null => {
    const match = reference.match(/^(\d{5})/);
    return match ? match[1] : null;
  };

  /**
   * Callback appelé depuis les registres pour mémoriser le numéro de procédure
   */
  const handleRegistreLoaded = (reference: string, source: 'retraits' | 'depots') => {
    const numero = extractNumeroAfpa(reference);
    if (numero) {
      setMemorizedNumero(numero);
      setFromRegistre(source);
      console.log(`✅ Numéro mémorisé depuis ${source}:`, numero);
    }
  };

  /**
   * Navigation vers l'ouverture des plis avec proposition du numéro mémorisé
   */
  const handleNavigateToOuverturePlis = () => {
    setCurrentView('ouverture-plis');
  };

  /**
   * Retour à l'accueil du module
   */
  const handleBackToHome = () => {
    setCurrentView('home');
    // Ne pas effacer memorizedNumero pour le conserver entre les vues
  };

  // ============================================================================
  // RENDU : Page d'accueil avec tuiles
  // ============================================================================
  if (currentView === 'home') {
    return (
      <div className="ouverture-plis-module min-h-screen bg-slate-50 dark:bg-[#0f1419]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={onBack}
              className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700/50 rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-6 h-6 text-slate-700 dark:text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Module Ouverture des Plis
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Gestion complète des registres et analyse des candidatures
              </p>
            </div>
          </div>

          {/* Indicateur de numéro mémorisé */}
          {memorizedNumero && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-700/30 rounded-lg">
              <div className="flex items-center gap-3">
                <ClipboardCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                    Numéro de procédure mémorisé
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300/80">
                    {memorizedNumero} {fromRegistre && `(depuis le registre des ${fromRegistre})`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tuiles de navigation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tuile 1 : Registre des retraits */}
            <button
              onClick={() => setCurrentView('retraits')}
              className="group relative overflow-hidden bg-white dark:bg-[#2a3441] rounded-xl shadow-md hover:shadow-xl dark:shadow-none transition-all duration-300 p-6 text-left border-2 border-transparent dark:border-slate-700/50 hover:border-blue-500 dark:hover:border-blue-400/50 dark:hover:bg-[#323c4d]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 dark:bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Registre des retraits
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Chargez et consultez le registre des entreprises ayant retiré le dossier de consultation
                </p>
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm font-medium">
                  Ouvrir
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Tuile 2 : Registre des dépôts */}
            <button
              onClick={() => setCurrentView('depots')}
              className="group relative overflow-hidden bg-white dark:bg-[#2a3441] rounded-xl shadow-md hover:shadow-xl dark:shadow-none transition-all duration-300 p-6 text-left border-2 border-transparent dark:border-slate-700/50 hover:border-green-500 dark:hover:border-green-400/50 dark:hover:bg-[#323c4d]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 dark:bg-green-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-green-100 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <PackageOpen className="w-7 h-7 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Registre des dépôts
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  Chargez et consultez le registre des candidatures déposées par les entreprises
                </p>
                <div className="flex items-center text-green-600 dark:text-green-400 text-sm font-medium">
                  Ouvrir
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>

            {/* Tuile 3 : Ouverture des plis */}
            <button
              onClick={handleNavigateToOuverturePlis}
              className="group relative overflow-hidden bg-white dark:bg-[#2a3441] rounded-xl shadow-md hover:shadow-xl dark:shadow-none transition-all duration-300 p-6 text-left border-2 border-transparent dark:border-slate-700/50 hover:border-purple-500 dark:hover:border-purple-400/50 dark:hover:bg-[#323c4d]"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 dark:bg-purple-500/10 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ClipboardCheck className="w-7 h-7 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Ouverture des plis
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {memorizedNumero 
                    ? `Analyser la procédure ${memorizedNumero} ou charger une autre procédure`
                    : 'Analyser les candidatures et vérifier la recevabilité des offres'
                  }
                </p>
                <div className="flex items-center text-purple-600 dark:text-purple-400 text-sm font-medium">
                  Ouvrir
                  <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </button>
          </div>

          {/* Informations complémentaires */}
          <div className="mt-8 p-4 bg-white dark:bg-[#2a3441] rounded-lg border border-slate-200 dark:border-slate-700/50">
            <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
              📋 Workflow recommandé
            </h4>
            <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
              <li>Charger d'abord le <strong className="dark:text-slate-300">Registre des retraits</strong> ou des <strong className="dark:text-slate-300">dépôts</strong></li>
              <li>Le numéro de procédure sera automatiquement mémorisé</li>
              <li>Accéder à l'<strong className="dark:text-slate-300">Ouverture des plis</strong> pour analyser cette procédure</li>
              <li>Vous pouvez toujours charger une autre procédure manuellement</li>
            </ol>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDU : Registre des retraits
  // ============================================================================
  if (currentView === 'retraits') {
    return (
      <RegistreRetraits
        supabaseClient={supabaseClient}
        onOpenProcedure={(numeroAfpa) => {
          handleRegistreLoaded(numeroAfpa, 'retraits');
        }}
        onProcedureUpdated={onProcedureUpdated}
        onBack={handleBackToHome}
        onNavigateToOuverturePlis={handleNavigateToOuverturePlis}
        onNavigateToRegistreDepots={() => setCurrentView('depots')}
        memorizedNumero={memorizedNumero}
      />
    );
  }

  // ============================================================================
  // RENDU : Registre des dépôts
  // ============================================================================
  if (currentView === 'depots') {
    return (
      <RegistreDepots
        supabaseClient={supabaseClient}
        onOpenProcedure={(numeroAfpa) => {
          handleRegistreLoaded(numeroAfpa, 'depots');
        }}
        onProcedureUpdated={onProcedureUpdated}
        onBack={handleBackToHome}
        onNavigateToOuverturePlis={handleNavigateToOuverturePlis}
        memorizedNumero={memorizedNumero}
      />
    );
  }

  // ============================================================================
  // RENDU : Ouverture des plis
  // ============================================================================
  if (currentView === 'ouverture-plis') {
    return (
      <OuverturePlis
        onBack={handleBackToHome}
        procedures={procedures}
        dossiers={dossiers}
        initialNumero={memorizedNumero || undefined}
        onInitialApplied={() => {
          // Ne pas effacer memorizedNumero ici pour le conserver
        }}
      />
    );
  }

  return null;
};

export default ModuleOuvertureCentral;
