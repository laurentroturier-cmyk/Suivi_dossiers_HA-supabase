export interface EntrepriseDepot {
  ordre: string;
  prenom: string;
  nom: string;
  societe: string;
  siret: string;
  email: string;
  adresse: string;
  cp: string;
  ville: string;
  telephone: string;
  fax: string;
  dateReception: string;
  modeReception: string;
  naturePli: string;
  nomFichier: string;
  taille: string;
  lot: string;
  observations: string;
  copieSauvegarde: string;
  horsDelai: string;
}

export interface DepotsProcedureInfo {
  auteur: string;
  objet: string;
  reference: string;
  datePublication: string;
  dateCandidature: string;
  dateOffre: string;
  dateExport: string;
  idEmp?: string;
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
