// ============================================
// Types — Module Avenants (EXE10)
// ============================================

export interface AvenantData {
  id?: string;
  // En-tête
  demande: string;
  demandeur: string;
  valideur_direction: string;
  // Contrat (sélectionné depuis la table 'contrats')
  contrat_reference: string;
  contrat_libelle: string;
  titulaire: string;
  // Modification des prestations
  description_avenant: string;
  // Modification du montant
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
  valideur_direction: '',
  contrat_reference: '',
  contrat_libelle: '',
  titulaire: '',
  description_avenant: '',
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
