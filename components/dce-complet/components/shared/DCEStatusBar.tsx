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
  Loader2,
  GitCompare
} from 'lucide-react';
import type { DCEState, DCEStatut } from '../../types';
import type { ConflictDetectionResult } from '../../utils/procedureSyncService';

interface DCEStatusBarProps {
  dceState: DCEState | null;
  isDirty: boolean;
  isNew: boolean;
  onSave?: () => void;
  onPublish?: () => void;
  onRefresh?: () => void;
  isSaving?: boolean;
  className?: string;
  conflicts?: ConflictDetectionResult | null;
  onShowConflicts?: () => void;
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
  conflicts,
  onShowConflicts,
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
      'crt',
      'qt',
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
      en_cours: 'bg-green-100 text-green-700 border-green-300',
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
                  className="absolute top-0 left-0 h-full bg-[#2F5B58] transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 min-w-max">
                {progress.completed} / {progress.total} sections
              </span>
            </div>

            {/* Indicateur de modifications */}
            {isDirty && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs text-orange-700 font-medium">
                  Modifications non sauvegardées
                </span>
              </div>
            )}

            {!isDirty && !isNew && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-700 font-medium">
                  Tout est sauvegardé
                </span>
              </div>
            )}

            {/* 🆕 Badge de conflits */}
            {conflicts && conflicts.hasConflicts && (
              <button
                onClick={onShowConflicts}
                className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors cursor-pointer"
                title={`${conflicts.conflicts.length} conflit(s) détecté(s) avec la table procédures`}
              >
                <GitCompare className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-xs text-amber-700 font-medium">
                  {conflicts.conflicts.length} conflit{conflicts.conflicts.length > 1 ? 's' : ''}
                </span>
              </button>
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
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all bg-[#2F5B58] text-white hover:bg-[#234441] shadow-sm disabled:opacity-50"
                title={isDirty ? 'Sauvegarder les modifications' : 'Sauvegarder le DCE'}
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

    </div>
  );
}
