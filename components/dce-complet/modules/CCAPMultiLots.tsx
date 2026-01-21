// CCAP Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { CCAPForm } from './CCAPForm';
import type { CCAPData } from '../types';

const defaultCCAPData: CCAPData = {
  dispositionsGenerales: {
    objet: '',
    reglementation: '',
    delaiExecution: '',
  },
  conditionsPaiement: {
    modalites: '',
    delaiPaiement: '',
    avance: false,
    montantAvance: '',
  },
  garanties: {
    garantieParfaitAchevement: false,
    garantieDecennale: false,
    assurances: '',
  },
  penalites: {
    retard: '',
    nonConformite: '',
  },
  clauses: [],
};

interface Props {
  procedureId: string;
  onSave?: () => void;
}

export function CCAPMultiLots({ procedureId, onSave }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="ccap"
      moduleName="CCAP"
      defaultData={defaultCCAPData}
      FormComponent={CCAPForm}
      onSave={onSave}
    />
  );
}
