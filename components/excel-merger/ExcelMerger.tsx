import React, { useState, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Search, Layers, X } from 'lucide-react';

import { FileData, MergedRow, SortState } from './types';
import DropZone from './DropZone';
import FileChip from './FileChip';
import StatsBar from './StatsBar';
import DataTable, { PAGE_SIZE } from './DataTable';
import ExportButton from './ExportButton';

interface Toast {
  id: string;
  type: 'warning' | 'error';
  message: string;
}

// Fallback si uuid non disponible — utiliser crypto
const generateId = () => {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
};

function parseFile(file: File): Promise<{ rows: Record<string, unknown>[]; headers: string[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const sheetName = wb.SheetNames[0];
        if (!sheetName) return reject(new Error('no_sheet'));
        const ws = wb.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: '' });
        const headers = json.length > 0 ? Object.keys(json[0]) : [];
        resolve({ rows: json, headers });
      } catch {
        reject(new Error('parse_error'));
      }
    };
    reader.onerror = () => reject(new Error('read_error'));
    reader.readAsArrayBuffer(file);
  });
}

export default function ExcelMerger() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [referenceColumns, setReferenceColumns] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [currentPage, setCurrentPage] = useState(1);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (type: Toast['type'], message: string) => {
    const id = generateId();
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  };

  const handleFilesSelected = useCallback(async (newFiles: File[]) => {
    for (const file of newFiles) {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();
      const validExts = ['.xlsx', '.xls', '.csv', '.ods'];
      if (!validExts.includes(ext)) {
        addToast('error', `Fichier rejeté : "${file.name}" — format non supporté (${ext})`);
        continue;
      }

      try {
        const { rows, headers } = await parseFile(file);

        if (rows.length === 0) {
          addToast('warning', `"${file.name}" est vide ou sans données — ignoré.`);
          continue;
        }

        setFiles(prev => {
          const isFirst = prev.length === 0;
          if (isFirst) {
            setReferenceColumns(headers);
          }
          return [
            ...prev,
            { id: generateId(), name: file.name, rows, rowCount: rows.length },
          ];
        });
      } catch {
        addToast('error', `Impossible de lire "${file.name}". Le fichier est peut-être corrompu.`);
      }
    }
  }, []);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const next = prev.filter(f => f.id !== id);
      if (next.length === 0) {
        setReferenceColumns([]);
        setSearch('');
        setSort({ column: null, direction: null });
        setCurrentPage(1);
      } else if (prev[0]?.id === id) {
        // Si on supprime le fichier de référence, le suivant devient référence
        const newRef = Object.keys(next[0].rows[0] ?? {});
        setReferenceColumns(newRef);
      }
      return next;
    });
  }, []);

  // Fusion de toutes les lignes
  const allRows = useMemo<MergedRow[]>(() => {
    let globalIndex = 1;
    const merged: MergedRow[] = [];
    for (const file of files) {
      for (const row of file.rows) {
        const mergedRow: MergedRow = {
          _index: globalIndex++,
          _source: file.name,
        };
        for (const col of referenceColumns) {
          mergedRow[col] = col in row ? row[col] : '';
        }
        merged.push(mergedRow);
      }
    }
    return merged;
  }, [files, referenceColumns]);

  // Filtre
  const filteredRows = useMemo<MergedRow[]>(() => {
    if (!search.trim()) return allRows;
    const q = search.toLowerCase();
    return allRows.filter(row =>
      referenceColumns.some(col => String(row[col] ?? '').toLowerCase().includes(q)) ||
      row._source.toLowerCase().includes(q)
    );
  }, [allRows, search, referenceColumns]);

  // Tri
  const sortedRows = useMemo<MergedRow[]>(() => {
    if (!sort.column || !sort.direction) return filteredRows;
    const col = sort.column;
    const dir = sort.direction === 'asc' ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      const av = String(a[col] ?? '');
      const bv = String(b[col] ?? '');
      return av.localeCompare(bv, 'fr', { numeric: true, sensitivity: 'base' }) * dir;
    });
  }, [filteredRows, sort]);

  const handleSort = (column: string) => {
    setSort(prev => {
      if (prev.column !== column) return { column, direction: 'asc' };
      if (prev.direction === 'asc') return { column, direction: 'desc' };
      return { column: null, direction: null };
    });
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const isEmpty = files.length === 0;

  return (
    <div className="space-y-6">
      {/* Toasts */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      >
        {toasts.map(t => (
          <div
            key={t.id}
            role="alert"
            className={`flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
              t.type === 'error'
                ? 'bg-red-50 dark:bg-red-900/40 border-red-200 dark:border-red-700 text-red-800 dark:text-red-200'
                : 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-700 text-amber-800 dark:text-amber-200'
            }`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              aria-label="Fermer la notification"
              className="text-current opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-500" />
            Fusion de fichiers Excel
          </h3>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5">
            Importez plusieurs fichiers, fusionnez-les et exportez le résultat — aucune donnée n'est enregistrée.
          </p>
        </div>
        {!isEmpty && (
          <ExportButton
            rows={allRows}
            columns={referenceColumns}
            files={files}
            disabled={allRows.length === 0}
          />
        )}
      </div>

      {/* Zone de dépôt */}
      <DropZone onFilesSelected={handleFilesSelected} />

      {/* État vide */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Layers className="w-16 h-16 text-gray-200 dark:text-slate-700 mb-4" />
          <p className="text-gray-400 dark:text-slate-500 text-sm">
            Aucun fichier chargé — déposez vos fichiers Excel ci-dessus pour commencer.
          </p>
        </div>
      )}

      {/* Chips fichiers */}
      {!isEmpty && (
        <div className="flex flex-wrap gap-2" role="list" aria-label="Fichiers chargés">
          {files.map(f => (
            <div key={f.id} role="listitem">
              <FileChip file={f} onRemove={handleRemoveFile} />
            </div>
          ))}
        </div>
      )}

      {/* Stats + barre de recherche + tableau */}
      {!isEmpty && (
        <>
          <StatsBar
            fileCount={files.length}
            totalRows={allRows.length}
            columnCount={referenceColumns.length}
            filteredRows={sortedRows.length}
          />

          {/* Recherche */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher dans toutes les colonnes…"
              aria-label="Rechercher dans les données"
              className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm text-gray-800 dark:text-slate-100 placeholder-gray-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition"
            />
          </div>

          {/* Tableau */}
          <DataTable
            rows={sortedRows}
            columns={referenceColumns}
            sort={sort}
            onSort={handleSort}
            currentPage={currentPage}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}
