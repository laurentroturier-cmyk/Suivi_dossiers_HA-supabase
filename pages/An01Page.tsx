import React, { useState } from 'react';
import UploadView from '@/components/an01/UploadView';
import Dashboard from '@/components/an01/Dashboard';
import LotSelectionView from '@/components/an01/LotSelectionView';
import GlobalTableView from '@/components/an01/GlobalTableView';
import { parseExcelFile } from '@/an01-utils/services/excelParser';
import { AnalysisData } from '@/components/an01/types';

/**
 * Page AN01 - Analyse technique des offres
 * Fonctionnalité complète préservée depuis App.old.tsx
 */
const An01Page: React.FC = () => {
  const [an01Data, setAn01Data] = useState<{ lots: AnalysisData[], globalMetadata: Record<string, string> } | null>(null);
  const [an01ProcedureNumber, setAn01ProcedureNumber] = useState<string>('');
  const [an01LoadMode, setAn01LoadMode] = useState<'manual' | 'auto'>('auto');
  const [an01SelectedLotIndex, setAn01SelectedLotIndex] = useState<number | null>(null);
  const [an01ViewMode, setAn01ViewMode] = useState<'grid' | 'table'>('grid');
  const [an01IsLoading, setAn01IsLoading] = useState(false);
  const [an01Error, setAn01Error] = useState<string | null>(null);

  const handleAn01FileSelect = async (file: File) => {
    setAn01IsLoading(true);
    setAn01Error(null);
    try {
      const data = await parseExcelFile(file);
      setAn01Data(data);
    } catch (error) {
      setAn01Error(error instanceof Error ? error.message : 'Erreur lors du parsing du fichier');
      console.error('Erreur parsing AN01:', error);
    } finally {
      setAn01IsLoading(false);
    }
  };

  const handleAn01Back = () => {
    if (an01SelectedLotIndex !== null) {
      setAn01SelectedLotIndex(null);
    } else {
      setAn01Data(null);
      setAn01ProcedureNumber('');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {!an01Data ? (
        <UploadView
          onFileSelect={handleAn01FileSelect}
          isLoading={an01IsLoading}
          error={an01Error}
          procedureNumber={an01ProcedureNumber}
          onProcedureNumberChange={setAn01ProcedureNumber}
          loadMode={an01LoadMode}
          onLoadModeChange={setAn01LoadMode}
        />
      ) : an01SelectedLotIndex !== null ? (
        <Dashboard
          lot={an01Data.lots[an01SelectedLotIndex]}
          lotNumber={an01SelectedLotIndex + 1}
          totalLots={an01Data.lots.length}
          globalMetadata={an01Data.globalMetadata}
          procedureNumber={an01ProcedureNumber}
          onBack={handleAn01Back}
        />
      ) : an01ViewMode === 'grid' ? (
        <LotSelectionView
          lots={an01Data.lots}
          onSelectLot={setAn01SelectedLotIndex}
          onViewModeChange={setAn01ViewMode}
          onBack={handleAn01Back}
        />
      ) : (
        <GlobalTableView
          lots={an01Data.lots}
          globalMetadata={an01Data.globalMetadata}
          procedureNumber={an01ProcedureNumber}
          onViewModeChange={setAn01ViewMode}
          onBack={handleAn01Back}
        />
      )}
    </div>
  );
};

export default An01Page;
