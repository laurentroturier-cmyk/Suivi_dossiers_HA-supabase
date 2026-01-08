// Types pour la table TBL_Contrats

export interface Contrat {
  agreement_number: string;
  description: string;
  agreement_status_meaning: string;
  agreement_limit: number | null;
  montant_marche: number | null;
  blanket_header_released_amount: number | null;
  date_notification: string | null;
  date_debut: string | null;
  date_fin: string | null;
  pourcentage_consomme: number | null;
  nombre_lignes_catalogue: number | null;
  client_interne: string | null;
  supplier: string;
  supplier_number: string | null;
  duns_number: string | null;
  site: string | null;
  full_name: string | null;
  mail_signataire: string | null;
  nom_signataire: string | null;
  numero_lot: string | null;
  numero_rang: string | null;
  numero_procedure: string | null;
  taux_performance: number | null;
}

export interface ContratsStats {
  totalContrats: number;
  montantTotal: number;
  montantConsomme: number;
  contratsouverts: number;
  contratsTermines: number;
  tauxConsommationMoyen: number;
  nombreFournisseurs: number;
}

export interface ContratsFilters {
  search: string;
  status: string;
  supplier: string;
  clientInterne: string;
  acheteur: string;
  anneeDebut: string;
  anneeFin: string;
  origineMontantEconomie?: string;
}
