export interface RapportSources {
  procedure: any; // Données de la procédure sélectionnée
  dossier: any; // Données du dossier rattaché
  depots: any; // Données du registre des dépôts
  retraits: any; // Données du registre des retraits
  an01Data: any; // Données de l'analyse AN01
  questionsReponses?: QuestionReponse[]; // Questions-réponses (optionnel pour MVP)
}

export interface QuestionReponse {
  id: number;
  dateQuestion: string;
  entreprise: string;
  question: string;
  reponse: string;
  dateReponse: string;
}

export interface RapportContent {
  section1_contexte: Section1Contexte;
  section2_deroulement: Section2Deroulement;
  section3_dossierConsultation: Section3DossierConsultation;
  section4_questionsReponses: Section4QuestionsReponses;
  section5_analyseCandidatures: Section5AnalyseCandidatures;
  section6_methodologie: Section6Methodologie;
  section7_valeurOffres: Section7ValeurOffres;
  section8_performance: Section8Performance;
  section9_attribution: Section9Attribution;
  section10_calendrier: Section10Calendrier;
}

// Section 1 : Contexte
export interface Section1Contexte {
  objetMarche: string;
  dureeMarche: number;
  descriptionPrestations: string; // Texte libre à éditer
}

// Section 2 : Déroulement de la procédure
export interface Section2Deroulement {
  datePublication: string;
  nombreRetraits: number;
  dateReceptionOffres: string;
  nombrePlisRecus: number;
  nombreHorsDelai: number;
  dateOuverturePlis: string;
  supportProcedure: string;
  listeRetraitsAnnexe: boolean; // Indique si la liste détaillée est en annexe
  listeDepotsAnnexe: boolean;
}

// Section 3 : Dossier de consultation
export interface Section3DossierConsultation {
  documentsListe: DocumentConsultation[];
}

export interface DocumentConsultation {
  nom: string;
  inclus: boolean;
}

// Section 4 : Questions-Réponses
export interface Section4QuestionsReponses {
  nombreQuestions: number;
  questions: QuestionReponse[];
  enAnnexe: boolean;
}

// Section 5 : Analyse des candidatures
export interface Section5AnalyseCandidatures {
  nombreCandidaturesTotales: number;
  nombreCandidaturesRecevables: number;
  nombreCandidaturesRejetees: number;
  motifsRejet: MotifsRejet[];
}

export interface MotifsRejet {
  entreprise: string;
  motif: string;
}

// Section 6 : Méthodologie d'analyse des offres
export interface Section6Methodologie {
  criteres: CritereAnalyse[];
  criteresDetails: CritereDetail[];
}

export interface CritereAnalyse {
  nom: string;
  ponderation: number;
}

export interface CritereDetail {
  nom: string;
  points: number;
}

// Section 7 : Analyse de la valeur des offres
export interface Section7ValeurOffres {
  tableau: OffreClassement[];
  montantEstime: number;
  montantAttributaire: number;
  ecartAbsolu: number;
  ecartPourcent: number;
}

export interface OffreClassement {
  raisonSociale: string;
  rangFinal: number;
  noteFinaleSur100: number;
  rangFinancier: number;
  noteFinanciereSur60: number;
  rangTechnique: number;
  noteTechniqueSur40: number;
  montantTTC: number;
}

// Section 8 : Analyse de la performance
export interface Section8Performance {
  valeurReference: number;
  performanceAchatPourcent: number;
  impactBudgetaireTTC: number;
  impactBudgetaireHT: number;
  montantAttributaireTTC: number;
  montantAttributaireHT: number;
}

// Section 9 : Proposition d'attribution
export interface Section9Attribution {
  attributairePressenti: string;
}

// Section 10 : Calendrier de mise en œuvre
export interface Section10Calendrier {
  dateValidationMSA: string;
  dateValidationCODIR: string;
  dateEnvoiLettresRejet: string;
  dateAttribution: string;
  delaiStandstill: number; // En jours
}

// État du module
export interface RapportState {
  procedureSelectionnee: string | null; // NumProc
  fichiersCharges: {
    depots: boolean;
    retraits: boolean;
    an01: boolean;
  };
  rapportGenere: RapportContent | null;
  modeEdition: boolean;
}
