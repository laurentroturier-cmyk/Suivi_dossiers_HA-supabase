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
        <p className="text-gray-600 dark:text-slate-300">
          Sélectionnez la méthode qui correspond le mieux à votre workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {MODES.map((modeOption) => (
          <button
            key={modeOption.mode}
            onClick={() => onSelectMode(modeOption.mode)}
            className="group relative p-6 rounded-2xl text-left transition-all duration-300 transform hover:scale-105 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 shadow-lg dark:shadow-xl dark:shadow-black/50"
          >
            {/* Badge "Nouveau" pour l'approche par lots */}
            {modeOption.mode === 'par-lots' && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                NOUVEAU
              </span>
            )}

            <div className="flex items-start gap-4">
              <div
                className={`flex-shrink-0 p-3 rounded-xl ring-1 ring-black/5 dark:ring-white/10 ${
                  modeOption.color === 'blue'
                    ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400'
                    : 'bg-teal-100 dark:bg-teal-500/20 text-teal-700 dark:text-teal-400'
                }`}
              >
                {modeOption.icon}
              </div>

              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900 dark:text-white mb-0.5">
                  {modeOption.label}
                </h4>
                <p className="text-xs text-gray-600 dark:text-slate-400 leading-snug mb-3">
                  {modeOption.description}
                </p>

                {/* Avantages de chaque mode */}
                <ul className="space-y-1 text-xs">
                  {modeOption.mode === 'par-candidat' ? (
                    <>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        Vue centrée sur chaque fournisseur
                      </li>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        Génération groupée par candidat
                      </li>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-blue-600 dark:text-blue-400">•</span>
                        Idéal pour suivi fournisseur
                      </li>
                    </>
                  ) : (
                    <>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-teal-600 dark:text-teal-400">•</span>
                        Navigation lot par lot
                      </li>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-teal-600 dark:text-teal-400">•</span>
                        Vérification systématique des 3 NOTI
                      </li>
                      <li className="flex items-start gap-2 text-gray-700 dark:text-slate-300">
                        <span className="text-teal-600 dark:text-teal-400">•</span>
                        Export flexible (lot/fournisseur/type)
                      </li>
                    </>
                  )}
                </ul>
              </div>

              <ArrowRight
                className="flex-shrink-0 w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-600 dark:text-slate-400"
              />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
        <p className="text-xs text-amber-900 dark:text-amber-200">
          <span className="font-semibold">💡 Astuce :</span> Le mode "Par Lots" est particulièrement adapté aux procédures multi-lots 
          où vous devez vérifier méthodiquement les notifications pour chaque lot.
        </p>
      </div>
    </div>
  );
}
