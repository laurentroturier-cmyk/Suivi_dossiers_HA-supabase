// ============================================
// TYPES POUR L'ACTE D'ENGAGEMENT (ATTRI1)
// Formulaire officiel du Ministère de l'Économie
// ============================================

// ============================================
// SECTION A - OBJET DE L'ACTE D'ENGAGEMENT
// ============================================

export interface ObjetActeEngagement {
  // Objet du marché public
  objetMarche: string;
  numeroReference: string;
  
  // Type d'acte (cases à cocher)
  typeActe: {
    ensembleMarche: boolean;        // À l'ensemble du marché public (non allotissement)
    lotSpecifique: boolean;          // Au lot n°X
    numeroLot: string;
    intituleLot: string;
  };
  
  // Type d'offre
  typeOffre: {
    offreBase: boolean;              // À l'offre de base
    variante: boolean;               // À la variante suivante
    descriptionVariante: string;
  };
  
  // Prestations supplémentaires
  prestationsSupplementaires: {
    avecPrestations: boolean;
    description: string;
  };
}

// ============================================
// SECTION B1 - IDENTIFICATION DU TITULAIRE
// ============================================

export interface PiecesConstitutives {
  ccap: boolean;                      // CCAP - Cahier des Clauses Administratives Particulières
  ccapNumero: string;
  ccatp: boolean;
  ccatpNumero: string;
  ccag: '' | 'FCS' | 'Travaux' | 'PI' | 'TIC' | 'MOE';  // CCAG unique via select
  ccagFCS: boolean;                   // CCAG Fournitures Courantes et Services
  ccagTravaux: boolean;               // CCAG Travaux
  ccagPI: boolean;                    // CCAG Propriété Intellectuelle
  ccagTIC: boolean;                   // CCAG TIC
  ccagMOE: boolean;                   // CCAG Maîtrise d'œuvre
  cctp: boolean;
  cctpNumero: string;
  autres: boolean;
  autresDescription: string;
}

export interface TitulaireIndividuel {
  // Le signataire
  civilite: string;                   // M. / Mme
  nomPrenom: string;
  
  // Engagement
  typeEngagement: 'propre-compte' | 'societe' | 'groupement';
  
  // Si engagement pour son propre compte
  nomCommercial: string;
  denominationSociale: string;
  adresseEtablissement: string;
  adresseSiegeSocial: string;         // Si différente
  adresseElectronique: string;
  telephone: string;
  telecopie: string;
  siret: string;
}

export interface MembreGroupement {
  id: string;
  nomCommercial: string;
  denominationSociale: string;
  adresseAgence: string;
  villeAgence: string;
  telephoneAgence: string;
  siretAgence: string;
  adresseSiege: string;
  villeSiege: string;
  telephoneSiege: string;
  siretSiege: string;
}

// ============================================
// SECTION B2 - NATURE DU GROUPEMENT
// ============================================

export interface PrestationGroupement {
  membreId: string;
  designationMembre: string;
  naturePrestations: string;
  montantHT: string;
}

export interface NatureGroupement {
  typeGroupement: 'conjoint' | 'solidaire' | '';
  repartitionPrestations: PrestationGroupement[];
}

// ============================================
// SECTION B3 - COMPTE(S) À CRÉDITER
// ============================================

export interface CompteBancaire {
  id: string;
  nomEtablissement: string;
  codeEtablissement: string;
  numeroCompte: string;
  iban?: string;
  bic?: string;
}

// ============================================
// SECTION B4 - AVANCE
// ============================================

export interface Avance {
  renonceBenefice: boolean;           // true = Oui (renonce), false = Non (ne renonce pas)
}

// ============================================
// SECTION B5 - DURÉE D'EXÉCUTION
// ============================================

export interface DureeExecution {
  dureeEnMois: number;
  
  // Point de départ (cases à cocher)
  pointDepart: 'notification' | 'ordre-service' | 'date-execution';
  dateExecutionPrevue?: string;
  
  // Reconduction
  estReconductible: boolean;
  nombreReconductions: string;
  dureeReconductions: string;
}

// ============================================
// SECTION C - SIGNATURE DU MARCHÉ PUBLIC
// ============================================

export interface SignataireTitulaire {
  nomPrenom: string;
  qualite: string;                    // Ex: "Directeur d'Agence"
  lieuSignature: string;
  dateSignature: string;
  signatureElectronique: boolean;
}

export interface MandataireGroupement {
  nomCommercial: string;
  denominationSociale: string;
  
  // Nature du mandataire en cas de groupement conjoint
  typeMandataire: 'conjoint' | 'solidaire' | '';
  
  // Mandats donnés au mandataire
  mandats: {
    signerActeEngagement: boolean;
    representerAcheteur: boolean;
    coordonnerPrestations: boolean;
    signerModifications: boolean;
    conditionsAnnexe: boolean;
    descriptionMandat: string;
  };
  
  // Signatures des membres du groupement
  signataires: SignataireTitulaire[];
}

// ============================================
// SECTION D - ACHETEUR
// ============================================

export interface Acheteur {
  designation: string;                 // Nom de l'organisme acheteur
  referenceAvis: string;               // Référence de l'avis de marché
  
  // Signataire
  signataire: {
    civilite: string;
    nomPrenom: string;
    qualite: string;                   // Ex: "Directrice Générale"
  };
  
