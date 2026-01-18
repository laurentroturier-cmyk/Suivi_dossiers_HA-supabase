// Types pour la gestion multi-lots

export interface LotInfo {
  numero: string;
  intitule: string;
  montant?: number;
  noteCandidat: number;
  noteTechnique?: number;
  noteFinanciere?: number;
  rang: number;
  // Pondérations spécifiques au lot
  maxEco?: number; // Ex: 60, 70
  maxTech?: number; // Ex: 40, 30
}

export interface LotGagne extends LotInfo {
  noteGagnant: number; // = noteCandidat car c'est lui le gagnant
}

export interface LotPerdu extends LotInfo {
  gagnant: string; // Nom du candidat gagnant
  noteGagnant: number;
  noteTechGagnant?: number;
  noteFinGagnant?: number;
  motifRejet?: string;
}

export interface CandidatAnalyse {
  nom: string;
  lotsGagnes: LotGagne[];
  lotsPerdus: LotPerdu[];
  coordonnees?: {
    siret?: string;
    adresse?: string;
    codePostal?: string;
    ville?: string;
    email?: string;
    telephone?: string;
  };
}

export interface MultiLotsAnalysis {
  candidats: CandidatAnalyse[];
  totalLots: number;
  candidatsGagnants: CandidatAnalyse[]; // Au moins 1 lot gagné
  candidatsPerdants: CandidatAnalyse[]; // Que des lots perdus
  candidatsMixtes: CandidatAnalyse[]; // Lots gagnés ET perdus
}

export interface LotTableau {
  numero: number;
  nomLot?: string;
  nom?: string;
  intitule?: string;
  criteres?: any; // Pondérations spécifiques au lot
  ponderation?: any;
  tableau?: Array<{
    raisonSociale?: string;
    rangFinal?: number;
    noteFinaleSur100?: number;
    noteTechnique?: number;
    noteTechniqueSur30?: number;
    noteFinanciere?: number;
    noteFinanciereSur70?: number;
    noteFinanciereSur60?: number;
    montantTTC?: number;
  }>;
}
