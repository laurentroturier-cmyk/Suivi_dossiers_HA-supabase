import React from 'react';
import { ReglementConsultation, type RapportCommissionData } from '../../../redaction';
import type { LotConfiguration } from '../../types';

interface ReglementConsultationLegacyWrapperProps {
  numeroProcedure?: string;
  procedureRefComplete?: string;
  onSave?: (data: RapportCommissionData) => void;
  initialData?: RapportCommissionData;
  lotsFromConfigurationGlobale?: LotConfiguration[];
  initialRCSection?: number;
  hideRCSectionsSidebar?: boolean;
}

export function ReglementConsultationLegacyWrapper({
  numeroProcedure,
  procedureRefComplete,
  onSave,
  initialData,
  lotsFromConfigurationGlobale,
  initialRCSection,
  hideRCSectionsSidebar,
}: ReglementConsultationLegacyWrapperProps) {
  return (
    <ReglementConsultation
      initialNumeroProcedure={numeroProcedure}
      procedureRefComplete={procedureRefComplete}
      onDataChange={onSave}
      initialData={initialData}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
      initialSection={initialRCSection}
      hideSectionsSidebar={hideRCSectionsSidebar}
    />
  );
}
