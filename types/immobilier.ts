// Types pour la table immobilier

export interface Immobilier {
  // Identifiants
  "Code demande": string;
  "Code Site"?: string;
  "Code projet"?: string;

  // Statut et étapes
  "Statut"?: string;
  "Etape demande"?: string;
  "Type de traitement DNA"?: string;

  // Informations générales
  "Intitulé"?: string;
  "Descriptif"?: string;
  "Type de programme"?: string;
  "Composant principal"?: string;
  "Programme"?: string;

  // Localisation
  "Région"?: string;
  "Centre"?: string;
  "Site"?: string;

  // Organisation
  "Chef de Projet"?: string;
  "Chargé d'opérations"?: string;
  "RPA"?: string;
  "Consultation"?: string;

  // Priorité
  "Priorité"?: string;

  // Avancement
  "% Réalisé"?: string;

  // Budget
  "Budget en €"?: string;
  "Coût Travaux TDC TTC"?: string;
  "Coût matériel TTC"?: string;
  "Engagé en €"?: string;
  "Réalisé en €"?: string;
  "Disponible en €"?: string;

  // Phases de projet
  "Date CNI"?: string;
  "AMO"?: string;
  "MOE"?: string;
  "Diag"?: string;
  "Esquisse"?: string;
  "APS"?: string;
  "APD"?: string;
  "Projet"?: string;
  "Autorisation"?: string;
  "Consultation TVX"?: string;

  // Travaux
  "Date de démarrage travaux"?: string;
  "Date de fin de travaux"?: string;
  "Observations (Travaux)"?: string;

  // Décisions
  "Date CRI  (Opportunité)"?: string;
  "Décision CRI (Opportunité)"?: string;
  "Date CRI (Validation)"?: string;
  "Décision CRI (Validation)"?: string;
  "Décision CNI"?: string;
  "TR / IN"?: string;

  // Commentaires
  "Commentaire DNA"?: string;
}

export interface ImmobilierStats {
  totalProjets: number;
  budgetTotal: number;
  budgetEngage: number;
  budgetRealise: number;
  tauxMoyenRealisation: number;
  projetEnCours: number;
  projetsTermines: number;
  projetsProfondeur: number;
}

export interface ImmobilierFilters {
  search: string;
  statut?: string;
  region?: string;
  centre?: string;
  priorite?: string;
  chefProjet?: string;
  programme?: string;
  etapeDebut?: string;
  etapeFin?: string;
}

export interface ImmobilierColumn {
  key: keyof Immobilier;
  label: string;
  width?: string;
  sortable?: boolean;
  filterable?: boolean;
  type?: 'text' | 'number' | 'date' | 'percentage';
}
