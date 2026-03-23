/**
 * Calcul de synthèse pour les Parties 2 et 3 du module Analyse des offres DQE.
 *
 * Fonctions pures (sans appel Supabase) — testables isolément.
 * La logique de scoring est alignée sur saisieToAnalysis.ts du module AN01 :
 *   - Score financier  = (min_HT / candidat_HT) * poids_financier   (méthode GRAMP)
 *   - Score technique  = (somme note/4 * base_points) / total_barème * poids_technique
 *   - Score final      = score_financier + score_technique
 */

import type { AN01Criterion } from '../../an01/types/saisie';
import type { DQENotationsMap, DQESynthesisCandidat, DQESynthesisLot, DQETechniqueConfig } from '../types/technicalAnalysis';

/** Candidat minimal requis pour le calcul (sous-ensemble de CandidatDQE) */
export interface CandidatForSynthesis {
  id: string;
  name: string;
  totalHT: number;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/**
 * Calcule le score financier GRAMP normalisé sur poids_financier.
 * Le candidat le moins-disant obtient poids_financier ; les autres sont
 * calculés proportionnellement.
 */
function computeFinancialScores(
  candidats: CandidatForSynthesis[],
  poidsFinancier: number
): Record<string, number> {
  const valids = candidats.filter(c => c.totalHT > 0);
  if (valids.length === 0) {
    return Object.fromEntries(candidats.map(c => [c.id, 0]));
  }
  const minHT = Math.min(...valids.map(c => c.totalHT));
  const scores: Record<string, number> = {};
  for (const c of candidats) {
    scores[c.id] = c.totalHT > 0
      ? round2((minHT / c.totalHT) * poidsFinancier)
      : 0;
  }
  return scores;
}

/**
 * Calcule le score technique normalisé sur poids_technique.
 * Formule : (somme_critères (note/4 * base_points)) / total_barème * poids_technique
 */
function computeTechnicalScores(
  candidats: CandidatForSynthesis[],
  criteria: AN01Criterion[],
  notations: DQENotationsMap,
  poidsTechnique: number
): Record<string, number> {
  const totalBareme = criteria.reduce((s, c) => s + (c.base_points || 0), 0);
  if (totalBareme <= 0) {
    return Object.fromEntries(candidats.map(c => [c.id, 0]));
  }
  const scores: Record<string, number> = {};
  for (const cand of candidats) {
    let raw = 0;
    for (const crit of criteria) {
      const n = notations[cand.id]?.[crit.id];
      const note = typeof n?.score === 'number' ? n.score : 0;
      raw += (note / 4) * (crit.base_points || 0);
    }
    scores[cand.id] = round2((raw / totalBareme) * poidsTechnique);
  }
  return scores;
}

/** Attribue les rangs à partir d'un tableau de [id, score] trié par score décroissant */
function computeRanks(scores: Record<string, number>): Record<string, number> {
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const ranks: Record<string, number> = {};
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i][1] < sorted[i - 1][1]) rank = i + 1;
    ranks[sorted[i][0]] = rank;
  }
  return ranks;
}

/**
 * Calcule la synthèse complète pour un lot.
 * Retourne un objet DQESynthesisLot avec classements, winner et gains.
 */
export function computeDQESynthesisForLot(
  candidats: CandidatForSynthesis[],
  config: DQETechniqueConfig,
  notations: DQENotationsMap,
  lotMeta: { analyse_id: string; numero_lot: number; nom_lot: string }
): DQESynthesisLot {
  const { poids_financier, poids_technique, criteria } = config;

  const finScores = computeFinancialScores(candidats, poids_financier);
  const techScores = computeTechnicalScores(candidats, criteria, notations, poids_technique);

  const finalScores: Record<string, number> = {};
  for (const c of candidats) {
    finalScores[c.id] = round2((finScores[c.id] || 0) + (techScores[c.id] || 0));
  }

  const rangsFinancier = computeRanks(finScores);
  const rangsTechnique = computeRanks(techScores);
  const rangsFinal = computeRanks(finalScores);

  const resultCandidats: DQESynthesisCandidat[] = candidats.map(c => ({
    candidat_id: c.id,
    nom_candidat: c.name,
    total_ht: c.totalHT,
    score_financier: finScores[c.id] ?? 0,
    score_technique: techScores[c.id] ?? 0,
    score_final: finalScores[c.id] ?? 0,
    rang_financier: rangsFinancier[c.id] ?? 0,
    rang_technique: rangsTechnique[c.id] ?? 0,
    rang_final: rangsFinal[c.id] ?? 0,
  }));

  // Trier par rang final
  resultCandidats.sort((a, b) => a.rang_final - b.rang_final);

  const winner = resultCandidats[0] ?? null;
  const totauxHT = candidats.filter(c => c.totalHT > 0).map(c => c.totalHT);
  const moyenneHT = totauxHT.length > 0
    ? round2(totauxHT.reduce((s, v) => s + v, 0) / totauxHT.length)
    : 0;
  const gainHT = winner ? round2(moyenneHT - winner.total_ht) : 0;
  const gainPct = moyenneHT > 0 && gainHT > 0
    ? round2((gainHT / moyenneHT) * 100)
    : 0;

  return {
    analyse_id: lotMeta.analyse_id,
    numero_lot: lotMeta.numero_lot,
    nom_lot: lotMeta.nom_lot,
    poids_financier,
    poids_technique,
    candidats: resultCandidats,
    moyenne_ht: moyenneHT,
    winner,
    gain_ht: gainHT,
    gain_pct: gainPct,
  };
}
