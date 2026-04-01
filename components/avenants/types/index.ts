// ============================================
// Types — Module Avenants (EXE10 + Transfert)
// ============================================

export interface AvenantData {
  id?: string;
  // En-tête
  demande: string;
  demandeur: string;
  // Contrat (sélectionné depuis la table 'contrats')
  contrat_reference: string;
  contrat_libelle: string;
  titulaire: string;
  numero_procedure: string | null;
  numero_lot: string | null;
  // Identification du titulaire (depuis Référentiel Fournisseurs)
  titulaire_nom: string;
  titulaire_siret: string;
  titulaire_adresse: string;
  titulaire_email: string;
  // Modification des prestations
  description_avenant: string;
  // Incidence financière
  incidence_financiere: boolean;      // Oui/Non
  montant_avenant_ht: number | null;
  // Modification du délai
  nouvelle_date_fin: string | null;
  // Rédaction
  redige_par: string;
  numero_avenant: number | null;
  montant_initial_ht: number | null;
  montant_precedent_ht: number | null;
  taux_tva: string;
  frn_nom_signataire: string;
  frn_fonction_signataire: string;
  duree_marche: string;
  date_notification: string | null;
  // Métadonnées
  statut: 'brouillon' | 'valide';
  created_at?: string;
  updated_at?: string;
}

export const AVENANT_EMPTY: AvenantData = {
  demande: '',
  demandeur: '',
  contrat_reference: '',
  contrat_libelle: '',
  titulaire: '',
  numero_procedure: null,
  numero_lot: null,
  titulaire_nom: '',
  titulaire_siret: '',
  titulaire_adresse: '',
  titulaire_email: '',
  description_avenant: '',
  incidence_financiere: true,
  montant_avenant_ht: null,
  nouvelle_date_fin: null,
  redige_par: '',
  numero_avenant: null,
  montant_initial_ht: null,
  montant_precedent_ht: null,
  taux_tva: '20.0%',
  frn_nom_signataire: '',
  frn_fonction_signataire: '',
  duree_marche: '',
  date_notification: null,
  statut: 'brouillon',
};

// ─── Avenant de transfert ─────────────────────────────────────────────────────

export interface AvenantTransfertData {
  id?: string;

  // En-tête
  demande: string;
  demandeur: string;
  numero_avenant: number | null;

  // Contrat (depuis TBL_Contrats)
  contrat_reference: string;
  contrat_libelle: string;
  date_notification: string | null;

  // Parties (éditables, pré-remplis)
  responsable_contrat_titre: string;    // "Mr le Directeur Général de l'Afpa"
  responsable_contrat_nom: string;      // "Mr Michael OHIER"

  // Nouveau titulaire
  nouveau_titulaire_denomination: string;
  nouveau_titulaire_forme_juridique: string;
  nouveau_titulaire_rcs: string;
  nouveau_titulaire_rcs_ville: string;
  nouveau_titulaire_adresse: string;

  // Ancien titulaire (pré-rempli depuis le contrat)
  ancien_titulaire_denomination: string;
  ancien_titulaire_forme_juridique: string;
  ancien_titulaire_rcs: string;
  ancien_titulaire_rcs_ville: string;
  ancien_titulaire_adresse: string;

  // Objet section B
  nature_operation: string;             // "Fusion Absorption"
  date_accord_afpa: string | null;      // Date accord préalable Afpa
  date_prise_effet: string | null;      // Art. 3

  // Signatures
  signataire_afpa_nom: string;
  signataire_afpa_titre: string;        // "Direction Nationale des Achats"
  redige_par: string;

  // Métadonnées
  statut: 'brouillon' | 'valide';
  created_at?: string;
  updated_at?: string;
}

export const AVENANT_TRANSFERT_EMPTY: AvenantTransfertData = {
  demande: '',
  demandeur: '',
  numero_avenant: null,
  contrat_reference: '',
  contrat_libelle: '',
  date_notification: null,
  responsable_contrat_titre: "Mr le Directeur Général de l'Afpa",
  responsable_contrat_nom: 'Mr Michael OHIER',
  nouveau_titulaire_denomination: '',
  nouveau_titulaire_forme_juridique: '',
  nouveau_titulaire_rcs: '',
  nouveau_titulaire_rcs_ville: 'Paris',
  nouveau_titulaire_adresse: '',
  ancien_titulaire_denomination: '',
  ancien_titulaire_forme_juridique: '',
  ancien_titulaire_rcs: '',
  ancien_titulaire_rcs_ville: '',
  ancien_titulaire_adresse: '',
  nature_operation: 'Fusion Absorption',
  date_accord_afpa: null,
  date_prise_effet: null,
  signataire_afpa_nom: '',
  signataire_afpa_titre: 'Direction Nationale des Achats',
  redige_par: '',
  statut: 'brouillon',
};
