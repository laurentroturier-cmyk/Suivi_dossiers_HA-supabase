import React from 'react';
import { X } from 'lucide-react';
import RapportPresentation from '../analyse/RapportPresentation';

interface Props {
  an01Data: { lots: any[], globalMetadata: Record<string, string> };
  procedures: any[];
  dossiers: any[];
  onClose: () => void;
}

/**
 * Modal wrapper pour le module Rapport de Présentation
 * Affiche le composant RapportPresentation dans un modal
 * Note: Le composant interne gère son propre chargement AN01 pour l'instant
 * TODO: Passer an01Data en props au composant RapportPresentation une fois modifié
 */
const RapportPresentationModal: React.FC<Props> = ({ an01Data, procedures, dossiers, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-[98vw] max-h-[98vh] overflow-hidden flex flex-col">
        {/* Header avec bouton fermer */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Rapport de Présentation</h2>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition-colors"
            title="Fermer"
          >
            <X className="w-5 h-5" />
            Fermer
          </button>
        </div>
        
        {/* Contenu scrollable - Composant RapportPresentation complet */}
        <div className="flex-1 overflow-y-auto">
          <RapportPresentation 
            procedures={procedures || []}
            dossiers={dossiers || []}
          />
        </div>
      </div>
    </div>
  );
};

export default RapportPresentationModal;
