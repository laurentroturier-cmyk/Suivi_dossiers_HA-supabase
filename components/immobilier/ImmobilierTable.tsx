import React, { useState } from 'react';
import { useImmobilier } from '@/hooks';
import { ChevronDown, MapPin, Users, DollarSign, TrendingUp } from 'lucide-react';
import { Immobilier } from '@/types/immobilier';

interface ImmobilierTableProps {
  projets: Immobilier[];
  onSelectProjet?: (projet: Immobilier) => void;
}

const ImmobilierTable: React.FC<ImmobilierTableProps> = ({ projets, onSelectProjet }) => {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const toggleRow = (codeDemande: string) => {
    setExpandedRow(expandedRow === codeDemande ? null : codeDemande);
  };

  const renderBudgetValue = (value?: string | number) => {
    if (!value) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '.')) : value;
    if (isNaN(numValue)) return value;
    return `€${numValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })}`;
  };

  const renderPercentage = (value?: string | number) => {
    if (!value) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '.')) : value;
    if (isNaN(numValue)) return value;
    return `${numValue.toFixed(1)}%`;
  };

  if (projets.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-12 text-center">
        <p className="text-gray-600 dark:text-gray-400">Aucun projet trouvé</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="w-8 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Code Demande
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Intitulé
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Région
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Budget
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Progression
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                Chef de Projet
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {projets.map((projet) => (
              <React.Fragment key={projet['Code demande']}>
                <tr
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                  onClick={() => {
                    toggleRow(projet['Code demande']);
                    onSelectProjet?.(projet);
                  }}
                >
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <ChevronDown
                        className={`w-4 h-4 text-gray-600 dark:text-gray-400 transition-transform ${
                          expandedRow === projet['Code demande'] ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                    {projet['Code demande']}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                    {projet['Intitulé'] || '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      {projet['Région'] || '-'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 rounded-full text-xs font-semibold">
                      {projet['Statut'] || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      {renderBudgetValue(projet['Budget en €'])}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                        <div
                          className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              typeof projet['% Réalisé'] === 'string'
                                ? parseFloat(projet['% Réalisé'].replace(/,/g, '.'))
                                : projet['% Réalisé'] || 0,
                              100
                            )}%`,
                          }}
                        ></div>
                      </div>
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 min-w-[40px]">
                        {renderPercentage(projet['% Réalisé'])}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-500" />
                      {projet['Chef de Projet'] || '-'}
                    </div>
                  </td>
                </tr>

                {/* Ligne d'expansion détails */}
                {expandedRow === projet['Code demande'] && (
                  <tr className="bg-gray-50 dark:bg-gray-700/50">
                    <td colSpan={8} className="px-6 py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Localisation */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Localisation
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-semibold">Région :</span> {projet['Région'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Centre :</span> {projet['Centre'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Site :</span> {projet['Site'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Code Site :</span> {projet['Code Site'] || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Équipe */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Équipe
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-semibold">Chef de Projet :</span>{' '}
                              {projet['Chef de Projet'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Chargé d'opérations :</span>{' '}
                              {projet['Chargé d\'opérations'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">RPA :</span> {projet['RPA'] || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Budget & Finances */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Finances
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-semibold">Budget :</span>{' '}
                              {renderBudgetValue(projet['Budget en €'])}
                            </p>
                            <p>
                              <span className="font-semibold">Engagé :</span>{' '}
                              {renderBudgetValue(projet['Engagé en €'])}
                            </p>
                            <p>
                              <span className="font-semibold">Réalisé :</span>{' '}
                              {renderBudgetValue(projet['Réalisé en €'])}
                            </p>
                          </div>
                        </div>

                        {/* Dates */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Dates Travaux
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-semibold">Démarrage :</span>{' '}
                              {projet['Date de démarrage travaux'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Fin :</span>{' '}
                              {projet['Date de fin de travaux'] || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Programme */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Programme
                          </h4>
                          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                            <p>
                              <span className="font-semibold">Programme :</span>{' '}
                              {projet['Programme'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Type :</span>{' '}
                              {projet['Type de programme'] || '-'}
                            </p>
                            <p>
                              <span className="font-semibold">Priorité :</span>{' '}
                              {projet['Priorité'] || '-'}
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Descriptif
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                            {projet['Descriptif'] || 'Aucune description'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pied de page */}
      <div className="bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 px-6 py-3">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <span className="font-semibold">{projets.length}</span> projet(s) affiché(s)
        </p>
      </div>
    </div>
  );
};

export default ImmobilierTable;
