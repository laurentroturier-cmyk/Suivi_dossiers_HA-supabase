import React, { useState } from 'react';
import { AnalysisData } from './types';
import { ArrowLeft, LayoutGrid, Trophy, ArrowRight, Euro, Percent, AlertCircle, Table as TableIcon, Image as ImageIcon } from 'lucide-react';
import ExportSelectModal from './ExportSelectModal';

interface Props {
  lots: AnalysisData[];
  onSelectLot: (index: number) => void;
  onReset: () => void;
  onSwitchToTable: () => void;
}

const LotSelectionView: React.FC<Props> = ({ lots, onSelectLot, onReset, onSwitchToTable }) => {
  const [showExportModal, setShowExportModal] = useState(false);
  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  return (
    <div className="flex-1 flex flex-col bg-gray-50 overflow-hidden h-screen">
      <ExportSelectModal 
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="Vue d'ensemble Multi-Lots"
      />

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            className="text-gray-500 hover:text-green-700 transition p-2 rounded-full hover:bg-gray-100" 
            title="Importer un autre fichier"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              Afpa DNA <span className="font-normal text-gray-400 text-sm hidden sm:inline">| Sélection du Lot</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
             <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg text-sm font-medium transition shadow"
            >
                <ImageIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Img Export</span>
            </button>
             <button 
                onClick={onSwitchToTable}
                className="flex items-center gap-2 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition shadow-sm"
             >
                <TableIcon className="w-4 h-4" /> <span className="hidden sm:inline">Vue Tableau</span>
             </button>
             <div className="flex items-center gap-2 bg-blue-50 text-blue-800 px-4 py-2 rounded-full text-sm font-medium border border-blue-100">
                <LayoutGrid className="w-4 h-4" />
                {lots.length} Lots
             </div>
        </div>
      </header>

      {/* Grid Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          
          <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Tableau de Bord Multi-Lots</h2>
              <p className="text-gray-500 mt-2">Vue d'ensemble de la consultation. Sélectionnez un lot pour voir le détail.</p>
          </div>

          <div 
            data-export-id="lots-grid"
            data-export-label="Grille des Lots"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {lots.map((lot, index) => {
              const winner = lot.stats.winner;
              const hasWinner = !!winner;

              return (
                <div 
                  key={index}
                  onClick={() => onSelectLot(index)}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all cursor-pointer group flex flex-col"
                >
                  <div className="p-6 flex-1">
                    <div className="flex justify-between items-start mb-4">
                       <h3 className="text-xl font-bold text-gray-800 group-hover:text-green-700 transition-colors">
                         {lot.lotName}
                       </h3>
                       <span className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-md font-mono">
                         {lot.offers.length} Offres
                       </span>
                    </div>

                    {hasWinner ? (
                      <div className="space-y-4">
                        <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                            <div className="flex items-center gap-2 text-green-800 font-bold text-sm mb-1 uppercase tracking-wide">
                                <Trophy className="w-4 h-4" /> Lauréat
                            </div>
                            <div className="text-gray-900 font-bold truncate">
                                {winner.name}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                                    <Euro className="w-3 h-3" /> Montant
                                </p>
                                <p className="text-gray-800 font-bold text-lg">
                                    {formatCurrency(winner.amountTTC)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-semibold flex items-center gap-1">
                                    <Percent className="w-3 h-3" /> Économie
                                </p>
                                <p className={`font-bold text-lg ${lot.stats.savingPercent >= 0 ? 'text-green-600' : 'text-orange-500'}`}>
                                    {lot.stats.savingPercent.toFixed(1)}%
                                </p>
                            </div>
                        </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4">
                          <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                          <p>Aucune offre éligible</p>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                     <span className="text-sm font-medium">Voir l'analyse</span>
                     <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
};

export default LotSelectionView;