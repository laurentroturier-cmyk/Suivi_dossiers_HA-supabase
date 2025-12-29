
import React from 'react';

export const RAW_CSV_PROJECTS = `IDProjet,Acheteur,Famille Achat Principale,Numéro de procédure (Afpa),Forme du marché,Objet court,Type de procédure,CCAG,Nombre de lots,Lots réservés,Support de procédure,Référence procédure (plateforme),Nombre de retraits,Nombre de soumissionnaires,Nombre de questions,Dispo sociales,Dispo environnementales,Projet ouvert à l'acquisition de solutions innovantes,Projet facilitant l'accès aux TPE/PME,Date d'écriture du DCE,Date de remise des offres,Date d'ouverture des offres,Date des Rejets,Avis d'attribution,Données essentielles,Finalité de la consultation,Statut de la consultation,Délai de traitement (calcul),RP - Date validation MSA,RP - Date envoi signature élec,RP - Date de validation du document,RP -  Date validation CODIR,RP - Commentaire,RP - Statut,Motivation non allotissement,Date limite étude stratégie avec client interne,Nom de la procédure,Durée du marché (en mois),Date d'échéance du marché,Durée de validité des offres (en jours),Date de remise des offres finales,Date de validité des offres (calculée),Date de Notification,Code CPV Principal,Archivage (Statut),Old_ID Consult,Old_ID Projet,Durée de publication,Date de remise des candidatures,NumProc,Montant de la procédure
1000,Leclercq Loic,Travaux - Services de maîtrise d'oeuvre immobilière,24267_PNSC_MOE-EXT-DIJON_LLQ,Marché simple,MOE-EXT-DIJON,Procédure Négociée Sans mise en Concurrence,MOE,1,FAUX,Dematis,1063530,4,1,0,Non,Non,Non,Non,17/12/2024,15/01/2025,16/01/2025,,25/03/2025,25/03/2025,Attribuée,5 - Terminée,,,,,,,,L'objet du marché ne permet pas l'identification de prestations distinctes.,,"Mission de Maitrise d'Oeuvre pour 3 - Traitement des démolitions, VRD, parkings et accès du centre de formation de Dijon",12,,150,,14/6/2025,,45262700,1 - En cours,1 239,,27,,1000 - 1239,
1001,Antonelli Paola,Travaux - Aménagements intérieurs,24268_MAPA_TX-ALTERN-BAT21-BOURGES_PAI,Marché simple,TX-ALTERN-BAT21-BOURGES,Procédure Adaptée,Travaux,3,FAUX,Dematis,1064007,29,5,1,Non,Oui,Non,Non,20/12/2024,17/01/2025,20/01/2025,24/01/2025,28/01/2025,28/01/2025,Attribuée;#Infructueuse,5 - Terminée,,,,,,,,,,Création d'un espace alternants au bâtiment 21 du centre Afpa de Bourges,12,,150,,16/06/2025,,45262700,1 - En cours,1 240,,28,,1001 - 1240,`;

export const RAW_CSV_DOSSIERS = `IDProjet,Titre_du_dossier,Acheteur,Prescripteur,Client_Interne,Statut_du_Dossier,Programme,Operation,Levier_Achat,Renouvellement_de_marche,Date_de_lancement_de_la_consultation,Date_de_deploiement_previsionnelle_du_marche,Perf_achat_previsionnelle_(en_%),Montant_previsionnel_du_marche_(_HT)_,Origine_du_montant_pour_le_calcul_de_l'economie,Priorite,Commission_Achat,NO_-_Type_de_validation,NO_-_MSA,NO_-_Date_validation_MSA,Sur_12_mois_economie_achat_previsionnelle_(€),NO_-_Date_previsionnelle_CA_ou_Commission,NO_-_Date_validation_CODIR,NO_-_Date_envoi_signature_electronique,NO_-_Date_de_validation_du_document,Nom_des_valideurs,NO_-_Statut,NO_-_Commentaire,Projet_ouvert_à_l'acquisition_de_solutions_innovantes,Projet_facilitant_l'accès_aux_TPE/PME,NumProc,Old_ID_Consult,Old_ID_Projet
1000,"Mission de Maitrise d'Oeuvre pour 3 - Traitement des démolitions, VRD, parkings et accès du centre de formation de Dijon",Leclercq Loic,Evelyne.Jeudi@afpa.fr,Direction de l'Immobilier,4 - Terminé,,,"Globalisation, mutualisation",FAUX,19/12/2024,08/01/2024,-3,"70000,00",,P1 - Important,FAUX,,,,,,,,,,,,Non,Non,1000 - 1239,1239,`;

export const PROJECT_FIELDS = [
  { id: 'NumProc', label: 'N° Procédure (PK)' },
  { id: 'IDProjet', label: 'ID Projet (FK)' },
  { id: 'Acheteur', label: 'Acheteur' },
  { id: 'Nom de la procédure', label: 'Nom Procédure' },
  { id: 'Objet court', label: 'Objet court' },
  { id: 'Famille Achat Principale', label: 'Famille Achat' },
  { id: 'Code CPV Principal', label: 'Code CPV Principal' },
  { id: 'Numéro de procédure (Afpa)', label: 'N° Afpa' },
  { id: 'Statut de la consultation', label: 'Statut' },
  { id: 'Montant de la procédure', label: 'Montant' },
  { id: 'Date_limite_validite_offres calculee', label: 'Date limite validité offres' },
];

