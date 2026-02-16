/**
 * Indicateur de fraîcheur des données + bouton Charger / Mettre à jour.
 */
import React from 'react';
import { Calendar, RefreshCw, Upload } from 'lucide-react';

export interface DataFreshnessIndicatorProps {
  lastUpdated: string | null;
  rowCount: number;
  onLoadOrUpdate: (files: FileList) => Promise<void>;
  loading?: boolean;
  /** Afficher le bouton "Charger / Mettre à jour" à côté de la date */
  showUpdateButton?: boolean;
  className?: string;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return iso;
  }
}

export const DataFreshnessIndicator: React.FC<DataFreshnessIndicatorProps> = ({
  lastUpdated,
  rowCount,
  onLoadOrUpdate,
  loading = false,
  showUpdateButton = true,
  className = ''
}) => {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files?.length) {
      await onLoadOrUpdate(files);
      e.target.value = '';
    }
  };

  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      {lastUpdated ? (
        <>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 text-sm">
            <Calendar className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
            Données du {formatDate(lastUpdated)}
          </span>
          <span className="text-xs text-gray-500 dark:text-slate-400">
            {rowCount.toLocaleString('fr-FR')} ligne{rowCount !== 1 ? 's' : ''}
          </span>
        </>
      ) : null}
      {showUpdateButton && (
        <>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.tsv"
            className="hidden"
            onChange={handleChange}
            disabled={loading}
          />
          <button
            type="button"
            onClick={handleClick}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-cyan-500 dark:border-cyan-500 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-500/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            {lastUpdated ? 'Mettre à jour les données' : 'Charger les données'}
          </button>
        </>
      )}
    </div>
  );
};
