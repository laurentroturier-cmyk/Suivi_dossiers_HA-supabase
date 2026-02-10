import React from 'react';
import { Bar } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { AchatRow } from './types';
import { groupSum, topN, formatCurrency, formatCurrencyShort, percentage } from './utils';
import { CHART_COLORS } from './constants';
import { ChartWrapper } from './Charts';

interface SuppliersTabProps {
  data: AchatRow[];
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ data }) => {
  // Top 20 fournisseurs par CA commandé
  const supplierCA = groupSum(data, 'Fournisseur', 'Montant de la ventilation de commande');
  const top20Suppliers = topN(supplierCA, 20);

  // Calcul du taux de facturation par fournisseur
  const supplierStats: Record<string, {
    commande: number;
    facture: number;
    livre: number;
    nbCommandes: number;
  }> = {};

  data.forEach(row => {
    const supplier = String(row['Fournisseur'] || '(Vide)');
    if (!supplierStats[supplier]) {
      supplierStats[supplier] = {
        commande: 0,
        facture: 0,
        livre: 0,
        nbCommandes: 0
      };
    }
    supplierStats[supplier].commande += Number(row['Montant de la ventilation de commande']) || 0;
    supplierStats[supplier].facture += Number(row['Montant de ventilation facturé']) || 0;
    supplierStats[supplier].livre += Number(row['Montant de ventilation livré']) || 0;
  });

  // Nombre de commandes par fournisseur
  const commandesBySuppliersMap: Record<string, Set<string>> = {};
  data.forEach(row => {
    const supplier = String(row['Fournisseur'] || '(Vide)');
    const commande = String(row['Commande'] || '');
    if (!commandesBySuppliersMap[supplier]) {
      commandesBySuppliersMap[supplier] = new Set();
    }
    commandesBySuppliersMap[supplier].add(commande);
  });

  Object.keys(supplierStats).forEach(supplier => {
    supplierStats[supplier].nbCommandes = commandesBySuppliersMap[supplier]?.size || 0;
  });

  const top20SupplierNames = top20Suppliers.map(e => e[0]);
  const top20Stats = top20SupplierNames.map(name => supplierStats[name]);

  const horizontalBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y' as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.x)
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => formatCurrencyShort(Number(value)),
          color: '#8896ab'
        },
        grid: { color: '#2a3650' }
      },
      y: {
        ticks: {
          callback: function(value) {
            const label = this.getLabelForValue(Number(value));
            return label.length > 22 ? label.slice(0, 22) + '…' : label;
          },
          color: '#8896ab'
        },
        grid: { display: false }
      }
    }
  };

  const groupedBarOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          boxWidth: 12,
          padding: 10,
          font: { size: 11 },
          color: '#8896ab'
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y)}`
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: (value) => formatCurrencyShort(Number(value)),
          color: '#8896ab'
        },
        grid: { color: '#2a3650' }
      },
      x: {
        ticks: {
          callback: function(value) {
            const label = this.getLabelForValue(Number(value));
            return label.length > 15 ? label.slice(0, 15) + '…' : label;
          },
          maxRotation: 45,
          color: '#8896ab'
        },
        grid: { display: false }
      }
    }
  };

  const top10ForDetails = top20Suppliers.slice(0, 10);

  return (
    <div className="space-y-6">
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title="Top 20 Fournisseurs (CA Commandé)" dotColor="#fb923c">
          <Bar
            data={{
              labels: top20SupplierNames,
              datasets: [{
                label: 'CA Commandé',
                data: top20Suppliers.map(e => e[1]),
                backgroundColor: CHART_COLORS.slice(0, 20),
                borderRadius: 6,
                barPercentage: 0.7
              }]
            }}
            options={horizontalBarOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="Top 10 : Commandé vs Facturé vs Livré" dotColor="#38bdf8">
          <Bar
            data={{
              labels: top10ForDetails.map(e => e[0]),
              datasets: [
                {
                  label: 'Commandé',
                  data: top10ForDetails.map(e => supplierStats[e[0]].commande),
                  backgroundColor: '#38bdf8',
                  borderRadius: 4
                },
                {
                  label: 'Facturé',
                  data: top10ForDetails.map(e => supplierStats[e[0]].facture),
                  backgroundColor: '#34d399',
                  borderRadius: 4
                },
                {
                  label: 'Livré',
                  data: top10ForDetails.map(e => supplierStats[e[0]].livre),
                  backgroundColor: '#fb923c',
                  borderRadius: 4
                }
              ]
            }}
            options={groupedBarOptions}
          />
        </ChartWrapper>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Détail des Top 20 Fournisseurs</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Fournisseur
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA Commandé
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA Facturé
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA Livré
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Taux Facturation
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Nb Commandes
                </th>
              </tr>
            </thead>
            <tbody>
              {top20Suppliers.map(([supplier, montant], idx) => {
                const stats = supplierStats[supplier];
                const tauxFacturation = stats.commande > 0 
                  ? ((stats.facture / stats.commande) * 100).toFixed(1) + '%'
                  : '0%';
                
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[300px] truncate" title={supplier}>
                      {supplier}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(stats.commande)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(stats.facture)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(stats.livre)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                        parseFloat(tauxFacturation) >= 90
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : parseFloat(tauxFacturation) >= 70
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {tauxFacturation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {stats.nbCommandes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-[#1a1a1a] border-t-2 border-gray-300 dark:border-[#444444]">
              <tr>
                <td className="px-4 py-3" />
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                  TOTAL TOP 20
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono text-gray-900 dark:text-white">
                  {formatCurrency(top20Stats.reduce((sum, s) => sum + s.commande, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono text-gray-900 dark:text-white">
                  {formatCurrency(top20Stats.reduce((sum, s) => sum + s.facture, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono text-gray-900 dark:text-white">
                  {formatCurrency(top20Stats.reduce((sum, s) => sum + s.livre, 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  {percentage(
                    top20Stats.reduce((sum, s) => sum + s.facture, 0),
                    top20Stats.reduce((sum, s) => sum + s.commande, 0)
                  )}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  {top20Stats.reduce((sum, s) => sum + s.nbCommandes, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
