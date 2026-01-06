export interface EntrepriseRetrait {
  prenom: string;
  nom: string;
  societe: string;
  siret: string;
  adresse: string;
  cp: string;
  ville: string;
  telephone: string;
  fax: string;
  email: string;
  typeRetrait: string;
  lots: string;
  intention: string;
  premiereVisite: string;
  derniereVisite: string;
}

export interface ProcedureInfo {
  objet: string;
  reference: string;
  dateLimit: string;
  idEmp?: string;
}

export interface RetraitsStats {
  totalTelecharges: number;
  anonymes: number;
}

export interface RetraitsData {
  procedureInfo: ProcedureInfo;
  stats: RetraitsStats;
  entreprises: EntrepriseRetrait[];
}
