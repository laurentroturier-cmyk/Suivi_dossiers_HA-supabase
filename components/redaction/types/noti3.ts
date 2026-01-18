// TypeScript : Structure du NOTI3 (un document par perdant)

export interface Noti3Lot {
  numero: string;
  intitule: string;
}

export interface Noti3Candidat {
  denomination: string;
  adresse1: string;
  adresse2?: string;
  codePostal: string;
  ville: string;
  siret: string;
  email: string;
  telephone: string;
  fax?: string;
  estMandataire?: boolean;
}

export interface Noti3Attributaire {
  denomination: string;
  noteEco: string;
  noteTech: string;
  total: string;
  motifs: string;
  maxEco?: string; // Pondération économique
  maxTech?: string; // Pondération technique
}

export interface Noti3Rejet {
  type: 'candidature' | 'offre';
  motifs: string;
  noteEco: string;
  noteTech: string;
  total: string;
  classement: string;
  maxEco?: string; // Pondération économique (ex: "60", "70")
  maxTech?: string; // Pondération technique (ex: "40", "30")
}

export interface Noti3Data {
  numeroProcedure: string;
  pouvoirAdjudicateur: {
    nom: string;
    adresseVoie: string;
    codePostal: string;
    ville: string;
  };
  objetConsultation: string;
  notification: {
    type: 'ensemble' | 'lots';
    lots: Noti3Lot[];
  };
  candidat: Noti3Candidat;
  rejet: Noti3Rejet;
  attributaire: Noti3Attributaire;
  delaiStandstill: string;
  signature: {
    lieu: string;
    date: string;
    signataireTitre: string;
    signataireNom: string;
  };
  // Support multi-lots : détails de chaque lot perdu
  lotsDetails?: Array<{
    numero: string;
    intitule: string;
    attributaire: string;
    noteCandidat: number;
    noteGagnant: number;
    rang: number;
  }>;
}
