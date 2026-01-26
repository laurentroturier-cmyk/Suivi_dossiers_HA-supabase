import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Noti3Section, type Noti3Data } from '../../redaction';

interface Noti3ModalProps {
  isOpen: boolean;
  onClose: () => void;
  perdants: Noti3Data[];
  procedureInfo: {
    numeroAfpa: string;
    numProc: string;
    objet: string;
  };
}

const Noti3Modal: React.FC<Noti3ModalProps> = ({ isOpen, onClose, perdants, procedureInfo }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!isOpen || perdants.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(perdants.length - 1, prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-start justify-center p-4">
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-7xl w-full my-8">
          {/* Header */}
          <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 z-10 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Générer NOTI3 - Notification de rejet
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Procédure {procedureInfo.numeroAfpa} - {procedureInfo.objet}
                </p>
              </div>
              
              {/* Navigation entre perdants */}
              {perdants.length > 1 && (
                <div className="flex items-center gap-3 mx-6">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Perdant précédent"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    Perdant {currentIndex + 1} / {perdants.length}
                  </span>
                  
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === perdants.length - 1}
                    className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title="Perdant suivant"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              )}
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(100vh - 200px)' }}>
            <Noti3Section initialData={perdants[currentIndex]} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Noti3Modal;
