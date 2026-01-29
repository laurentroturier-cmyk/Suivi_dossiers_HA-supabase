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
    executionImmediateChecked: boolean; // L'exécution commencera à compter de la date de notification
    executionOrdreServiceChecked: boolean; // L'exécution commencera à la réception de l'ordre de service
  };
  
  garantie: {
    pasPrevue: boolean; // Les documents ne prévoient pas de retenue de garantie
    prevueSansAllotissement: boolean; // En l'absence d'allotissement
    retenueGarantieSansAllotissement: boolean; // Retenue de garantie prévue
    garantiePremiereDemandeOuCautionSansAllotissement: boolean; // Garantie à première demande ou caution
    prevueAvecAllotissement: boolean; // En cas d'allotissement
    montantInferieur90k: boolean; // Montant < 90 000 € HT
    montantSuperieur90kRetenue: boolean; // Montant >= 90 000 € HT avec retenue
    montantSuperieur90kGarantie: boolean; // Montant >= 90 000 € HT avec garantie
    modalites: string; // Précisions sur les modalités
  };
  
  // Anciennes propriétés conservées pour rétro-compatibilité
  executionPrestations?: {
    type: 'immediate' | 'sur_commande';
  };
  
  garanties?: {
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
    actEngagementPapier: boolean; // 2 exemplaires papier dont 1 avec "exemplaire unique"
    actEngagementPDF: boolean; // 1 copie électronique PDF
  };
  
  signature: {
    lieu: string;
    date: string;
    signataireTitre: string;
    signataireNom: string;
  };
}
