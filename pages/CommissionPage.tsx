import React from 'react';

/**
 * Page Commission d'appels d'offres
 * TODO: Migrer la logique depuis App.old.tsx lines 3840+
 */
const CommissionPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
          Commission d'appels d'offres
        </h1>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6">
          <p className="text-yellow-800 dark:text-yellow-200">
            ⚠️ Fonctionnalité en cours de migration depuis l'ancien App.tsx
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
            Cette page affichait : liste des dossiers en commission, tri, filtres, analyse des commissions
          </p>
        </div>
      </div>
    </div>
  );
};

export default CommissionPage;
