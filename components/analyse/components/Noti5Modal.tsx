import React from 'react';
import { X } from 'lucide-react';
import { NOTI5Section } from '../../redaction';

interface Noti5ModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: any;
  procedureInfo: {
    numeroAfpa: string;
    numProc: string;
    objet: string;
  };
}

const Noti5Modal: React.FC<Noti5ModalProps> = ({ isOpen, onClose, initialData, procedureInfo }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between z-10 rounded-t-lg">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Générer NOTI5 - Notification du marché public
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Procédure {procedureInfo.numeroAfpa} - {procedureInfo.objet}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Fermer"
            >
              <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <NOTI5Section initialData={initialData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Noti5Modal;
