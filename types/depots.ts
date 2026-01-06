export interface EntrepriseDepot {
  ordre: string;
  dateReception: string;
  modeReception: string;
  societe: string;
  contact: string;
  adresse: string;
  cp: string;
  ville: string;
  telephone: string;
  fax: string;
  email: string;
  observations: string;
  lot: string;
  nomFichier: string;
  tailleFichier: string;
}

export interface DepotsProcedureInfo {
  auteur: string;
  objet: string;
  datePublication: string;
  dateCandidature: string;
  dateOffre: string;
  reference: string;
  idEmp: string;
  dateExport: string;
}

export interface DepotsStats {
  totalEnveloppesElectroniques: number;
  totalEnveloppesPapier: number;
}

export interface DepotsData {
  procedureInfo: DepotsProcedureInfo;
  stats: DepotsStats;
  entreprises: EntrepriseDepot[];
}
