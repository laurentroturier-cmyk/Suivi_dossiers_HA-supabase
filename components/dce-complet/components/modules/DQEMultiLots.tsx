// DQE Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { DQEForm } from './DQEForm';
import type { DQEData, DQEColumn, LotConfiguration } from '../../types';

// Colonnes par défaut pour le DQE (14 colonnes : 10 saisie + 4 calcul)
const DEFAULT_COLUMNS: DQEColumn[] = [
  { id: 'codeArticle', label: 'Code Article', width: '120px' },
  { id: 'categorie', label: 'Catégorie', width: '280px' },
  { id: 'designation', label: "Désignation de l'article", width: '450px' },
  { id: 'unite', label: 'Unité', width: '90px' },
  { id: 'quantite', label: 'Quantité', width: '110px', isEditable: true },
  { id: 'refFournisseur', label: 'Réf. Fournisseur', width: '150px' },
  { id: 'designationFournisseur', label: 'Désignation Fournisseur', width: '200px' },
  { id: 'prixUniteVenteHT', label: "Prix à l'unité de vente HT", width: '150px', isEditable: true },
  { id: 'prixUniteHT', label: "Prix à l'Unité HT", width: '130px' },
  { id: 'ecoContribution', label: 'Éco-contribution HT', width: '140px', isEditable: true },
  // Colonnes calculées (en-tête vert clair)
  { id: 'montantHT', label: 'Montant HT', width: '130px', isEditable: true, isCalculated: true },
  { id: 'tauxTVA', label: 'TVA (%)', width: '100px', isEditable: true },
  { id: 'montantTVA', label: 'Montant TVA', width: '130px', isEditable: true, isCalculated: true },
  { id: 'montantTTC', label: 'Montant TTC', width: '140px', isEditable: true, isCalculated: true },
];

const defaultDQEData: DQEData = {
  columns: DEFAULT_COLUMNS,
  headerLabels: DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.label }), {}),
  rows: [],
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
  procedureInfo?: {
    numeroProcedure?: string;
    titreMarche?: string;
    acheteur?: string;
    numeroLot?: string;
    libelleLot?: string;
  };
  lotsFromConfigurationGlobale?: LotConfiguration[];
  onBackToHub?: () => void;
}

export function DQEMultiLots({
  procedureId,
  onSave,
  configurationGlobale,
  procedureInfo,
  lotsFromConfigurationGlobale,
  onBackToHub,
}: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="dqe"
      moduleName="DQE"
      defaultData={defaultDQEData}
      FormComponent={DQEForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
      formComponentProps={{ procedureInfo, onBackToHub }}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
      showSummaryViewWhenMultipleLots={true}
    />
  );
}
