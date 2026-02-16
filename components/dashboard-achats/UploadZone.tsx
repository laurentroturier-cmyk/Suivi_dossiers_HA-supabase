import React from 'react';
import { Upload, X } from 'lucide-react';

interface FileItem {
  file: File;
  id: string;
}

interface UploadZoneProps {
  files: FileItem[];
  onFilesAdd: (files: FileList) => void;
  onFileRemove: (id: string) => void;
  onAnalyze: () => void;
  loading?: boolean;
  /** Message affiché quand il n'y a pas encore de données (premier chargement). */
  emptyMessage?: string;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  files,
  onFilesAdd,
  onFileRemove,
  onAnalyze,
  loading = false,
  emptyMessage
}) => {
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length) {
      onFilesAdd(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes: number) => {
    return (bytes / 1024).toFixed(1) + ' Ko';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-8 py-12 bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#0f172a] dark:via-[#0f172a] dark:to-[#0f172a]">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
            📊 Commandes Fina par Trimestre
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            {emptyMessage ?? 'Chargez vos fichiers Excel ou CSV pour générer un tableau de bord commandes'}
          </p>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-14 text-center cursor-pointer transition-all duration-300 bg-white dark:bg-slate-800 dark:border-slate-600 ${
            dragOver
              ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-500/10 dark:border-cyan-500 shadow-lg'
              : 'border-gray-300 dark:border-slate-600 hover:border-cyan-400 dark:hover:border-slate-500 hover:shadow-md'
          }`}
        >
          <div className="mb-4 flex justify-center">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Upload className="w-7 h-7 text-white" />
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">
            Glissez vos fichiers ici
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            ou cliquez pour sélectionner — .xlsx, .xls, .csv acceptés
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls,.csv,.tsv"
            className="hidden"
            onChange={(e) => e.target.files && onFilesAdd(e.target.files)}
          />
        </div>

        {files.length > 0 && (
          <div className="mt-6 space-y-2">
            {files.map(item => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-[#252525] border border-gray-200 dark:border-[#333333] rounded-lg animate-in slide-in-from-bottom duration-300"
              >
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-white">
                    {item.file.name.split('.').pop()?.toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                    {item.file.name}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {formatFileSize(item.file.size)}
                  </div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onFileRemove(item.id); }}
                  className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <button
            onClick={onAnalyze}
            disabled={loading}
            className="mt-6 w-full py-3.5 px-12 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Chargement…
              </>
            ) : (
              'Charger les données'
            )}
          </button>
        )}
      </div>
    </div>
  );
};
