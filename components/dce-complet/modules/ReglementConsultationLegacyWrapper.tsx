import React from 'react';
import ReglementConsultation from '../../redaction/ReglementConsultation';

interface ReglementConsultationLegacyWrapperProps {
  numeroProcedure?: string;
}

// Wrapper minimal pour réutiliser le module RC existant tel quel dans le DCE.
// Passe le numéro de procédure du contexte DCE pour préremplir le formulaire.
export function ReglementConsultationLegacyWrapper({ numeroProcedure }: ReglementConsultationLegacyWrapperProps) {
  return <ReglementConsultation initialNumeroProcedure={numeroProcedure} />;
}
