/**
 * Barrel file - Export centralisé de tous les composants et utilitaires du module analyse
 */

// Composants (ré-export pour éviter dépendance circulaire avec redaction → NotificationsQuickAccess → analyse)
export { default as Noti1Modal } from './components/Noti1Modal';
export { default as Noti3Modal } from './components/Noti3Modal';
export { default as Noti5Modal } from './components/Noti5Modal';
export { default as OuverturePlis } from './components/OuverturePlis';
export { default as RapportPresentation } from './components/RapportPresentation';
export { default as RecevabiliteOffres } from './components/RecevabiliteOffres';

// Utilitaires
export { generateRapportData } from './utils/generateRapportData';

// Types
export * from './types';
