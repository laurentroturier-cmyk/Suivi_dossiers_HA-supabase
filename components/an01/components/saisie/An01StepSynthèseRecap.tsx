/**
 * Tableau récapitulatif type AN01 pour l'étape Synthèse (étape 6)
 * En-tête consultation, poids, tableau des offres (classements, montants, critères techniques), calcul des gains.
 */

import React from 'react';
import type { AnalysisData } from '../../types';
import type { AN01ProjectMeta } from '../../types/saisie';
import { formatCurrency } from '@/utils';

interface An01StepSynthèseRecapProps {
  data: AnalysisData;
  meta?: AN01ProjectMeta;
}

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** Affiche un décimal avec toujours 2 chiffres après la virgule (ex. 25,60 au lieu de 25,6). */
const formatDecimal2 = (n: number): string => Number(n).toFixed(2).replace('.', ',');

/** Libellé d’affichage pour un critère technique : évite "Nouvelle question" / vide. */
function isPlaceholderCriterionName(name: string | undefined): boolean {
  const s = (name ?? '').trim().toLowerCase();
  if (!s) return true;
  if (s === 'nouvelle question') return true;
  if (/^nouvelle question\s*\d*$/.test(s)) return true;
  return false;
}

function getCriterionDisplayName(c: { name: string }, index: number): string {
  const name = (c.name ?? '').trim();
  if (!name || name.toLowerCase() === 'nouvelle question') {
    return `Critère technique ${index + 1}`;
  }
  return name;
}

function getRealTechnicalCriteria(criteria: Array<{ name: string }> | undefined): Array<{ name: string }> {
  if (!criteria?.length) return [];
  return criteria.filter((c) => !isPlaceholderCriterionName(c.name));
}

/** Parse TVA "20%" -> 0.2 */
function parseTva(tva: string): number {
  const m = String(tva || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) / 100 : 0.2;
}

function ttcToHt(ttc: number, tva: string): number {
  const rate = parseTva(tva);
  return round2(ttc / (1 + rate));
}

