/**
 * Module AN01 - Analyse technique des offres
 * Point d'entrée principal du module
 */

// Composants principaux
export { default as UploadView } from './components/UploadView';
export { default as Dashboard } from './components/Dashboard';
export { default as LotSelectionView } from './components/LotSelectionView';
export { default as GlobalTableView } from './components/GlobalTableView';
export { default as AnalyseOverview } from './components/AnalyseOverview';
export { default as An01EntryView } from './components/An01EntryView';
export { default as An01SaisieWizard } from './components/An01SaisieWizard';
export { default as An01LoadFromProcedureView } from './components/An01LoadFromProcedureView';
export { default as TechnicalAnalysisView } from './components/TechnicalAnalysisView';
export { default as ExportSelectModal } from './components/ExportSelectModal';
export { default as RapportPresentationModal } from './components/RapportPresentationModal';
export { default as SidePanel } from './components/SidePanel';
export { default as ScoreChart } from './components/ScoreChart';
export { default as PriceChart } from './components/PriceChart';
export { default as TrendChart } from './components/TrendChart';

// Types
export * from './types';

// Utilitaires
export { parseExcelFile } from './utils/excelParser';
export { projectToAnalysisData } from './utils/saisieToAnalysis';
export { exportRapportDOCX } from './utils/rapportExport';
export type { ExportRapportOptions } from './utils/rapportExport';
export type { An01EntryChoice } from './components/An01EntryView';
