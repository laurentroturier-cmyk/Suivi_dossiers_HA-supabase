import React, { useEffect } from 'react';
import { useImmobilier } from '@/hooks';
import { TrendingUp, Home, Euro, Percent } from 'lucide-react';

const ImmobilierDashboard: React.FC = () => {
  const { stats, loading, loadStats } = useImmobilier();

  useEffect(() => {
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-6 text-center">
        <p className="text-gray-600 dark:text-gray-400">Aucune donnée disponible</p>
      </div>
    );
  }

  const cards = [
    {
      id: 'total',
      titre: 'Projets Total',
      valeur: stats.totalProjets,
      icon: Home,
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      iconColor: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-blue-200 dark:border-blue-500/40',
    },
    {
      id: 'budget',
      titre: 'Budget Total',
      valeur: `€${(stats.budgetTotal / 1000000).toFixed(1)}M`,
      icon: Euro,
      iconBg: 'bg-green-100 dark:bg-green-500/20',
      iconColor: 'text-green-600 dark:text-green-400',
      borderColor: 'border-green-200 dark:border-green-500/40',
    },
    {
      id: 'realise',
      titre: 'Engagé',
      valeur: `€${(stats.budgetEngage / 1000000).toFixed(1)}M`,
      icon: TrendingUp,
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-500/40',
    },
    {
      id: 'taux',
      titre: 'Taux Moyen de Réalisation',
      valeur: `${(stats.tauxMoyenRealisation || 0).toFixed(1)}%`,
      icon: Percent,
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      iconColor: 'text-orange-600 dark:text-orange-400',
      borderColor: 'border-orange-200 dark:border-orange-500/40',
    },
  ];

  return (
    <div data-export-id="stats" data-export-label="Cartes Statistiques" className="space-y-6">
      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${card.borderColor} p-6 transition-all hover:shadow-lg`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <h3 className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
                {card.titre}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {card.valeur}
              </p>
            </div>
          );
        })}
      </div>

      {/* Statistiques supplémentaires */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-blue-200 dark:border-blue-500/40 p-6">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Projets en cours
          </h4>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.projetEnCours}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-green-200 dark:border-green-500/40 p-6">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Projets terminés
          </h4>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {stats.projetsTermines}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-orange-200 dark:border-orange-500/40 p-6">
          <h4 className="text-sm text-gray-600 dark:text-gray-400 font-semibold mb-2">
            Budget réalisé
          </h4>
          <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            €{(stats.budgetRealise / 1000000).toFixed(1)}M
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImmobilierDashboard;
