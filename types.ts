
export interface ProjectData {
  "IDProjet": string;
  "Acheteur": string;
  "Famille Achat Principale": string;
  "Numéro de procédure (Afpa)": string;
  "Forme du marché": string;
  "Objet court": string;
  "Type de procédure": string;
  "CCAG": string;
  "Nombre de lots": string;
  "Lots réservés": string;
  "Support de procédure": string;
  "Référence procédure (plateforme)": string;
  "Nombre de retraits": string;
  "Nombre de soumissionnaires": string;
  "Nombre de questions": string;
  "Dispo sociales": string;
  "Dispo environnementales": string;
  "Projet ouvert à l'acquisition de solutions innovantes": string;
  "Projet facilitant l'accès aux TPE/PME": string;
  "Date d'écriture du DCE": string;
  "Date de remise des offres": string;
  "Date d'ouverture des offres": string;
  "Date des Rejets": string;
  "Avis d'attribution": string;
  "Données essentielles": string;
  "Finalité de la consultation": string;
  "Statut de la consultation": string;
  "date_de_lancement_de_la_consultation": string;
  "Date_de_deploiement_previsionnelle_du_marche": string;
  "Perf_achat_previsionnelle_(en_%)": string;
  "Origine_du_montant_pour_le_calcul_de_l'economie": string;
  "Délai de traitement (calcul)": string;
  "RP - Date validation MSA": string;
  "RP - Date envoi signature élec": string;
  "RP - Date de validation du document": string;
  "RP -  Date validation CODIR": string;
  "RP - Commentaire": string;
  "RP - Statut": string;
  "Motivation non allotissement": string;
  "Date limite étude stratégie avec client interne": string;
  "Nom de la procédure": string;
  "Durée du marché (en mois)": string;
  "Date d'échéance du marché": string;
  "Durée de validité des offres (en jours)": string;
  "Date de remise des offres finales": string;
  "Date de validité des offres (calculée)": string;
  "Date de Notification": string;
  "Code CPV Principal": string;
  "Archivage (Statut)": string;
  "Old_ID Consult": string;
  "Old_ID Projet": string;
  "Durée de publication": string;
  "Date de remise des candidatures": string;
  "NumProc": string;
  "Montant de la procédure": string;
}

export interface DossierData {
  IDProjet: string;
  Titre_du_dossier: string;
  Acheteur: string;
  "Type de procédure": string;
  Prescripteur: string;
  Client_Interne: string;
  Statut_du_Dossier: string;
  Programme: string;
  Operation: string;
  Levier_Achat: string;
  Renouvellement_de_marche: string;
  Date_de_lancement_de_la_consultation: string;
  Date_de_deploiement_previsionnelle_du_marche: string;
  "Perf_achat_previsionnelle_(en_%)": string;
  "Montant_previsionnel_du_marche_(_HT)_": string;
  "Origine_du_montant_pour_le_calcul_de_l'economie": string;
  Priorite: string;
  Commission_Achat: string;
  "NO_-_Type_de_validation": string;
  "NO_-_MSA": string;
  "NO_-_Date_validation_MSA": string;
  "Sur_12_mois_economie_achat_previsionnelle_(€)": string;
  "NO_-_Date_previsionnelle_CA_ou_Commission": string;
  "NO_-_Date_validation_CODIR": string;
  "NO_-_Date_envoi_signature_electronique": string;
  "NO_-_Date_de_validation_du_document": string;
  Nom_des_valideurs: string;
  "NO_-_Statut": string;
  "NO_-_Commentaire": string;
  "Projet_ouvert_à_l'acquisition_de_solutions_innovantes": string;
  "Projet_facilitant_l'accès_aux_TPE/PME": string;
  NumProc: string;
  Old_ID_Consult: string;
  Old_ID_Projet: string;
  CodesCPVDAE: string;
}

export interface SegmentationRow {
  dna_segment: string;
  dna_famille: string;
  dna_sousfamille: string;
}

export type TableType = 'home' | 'procedures' | 'dossiers' | 'dashboard' | 'ai' | 'export' | 'gantt' | 'an01' | 'commission' | 'detail' | 'retraits' | 'depots';
