import React from 'react';
import { FileSpreadsheet, X } from 'lucide-react';
import { FileData } from './types';

interface FileChipProps {
  file: FileData;
  onRemove: (id: string) => void;
}

export default function FileChip({ file, onRemove }: FileChipProps) {
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-full text-sm">
      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
      <span className="text-blue-800 dark:text-blue-200 font-medium max-w-[180px] truncate" title={file.name}>
        {file.name}
      </span>
      <span className="text-blue-500 dark:text-blue-400 text-xs whitespace-nowrap">
        {file.rowCount.toLocaleString('fr-FR')} ligne{file.rowCount > 1 ? 's' : ''}
      </span>
      <button
        onClick={() => onRemove(file.id)}
        aria-label={`Supprimer le fichier ${file.name}`}
        className="ml-1 w-4 h-4 rounded-full flex items-center justify-center text-blue-400 dark:text-blue-500 hover:text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex-shrink-0"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
