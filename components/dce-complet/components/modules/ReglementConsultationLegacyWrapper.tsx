import React from 'react';
import { ReglementConsultation, type RapportCommissionData } from '../../../redaction';
import type { LotConfiguration } from '../../types';

interface ReglementConsultationLegacyWrapperProps {
  numeroProcedure?: string;
  onSave?: (data: RapportCommissionData) => void;
  initialData?: RapportCommissionData;
  lotsFromConfigurationGlobale?: LotConfiguration[];
}

// Wrapper pour intégrer le module RC dans le DCE avec sauvegarde automatique.
// Transmet les changements de données au parent via onSave.
export function ReglementConsultationLegacyWrapper({ 
  numeroProcedure, 
  onSave, 
  initialData,
  lotsFromConfigurationGlobale 
}: ReglementConsultationLegacyWrapperProps) {
  return (
    <ReglementConsultation 
      initialNumeroProcedure={numeroProcedure}
      onDataChange={onSave}
      initialData={initialData}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
    />
  );
}
