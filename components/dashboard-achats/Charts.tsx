import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  ChartOptions
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { AchatRow } from './types';
import { groupSum, topN, formatCurrency, formatCurrencyShort, percentage, truncate } from './utils';
import { CHART_COLORS } from './constants';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ChartWrapperProps {
  title: string;
  children: React.ReactNode;
  dotColor?: string;
}

export const ChartWrapper: React.FC<ChartWrapperProps> = ({ title, children, dotColor = '#38bdf8' }) => {
  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: dotColor }}
        />
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{title}</h3>
      </div>
      <div className="h-[260px]">
        {children}
      </div>
    </div>
  );
};

interface OverviewChartsProps {
  data: AchatRow[];
}

export const OverviewCharts: React.FC<OverviewChartsProps> = ({ data }) => {
  const trimData = groupSum(data, 'Trimestre', 'Montant de la ventilation de commande');
  const trimLabels = Object.keys(trimData).sort();
  const trimValues = trimLabels.map(k => trimData[k]);

  const famData = groupSum(data, "Famille d'achats", 'Montant de la ventilation de commande');
  const famEntries = topN(famData, 10);

  const statData = groupSum(data, 'Signification du statut du document', 'Montant de la ventilation de commande');
  const statEntries = topN(statData, 10);

  const fournData = groupSum(data, 'Fournisseur', 'Montant de la ventilation de commande');
  const top10Fourn = topN(fournData, 10);

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
          color: '#8896ab'
        },
        grid: { display: false }
      }
    }
  };

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
            return truncate(label, 22);
          },
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <ChartWrapper title="CA par Trimestre" dotColor="#38bdf8">
        <Bar
          data={{
            labels: trimLabels,
            datasets: [{
              label: 'CA Commandé',
              data: trimValues,
              backgroundColor: '#38bdf8',
              borderRadius: 6,
              barPercentage: 0.6
            }]
          }}
          options={barOptions}
        />
      </ChartWrapper>

      <ChartWrapper title="Répartition par Famille" dotColor="#a78bfa">
        <Doughnut
          data={{
            labels: famEntries.map(e => e[0]),
            datasets: [{
              data: famEntries.map(e => e[1]),
              backgroundColor: CHART_COLORS,
              borderWidth: 0
            }]
          }}
          options={doughnutOptions}
        />
      </ChartWrapper>

      <ChartWrapper title="Statut des commandes" dotColor="#34d399">
        <Doughnut
          data={{
            labels: statEntries.map(e => e[0]),
            datasets: [{
              data: statEntries.map(e => e[1]),
              backgroundColor: CHART_COLORS,
              borderWidth: 0
            }]
          }}
          options={doughnutOptions}
        />
      </ChartWrapper>

      <ChartWrapper title="Top 10 Fournisseurs" dotColor="#fb923c">
        <Bar
          data={{
            labels: top10Fourn.map(e => e[0]),
            datasets: [{
              label: 'CA Commandé',
              data: top10Fourn.map(e => e[1]),
              backgroundColor: CHART_COLORS.slice(0, 10),
              borderRadius: 6,
              barPercentage: 0.7
            }]
          }}
          options={horizontalBarOptions}
        />
      </ChartWrapper>
    </div>
  );
};
