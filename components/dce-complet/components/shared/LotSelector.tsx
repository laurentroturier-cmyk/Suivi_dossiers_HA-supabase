// ============================================
// COMPOSANT LOT SELECTOR
// Permet de naviguer entre les lots d'une procédure
// ============================================

import React from 'react';
import { ChevronLeft, ChevronRight, Plus, Copy, Trash2, AlertCircle } from 'lucide-react';

interface LotSelectorProps {
  procedureId: string;
  totalLots: number;
  currentLot: number;
  onLotChange: (lotNumber: number) => void;
  onAddLot?: () => void;
  onDuplicateLot?: () => void;
  onDeleteLot?: () => void;
  loading?: boolean;
  disabled?: boolean;
  lotLibelle?: string;
}

export const LotSelector: React.FC<LotSelectorProps> = ({
  procedureId,
  totalLots,
  currentLot,
  onLotChange,
  onAddLot,
  onDuplicateLot,
  onDeleteLot,
  loading = false,
  disabled = false,
  lotLibelle,
}) => {
  const canGoToPrevious = currentLot > 1 && !disabled && !loading;
  const canGoToNext = currentLot < totalLots && !disabled && !loading;
  const canDelete = totalLots > 1 && onDeleteLot && !disabled && !loading;

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Navigation lots */}
        <div className="flex items-center gap-4">
          {/* Bouton précédent */}
          <button
            onClick={() => canGoToPrevious && onLotChange(currentLot - 1)}
            disabled={!canGoToPrevious}
            className={`p-2 rounded-lg transition-colors ${
              canGoToPrevious
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Lot précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Sélecteur de lot */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-600">Lot</span>
            
            <select
              value={currentLot}
              onChange={(e) => onLotChange(Number(e.target.value))}
              disabled={disabled || loading}
              className={`px-3 py-2 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
                disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
              }`}
            >
              {Array.from({ length: totalLots }, (_, i) => i + 1).map((lot) => (
                <option key={lot} value={lot}>
                  {lot}
                </option>
              ))}
            </select>

            <span className="text-sm text-gray-500">/ {totalLots}</span>

            {lotLibelle && (
              <span className="ml-2 text-sm text-gray-700 font-medium border-l pl-3">
                {lotLibelle}
              </span>
            )}
          </div>

          {/* Bouton suivant */}
          <button
            onClick={() => canGoToNext && onLotChange(currentLot + 1)}
            disabled={!canGoToNext}
            className={`p-2 rounded-lg transition-colors ${
              canGoToNext
                ? 'text-gray-700 hover:bg-gray-100'
                : 'text-gray-300 cursor-not-allowed'
            }`}
            title="Lot suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Indicateur de chargement */}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-green-700">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700"></div>
              <span>Chargement...</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Bouton nouveau lot */}
          {onAddLot && (
            <button
              onClick={onAddLot}
              disabled={disabled || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                disabled || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
              }`}
              title="Créer un nouveau lot"
            >
              <Plus className="w-4 h-4" />
              Nouveau lot
            </button>
          )}
          
          {/* Bouton dupliquer */}
          {onDuplicateLot && (
            <button
              onClick={onDuplicateLot}
              disabled={disabled || loading}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                disabled || loading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-b from-[#2F5B58] to-[#234441] text-white hover:from-[#234441] hover:to-[#1a3330] shadow-md'
              }`}
              title="Dupliquer le lot actuel"
            >
              <Copy className="w-4 h-4" />
              Dupliquer
            </button>
          )}

          {/* Bouton supprimer */}
          {canDelete && (
            <button
              onClick={onDeleteLot}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 font-medium transition-colors shadow-md"
              title="Supprimer le lot actuel"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Alerte si aucun lot */}
      {totalLots === 0 && (
        <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <div className="text-sm text-amber-800">
            Aucun lot créé pour cette procédure.{' '}
            {onAddLot && (
              <button
                onClick={onAddLot}
                className="font-medium underline hover:text-amber-900"
              >
                Créer le premier lot
              </button>
            )}
          </div>
        </div>
      )}

      {/* Info procédure */}
      <div className="mt-2 text-xs text-gray-500">
        Procédure : <span className="font-mono font-medium">{procedureId}</span>
      </div>
    </div>
  );
};
