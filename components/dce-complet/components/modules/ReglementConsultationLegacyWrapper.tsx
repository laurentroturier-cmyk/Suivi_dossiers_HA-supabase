import React from 'react';
import { ReglementConsultation, type RapportCommissionData } from '../../../redaction';
import type { LotConfiguration } from '../../types';

interface ReglementConsultationLegacyWrapperProps {
  numeroProcedure?: string;
  onSave?: (data: RapportCommissionData) => void;
  initialData?: RapportCommissionData;
  lotsFromConfigurationGlobale?: LotConfiguration[];
  /** Index de la section RC à afficher (0–6) quand le sous-menu DCE est utilisé */
  initialRCSection?: number;
  /** Masquer la sidebar "Sections" du RC (navigation gérée par le sous-menu DCE) */
  hideRCSectionsSidebar?: boolean;
}

// Wrapper pour intégrer le module RC dans le DCE avec sauvegarde automatique.
// Transmet les changements de données au parent via onSave.
export function ReglementConsultationLegacyWrapper({ 
  numeroProcedure, 
  onSave, 
  initialData,
  lotsFromConfigurationGlobale,
  initialRCSection,
  hideRCSectionsSidebar,
}: ReglementConsultationLegacyWrapperProps) {
  return (
    <ReglementConsultation 
      initialNumeroProcedure={numeroProcedure}
      onDataChange={onSave}
      initialData={initialData}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
      initialSection={initialRCSection}
      hideSectionsSidebar={hideRCSectionsSidebar}
    />
  );
}
