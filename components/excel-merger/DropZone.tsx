import React, { useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';

interface DropZoneProps {
  onFilesSelected: (files: File[]) => void;
}

const ACCEPTED_EXTENSIONS = ['.xlsx', '.xls', '.csv', '.ods'];
const ACCEPTED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/vnd.oasis.opendocument.spreadsheet',
];

export default function DropZone({ onFilesSelected }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filterValidFiles = (files: File[]): File[] =>
    files.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return ACCEPTED_EXTENSIONS.includes(ext) || ACCEPTED_MIME.includes(f.type);
    });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    const valid = filterValidFiles(files);
    if (valid.length > 0) onFilesSelected(valid);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const valid = filterValidFiles(files);
    if (valid.length > 0) onFilesSelected(valid);
    // reset pour permettre re-sélection du même fichier
    e.target.value = '';
  };

  return (
    <div
      role="button"
      aria-label="Zone de dépôt de fichiers Excel. Cliquez ou déposez des fichiers ici."
      tabIndex={0}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={e => e.key === 'Enter' || e.key === ' ' ? inputRef.current?.click() : undefined}
      className={`
        relative flex flex-col items-center justify-center gap-3
        border-2 border-dashed rounded-xl p-10 cursor-pointer
        transition-all duration-200 select-none
        ${isDragging
          ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.01]'
          : 'border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800/60 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
        }
      `}
    >
      <UploadCloud className={`w-10 h-10 transition-colors ${isDragging ? 'text-blue-500' : 'text-gray-400 dark:text-slate-500'}`} />
      <div className="text-center">
        <p className="text-sm font-medium text-gray-700 dark:text-slate-200">
          Glissez-déposez vos fichiers ici
        </p>
        <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">
          ou cliquez pour sélectionner — .xlsx, .xls, .csv, .ods
        </p>
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXTENSIONS.join(',')}
        onChange={handleChange}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />
    </div>
  );
}
