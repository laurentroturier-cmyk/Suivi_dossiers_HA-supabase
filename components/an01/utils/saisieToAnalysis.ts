/**
 * Conversion d'un projet AN01 Saisie vers le format AnalysisData (Dashboard)
 */

import type { AN01Project, AN01Lot, AN01Candidate, AN01FinancialRow, AN01Criterion } from '../types/saisie';
import type { AnalysisData, Metadata, Offer, Stats, TechnicalCriterion, CandidateTechnicalAnalysis } from '../types';

const round2 = (num: number): number => Math.round((num + Number.EPSILON) * 100) / 100;

function metaToMetadata(meta: AN01Project['meta'], lotName: string): Metadata {
  return {
    consultation: meta.consultation_number,
    date: new Date().toLocaleDateString('fr-FR'),
    description: meta.description,
    buyer: meta.buyer,
    requester: meta.requester,
    tva: `${Math.round(meta.tva_rate * 100)}%`,
    poidsTechnique: 100 - meta.financial_weight,
    poidsFinancier: meta.financial_weight,
  };
}

/** Montant TTC par candidat pour un lot (somme des lignes financières × quantités × prix) */
function computeAmountsByCandidate(lot: AN01Lot): Record<string, number> {
  const amounts: Record<string, number> = {};
  lot.candidates.forEach(c => { amounts[c.id] = 0; });
  for (const row of lot.financial_rows) {
    const qty = row.quantity || 0;
    for (const [candId, pu] of Object.entries(row.prices || {})) {
      if (!amounts.hasOwnProperty(candId)) amounts[candId] = 0;
      amounts[candId] += qty * (typeof pu === 'number' ? pu : parseFloat(String(pu)) || 0);
    }
  }
  // TTC = HT * (1 + tva) - on n'a pas la TVA par projet ici, on la passera en paramètre
  return amounts;
}

/** Note financière = (min_prix / prix_candidat) * poids_financier */
function financialScores(lot: AN01Lot, financialWeight: number): Record<string, number> {
  const amounts = computeAmountsByCandidate(lot);
  const values = Object.values(amounts).filter(v => v > 0);
  if (values.length === 0) return Object.fromEntries(lot.candidates.map(c => [c.id, 0]));
  const minAmount = Math.min(...values);
  const scores: Record<string, number> = {};
  for (const c of lot.candidates) {
    const amt = amounts[c.id] || 0;
    scores[c.id] = amt > 0 ? round2((minAmount / amt) * financialWeight) : 0;
  }
  return scores;
}

/** Indique si un libellé est un placeholder (question générique), pas un critère technique réel. */
function isPlaceholderCriterionLabel(label: string | undefined): boolean {
  const s = (label ?? '').trim().toLowerCase();
  if (!s) return true;
  if (s === 'nouvelle question') return true;
  if (/^nouvelle question\s*\d*$/.test(s)) return true;
  return false;
}

/** Note technique = somme des (note/4)*base_points par critère, puis normalisée sur le poids technique */
function technicalScores(lot: AN01Lot, technicalWeight: number): Record<string, number> {
  const totalBarème = lot.criteria.reduce((s, c) => s + c.base_points, 0);
  if (totalBarème <= 0) return Object.fromEntries(lot.candidates.map(c => [c.id, 0]));
  const maxTechnicalRaw = totalBarème; // max = 4/4 * totalBarème
  const scores: Record<string, number> = {};
  for (const c of lot.candidates) {
    let raw = 0;
    for (const crit of lot.criteria) {
      const n = lot.notations[c.id]?.[crit.id];
      const note = typeof n?.score === 'number' ? n.score : 0;
      raw += (note / 4) * crit.base_points;
    }
    // Normaliser sur technicalWeight (ex: 40) comme si le max était technicalWeight
    scores[c.id] = round2((raw / maxTechnicalRaw) * technicalWeight);
  }
  return scores;
}

