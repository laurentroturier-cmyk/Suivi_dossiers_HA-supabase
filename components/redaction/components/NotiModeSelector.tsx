import React from 'react';
import { Users, Package, ArrowRight } from 'lucide-react';

interface ModeSelection {
  mode: 'par-candidat' | 'par-lots';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const MODES: ModeSelection[] = [
  {
    mode: 'par-candidat',
    label: 'Par Fournisseur',
    description: 'Approche classique : gérer les NOTI par candidat/fournisseur',
    icon: <Users className="w-12 h-12" />,
    color: 'blue',
  },
  {
    mode: 'par-lots',
    label: 'Par Lots',
    description: 'Nouvelle approche : gérer et vérifier les NOTI lot par lot',
    icon: <Package className="w-12 h-12" />,
    color: 'teal',
  },
];

interface NotiModeSelectorProps {
  onSelectMode: (mode: 'par-candidat' | 'par-lots') => void;
}

export default function NotiModeSelector({ onSelectMode }: NotiModeSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Choisissez votre mode de travail
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sélectionnez la méthode qui correspond le mieux à votre workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.mode}
            onClick={() => onSelectMode(modeOption.mode)}
            className={`group relative p-6 bg-gradient-to-br ${
              modeOption.color === 'blue'
                ? 'from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 dark:from-blue-900/20 dark:to-blue-800/20 dark:hover:from-blue-900/30 dark:hover:to-blue-800/30 border-blue-200 dark:border-blue-700'
                : 'from-teal-50 to-teal-100 hover:from-teal-100 hover:to-teal-200 dark:from-teal-900/20 dark:to-teal-800/20 dark:hover:from-teal-900/30 dark:hover:to-teal-800/30 border-teal-200 dark:border-teal-700'
            } border-2 rounded-xl text-left transition-all duration-200 transform hover:scale-105 hover:shadow-lg`}
          >
            {/* Badge "Nouveau" pour l'approche par lots */}
            {modeOption.mode === 'par-lots' && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                NOUVEAU
              </span>
            )}

            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 p-3 rounded-lg ${
                  modeOption.color === 'blue'
                    ? 'bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-200'
                    : 'bg-teal-200 dark:bg-teal-800 text-teal-700 dark:text-teal-200'
                }`}
              >
                {modeOption.icon}
              </div>

              <div className="flex-1">
                <h4
                  className={`text-xl font-bold mb-2 ${
                    modeOption.color === 'blue'
                      ? 'text-blue-900 dark:text-blue-100'
                      : 'text-teal-900 dark:text-teal-100'
                  }`}
                >
                  {modeOption.label}
                </h4>
                <p
                  className={`text-sm mb-4 ${
                    modeOption.color === 'blue'
                      ? 'text-blue-700 dark:text-blue-300'
                      : 'text-teal-700 dark:text-teal-300'
                  }`}
                >
                  {modeOption.description}
                </p>

                {/* Avantages de chaque mode */}
                <ul className="space-y-1 text-sm">
                  {modeOption.mode === 'par-candidat' ? (
                    <>
                      <li className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                        <span className="text-blue-600">•</span>
                        Vue centrée sur chaque fournisseur
                      </li>
                      <li className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                        <span className="text-blue-600">•</span>
                        Génération groupée par candidat
                      </li>
                      <li className="flex items-start gap-2 text-blue-800 dark:text-blue-200">
                        <span className="text-blue-600">•</span>
                        Idéal pour suivi fournisseur
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2 text-teal-800 dark:text-teal-200">
                        <span className="text-teal-600">•</span>
                        Navigation lot par lot
                      </li>
                      <li className="flex items-start gap-2 text-teal-800 dark:text-teal-200">
                        <span className="text-teal-600">•</span>
                        Vérification systématique des 3 NOTI
                      </li>
                      <li className="flex items-start gap-2 text-teal-800 dark:text-teal-200">
                        <span className="text-teal-600">•</span>
                        Export flexible (lot/fournisseur/type)
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <ArrowRight
                className={`flex-shrink-0 w-6 h-6 opacity-0 group-hover:opacity-100 transition-opacity ${
                  modeOption.color === 'blue'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-teal-600 dark:text-teal-400'
                }`}
              />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-sm text-amber-900 dark:text-amber-100">
          <span className="font-semibold">💡 Astuce :</span> Le mode "Par Lots" est particulièrement adapté aux procédures multi-lots 
          où vous devez vérifier méthodiquement les notifications pour chaque lot.
        </p>
      </div>
    </div>
  );
}
