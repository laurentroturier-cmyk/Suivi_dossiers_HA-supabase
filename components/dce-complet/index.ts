// ============================================
// DCE COMPLET - Index des exports
// Facilite les imports dans toute l'application
// ============================================

// Types
export * from './types';

// Types
export * from './types';

// Services (utils)
export { dceService, DCEService } from './utils/dceService';
export { mapProcedureToDCE } from './utils/dceMapping';
export * from './utils/procedureSyncService';
export { generateActeEngagementWord } from './utils/acteEngagementGenerator';

// Hooks
export { useDCEState } from './hooks/useDCEState';
export { useProcedureLoader, useProcedure } from './hooks/useProcedureLoader';

// Composants partagés
export { ProcedureSelector } from './components/shared/ProcedureSelector';
export { ProcedureHeader } from './components/shared/ProcedureHeader';
export { DCEStatusBar } from './components/shared/DCEStatusBar';
export { ConflictResolverModal } from './components/shared/ConflictResolverModal';

// Composant principal
export { DCEComplet } from './components/DCEComplet';
