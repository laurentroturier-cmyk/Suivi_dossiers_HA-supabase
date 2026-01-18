import React, { useState } from 'react';
import { X, FileText, Construction, AlertCircle } from 'lucide-react';
import Noti1MultiModal from './Noti1MultiModal';
import Noti3MultiModal from './Noti3MultiModal';
import Noti5MultiModal from './Noti5MultiModal';

interface NotiMultiAttributairesProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotiMultiAttributaires({ isOpen, onClose }: NotiMultiAttributairesProps) {
  const [showNoti1Modal, setShowNoti1Modal] = useState(false);
  const [showNoti3Modal, setShowNoti3Modal] = useState(false);
  const [showNoti5Modal, setShowNoti5Modal] = useState(false);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white p-6 flex items-center justify-between opacity-70">
            <div className="flex items-center gap-3">
              <Construction className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">NOTI Multi-Attributaires</h2>
                <p className="text-sm text-gray-100 mt-1">🚧 Module en construction</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Alert Banner */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 m-6">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-yellow-800">Module en développement</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Ce module est destiné aux <strong>contrats multi-attributaires</strong> (cas rares et spécifiques).
                  La génération des documents sera bientôt disponible.
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 250px)' }}>
            <div className="space-y-4 opacity-60">
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-gray-200">
                <h3 className="text-lg font-semibold mb-4 text-gray-600 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Choisissez le type de notification
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* NOTI1 Multi */}
                  <button
                    onClick={() => setShowNoti1Modal(true)}
                    disabled
                    className="group relative bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-blue-400 hover:shadow-md transition-all cursor-not-allowed"
                  >
                    <div className="absolute top-2 right-2">
                      <Construction className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-blue-400 to-blue-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <span className="text-2xl font-bold">1</span>
                      </div>
                      <h4 className="font-bold text-gray-600 mb-2">NOTI1 Multi</h4>
                      <p className="text-sm text-gray-500">
                        Information aux titulaires pressentis
                      </p>
                      <p className="text-xs text-gray-400 mt-2 italic">
                        (Multi-attributaires)
                      </p>
                    </div>
                  </button>

                  {/* NOTI3 Multi */}
                  <button
                    onClick={() => setShowNoti3Modal(true)}
                    disabled
                    className="group relative bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-orange-400 hover:shadow-md transition-all cursor-not-allowed"
                  >
                    <div className="absolute top-2 right-2">
                      <Construction className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <span className="text-2xl font-bold">3</span>
                      </div>
                      <h4 className="font-bold text-gray-600 mb-2">NOTI3 Multi</h4>
                      <p className="text-sm text-gray-500">
                        Notification de rejet
                      </p>
                      <p className="text-xs text-gray-400 mt-2 italic">
                        (Multi-attributaires)
                      </p>
                    </div>
                  </button>

                  {/* NOTI5 Multi */}
                  <button
                    onClick={() => setShowNoti5Modal(true)}
                    disabled
                    className="group relative bg-white border-2 border-gray-300 rounded-lg p-6 hover:border-green-400 hover:shadow-md transition-all cursor-not-allowed"
                  >
                    <div className="absolute top-2 right-2">
                      <Construction className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="text-center">
                      <div className="bg-gradient-to-r from-green-400 to-green-500 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 opacity-50">
                        <span className="text-2xl font-bold">5</span>
                      </div>
                      <h4 className="font-bold text-gray-600 mb-2">NOTI5 Multi</h4>
                      <p className="text-sm text-gray-500">
                        Notification du marché
                      </p>
                      <p className="text-xs text-gray-400 mt-2 italic">
                        (Multi-attributaires)
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Info Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">À propos des contrats multi-attributaires</h4>
                <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                  <li>Plusieurs attributaires pour un même marché</li>
                  <li>Cas spécifiques nécessitant une notification adaptée</li>
                  <li>Interface de saisie identique aux NOTI classiques</li>
                  <li>Génération Word adaptée au multi-attributaires (à venir)</li>
                </ul>
              </div>
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

      {/* Modals (désactivés pour l'instant) */}
      {showNoti1Modal && (
        <Noti1MultiModal
          isOpen={showNoti1Modal}
          onClose={() => setShowNoti1Modal(false)}
        />
      )}

      {showNoti3Modal && (
        <Noti3MultiModal
          isOpen={showNoti3Modal}
          onClose={() => setShowNoti3Modal(false)}
        />
      )}

      {showNoti5Modal && (
        <Noti5MultiModal
          isOpen={showNoti5Modal}
          onClose={() => setShowNoti5Modal(false)}
        />
      )}
    </>
  );
}
