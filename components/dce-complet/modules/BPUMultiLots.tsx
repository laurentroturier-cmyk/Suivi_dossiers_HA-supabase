// BPU Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { BPUForm } from './BPUForm';
import type { BPUData } from '../types';

const defaultBPUData: BPUData = {
  lots: [],
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

export function BPUMultiLots({ procedureId, onSave, configurationGlobale }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="bpu"
      moduleName="BPU"
      defaultData={defaultBPUData}
      FormComponent={BPUForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
    />
  );
}
