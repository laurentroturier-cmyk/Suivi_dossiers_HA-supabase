import { supabase } from '../../../lib/supabase';

/**
 * Service d'analyse des offres DQE basé sur localStorage.
 * Objectif : fournir une persistance légère sans créer de nouvelles tables Supabase.
 *
 * Structure stockée :
 *  - clé: `analyse_offres_dqe_<numeroProcedure>`
 *  - valeur: {
 *      procedureNumero: string;
 *      candidats: StoredCandidat[];
 *    }
 */

export interface StoredLigneCandidat {
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  // Champs optionnels pour conserver la richesse du BPU
  eco_contrib?: number;
  tva_pct?: number;
  montant_tva?: number;
  montant_ttc?: number;
}

export interface StoredCandidat {
  id: string;
  numero_lot: number;
  nom_candidat: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  lignes: StoredLigneCandidat[];
}

export const AnalyseOffresDQEService = {
  /**
   * Indique s'il existe des données sauvegardées pour cette procédure (au moins
   * un candidat sur un des lots pour l'utilisateur courant).
   */
  async hasData(numeroProcedure: string): Promise<boolean> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return false;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return false;

    // 1. Récupérer toutes les analyses de l'utilisateur pour cette procédure
    const { data: analyses, error: analysesError } = await supabase
      .from('analyse_offres_dqe')
      .select('id')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure);

    if (analysesError) {
      console.error('[AnalyseOffresDQE] Erreur hasData (analyses):', analysesError);
      return false;
    }

    if (!analyses || analyses.length === 0) return false;

    const analyseIds = analyses.map((a) => a.id);

    // 2. Vérifier s'il y a au moins un candidat rattaché à ces analyses
    const { data: candidats, error: candidatsError } = await supabase
      .from('analyse_offres_dqe_candidats')
      .select('id')
      .in('analyse_id', analyseIds)
      .limit(1);

    if (candidatsError) {
      console.error('[AnalyseOffresDQE] Erreur hasData (candidats):', candidatsError);
      return false;
    }

    return !!(candidats && candidats.length > 0);
  },

  /**
   * Retourne la liste des candidats (sans leurs lignes détaillées) pour une procédure.
   */
  async loadCandidatsByProcedure(
    numeroProcedure: string
  ): Promise<Array<StoredCandidat & { id: string }>> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return [];

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return [];

    // 1. Récupérer toutes les analyses de l'utilisateur pour cette procédure
    const { data: analyses, error: analysesError } = await supabase
      .from('analyse_offres_dqe')
      .select('id, numero_lot')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure);

    if (analysesError) {
      console.error('[AnalyseOffresDQE] Erreur loadCandidatsByProcedure (analyses):', analysesError);
      throw analysesError;
    }

    if (!analyses || analyses.length === 0) return [];

    const analyseIds = analyses.map((a) => a.id);
    const analyseById = new Map<string, { id: string; numero_lot: number }>();
    analyses.forEach((a: any) => {
      analyseById.set(a.id, { id: a.id, numero_lot: a.numero_lot });
    });

    // 2. Charger tous les candidats rattachés à ces analyses
    const { data: candidats, error: candidatsError } = await supabase
      .from('analyse_offres_dqe_candidats')
      .select('id, analyse_id, nom_candidat, total_ht, total_tva, total_ttc')
      .in('analyse_id', analyseIds);

    if (candidatsError) {
      console.error('[AnalyseOffresDQE] Erreur loadCandidatsByProcedure (candidats):', candidatsError);
      throw candidatsError;
    }

    if (!candidats || candidats.length === 0) return [];

    return candidats.map((c: any) => {
      const analyse = analyseById.get(c.analyse_id) || { numero_lot: 0 };
      return {
        id: c.id,
        numero_lot: analyse.numero_lot ?? 0,
        nom_candidat: c.nom_candidat,
        total_ht: c.total_ht ?? 0,
        total_tva: c.total_tva ?? 0,
        total_ttc: c.total_ttc ?? 0,
        lignes: [],
      };
    });
  },

  /**
   * Charge les lignes d'un candidat par son ID.
   */
  async loadLignesCandidat(candidatId: string): Promise<StoredLigneCandidat[]> {
    if (!candidatId) return [];

    const { data, error } = await supabase
      .from('analyse_offres_dqe_lignes')
      .select(
        'numero_ligne, code_article, designation, unite, quantite, prix_unitaire_ht, eco_contrib_ht, montant_ht, tva_pct, montant_tva, montant_ttc'
      )
      .eq('candidat_id', candidatId)
      .order('numero_ligne', { ascending: true });

    if (error) {
      console.error('[AnalyseOffresDQE] Erreur loadLignesCandidat:', error);
      throw error;
    }

    if (!data) return [];

    return data.map((row: any, index: number) => ({
      numero: row.code_article || String(row.numero_ligne ?? index + 1),
      designation: row.designation || '',
      unite: row.unite || '',
      quantite: row.quantite ?? 0,
      prix_unitaire: row.prix_unitaire_ht ?? 0,
      prix_total: row.montant_ht ?? 0,
      eco_contrib: row.eco_contrib_ht ?? 0,
      tva_pct: row.tva_pct ?? undefined,
      montant_tva: row.montant_tva ?? undefined,
      montant_ttc: row.montant_ttc ?? undefined,
    }));
  },

  /**
   * Crée ou récupère une "analyse" pour une procédure et un lot.
   * On crée une ligne par (utilisateur, numéro de procédure, numéro de lot).
   *
   * - Appel minimal (compat rétro) : getOrCreateAnalyse(numeroProcedure)
   *   → renvoie un objet avec uniquement `id` et `procedureNumero` (sans numéro de lot).
   * - Appel complet : getOrCreateAnalyse(numeroProcedure, numeroLot, nomLot?)
   *   → garantit une ligne en base pour ce triplet (user, procédure, lot) et renvoie aussi `numero_lot`.
   */
  async getOrCreateAnalyse(
    numeroProcedure: string,
    numeroLot?: number,
    nomLot?: string | null
  ): Promise<{ id: string; procedureNumero: string; numero_lot?: number } | null> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return null;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return null;

    // Si aucun numéro de lot n'est fourni, on ne peut pas créer une analyse cohérente
    if (numeroLot == null || Number.isNaN(numeroLot)) {
      console.warn('[AnalyseOffresDQE] getOrCreateAnalyse appelé sans numeroLot, retour simple.');
      return { id: numeroProcedure, procedureNumero: numeroProcedure };
    }

    // 1. Chercher une analyse existante
    const { data: existingAnalyses, error: selectError } = await supabase
      .from('analyse_offres_dqe')
      .select('id, numero_lot')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure)
      .eq('numero_lot', numeroLot)
      .limit(1);

    if (selectError) {
      console.error('[AnalyseOffresDQE] Erreur getOrCreateAnalyse (select):', selectError);
      throw selectError;
    }

    const existing = existingAnalyses && existingAnalyses[0];
    if (existing) {
      return {
        id: existing.id,
        procedureNumero: numeroProcedure,
        numero_lot: existing.numero_lot,
      };
    }

    // 2. Créer une nouvelle analyse
    const { data: inserted, error: insertError } = await supabase
      .from('analyse_offres_dqe')
      .insert({
        user_id: user.id,
        numero_procedure: numeroProcedure,
        numero_lot: numeroLot,
        nom_lot: nomLot ?? null,
      })
      .select('id, numero_lot')
      .single();

    if (insertError || !inserted) {
      console.error('[AnalyseOffresDQE] Erreur getOrCreateAnalyse (insert):', insertError);
      throw insertError;
    }

    return {
      id: inserted.id,
      procedureNumero: numeroProcedure,
      numero_lot: inserted.numero_lot,
    };
  },

  /**
   * Réinitialise complètement l'analyse pour une procédure (supprime tous les candidats sauvegardés).
   */
  async resetAnalyse(numeroProcedure: string): Promise<void> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) return;

    // Supprimer toutes les analyses pour cette procédure (les candidats et lignes
    // sont supprimés automatiquement via ON DELETE CASCADE)
    const { data: analyses, error: selectError } = await supabase
      .from('analyse_offres_dqe')
      .select('id')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure);

    if (selectError) {
      console.error('[AnalyseOffresDQE] Erreur resetAnalyse (select):', selectError);
      throw selectError;
    }

    if (!analyses || analyses.length === 0) return;

    const analyseIds = analyses.map((a) => a.id);
    const { error: deleteError } = await supabase
      .from('analyse_offres_dqe')
      .delete()
      .in('id', analyseIds);

    if (deleteError) {
      console.error('[AnalyseOffresDQE] Erreur resetAnalyse (delete):', deleteError);
      throw deleteError;
    }
  },

  /**
   * Sauvegarde un candidat et ses lignes pour une analyse donnée (localStorage).
   */
  async saveCandidatDQE(
    analyseId: string,
    numeroLot: number,
    _nomLot: string | null,
    nomCandidat: string,
    totalHT: number,
    totalTVA: number,
    totalTTC: number,
    lignes: StoredLigneCandidat[]
  ): Promise<{ id: string; numero_lot: number; nom_candidat: string } | null> {
    if (!analyseId) return null;

    // 1. Insérer le candidat
    const { data: insertedCandidat, error: candidatError } = await supabase
      .from('analyse_offres_dqe_candidats')
      .insert({
        analyse_id: analyseId,
        nom_candidat: nomCandidat,
        total_ht: totalHT,
        total_tva: totalTVA,
        total_ttc: totalTTC,
      })
      .select('id')
      .single();

    if (candidatError || !insertedCandidat) {
      console.error('[AnalyseOffresDQE] Erreur saveCandidatDQE (candidat):', candidatError);
      throw candidatError;
    }

    const candidatId = insertedCandidat.id as string;

    // 2. Insérer les lignes DQE
    if (lignes && lignes.length > 0) {
      const lignesToInsert = lignes.map((ligne, index) => ({
        candidat_id: candidatId,
        numero_ligne: index + 1,
        code_article: ligne.numero || null,
        categorie: null,
        designation: ligne.designation,
        unite: ligne.unite,
        quantite: ligne.quantite,
        prix_unitaire_ht: ligne.prix_unitaire,
        eco_contrib_ht: ligne.eco_contrib ?? 0,
        montant_ht: ligne.prix_total,
        tva_pct: ligne.tva_pct ?? null,
        montant_tva: ligne.montant_tva ?? null,
        montant_ttc: ligne.montant_ttc ?? null,
      }));

      const { error: lignesError } = await supabase
        .from('analyse_offres_dqe_lignes')
        .insert(lignesToInsert);

      if (lignesError) {
        console.error('[AnalyseOffresDQE] Erreur saveCandidatDQE (lignes):', lignesError);
        throw lignesError;
      }
    }

    return {
      id: candidatId,
      numero_lot: numeroLot,
      nom_candidat: nomCandidat,
    };
  },

  /**
   * Supprime un candidat (et ses lignes) pour toutes les procédures où il apparaît.
   */
  async deleteCandidat(candidatId: string): Promise<void> {
    if (!candidatId) return;

    const { error } = await supabase
      .from('analyse_offres_dqe_candidats')
      .delete()
      .eq('id', candidatId);

    if (error) {
      console.error('[AnalyseOffresDQE] Erreur deleteCandidat:', error);
      throw error;
    }
  },
};

