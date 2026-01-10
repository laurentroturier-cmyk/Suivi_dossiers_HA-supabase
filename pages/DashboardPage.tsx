import React from 'react';

/**
 * Page Dashboard - Tableau de bord avec filtres et statistiques
 * TODO: Migrer la logique depuis App.old.tsx lines 2634-2875
 */
const DashboardPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Tableau de bord
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⚠️ Fonctionnalité en cours de migration depuis l'ancien App.tsx
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            Cette page affichait : filtres (acheteur, priorité, famille, type procédure, année), statistiques, graphiques
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
