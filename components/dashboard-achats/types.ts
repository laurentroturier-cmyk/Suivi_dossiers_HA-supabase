/**
 * Types pour le module Dashboard Achats
 */

export interface AchatRow {
  _source?: string;
  'Fournisseur': string;
  'SIREN': string;
  'Trimestre': string;
  'N° de contrat': string;
  'Projet': string;
  'Ligne': string;
  'Montant de ligne de bon de commande': number;
  'Compte PCG': string;
  "Famille d'achats": string;
  "Sous-famille d'achats": string;
  "Catégorie d'achats": string;
  'UO': string;
  "Description de l'UO": string;
  'CR': string;
  'Description du CR': string;
  'CRT': string;
  'Description du CRT': string;
  'Commande': string;
  'Date de création': string;
  "Description de l'article": string;
  'Signification du statut du document': string;
  'Montant de ventilation livré': number;
  'Montant de ventilation facturé': number;
  'Montant de la ventilation de commande': number;
  'Montant total': number;
  'Type': string;
  "Nom du demandeur de l'achat": string;
  'Commande REGUL': string;
  [key: string]: any;
}

export interface Filters {
  trimestre: string;
  famille: string;
  fournisseur: string;
  region: string;
  statut: string;
  categorie: string;
}

export interface KPIData {
  totalCommande: number;
  totalFacture: number;
  totalLivre: number;
  totalMontant: number;
  nbFournisseurs: number;
  nbCommandes: number;
  nbLignes: number;
}

export type TabType = 'overview' | 'families' | 'suppliers' | 'regions' | 'regul' | 'data';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  borderRadius?: number;
  barPercentage?: number;
  borderWidth?: number;
}
