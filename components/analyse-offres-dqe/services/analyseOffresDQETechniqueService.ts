/**
 * Service Supabase pour les Parties 2 et 3 du module Analyse des offres DQE.
 *
 * Tables gérées :
 *   - analyse_offres_dqe_technique  (config critères + pondérations par lot)
 *   - analyse_offres_dqe_notations  (notations 0-4 par candidat et critère)
 */

import { supabase } from '../../../lib/supabase';
import type { AN01Criterion } from '../../an01/types/saisie';
import type { DQETechniqueConfig, DQENotation, DQENotationsMap } from '../types/technicalAnalysis';

export const AnalyseOffresDQETechniqueService = {

  // -------------------------------------------------------------------------
  // CONFIG TECHNIQUE (critères + pondérations)
  // -------------------------------------------------------------------------

  /**
   * Charge la configuration technique pour un analyse_id.
   * Si elle n'existe pas encore, crée une entrée vide par défaut (60/40).
   */
  async getOrCreateConfig(analyseId: string): Promise<DQETechniqueConfig | null> {
    if (!analyseId) return null;

    // Tentative de lecture
    const { data: existing, error: readError } = await supabase
      .from('analyse_offres_dqe_technique')
      .select('*')
      .eq('analyse_id', analyseId)
      .maybeSingle();

    if (readError && readError.code !== 'PGRST116') {
      console.error('[DQETechnique] Erreur chargement config:', readError);
      return null;
    }

    if (existing) {
      return {
        id: existing.id,
        analyse_id: existing.analyse_id,
        poids_financier: existing.poids_financier ?? 60,
        poids_technique: existing.poids_technique ?? 40,
        criteria: (existing.criteria as AN01Criterion[]) ?? [],
      };
    }

    // Création de la config par défaut
    const { data: created, error: insertError } = await supabase
      .from('analyse_offres_dqe_technique')
      .insert({
        analyse_id: analyseId,
        poids_financier: 60,
        poids_technique: 40,
        criteria: [],
      })
      .select()
      .single();

    if (insertError) {
      console.error('[DQETechnique] Erreur création config:', insertError);
      return null;
    }

    return {
      id: created.id,
      analyse_id: created.analyse_id,
      poids_financier: 60,
      poids_technique: 40,
      criteria: [],
    };
  },

  /**
   * Sauvegarde (upsert) la configuration technique d'un lot.
   */
  async saveConfig(
    analyseId: string,
    poidsFinancier: number,
    poidsTechnique: number,
    criteria: AN01Criterion[]
  ): Promise<boolean> {
    if (!analyseId) return false;

    const { error } = await supabase
      .from('analyse_offres_dqe_technique')
      .upsert(
        {
          analyse_id: analyseId,
          poids_financier: poidsFinancier,
          poids_technique: poidsTechnique,
          criteria,
        },
        { onConflict: 'analyse_id' }
      );

    if (error) {
      console.error('[DQETechnique] Erreur sauvegarde config:', error);
      return false;
    }
    return true;
  },

  // -------------------------------------------------------------------------
  // NOTATIONS
  // -------------------------------------------------------------------------

  /**
   * Charge toutes les notations pour un lot et les retourne sous forme de map.
   * notations[candidat_id][critere_id] = { score, commentaire }
   */
  async loadNotations(analyseId: string): Promise<DQENotationsMap> {
    if (!analyseId) return {};

    const { data, error } = await supabase
      .from('analyse_offres_dqe_notations')
      .select('candidat_id, critere_id, score, commentaire')
      .eq('analyse_id', analyseId);

    if (error) {
      console.error('[DQETechnique] Erreur chargement notations:', error);
      return {};
    }

    const map: DQENotationsMap = {};
    for (const row of data ?? []) {
      if (!map[row.candidat_id]) map[row.candidat_id] = {};
      map[row.candidat_id][row.critere_id] = {
        score: row.score,
        commentaire: row.commentaire ?? undefined,
      };
    }
    return map;
  },

  /**
   * Upsert d'une notation individuelle.
   * Utile pour les mises à jour en temps réel (debounce).
   */
  async upsertNotation(notation: DQENotation): Promise<boolean> {
    const { error } = await supabase
      .from('analyse_offres_dqe_notations')
      .upsert(
        {
          analyse_id: notation.analyse_id,
          candidat_id: notation.candidat_id,
          critere_id: notation.critere_id,
          score: notation.score,
          commentaire: notation.commentaire ?? null,
        },
        { onConflict: 'analyse_id,candidat_id,critere_id' }
      );

    if (error) {
      console.error('[DQETechnique] Erreur upsert notation:', error);
      return false;
    }
    return true;
  },

  /**
   * Sauvegarde en masse toutes les notations d'un lot (upsert).
   * Flatten la map en tableau de lignes puis upsert en une seule requête.
   */
  async saveAllNotations(analyseId: string, notationsMap: DQENotationsMap): Promise<boolean> {
    if (!analyseId) return false;

    const rows: Omit<DQENotation, never>[] = [];
    for (const [candidatId, byCritere] of Object.entries(notationsMap)) {
      for (const [critereId, val] of Object.entries(byCritere)) {
        rows.push({
          analyse_id: analyseId,
          candidat_id: candidatId,
          critere_id: critereId,
          score: val.score,
          commentaire: val.commentaire ?? undefined,
        });
      }
    }

    if (rows.length === 0) return true;

    const { error } = await supabase
      .from('analyse_offres_dqe_notations')
      .upsert(
        rows.map(r => ({
          analyse_id: r.analyse_id,
          candidat_id: r.candidat_id,
          critere_id: r.critere_id,
          score: r.score,
          commentaire: r.commentaire ?? null,
        })),
        { onConflict: 'analyse_id,candidat_id,critere_id' }
      );

    if (error) {
      console.error('[DQETechnique] Erreur saveAllNotations:', error);
      return false;
    }
    return true;
  },

  /**
   * Supprime toutes les notations d'un lot (reset de la Partie 2).
   */
  async deleteAllNotations(analyseId: string): Promise<boolean> {
    if (!analyseId) return false;

    const { error } = await supabase
      .from('analyse_offres_dqe_notations')
      .delete()
      .eq('analyse_id', analyseId);

    if (error) {
      console.error('[DQETechnique] Erreur deleteAllNotations:', error);
      return false;
    }
    return true;
  },
};
