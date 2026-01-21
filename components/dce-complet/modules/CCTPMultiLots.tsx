// CCTP Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { CCTPForm } from './CCTPForm';
import type { CCTPData } from '../types';

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
}

export function CCTPMultiLots({ procedureId, onSave }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="cctp"
      moduleName="CCTP"
      defaultData={defaultCCTPData}
      FormComponent={CCTPForm}
      onSave={onSave}
    />
  );
}
