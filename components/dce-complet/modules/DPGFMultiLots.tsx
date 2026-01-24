// DPGF Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { DPGFForm } from './DPGFForm';
import type { DPGFData } from '../types';

const defaultDPGFData: DPGFData = {
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

export function DPGFMultiLots({ procedureId, onSave, configurationGlobale }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="dpgf"
      moduleName="DPGF"
      defaultData={defaultDPGFData}
      FormComponent={DPGFForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
    />
  );
}
