// Types pour le module Questionnaire Technique

export interface Procedure {
  id: string;
  NumProc?: string;
  // Numéro court historique (Afpa)
  numero_procedure?: string;
  // Alias possibles selon les imports
  numero_procedure_afpa?: string;
  numero_court_procedure_afpa?: string;
  "numero court procédure afpa"?: string;
  "Numéro de procédure (Afpa)"?: string;
  nom_procedure: string;
  nombre_lots: number;
}

export interface Question {
  id: string;
  intitule: string;
  pointsMax: number;
  description?: string;
  evaluateurs?: string;
}

export interface SousCritere {
  id: string;
  nom: string;
  questions: Question[];
}

export interface Critere {
  id: string;
  nom: string;
  sousCriteres: SousCritere[];
  isExpanded: boolean;
}

export interface QuestionnaireState {
  procedure?: Procedure;
  numeroLot?: number;
  criteres: Critere[];
}
