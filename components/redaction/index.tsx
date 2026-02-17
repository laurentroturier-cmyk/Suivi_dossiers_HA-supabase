/**
 * Barrel file - Export centralisé de tous les composants et utilitaires du module redaction
 */

// Composants principaux
export { default as RedactionPlaceholder } from './components/RedactionPlaceholder';
export { default as DCESection } from './components/DCESection';
export { default as ReglementConsultation } from './components/ReglementConsultation';
export { default as NOTI1Section } from './components/NOTI1Section';
export { default as Noti3Section } from './components/Noti3Section';
export { default as NOTI5Section } from './components/NOTI5Section';
export { default as NotificationsQuickAccess } from './components/NotificationsQuickAccess';
export { default as NotiMultiAttributaires } from './components/NotiMultiAttributaires';
export { default as MultiLotsDashboard } from './components/MultiLotsDashboard';

// Composants modaux
export { default as Noti1MultiModal } from './components/Noti1MultiModal';
export { default as Noti3MultiModal } from './components/Noti3MultiModal';
export { default as Noti5MultiModal } from './components/Noti5MultiModal';

// Questionnaire
export { default as QuestionnaireTechnique } from './components/questionnaire/QuestionnaireTechnique';

// Types
export * from './types';

// Utilitaires (exports sélectifs pour les fonctions principales)
export { saveNoti1, loadNoti1 } from './utils/noti1Storage';
export { exportNoti1Html, generateNoti1HtmlAsBlob } from './utils/noti1HtmlGenerator';
export { saveNoti5, loadNoti5 } from './utils/noti5Storage';
export { exportNoti5Html, generateNoti5HtmlAsBlob } from './utils/noti5HtmlGenerator';
export { exportNoti3Html, generateNoti3HtmlAsBlob } from './utils/noti3HtmlGenerator';
export { exportAllNoti3ToZip, getZipExportInfo } from './utils/noti3ZipExport';
export { saveReglementConsultation, loadReglementConsultation } from './utils/reglementConsultationStorage';
export { generateReglementConsultationWord } from './utils/reglementConsultationGenerator';
export { generateRapportCommissionWord } from './utils/rapportCommissionGenerator';
export { autoFillRCFromProcedure } from './utils/procedureAutoFill';
export { analyzeMultiLots, isMultiLots } from './utils/multiLotsAnalyzer';
