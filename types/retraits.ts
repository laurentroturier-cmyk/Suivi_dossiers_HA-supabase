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
  datePublication?: string;
  dateCandidature?: string;
  dateOffre: string;
  idEmp?: string;
  dateImpression?: string;
}

export interface RetraitsStats {
  totalTelecharges: number;
  totalReprographies: number;
  anonymes: number;
}

export interface RetraitsData {
  procedureInfo: ProcedureInfo;
  stats: RetraitsStats;
  entreprises: EntrepriseRetrait[];
}
