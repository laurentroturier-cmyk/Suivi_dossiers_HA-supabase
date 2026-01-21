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
}

export function BPUMultiLots({ procedureId, onSave }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="bpu"
      moduleName="BPU"
      defaultData={defaultBPUData}
      FormComponent={BPUForm}
      onSave={onSave}
    />
  );
}
