import React from 'react';
import ReglementConsultation from '../../redaction/ReglementConsultation';
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

interface ReglementConsultationLegacyWrapperProps {
  numeroProcedure?: string;
  onSave?: (data: RapportCommissionData) => void;
  initialData?: RapportCommissionData;
}

// Wrapper pour intégrer le module RC dans le DCE avec sauvegarde automatique.
// Transmet les changements de données au parent via onSave.
export function ReglementConsultationLegacyWrapper({ numeroProcedure, onSave, initialData }: ReglementConsultationLegacyWrapperProps) {
  return (
    <ReglementConsultation 
      initialNumeroProcedure={numeroProcedure}
      onDataChange={onSave}
      initialData={initialData}
    />
  );
}
