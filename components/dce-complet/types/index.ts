// ============================================
// TYPES POUR LE MODULE DCE COMPLET
// ============================================

import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// Re-export des types ATTRI1 pour l'Acte d'Engagement
export * from './acteEngagement';

// ============================================
// STATUT DU DCE
// ============================================

export type DCEStatut = 'brouillon' | 'en-cours' | 'finalisé' | 'publié';

// ============================================
// ACTE D'ENGAGEMENT (Format simplifié - Legacy)
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

export type CCAPType = 'travaux' | 'tic' | 'mopo' | 'prestations_intellectuelles' | 'maintenance' | 'services';

export interface CCAPData {
  // Type de CCAP
  typeCCAP?: CCAPType;

  /** Couleur de fond de l'en-tête principal (bannière titre + section Dispositions générales).
   *  Hex, ex: '#2F5B58'. Si absent, utilise le teal par défaut. */
  couleurEntete?: string;
  
  // Dispositions générales
  dispositionsGenerales: {
    objet: string;
    ccagApplicable: string;
    duree: string;
    reconduction: boolean;
    nbReconductions?: string;
    periodeTransitoire?: string; // Pour TMA/TIC
  };
  
  // Prix et paiement
  prixPaiement: {
    typePrix: string; // 'forfaitaire' | 'unitaire' | 'mixte'
    revision: boolean;
    formuleRevision?: string; // ex: "SYNTEC", "TP01", etc.
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
    lieuxExecution?: string; // Locaux client, prestataire, mixte
  };
  
  // Clauses spécifiques (optionnelles selon type)
  clausesSpecifiques?: {
    // TIC/TMA
    proprietéIntellectuelle?: string;
    confidentialite?: string;
    securite?: string;
    reversibilite?: string;
    garantieTechnique?: string;
    bonCommande?: string;
    sousTraitance?: string;
    
    // Travaux
    garantieDecennale?: string;
    garantieBiennale?: string;
    parfaitAchevement?: string;
    assurances?: string;
    
    // Services/Maintenance
    sla?: string;
    astreinte?: string;
    maintenancePreventive?: string;
    maintenanceCurative?: string;
    
    // RSE (tous types)
    engagementsRSE?: string;
    ethique?: string;
  };
  
  // Sections personnalisées avec support de hiérarchie
  sections: Array<{
    titre: string;
    contenu: string;
    niveau?: number; // 1 = chapitre, 2 = sous-chapitre, 3 = sous-sous-chapitre (défaut: 1)
    /** Couleur du titre (hex, ex: #0066cc) — utilisée dans l'app et à l'export PDF */
    titreCouleur?: string;
    /** Taille du titre en pt pour l'export PDF (ex: 16). Si absent, taille par défaut selon le niveau. */
    titreTaille?: number;
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

export interface BPUColumn {
  id: string;
  label: string;
  width?: string;
}

export interface BPURow {
  id: string;
  [key: string]: any;
}

export interface BPUData {
  columns: BPUColumn[];
  headerLabels: { [key: string]: string };
  rows: BPURow[];
}

// ============================================
// BPU TMA (Bordereau des Prix Unitaires - TMA)
// Spécifique pour les marchés de TMA avec différentes unités d'œuvre
// ============================================

export interface BPUTMAData {
  nomCandidat: string;
  tauxTVA: number;
  priseConnaissance: {
    forfaitGlobal: number;
  };
  uom: {
    prixUnitaire: number;
  };
  tauxDegressivite: {
    annee2: number;
    annee3: number;
    annee4: number;
  };
  autresUO: {
    uoV: number;  // UO Cycle en V
    uoA: number;  // UO AGILE
    uoI: number;  // UO Innovation
  };
  uoR: {
    nombreEstime: number;
    prixUnitaire: number;
  };
  expertises: Array<{
    ref: string;
    designation: string;
    prix: number;
  }>;
  realisations: Array<{
    ref: string;
    designation: string;
    prix: number;
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
  
  // 🆕 Configuration globale (variables communes)
  configurationGlobale: ConfigurationGlobale | null;
  
  // Modules du DCE
  reglementConsultation: RapportCommissionData | null;
  acteEngagement: ActeEngagementData | null;
  ccap: CCAPData | null;
  cctp: CCTPData | null;
  bpu: BPUData | null;
  bpuTMA: BPUTMAData | null;
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
  configuration_globale: ConfigurationGlobale | null;
  reglement_consultation: RapportCommissionData | null;
  acte_engagement: ActeEngagementData | null;
  ccap: CCAPData | null;
  cctp: CCTPData | null;
  bpu: BPUData | null;
  bpu_tma: BPUTMAData | null;
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
  | 'configurationGlobale'
  | 'reglementConsultation'
  | 'acteEngagement'
  | 'ccap'
  | 'cctp'
  | 'clausesContractuelles'
  | 'annexesFinancieres'
  | 'reponseTechnique'
  | 'bpu'
  | 'bpuTMA'
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
    configurationGlobale: number;
    reglementConsultation: number;
    acteEngagement: number;
    ccap: number;
    cctp: number;
    annexesFinancieres?: number;
    bpu: number;
    bpuTMA: number;
    dqe: number;
    dpgf: number;
    documentsAnnexes: number;
    crt: number;
    qt: number;
  };
}

// ============================================
// CONFIGURATION GLOBALE (Variables communes)
// ============================================

export interface LotConfiguration {
  numero: string;
  intitule: string;
  montant: string;
  description?: string;
}

export interface ConfigurationGlobale {
  // Informations générales
  informationsGenerales: {
    acheteur: string;
    titreMarche: string;
    typeProcedure: string;
    dureeMarche: string;
    dateRemiseOffres: string;
  };
  
  // Configuration des lots
  lots: LotConfiguration[];
  
  // Autres variables communes
  variablesCommunes: {
    ccagApplicable: string;
    delaiPaiement: string;
    delaiExecution: string;
    garantieFinanciere: boolean;
    avance: boolean;
    montantAvance?: string;
  };
  
  // Contacts
  contacts: {
    responsableProcedure: string;
    emailContact: string;
    telephoneContact: string;
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
