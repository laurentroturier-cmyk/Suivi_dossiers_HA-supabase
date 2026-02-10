import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Download } from 'lucide-react';
import { AchatRow } from './types';
import { TABLE_COLS, MONEY_COLS, PAGE_SIZE } from './constants';
import { formatCurrency } from './utils';

interface DataTableProps {
  data: AchatRow[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const DataTable: React.FC<DataTableProps> = ({ data, searchQuery, onSearchChange }) => {
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);

  // Filter by search
  let filteredData = data;
  if (searchQuery) {
    const query = searchQuery.toLowerCase();
    filteredData = data.filter(row =>
      TABLE_COLS.some(col => String(row[col] || '').toLowerCase().includes(query))
    );
  }

  // Sort
  if (sortColumn) {
    filteredData = [...filteredData].sort((a, b) => {
      const va = a[sortColumn];
      const vb = b[sortColumn];
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortAsc ? va - vb : vb - va;
      }
      const sa = String(va || '');
      const sb = String(vb || '');
      return sortAsc ? sa.localeCompare(sb) : sb.localeCompare(sa);
    });
  }

  const totalPages = Math.ceil(filteredData.length / PAGE_SIZE);
  const paginatedData = filteredData.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleSort = (col: string) => {
    if (sortColumn === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortColumn(col);
      setSortAsc(true);
    }
  };

  const exportCSV = () => {
    const rows = [TABLE_COLS.join(';')];
    filteredData.forEach(row => {
      rows.push(
        TABLE_COLS.map(col => {
          let val = row[col] ?? '';
          if (typeof val === 'string' && (val.includes(';') || val.includes('"'))) {
            val = '"' + val.replace(/"/g, '""') + '"';
          }
          return val;
        }).join(';')
      );
    });
    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'export_achats.csv';
    a.click();
  };

  const getStatusBadgeClass = (statut: string) => {
    if (statut === 'Clos' || statut === 'Définitivement clos') {
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    }
    if (statut === 'Ouvert') {
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400';
    }
    if (statut === 'Rejeté' || statut === 'Annulé') {
      return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    }
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333333] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-[#333333]">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white">Données consolidées</h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Rechercher…"
            className="bg-gray-50 dark:bg-[#252525] border border-gray-300 dark:border-[#444444] text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-lg text-sm w-60 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
          />
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-1.5 text-sm border border-gray-300 dark:border-[#444444] rounded-lg hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-gray-700 dark:text-gray-300"
          >
            <Download className="w-4 h-4" />
            Exporter CSV
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10">
            <tr>
              {TABLE_COLS.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className={`bg-gray-100 dark:bg-[#252525] px-3.5 py-2.5 text-left font-semibold text-xs uppercase tracking-wider text-gray-600 dark:text-gray-400 cursor-pointer hover:text-cyan-600 dark:hover:text-cyan-400 border-b border-gray-200 dark:border-[#333333] whitespace-nowrap select-none ${
                    sortColumn === col ? 'text-cyan-600 dark:text-cyan-400' : ''
                  }`}
                >
                  {col}
                  {sortColumn === col && (sortAsc ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, idx) => (
              <tr
                key={idx}
                className="border-b border-gray-100 dark:border-[#2a2a2a] hover:bg-cyan-50/30 dark:hover:bg-cyan-500/5 transition-colors"
              >
                {TABLE_COLS.map(col => {
                  let value = row[col] ?? '';
                  if (MONEY_COLS.includes(col) && typeof value === 'number') {
                    value = formatCurrency(value);
                  }
                  
                  if (col === 'Signification du statut du document') {
                    return (
                      <td key={col} className="px-3.5 py-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(String(value))}`}>
                          {value}
                        </span>
                      </td>
                    );
                  }

                  return (
                    <td
                      key={col}
                      className="px-3.5 py-2.5 whitespace-nowrap max-w-[250px] overflow-hidden text-ellipsis text-gray-800 dark:text-gray-200"
                      title={String(value)}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-5 py-3 border-t border-gray-200 dark:border-[#333333] text-sm text-gray-600 dark:text-gray-400">
        <span>
          {filteredData.length} résultat(s) — Page {page + 1}/{totalPages || 1}
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(0)}
            disabled={page === 0}
            className="p-1.5 border border-gray-300 dark:border-[#444444] rounded hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="p-1.5 border border-gray-300 dark:border-[#444444] rounded hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="p-1.5 border border-gray-300 dark:border-[#444444] rounded hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => setPage(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="p-1.5 border border-gray-300 dark:border-[#444444] rounded hover:border-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
