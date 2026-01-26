import React from 'react';
import { X } from 'lucide-react';
import { NOTI1Section } from '../../redaction';

interface Noti1ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any; // Données pré-remplies depuis le rapport
  procedureInfo: {
    numeroAfpa: string;
    numProc: string;
    objet: string;
  };
}

const Noti1Modal: React.FC<Noti1ModalProps> = ({ isOpen, onClose, initialData, procedureInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-7xl w-full my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Générer NOTI1 - Notification d'attribution
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Procédure {procedureInfo.numeroAfpa} - {procedureInfo.objet}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content - Pass initial data as a prop */}
          <div className="p-6">
            <NOTI1Section initialData={initialData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Noti1Modal;
