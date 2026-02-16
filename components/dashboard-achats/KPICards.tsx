import React from 'react';
import { formatMillions, percentage } from './utils';
import { KPIData } from './types';

interface KPICardsProps {
  data: KPIData;
}

export const KPICards: React.FC<KPICardsProps> = ({ data }) => {
  const kpis = [
    {
      label: 'CA Commandé',
      value: formatMillions(data.totalCommande),
      sub: `${data.nbLignes} lignes`,
      gradient: 'from-cyan-500 to-blue-600'
    },
    {
      label: 'CA Facturé',
      value: formatMillions(data.totalFacture),
      sub: `Taux: ${percentage(data.totalFacture, data.totalCommande)}`,
      gradient: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'CA Livré',
      value: formatMillions(data.totalLivre),
      sub: `Taux: ${percentage(data.totalLivre, data.totalCommande)}`,
      gradient: 'from-orange-500 to-amber-600'
    },
    {
      label: 'Montant Total (TTC)',
      value: formatMillions(data.totalMontant),
      sub: '',
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      label: 'Fournisseurs',
      value: data.nbFournisseurs.toString(),
      sub: '',
      gradient: 'from-pink-500 to-rose-600'
    },
    {
      label: 'Commandes',
      value: data.nbCommandes.toString(),
      sub: '',
      gradient: 'from-indigo-500 to-blue-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5 relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${kpi.gradient}`} />
          <div className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">
            {kpi.label}
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white font-mono">
            {kpi.value}
          </div>
          {kpi.sub && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {kpi.sub}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
