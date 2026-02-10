import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { AchatRow } from './types';
import { groupSum, topN, formatCurrency, formatCurrencyShort, percentage } from './utils';
import { CHART_COLORS } from './constants';
import { ChartWrapper } from './Charts';

interface FamiliesTabProps {
  data: AchatRow[];
}

export const FamiliesTab: React.FC<FamiliesTabProps> = ({ data }) => {
  // Ventilation par famille
  const familyData = groupSum(data, "Famille d'achats", 'Montant de la ventilation de commande');
  const familyEntries = Object.entries(familyData).sort((a, b) => b[1] - a[1]);

  // Top 15 sous-familles
  const subFamilyData = groupSum(data, "Sous-famille d'achats", 'Montant de la ventilation de commande');
  const top15SubFamilies = topN(subFamilyData, 15);

  // Top 15 catégories
  const categoryData = groupSum(data, "Catégorie d'achats", 'Montant de la ventilation de commande');
  const top15Categories = topN(categoryData, 15);

  // Croisement famille × trimestre
  const familyByTrimestre: Record<string, Record<string, number>> = {};
  data.forEach(row => {
    const famille = String(row["Famille d'achats"] || '(Vide)');
    const trimestre = String(row['Trimestre'] || '(Vide)');
    const montant = Number(row['Montant de la ventilation de commande']) || 0;
    
    if (!familyByTrimestre[famille]) {
      familyByTrimestre[famille] = {};
    }
    familyByTrimestre[famille][trimestre] = (familyByTrimestre[famille][trimestre] || 0) + montant;
  });

  const trimestres = Array.from(new Set(data.map(r => String(r['Trimestre'] || '(Vide)')))).sort();
  const top10Families = familyEntries.slice(0, 10).map(e => e[0]);

  const barOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => formatCurrency(ctx.parsed.y)
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
          maxRotation: 45,
          minRotation: 0,
          color: '#8896ab'
        },
        grid: { display: false }
      }
    }
  };

  const doughnutOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '60%',
    plugins: {
      legend: {
        position: 'right',
        labels: {
          boxWidth: 12,
          padding: 8,
          font: { size: 11 },
          color: '#8896ab'
        }
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const total = (ctx.dataset.data as number[]).reduce((a, b) => a + b, 0);
            return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${percentage(ctx.parsed, total)})`;
          }
        }
      }
    }
  };

  const stackedBarOptions: ChartOptions<'bar'> = {
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
      x: {
        stacked: true,
        ticks: {
          maxRotation: 45,
          color: '#8896ab'
        },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          callback: (value) => formatCurrencyShort(Number(value)),
          color: '#8896ab'
        },
        grid: { color: '#2a3650' }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Graphiques principaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title="Répartition par Famille d'achats" dotColor="#a78bfa">
          <Doughnut
            data={{
              labels: familyEntries.map(e => e[0]),
              datasets: [{
                data: familyEntries.map(e => e[1]),
                backgroundColor: CHART_COLORS,
                borderWidth: 0
              }]
            }}
            options={doughnutOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="Top 15 Sous-familles" dotColor="#fb923c">
          <Bar
            data={{
              labels: top15SubFamilies.map(e => e[0].length > 25 ? e[0].slice(0, 25) + '…' : e[0]),
              datasets: [{
                label: 'CA Commandé',
                data: top15SubFamilies.map(e => e[1]),
                backgroundColor: '#fb923c',
                borderRadius: 6,
                barPercentage: 0.7
              }]
            }}
            options={barOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="Top 15 Catégories d'achats" dotColor="#34d399">
          <Bar
            data={{
              labels: top15Categories.map(e => e[0].length > 25 ? e[0].slice(0, 25) + '…' : e[0]),
              datasets: [{
                label: 'CA Commandé',
                data: top15Categories.map(e => e[1]),
                backgroundColor: '#34d399',
                borderRadius: 6,
                barPercentage: 0.7
              }]
            }}
            options={barOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="CA par Famille × Trimestre" dotColor="#38bdf8">
          <Bar
            data={{
              labels: trimestres,
              datasets: top10Families.map((famille, idx) => ({
                label: famille.length > 30 ? famille.slice(0, 30) + '…' : famille,
                data: trimestres.map(t => familyByTrimestre[famille]?.[t] || 0),
                backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                borderRadius: 4,
                barPercentage: 0.8
              }))
            }}
            options={stackedBarOptions}
          />
        </ChartWrapper>
      </div>

      {/* Tableau détaillé */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Détail par Famille d'achats</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Famille
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA Commandé
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  % du Total
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Nb Commandes
                </th>
              </tr>
            </thead>
            <tbody>
              {familyEntries.map(([famille, montant], idx) => {
                const total = familyEntries.reduce((sum, e) => sum + e[1], 0);
                const nbCommandes = new Set(
                  data.filter(r => r["Famille d'achats"] === famille).map(r => r['Commande'])
                ).size;
                
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {famille}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(montant)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {percentage(montant, total)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {nbCommandes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="sticky bottom-0 bg-gray-50 dark:bg-[#1a1a1a] border-t-2 border-gray-300 dark:border-[#444444]">
              <tr>
                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                  TOTAL
                </td>
                <td className="px-4 py-3 text-right font-bold font-mono text-gray-900 dark:text-white">
                  {formatCurrency(familyEntries.reduce((sum, e) => sum + e[1], 0))}
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  100%
                </td>
                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                  {new Set(data.map(r => r['Commande'])).size}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
