/**
 * Partie 3 — Synthèse des offres DQE
 *
 * Combine les scores financiers (Partie 1, méthode GRAMP) et techniques (Partie 2)
 * pour produire un classement final avec calcul des gains.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, AlertCircle, Info, Trophy, TrendingDown, BarChart3 } from 'lucide-react';
import { AnalyseOffresDQETechniqueService } from '../services/analyseOffresDQETechniqueService';
import { computeDQESynthesisForLot } from '../utils/computeDQESynthesis';
import type { DQESynthesisLot, DQESynthesisCandidat } from '../types/technicalAnalysis';
import type { LotConfiguration } from '../../dce-complet/types';
import type { ProjectData } from '../../../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidatRef {
  id: string;
  name: string;
  totalHT: number;
}

interface AnalyseOffresDQESyntheseProps {
  numeroProcedure: string;
  selectedLotNum: number;
  candidats: CandidatRef[];
  analyseId: string | null;
  lotsConfig: LotConfiguration[];
  procedureInfo: ProjectData | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const fmt2 = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatHT = (v: number) => (v > 0 ? fmt.format(v) : '—');
const formatScore = (v: number) => fmt2.format(v);

const rankLabel = (r: number) => {
  if (r === 1) return '🥇 1er';
  if (r === 2) return '2e';
  if (r === 3) return '3e';
  return `${r}e`;
};

const rankClass = (r: number) => {
  if (r === 1) return 'text-amber-700 dark:text-amber-300 font-bold';
  if (r === 2) return 'text-gray-600 dark:text-gray-300 font-semibold';
  if (r === 3) return 'text-orange-700 dark:text-orange-400';
  return 'text-gray-500 dark:text-gray-400';
};

// ─── Composant ────────────────────────────────────────────────────────────────

export function AnalyseOffresDQESynthese({
  numeroProcedure,
  selectedLotNum,
  candidats,
  analyseId,
  lotsConfig,
  procedureInfo,
}: AnalyseOffresDQESyntheseProps) {
  const [synthesis, setSynthesis] = useState<DQESynthesisLot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lotName = useMemo(
    () => lotsConfig.find(l => parseInt(l.numero, 10) === selectedLotNum)?.intitule ?? `Lot ${selectedLotNum}`,
    [lotsConfig, selectedLotNum]
  );

  // ── Chargement et calcul ──────────────────────────────────────────────────

  useEffect(() => {
    if (!analyseId || candidats.length === 0) {
      setSynthesis(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      AnalyseOffresDQETechniqueService.getOrCreateConfig(analyseId),
      AnalyseOffresDQETechniqueService.loadNotations(analyseId),
    ]).then(([config, notations]) => {
      if (cancelled) return;
      if (!config) {
        setError('Configuration technique introuvable. Configurez d\'abord la Partie 2.');
        return;
      }
      if (config.criteria.length === 0) {
        // Pas de critères : calcul financier seul avec poids ajusté
        const configFinOnly = {
          ...config,
          poids_financier: 100,
          poids_technique: 0,
        };
        const result = computeDQESynthesisForLot(
          candidats,
          configFinOnly,
          notations,
          { analyse_id: analyseId, numero_lot: selectedLotNum, nom_lot: lotName }
        );
        setSynthesis(result);
      } else {
        const result = computeDQESynthesisForLot(
          candidats,
          config,
          notations,
          { analyse_id: analyseId, numero_lot: selectedLotNum, nom_lot: lotName }
        );
        setSynthesis(result);
      }
    }).catch(() => {
      if (!cancelled) setError('Erreur lors du calcul de la synthèse.');
    }).finally(() => {
      if (!cancelled) setIsLoading(false);
    });

    return () => { cancelled = true; };
  }, [analyseId, candidats, selectedLotNum, lotName]);

  // ─── Rendu ────────────────────────────────────────────────────────────────

  if (!analyseId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Info className="w-10 h-10 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Chargez d'abord les offres DQE en <strong>Partie 1</strong> pour accéder à la synthèse.
        </p>
      </div>
    );
  }

  if (candidats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Info className="w-10 h-10 text-gray-400 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">
          Aucun candidat chargé pour ce lot. Importez les offres DQE en Partie 1.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 py-12 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin" />
        <span>Calcul de la synthèse en cours…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl text-red-700 dark:text-red-300 text-sm">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        {error}
      </div>
    );
  }

  if (!synthesis) return null;

  const { candidats: ranked, winner, moyenne_ht, gain_ht, gain_pct, poids_financier, poids_technique } = synthesis;
  const hasTechnique = poids_technique > 0;

  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-700">
        <h2 className="text-lg font-bold text-emerald-800 dark:text-emerald-300 mb-1">
          Partie 3 — Synthèse de l'analyse des offres
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-emerald-700 dark:text-emerald-400 mt-1">
          <span>Procédure : <strong>{numeroProcedure}</strong></span>
          <span>Lot {selectedLotNum} — <strong>{lotName}</strong></span>
          {procedureInfo && <span>Acheteur : <strong>{(procedureInfo as any)['Maitre ouvrage'] ?? (procedureInfo as any).buyer ?? '—'}</strong></span>}
        </div>
        <div className="flex gap-4 mt-2 text-xs text-emerald-600 dark:text-emerald-500">
          <span>Poids financier : <strong>{poids_financier} %</strong></span>
          <span>Poids technique : <strong>{poids_technique} %</strong></span>
          {!hasTechnique && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              ⚠ Aucun critère technique — classement financier uniquement
            </span>
          )}
        </div>
      </div>

      {/* ── Bandeau gagnant ── */}
      {winner && (
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border-2 border-amber-300 dark:border-amber-600 p-4 flex flex-wrap items-center gap-4">
          <Trophy className="w-8 h-8 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Offre retenue (mieux-disant)</div>
            <div className="text-xl font-bold text-amber-800 dark:text-amber-200 truncate">{winner.nom_candidat}</div>
            <div className="text-sm text-amber-700 dark:text-amber-300 mt-0.5">
              Note finale : <strong>{formatScore(winner.score_final)} / 100</strong>
              {winner.total_ht > 0 && <> · Montant HT : <strong>{formatHT(winner.total_ht)}</strong></>}
            </div>
          </div>
          {gain_ht > 0 && (
            <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2 text-green-700 dark:text-green-300">
              <TrendingDown className="w-5 h-5" />
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide">Économie vs moyenne</div>
                <div className="font-bold">{formatHT(gain_ht)} <span className="font-normal text-xs">({formatScore(gain_pct)} %)</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tableau de classement ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">Classement des offres</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide">
                <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 min-w-[180px]">
                  Candidat
                </th>
                <th className="text-center p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                  Rang final
                </th>
                <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 min-w-[100px]">
                  Note finale<br /><span className="font-normal text-gray-400">/ 100</span>
                </th>
                <th className="text-center p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                  Rang financier
                </th>
                <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                  Note fin.<br /><span className="font-normal text-gray-400">/ {poids_financier}</span>
                </th>
                {hasTechnique && (
                  <>
                    <th className="text-center p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                      Rang technique
                    </th>
                    <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                      Note tech.<br /><span className="font-normal text-gray-400">/ {poids_technique}</span>
                    </th>
                  </>
                )}
                <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 min-w-[120px]">
                  Montant HT
                </th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((c, idx) => {
                const isWinner = c.rang_final === 1;
                return (
                  <tr
                    key={c.candidat_id}
                    className={`border-b border-gray-100 dark:border-gray-700 transition-colors ${isWinner ? 'bg-amber-50 dark:bg-amber-900/10' : idx % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-50/50 dark:bg-gray-700/20'}`}
                  >
                    <td className="p-3 font-medium text-gray-900 dark:text-white">
                      {isWinner && <span className="mr-1">🏆</span>}
                      {c.nom_candidat}
                    </td>
                    <td className={`text-center p-3 border-l border-gray-100 dark:border-gray-700 ${rankClass(c.rang_final)}`}>
                      {rankLabel(c.rang_final)}
                    </td>
                    <td className={`text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums font-bold ${isWinner ? 'text-amber-700 dark:text-amber-300' : 'text-gray-800 dark:text-gray-200'}`}>
                      {formatScore(c.score_final)}
                    </td>
                    <td className={`text-center p-3 border-l border-gray-100 dark:border-gray-700 ${rankClass(c.rang_financier)}`}>
                      {rankLabel(c.rang_financier)}
                    </td>
                    <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums text-gray-700 dark:text-gray-300">
                      {formatScore(c.score_financier)}
                    </td>
                    {hasTechnique && (
                      <>
                        <td className={`text-center p-3 border-l border-gray-100 dark:border-gray-700 ${rankClass(c.rang_technique)}`}>
                          {rankLabel(c.rang_technique)}
                        </td>
                        <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums text-gray-700 dark:text-gray-300">
                          {formatScore(c.score_technique)}
                        </td>
                      </>
                    )}
                    <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums text-gray-600 dark:text-gray-400">
                      {formatHT(c.total_ht)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tableau des gains ── */}
      {moyenne_ht > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Calcul des gains</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Comparaison du mieux-disant par rapport à la moyenne des offres reçues
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs">
                  <th className="text-left p-3 border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-600 dark:text-gray-400 w-64">Indicateur</th>
                  <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-600 dark:text-gray-400">Montant HT</th>
                  <th className="text-right p-3 border-b border-l border-gray-200 dark:border-gray-600 font-semibold text-gray-600 dark:text-gray-400">Écart vs moyenne</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-3 text-gray-700 dark:text-gray-300">Moyenne des offres</td>
                  <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums font-medium">{formatHT(moyenne_ht)}</td>
                  <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 text-gray-400">—</td>
                </tr>
                {ranked.map(c => {
                  const ecart = c.total_ht > 0 ? c.total_ht - moyenne_ht : 0;
                  const ecartPct = moyenne_ht > 0 && c.total_ht > 0 ? ((c.total_ht - moyenne_ht) / moyenne_ht * 100) : 0;
                  const isWinner = c.rang_final === 1;
                  return (
                    <tr key={c.candidat_id} className={`border-b border-gray-100 dark:border-gray-700 ${isWinner ? 'bg-amber-50 dark:bg-amber-900/10' : ''}`}>
                      <td className="p-3 text-gray-700 dark:text-gray-300">
                        {isWinner ? '🏆 ' : ''}{c.nom_candidat}
                        {isWinner && <span className="ml-2 text-xs text-amber-600 dark:text-amber-400 font-medium">(retenu)</span>}
                      </td>
                      <td className="text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums font-medium">
                        {formatHT(c.total_ht)}
                      </td>
                      <td className={`text-right p-3 border-l border-gray-100 dark:border-gray-700 tabular-nums text-xs ${ecart < 0 ? 'text-green-600 dark:text-green-400' : ecart > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-400'}`}>
                        {c.total_ht > 0
                          ? `${ecart >= 0 ? '+' : ''}${formatHT(ecart)} (${ecart >= 0 ? '+' : ''}${formatScore(ecartPct)} %)`
                          : '—'}
                      </td>
                    </tr>
                  );
                })}
                {winner && gain_ht > 0 && (
                  <tr className="bg-green-50 dark:bg-green-900/20 font-bold border-t-2 border-green-200 dark:border-green-700">
                    <td className="p-3 text-green-800 dark:text-green-300">Économie générée (vs moyenne)</td>
                    <td className="text-right p-3 border-l border-green-200 dark:border-green-700 tabular-nums text-green-700 dark:text-green-300">
                      {formatHT(gain_ht)}
                    </td>
                    <td className="text-right p-3 border-l border-green-200 dark:border-green-700 text-green-600 dark:text-green-400">
                      {formatScore(gain_pct)} %
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Note méthodologique ── */}
      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-xs text-gray-500 dark:text-gray-400 space-y-1">
        <div className="font-semibold text-gray-600 dark:text-gray-300 mb-1">Méthode de calcul</div>
        <div>
          • <strong>Score financier</strong> = (offre la moins chère / montant HT candidat) × {poids_financier} — méthode GRAMP
        </div>
        {hasTechnique && (
          <div>
            • <strong>Score technique</strong> = (somme des notes pondérées sur barème) / barème total × {poids_technique}
          </div>
        )}
        <div>
          • <strong>Score final</strong> = score financier{hasTechnique ? ' + score technique' : ''} (sur 100)
        </div>
        <div>
          • Le candidat mieux-disant est celui avec le score final le plus élevé
        </div>
      </div>
    </div>
  );
}
