// DQE Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { DQEForm } from './DQEForm';
import type { DQEData } from '../types';

const defaultDQEData: DQEData = {
  lots: [],
  totalGeneral: '0',
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

export function DQEMultiLots({ procedureId, onSave, configurationGlobale }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="dqe"
      moduleName="DQE"
      defaultData={defaultDQEData}
      FormComponent={DQEForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
    />
  );
}
