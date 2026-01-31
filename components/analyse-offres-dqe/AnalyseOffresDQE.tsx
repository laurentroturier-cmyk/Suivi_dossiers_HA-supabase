// ============================================
// Analyse des offres DQE
// Charge les DQE Excel par lot / par candidat et affiche une analyse comparative
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  BarChart3,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { ProcedureSelector } from '../dce-complet/components/shared/ProcedureSelector';
import { useProcedure } from '../dce-complet/hooks/useProcedureLoader';
import { parseDQEExcelFile, type ParsedDQERow, type ParseDQEResult } from './utils/parseDQEExcel';
import type { ProjectData } from '../../types';
import type { LotConfiguration } from '../dce-complet/types';

interface CandidatDQE {
  id: string;
  name: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  rows: ParsedDQERow[];
}

interface AnalyseOffresDQEProps {
  onClose?: () => void;
}

export function AnalyseOffresDQE({ onClose }: AnalyseOffresDQEProps) {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const [procedureInfo, setProcedureInfo] = useState<ProjectData | null>(null);
  const [lotsConfig, setLotsConfig] = useState<LotConfiguration[]>([]);
  const [selectedLotNum, setSelectedLotNum] = useState<number>(1);
  const [candidatsByLot, setCandidatsByLot] = useState<Record<string, CandidatDQE[]>>({});
  const [loadingDCE, setLoadingDCE] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCandidatName, setNewCandidatName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const procedureResult = useProcedure(numeroProcedure.length === 5 ? numeroProcedure : null);

  useEffect(() => {
    if (procedureResult.isValid && procedureResult.procedure) {
      setProcedureInfo(procedureResult.procedure);
    } else {
      setProcedureInfo(null);
      setLotsConfig([]);
    }
  }, [procedureResult.isValid, procedureResult.procedure]);

  const loadDCE = useCallback(async () => {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    setLoadingDCE(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let query = supabase
        .from('dce')
        .select('configuration_globale')
        .eq('numero_procedure', numeroProcedure);
      if (user?.id) query = query.eq('user_id', user.id);
      const { data: dceRow, error: dceError } = await query.maybeSingle();

      if (dceError) throw dceError;
      const config = (dceRow as any)?.configuration_globale || null;
      const lots = config?.lots || [];
      setLotsConfig(lots);
      if (lots.length > 0 && selectedLotNum > lots.length) {
        setSelectedLotNum(1);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur chargement DCE');
      setLotsConfig([]);
    } finally {
      setLoadingDCE(false);
    }
  }, [numeroProcedure, selectedLotNum]);

  useEffect(() => {
    if (numeroProcedure.length === 5 && procedureResult.isValid) {
      loadDCE();
    } else {
      setLotsConfig([]);
    }
  }, [numeroProcedure, procedureResult.isValid, loadDCE]);

  const totalLots = lotsConfig.length || 1;
  const currentCandidats = candidatsByLot[String(selectedLotNum)] || [];

  const addCandidatFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const name = newCandidatName.trim() || file.name.replace(/\.[^.]+$/, '');
    if (!name) {
      setError('Saisissez un nom de candidat ou utilisez le nom du fichier.');
      return;
    }
    setLoadingFile(true);
    setError(null);
    try {
      const result: ParseDQEResult = await parseDQEExcelFile(file);
      const candidat: CandidatDQE = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        totalHT: result.totalHT,
        totalTVA: result.totalTVA,
        totalTTC: result.totalTTC,
        rows: result.rows,
      };
      setCandidatsByLot((prev) => {
        const list = prev[String(selectedLotNum)] || [];
        return {
          ...prev,
          [String(selectedLotNum)]: [...list, candidat],
        };
      });
      setNewCandidatName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du fichier Excel');
    } finally {
      setLoadingFile(false);
    }
  };

  const removeCandidat = (lotNum: number, candidatId: string) => {
    setCandidatsByLot((prev) => ({
      ...prev,
      [String(lotNum)]: (prev[String(lotNum)] || []).filter((c) => c.id !== candidatId),
    }));
  };

  const getLotName = (num: number) => {
    const lot = lotsConfig.find((l) => parseInt(l.numero, 10) === num || l.numero === String(num));
    return lot?.intitule || `Lot ${num}`;
  };

  const analysisRows = currentCandidats.length > 0 ? currentCandidats[0].rows : [];
  const analysisCandidats = currentCandidats;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#2F5B58] text-white flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Analyse des offres DQE
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Chargez les DQE Excel par lot et par candidat pour comparer les montants
            </p>
          </div>
        </div>

        {/* Recherche procédure */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Numéro de procédure
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <ProcedureSelector
                value={numeroProcedure}
                onChange={setNumeroProcedure}
                onProcedureSelected={() => {}}
              />
            </div>
            {procedureResult.error && (
              <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {procedureResult.error}
              </p>
            )}
            {procedureResult.isValid && procedureInfo && (
              <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                {procedureInfo['Intitulé']}
              </p>
            )}
          </div>
          {loadingDCE && (
            <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              Chargement des lots...
            </div>
          )}
          {error && (
            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}
        </div>

        {!procedureResult.isValid || !numeroProcedure || numeroProcedure.length !== 5 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
            Saisissez un numéro de procédure à 5 chiffres pour charger les lots et commencer l'analyse.
          </div>
        ) : (
          <>
            {/* Sélection du lot */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Lot à analyser
              </h2>
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalLots }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => setSelectedLotNum(num)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedLotNum === num
                        ? 'bg-[#2F5B58] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    Lot {num}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {getLotName(selectedLotNum)}
              </p>
            </div>

            {/* Ajouter un candidat (DQE Excel) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Charger le DQE Excel d'un candidat — Lot {selectedLotNum}
              </h2>
              <div className="flex flex-wrap items-end gap-4">
                <div className="w-64">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nom du candidat
                  </label>
                  <input
                    type="text"
                    value={newCandidatName}
                    onChange={(e) => setNewCandidatName(e.target.value)}
                    placeholder="Ex: Entreprise A"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={addCandidatFromFile}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={loadingFile}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] disabled:opacity-50 transition"
                  >
                    {loadingFile ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {loadingFile ? 'Chargement...' : 'Choisir un fichier DQE Excel'}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Fichiers DQE ou BPU acceptés. Les colonnes seront mappées automatiquement.
              </p>
            </div>

            {/* Liste des candidats chargés pour ce lot */}
            {currentCandidats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Candidats chargés pour le lot {selectedLotNum}
                </h2>
                <ul className="space-y-2">
                  {currentCandidats.map((c) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="w-5 h-5 text-[#2F5B58]" />
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total HT : {c.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          — {c.rows.length} ligne{c.rows.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCandidat(selectedLotNum, c.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tableau d'analyse comparative */}
            {analysisCandidats.length >= 1 && analysisRows.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-x-auto">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Analyse comparative — Lot {selectedLotNum}
                </h2>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-600">
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 w-24">
                        Code
                      </th>
                      <th className="text-left py-2 px-2 font-semibold text-gray-700 dark:text-gray-300 min-w-[200px]">
                        Désignation
                      </th>
                      {analysisCandidats.map((c) => (
                        <th
                          key={c.id}
                          className="text-right py-2 px-2 font-semibold text-[#2F5B58] whitespace-nowrap"
                        >
                          {c.name}
                        </th>
                      ))}
                      {analysisCandidats.length >= 2 && (
                        <>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            Min
                          </th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            Max
                          </th>
                          <th className="text-right py-2 px-2 font-semibold text-gray-700 dark:text-gray-300">
                            Écart
                          </th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {analysisRows.map((row, rowIndex) => {
                      const valuesByCandidat = analysisCandidats.map((c) => {
                        const r = c.rows[rowIndex];
                        return r ? r.montantHT : 0;
                      });
                      const min = valuesByCandidat.length ? Math.min(...valuesByCandidat) : 0;
                      const max = valuesByCandidat.length ? Math.max(...valuesByCandidat) : 0;
                      const ecart = max - min;

                      return (
                        <tr
                          key={row.id}
                          className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                        >
                          <td className="py-1.5 px-2 text-gray-700 dark:text-gray-300 font-mono text-xs">
                            {row.codeArticle || '—'}
                          </td>
                          <td className="py-1.5 px-2 text-gray-900 dark:text-white">
                            {row.designation || '—'}
                          </td>
                          {analysisCandidats.map((c) => {
                            const r = c.rows[rowIndex];
                            const val = r ? r.montantHT : 0;
                            return (
                              <td key={c.id} className="py-1.5 px-2 text-right tabular-nums">
                                {val > 0
                                  ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '—'}
                              </td>
                            );
                          })}
                          {analysisCandidats.length >= 2 && (
                            <>
                              <td className="py-1.5 px-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                {min > 0
                                  ? min.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right tabular-nums text-gray-600 dark:text-gray-400">
                                {max > 0
                                  ? max.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '—'}
                              </td>
                              <td className="py-1.5 px-2 text-right tabular-nums font-medium">
                                {ecart > 0
                                  ? ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : '—'}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-100 dark:bg-gray-700/50 font-semibold">
                      <td className="py-2 px-2" colSpan={2}>
                        Total HT
                      </td>
                      {analysisCandidats.map((c) => (
                        <td key={c.id} className="py-2 px-2 text-right text-[#2F5B58]">
                          {c.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                        </td>
                      ))}
                      {analysisCandidats.length >= 2 && (
                        <>
                          <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                            {Math.min(...analysisCandidats.map((c) => c.totalHT)).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            €
                          </td>
                          <td className="py-2 px-2 text-right text-gray-600 dark:text-gray-400">
                            {Math.max(...analysisCandidats.map((c) => c.totalHT)).toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            €
                          </td>
                          <td className="py-2 px-2 text-right">
                            {(
                              Math.max(...analysisCandidats.map((c) => c.totalHT)) -
                              Math.min(...analysisCandidats.map((c) => c.totalHT))
                            ).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                            €
                          </td>
                        </>
                      )}
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}

            {procedureResult.isValid && totalLots > 0 && currentCandidats.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400">
                Aucun candidat chargé pour ce lot. Ajoutez un fichier DQE Excel ci-dessus.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