export const DOSSIER_FIELDS = [
  { id: 'IDProjet', label: 'ID Projet (PK)' },
  { id: 'Titre_du_dossier', label: 'Titre Dossier' },
  { id: 'Acheteur', label: 'Acheteur' },
  { id: 'Client_Interne', label: 'Client Interne' },
  { id: 'Priorite', label: 'Priorité' },
  { id: 'CodesCPVDAE', label: 'Codes CPV DAE' },
  { id: 'Prescripteur', label: 'Prescripteur' },
  { id: 'Statut_du_Dossier', label: 'Statut Dossier' },
  { id: 'Renouvellement_de_marche', label: 'Renouvellement de marché' },
  { id: 'Commission_Achat', label: 'Commission Achat' },
  { id: 'NO_-_Type_de_validation', label: 'Type de validation' },
  { id: 'Montant_previsionnel_du_marche_(_HT)_', label: 'Montant Prév. HT' },
];

// Liste déroulante pour le champ "Statut_du_Dossier"
export const DOSSIER_STATUS_OPTIONS = [
  '1 - En programmation',
  '2.1 - Projet initié',
  '2.2 - Projet validé',
  '3.1 - Rédaction du DCE',
  '3.2 - Publiée',
  '3.3 - Analyse en cours',
  '4 - Terminé',
  '5 - Abandonné',
];

// Liste déroulante pour le champ "NO_-_Type_de_validation"
export const TYPE_VALIDATION_OPTIONS = [
  'Navette',
  'Commission Achat',
  "Conseil d'Administration",
  'Sans objet',
];

// Liste déroulante pour le champ "NO_-_Statut"
export const NO_STATUT_OPTIONS = [
  '1-Initié',
  '2-En cours',
  '3-Validé',
];

// Liste déroulante pour "Statut de la consultation" (procédures)
export const PROCEDURE_STATUS_OPTIONS = [
  '1 - Initiée',
  '2 - Rédaction',
  '3 - Publiée',
  '4 - Analyse en cours',
  '5 - Terminée',
];

// Regroupements logiques pour l'édition des procédures
export const PROCEDURE_GROUPS: Record<string, { label: string; fields: string[] }> = {
  identification: {
    label: 'Identification',
    fields: [
      'Type de procédure',
      'Code CPV Principal',
      'Nom de la procédure',
      'Objet court',
      'Statut de la consultation',
    ],
  },
  publication: {
    label: 'Publication',
    fields: [
      'Support de procédure',
      'Référence procédure (plateforme)',
      'Durée de publication',
      'Date d\'écriture du DCE',
      'Date de remise des candidatures',
      'Date de remise des offres',
      'Date d\'ouverture des offres',
      'Date de remise des offres finales',
      'Durée de validité des offres (en jours)',
      'Date de validité des offres (calculée)',
    ],
  },
  offres: {
    label: 'Retraits & Offres',
    fields: [
      'Nombre de retraits',
      'Nombre de soumissionnaires',
      'Nombre de questions',
    ],
  },
  rapport: {
    label: 'Rapport de présentation',
    fields: [
      'Date_limite_validite_offres calculee',
      'RP - Date validation MSA',
      'RP - Date envoi signature élec',
      'RP - Date de validation du document',
      'RP -  Date validation CODIR',
      'RP - Statut',
      'RP - Commentaire',
    ],
  },
  attribution: {
    label: 'Attribution',
    fields: [
      'Avis d\'attribution',
      'Date de Notification',
      'Données essentielles',
      'Finalité de la consultation',
    ],
  },
  marche: {
    label: 'Marché',
    fields: [
      'Forme du marché',
      'CCAG',
      'Date d\'échéance du marché',
      'Montant de la procédure',
    ],
  },
  strategie: {
    label: 'Stratégie',
    fields: [
      'Nombre de lots',
      'Lots réservés',
      'Durée du marché (en mois)',
      'Motivation non allotissement',
      'Date limite étude stratégie avec client interne',
      'Dispo sociales',
      'Dispo environnementales',
      "Projet ouvert à l'acquisition de solutions innovantes",
      "Projet facilitant l'accès aux TPE/PME",
    ],
  },
};

// Listes déroulantes pour procédures
export const FORME_MARCHE_OPTIONS = [
  'Marché simple',
  'Accord-cadre à bons de commande',
  'Marché mixte',
  'Accord-cadre à marchés subséquents',
];

export const CCAG_OPTIONS = [
  'FCS',
  'Travaux',
  'TIC',
  'MOE',
  'PI',
];

// Liste déroulante pour "Support de procédure"
export const SUPPORT_PROCEDURE_OPTIONS = [
  'Dematis',
  'Fina',
  'Sans support',
  'Autre',
];

// Liste déroulante pour "Motivation non allotissement"
export const NON_ALLOTISSEMENT_OPTIONS = [
  "L'objet du marché ne permet pas l'identification de prestations distinctes.",
  "La dévolution en lots séparés risque de rendre techniquement difficile l'exécution des prestations.",
  "La dévolution en lots séparés risque de rendre financièrement plus coûteuse l'exécution des prestations.",
  "L'acheteur n'est pas en mesure d'assurer par lui-même les missions d'organisation, de pilotage et de coordination."
];

// Liste déroulante pour "Finalité de la consultation" (choix multiple)
export const FINALITE_CONSULTATION_OPTIONS = [
  'Attribuée',
  'Sans suite',
  'Abandonnée',
  'Infructueuse',
];
