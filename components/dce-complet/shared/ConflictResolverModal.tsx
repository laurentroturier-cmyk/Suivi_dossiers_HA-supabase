// ============================================
// MODAL DE RÉSOLUTION DES CONFLITS
// Affiche les différences entre DCE et Procédures
// Permet à l'utilisateur de choisir quelle valeur conserver
// ============================================

import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, X, Database, FileText, Check } from 'lucide-react';
import type { DataConflict, ConflictResolution } from '../services/procedureSyncService';

interface ConflictResolverModalProps {
  conflicts: DataConflict[];
  onResolve: (resolutions: Record<string, ConflictResolution>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export function ConflictResolverModal({
  conflicts,
  onResolve,
  onCancel,
  isOpen,
}: ConflictResolverModalProps) {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution>>(() => {
    // Par défaut : priorité à 'procedures'
    const initial: Record<string, ConflictResolution> = {};
    conflicts.forEach(c => {
      initial[c.dcePath] = 'keep-procedure';
    });
    return initial;
  });

  if (!isOpen) return null;

  const handleResolutionChange = (dcePath: string, resolution: ConflictResolution) => {
    setResolutions(prev => ({
      ...prev,
      [dcePath]: resolution,
    }));
  };

  const handleApply = () => {
    onResolve(resolutions);
  };

  const procedureCount = Object.values(resolutions).filter(r => r === 'keep-procedure').length;
  const dceCount = Object.values(resolutions).filter(r => r === 'keep-dce').length;
  const skipCount = Object.values(resolutions).filter(r => r === 'skip-field').length;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Conflits détectés
              </h2>
              <p className="text-sm text-gray-500">
                {conflicts.length} différence{conflicts.length > 1 ? 's' : ''} entre le DCE et la table procédures
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Info banner */}
        <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
          <div className="flex items-start gap-2">
            <Database className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-900">
              <strong>Priorité recommandée :</strong> Conserver les données de la table <strong>procédures</strong> 
              (source de vérité). Les modifications du DCE peuvent être synchronisées vers procédures si nécessaire.
            </div>
          </div>
        </div>

        {/* Conflicts list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-4">
            {conflicts.map((conflict, index) => (
              <div
                key={conflict.dcePath}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
                      {index + 1}
                    </span>
                    {conflict.field}
                  </h3>
                  <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {conflict.procedureColumn}
                  </span>
                </div>

                {/* Comparison */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  {/* Procedures value */}
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Database className="w-4 h-4 text-green-600" />
                      <span className="text-xs font-semibold text-green-700 uppercase">
                        Table procédures
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      {conflict.procedureValue || <em className="text-gray-400">Vide</em>}
                    </div>
                  </div>

                  {/* DCE value */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700 uppercase">
                        DCE actuel
                      </span>
                    </div>
                    <div className="text-sm text-gray-900 font-medium">
                      {conflict.dceValue || <em className="text-gray-400">Vide</em>}
                    </div>
                  </div>
                </div>

                {/* Resolution options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-700 block mb-2">
                    Choisir l'action :
                  </label>
                  
                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 has-[:checked]:border-green-500 has-[:checked]:bg-green-50">
                    <input
                      type="radio"
                      name={`conflict-${index}`}
                      checked={resolutions[conflict.dcePath] === 'keep-procedure'}
                      onChange={() => handleResolutionChange(conflict.dcePath, 'keep-procedure')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        Conserver la valeur de <strong>procédures</strong>
                      </div>
                      <div className="text-xs text-gray-500">
                        Le DCE sera mis à jour avec : <strong className="text-green-700">{conflict.procedureValue || 'Vide'}</strong>
                      </div>
                    </div>
                    {resolutions[conflict.dcePath] === 'keep-procedure' && (
                      <Check className="w-5 h-5 text-green-600" />
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 has-[:checked]:border-blue-500 has-[:checked]:bg-blue-50">
                    <input
                      type="radio"
                      name={`conflict-${index}`}
                      checked={resolutions[conflict.dcePath] === 'keep-dce'}
                      onChange={() => handleResolutionChange(conflict.dcePath, 'keep-dce')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        Conserver la valeur du <strong>DCE</strong> et mettre à jour procédures
                      </div>
                      <div className="text-xs text-gray-500">
                        La table procédures sera mise à jour avec : <strong className="text-blue-700">{conflict.dceValue || 'Vide'}</strong>
                      </div>
                    </div>
                    {resolutions[conflict.dcePath] === 'keep-dce' && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </label>

                  <label className="flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50 has-[:checked]:border-gray-400 has-[:checked]:bg-gray-50">
                    <input
                      type="radio"
                      name={`conflict-${index}`}
                      checked={resolutions[conflict.dcePath] === 'skip-field'}
                      onChange={() => handleResolutionChange(conflict.dcePath, 'skip-field')}
                      className="w-4 h-4 text-gray-600"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm text-gray-900">
                        Ignorer ce champ
                      </div>
                      <div className="text-xs text-gray-500">
                        Ne rien modifier (garder les valeurs actuelles)
                      </div>
                    </div>
                    {resolutions[conflict.dcePath] === 'skip-field' && (
                      <Check className="w-5 h-5 text-gray-600" />
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Summary */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-gray-600">
                <strong className="text-green-600">{procedureCount}</strong> depuis procédures
              </span>
              <span className="text-gray-600">
                <strong className="text-blue-600">{dceCount}</strong> depuis DCE
              </span>
              <span className="text-gray-600">
                <strong className="text-gray-600">{skipCount}</strong> ignoré{skipCount > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleApply}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            Appliquer les résolutions
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
