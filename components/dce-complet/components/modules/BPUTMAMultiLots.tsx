// BPU TMA Multi-Lots (Tierce Maintenance Applicative)
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { BPUTMAForm } from './BPUTMAForm';
import type { BPUTMAData, LotConfiguration } from '../../types';

const defaultBPUTMAData: BPUTMAData = {
  nomCandidat: '',
  tauxTVA: 20,
  priseConnaissance: { forfaitGlobal: 0 },
  uom: { prixUnitaire: 0 },
  tauxDegressivite: { annee2: 0, annee3: 0, annee4: 0 },
  autresUO: { uoV: 0, uoA: 0, uoI: 0 },
  uoR: { nombreEstime: 0, prixUnitaire: 0 },
  expertises: [
    { ref: 'EXP01', designation: 'Production dossier type - Consultant senior', prix: 0 },
    { ref: 'EXP02', designation: 'Production dossier type - Consultant', prix: 0 },
    { ref: 'EXP04', designation: 'Production dossier type - Chef de projet confirmé', prix: 0 },
    { ref: 'EXP05', designation: 'Production dossier type - Chef de projet', prix: 0 },
    { ref: 'EXP07', designation: 'Production dossier type - Architecte expert', prix: 0 },
    { ref: 'EXP08', designation: 'Production dossier type - Architecte', prix: 0 },
    { ref: 'EXP09', designation: 'Production dossier type - Expert logiciel', prix: 0 },
    { ref: 'ACP01', designation: 'Contribution élémentaire - Chef de projet confirmé', prix: 0 },
    { ref: 'ACP02', designation: 'Contribution élémentaire - Chef de projet', prix: 0 },
    { ref: 'ACP05', designation: 'Prestation de suivi d\'exploitation', prix: 0 }
  ],
  realisations: [
    { ref: 'REA01', designation: 'Spécifications Ingénieur/Développeur (SFG, SFD, product backlog)', prix: 0 },
    { ref: 'REA02', designation: 'Réalisation Ingénieur/Développeur (cycle en V)', prix: 0 },
    { ref: 'REA03', designation: 'Conception plan recette Ingénieur/Développeur/Recetteur', prix: 0 },
    { ref: 'REA04', designation: 'Réalisation recette Recetteur', prix: 0 }
  ],
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
  lotsFromConfigurationGlobale?: LotConfiguration[];
  onBackToHub?: () => void;
}

export function BPUTMAMultiLots({
  procedureId,
  onSave,
  configurationGlobale,
  lotsFromConfigurationGlobale,
  onBackToHub,
}: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="bpu_tma"
      moduleName="BPU TMA"
      defaultData={defaultBPUTMAData}
      FormComponent={BPUTMAForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
      formComponentProps={{ onBackToHub }}
    />
  );
}
