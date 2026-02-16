import React, { useState, useEffect, useCallback } from 'react';
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
import { RegulTab } from './RegulTab';
import { PDFExport } from './PDFExport';
import { getMetadata, clearAllData } from './db/achatsDb';
import { loadOrUpdateData } from './services/loadOrUpdateData';
import {
  initDuckDB,
  closeDuckDB,
  queryKPI,
  queryFilteredData,
  getDistinctColumns
} from './duckdb/achatsDuckDB';
import { DataFreshnessIndicator } from './DataFreshnessIndicator';
import type { DistinctColumns } from './FiltersBar';

interface FileItem {
  file: File;
  id: string;
}

export const DashboardAchats: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
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
  const [checkingData, setCheckingData] = useState(true);
  const [duckReady, setDuckReady] = useState(false);
  const [metadata, setMetadata] = useState<{ lastUpdated: string; rowCount: number } | null>(null);
  const [distinctColumns, setDistinctColumns] = useState<DistinctColumns | null>(null);
  /** Incrémenté à chaque chargement de données pour forcer le re-fetch et le re-render des graphiques. */
  const [dataVersion, setDataVersion] = useState(0);
  const [kpiData, setKpiData] = useState<KPIData>({
    totalCommande: 0,
    totalFacture: 0,
    totalLivre: 0,
    totalMontant: 0,
    nbFournisseurs: 0,
    nbCommandes: 0,
    nbLignes: 0
  });

  const loadMetadata = useCallback(async () => {
    const meta = await getMetadata();
    if (meta) setMetadata({ lastUpdated: meta.lastUpdated, rowCount: meta.rowCount });
    return meta;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCheckingData(true);
      const meta = await loadMetadata();
      if (cancelled) return;
      if (meta && meta.rowCount > 0) {
        setShowDashboard(true);
      } else {
        setShowDashboard(false);
      }
      setCheckingData(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadMetadata]);

  useEffect(() => {
    if (!showDashboard) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await initDuckDB();
        if (cancelled) return;
        setDuckReady(true);
        setDataVersion((v) => v + 1);
      } catch (e) {
        console.error('Init DuckDB:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showDashboard]);

  useEffect(() => {
    if (!duckReady) return;
    let cancelled = false;
    (async () => {
      try {
        const [distinct, kpi, data] = await Promise.all([
          getDistinctColumns(),
          queryKPI(filters),
          queryFilteredData(filters)
        ]);
        if (cancelled) return;
        setDistinctColumns(distinct);
        setKpiData(kpi);
        setFilteredData(data);
      } catch (e) {
        console.error('Query DuckDB:', e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [duckReady, filters, dataVersion]);

  const handleFilesAdd = (fileList: FileList) => {
    const newFiles: FileItem[] = [];
    Array.from(fileList).forEach((file) => {
      const exists = files.find((f) => f.file.name === file.name && f.file.size === file.size);
      if (!exists) newFiles.push({ file, id: `${file.name}-${file.size}-${Date.now()}` });
    });
    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleFileRemove = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleAnalyze = async () => {
    if (files.length === 0) return;
    setLoading(true);
    try {
      const fileList = files.map((f) => f.file);
      await loadOrUpdateData(fileList);
      await loadMetadata();
      setFiles([]);
      setShowDashboard(true);
      setDuckReady(false);
    } catch (error) {
      console.error('Error loading data:', error);
      alert("Erreur lors du chargement des fichiers. Vérifiez le format.");
    } finally {
      setLoading(false);
    }
  };

  const handleLoadOrUpdate = async (fileList: FileList) => {
    const list = Array.from(fileList);
    if (list.length === 0) return;
    setLoading(true);
    try {
      await loadOrUpdateData(list);
      await loadMetadata();
      await closeDuckDB();
      setDuckReady(false);
      await initDuckDB();
      setDuckReady(true);
      setDataVersion((v) => v + 1);
    } catch (error) {
      console.error('Error updating data:', error);
      alert("Erreur lors de la mise à jour des données.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
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

  const handleBackToUpload = async () => {
    await closeDuckDB();
    setShowDashboard(false);
    setDuckReady(false);
    setFilteredData([]);
    setDistinctColumns(null);
    setMetadata(null);
    setDataVersion(0);
    setFilters({
      trimestre: '',
      famille: '',
      fournisseur: '',
      region: '',
      statut: '',
      categorie: ''
    });
  };

  const handlePurgeData = async () => {
    if (!window.confirm("Voulez-vous vraiment purger toutes les données du dashboard achats ?")) {
      return;
    }
    setLoading(true);
    try {
      await closeDuckDB();
      await clearAllData();
      setDuckReady(false);
      setShowDashboard(false);
      setFilteredData([]);
      setDistinctColumns(null);
      setMetadata(null);
      setDataVersion(0);
      setFilters({
        trimestre: '',
        famille: '',
        fournisseur: '',
        region: '',
        statut: '',
        categorie: ''
      });
    } catch (error) {
      console.error('Erreur lors de la purge des données achats:', error);
      alert("Erreur lors de la purge des données achats.");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    // Force un rechargement complet depuis IndexedDB + recalcul KPIs/graphes
    setLoading(true);
    try {
      await closeDuckDB();
      setDuckReady(false);
      await initDuckDB();
      setDuckReady(true);
      setDataVersion((v) => v + 1);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données achats:', error);
      alert("Erreur lors du rafraîchissement des données achats.");
    } finally {
      setLoading(false);
    }
  };

  if (checkingData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <div className="text-gray-600 dark:text-slate-400">Vérification des données…</div>
        </div>
      </div>
    );
  }

  if (loading && !showDashboard) {
    return (
      <div className="fixed inset-0 bg-gray-900/90 dark:bg-black/90 flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-5">
          <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
          <div className="text-gray-300">Chargement des données…</div>
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
        loading={loading}
        emptyMessage="Aucune donnée. Chargez vos fichiers Excel ou CSV pour commencer."
      />
    );
  }

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: "Vue d'ensemble" },
    { id: 'families', label: 'Familles & Catégories' },
    { id: 'suppliers', label: 'Fournisseurs' },
    { id: 'regions', label: 'Entités & Régions' },
    { id: 'regul', label: 'Analyses Régul & Appro' },
    { id: 'data', label: 'Données détaillées' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a]">
      <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#1E1E1E]/80 dark:border-[#333333]">
        <div className="px-7 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3.5">
            <h2 className="text-lg font-black bg-gradient-to-r from-cyan-600 to-blue-600 dark:from-cyan-400 dark:to-blue-400 bg-clip-text text-transparent">
              📊 Dashboard Achats
            </h2>
            <DataFreshnessIndicator
              lastUpdated={metadata?.lastUpdated ?? null}
              rowCount={metadata?.rowCount ?? 0}
              onLoadOrUpdate={handleLoadOrUpdate}
              loading={loading}
              showUpdateButton
            />
          </div>
          <div className="flex gap-2.5">
            <PDFExport kpiData={kpiData} chartData={filteredData} filters={filters} />
            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 dark:border-[#444444] rounded-lg hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all text-gray-700 dark:text-gray-300 font-medium"
            >
              Rafraîchir
            </button>
            <button
              onClick={handlePurgeData}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-red-300 dark:border-red-700 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-all font-medium"
            >
              Purger les données
            </button>
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

      <FiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        distinctColumns={distinctColumns ?? undefined}
      />

      <div className="flex gap-0 px-7 bg-white border-b border-gray-200 dark:bg-[#1E1E1E] dark:border-[#333333]">
        {tabs.map((tab) => (
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

      <div className="px-7 py-6" key={`data-${dataVersion}-${metadata?.lastUpdated ?? ''}`}>
        {activeTab === 'overview' && (
          <>
            <KPICards data={kpiData} />
            <OverviewCharts data={filteredData} />
          </>
        )}
        {activeTab === 'families' && <FamiliesTab data={filteredData} />}
        {activeTab === 'suppliers' && <SuppliersTab data={filteredData} />}
        {activeTab === 'regions' && <RegionsTab data={filteredData} />}
        {activeTab === 'regul' && <RegulTab data={filteredData} />}
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
