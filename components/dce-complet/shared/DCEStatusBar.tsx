// ============================================
// DCEStatusBar - Barre de statut du DCE
// Affiche la progression, le statut et les actions
// ============================================

import React from 'react';
import { 
  Save, 
  Upload, 
  RotateCcw, 
  CheckCircle, 
  AlertTriangle,
  FileText,
  Clock,
  Loader2
} from 'lucide-react';
import type { DCEState, DCEStatut } from '../types';

interface DCEStatusBarProps {
  dceState: DCEState | null;
  isDirty: boolean;
  isNew: boolean;
  onSave?: () => void;
  onPublish?: () => void;
  onRefresh?: () => void;
  isSaving?: boolean;
  className?: string;
}

export function DCEStatusBar({
  dceState,
  isDirty,
  isNew,
  onSave,
  onPublish,
  onRefresh,
  isSaving = false,
  className = '',
}: DCEStatusBarProps) {
  if (!dceState) return null;

  /**
   * Calcule la progression (nombre de sections remplies)
   */
  const calculateProgress = (): { completed: number; total: number; percentage: number } => {
    const sections = [
      'reglementConsultation',
      'acteEngagement',
      'ccap',
      'cctp',
      'bpu',
      'dqe',
      'dpgf',
      'documentsAnnexes',
    ] as const;

    const total = sections.length;
    const completed = sections.filter(section => {
      const data = dceState[section];
      if (!data) return false;
      
      // Vérifie si la section a au moins une propriété remplie
      const values = Object.values(data);
      return values.some(v => {
        if (Array.isArray(v)) return v.length > 0;
        if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
        if (typeof v === 'string') return v.trim().length > 0;
        if (typeof v === 'number') return v > 0;
        if (typeof v === 'boolean') return true;
        return false;
      });
    }).length;

    const percentage = Math.round((completed / total) * 100);

    return { completed, total, percentage };
  };

  const progress = calculateProgress();

  /**
   * Badge de statut coloré
   */
  const StatutBadge = ({ statut }: { statut: DCEStatut }) => {
    const styles = {
      brouillon: 'bg-gray-100 text-gray-700 border-gray-300',
      en_cours: 'bg-blue-100 text-blue-700 border-blue-300',
      en_attente_validation: 'bg-yellow-100 text-yellow-700 border-yellow-300',
      publié: 'bg-green-100 text-green-700 border-green-300',
      archivé: 'bg-purple-100 text-purple-700 border-purple-300',
    };

    const icons = {
      brouillon: <FileText className="w-4 h-4" />,
      en_cours: <Clock className="w-4 h-4" />,
      en_attente_validation: <AlertTriangle className="w-4 h-4" />,
      publié: <CheckCircle className="w-4 h-4" />,
      archivé: <FileText className="w-4 h-4" />,
    };

    const labels = {
      brouillon: 'Brouillon',
      en_cours: 'En cours',
      en_attente_validation: 'En attente',
      publié: 'Publié',
      archivé: 'Archivé',
    };

    return (
      <span className={`
        inline-flex items-center gap-2 px-3 py-1.5 rounded-full 
        text-sm font-medium border
        ${styles[statut]}
      `}>
        {icons[statut]}
        {labels[statut]}
      </span>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          {/* Gauche : Statut + Progression */}
          <div className="flex items-center gap-6">
            {/* Statut */}
            <div>
              <StatutBadge statut={dceState.statut} />
              {isNew && (
                <span className="ml-2 text-xs text-gray-500 italic">
                  (nouveau)
                </span>
              )}
            </div>

            {/* Progression */}
            <div className="flex items-center gap-3">
              <div className="relative w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 min-w-max">
                {progress.completed} / {progress.total} sections
              </span>
            </div>

            {/* Indicateur de modifications */}
            {isDirty && (
              <span className="flex items-center gap-1.5 text-xs text-orange-600 font-medium">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                Modifications non sauvegardées
              </span>
            )}
          </div>

          {/* Droite : Actions */}
          <div className="flex items-center gap-2">
            {/* Bouton Rafraîchir */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isSaving}
                className="px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Recharger depuis Supabase"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}

            {/* Bouton Sauvegarder */}
            {onSave && (
              <button
                onClick={onSave}
                disabled={isSaving || !isDirty}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
                  ${isDirty 
                    ? 'bg-blue-500 text-white hover:bg-blue-600 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }
                  disabled:opacity-50
                `}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sauvegarde...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Sauvegarder
                  </>
                )}
              </button>
            )}

            {/* Bouton Publier */}
            {onPublish && dceState.statut !== 'publié' && (
              <button
                onClick={onPublish}
                disabled={isSaving || progress.percentage < 80}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                title={progress.percentage < 80 ? 'Complétez au moins 80% du DCE pour publier' : ''}
              >
                <Upload className="w-5 h-5" />
                Publier
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Barre de message si progression faible */}
      {progress.percentage < 50 && dceState.statut === 'brouillon' && (
        <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
          <p className="text-sm text-blue-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Complétez au moins 50% des sections avant de changer le statut.
          </p>
        </div>
      )}
    </div>
  );
}
