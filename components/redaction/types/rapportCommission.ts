export interface RapportCommissionData {
  // En-tête
  enTete: {
    numeroProcedure: string; // Numéro à 5 chiffres
    titreMarche: string;
    numeroMarche: string;
    typeMarcheTitle: string; // Ex: "MARCHE PUBLIC DE FOURNITURES ET SERVICES"
    dateLimiteOffres: string;
    heureLimiteOffres: string;
    dateLimiteQuestions: string;
    dateLimiteReponses: string;
  };
  
  // 2. Présentation du pouvoir adjudicateur
  pouvoirAdjudicateur: {
    nom: string;
    adresseVoie: string;
    codePostal: string;
    ville: string;
    pays: string;
    telephone: string;
    courriel: string;
    adresseWeb: string;
    profilAcheteur: string;
  };
  
  // 3. Objet de la consultation
  objet: {
    description: string;
    cpvPrincipal: string;
    cpvPrincipalLib: string;
    cpvSecondaires: Array<{
      code: string;
      libelle: string;
    }>;
  };
  
  // 4. Conditions de la consultation
  conditions: {
    modePassation: string;
    nbLots: string;
    lots: Array<{
      numero: string;
      intitule: string;
      montantMax: string;
    }>;
    variantesAutorisees: boolean;
    groupementSolidaire: boolean;
    groupementConjoint: boolean;
    visiteObligatoire: boolean;
  };
  
  // 5. Type de marché
  typeMarche: {
    forme: string; // Ex: "Accord-cadre mono-attributaire"
    dureeInitiale: string;
    nbReconductions: string;
    dureeReconduction: string;
    dureeMax: string;
    sousTraitanceTotaleInterdite: boolean;
    lieuExecution: string;
  };
  
  // 6. Contenu du DCE
  dce: {
    documents: string[]; // Liste des documents du DCE
    urlCCAG: string;
  };
  
  // 7. Conditions de remise
  remise: {
    delaiValiditeOffres: string; // En jours
  };
  
  // 8. Sélection et jugement
  jugement: {
    critereFinancier: string; // Pondération en %
    critereTechnique: string; // Pondération en %
    sousCriteresTechniques: Array<{
      nom: string;
      points: string;
    }>;
  };
  
  // 12. Procédure de recours
  recours: {
    tribunalNom: string;
    tribunalAdresse: string;
    tribunalVille: string;
    tribunalTel: string;
    tribunalCourriel: string;
    tribunalSIRET: string;
  };
}
