/**
 * Étape 5 : Critères techniques et grille de notation (0-4)
 * Charge le questionnaire technique du DCE pour le lot concerné (critères / sous-critères / questions)
 * et affiche une grille : note (0-4) + commentaire par candidat.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui';
import { Plus, Trash2, Download, Maximize2, ArrowLeft } from 'lucide-react';
import type { AN01Lot, AN01Criterion } from '../../types/saisie';
import { createDefaultCriterion, NOTATION_SCALE } from '../../types/saisie';
import {
  loadTechnicalQuestionnaireForLot,
  mapQTCriteresToAN01Criteria,
} from '../../utils/loadTechnicalQuestionnaireForLot';

interface An01StepTechniqueProps {
  lots: AN01Lot[];
  /** Numéro de consultation (5 chiffres) pour charger le QT DCE du lot */
  consultationNumber?: string;
  onChange: (lots: AN01Lot[]) => void;
  onBack: () => void;
  onNext: () => void;
}

const parseLotNumber = (lotNumber: string): number => {
  const n = parseInt(String(lotNumber || '1').replace(/^0+/, '') || '1', 10);
  return isNaN(n) ? 1 : Math.max(1, n);
};

const An01StepTechnique: React.FC<An01StepTechniqueProps> = ({
  lots,
  consultationNumber,
  onChange,
  onBack,
  onNext,
}) => {
  const [selectedLotIndex, setSelectedLotIndex] = useState(0);
  const [isLoadingQt, setIsLoadingQt] = useState(false);
  const [qtLoadError, setQtLoadError] = useState<string | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const currentLot = lots[selectedLotIndex];

  const updateLot = (lotIndex: number, updater: (lot: AN01Lot) => AN01Lot) => {
    onChange(lots.map((l, i) => (i === lotIndex ? updater(l) : l)));
  };

  const addCriterion = () => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => ({
      ...lot,
      criteria: [...lot.criteria, createDefaultCriterion()],
    }));
  };

  const removeCriterion = (critIndex: number) => {
    if (!currentLot) return;
    const crit = currentLot.criteria[critIndex];
    updateLot(selectedLotIndex, (lot) => {
      const nextCriteria = lot.criteria.filter((_, i) => i !== critIndex);
      const nextNotations: typeof lot.notations = {};
      for (const [candId, byCrit] of Object.entries(lot.notations)) {
        const rest = { ...byCrit };
        delete rest[crit.id];
        nextNotations[candId] = rest;
      }
      return { ...lot, criteria: nextCriteria, notations: nextNotations };
    });
  };

  const updateCriterion = (critIndex: number, field: keyof AN01Criterion, value: string | number) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => {
      const next = [...lot.criteria];
      next[critIndex] = { ...next[critIndex], [field]: value };
      return { ...lot, criteria: next };
    });
  };

  const setNotation = (candidateId: string, criterionId: string, score: number, comment?: string) => {
    if (!currentLot) return;
    updateLot(selectedLotIndex, (lot) => {
      const byCand = { ...(lot.notations[candidateId] || {}) };
      byCand[criterionId] = { score, comment: comment ?? byCand[criterionId]?.comment };
      return { ...lot, notations: { ...lot.notations, [candidateId]: byCand } };
    });
  };

  const importCriteriaFromDCE = useCallback(async () => {
    if (!currentLot || !consultationNumber?.trim()) return;
    setIsLoadingQt(true);
    setQtLoadError(null);
    const numeroLot = parseLotNumber(currentLot.lot_number);
    try {
      const result = await loadTechnicalQuestionnaireForLot(consultationNumber.trim(), numeroLot);
      if (result?.criteres?.length) {
        const mapped = mapQTCriteresToAN01Criteria(result.criteres);
        onChange(
          lots.map((l, i) =>
            i === selectedLotIndex ? { ...l, criteria: [...l.criteria, ...mapped] } : l
          )
        );
      } else {
        setQtLoadError('Aucun critère trouvé pour ce lot dans le questionnaire technique DCE.');
      }
    } catch (e) {
      setQtLoadError('Impossible de charger le questionnaire technique.');
    } finally {
      setIsLoadingQt(false);
    }
  }, [currentLot, consultationNumber, selectedLotIndex, lots, onChange]);

  useEffect(() => {
    if (!currentLot || !consultationNumber?.trim() || currentLot.criteria.length > 0) return;
    const numeroLot = parseLotNumber(currentLot.lot_number);
    let cancelled = false;
    setIsLoadingQt(true);
    setQtLoadError(null);
    loadTechnicalQuestionnaireForLot(consultationNumber.trim(), numeroLot)
      .then((result) => {
        if (cancelled) return;
        if (result?.criteres?.length) {
          const mapped = mapQTCriteresToAN01Criteria(result.criteres);
          onChange(
            lots.map((l, i) =>
              i === selectedLotIndex ? { ...l, criteria: [...l.criteria, ...mapped] } : l
            )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingQt(false);
      });
    return () => { cancelled = true; };
  }, [consultationNumber, selectedLotIndex, currentLot?.id, currentLot?.lot_number, currentLot?.criteria?.length, lots, onChange]);

  type Row = { type: 'criterion'; code: string; label: string } | { type: 'sub_criterion'; code: string; label: string } | { type: 'question'; crit: typeof currentLot.criteria[0] };
  const rows: Row[] = useMemo(() => {
    if (!currentLot?.criteria?.length) return [];
    const out: Row[] = [];
    let lastCriterionCode: string | undefined;
    let lastSubCriterionCode: string | undefined;
    for (const crit of currentLot.criteria) {
      if (crit.criterion_code != null && crit.criterion_code !== lastCriterionCode) {
        lastCriterionCode = crit.criterion_code;
        lastSubCriterionCode = undefined;
        out.push({ type: 'criterion', code: crit.criterion_code, label: crit.criterion_label ?? `Critère ${crit.criterion_code}` });
      }
      if (crit.sub_criterion_code != null && crit.sub_criterion_code !== lastSubCriterionCode) {
        lastSubCriterionCode = crit.sub_criterion_code;
        out.push({ type: 'sub_criterion', code: crit.sub_criterion_code, label: crit.sub_criterion_label ?? `Sous-critère ${crit.sub_criterion_code}` });
      }
      out.push({ type: 'question', crit });
    }
    return out;
  }, [currentLot?.criteria]);

  const summaryData = useMemo(() => {
    if (!currentLot?.criteria?.length || !currentLot?.candidates?.length) return { byCriterion: [], bySubCriterion: [], total: { basePoints: 0, scores: {} as Record<string, number> } };
    const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
    const byCriterion = new Map<string, { code: string; label: string; basePoints: number; scores: Record<string, number> }>();
    const bySubCriterion = new Map<string, { code: string; label: string; basePoints: number; scores: Record<string, number> }>();
    const totalScores: Record<string, number> = {};
    currentLot.candidates.forEach((c) => { totalScores[c.id] = 0; });
    let totalBase = 0;

    for (const crit of currentLot.criteria) {
      const pts = crit.base_points ?? 0;
      totalBase += pts;
      const scorePerCand: Record<string, number> = {};
      for (const c of currentLot.candidates) {
        const n = currentLot.notations[c.id]?.[crit.id];
        const note = typeof n?.score === 'number' ? n.score : 0;
        const s = (note / 4) * pts;
        scorePerCand[c.id] = (scorePerCand[c.id] ?? 0) + s;
        totalScores[c.id] = (totalScores[c.id] ?? 0) + s;
      }
      if (crit.criterion_code != null) {
        const key = crit.criterion_code;
        const existing = byCriterion.get(key);
        const label = crit.criterion_label ?? `Critère ${key}`;
        if (!existing) {
          byCriterion.set(key, { code: key, label, basePoints: pts, scores: { ...scorePerCand } });
        } else {
          existing.basePoints += pts;
          currentLot.candidates.forEach((c) => { existing.scores[c.id] = (existing.scores[c.id] ?? 0) + (scorePerCand[c.id] ?? 0); });
        }
      }
      if (crit.sub_criterion_code != null) {
        const key = crit.sub_criterion_code;
        const existing = bySubCriterion.get(key);
        const label = crit.sub_criterion_label ?? `Sous-critère ${key}`;
        if (!existing) {
          bySubCriterion.set(key, { code: key, label, basePoints: pts, scores: { ...scorePerCand } });
        } else {
          existing.basePoints += pts;
          currentLot.candidates.forEach((c) => { existing.scores[c.id] = (existing.scores[c.id] ?? 0) + (scorePerCand[c.id] ?? 0); });
        }
      }
    }

    const byCriterionList = Array.from(byCriterion.values()).map((x) => ({ ...x, basePoints: round2(x.basePoints), scores: Object.fromEntries(Object.entries(x.scores).map(([k, v]) => [k, round2(v)])) }));
    const bySubCriterionList = Array.from(bySubCriterion.values()).map((x) => ({ ...x, basePoints: round2(x.basePoints), scores: Object.fromEntries(Object.entries(x.scores).map(([k, v]) => [k, round2(v)])) }));
    const total = { basePoints: round2(totalBase), scores: Object.fromEntries(Object.entries(totalScores).map(([k, v]) => [k, round2(v)])) };
    return { byCriterion: byCriterionList, bySubCriterion: bySubCriterionList, total };
  }, [currentLot?.criteria, currentLot?.candidates, currentLot?.notations]);

  const renderGrid = (fullScreen: boolean) => {
    if (!currentLot || !currentLot.criteria.length || !currentLot.candidates.length) return null;
    const isLarge = fullScreen;
    const cellPad = isLarge ? 'p-3' : 'p-2';
    const textSize = isLarge ? 'text-base' : 'text-sm';
    const commentRows = isLarge ? 4 : 3;
    const commentMinH = isLarge ? 'min-h-[96px]' : 'min-h-[72px]';
    const critColMinW = isLarge ? 'min-w-[280px]' : 'min-w-[220px]';
    const commentColMinW = isLarge ? 'min-w-[320px]' : 'min-w-[280px]';
    return (
      <div className={fullScreen ? 'flex-1 flex flex-col min-h-0 overflow-auto p-4' : 'w-full'}>
        <h3 className={`font-semibold text-gray-700 dark:text-gray-300 mb-2 ${isLarge ? 'text-lg' : 'text-sm'}`}>
          Grille de notation (0-4) et commentaires — Critères / Sous-critères / Questions
        </h3>
        {/* Synthèse des totaux et sous-totaux en haut */}
        <h4 className={`font-medium text-gray-700 dark:text-gray-300 mb-2 ${isLarge ? 'text-base' : 'text-sm'}`}>
          Synthèse des totaux et sous-totaux (par critère, par sous-critère, total)
        </h4>
        <div className="overflow-x-auto rounded-xl border border-emerald-200 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10 mb-4 w-full">
          <table className={`w-full border-collapse min-w-[600px] ${textSize}`}>
            <thead>
              <tr className="bg-emerald-100 dark:bg-emerald-900/30">
                <th className="text-right p-2 w-20 border-b border-r border-emerald-200 dark:border-emerald-700 font-semibold text-gray-700 dark:text-gray-300">Barème</th>
                <th className="text-left p-2 min-w-[200px] border-b border-r border-emerald-200 dark:border-emerald-700 font-semibold text-gray-700 dark:text-gray-300">Désignation</th>
                {currentLot.candidates.map((c) => (
                  <th key={c.id} className="text-center p-2 min-w-[100px] border-b border-emerald-200 dark:border-emerald-700 font-semibold text-gray-700 dark:text-gray-300 last:border-r-0">
                    {c.company_name || '(candidat)'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {summaryData.byCriterion.map((row) => (
                <tr key={`crit-${row.code}`} className="border-b border-emerald-200 dark:border-emerald-700 bg-emerald-50/80 dark:bg-emerald-900/20">
                  <td className="text-right p-2 border-r border-emerald-200 dark:border-emerald-700 tabular-nums font-medium">{row.basePoints}</td>
                  <td className="p-2 border-r border-emerald-200 dark:border-emerald-700 font-semibold text-gray-900 dark:text-white">Critère {row.code} — {row.label}</td>
                  {currentLot.candidates.map((c) => (
                    <td key={c.id} className="text-center p-2 border-r border-emerald-200 dark:border-emerald-700 last:border-r-0 tabular-nums">
                      {row.scores[c.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              {summaryData.bySubCriterion.map((row) => (
                <tr key={`sub-${row.code}`} className="border-b border-emerald-200 dark:border-emerald-700 bg-amber-50/50 dark:bg-amber-900/10">
                  <td className="text-right p-2 pl-4 border-r border-emerald-200 dark:border-emerald-700 tabular-nums">{row.basePoints}</td>
                  <td className="p-2 pl-4 border-r border-emerald-200 dark:border-emerald-700 text-gray-800 dark:text-gray-200">{row.code} — {row.label}</td>
                  {currentLot.candidates.map((c) => (
                    <td key={c.id} className="text-center p-2 border-r border-emerald-200 dark:border-emerald-700 last:border-r-0 tabular-nums">
                      {row.scores[c.id] ?? 0}
                    </td>
                  ))}
                </tr>
              ))}
              <tr className="bg-emerald-100 dark:bg-emerald-900/30 font-semibold">
                <td className="text-right p-2 border-r border-emerald-200 dark:border-emerald-700 tabular-nums">{summaryData.total.basePoints}</td>
                <td className="p-2 border-r border-emerald-200 dark:border-emerald-700 text-gray-900 dark:text-white">Total</td>
                {currentLot.candidates.map((c) => (
                  <td key={c.id} className="text-center p-2 border-r border-emerald-200 dark:border-emerald-700 last:border-r-0 tabular-nums text-gray-900 dark:text-white">
                    {summaryData.total.scores[c.id] ?? 0}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
        <div className={`overflow-x-auto overflow-y-visible rounded-xl border border-gray-200 dark:border-gray-700 w-full ${fullScreen ? 'flex-1 min-h-0' : ''}`}>
          <table className={`w-full border-collapse min-w-[800px] ${textSize}`}>
            <colgroup>
              <col style={{ width: '4rem', minWidth: '4rem' }} />
              <col style={{ minWidth: isLarge ? 280 : 220 }} />
              {currentLot.candidates.map((_c, i) => (
                <React.Fragment key={i}>
                  <col style={{ width: '7rem', minWidth: '7rem' }} />
                  <col style={{ minWidth: isLarge ? 320 : 280 }} />
                </React.Fragment>
              ))}
            </colgroup>
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800">
                <th className={`sticky left-0 z-10 bg-gray-100 dark:bg-gray-800 text-right w-16 border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${cellPad}`}>
                  Barème
                </th>
                <th className={`sticky left-16 z-10 bg-gray-100 dark:bg-gray-800 text-left ${critColMinW} border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] ${cellPad}`}>
                  Critères / Sous-critères / Questions
                </th>
                {currentLot.candidates.map((c) => (
                  <th key={c.id} colSpan={2} className={`text-center border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300 last:border-r-0 ${cellPad}`} title={c.company_name}>
                    {c.company_name || '(candidat)'}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, ri) => {
                if (row.type === 'criterion') {
                  return (
                    <tr key={`crit-${ri}-${row.code}`} className="border-b border-gray-200 dark:border-gray-700 bg-emerald-50 dark:bg-emerald-900/20">
                      <td className={`border-r border-gray-200 dark:border-gray-600 sticky left-0 z-[1] bg-emerald-50 dark:bg-emerald-900/20 ${cellPad}`} />
                      <td className={`border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-900 dark:text-white sticky left-16 z-[1] bg-emerald-50 dark:bg-emerald-900/20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${cellPad}`} colSpan={1 + currentLot.candidates.length * 2}>
                        Critère {row.code} — {row.label}
                      </td>
                    </tr>
                  );
                }
                if (row.type === 'sub_criterion') {
                  return (
                    <tr key={`sub-${ri}-${row.code}`} className="border-b border-gray-200 dark:border-gray-700 bg-amber-50/80 dark:bg-amber-900/20">
                      <td className={`border-r border-gray-200 dark:border-gray-600 sticky left-0 z-[1] bg-amber-50/80 dark:bg-amber-900/20 ${cellPad}`} />
                      <td className={`pl-4 border-r border-gray-200 dark:border-gray-600 font-medium text-gray-800 dark:text-gray-200 sticky left-16 z-[1] bg-amber-50/80 dark:bg-amber-900/20 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${cellPad}`} colSpan={1 + currentLot.candidates.length * 2}>
                        {row.code} — {row.label}
                      </td>
                    </tr>
                  );
                }
                const crit = row.crit;
                return (
                  <tr key={crit.id} className="group border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                    <td className={`text-right border-r border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 tabular-nums align-top sticky left-0 z-[1] bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${cellPad}`}>
                      {crit.base_points}
                    </td>
                    <td className={`pl-6 border-r border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white align-top sticky left-16 z-[1] bg-white dark:bg-gray-900 group-hover:bg-gray-50/50 dark:group-hover:bg-gray-800/30 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.08)] ${cellPad}`}>
                      <span className="font-medium text-gray-700 dark:text-gray-200">{crit.code}</span>
                      {crit.label && (
                        <span className="ml-1 text-gray-600 dark:text-gray-400">{crit.label}</span>
                      )}
                    </td>
                    {currentLot.candidates.map((c) => {
                      const n = currentLot.notations[c.id]?.[crit.id];
                      const score = typeof n?.score === 'number' ? n.score : 0;
                      const comment = n?.comment ?? '';
                      return (
                        <React.Fragment key={c.id}>
                          <td className={`border-r border-gray-200 dark:border-gray-600 align-top w-28 ${cellPad}`}>
                            <select
                              value={score}
                              onChange={(e) => setNotation(c.id, crit.id, parseInt(e.target.value, 10), comment)}
                              className={`w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text-primary)] ${textSize}`}
                            >
                              {NOTATION_SCALE.map((s) => (
                                <option key={s.value} value={s.value}>
                                  {s.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className={`border-r border-gray-200 dark:border-gray-600 align-top last:border-r-0 ${commentColMinW} ${cellPad}`}>
                            <textarea
                              value={comment}
                              onChange={(e) => setNotation(c.id, crit.id, score, e.target.value)}
                              placeholder="Commentaire évaluateur"
                              rows={commentRows}
                              className={`w-full px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text-primary)] resize-y ${textSize} ${commentMinH} ${isLarge ? 'min-w-[300px]' : 'min-w-[260px]'}`}
                            />
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <>
      {isFullScreen && currentLot?.criteria?.length > 0 && currentLot?.candidates?.length > 0 && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
          <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-5 h-5" />} onClick={() => setIsFullScreen(false)}>
              Retour
            </Button>
            <span className="text-base font-semibold text-gray-900 dark:text-white">Grille de notation — Pleine page</span>
          </div>
          {renderGrid(true)}
        </div>
      )}
    <div className="w-full max-w-full space-y-6">
      <div className="flex justify-between pb-2">
        <Button variant="secondary" onClick={onBack}>
          Retour
        </Button>
        <Button variant="primary" onClick={onNext}>
          Voir la synthèse
        </Button>
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">Analyse technique (Qualité)</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Définissez les critères et notez chaque candidat (échelle 0-4). Un commentaire par critère et par candidat est possible.
      </p>

      {lots.length > 1 && (
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Lot à éditer</label>
          <select
            value={selectedLotIndex}
            onChange={(e) => setSelectedLotIndex(parseInt(e.target.value, 10))}
            className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-[var(--border-soft)] bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]"
          >
            {lots.map((lot, i) => (
              <option key={lot.id} value={i}>
                {lot.lot_number} - {lot.lot_name || '(sans nom)'}
              </option>
            ))}
          </select>
        </div>
      )}

      {currentLot && (
        <>
          {consultationNumber?.trim() && (
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                icon={<Download className="w-4 h-4" />}
                onClick={importCriteriaFromDCE}
                disabled={isLoadingQt}
              >
                {isLoadingQt ? 'Chargement...' : 'Charger les critères du DCE pour ce lot'}
              </Button>
              {qtLoadError && (
                <span className="text-sm text-amber-600 dark:text-amber-400">{qtLoadError}</span>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Critères d&apos;évaluation</h3>
            <div className="space-y-2 mb-4">
              {currentLot.criteria.map((crit, ci) => (
                <div key={crit.id} className="flex gap-2 items-center flex-wrap">
                  <input
                    type="text"
                    value={crit.code}
                    onChange={(e) => updateCriterion(ci, 'code', e.target.value)}
                    placeholder="Code (ex: 1.1)"
                    className="w-16 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text-primary)]"
                  />
                  <input
                    type="text"
                    value={crit.label}
                    onChange={(e) => updateCriterion(ci, 'label', e.target.value)}
                    placeholder="Libellé du critère"
                    className="flex-1 min-w-[180px] px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-[var(--color-text-primary)]"
                  />
                  <input
                    type="number"
                    min={0}
                    value={crit.base_points}
                    onChange={(e) => updateCriterion(ci, 'base_points', parseFloat(e.target.value) || 0)}
                    placeholder="Barème"
                    className="w-20 px-2 py-1.5 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-right"
                  />
                  <button
                    type="button"
                    onClick={() => removeCriterion(ci)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="Supprimer le critère"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" icon={<Plus className="w-4 h-4" />} onClick={addCriterion}>
              Ajouter un critère
            </Button>
          </div>

          {currentLot.criteria.length > 0 && currentLot.candidates.length > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm text-gray-600 dark:text-gray-400" />
                <Button variant="outline" size="sm" icon={<Maximize2 className="w-4 h-4" />} onClick={() => setIsFullScreen(true)}>
                  Ouvrir en pleine page
                </Button>
              </div>
              {renderGrid(false)}
            </>
          )}
        </>
      )}
    </div>
    </>
  );
};

export default An01StepTechnique;
