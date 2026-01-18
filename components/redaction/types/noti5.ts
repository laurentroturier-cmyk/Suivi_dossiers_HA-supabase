export interface Noti5Data {
  numeroProcedure: string;
  
  pouvoirAdjudicateur: {
    nom: string;
    adresseVoie: string;
    codePostal: string;
    ville: string;
  };
  
  objetConsultation: string;
  
  attributaire: {
    denomination: string;
    siret: string;
    adresse1: string;
    adresse2: string;
    codePostal: string;
    ville: string;
    email: string;
    telephone: string;
    fax: string;
    estMandataire: boolean;
  };
  
  notification: {
    type: 'ensemble' | 'lots';
    lots: Array<{
      numero: string;
      intitule: string;
    }>;
  };
  
  executionPrestations: {
    type: 'immediate' | 'sur_commande';
    // 'immediate' = dès réception de la notification
    // 'sur_commande' = à réception d'un bon de commande ou ordre de service
  };
  
  garanties: {
    aucuneGarantie: boolean;
    retenue: {
      active: boolean;
      pourcentage: number;
      remplacablePar: {
        garantiePremieredemande: boolean;
        cautionPersonnelle: boolean;
      };
    };
    garantieAvanceSuperieure30: boolean;
    garantieAvanceInferieure30: {
      active: boolean;
      remplacableParCaution: boolean;
    };
  };
  
  piecesJointes: {
    actEngagementPapier: boolean; // 2 photocopies dont 1 avec formule "exemplaire unique"
    actEngagementPDF: boolean; // Copie format électronique PDF
  };
  
  signature: {
    lieu: string;
    date: string;
    signataireTitre: string;
    signataireNom: string;
  };
}
