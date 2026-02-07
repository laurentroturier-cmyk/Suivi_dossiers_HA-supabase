/**
 * Charge les données Analyse des offres DQE (sauvegarde Supabase) pour une procédure
 * et les mappe en structure AN01 : candidats par lot + grille financière (lignes × candidats).
 * Permet de préremplir le projet AN01 avec les données financières et le classement déjà saisis dans le module DQE.
 */

import { AnalyseOffresDQEService } from '@/components/analyse-offres-dqe/services/analyseOffresDQEService';
import type { StoredCandidat, StoredLigneCandidat } from '@/components/analyse-offres-dqe/services/analyseOffresDQEService';
import type { AN01Lot, AN01Candidate, AN01FinancialRow } from '../types/saisie';
import { createDefaultLot } from '../types/saisie';

export interface LoadAN01FromDQEResult {
  success: boolean;
  /** Lots avec candidats et grille financière remplis (lot_number = numero_lot DQE) */
  lots?: AN01Lot[];
  error?: string;
}

/**
 * Construit une grille financière AN01 à partir des lignes de plusieurs candidats DQE.
 * - Lignes = union des designations (avec quantité prise sur le premier candidat qui a cette désignation).
 * - Colonnes = prix unitaire par candidat pour chaque ligne.
 */
function buildFinancialRows(
  candidatsAvecLignes: Array<{ id: string; nom_candidat: string; lignes: StoredLigneCandidat[] }>
): AN01FinancialRow[] {
  if (candidatsAvecLignes.length === 0) return [];

  const rowByKey = new Map<string, { designation: string; quantity: number; prices: Record<string, number> }>();

  for (const cand of candidatsAvecLignes) {
    for (const ligne of cand.lignes || []) {
      const designation = (ligne.designation || '').trim() || ligne.numero || '';
      if (!designation) continue;
      const key = designation.toLowerCase();
      const qty = ligne.quantite ?? 0;
      const pu = ligne.prix_unitaire ?? 0;
      if (!rowByKey.has(key)) {
        rowByKey.set(key, { designation, quantity: qty, prices: {} });
      }
      const row = rowByKey.get(key)!;
      if (row.quantity === 0 && qty !== 0) row.quantity = qty;
      row.prices[cand.id] = pu;
    }
  }

  return Array.from(rowByKey.entries()).map(([_, v], index) => ({
    id: `row-dqe-${Date.now()}-${index}`,
    item_description: v.designation,
    quantity: v.quantity,
    prices: v.prices,
  }));
}

/**
 * Charge les données Analyse offres DQE pour une procédure (5 chiffres) et les retourne
 * sous forme de lots AN01 (candidats + grille financière). Ne modifie pas la meta du projet.
 */
export async function loadAN01FromDQE(numProc5: string): Promise<LoadAN01FromDQEResult> {
  const num = String(numProc5).trim();
  if (num.length !== 5 || !/^\d{5}$/.test(num)) {
    return { success: false, error: 'Numéro de procédure invalide (5 chiffres)' };
  }

  try {
    const hasData = await AnalyseOffresDQEService.hasData(num);
    if (!hasData) {
      return { success: true, lots: [] };
    }

    const candidats = await AnalyseOffresDQEService.loadCandidatsByProcedure(num);
    if (!candidats || candidats.length === 0) {
      return { success: true, lots: [] };
    }

    const candidatsAvecLignes: Array<StoredCandidat & { lignes: StoredLigneCandidat[] }> = [];
    for (const c of candidats) {
      const lignes = await AnalyseOffresDQEService.loadLignesCandidat(c.id);
      candidatsAvecLignes.push({ ...c, lignes });
    }

    const byLot = new Map<number, (StoredCandidat & { lignes: StoredLigneCandidat[] })[]>();
    for (const c of candidatsAvecLignes) {
      const lotNum = c.numero_lot ?? 1;
      if (!byLot.has(lotNum)) byLot.set(lotNum, []);
      byLot.get(lotNum)!.push(c);
    }

    const lots: AN01Lot[] = [];
    const sortedLotNums = Array.from(byLot.keys()).sort((a, b) => a - b);
    for (const lotNum of sortedLotNums) {
      const candidatsLot = byLot.get(lotNum)!;
      const an01Candidates: AN01Candidate[] = candidatsLot.map((c) => ({
        id: c.id,
        company_name: c.nom_candidat || '',
      }));
      const financial_rows = buildFinancialRows(
        candidatsLot.map((c) => ({ id: c.id, nom_candidat: c.nom_candidat, lignes: c.lignes }))
      );
      const baseLot = createDefaultLot();
      lots.push({
        ...baseLot,
        id: `lot-dqe-${Date.now()}-${lotNum}`,
        lot_number: String(lotNum),
        lot_name: `Lot ${lotNum}`,
        candidates: an01Candidates,
        financial_rows,
        criteria: [],
        notations: {},
      });
    }

    return { success: true, lots };
  } catch (err: any) {
    console.error('loadAN01FromDQE:', err);
    return {
      success: false,
      error: err?.message || 'Erreur lors du chargement des données DQE',
    };
  }
}
