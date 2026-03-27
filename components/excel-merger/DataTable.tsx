import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import { MergedRow, SortState } from './types';
import Pagination from './Pagination';

interface DataTableProps {
  rows: MergedRow[];
  columns: string[];
  sort: SortState;
  onSort: (column: string) => void;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

const PAGE_SIZE = 150;

export default function DataTable({ rows, columns, sort, onSort, currentPage, pageSize, onPageChange }: DataTableProps) {
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const start = (currentPage - 1) * pageSize;
  const pageRows = rows.slice(start, start + pageSize);

  const SortIcon = ({ col }: { col: string }) => {
    if (sort.column !== col) return <ArrowUpDown className="w-3 h-3 opacity-40" />;
    return sort.direction === 'asc'
      ? <ArrowUp className="w-3 h-3 text-blue-500" />
      : <ArrowDown className="w-3 h-3 text-blue-500" />;
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-auto rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm">
        <table className="min-w-full text-sm" role="grid" aria-label="Données fusionnées">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
              <th
                scope="col"
                className="sticky left-0 z-10 px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-800 whitespace-nowrap w-12"
              >
                #
              </th>
              <th
                scope="col"
                onClick={() => onSort('_source')}
                className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap"
                aria-sort={sort.column === '_source' ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                <span className="inline-flex items-center gap-1">
                  Fichier source <SortIcon col="_source" />
                </span>
              </th>
              {columns.map(col => (
                <th
                  key={col}
                  scope="col"
                  onClick={() => onSort(col)}
                  className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap max-w-[200px]"
                  aria-sort={sort.column === col ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <span className="inline-flex items-center gap-1">
                    <span className="truncate">{col}</span>
                    <SortIcon col={col} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-4 py-8 text-center text-sm text-gray-400 dark:text-slate-500">
                  Aucun résultat pour cette recherche
                </td>
              </tr>
            ) : (
              pageRows.map(row => (
                <tr key={`${row._source}-${row._index}`} className="bg-white dark:bg-slate-900/40 hover:bg-blue-50/40 dark:hover:bg-slate-800/60 transition-colors">
                  <td className="sticky left-0 z-10 px-3 py-2 text-xs text-gray-400 dark:text-slate-500 bg-white dark:bg-slate-900/40 w-12 font-mono">
                    {row._index}
                  </td>
                  <td className="px-3 py-2 text-xs text-blue-700 dark:text-blue-300 whitespace-nowrap max-w-[180px]">
                    <span className="truncate block" title={row._source}>{row._source}</span>
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-3 py-2 text-gray-700 dark:text-slate-200 max-w-[200px]">
                      <span
                        className="block truncate"
                        title={row[col] != null ? String(row[col]) : ''}
                      >
                        {row[col] != null ? String(row[col]) : ''}
                      </span>
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
        totalRows={rows.length}
        pageSize={pageSize}
      />
    </div>
  );
}

export { PAGE_SIZE };
