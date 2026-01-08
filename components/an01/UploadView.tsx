import React, { useCallback, useState } from 'react';
import { Upload, FileSpreadsheet, Loader2, AlertTriangle } from 'lucide-react';

interface UploadViewProps {
  onFileUpload: (file: File) => void;
  isLoading: boolean;
  error: string | null;
}

const UploadView: React.FC<UploadViewProps> = ({ onFileUpload, isLoading, error }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileUpload(e.dataTransfer.files[0]);
    }
  }, [onFileUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(e.target.files[0]);
    }
  }, [onFileUpload]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-gray-50 h-full">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full text-center">
        <div className="mb-6 flex flex-col items-center">
          <FileSpreadsheet className="text-green-600 w-16 h-16 mb-4" />
          <h1 className="text-3xl font-bold text-gray-800">Analyseur d'Offres AN01</h1>
          <p className="text-gray-500 mt-2">Glissez votre fichier Excel (.xlsx) pour générer le rapport.</p>
        </div>

        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-4 border-dashed rounded-lg p-10 cursor-pointer transition-all
            flex flex-col items-center justify-center min-h-[250px]
            ${isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}
          `}
        >
          {isLoading ? (
            <div className="w-full flex flex-col items-center animate-pulse">
              <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-3" />
              <p className="text-sm text-gray-600 font-semibold">Analyse en cours...</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div className="h-full bg-green-600 w-1/2 animate-[pulse_1s_infinite]"></div>
              </div>
            </div>
          ) : (
            <>
              <Upload className="text-gray-400 w-12 h-12 mb-3" />
              <p className="text-lg font-medium text-gray-600">Glisser-déposer le fichier ici</p>
              <p className="text-sm text-gray-400 my-2">ou</p>
              <label className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded-full transition shadow-md cursor-pointer">
                Parcourir les fichiers
                <input 
                  type="file" 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange}
                />
              </label>
            </>
          )}
        </div>

        {error && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center justify-center border border-red-100">
            <AlertTriangle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
      </div>
      <p className="mt-8 text-gray-400 text-xs">Afpa DNA &copy; 2025 - Traitement local sécurisé</p>
    </div>
  );
};

export default UploadView;