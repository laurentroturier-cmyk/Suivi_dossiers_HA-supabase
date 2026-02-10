import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { AchatRow, Filters, KPIData, TabType } from './types';
import { UploadZone } from './UploadZone';
import { FiltersBar } from './FiltersBar';
import { KPICards } from './KPICards';
import { OverviewCharts } from './Charts';
import { DataTable } from './DataTable';
import { FamiliesTab } from './FamiliesTab';
import { SuppliersTab } from './SuppliersTab';
import { RegionsTab } from './RegionsTab';
import { parseNumber, sumBy } from './utils';
import { MONEY_COLS } from './constants';
import { PDFExport } from './PDFExport';

interface FileItem {
  file: File;
  id: string;
}

export const DashboardAchats: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [allData, setAllData] = useState<AchatRow[]>([]);
  const [filteredData, setFilteredData] = useState<AchatRow[]>([]);
  const [filters, setFilters] = useState<Filters>({
    trimestre: '',
    famille: '',
    fournisseur: '',
    region: '',
    statut: '',
    categorie: ''
  });
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const handleFilesAdd = (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    Array.from(fileList).forEach(file => {
      const exists = files.find(f => f.file.name === file.name && f.file.size === file.size);
      if (!exists) {
        newFiles.push({ file, id: `${file.name}-${file.size}-${Date.now()}` });
      }
    });
    setFiles(prev => [...prev, ...newFiles]);
  };

  const handleFileRemove = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const readFile = async (file: File): Promise<AchatRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const wb = XLSX.read(data, { type: 'array', cellText: true, cellDates: true });
          let rows: any[] = [];
          for (const sheetName of wb.SheetNames) {
            const json = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { defval: '' });
            rows = rows.concat(json);
          }
          resolve(rows);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      let data: AchatRow[] = [];
      for (const fileItem of files) {
        const rows = await readFile(fileItem.file);
        rows.forEach(r => {
          r._source = fileItem.file.name;
        });
        data = data.concat(rows);
      }

      // Normalize money columns
      data.forEach(row => {
        MONEY_COLS.forEach(col => {
          row[col] = parseNumber(row[col]);
        });
      });

      setAllData(data);
      setFilteredData(data);
      setShowDashboard(true);
    } catch (error) {
      console.error('Error analyzing files:', error);
      alert('Erreur lors de l\'analyse des fichiers. Veuillez vérifier le format.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      trimestre: '',
      famille: '',
      fournisseur: '',
      region: '',
      statut: '',
      categorie: ''
    });
  };

  const handleBackToUpload = () => {
    setShowDashboard(false);
    setAllData([]);
    setFilteredData([]);
    setFilters({
      trimestre: '',
      famille: '',
      fournisseur: '',
      region: '',
      statut: '',
      categorie: ''
    });
  };

  // Apply filters
  useEffect(() => {
    let data = allData;
    
    if (filters.trimestre) {
      data = data.filter(r => r['Trimestre'] === filters.trimestre);
    }
    if (filters.famille) {
      data = data.filter(r => r["Famille d'achats"] === filters.famille);
    }
    if (filters.fournisseur) {
      data = data.filter(r => r['Fournisseur'] === filters.fournisseur);
    }
    if (filters.region) {
      data = data.filter(r => r['Description du CRT'] === filters.region);
    }
    if (filters.statut) {
      data = data.filter(r => r['Signification du statut du document'] === filters.statut);
    }
    if (filters.categorie) {
      data = data.filter(r => r["Catégorie d'achats"] === filters.categorie);
    }

    setFilteredData(data);
  }, [filters, allData]);

  // Compute KPIs
  const kpiData: KPIData = {
    totalCommande: sumBy(filteredData, 'Montant de la ventilation de commande'),
    totalFacture: sumBy(filteredData, 'Montant de ventilation facturé'),
    totalLivre: sumBy(filteredData, 'Montant de ventilation livré'),
    totalMontant: sumBy(filteredData, 'Montant total'),
    nbFournisseurs: new Set(filteredData.map(r => r['Fournisseur'])).size,
    nbCommandes: new Set(filteredData.map(r => r['Commande'])).size,
    nbLignes: filteredData.length
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 dark:bg-black/90 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-5">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <div className="text-gray-300">Analyse en cours…</div>
        </div>
      </div>
    );
  }

  if (!showDashboard) {
    return (
      <UploadZone
        files={files}
        onFilesAdd={handleFilesAdd}
        onFileRemove={handleFileRemove}
        onAnalyze={handleAnalyze}
      />
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'families', label: 'Familles & Catégories' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'regions', label: 'Entités & Régions' },
    { id: 'data', label: 'Données détaillées' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0d0f12]">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#1E1E1E]/80 dark:border-[#333333]">
        <div className="px-7 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <h2 className="text-lg font-black bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              📊 Dashboard Achats
            </h2>
            <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-[#252525] text-gray-600 dark:text-gray-400">
              {allData.length} lignes · {files.length} fichier(s)
            </span>
          </div>
          <div className="flex gap-2.5">
            <PDFExport kpiData={kpiData} chartData={filteredData} filters={filters} />
            <button
              onClick={handleBackToUpload}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-[#444444] rounded-lg hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              + Charger d'autres fichiers
            </button>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-gray-100 dark:bg-[#252525] border border-gray-300 dark:border-[#444444] rounded-lg hover:border-cyan-500 hover:bg-gray-200 dark:hover:bg-[#2a2a2a] transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <FiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        data={allData}
      />

      {/* Tabs */}
      <div className="flex gap-0 px-7 bg-white border-b border-gray-200 dark:bg-[#1E1E1E] dark:border-[#333333]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3.5 text-sm font-semibold transition-all border-b-2 ${
              activeTab === tab.id
                ? 'text-cyan-600 dark:text-cyan-400 border-cyan-600 dark:border-cyan-400'
                : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="px-7 py-6">
        {activeTab === 'overview' && (
          <>
            <KPICards data={kpiData} />
            <OverviewCharts data={filteredData} />
          </>
        )}

        {activeTab === 'families' && (
          <FamiliesTab data={filteredData} />
        )}

        {activeTab === 'suppliers' && (
          <SuppliersTab data={filteredData} />
        )}

        {activeTab === 'regions' && (
          <RegionsTab data={filteredData} />
        )}

        {activeTab === 'data' && (
          <DataTable
            data={filteredData}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        )}
      </div>
    </div>
  );
};
