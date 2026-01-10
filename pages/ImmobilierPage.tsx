import React, { useEffect } from 'react';
import { useImmobilier } from '@/hooks';
import { ImmobilierDashboard, ImmobilierTable, ImmobilierTableFilters, ImmobilierDetailModal, ImmobilierCharts } from '@/components/immobilier';
import { Upload, Download, AlertCircle } from 'lucide-react';

const ImmobilierPage: React.FC = () => {
  const { projets, loading, error, loadProjets, loadStats, setSelectedProjet, selectedProjet } = useImmobilier();

  useEffect(() => {
    console.log('[ImmobilierPage] Montage - chargement des projets');
    loadProjets();
    loadStats();
  }, []);

  const handleExport = () => {
    if (projets.length === 0) {
      alert('Aucun projet à exporter');
      return;
    }

    try {
      // Convertir les données en CSV
      const headers = [
        'Code demande',
        'Intitulé',
        'Région',
        'Centre',
        'Statut',
        'Budget en €',
        '% Réalisé',
        'Chef de Projet',
        'Priorité',
      ];

      const rows = projets.map(p => [
        p['Code demande'],
        p['Intitulé'] || '',
        p['Région'] || '',
        p['Centre'] || '',
        p['Statut'] || '',
        p['Budget en €'] || '',
        p['% Réalisé'] || '',
        p['Chef de Projet'] || '',
        p['Priorité'] || '',
      ]);

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
      ].join('\n');

      // Créer et télécharger le fichier
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `immobilier_export_${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              ImmoVision
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Pilotage et analyse du portefeuille immobilier
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#005c4d] hover:bg-[#00483f] text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter
            </button>
          </div>
        </div>

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 dark:bg-red-500/10 border-l-4 border-red-500 p-4 rounded">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="font-semibold text-red-800 dark:text-red-300">Erreur</h3>
                <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Tableau de bord */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Indicateurs clés
          </h2>
          {loading && !projets.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : (
            <ImmobilierDashboard />
          )}
        </section>

        {/* Filtres */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Recherche et filtres
          </h2>
          <ImmobilierTableFilters />
        </section>

        {/* Graphiques et analyses */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Analyses et statistiques
          </h2>
          {loading && !projets.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : (
            <ImmobilierCharts />
          )}
        </section>

        {/* Tableau des projets */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Liste des projets ({projets.length})
          </h2>
          {loading && !projets.length ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400"></div>
            </div>
          ) : projets.length === 0 ? (
            <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-lg p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-2">Aucun projet immobilier trouvé</p>
              <p className="text-sm text-gray-500 dark:text-gray-500">Vérifiez que la table Supabase contient des données</p>
            </div>
          ) : (
            <ImmobilierTable
              projets={projets}
              onSelectProjet={(projet) => setSelectedProjet(projet)}
            />
          )}
        </section>

        {/* Modal détail projet */}
        <ImmobilierDetailModal
          isOpen={!!selectedProjet}
          projet={selectedProjet}
          onClose={() => setSelectedProjet(null)}
        />
      </div>
    </div>
  );
};

export default ImmobilierPage;
