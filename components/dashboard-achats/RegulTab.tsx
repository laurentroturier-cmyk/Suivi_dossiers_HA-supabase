import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import { ChartOptions } from 'chart.js';
import { AchatRow } from './types';
import { formatCurrency, formatCurrencyShort, percentage } from './utils';
import { CHART_COLORS } from './constants';
import { ChartWrapper } from './Charts';

// Enregistrer les éléments nécessaires pour les graphiques Line
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface RegulTabProps {
  data: AchatRow[];
}

interface CommandAgg {
  commande: string;
  ca: number;
  isRegul: boolean;
  hasDemandAppr: boolean;
  region: string;
  cr: string;
  dateCreation: string | null;
}

export const RegulTab: React.FC<RegulTabProps> = ({ data }) => {
  // Agrégation au niveau commande
  const commandsMap = new Map<string, CommandAgg>();

  data.forEach(row => {
    const id = String(row['Commande'] || '').trim();
    if (!id) return;

    const existing = commandsMap.get(id);
    const caLigne = Number(row['Montant de la ventilation de commande']) || 0;
    const region = String(row['Description du CRT'] || existing?.region || '(Vide)');
    const cr = String(row['Description du CR'] || existing?.cr || '(Vide)');

    // Champ "Commande REGUL"
    const rawRegul = String(row['Commande REGUL'] || '').trim();
    const isRegul = !!rawRegul && rawRegul.toLowerCase() !== 'non' && rawRegul !== '0';

    // Champ "Demande d'approvisionnement" (non typé mais présent dans les fichiers si utilisé)
    const rawDemandAppr =
      (row as any)['Demande d’approvisionnement'] ??
      (row as any)["Demande d'approvisionnement"] ??
      '';
    const hasDemandAppr = String(rawDemandAppr || '').trim() !== '';

    const dateStr = String(row['Date de création'] || existing?.dateCreation || '').trim();

    if (!existing) {
      commandsMap.set(id, {
        commande: id,
        ca: caLigne,
        isRegul,
        hasDemandAppr,
        region,
        cr,
        dateCreation: dateStr || null
      });
    } else {
      existing.ca += caLigne;
      existing.isRegul = existing.isRegul || isRegul;
      existing.hasDemandAppr = existing.hasDemandAppr || hasDemandAppr;
      if (!existing.region && region) existing.region = region;
      if (!existing.cr && cr) existing.cr = cr;
      if (!existing.dateCreation && dateStr) existing.dateCreation = dateStr;
    }
  });

  const commands = Array.from(commandsMap.values());
  const totalCommands = commands.length;
  const regulCommands = commands.filter(c => c.isRegul);
  const nonRegulCommands = commands.filter(c => !c.isRegul);
  const demandCommands = commands.filter(c => c.hasDemandAppr);

  const totalCA = commands.reduce((sum, c) => sum + c.ca, 0);
  const totalCARegul = regulCommands.reduce((sum, c) => sum + c.ca, 0);

  // KPI calculs
  const kpi = {
    nbTotal: totalCommands,
    nbRegul: regulCommands.length,
    nbNonRegul: nonRegulCommands.length,
    nbDemandAppr: demandCommands.length,
    pctRegulCount: totalCommands ? (regulCommands.length / totalCommands) * 100 : 0,
    pctRegulCA: totalCA ? (totalCARegul / totalCA) * 100 : 0
  };

  // Agrégation par région pour les réguls
  const regionAgg: Record<
    string,
    { regulCount: number; totalCount: number; caRegul: number }
  > = {};

  commands.forEach(c => {
    const key = c.region || '(Vide)';
    if (!regionAgg[key]) {
      regionAgg[key] = { regulCount: 0, totalCount: 0, caRegul: 0 };
    }
    regionAgg[key].totalCount += 1;
    if (c.isRegul) {
      regionAgg[key].regulCount += 1;
      regionAgg[key].caRegul += c.ca;
    }
  });

  const regionEntries = Object.entries(regionAgg)
    .map(([region, stats]) => ({
      region,
      ...stats,
      pctRegul: stats.totalCount ? (stats.regulCount / stats.totalCount) * 100 : 0
    }))
    .sort((a, b) => b.regulCount - a.regulCount);

  // Agrégation région × CR pour tableau détaillé (réguls uniquement)
  const regionCrAgg: Record<
    string,
    { regulCount: number; totalCount: number; caRegul: number }
  > = {};

  commands.forEach(c => {
    const key = `${c.region || '(Vide)'}|||${c.cr || '(Vide)'}`;
    if (!regionCrAgg[key]) {
      regionCrAgg[key] = { regulCount: 0, totalCount: 0, caRegul: 0 };
    }
    regionCrAgg[key].totalCount += 1;
    if (c.isRegul) {
      regionCrAgg[key].regulCount += 1;
      regionCrAgg[key].caRegul += c.ca;
    }
  });

  const regionCrRows = Object.entries(regionCrAgg)
    .filter(([, v]) => v.regulCount > 0)
    .map(([key, v]) => {
      const [region, cr] = key.split('|||');
      return {
        region,
        cr,
        regulCount: v.regulCount,
        totalCount: v.totalCount,
        pctRegulCount: v.totalCount ? (v.regulCount / v.totalCount) * 100 : 0,
        caRegul: v.caRegul,
        pctRegulCA: totalCARegul ? (v.caRegul / totalCARegul) * 100 : 0
      };
    })
    .sort((a, b) => b.regulCount - a.regulCount);

  // Évolution mensuelle des réguls
  const monthly: Record<
    string,
    { totalCount: number; regulCount: number }
  > = {};

  const parseMonth = (dateStr: string | null): string | null => {
    if (!dateStr) return null;
    const raw = dateStr.trim();

    // Format français JJ/MM/AAAA (ex: 06/01/2026)
    const frMatch = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (frMatch) {
      const [, , month, year] = frMatch;
      return `${year}-${month}`;
    }

    // Format ISO AAAA-MM-JJ
    const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [_, year, month] = isoMatch;
      return `${year}-${month}`;
    }

    // Fallback: tentative avec Date()
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  };

  commands.forEach(c => {
    const month = parseMonth(c.dateCreation);
    if (!month) return;
    if (!monthly[month]) {
      monthly[month] = { totalCount: 0, regulCount: 0 };
    }
    monthly[month].totalCount += 1;
    if (c.isRegul) monthly[month].regulCount += 1;
  });

  const monthKeys = Object.keys(monthly).sort();

  // Regroupement par année pour l'évolution mensuelle (une ligne par année)
  const years = Array.from(
    new Set(
      Object.keys(monthly).map((k) => k.split('-')[0])
    )
  ).sort();

  // Mois de 01 à 12 pour l'axe des X
  const monthIndexKeys = ['01','02','03','04','05','06','07','08','09','10','11','12'];

  // Fonction pour formater les labels de mois (ex: "01" -> "Jan")
  const formatMonthLabel = (monthCode: string): string => {
    const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const monthIndex = parseInt(monthCode, 10) - 1;
    return monthNames[monthIndex] ?? monthCode;
  };

  // Graph options
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
            return `${ctx.label}: ${ctx.parsed} (${percentage(ctx.parsed, total)})`;
          }
        }
      }
    }
  };

  const horizontalBarOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const region = regionEntries[ctx.dataIndex];
            if (!region) return '';
            return `${region.region} — ${region.regulCount}/${region.totalCount} régul (${region.pctRegul.toFixed(
              1
            )}%) · ${formatCurrency(region.caRegul)}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          callback: (value) => `${Number(value).toFixed(0)}%`,
          color: '#8896ab'
        },
        grid: { color: '#2a3650' }
      },
      y: {
        ticks: { color: '#8896ab' },
        grid: { display: false }
      }
    }
  };

  const lineOptions: ChartOptions<'line'> = {
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
          label: (ctx) => {
            const monthLabel = formatMonthLabel(String(ctx.label));
            return `${monthLabel} ${ctx.dataset.label}: ${ctx.parsed.y}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#8896ab',
          callback: function(value) {
            const label = this.getLabelForValue(value);
            return formatMonthLabel(label);
          }
        },
        grid: { display: false }
      },
      y: {
        ticks: { color: '#8896ab' },
        grid: { color: '#2a3650' }
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Commandes totales
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {kpi.nbTotal}
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Commandes régul
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {kpi.nbRegul}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kpi.nbTotal ? kpi.pctRegulCount.toFixed(1) : '0.0'}% du volume
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            CA régul
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatCurrency(totalCARegul)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {totalCA ? kpi.pctRegulCA.toFixed(1) : '0.0'}% du CA
          </p>
        </div>
        <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">
            Commandes issues d&apos;une demande d&apos;approvisionnement
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {kpi.nbDemandAppr}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {kpi.nbTotal
              ? ((kpi.nbDemandAppr / kpi.nbTotal) * 100).toFixed(1)
              : '0.0'}
            % du volume
          </p>
        </div>
      </div>

      {/* Graphiques */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartWrapper title="Régul vs non régul (nombre de commandes)" dotColor="#06b6d4">
          <Doughnut
            data={{
              labels: ['Commandes régul', 'Autres commandes'],
              datasets: [
                {
                  data: [kpi.nbRegul, kpi.nbNonRegul],
                  backgroundColor: ['#06b6d4', '#e5e7eb'],
                  borderWidth: 0
                }
              ]
            }}
            options={doughnutOptions}
          />
        </ChartWrapper>

        <ChartWrapper title="Taux de régul par région (en % de commandes)" dotColor="#0ea5e9">
          <Bar
            data={{
              labels: regionEntries.map(r => r.region),
              datasets: [
                {
                  label: '% régul (nombre de commandes)',
                  data: regionEntries.map(r => r.pctRegul),
                  backgroundColor: '#0ea5e9',
                  borderRadius: 6,
                  barPercentage: 0.7
                }
              ]
            }}
            options={horizontalBarOptions}
          />
        </ChartWrapper>

        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: '#22c55e' }}
              />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Évolution mensuelle des commandes régul
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 ml-4">
              Basé sur la <strong>Date de création</strong> de chaque commande
            </p>
            <div className="h-[260px]">
              <Line
                key="regul-monthly-evolution"
                data={{
                  labels: monthIndexKeys,
                  datasets: years.map((year, idx) => {
                    const colorPalette = ['#22c55e', '#0ea5e9', '#a855f7', '#f97316', '#ef4444'];
                    const borderColor = colorPalette[idx % colorPalette.length];
                    return {
                      label: year,
                      data: monthIndexKeys.map(
                        (m) => monthly[`${year}-${m}`]?.regulCount || 0
                      ),
                      borderColor,
                      backgroundColor: borderColor + '33', // même couleur en transparent
                      tension: 0.25
                    };
                  })
                }}
                options={lineOptions}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tableau par région et CR (réguls) */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Détail des commandes régul par Région &amp; CR
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Région (CRT)
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CR
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Nb régul
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Nb commandes
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  % régul (nb)
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CA régul
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  % régul (CA)
                </th>
              </tr>
            </thead>
            <tbody>
              {regionCrRows.map((row, idx) => (
                <tr
                  key={`${row.region}-${row.cr}-${idx}`}
                  className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                >
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                    {row.region}
                  </td>
                  <td className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[260px] truncate" title={row.cr}>
                    {row.cr}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">
                    {row.regulCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-800 dark:text-gray-200">
                    {row.totalCount}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {row.pctRegulCount.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                    {formatCurrency(row.caRegul)}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                    {row.pctRegulCA.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Liste des commandes régul */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white">
            Liste des commandes régul
          </h3>
        </div>
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-[#252525]">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  N° commande
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Date de création
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Région
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  CR
                </th>
                <th className="px-4 py-3 text-right font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Montant
                </th>
                <th className="px-4 py-3 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-[#333333]">
                  Demande d&apos;approvisionnement
                </th>
              </tr>
            </thead>
            <tbody>
              {regulCommands.map(cmd => {
                const row = data.find(r => String(r['Commande'] || '').trim() === cmd.commande);
                const rawDemandAppr =
                  row &&
                  ((row as any)['Demande d’approvisionnement'] ??
                    (row as any)["Demande d'approvisionnement"] ??
                    '');
                const hasDemand = String(rawDemandAppr || '').trim() !== '';
                return (
                  <tr
                    key={cmd.commande}
                    className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-800 dark:text-gray-200">
                      {cmd.commande}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cmd.dateCreation
                        ? new Date(cmd.dateCreation).toLocaleDateString('fr-FR')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {cmd.region}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300 max-w-[240px] truncate" title={cmd.cr}>
                      {cmd.cr}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-800 dark:text-gray-200">
                      {formatCurrency(cmd.ca)}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {hasDemand ? 'Oui' : 'Non'}
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

