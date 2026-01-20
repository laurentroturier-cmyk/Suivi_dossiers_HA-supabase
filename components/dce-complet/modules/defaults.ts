// ============================================
// Valeurs par défaut pour chaque section du DCE
// ============================================

import type {
  ActeEngagementData,
  BPUData,
  CCAPData,
  CCTPData,
  DCEState,
  DPGFData,
  DQEData,
  DocumentsAnnexesData,
} from '../types';
import type { RapportCommissionData } from '../../redaction/types/rapportCommission';

// RC (Règlement de consultation) = RapportCommissionData
export const createDefaultReglementConsultation = (): RapportCommissionData => ({
  enTete: {
    numeroProcedure: '',
    titreMarche: '',
    numeroMarche: '',
    typeMarcheTitle: '',
    dateLimiteOffres: '',
    heureLimiteOffres: '',
    dateLimiteQuestions: '',
    dateLimiteReponses: '',
  },
  pouvoirAdjudicateur: {
    nom: '',
    adresseVoie: '',
    codePostal: '',
    ville: '',
    pays: '',
    telephone: '',
    courriel: '',
    adresseWeb: '',
    profilAcheteur: '',
  },
  objet: {
    description: '',
    cpvPrincipal: '',
    cpvPrincipalLib: '',
    cpvSecondaires: [],
  },
  conditions: {
    modePassation: '',
    nbLots: '',
    lots: [],
    variantesAutorisees: false,
    groupementSolidaire: false,
    groupementConjoint: false,
    visiteObligatoire: false,
  },
  typeMarche: {
    forme: '',
    dureeInitiale: '',
    nbReconductions: '',
    dureeReconduction: '',
    dureeMax: '',
    sousTraitanceTotaleInterdite: false,
    lieuExecution: '',
  },
  dce: {
    documents: [],
    urlCCAG: '',
  },
  remise: {
    delaiValiditeOffres: '',
  },
  jugement: {
    critereFinancier: '',
    critereTechnique: '',
    sousCriteresTechniques: [],
  },
  recours: {
    tribunalNom: '',
    tribunalAdresse: '',
    tribunalVille: '',
    tribunalTel: '',
    tribunalCourriel: '',
    tribunalSIRET: '',
  },
});

export const createDefaultActeEngagement = (): ActeEngagementData => ({
  acheteur: {
    nom: '',
    adresse: '',
    codePostal: '',
    ville: '',
    siret: '',
    representant: '',
    qualite: '',
  },
  marche: {
    numero: '',
    objet: '',
    montant: '',
    duree: '',
    dateNotification: '',
  },
  candidat: {
    raisonSociale: '',
    formeJuridique: '',
    adresse: '',
    codePostal: '',
    ville: '',
    siret: '',
    representant: '',
    qualite: '',
  },
  prix: {
    montantHT: '',
    tva: '',
    montantTTC: '',
    delaiPaiement: '',
  },
  conditions: {
    delaiExecution: '',
    garantieFinanciere: false,
    avance: false,
    montantAvance: '',
  },
});

export const createDefaultCCAP = (): CCAPData => ({
  dispositionsGenerales: {
    objet: '',
    ccagApplicable: '',
    duree: '',
    reconduction: false,
    nbReconductions: '',
  },
  prixPaiement: {
    typePrix: 'forfaitaire',
    revision: false,
    modalitesPaiement: '',
    delaiPaiement: '',
    avance: false,
    retenuGarantie: false,
  },
  execution: {
    delaiExecution: '',
    penalitesRetard: '',
    conditionsReception: '',
  },
  sections: [],
});

export const createDefaultCCTP = (): CCTPData => ({
  contexte: {
    presentation: '',
    objectifs: '',
    contraintes: '',
  },
  specifications: [],
  prestations: [],
  livrables: [],
});

export const createDefaultBPU = (): BPUData => ({
  lots: [],
});

export const createDefaultDQE = (): DQEData => ({
  lots: [],
  totalGeneral: '',
});

export const createDefaultDPGF = (): DPGFData => ({
  lots: [],
});

export const createDefaultDocumentsAnnexes = (): DocumentsAnnexesData => ({
  documents: [],
});

// Utilitaires pour garantir des valeurs non nulles
export const ensureReglementConsultation = (data: DCEState['reglementConsultation']) => data || createDefaultReglementConsultation();
export const ensureActeEngagement = (data: DCEState['acteEngagement']) => data || createDefaultActeEngagement();
export const ensureCCAP = (data: DCEState['ccap']) => data || createDefaultCCAP();
export const ensureCCTP = (data: DCEState['cctp']) => data || createDefaultCCTP();
export const ensureBPU = (data: DCEState['bpu']) => data || createDefaultBPU();
export const ensureDQE = (data: DCEState['dqe']) => data || createDefaultDQE();
export const ensureDPGF = (data: DCEState['dpgf']) => data || createDefaultDPGF();
export const ensureDocumentsAnnexes = (data: DCEState['documentsAnnexes']) => data || createDefaultDocumentsAnnexes();
