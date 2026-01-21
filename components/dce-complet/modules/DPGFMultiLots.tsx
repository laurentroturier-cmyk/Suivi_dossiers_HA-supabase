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
}

export function DPGFMultiLots({ procedureId, onSave }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="dpgf"
      moduleName="DPGF"
      defaultData={defaultDPGFData}
      FormComponent={DPGFForm}
      onSave={onSave}
    />
  );
}
