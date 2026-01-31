// BPU Multi-Lots
import React from 'react';
import { GenericMultiLots } from '../shared/GenericMultiLots';
import { BPUForm } from './BPUForm';
import type { BPUData, BPUColumn, LotConfiguration } from '../../types';

// Colonnes complètes selon les images fournies
const DEFAULT_COLUMNS: BPUColumn[] = [
  { id: 'codeArticle', label: 'Code Article', width: '120px' },
  { id: 'categorie', label: 'Catégorie', width: '130px' },
  { id: 'designation', label: "Désignation de l'article", width: '250px' },
  { id: 'unite', label: 'Unité', width: '90px' },
  { id: 'qteCond', label: 'Qté dans le cond.', width: '110px' },
  { id: 'refFournisseur', label: 'Réf. Fournisseur', width: '150px' },
  { id: 'designationFournisseur', label: 'Désignation Fournisseur', width: '200px' },
  { id: 'caracteristiques', label: 'Caractéristique technique du produit (Dimension, Puissance, etc...)', width: '250px' },
  { id: 'marqueFabricant', label: 'Marque Fabricant', width: '150px' },
  { id: 'hmbghn', label: 'hmbghn', width: '100px' },
  { id: 'qteConditionnement', label: 'Qté dans le conditionnement', width: '150px' },
  { id: 'prixUniteVenteHT', label: "Prix à l'unité de vente HT", width: '150px' },
  { id: 'prixUniteHT', label: "Prix à l'Unité HT", width: '130px' },
  { id: 'ecoContribution', label: 'Éco-contribution HT', width: '140px' },
  { id: 'urlPhotoProduit', label: 'Lien URL pour la photo du produit proposé', width: '200px' },
  { id: 'urlFicheSecurite', label: 'Lien URL pour la fiche de données de sécurité du produit proposé', width: '250px' },
  { id: 'urlFicheTechnique', label: 'Lien URL pour la fiche technique du produit proposé', width: '200px' },
  { id: 'urlDocumentSupp', label: 'Lien URL pour un document supplémentaire du produit proposé', width: '250px' },
];

const defaultBPUData: BPUData = {
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
}

export function BPUMultiLots({ procedureId, onSave, configurationGlobale, procedureInfo, lotsFromConfigurationGlobale }: Props) {
  return (
    <GenericMultiLots
      procedureId={procedureId}
      moduleType="bpu"
      moduleName="BPU"
      defaultData={defaultBPUData}
      FormComponent={BPUForm}
      onSave={onSave}
      configurationGlobale={configurationGlobale}
      formComponentProps={{ procedureInfo }}
      lotsFromConfigurationGlobale={lotsFromConfigurationGlobale}
    />
  );
}
