// CCTP Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { CCTPForm } from './CCTPForm';
import type { CCTPData } from '../../types';

const defaultCCTPData: CCTPData = {
  contexte: {
    presentation: '',
    objectifs: '',
    contraintes: '',
  },
  specifications: [],
  prestations: [],
  livrables: [],
};

interface Props {
  procedureId: string;
  onSave?: () => void;
  configurationGlobale?: {
    lots: Array<{
      numero: string;
      intitule: string;
      montant: string;
      description?: string;
    }>;
  } | null;
}

export function CCTPMultiLots({ procedureId, onSave, configurationGlobale }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="cctp"
      moduleName="CCTP"
      defaultData={defaultCCTPData}
      FormComponent={CCTPForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
    />
  );
}
