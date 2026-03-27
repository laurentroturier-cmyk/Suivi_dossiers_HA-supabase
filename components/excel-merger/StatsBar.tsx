import React from 'react';
import { Files, Rows3, Columns3, Filter } from 'lucide-react';

interface StatsBarProps {
  fileCount: number;
  totalRows: number;
  columnCount: number;
  filteredRows: number;
}

export default function StatsBar({ fileCount, totalRows, columnCount, filteredRows }: StatsBarProps) {
  const stats = [
    { icon: Files, label: 'Fichiers', value: fileCount },
    { icon: Rows3, label: 'Lignes totales', value: totalRows.toLocaleString('fr-FR') },
    { icon: Columns3, label: 'Colonnes', value: columnCount },
    { icon: Filter, label: 'Lignes filtrées', value: filteredRows.toLocaleString('fr-FR') },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {stats.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm"
        >
          <div className="w-8 h-8 bg-blue-50 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
            <Icon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-slate-400">{label}</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white leading-tight">{value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
