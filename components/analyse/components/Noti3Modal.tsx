import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Package, Loader2 } from 'lucide-react';
import { Noti3Section, type Noti3Data } from '../../redaction';
import { exportAllNoti3ToZip } from '../../redaction/utils/noti3ZipExport';

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
  const [isExportingZip, setIsExportingZip] = useState(false);

  if (!isOpen || perdants.length === 0) return null;

  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(perdants.length - 1, prev + 1));
  };

  const handleExportZip = async () => {
    setIsExportingZip(true);
    try {
      await exportAllNoti3ToZip(perdants, procedureInfo.numeroAfpa);
      // Notification de succès optionnelle ici
    } catch (error) {
      console.error('Erreur lors de l\'export ZIP:', error);
      alert('Erreur lors de l\'export ZIP des NOTI3. Voir la console pour plus de détails.');
    } finally {
      setIsExportingZip(false);
    }
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
              
              {/* Bouton Export ZIP - Visible si plusieurs perdants */}
              {perdants.length > 1 && (
                <button
                  onClick={handleExportZip}
                  disabled={isExportingZip}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white text-sm font-semibold rounded-lg transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed mr-3"
                  title={`Exporter tous les ${perdants.length} NOTI3 en ZIP (un PDF par candidat)`}
                >
                  {isExportingZip ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Export en cours...</span>
                    </>
                  ) : (
                    <>
                      <Package className="w-4 h-4" />
                      <span>Exporter ZIP ({perdants.length} PDFs)</span>
                    </>
                  )}
                </button>
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
