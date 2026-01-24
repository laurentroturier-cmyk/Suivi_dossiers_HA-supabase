// CCAP Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { CCAPForm } from './CCAPForm';
import { createDefaultCCAP } from './defaults';

const defaultCCAPData = createDefaultCCAP();

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
