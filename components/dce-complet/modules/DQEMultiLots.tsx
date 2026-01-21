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
}

export function DQEMultiLots({ procedureId, onSave }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="dqe"
      moduleName="DQE"
      defaultData={defaultDQEData}
      FormComponent={DQEForm}
      onSave={onSave}
    />
  );
}
