// ============================================
// DCE COMPLET - Index des exports
// Facilite les imports dans toute l'application
// ============================================

// Types
export * from './types';

// Services
export { dceService, DCEService } from './services/dceService';
export { mapProcedureToDCE } from './services/dceMapping';

// Hooks
export { useDCEState } from './hooks/useDCEState';
export { useProcedureLoader, useProcedure } from './hooks/useProcedureLoader';

// Composants partagés
export { ProcedureSelector } from './shared/ProcedureSelector';
export { ProcedureHeader } from './shared/ProcedureHeader';
export { DCEStatusBar } from './shared/DCEStatusBar';

// Composant principal
export { DCEComplet } from './DCEComplet';
