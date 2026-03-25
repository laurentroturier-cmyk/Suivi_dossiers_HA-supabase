/**
 * Partie 2 — Analyse technique des offres DQE
 *
 * Charge les critères du questionnaire technique DCE pour le lot,
 * puis permet de noter chaque candidat sur chaque critère (échelle 0-4).
 * Persistance en temps réel via Supabase.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Loader2, AlertCircle, RefreshCw, Save, CheckCircle, Info, MessageSquare, Download, Upload } from 'lucide-react';
import * as XLSX from 'xlsx';
import type { AN01Criterion } from '../../an01/types/saisie';
import { NOTATION_SCALE } from '../../an01/types/saisie';
import {
  loadTechnicalQuestionnaireForLot,
  mapQTCriteresToAN01Criteria,
} from '../../an01/utils/loadTechnicalQuestionnaireForLot';
import { AnalyseOffresDQETechniqueService } from '../services/analyseOffresDQETechniqueService';
import type { DQENotationsMap } from '../types/technicalAnalysis';
import type { LotConfiguration } from '../../dce-complet/types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidatRef {
  id: string;
  name: string;
  totalHT: number;
}

interface AnalyseOffresDQETechniqueProps {
  numeroProcedure: string;
  selectedLotNum: number;
  candidats: CandidatRef[];
  analyseId: string | null;
  lotsConfig: LotConfiguration[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });
const formatHT = (v: number) => (v > 0 ? fmt.format(v) : '—');

const DEBOUNCE_MS = 600;

type GridRow =
  | { type: 'criterion'; code: string; label: string }
  | { type: 'sub_criterion'; code: string; label: string }
  | { type: 'question'; crit: AN01Criterion };

function buildRows(criteria: AN01Criterion[]): GridRow[] {
  const out: GridRow[] = [];
  let lastCritCode: string | undefined;
  let lastSubCode: string | undefined;
  for (const crit of criteria) {
    if (crit.criterion_code != null && crit.criterion_code !== lastCritCode) {
      lastCritCode = crit.criterion_code;
      lastSubCode = undefined;
      out.push({
        type: 'criterion',
        code: crit.criterion_code,
        label: crit.criterion_label ?? `Critère ${crit.criterion_code}`,
      });
    }
    if (crit.sub_criterion_code != null && crit.sub_criterion_code !== lastSubCode) {
      lastSubCode = crit.sub_criterion_code;
      out.push({
        type: 'sub_criterion',
        code: crit.sub_criterion_code,
        label: crit.sub_criterion_label ?? `Sous-critère ${crit.sub_criterion_code}`,
      });
    }
    out.push({ type: 'question', crit });
  }
  return out;
}

// ─── Composant ────────────────────────────────────────────────────────────────

export function AnalyseOffresDQETechnique({
  numeroProcedure,
  selectedLotNum,
  candidats,
  analyseId,
  lotsConfig,
}: AnalyseOffresDQETechniqueProps) {
  // Config (critères + pondérations)
  const [criteria, setCriteria] = useState<AN01Criterion[]>([]);
  const [poidsFinancier, setPoidsFinancier] = useState(60);
  const [poidsTechnique, setPoidsTechnique] = useState(40);
  // Notations
  const [notations, setNotations] = useState<DQENotationsMap>({});
  // UI state
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);
  const [isLoadingQt, setIsLoadingQt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qtError, setQtError] = useState<string | null>(null);
  // expandedComments : clé = `${candidatId}__${critereId}` — toggle par cellule individuelle
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xlsxImportRef = useRef<HTMLInputElement>(null);
  const notationsRef = useRef<DQENotationsMap>({});
  notationsRef.current = notations;

  const lotName = useMemo(
    () => lotsConfig.find(l => parseInt(l.numero, 10) === selectedLotNum)?.intitule ?? `Lot ${selectedLotNum}`,
    [lotsConfig, selectedLotNum]
  );

  // ── Chargement initial ────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    if (analyseId) {
      // Avec analyseId : charger config + notations depuis Supabase
      setIsLoadingConfig(true);
      setError(null);
      Promise.all([
        AnalyseOffresDQETechniqueService.getOrCreateConfig(analyseId),
        AnalyseOffresDQETechniqueService.loadNotations(analyseId),
      ]).then(([config, loadedNotations]) => {
        if (cancelled) return;
        if (config) {
          setCriteria(config.criteria);
          setPoidsFinancier(config.poids_financier);
          setPoidsTechnique(config.poids_technique);
          if (config.criteria.length === 0) {
            autoImportFromDCE(analyseId, config.poids_financier, config.poids_technique);
          }
        } else {
          setError('Impossible de charger la configuration technique.');
        }
        setNotations(loadedNotations);
      }).finally(() => {
        if (!cancelled) setIsLoadingConfig(false);
      });
    } else {
      // Sans analyseId : tenter import auto depuis DCE directement
      setIsLoadingConfig(false);
      if (numeroProcedure?.trim()) {
        setIsLoadingQt(true);
        loadTechnicalQuestionnaireForLot(numeroProcedure.trim(), selectedLotNum).then(result => {
          if (cancelled) return;
          if (result?.criteres?.length) {
            setCriteria(mapQTCriteresToAN01Criteria(result.criteres));
          }
        }).finally(() => {
          if (!cancelled) setIsLoadingQt(false);
        });
      }
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyseId]);

  // ── Import automatique depuis le DCE ──────────────────────────────────────

  const autoImportFromDCE = useCallback(async (
    aid: string,
    pfin: number,
    ptech: number
  ) => {
    if (!numeroProcedure?.trim()) return;
    setIsLoadingQt(true);
    setQtError(null);
    try {
      const result = await loadTechnicalQuestionnaireForLot(numeroProcedure.trim(), selectedLotNum);
      if (result?.criteres?.length) {
        const mapped = mapQTCriteresToAN01Criteria(result.criteres);
        setCriteria(mapped);
        // Sauvegarde immédiate pour stabiliser les IDs
        await AnalyseOffresDQETechniqueService.saveConfig(aid, pfin, ptech, mapped);
      } else {
        setQtError('Aucun critère trouvé dans le questionnaire technique DCE pour ce lot. Vous pouvez en saisir manuellement.');
      }
    } catch {
      setQtError('Erreur lors du chargement du questionnaire technique DCE.');
    } finally {
      setIsLoadingQt(false);
    }
  }, [numeroProcedure, selectedLotNum]);

  const handleManualImportFromDCE = useCallback(async () => {
    if (!numeroProcedure?.trim()) return;
    setIsLoadingQt(true);
    setQtError(null);
    try {
      const result = await loadTechnicalQuestionnaireForLot(numeroProcedure.trim(), selectedLotNum);
      if (result?.criteres?.length) {
        const mapped = mapQTCriteresToAN01Criteria(result.criteres);
        setCriteria(mapped);
        // Sauvegarde uniquement si analyseId disponible
        if (analyseId) {
          await AnalyseOffresDQETechniqueService.saveConfig(analyseId, poidsFinancier, poidsTechnique, mapped);
          setSaveSuccess(true);
          setTimeout(() => setSaveSuccess(false), 3000);
        }
      } else {
        setQtError('Aucun critère trouvé dans le questionnaire technique DCE pour ce lot.');
      }
    } catch {
      setQtError('Erreur lors du chargement du questionnaire technique DCE.');
    } finally {
      setIsLoadingQt(false);
    }
  }, [analyseId, numeroProcedure, selectedLotNum, poidsFinancier, poidsTechnique]);

  // ── Pondérations ──────────────────────────────────────────────────────────

  const handlePoidsFinancierChange = (val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setPoidsFinancier(clamped);
    setPoidsTechnique(100 - clamped);
  };

  // ── Notation ──────────────────────────────────────────────────────────────

  const handleScoreChange = useCallback((
    candidatId: string,
    critereId: string,
    score: number,
    commentaire?: string
  ) => {
    setNotations(prev => {
      const byCand = { ...(prev[candidatId] ?? {}) };
      byCand[critereId] = {
        score,
        commentaire: commentaire ?? byCand[critereId]?.commentaire,
      };
      return { ...prev, [candidatId]: byCand };
    });

    // Auto-save debounced
    if (!analyseId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await AnalyseOffresDQETechniqueService.upsertNotation({
        analyse_id: analyseId,
        candidat_id: candidatId,
        critere_id: critereId,
        score,
        commentaire: commentaire ?? notationsRef.current[candidatId]?.[critereId]?.commentaire,
      });
    }, DEBOUNCE_MS);
  }, [analyseId]);

  const handleCommentChange = useCallback((
    candidatId: string,
    critereId: string,
    commentaire: string
  ) => {
    setNotations(prev => {
      const byCand = { ...(prev[candidatId] ?? {}) };
      const existing = byCand[critereId] ?? { score: 0 };
      byCand[critereId] = { ...existing, commentaire };
      return { ...prev, [candidatId]: byCand };
    });

    if (!analyseId) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const score = notationsRef.current[candidatId]?.[critereId]?.score ?? 0;
      await AnalyseOffresDQETechniqueService.upsertNotation({
        analyse_id: analyseId,
        candidat_id: candidatId,
        critere_id: critereId,
        score,
        commentaire,
      });
    }, DEBOUNCE_MS);
  }, [analyseId]);

  // ── Sauvegarde manuelle ───────────────────────────────────────────────────

  const handleSaveAll = useCallback(async () => {
    if (!analyseId) return;
    setIsSaving(true);
    const [ok1, ok2] = await Promise.all([
      AnalyseOffresDQETechniqueService.saveConfig(analyseId, poidsFinancier, poidsTechnique, criteria),
      AnalyseOffresDQETechniqueService.saveAllNotations(analyseId, notations),
    ]);
    setIsSaving(false);
    if (ok1 && ok2) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } else {
      setError('Erreur lors de la sauvegarde.');
    }
  }, [analyseId, poidsFinancier, poidsTechnique, criteria, notations]);

  // ── Grille ────────────────────────────────────────────────────────────────

  const gridRows = useMemo(() => buildRows(criteria), [criteria]);

  const totalBareme = useMemo(
    () => criteria.reduce((s, c) => s + (c.base_points || 0), 0),
    [criteria]
  );

  // ── Export Excel template ─────────────────────────────────────────────────

  const exportExcelTemplate = useCallback(() => {
    const wb = XLSX.utils.book_new();

    // Construire les headers
    const headers = ['Réf', 'Intitulé', 'Pts max'];
    candidats.forEach(c => {
      headers.push(`${c.name} — Note (0-4)`);
      headers.push(`${c.name} — Commentaire`);
    });

    const rows: (string | number)[][] = [headers];

    // Parcourir les critères
    for (const row of gridRows) {
      if (row.type === 'criterion') {
        rows.push([row.code, row.label, '', ...candidats.flatMap(() => ['', ''])]);
      } else if (row.type === 'sub_criterion') {
        rows.push(['', row.label, '', ...candidats.flatMap(() => ['', ''])]);
      } else if (row.type === 'question') {
        const c = row.crit;
        const dataRow: (string | number)[] = [
          c.code || '',
          c.label,
          c.base_points || 0,
        ];
        candidats.forEach(cand => {
          dataRow.push(notations[cand.id]?.[c.id]?.score ?? '');
          dataRow.push(notations[cand.id]?.[c.id]?.commentaire ?? '');
        });
        rows.push(dataRow);
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Largeurs colonnes
    ws['!cols'] = [
      { wch: 10 }, { wch: 50 }, { wch: 10 },
      ...candidats.flatMap(() => [{ wch: 18 }, { wch: 35 }]),
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Analyse technique');
    XLSX.writeFile(wb, `AnalyseTech_Lot${selectedLotNum}_${numeroProcedure.slice(0, 5)}.xlsx`);
  }, [gridRows, candidats, notations, selectedLotNum, numeroProcedure]);

  // ── Import Excel template ─────────────────────────────────────────────────

  const importExcelTemplate = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target!.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json<(string | number)[]>(ws, { header: 1 }) as (string | number)[][];

        if (rows.length < 2) return;

        // Row 0 = headers — extraire les candidats (groupes de 2 colonnes à partir de la col 3)
        const newNotations: DQENotationsMap = { ...notations };

        // Pour chaque ligne de question (celles avec une référence)
        for (let ri = 1; ri < rows.length; ri++) {
          const row = rows[ri];
          const ref = String(row[0] || '').trim();
          if (!ref) continue; // ligne critère/sous-critère, pas de ref → skip

          // Trouver le critère correspondant
          const crit = criteria.find(c => (c.code || '') === ref);
          if (!crit) continue;

          // Colonnes: 0=ref, 1=intitulé, 2=pts, puis 3=note1, 4=comm1, 5=note2, 6=comm2...
          candidats.forEach((cand, ci) => {
            const noteVal = row[3 + ci * 2];
            const commVal = row[4 + ci * 2];
            const score = typeof noteVal === 'number' ? Math.max(0, Math.min(4, Math.round(noteVal))) : 0;
            const commentaire = typeof commVal === 'string' ? commVal : '';

            if (!newNotations[cand.id]) newNotations[cand.id] = {};
            newNotations[cand.id][crit.id] = { score, commentaire };
          });
        }

        setNotations(newNotations);
        // Auto-save si analyseId disponible
        if (analyseId) {
          AnalyseOffresDQETechniqueService.saveAllNotations(analyseId, newNotations);
        }
      } catch {
        setError('Erreur lors de la lecture du fichier Excel.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [criteria, candidats, notations, analyseId]);

  // ── Toggle commentaire par cellule (candidatId__critereId) ───────────────

  const toggleComment = (candidatId: string, critereId: string) => {
    const key = `${candidatId}__${critereId}`;
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const isCellCommentExpanded = (candidatId: string, critereId: string) =>
    expandedComments.has(`${candidatId}__${critereId}`);

  // ─── Rendu ────────────────────────────────────────────────────────────────


  return (
    <div className="space-y-6">

      {/* ── En-tête ── */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl p-4 border border-indigo-200 dark:border-indigo-700">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-indigo-800 dark:text-indigo-300 mb-1">
              Partie 2 — Analyse technique
            </h2>
            <p className="text-sm text-indigo-600 dark:text-indigo-400">
              Lot {selectedLotNum} — {lotName} · {candidats.length} candidat{candidats.length > 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <input
              ref={xlsxImportRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={importExcelTemplate}
            />
            <button
              onClick={exportExcelTemplate}
              disabled={criteria.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-indigo-700 bg-white border border-indigo-300 rounded-lg hover:bg-indigo-50 disabled:opacity-40"
              title="Exporter le template Excel (notes + commentaires)"
            >
              <Download className="w-3.5 h-3.5" />
              Template Excel
            </button>
            <button
              onClick={() => xlsxImportRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-700"
              title="Importer un template Excel pré-rempli"
            >
              <Upload className="w-3.5 h-3.5" />
              Importer Excel
            </button>
          </div>
        </div>
      </div>

      {!analyseId && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-300 text-sm">
          <Info className="w-4 h-4 flex-shrink-0" />
          Sans analyse financière (Partie 1), la sauvegarde des notes ne sera pas disponible.
        </div>
      )}

      {candidats.length === 0 && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg text-blue-700 dark:text-blue-300 text-sm">
          <Info className="w-4 h-4 flex-shrink-0" />
          Aucun candidat chargé — vous pouvez consulter et exporter le template QT, mais la notation nécessite d'importer les offres DQE en Partie 1.
        </div>
      )}

      {/* ── Erreurs ── */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">✕</button>
        </div>
      )}

      {/* ── Loading config ── */}
      {isLoadingConfig && (
        <div className="flex items-center gap-2 text-gray-500 text-sm py-4">
          <Loader2 className="w-4 h-4 animate-spin" />
          Chargement de la configuration…
        </div>
      )}

      {!isLoadingConfig && (
        <>
          {/* ── Pondérations ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 text-sm uppercase tracking-wide">
              Pondérations (financier + technique = 100 %)
            </h3>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-36">Poids financier (%)</label>
                <input
                  type="number"
                  min={0} max={100}
                  value={poidsFinancier}
                  onChange={e => handlePoidsFinancierChange(parseInt(e.target.value) || 0)}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-36">Poids technique (%)</label>
                <input
                  type="number"
                  min={0} max={100}
                  value={poidsTechnique}
                  onChange={e => handlePoidsFinancierChange(100 - (parseInt(e.target.value) || 0))}
                  className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-center text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              {poidsFinancier + poidsTechnique !== 100 && (
                <span className="text-amber-600 dark:text-amber-400 text-xs font-medium">
                  ⚠ La somme doit être égale à 100 %
                </span>
              )}
            </div>
          </div>

          {/* ── Section critères ── */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                Critères techniques — Barème total : {totalBareme} pts
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={handleManualImportFromDCE}
                  disabled={isLoadingQt}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  {isLoadingQt
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <RefreshCw className="w-3.5 h-3.5" />}
                  Importer depuis le DCE
                </button>
              </div>
            </div>

            {qtError && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg text-amber-700 dark:text-amber-300 text-xs mb-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                {qtError}
              </div>
            )}

            {isLoadingQt && (
              <div className="flex items-center gap-2 text-gray-500 text-sm py-3">
                <Loader2 className="w-4 h-4 animate-spin" />
                Chargement du questionnaire technique DCE…
              </div>
            )}

            {!isLoadingQt && criteria.length === 0 && (
              <div className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                Aucun critère chargé. Cliquez sur "Importer depuis le DCE" ou configurez un questionnaire technique dans le module DCE.
              </div>
            )}

            {!isLoadingQt && criteria.length > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                {criteria.length} critère{criteria.length > 1 ? 's' : ''} chargé{criteria.length > 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* ── Grille de notation ── */}
          {criteria.length > 0 && candidats.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300 text-sm uppercase tracking-wide">
                  Grille de notation (0-4)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  La sauvegarde est automatique. Cliquez sur <MessageSquare className="inline w-3.5 h-3.5 mx-0.5 align-text-bottom" /> pour saisir ou voir le commentaire de chaque note.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wide">
                      <th className="text-left p-3 min-w-[280px] border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                        Critère / Question
                      </th>
                      <th className="text-right p-3 w-20 border-b border-r border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                        Barème
                      </th>
                      {candidats.map(c => (
                        <th key={c.id} className="text-center p-3 min-w-[140px] border-b border-gray-200 dark:border-gray-600 font-semibold text-gray-700 dark:text-gray-300">
                          <div>{c.name}</div>
                          <div className="text-gray-400 dark:text-gray-500 font-normal normal-case">
                            {formatHT(c.totalHT)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map((row, idx) => {
                      if (row.type === 'criterion') {
                        return (
                          <tr key={`crit-${row.code}-${idx}`} className="bg-indigo-50 dark:bg-indigo-900/20">
                            <td colSpan={2 + candidats.length} className="px-3 py-2 font-bold text-indigo-800 dark:text-indigo-300 text-xs uppercase tracking-wide border-b border-indigo-200 dark:border-indigo-700">
                              Critère {row.code} — {row.label}
                            </td>
                          </tr>
                        );
                      }
                      if (row.type === 'sub_criterion') {
                        return (
                          <tr key={`sub-${row.code}-${idx}`} className="bg-purple-50/50 dark:bg-purple-900/10">
                            <td colSpan={2 + candidats.length} className="px-4 py-1.5 font-semibold text-purple-700 dark:text-purple-300 text-xs border-b border-purple-100 dark:border-purple-900/40">
                              {row.code} — {row.label}
                            </td>
                          </tr>
                        );
                      }
                      // type === 'question'
                      const { crit } = row;
                      return (
                        <tr key={`q-${crit.id}`} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors align-top">
                          {/* Libellé du critère */}
                          <td className="px-4 py-2 text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                            <span className="text-xs leading-relaxed">
                              <span className="font-medium text-gray-500 dark:text-gray-400 mr-1">{crit.code}</span>
                              {crit.label}
                            </span>
                          </td>
                          {/* Barème */}
                          <td className="text-right px-3 py-2 tabular-nums text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 whitespace-nowrap">
                            {crit.base_points || 0}
                          </td>
                          {/* Cellule par candidat : select + bouton commentaire + textarea */}
                          {candidats.map(c => {
                            const val = notations[c.id]?.[crit.id];
                            const score = val?.score ?? 0;
                            const commentaire = val?.commentaire ?? '';
                            const hasComment = commentaire.trim().length > 0;
                            const showCommentInput = isCellCommentExpanded(c.id, crit.id);
                            return (
                              <td key={c.id} className="px-2 py-2 border-r border-gray-100 dark:border-gray-700 last:border-r-0 min-w-[160px]">
                                {/* Score */}
                                <select
                                  value={score}
                                  onChange={e => handleScoreChange(c.id, crit.id, parseInt(e.target.value))}
                                  className="w-full text-xs px-1 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center cursor-pointer"
                                  title={NOTATION_SCALE.find(s => s.value === score)?.description}
                                >
                                  {NOTATION_SCALE.map(s => (
                                    <option key={s.value} value={s.value}>{s.label}</option>
                                  ))}
                                </select>

                                {/* Bouton commentaire */}
                                <button
                                  onClick={() => toggleComment(c.id, crit.id)}
                                  className={`mt-1 flex items-center gap-1 text-[11px] transition-colors ${
                                    showCommentInput
                                      ? 'text-indigo-600 dark:text-indigo-400'
                                      : hasComment
                                        ? 'text-amber-600 dark:text-amber-400 font-medium'
                                        : 'text-gray-400 dark:text-gray-500 hover:text-indigo-500'
                                  }`}
                                  title={hasComment ? 'Modifier le commentaire' : 'Ajouter un commentaire'}
                                >
                                  <MessageSquare className="w-3 h-3 flex-shrink-0" />
                                  {hasComment && !showCommentInput
                                    ? <span className="truncate max-w-[100px]">{commentaire}</span>
                                    : <span>{showCommentInput ? 'Masquer' : 'Commenter'}</span>
                                  }
                                </button>

                                {/* Textarea de commentaire (toggle par cellule) */}
                                {showCommentInput && (
                                  <textarea
                                    rows={3}
                                    autoFocus
                                    value={commentaire}
                                    onChange={e => handleCommentChange(c.id, crit.id, e.target.value)}
                                    placeholder="Saisir un commentaire justificatif…"
                                    className="mt-1 w-full text-xs p-1.5 border border-indigo-300 dark:border-indigo-600 rounded resize-y bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                  {/* Pied du tableau : totaux par candidat */}
                  <tfoot>
                    <tr className="bg-indigo-100 dark:bg-indigo-900/30 font-bold border-t-2 border-indigo-300 dark:border-indigo-700">
                      <td className="px-3 py-3 text-indigo-800 dark:text-indigo-200 border-r border-indigo-200 dark:border-indigo-700">
                        Total brut (sur {totalBareme} pts)
                      </td>
                      <td className="text-right px-3 py-3 border-r border-indigo-200 dark:border-indigo-700" />
                      {candidats.map(c => {
                        let raw = 0;
                        for (const crit of criteria) {
                          const n = notations[c.id]?.[crit.id];
                          const note = typeof n?.score === 'number' ? n.score : 0;
                          raw += (note / 4) * (crit.base_points || 0);
                        }
                        const pct = totalBareme > 0 ? Math.round((raw / totalBareme) * 100) : 0;
                        return (
                          <td key={c.id} className="text-center px-2 py-3 tabular-nums text-indigo-800 dark:text-indigo-200 border-r border-indigo-200 dark:border-indigo-700 last:border-r-0">
                            {Math.round(raw * 10) / 10} / {totalBareme}
                            <div className="text-xs font-normal text-indigo-600 dark:text-indigo-400">
                              {pct} %
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* ── Légende ── */}
          {criteria.length > 0 && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Légende des notes</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {NOTATION_SCALE.map(s => (
                  <div key={s.value} className="flex gap-2 text-xs">
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 w-4 flex-shrink-0">{s.value}</span>
                    <span className="text-gray-600 dark:text-gray-400">{s.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Actions ── */}
          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Les notes sont sauvegardées automatiquement. Cliquez sur "Sauvegarder" pour forcer une synchronisation complète.
            </p>
            <button
              onClick={handleSaveAll}
              disabled={isSaving || criteria.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : saveSuccess
                  ? <CheckCircle className="w-4 h-4" />
                  : <Save className="w-4 h-4" />}
              {saveSuccess ? 'Sauvegardé !' : 'Sauvegarder'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
