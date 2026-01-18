/**
 * Types pour le document NOTI1 - Information au titulaire pressenti
 */

export interface Noti1Titulaire {
  denomination: string;
  adresse1: string;
  adresse2?: string;
  codePostal: string;
  ville: string;
  siret: string;
  email: string;
  telephone?: string;
  fax?: string;
  estMandataire?: boolean;
}

export interface Noti1Lot {
  numero: string;
  intitule: string;
}

export interface Noti1Attribution {
  type: 'ensemble' | 'lots';
  lots?: Noti1Lot[];
}

export interface Noti1Documents {
  dateSignature: string;
  candidatFrance: boolean;
  candidatEtranger: boolean;
  documentsPreuve?: string;
  delaiReponse?: string;
  decompteA?: string;
}

export interface Noti1Signature {
  lieu: string;
  date: string;
  signataireTitre?: string;
  signataireNom?: string;
}

export interface Noti1PouvoirAdjudicateur {
  nom: string;
  adresseVoie: string;
  codePostal: string;
  ville: string;
}

export interface Noti1Data {
  // Méta - numéro de procédure
  numeroProcedure: string;

  // Section A - Pouvoir adjudicateur (fixe AFPA)
  pouvoirAdjudicateur: Noti1PouvoirAdjudicateur;

  // Section B - Objet de la consultation
  objetConsultation: string;

  // Section C - Titulaire pressenti
  titulaire: Noti1Titulaire;

  // Section D - Attribution
  attribution: Noti1Attribution;

  // Section E + F + G - Documents et délais
  documents: Noti1Documents;

  // Section H - Signature
  signature: Noti1Signature;
}
