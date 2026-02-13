// ============================================
// Valeurs par défaut pour chaque section du DCE
// ============================================

import type {
  ActeEngagementData,
  BPUData,
  BPUTMAData,
  CCAPData,
  CCTPData,
  DCEState,
  DPGFData,
  DQEData,
  DocumentsAnnexesData,
  CRTData,
  QTData,
} from '../../types';
import type { RapportCommissionData } from '../../../redaction/types/rapportCommission';

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

export const createDefaultBPU = (): BPUData => {
  const defaultColumns = [
    { id: 'codeArticle', label: 'Code Article', width: '120px' },
    { id: 'categorie', label: 'Catégorie', width: '130px' },
    { id: 'designation', label: "Désignation de l'article", width: '250px' },
    { id: 'unite', label: 'Unité', width: '90px' },
    { id: 'qteCond', label: 'Qté dans le cond.', width: '110px' },
    { id: 'refFournisseur', label: 'Réf. Fournisseur', width: '150px' },
    { id: 'designationFournisseur', label: 'Désignation Fournisseur', width: '200px' },
    { id: 'caracteristiques', label: 'Caractéristique technique du produit (Dimension, Puissance, etc...)', width: '250px' },
    { id: 'marqueFabricant', label: 'Marque Fabricant', width: '150px' },
    { id: 'hmbghn', label: 'hmbghn', width: '100px' },
    { id: 'qteConditionnement', label: 'Qté dans le conditionnement', width: '150px' },
    { id: 'prixUniteVenteHT', label: "Prix à l'unité de vente HT", width: '150px' },
    { id: 'prixUniteHT', label: "Prix à l'Unité HT", width: '130px' },
    { id: 'ecoContribution', label: 'Éco-contribution HT', width: '140px' },
    { id: 'urlPhotoProduit', label: 'Lien URL pour la photo du produit proposé', width: '200px' },
    { id: 'urlFicheSecurite', label: 'Lien URL pour la fiche de données de sécurité du produit proposé', width: '250px' },
    { id: 'urlFicheTechnique', label: 'Lien URL pour la fiche technique du produit proposé', width: '200px' },
    { id: 'urlDocumentSupp', label: 'Lien URL pour un document supplémentaire du produit proposé', width: '250px' },
  ];
  
  return {
    columns: defaultColumns,
    headerLabels: defaultColumns.reduce((acc, col) => ({ ...acc, [col.id]: col.label }), {}),
    rows: [],
  };
};

export const createDefaultBPUTMA = (): BPUTMAData => ({
  nomCandidat: '',
  tauxTVA: 20,
  priseConnaissance: { forfaitGlobal: 0 },
  uom: { prixUnitaire: 0 },
  tauxDegressivite: { annee2: 0, annee3: 0, annee4: 0 },
  autresUO: { uoV: 0, uoA: 0, uoI: 0 },
  uoR: { nombreEstime: 0, prixUnitaire: 0 },
  expertises: [
    { ref: 'EXP01', designation: 'Production dossier type - Consultant senior', prix: 0 },
    { ref: 'EXP02', designation: 'Production dossier type - Consultant', prix: 0 },
    { ref: 'EXP04', designation: 'Production dossier type - Chef de projet confirmé', prix: 0 },
    { ref: 'EXP05', designation: 'Production dossier type - Chef de projet', prix: 0 },
    { ref: 'EXP07', designation: 'Production dossier type - Architecte expert', prix: 0 },
    { ref: 'EXP08', designation: 'Production dossier type - Architecte', prix: 0 },
    { ref: 'EXP09', designation: 'Production dossier type - Expert logiciel', prix: 0 },
    { ref: 'ACP01', designation: 'Contribution élémentaire - Chef de projet confirmé', prix: 0 },
    { ref: 'ACP02', designation: 'Contribution élémentaire - Chef de projet', prix: 0 },
    { ref: 'ACP05', designation: 'Prestation de suivi d\'exploitation', prix: 0 }
  ],
  realisations: [
    { ref: 'REA01', designation: 'Spécifications Ingénieur/Développeur (SFG, SFD, product backlog)', prix: 0 },
    { ref: 'REA02', designation: 'Réalisation Ingénieur/Développeur (cycle en V)', prix: 0 },
    { ref: 'REA03', designation: 'Conception plan recette Ingénieur/Développeur/Recetteur', prix: 0 },
    { ref: 'REA04', designation: 'Réalisation recette Recetteur', prix: 0 }
  ],
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

export const createDefaultCRT = (): CRTData => ({
  contenu: '',
  notes: '',
});

export const createDefaultQT = (): QTData => ({
  questions: [],
  notes: '',
});

// Utilitaires pour garantir des valeurs non nulles
export const ensureReglementConsultation = (data: DCEState['reglementConsultation']) => data || createDefaultReglementConsultation();
export const ensureActeEngagement = (data: DCEState['acteEngagement']) => data || createDefaultActeEngagement();
export const ensureCCAP = (data: DCEState['ccap']): CCAPData => {
  const defaults = createDefaultCCAP();
  if (!data) return defaults;
  return {
    ...data, // ✅ Préserver TOUS les champs existants (typeCCAP, clausesSpecifiques, etc.)
    dispositionsGenerales: { ...defaults.dispositionsGenerales, ...data.dispositionsGenerales },
    prixPaiement: { ...defaults.prixPaiement, ...data.prixPaiement },
    execution: { ...defaults.execution, ...data.execution },
    sections: data.sections || defaults.sections,
  };
};
export const ensureCCTP = (data: DCEState['cctp']) => data || createDefaultCCTP();
export const ensureBPU = (data: DCEState['bpu']) => data || createDefaultBPU();
export const ensureBPUTMA = (data: DCEState['bpuTMA']) => data || createDefaultBPUTMA();
export const ensureDQE = (data: DCEState['dqe']) => data || createDefaultDQE();
export const ensureDPGF = (data: DCEState['dpgf']) => data || createDefaultDPGF();
export const ensureDocumentsAnnexes = (data: DCEState['documentsAnnexes']) => data || createDefaultDocumentsAnnexes();
export const ensureCRT = (data: DCEState['crt']) => data || createDefaultCRT();
export const ensureQT = (data: DCEState['qt']) => data || createDefaultQT();