  lieuSignature: string;
  dateSignature: string;
}

// ============================================
// SECTION PRIX (B1 suite)
// ============================================

export interface PrixMarche {
  // Type de prix
  typePrix: 'indiques-ci-dessous' | 'annexe-financiere';
  
  // Si prix indiqués ci-dessous
  tauxTVA: string;
  montantHTChiffres: string;
  montantHTLettres: string;
  montantTTCChiffres: string;
  montantTTCLettres: string;
  
  // Note: TVA intracommunautaire
  tvaIntracommunautaire: boolean;
}

// ============================================
// TYPE COMPLET - ACTE D'ENGAGEMENT ATTRI1
// ============================================

export interface ActeEngagementATTRI1Data {
  // Métadonnées
  version: string;                     // Version du formulaire (ex: "2019")
  numeroPage: string;                  // Pour la numérotation
  
  // Section A
  objet: ObjetActeEngagement;
  
  // Section B1
  piecesConstitutives: PiecesConstitutives;
  titulaire: TitulaireIndividuel;
  membresGroupement: MembreGroupement[];
  
  // Section B1 (suite) - Prix
  prix: PrixMarche;
  
  // Section B2
  groupement: NatureGroupement;
  
  // Section B3
  comptesBancaires: CompteBancaire[];
  
  // Section B4
  avance: Avance;
  
  // Section B5
  dureeExecution: DureeExecution;
  
  // Section C
  signatureTitulaire: SignataireTitulaire;
  mandataireGroupement: MandataireGroupement;
  
  // Section D
  acheteur: Acheteur;
}

// ============================================
// VALEURS PAR DÉFAUT
// ============================================

export const createDefaultActeEngagementATTRI1 = (): ActeEngagementATTRI1Data => ({
  version: '2019',
  numeroPage: '',
  
  objet: {
    objetMarche: '',
    numeroReference: '',
    typeActe: {
      ensembleMarche: false,
      lotSpecifique: true,
      numeroLot: '',
      intituleLot: '',
    },
    typeOffre: {
      offreBase: true,
      variante: false,
      descriptionVariante: '',
    },
    prestationsSupplementaires: {
      avecPrestations: false,
      description: '',
    },
  },
  
  piecesConstitutives: {
    ccap: true,
    ccapNumero: '',
    ccatp: true,
    ccatpNumero: '',
    ccag: '',  // Utiliser le select, pas les booléens
    ccagFCS: false,
    ccagTravaux: false,
    ccagPI: false,
    ccagTIC: false,
    ccagMOE: false,
    cctp: false,
    cctpNumero: '',
    autres: false,
    autresDescription: '',
  },
  
  titulaire: {
    civilite: 'M.',
    nomPrenom: '',
    typeEngagement: 'societe',
    nomCommercial: '',
    denominationSociale: '',
    adresseEtablissement: '',
    adresseSiegeSocial: '',
    adresseElectronique: '',
    telephone: '',
    telecopie: '',
    siret: '',
  },
  
  membresGroupement: [],
  
  prix: {
    typePrix: 'annexe-financiere',
    tauxTVA: '20',
    montantHTChiffres: '',
    montantHTLettres: '',
    montantTTCChiffres: '',
    montantTTCLettres: '',
    tvaIntracommunautaire: false,
  },
  
  groupement: {
    typeGroupement: '',
    repartitionPrestations: [],
  },
  
  comptesBancaires: [{
    id: '1',
    nomEtablissement: '',
    codeEtablissement: '',
    numeroCompte: '',
    iban: '',
    bic: '',
  }],
  
  avance: {
    renonceBenefice: true,
  },
  
  dureeExecution: {
    dureeEnMois: 12,
    pointDepart: 'notification',
    dateExecutionPrevue: '',
    estReconductible: false,
    nombreReconductions: '',
    dureeReconductions: '',
  },
  
  signatureTitulaire: {
    nomPrenom: '',
    qualite: '',
    lieuSignature: '',
    dateSignature: '',
    signatureElectronique: true,
  },
  
  mandataireGroupement: {
    nomCommercial: '',
    denominationSociale: '',
    typeMandataire: '',
    mandats: {
      signerActeEngagement: false,
      representerAcheteur: false,
      coordonnerPrestations: false,
      signerModifications: false,
      conditionsAnnexe: false,
      descriptionMandat: '',
    },
    signataires: [],
  },
  
  acheteur: {
    designation: 'AFPA - Agence nationale pour la formation professionnelle des adultes',
    referenceAvis: '',
    signataire: {
      civilite: 'Mme',
      nomPrenom: '',
      qualite: '',
    },
    lieuSignature: 'Montreuil',
    dateSignature: '',
  },
});

// ============================================
// CONSTANTES CCAG
// ============================================

export const CCAG_OPTIONS = [
  { code: 'FCS', label: 'CCAG de Fournitures Courantes et de Services' },
  { code: 'TRAVAUX', label: 'CCAG de Travaux' },
  { code: 'PI', label: 'CCAG de Prestations Intellectuelles' },
  { code: 'TIC', label: 'CCAG des Technologies de l\'Information et de la Communication' },
  { code: 'MOE', label: 'CCAG de Maîtrise d\'Œuvre' },
] as const;
