import React, { useEffect, useState } from 'react';
import { useImmobilier } from '@/hooks';
import { ImmobilierDashboard, ImmobilierTable, ImmobilierTableFilters, ImmobilierDetailModal, ImmobilierCharts } from '@/components/immobilier';
import { Upload, Download, AlertCircle } from 'lucide-react';
import { AppVersion } from '@/components/AppVersion';
import * as XLSX from 'xlsx';

const ImmobilierPage: React.FC = () => {
  const { projets, loading, error, loadProjets, loadStats, setSelectedProjet, selectedProjet, filters } = useImmobilier();

  useEffect(() => {
    console.log('[ImmobilierPage] Montage - chargement des projets');
    loadProjets();
    loadStats();
  }, []);

  const handleExportExcel = () => {
    if (projets.length === 0) {
      alert('Aucun projet à exporter');
      return;
    }

    try {
      const wb = XLSX.utils.book_new();

      // Feuille 1 : Filtres actifs
      const filtersData: any[][] = [['Filtres actifs']];
      filtersData.push(['']); // Ligne vide
      
      const labelsMap: Record<string, string> = {
        search: 'Recherche',
        region: 'Région',
        centre: 'Centre',
        statut: 'Statut',
        priorite: 'Priorité',
        chefProjet: 'Chef de Projet',
        programme: 'Programme',
        etapeDemande: 'Étape demande',
        rpa: 'RPA',
        composant: 'Composant principal',
        decisionCNI: 'Décision CNI',
        dateTravauxDebut: 'Début travaux (dès le)',
        dateTravauxFin: 'Début travaux (jusqu\'au)'
      };

      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          const label = labelsMap[key as keyof typeof labelsMap] || key;
          let displayValue = value;
          if (key === 'dateTravauxDebut' || key === 'dateTravauxFin') {
            displayValue = new Date(value as string).toLocaleDateString('fr-FR');
          }
          filtersData.push([label, displayValue]);
        }
      });

      if (filtersData.length === 2) {
        filtersData.push(['Aucun filtre actif', '']);
      }

      const ws1 = XLSX.utils.aoa_to_sheet(filtersData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Filtres');

      // Feuille 2 : Tableau des projets
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
        'Programme',
        'Étape demande',
        'RPA',
        'Composant principal',
        'Décision CNI',
        'Date de démarrage travaux'
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
        p['Programme'] || '',
        p['Etape demande'] || '',
        p['RPA'] || '',
        p['Composant principal'] || '',
        p['Décision CNI'] || '',
        p['Date de démarrage travaux'] ? new Date(p['Date de démarrage travaux']).toLocaleDateString('fr-FR') : ''
      ]);

      const ws2 = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      
      // Style de la première ligne (en-têtes)
      const range = XLSX.utils.decode_range(ws2['!ref'] || 'A1');
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + '1';
        if (!ws2[address]) continue;
        ws2[address].s = {
          font: { bold: true },
          fill: { fgColor: { rgb: '005c4d' } },
          alignment: { horizontal: 'center' }
        };
      }
      
      XLSX.utils.book_append_sheet(wb, ws2, 'Projets');

      // Exporter le fichier
      const fileName = `ImmoVision_Export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, fileName);

    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                ImmoVision
              </h1>
              <AppVersion className="mt-2" />
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Pilotage et analyse du portefeuille immobilier
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-[#005c4d] hover:bg-[#00483f] text-white rounded-lg font-semibold transition-colors"
            >
              <Download className="w-5 h-5" />
              Exporter Excel
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

        {/* Footer avec version */}
        <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-700">
          <AppVersion className="text-center" />
        </footer>
      </div>
    </div>
  );
};

export default ImmobilierPage;
