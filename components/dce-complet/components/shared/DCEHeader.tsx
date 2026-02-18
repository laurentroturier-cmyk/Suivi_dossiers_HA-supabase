// ============================================
// DCEHeader - En-tête unifié du module DCE Complet
// Fusionne ProcedureHeader + DCEStatusBar en une seule barre plate
// ============================================

import React, { useState, useMemo } from 'react';
import {
  Save, Upload, RotateCcw, CheckCircle, AlertTriangle,
  FileText, Clock, Loader2, GitCompare, Eye, ArrowLeft,
  Euro, Building2
} from 'lucide-react';
import type { DCEState, DCEStatut } from '../../types';
import type { ProjectData } from '../../../../types';
import type { ConflictDetectionResult } from '../../utils/procedureSyncService';
import { ProcedureDetailsModal } from './ProcedureDetailsModal';

interface DCEHeaderProps {
  // Données procédure
  procedure: ProjectData | null;
  // Données DCE
  dceState: DCEState | null;
  isDirty: boolean;
  isNew: boolean;
  isSaving?: boolean;
  conflicts?: ConflictDetectionResult | null;
  dceError?: string | null;
  // Actions
  onSave?: () => void;
  onPublish?: () => void;
  onRefresh?: () => void;
  onShowConflicts?: () => void;
  onBackToSelection?: () => void;
}

export function DCEHeader({
  procedure,
  dceState,
  isDirty,
  isNew,
  isSaving = false,
  conflicts,
  dceError,
  onSave,
  onPublish,
  onRefresh,
  onShowConflicts,
  onBackToSelection,
}: DCEHeaderProps) {
  const [showModal, setShowModal] = useState(false);

  // Données procédure mémoïsées
  const procedureData = useMemo(() => {
    if (!procedure) return null;
    const numeroProcedure = String(procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || '');
    const titre = String(procedure['Nom de la procédure'] || 'Sans titre');
    const acheteur = String(procedure['Acheteur'] || '');
    return { numeroProcedure, titre, acheteur };
  }, [procedure]);

  // Progression DCE
  const progress = useMemo(() => {
    if (!dceState) return { completed: 0, total: 10, percentage: 0 };
    const sections = [
      'reglementConsultation', 'acteEngagement', 'ccap', 'cctp',
      'bpu', 'dqe', 'dpgf', 'documentsAnnexes', 'crt', 'qt',
    ] as const;
    const total = sections.length;
    const completed = sections.filter(section => {
      const data = dceState[section];
      if (!data) return false;
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
    return { completed, total, percentage: Math.round((completed / total) * 100) };
  }, [dceState]);

  // Badge statut
  const statutConfig: Record<DCEStatut, { label: string; classes: string; icon: React.ReactNode }> = {
    brouillon:               { label: 'Brouillon',          classes: 'bg-gray-100 text-gray-700 border-gray-300',    icon: <FileText className="w-3.5 h-3.5" /> },
    en_cours:                { label: 'En cours',            classes: 'bg-green-100 text-green-700 border-green-300', icon: <Clock className="w-3.5 h-3.5" /> },
    en_attente_validation:   { label: 'En attente',          classes: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
    publié:                  { label: 'Publié',              classes: 'bg-green-100 text-green-700 border-green-300', icon: <CheckCircle className="w-3.5 h-3.5" /> },
    archivé:                 { label: 'Archivé',             classes: 'bg-purple-100 text-purple-700 border-purple-300', icon: <FileText className="w-3.5 h-3.5" /> },
  };

  return (
    <>
      {/* Barre unique, plate, sans cartes imbriquées */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-gray-200 flex-shrink-0 flex-wrap">

        {/* ← Retour */}
        {onBackToSelection && (
          <>
            <button
              type="button"
              onClick={onBackToSelection}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Retour
            </button>
            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          </>
        )}

        {/* Identité procédure */}
        {procedureData && (
          <>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs font-bold text-green-700 whitespace-nowrap">
                {procedureData.numeroProcedure}
              </span>
              <span className="text-sm font-semibold text-gray-900 truncate max-w-xs" title={procedureData.titre}>
                {procedureData.titre}
              </span>
              {procedureData.acheteur && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 border border-purple-200 rounded-full text-xs text-purple-700 whitespace-nowrap">
                  <Building2 className="w-3 h-3" />
                  {procedureData.acheteur}
                </span>
              )}
            </div>

            {/* Bouton Visualiser */}
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
              title="Voir les détails de la procédure"
            >
              <Eye className="w-3.5 h-3.5" />
              Visualiser
            </button>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Statut + Progression */}
        {dceState && (
          <>
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statutConfig[dceState.statut].classes}`}>
              {statutConfig[dceState.statut].icon}
              {statutConfig[dceState.statut].label}
              {isNew && <span className="italic text-[10px] opacity-70">(nouveau)</span>}
            </span>

            {/* Barre de progression */}
            <div className="flex items-center gap-2">
              <div className="relative w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-teal-600 rounded-full"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                {progress.completed} / {progress.total}
              </span>
            </div>

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

            {/* Indicateur de sauvegarde */}
            {isDirty ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse" />
                <span className="text-xs text-orange-700 font-medium whitespace-nowrap">Non sauvegardé</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                <span className="text-xs text-green-700 font-medium whitespace-nowrap">Tout est sauvegardé</span>
              </div>
            )}

            {/* Badge conflits */}
            {conflicts?.hasConflicts && (
              <button
                onClick={onShowConflicts}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg hover:bg-amber-100 transition-colors text-xs text-amber-700 font-medium"
              >
                <GitCompare className="w-3.5 h-3.5" />
                {conflicts.conflicts.length} conflit{conflicts.conflicts.length > 1 ? 's' : ''}
              </button>
            )}

            <div className="w-px h-5 bg-gray-200 flex-shrink-0" />
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isSaving}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Recharger depuis Supabase"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
              ) : (
                <><Save className="w-4 h-4" />Sauvegarder</>
              )}
            </button>
          )}

          {onPublish && dceState?.statut !== 'publié' && (
            <button
              onClick={onPublish}
              disabled={isSaving || progress.percentage < 80}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              title={progress.percentage < 80 ? 'Complétez au moins 80% du DCE pour publier' : ''}
            >
              <Upload className="w-4 h-4" />
              Publier
            </button>
          )}
        </div>
      </div>

      {/* Bandeau erreur */}
      {dceError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-200 flex-shrink-0">
          <p className="text-sm text-red-700">{dceError}</p>
        </div>
      )}

      {/* Modal détails procédure */}
      <ProcedureDetailsModal
        procedure={procedure}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