export function projectToAnalysisData(project: AN01Project): { lots: AnalysisData[]; globalMetadata: Record<string, string> } {
  const globalMetadata: Record<string, string> = {
    'N° Consultation': project.meta.consultation_number,
    'Description': project.meta.description,
    'Acheteur': project.meta.buyer,
    'Demandeur': project.meta.requester,
    'TVA': `${Math.round(project.meta.tva_rate * 100)}%`,
    'Poids financier': `${project.meta.financial_weight}%`,
    'Poids technique': `${100 - project.meta.financial_weight}%`,
  };

  const lots: AnalysisData[] = [];
  const financialWeight = project.meta.financial_weight;
  const technicalWeight = 100 - financialWeight;

  for (const lot of project.lots) {
    if (lot.candidates.length === 0) continue;

    const metadata = metaToMetadata(project.meta, lot.lot_name || lot.lot_number);
    const amounts = computeAmountsByCandidate(lot);
    const finScores = financialScores(lot, financialWeight);
    const techScores = technicalScores(lot, technicalWeight);

    const offersData = lot.candidates.map((c, idx) => ({
      id: idx + 1,
      name: c.company_name,
      amountTTC: round2((amounts[c.id] || 0) * (1 + project.meta.tva_rate)),
      scoreFinancial: finScores[c.id] ?? 0,
      scoreTechnical: techScores[c.id] ?? 0,
      scoreFinal: round2((finScores[c.id] ?? 0) + (techScores[c.id] ?? 0)),
    }));

    // Rangs
    const byFinal = [...offersData].sort((a, b) => b.scoreFinal - a.scoreFinal);
    const byFinancial = [...offersData].sort((a, b) => b.scoreFinancial - a.scoreFinancial);
    const byTechnical = [...offersData].sort((a, b) => b.scoreTechnical - a.scoreTechnical);

    const getRank = (arr: typeof byFinal, name: string, key: 'scoreFinal' | 'scoreFinancial' | 'scoreTechnical') => {
      const i = arr.findIndex(o => o.name === name);
      return i >= 0 ? i + 1 : 99;
    };

    const offers: Offer[] = offersData.map(o => ({
      id: o.id,
      name: o.name,
      rankFinal: getRank(byFinal, o.name, 'scoreFinal'),
      scoreFinal: o.scoreFinal,
      rankFinancial: getRank(byFinancial, o.name, 'scoreFinancial'),
      scoreFinancial: o.scoreFinancial,
      rankTechnical: getRank(byTechnical, o.name, 'scoreTechnical'),
      scoreTechnical: o.scoreTechnical,
      amountTTC: o.amountTTC,
    }));

    const validOffers = offers.filter(o => o.amountTTC > 0);
    const total = validOffers.reduce((s, o) => s + o.amountTTC, 0);
    const average = validOffers.length ? round2(total / validOffers.length) : 0;
    const winner = validOffers.find(o => o.rankFinal === 1) || validOffers[0] || null;
    const max = validOffers.length ? Math.max(...validOffers.map(o => o.amountTTC)) : 0;
    const min = validOffers.length ? Math.min(...validOffers.map(o => o.amountTTC)) : 0;
    const stats: Stats = {
      average,
      max: round2(max),
      min: round2(min),
      winner,
      savingAmount: winner ? round2(average - winner.amountTTC) : 0,
      savingPercent: winner && average > 0 ? round2((-1 * (average - winner.amountTTC) / average) * 100) : 0,
    };

    // Uniquement les critères techniques réels (niveau critère, pas les questions "Nouvelle question…")
    const realCriteriaKeys: Array<{ key: string; label: string }> = [];
    const seen = new Set<string>();
    for (const crit of lot.criteria) {
      const code = crit.criterion_code ?? crit.code;
      const label = (crit.criterion_label ?? crit.label ?? '').trim();
      if (!code || seen.has(code)) continue;
      if (isPlaceholderCriterionLabel(label)) continue;
      seen.add(code);
      realCriteriaKeys.push({ key: code, label: label || `Critère ${code}` });
    }

    const technicalAnalysis: CandidateTechnicalAnalysis[] = lot.candidates.map(c => ({
      candidateName: c.company_name,
      criteria: realCriteriaKeys.map(({ key, label }) => {
        let score = 0;
        let maxScore = 0;
        for (const crit of lot.criteria) {
          const critKey = crit.criterion_code ?? crit.code;
          if (critKey !== key) continue;
          const n = lot.notations[c.id]?.[crit.id];
          const note = typeof n?.score === 'number' ? (n.score / 4) * crit.base_points : 0;
          score += note;
          maxScore += crit.base_points ?? 0;
        }
        return {
          name: label,
          score: round2(score),
          maxScore,
          comment: undefined,
        } as TechnicalCriterion;
      }),
    }));

    lots.push({
      lotName: lot.lot_name || lot.lot_number || `Lot ${lot.lot_number}`,
      metadata,
      offers,
      stats,
      technicalAnalysis,
    });
  }

  return { lots, globalMetadata };
}
