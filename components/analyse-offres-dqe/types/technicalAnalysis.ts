/**
 * Types pour les Parties 2 (Analyse technique) et 3 (Synthèse)
 * du module Analyse des offres DQE.
 *
 * AN01Criterion et NOTATION_SCALE sont importés directement depuis AN01
 * pour éviter toute duplication.
 */

export type { AN01Criterion } from '../../an01/types/saisie';
export { NOTATION_SCALE } from '../../an01/types/saisie';

import type { AN01Criterion } from '../../an01/types/saisie';

// ---------------------------------------------------------------------------
// Config technique (table analyse_offres_dqe_technique)
// ---------------------------------------------------------------------------

/**
 * Configuration technique d'un lot : critères chargés depuis le DCE
 * et pondérations financier / technique (somme = 100).
 */
export interface DQETechniqueConfig {
  id: string;
  analyse_id: string;
  poids_financier: number;  // ex. 60
  poids_technique: number;  // ex. 40  (poids_financier + poids_technique = 100)
  criteria: AN01Criterion[];
}

// ---------------------------------------------------------------------------
// Notations (table analyse_offres_dqe_notations)
// ---------------------------------------------------------------------------

/**
 * Notation d'un candidat sur un critère (une ligne de la table).
 */
export interface DQENotation {
  analyse_id: string;
  candidat_id: string;
  critere_id: string;
  score: number;           // 0-4
  commentaire?: string;
}

/**
 * Map en mémoire : notations[candidat_id][critere_id] = { score, commentaire }
 */
export type DQENotationsMap = Record<
  string,
  Record<string, { score: number; commentaire?: string }>
>;

// ---------------------------------------------------------------------------
// Synthèse (Partie 3)
// ---------------------------------------------------------------------------

/**
 * Résultat calculé pour un candidat dans la synthèse d'un lot.
 */
export interface DQESynthesisCandidat {
  candidat_id: string;
  nom_candidat: string;
  total_ht: number;
  /** Score financier normalisé sur poids_financier (0..poids_financier) */
  score_financier: number;
  /** Score technique normalisé sur poids_technique (0..poids_technique) */
  score_technique: number;
  /** Score final combiné (0..100) */
  score_final: number;
  rang_financier: number;
  rang_technique: number;
  rang_final: number;
}

/**
 * Résultat de synthèse complet pour un lot.
 */
export interface DQESynthesisLot {
  analyse_id: string;
  numero_lot: number;
  nom_lot: string;
  poids_financier: number;
  poids_technique: number;
  candidats: DQESynthesisCandidat[];
  moyenne_ht: number;
  winner: DQESynthesisCandidat | null;
  /** Économie générée : montant HT winner vs moyenne des offres */
  gain_ht: number;
  gain_pct: number;
}
