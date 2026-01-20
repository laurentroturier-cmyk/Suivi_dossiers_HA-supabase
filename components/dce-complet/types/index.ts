// ============================================
// TYPES POUR LE MODULE DCE COMPLET
// ============================================

import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// ============================================
// STATUT DU DCE
// ============================================

export type DCEStatut = 'brouillon' | 'en-cours' | 'finalisé' | 'publié';

// ============================================
// ACTE D'ENGAGEMENT
// ============================================

export interface ActeEngagementData {
  // En-tête
  acheteur: {
    nom: string;
    adresse: string;
    codePostal: string;
    ville: string;
    siret: string;
    representant: string;
    qualite: string;
  };
  
  // Marché
  marche: {
    numero: string;
    objet: string;
    montant: string;
    duree: string;
    dateNotification: string;
  };
  
  // Candidat
  candidat: {
    raisonSociale: string;
    formeJuridique: string;
    adresse: string;
    codePostal: string;
    ville: string;
    siret: string;
    representant: string;
    qualite: string;
  };
  
  // Prix
  prix: {
    montantHT: string;
    tva: string;
    montantTTC: string;
    delaiPaiement: string;
  };
  
  // Conditions
  conditions: {
    delaiExecution: string;
    garantieFinanciere: boolean;
    avance: boolean;
    montantAvance?: string;
  };
}

// ============================================
// CCAP (Cahier des Clauses Administratives Particulières)
// ============================================

export interface CCAPData {
  // Dispositions générales
  dispositionsGenerales: {
    objet: string;
    ccagApplicable: string;
    duree: string;
    reconduction: boolean;
    nbReconductions?: string;
  };
  
  // Prix et paiement
  prixPaiement: {
    typePrix: string; // 'forfaitaire' | 'unitaire' | 'mixte'
    revision: boolean;
    modalitesPaiement: string;
    delaiPaiement: string;
    avance: boolean;
    retenuGarantie: boolean;
  };
  
  // Exécution
  execution: {
    delaiExecution: string;
    penalitesRetard: string;
    conditionsReception: string;
  };
  
  // Sections personnalisées
  sections: Array<{
    titre: string;
    contenu: string;
  }>;
}

// ============================================
// CCTP (Cahier des Clauses Techniques Particulières)
// ============================================

export interface CCTPData {
  // Contexte
  contexte: {
    presentation: string;
    objectifs: string;
    contraintes: string;
  };
  
  // Spécifications techniques
  specifications: Array<{
    titre: string;
    description: string;
    exigences: string[];
    normes: string[];
  }>;
  
  // Prestations
  prestations: Array<{
    intitule: string;
    description: string;
    quantite: string;
    unite: string;
  }>;
  
  // Livrables
  livrables: Array<{
    nom: string;
    description: string;
    format: string;
    delai: string;
  }>;
}

// ============================================
// BPU (Bordereau des Prix Unitaires)
// ============================================

export interface BPUData {
  lots: Array<{
    numero: string;
    intitule: string;
    lignes: Array<{
      numero: string;
      designation: string;
      unite: string;
      prixUnitaire: string;
      quantiteEstimative?: string;
    }>;
  }>;
}

// ============================================
// DQE (Détail Quantitatif Estimatif)
// ============================================

export interface DQEData {
  lots: Array<{
    numero: string;
    intitule: string;
    lignes: Array<{
      numero: string;
      designation: string;
      unite: string;
      quantite: string;
      prixUnitaire?: string;
      montantTotal?: string;
    }>;
    totalLot: string;
  }>;
  totalGeneral: string;
}

// ============================================
// DPGF (Décompte Prévisionnel et Gestion Financière)
// ============================================

export interface DPGFData {
  lots: Array<{
    numero: string;
    intitule: string;
    montantInitial: string;
    avenants: Array<{
      numero: string;
      objet: string;
      montant: string;
      date: string;
    }>;
    montantFinal: string;
  }>;
}

// ============================================
// DOCUMENTS ANNEXES
// ============================================

export interface DocumentsAnnexesData {
  documents: Array<{
    id: string;
    nom: string;
    type: string;
    taille: number;
    url?: string;
    dateAjout: string;
    description?: string;
  }>;
}

// ============================================
// ÉTAT COMPLET DU DCE
// ============================================

export interface DCEState {
  // Métadonnées
  id?: string;
  numeroProcedure: string;
  procedureId?: string;
  userId?: string;
  statut: DCEStatut;
  titreMarche: string;
  version: number;
  notes: string;
  
  // Modules du DCE
  reglementConsultation: RapportCommissionData | null;
  acteEngagement: ActeEngagementData | null;
  ccap: CCAPData | null;
  cctp: CCTPData | null;
  bpu: BPUData | null;
  dqe: DQEData | null;
  dpgf: DPGFData | null;
  documentsAnnexes: DocumentsAnnexesData | null;

  // Nouvelles sections
  crt: CRTData | null;
  qt: QTData | null;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

// ============================================
// RECORD SUPABASE
// ============================================

export interface DCERecord {
  id: string;
  user_id: string;
  numero_procedure: string;
  procedure_id?: string;
  statut: DCEStatut;
  titre_marche: string;
  version: number;
  notes: string;
  reglement_consultation: RapportCommissionData | null;
  acte_engagement: ActeEngagementData | null;
  ccap: CCAPData | null;
  cctp: CCTPData | null;
  bpu: BPUData | null;
  dqe: DQEData | null;
  dpgf: DPGFData | null;
  documents_annexes: DocumentsAnnexesData | null;

  crt: CRTData | null;
  qt: QTData | null;
  created_at: string;
  updated_at: string;
}

// ============================================
// VERSION HISTORY
// ============================================

export interface DCEVersion {
  id: string;
  dceId: string;
  version: number;
  section: string;
  dataBefore: any;
  dataAfter: any;
  modifiedBy: string;
  modifiedAt: string;
}

// ============================================
// RÉSULTATS D'OPÉRATIONS
// ============================================

export interface DCEOperationResult {
  success: boolean;
  data?: DCEState;
  error?: string;
  id?: string;
}

export interface DCELoadResult {
  success: boolean;
  data?: DCEState;
  error?: string;
  isNew?: boolean; // Si le DCE a été créé automatiquement
}

// ============================================
// SECTION TYPE (pour updateSection)
// ============================================

export type DCESectionType = 
  | 'reglementConsultation'
  | 'acteEngagement'
  | 'ccap'
  | 'cctp'
  | 'bpu'
  | 'dqe'
  | 'dpgf'
  | 'documentsAnnexes'
  | 'crt'
  | 'qt';

// ============================================
// COMPLÉTUDE DU DCE
// ============================================

export interface DCECompleteness {
  overall: number; // Pourcentage global
  sections: {
    reglementConsultation: number;
    acteEngagement: number;
    ccap: number;
    cctp: number;
    bpu: number;
    dqe: number;
    dpgf: number;
    documentsAnnexes: number;
    crt: number;
    qt: number;
  };
}

// ============================================
// CRT (Cadre de réponse technique)
// ============================================

export interface CRTData {
  contenu: string;
  notes: string;
}

// ============================================
// QT (Questionnaire technique)
// ============================================

export interface QTData {
  questions: Array<{ question: string; reponse: string }>;
  notes: string;
}

// ============================================
// VALIDATION ERRORS
// ============================================

export interface DCEValidationError {
  section: DCESectionType;
  field: string;
  message: string;
}

export interface DCEValidationResult {
  isValid: boolean;
  errors: DCEValidationError[];
  warnings: DCEValidationError[];
}