const An01StepSynthèseRecap: React.FC<An01StepSynthèseRecapProps> = ({ data, meta }) => {
  const { lotName, metadata, offers, stats, technicalAnalysis } = data;
  const poidsFin = metadata.poidsFinancier ?? 70;
  const poidsTech = metadata.poidsTechnique ?? 30;
  const validOffers = offers.filter((o) => o.amountTTC > 0);
  const averageTTC = stats.average || 0;
  const averageHT = ttcToHt(averageTTC, metadata.tva || '20%');
  const winner = stats.winner;
  const winnerHT = winner ? ttcToHt(winner.amountTTC, metadata.tva || '20%') : 0;
  const savingHT = winner ? round2(averageHT - winnerHT) : 0;
  const minHT = stats.min > 0 ? ttcToHt(stats.min, metadata.tva || '20%') : 0;
  const maxHT = stats.max > 0 ? ttcToHt(stats.max, metadata.tva || '20%') : 0;

  // Colonnes : uniquement les critères techniques réels (pas "Nouvelle question", etc.)
  const allCriteria = technicalAnalysis?.[0]?.criteria ?? [];
  const realCriteriaWithIndex = allCriteria
    .map((c, idx) => ({ c, idx }))
    .filter(({ c }) => !isPlaceholderCriterionName(c.name));

  return (
    <div className="space-y-6 text-sm">
      {/* En-tête consultation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-600">
        <div className="space-y-1">
          <div className="flex gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Consultation n°</span>
            <span className="text-gray-900 dark:text-white">{metadata.consultation || meta?.consultation_number || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Description</span>
            <span className="text-gray-900 dark:text-white">{metadata.description || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Lot n°</span>
            <span className="text-gray-900 dark:text-white">{lotName}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Acheteur</span>
            <span className="text-gray-900 dark:text-white">{metadata.buyer || '-'}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Demandeur</span>
            <span className="text-gray-900 dark:text-white">{metadata.requester || '-'}</span>
          </div>
          {meta && (
            <>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Valideur technique</span>
                <span className="text-gray-900 dark:text-white">{meta.technical_validator || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Délai maxi décision</span>
                <span className="text-gray-900 dark:text-white">{meta.decision_deadline || '-'}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">Nbre fournisseurs sélectionnés</span>
                <span className="text-gray-900 dark:text-white font-medium">{meta.selected_suppliers ?? 1}</span>
              </div>
            </>
          )}
        </div>
        <div className="an01-card-poids flex flex-col gap-2 p-3 rounded-lg bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-600">
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-slate-300">Taux de TVA</span>
            <span className="font-semibold text-right tabular-nums min-w-[4rem] text-gray-900 dark:text-white">{metadata.tva || '20%'}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-slate-300">Poids financier</span>
            <span className="font-semibold text-right tabular-nums min-w-[4rem] text-gray-900 dark:text-white">{poidsFin}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700 dark:text-slate-300">Poids technique</span>
            <span className="font-semibold text-right tabular-nums min-w-[4rem] text-gray-900 dark:text-white">{poidsTech}</span>
          </div>
        </div>
      </div>

      {/* Tableau des offres */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600 font-semibold">Raison sociale</th>
              <th className="text-center p-2 border-b border-l border-gray-200 dark:border-gray-600 font-semibold" colSpan={2}>
                Classement final
              </th>
              <th className="text-center p-2 border-b border-l border-gray-200 dark:border-gray-600 font-semibold" colSpan={2}>
                Critère financier
              </th>
              <th className="text-center p-2 border-b border-l border-gray-200 dark:border-gray-600 font-semibold" colSpan={2}>
                Critère technique
              </th>
              <th className="text-right p-2 border-b border-l border-gray-200 dark:border-gray-600 font-semibold">Montant TTC</th>
              {realCriteriaWithIndex.map(({ c, idx }, i) => {
                const displayName = getCriterionDisplayName(c, i);
                return (
                  <th key={`crit-${idx}-${c.name}`} className="text-right p-2 border-b border-l border-gray-200 dark:border-gray-600 font-semibold" title={displayName}>
                    {displayName.length > 25 ? displayName.slice(0, 22) + '…' : displayName}
                  </th>
                );
              })}
            </tr>
            <tr className="bg-gray-50 dark:bg-slate-700/80 text-gray-600 dark:text-slate-300">
              <th className="p-2 border-b border-gray-200 dark:border-gray-600" />
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center">Rang</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">Note (sur 100)</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center">Rang</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">Note (sur {poidsFin})</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center">Rang</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">Note (sur {poidsTech})</th>
              <th className="p-2 border-b border-l border-gray-200 dark:border-gray-600" />
              {realCriteriaWithIndex.map(({ c, idx }) => (
                <th key={`crit-sub-${idx}-${c.name}`} className="p-2 border-b border-l border-gray-200 dark:border-gray-600" />
              ))}
            </tr>
          </thead>
          <tbody>
            {offers.map((o) => (
              <tr
                key={o.id}
                className={o.rankFinal === 1 ? 'bg-emerald-50 dark:bg-slate-700/80' : ''}
              >
                <td className="p-2 border-b border-gray-200 dark:border-gray-600 font-medium">{o.name}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center tabular-nums">{o.rankFinal}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatDecimal2(round2(o.scoreFinal))}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center tabular-nums">{o.rankFinancial}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatDecimal2(round2(o.scoreFinancial))}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-center tabular-nums">{o.rankTechnical}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatDecimal2(round2(o.scoreTechnical))}</td>
                <td className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right whitespace-nowrap tabular-nums">{formatCurrency(o.amountTTC)}</td>
                {realCriteriaWithIndex.map(({ idx }) => {
                  const candCriteria = technicalAnalysis?.find((t) => t.candidateName === o.name)?.criteria;
                  const c = candCriteria?.[idx];
                  return (
                    <td key={`cell-${o.id}-${idx}`} className="p-2 border-b border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">
                      {c != null && typeof c.score === 'number' ? formatDecimal2(round2(c.score)) : c != null ? String(c.score) : '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Calcul des gains */}
      <div className="rounded-xl border-2 border-emerald-200 dark:border-emerald-700 overflow-hidden">
        <div className="bg-emerald-600 text-white px-4 py-2 font-bold">Calcul des gains</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className="text-left p-2 border-b border-gray-200 dark:border-gray-600">Désignation</th>
                <th className="text-right p-2 border-b border-l border-gray-200 dark:border-gray-600 tabular-nums">Montant HT</th>
                <th className="text-right p-2 border-b border-l border-gray-200 dark:border-gray-600 tabular-nums">Montant TTC</th>
                <th className="text-right p-2 border-b border-l border-gray-200 dark:border-gray-600 tabular-nums">Écart à la moyenne</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2 font-medium">Moyenne des offres</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(averageHT)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(averageTTC)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">-</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-slate-700/80">
                <td className="p-2 font-medium">Offre minimum</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(minHT)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(stats.min)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums text-red-600 dark:text-red-400">
                  {averageTTC > 0 ? formatDecimal2(round2(((stats.min - averageTTC) / averageTTC) * 100)) + '%' : '-'}
                </td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td className="p-2 font-medium">Offre maximum</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(maxHT)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(stats.max)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums text-green-600 dark:text-green-400">
                  {averageTTC > 0 ? '+' + formatDecimal2(round2(((stats.max - averageTTC) / averageTTC) * 100)) + '%' : '-'}
                </td>
              </tr>
              {winner && (
                <tr className="border-b border-gray-200 dark:border-gray-600 bg-emerald-50 dark:bg-slate-700/80">
                  <td className="p-2 font-medium">Offre retenue</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(winnerHT)}</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(winner.amountTTC)}</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums text-red-600 dark:text-red-400">
                    {averageTTC > 0 ? formatDecimal2(round2(((winner.amountTTC - averageTTC) / averageTTC) * 100)) + '%' : '-'}
                  </td>
                </tr>
              )}
              <tr className="border-b border-gray-200 dark:border-gray-600 bg-amber-50 dark:bg-slate-700/80">
                <td className="p-2 font-medium">Valeur de référence</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(averageHT)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(averageTTC)}</td>
                <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">0,00%</td>
              </tr>
              <tr className="border-b border-gray-200 dark:border-gray-600">
                <td colSpan={4} className="p-2 text-xs text-gray-500 dark:text-gray-400 italic">
                  (montant du marché sur la base des tarifs précédents ou moyenne des offres avant négociation si pas de contrat précédent)
                </td>
              </tr>
              {winner && (
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <td className="p-2 font-medium">Gains liés au dossier</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(savingHT)}</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatCurrency(stats.savingAmount)}</td>
                  <td className="p-2 border-l border-gray-200 dark:border-gray-600 text-right tabular-nums">{formatDecimal2(round2(stats.savingPercent))}%</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {winner && (
          <p className="px-4 py-2 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-600">
            Offre retenue : {winner.name}
          </p>
        )}
      </div>
    </div>
  );
};

export default An01StepSynthèseRecap;
