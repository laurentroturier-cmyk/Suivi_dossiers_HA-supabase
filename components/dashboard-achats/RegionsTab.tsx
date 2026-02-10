import React from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { AchatRow } from './types';
import { groupSum, topN, formatCurrency, formatCurrencyShort, percentage } from './utils';
import { CHART_COLORS } from './constants';
import { ChartWrapper } from './Charts';

interface RegionsTabProps {
  data: AchatRow[];
}

export const RegionsTab: React.FC<RegionsTabProps> = ({ data }) => {
  // CA par région (CRT)
  const crtData = groupSum(data, 'Description du CRT', 'Montant de la ventilation de commande');
  const crtEntries = Object.entries(crtData).sort((a, b) => b[1] - a[1]);

  // CA par centre de responsabilité (CR)
  const crData = groupSum(data, 'Description du CR', 'Montant de la ventilation de commande');
  const top15CR = topN(crData, 15);

  // Croisement région × famille (top 10 régions × top 10 familles)
  const regionByFamily: Record<string, Record<string, number>> = {};
  data.forEach(row => {
    const region = String(row['Description du CRT'] || '(Vide)');
    const famille = String(row["Famille d'achats"] || '(Vide)');
    const montant = Number(row['Montant de la ventilation de commande']) || 0;
    
    if (!regionByFamily[region]) {
      regionByFamily[region] = {};
    }
    regionByFamily[region][famille] = (regionByFamily[region][famille] || 0) + montant;
  });

  const top10Regions = crtEntries.slice(0, 10).map(e => e[0]);
  const familyData = groupSum(data, "Famille d'achats", 'Montant de la ventilation de commande');
  const top10Families = Object.entries(familyData).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);

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
          callback: function(value) {
            const label = this.getLabelForValue(Number(value));
            return label.length > 20 ? label.slice(0, 20) + '…' : label;
          },
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
      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title="CA par Région (CRT)" dotColor="#38bdf8">
          <Doughnut
            data={{
              labels: crtEntries.map(e => e[0]),
              datasets: [{
                data: crtEntries.map(e => e[1]),
                backgroundColor: CHART_COLORS,
                borderWidth: 0
              }]
            }}
            options={doughnutOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="Top 15 Centres de Responsabilité (CR)" dotColor="#34d399">
          <Bar
            data={{
              labels: top15CR.map(e => e[0].length > 25 ? e[0].slice(0, 25) + '…' : e[0]),
              datasets: [{
                label: 'CA Commandé',
                data: top15CR.map(e => e[1]),
                backgroundColor: '#34d399',
                borderRadius: 6,
                barPercentage: 0.7
              }]
            }}
            options={barOptions}
          />
        </ChartWrapper>

        <div className="lg:col-span-2">
          <ChartWrapper title="CA par Région × Famille (Top 10)" dotColor="#a78bfa">
            <Bar
              data={{
                labels: top10Regions,
                datasets: top10Families.map((famille, idx) => ({
                  label: famille.length > 30 ? famille.slice(0, 30) + '…' : famille,
                  data: top10Regions.map(r => regionByFamily[r]?.[famille] || 0),
                  backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
                  borderRadius: 4,
                  barPercentage: 0.8
                }))
              }}
              options={stackedBarOptions}
            />
          </ChartWrapper>
        </div>
      </div>

      {/* Tableau par région (CRT) */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Détail par Région (CRT)</h3>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Région (CRT)
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
              {crtEntries.map(([region, montant], idx) => {
                const total = crtEntries.reduce((sum, e) => sum + e[1], 0);
                const nbCommandes = new Set(
                  data.filter(r => r['Description du CRT'] === region).map(r => r['Commande'])
                ).size;
                
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {region}
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
                  {formatCurrency(crtEntries.reduce((sum, e) => sum + e[1], 0))}
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

      {/* Tableau par CR */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">Top 15 Centres de Responsabilité (CR)</h3>
        </div>
        <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  #
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Centre de Responsabilité
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA Commandé
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Nb Commandes
                </th>
              </tr>
            </thead>
            <tbody>
              {top15CR.map(([cr, montant], idx) => {
                const nbCommandes = new Set(
                  data.filter(r => r['Description du CR'] === cr).map(r => r['Commande'])
                ).size;
                
                return (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400 font-semibold">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[350px] truncate" title={cr}>
                      {cr}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(montant)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                      {nbCommandes}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
