import React from 'react';
import { X, Construction, AlertCircle } from 'lucide-react';

interface Noti3MultiModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Noti3MultiModal({ isOpen, onClose }: Noti3MultiModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white p-6 flex items-center justify-between opacity-70">
          <div className="flex items-center gap-3">
            <Construction className="w-8 h-8" />
            <div>
              <h2 className="text-2xl font-bold">NOTI3 Multi-Attributaires</h2>
              <p className="text-sm text-gray-100 mt-1">🚧 En construction</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alert */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Fonctionnalité en développement</h3>
              <p className="text-sm text-yellow-700 mt-1">
                L'interface de saisie et la génération pour les contrats multi-attributaires seront disponibles prochainement.
              </p>
            </div>
          </div>
        </div>

        {/* Content Placeholder */}
        <div className="p-6 opacity-50">
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <Construction className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-semibold">Interface de saisie NOTI3 Multi-Attributaires</p>
            <p className="text-sm text-gray-500 mt-2">À venir : formulaire de saisie adapté aux contrats avec plusieurs attributaires</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end gap-3 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
