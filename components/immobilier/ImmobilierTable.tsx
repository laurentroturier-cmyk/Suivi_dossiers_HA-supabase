import React from 'react';
import { useImmobilier } from '@/hooks';
import { MapPin, Users, Euro, Eye } from 'lucide-react';
import { Immobilier } from '@/types/immobilier';

interface ImmobilierTableProps {
  projets: Immobilier[];
  onSelectProjet?: (projet: Immobilier) => void;
}

const ImmobilierTable: React.FC<ImmobilierTableProps> = ({ projets, onSelectProjet }) => {
  const getStatusClasses = (statut?: string) => {
    const s = (statut || '').toLowerCase();
    if (s.includes('initial')) return 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300';
    if (s.includes('travaux') || s.includes('exécution') || s.includes('execution')) return 'bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300';
    if (s.includes('termin') || s.includes('achevé') || s.includes('clos')) return 'bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-300';
    return 'bg-gray-100 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300';
  };

  const renderBudgetValue = (value?: string | number) => {
    if (!value) return '-';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '.')) : value;
    if (isNaN(numValue)) return value;
    return `${numValue.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
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
    <div data-export-id="table" data-export-label="Tableau des projets" className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th className="px-3 py-3 text-center text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider w-16">Actions</th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Code Demande
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Intitulé
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Région / Centre
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Statut
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Budget
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Progression
              </th>
              <th className="px-3 py-3 text-left text-[10px] font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                Chef de Projet
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {projets.map((projet) => (
              <tr
                key={projet['Code demande']}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                  <td className="px-3 py-3 text-center">
                    <button
                      onClick={() => onSelectProjet?.(projet)}
                      className="inline-flex items-center justify-center w-7 h-7 bg-[#005c4d] text-white rounded-lg hover:bg-[#004a3d] transition-colors"
                      title="Voir les détails"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-bold text-[#005c4d] dark:text-emerald-400">
                      {projet['Code demande']}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[300px] truncate block" title={projet['Intitulé'] || ''}>
                      {projet['Intitulé'] || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-1">
                      <MapPin className="w-3 h-3 mt-0.5 text-gray-500" />
                      <div>
                        <div className="text-xs text-gray-700 dark:text-gray-300">{projet['Région'] || '-'}</div>
                        {projet['Centre'] && (
                          <div className="text-[10px] text-gray-500 dark:text-gray-400">{projet['Centre']}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusClasses(projet['Statut'])}`}>
                      {projet['Statut'] || '-'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className="text-xs text-gray-700 dark:text-gray-300 font-semibold">
                      {renderBudgetValue(projet['Budget en €'])}
                    </span>
                  </td>
                  <td className="px-3 py-3">
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
                  <td className="px-3 py-3">
                    <span className="text-xs text-gray-700 dark:text-gray-300">
                      {projet['Chef de Projet'] || '-'}
                    </span>
                  </td>
                  
                </tr>
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
