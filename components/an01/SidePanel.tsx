import React, { useMemo } from 'react';
import * as XLSX from 'xlsx';
import { X, Trophy, AlertCircle, CheckCircle2, Calculator, Hash, Euro, Sigma, FileSpreadsheet } from 'lucide-react';
import { Offer, Stats } from './types';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip } from 'recharts';

interface Props {
  offer: Offer | null;
  offers: Offer[];
  isOpen: boolean;
  onClose: () => void;
  stats: Stats;
}

const SidePanel: React.FC<Props> = ({ offer, offers, isOpen, onClose, stats }) => {
  const marketStats = useMemo(() => {
    if (!offers || offers.length === 0) {
      return { 
        avg: { tech: 0, fin: 0, global: 0 },
        stdDev: { tech: 0, fin: 0, global: 0 }
      };
    }

    const round2 = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;
    const count = offers.length;
    
    // Calculate Averages
    const total = offers.reduce((acc, o) => ({
      tech: acc.tech + o.scoreTechnical,
      fin: acc.fin + o.scoreFinancial,
      global: acc.global + o.scoreFinal
    }), { tech: 0, fin: 0, global: 0 });
    
    const avg = {
      tech: round2(total.tech / count),
      fin: round2(total.fin / count),
      global: round2(total.global / count)
    };

    // Calculate Variance & Standard Deviation
    const variance = offers.reduce((acc, o) => ({
      tech: acc.tech + Math.pow(o.scoreTechnical - avg.tech, 2),
      fin: acc.fin + Math.pow(o.scoreFinancial - avg.fin, 2),
      global: acc.global + Math.pow(o.scoreFinal - avg.global, 2)
    }), { tech: 0, fin: 0, global: 0 });

    const stdDev = {
      tech: round2(Math.sqrt(variance.tech / count)),
      fin: round2(Math.sqrt(variance.fin / count)),
      global: round2(Math.sqrt(variance.global / count))
    };

    return { avg, stdDev };
  }, [offers]);

  if (!offer) return null;

  const diff = offer.amountTTC - stats.average;
  const isCheaper = diff < 0;
  const isWinner = offer.rankFinal === 1;
  const opportunityLoss = offer.amountTTC - (stats.winner?.amountTTC || 0);

  const formatCurrency = (val: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(val);

  const chartData = [
    { subject: 'Technique', A: offer.scoreTechnical, B: marketStats.avg.tech, fullMark: 100 },
    { subject: 'Financier', A: offer.scoreFinancial, B: marketStats.avg.fin, fullMark: 100 },
    { subject: 'Global', A: offer.scoreFinal, B: marketStats.avg.global, fullMark: 100 },
  ];

  const handleExportExcel = () => {
    const data = [
      ["Indicateur", "Valeur"],
      ["Nom de l'offre", offer.name],
      ["Rang Final", offer.rankFinal],
      ["Score Global", offer.scoreFinal],
      ["Montant TTC", offer.amountTTC],
      ["Rang Technique", offer.rankTechnical],
      ["Score Technique", offer.scoreTechnical],
      ["Rang Financier", offer.rankFinancial],
      ["Score Financier", offer.scoreFinancial],
      ["Moyenne Technique Marché", marketStats.avg.tech],
      ["Ecart-type Technique", marketStats.stdDev.tech],
      ["Moyenne Financière Marché", marketStats.avg.fin],
      ["Ecart-type Financier", marketStats.stdDev.fin]
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Adjust column width
    const wscols = [{wch: 35}, {wch: 20}];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Détail Offre");
    XLSX.writeFile(wb, `Detail_${offer.name.replace(/[^a-z0-9]/gi, '_')}.xlsx`);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div className={`fixed inset-y-0 right-0 w-full md:w-[500px] bg-white shadow-2xl z-50 border-l border-gray-200 flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
          <h3 className="font-bold text-lg text-gray-800 truncate pr-4">{offer.name}</h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportExcel}
              className="text-gray-400 hover:text-green-600 p-1 rounded-full hover:bg-green-50 transition"
              title="Exporter en Excel"
            >
              <FileSpreadsheet className="w-5 h-5" />
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200 transition">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          
          {/* Header Badge */}
          <div className="flex justify-center">
            <div className={`
              px-6 py-2 rounded-full font-bold shadow-sm border flex items-center gap-2
              ${isWinner ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-600'}
            `}>
              {isWinner && <Trophy className="w-4 h-4" />}
              Rang Final #{offer.rankFinal}
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col items-center justify-center text-center">
                <Euro className="w-5 h-5 text-blue-500 mb-1" />
                <p className="text-xs text-blue-400 font-semibold uppercase">Montant TTC</p>
                <p className="text-lg font-bold text-blue-900">{formatCurrency(offer.amountTTC)}</p>
             </div>
             <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex flex-col items-center justify-center text-center">
                <Calculator className="w-5 h-5 text-purple-500 mb-1" />
                <p className="text-xs text-purple-400 font-semibold uppercase">Note Globale</p>
                <p className="text-lg font-bold text-purple-900">{offer.scoreFinal.toFixed(2)} / 100</p>
             </div>
          </div>

          {/* Comparison Chart */}
          <div className="border border-gray-100 rounded-xl p-4 shadow-sm">
             <h4 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
               <Hash className="w-4 h-4 text-gray-400" /> Comparatif vs Moyenne
             </h4>
             <div className="h-64 w-full -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={chartData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={false} axisLine={false} />
                    <Radar
                      name={offer.name}
                      dataKey="A"
                      stroke="#10b981"
                      strokeWidth={2}
                      fill="#10b981"
                      fillOpacity={0.3}
                    />
                    <Radar
                      name="Moyenne"
                      dataKey="B"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      strokeDasharray="4 4"
                      fill="#9ca3af"
                      fillOpacity={0.1}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Tooltip 
                       contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Detailed Scores Table */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
               <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                  <tr>
                     <th className="px-4 py-3 text-left">Critère</th>
                     <th className="px-4 py-3 text-center">Rang</th>
                     <th className="px-4 py-3 text-right">Note</th>
                  </tr>
               </thead>
               <tbody className="divide-y divide-gray-100">
                  <tr>
                     <td className="px-4 py-3 font-medium text-gray-700">Technique</td>
                     <td className="px-4 py-3 text-center text-gray-500">#{offer.rankTechnical}</td>
                     <td className="px-4 py-3 text-right font-bold text-green-600">{offer.scoreTechnical.toFixed(2)}</td>
                  </tr>
                  <tr>
                     <td className="px-4 py-3 font-medium text-gray-700">Financier</td>
                     <td className="px-4 py-3 text-center text-gray-500">#{offer.rankFinancial}</td>
                     <td className="px-4 py-3 text-right font-bold text-blue-600">{offer.scoreFinancial.toFixed(2)}</td>
                  </tr>
                  <tr className="bg-gray-50/50">
                     <td className="px-4 py-3 font-bold text-gray-900">Total</td>
                     <td className="px-4 py-3 text-center font-bold text-gray-900">#{offer.rankFinal}</td>
                     <td className="px-4 py-3 text-right font-bold text-gray-900">{offer.scoreFinal.toFixed(2)}</td>
                  </tr>
               </tbody>
            </table>
          </div>

          {/* Distribution Analysis (Standard Deviation) */}
          <div className="border border-gray-100 rounded-xl p-4 shadow-sm bg-gray-50/50">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Sigma className="w-4 h-4 text-gray-400" /> Analyse de la Distribution
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tech Score Analysis */}
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 font-semibold uppercase mb-2 border-b border-gray-50 pb-1">Technique</div>
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Moyenne</span>
                      <span className="font-mono">{marketStats.avg.tech.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Écart-type (σ)</span>
                      <span className="font-mono">{marketStats.stdDev.tech.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm border-t border-gray-50 pt-1 mt-1">
                       <span className="text-gray-600">Position</span>
                       <span className={`font-bold font-mono ${offer.scoreTechnical >= marketStats.avg.tech ? 'text-green-600' : 'text-red-500'}`}>
                         {offer.scoreTechnical >= marketStats.avg.tech ? '+' : ''}
                         {((offer.scoreTechnical - marketStats.avg.tech) / (marketStats.stdDev.tech || 1)).toFixed(1)}σ
                       </span>
                   </div>
                </div>
              </div>

              {/* Financial Score Analysis */}
              <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                <div className="text-xs text-gray-500 font-semibold uppercase mb-2 border-b border-gray-50 pb-1">Financier</div>
                <div className="space-y-2">
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Moyenne</span>
                      <span className="font-mono">{marketStats.avg.fin.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Écart-type (σ)</span>
                      <span className="font-mono">{marketStats.stdDev.fin.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm border-t border-gray-50 pt-1 mt-1">
                       <span className="text-gray-600">Position</span>
                       <span className={`font-bold font-mono ${offer.scoreFinancial >= marketStats.avg.fin ? 'text-green-600' : 'text-red-500'}`}>
                         {offer.scoreFinancial >= marketStats.avg.fin ? '+' : ''}
                         {((offer.scoreFinancial - marketStats.avg.fin) / (marketStats.stdDev.fin || 1)).toFixed(1)}σ
                       </span>
                   </div>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Cards */}
          {isWinner ? (
            <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-center">
              <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-800 font-bold">Meilleure offre de la consultation</p>
              <p className="text-green-600 text-xs mt-1">Sélectionnée pour son rapport qualité/prix</p>
            </div>
          ) : (
            <div className="bg-red-50 p-4 rounded-lg border border-red-100">
              <h4 className="text-xs font-bold text-red-800 uppercase mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Surcoût vs Vainqueur
              </h4>
              <div className="flex justify-between items-end">
                 <div className="text-red-600 text-sm">Différence à payer :</div>
                 <div className="text-xl font-bold text-red-700">+{formatCurrency(opportunityLoss)}</div>
              </div>
            </div>
          )}

          <div className={`p-3 rounded-lg text-center text-xs font-medium ${isCheaper ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
             {isCheaper ? 'Cette offre est inférieure à la moyenne du marché.' : 'Cette offre est supérieure à la moyenne du marché.'}
          </div>

        </div>
      </div>
    </>
  );
};

export default SidePanel;