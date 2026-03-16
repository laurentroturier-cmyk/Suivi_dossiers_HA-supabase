// ============================================
// AvenantsList — Vue principale du module
// Liste + accès aux formulaires (Standard + Transfert)
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Plus, FileText, Trash2, Eye, FileDown,
  Loader2, AlertCircle, ClipboardList, ChevronDown, ArrowRight,
} from 'lucide-react';
import type { AvenantData, AvenantTransfertData } from '../types';
import { AvenantForm } from './AvenantForm';
import { AvenantPreview } from './AvenantPreview';
import { AvenantTransfertForm } from './AvenantTransfertForm';
import { AvenantTransfertPreview } from './AvenantTransfertPreview';
import { exportAvenantPdf } from '../utils/avenantPdfExport';
import { exportAvenantTransfertPdf } from '../utils/avenantTransfertPdfExport';
import { supabase } from '../../../lib/supabase';

// ─── Types internes ────────────────────────────────────────────────────────────

type AvenantStandard  = AvenantData         & { _type: 'standard' };
type AvenantTransfert = AvenantTransfertData & { _type: 'transfert' };
type AvenantRow       = AvenantStandard | AvenantTransfert;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMontant(val: number | null | undefined): string {
  if (val === null || val === undefined) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' €HT';
}

function formatDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    const dt = new Date(d);
    if (!isNaN(dt.getTime()))
      return dt.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch { /* ignore */ }
  return d;
}

function StatutBadge({ statut }: { statut: 'brouillon' | 'valide' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      statut === 'valide'
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    }`}>
      {statut === 'valide' ? 'Validé' : 'Brouillon'}
    </span>
  );
}

function TypeBadge({ type }: { type: 'standard' | 'transfert' }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
      type === 'transfert'
        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
        : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
    }`}>
      {type === 'transfert' ? 'Transfert' : 'Standard'}
    </span>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AvenantsListProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'form' | 'formTransfert' | 'preview';

export function AvenantsList({ onBack }: AvenantsListProps) {
  const [rows, setRows]                             = useState<AvenantRow[]>([]);
  const [loading, setLoading]                       = useState(true);
  const [error, setError]                           = useState<string | null>(null);
  const [viewMode, setViewMode]                     = useState<ViewMode>('list');
  const [selected, setSelected]                     = useState<AvenantData | null>(null);
  const [selectedTransfert, setSelectedTransfert]   = useState<AvenantTransfertData | null>(null);
  const [previewData, setPreviewData]               = useState<AvenantData | null>(null);
  const [previewTransfert, setPreviewTransfert]     = useState<AvenantTransfertData | null>(null);
  const [isExporting, setIsExporting]               = useState(false);
  const [deletingId, setDeletingId]                 = useState<string | null>(null);
  const [showNewDropdown, setShowNewDropdown]       = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Ferme le dropdown au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node))
        setShowNewDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Chargement double table ────────────────────────────────────────────────
  const fetchAvenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [r1, r2] = await Promise.all([
        supabase.from('avenants').select('*').order('created_at', { ascending: false }),
        supabase.from('avenants_transfert').select('*').order('created_at', { ascending: false }),
      ]);
      if (r1.error) throw r1.error;
      if (r2.error) throw r2.error;

      const all: AvenantRow[] = [
        ...(r1.data || []).map(a => ({ ...a, _type: 'standard' as const })),
        ...(r2.data || []).map(a => ({ ...a, _type: 'transfert' as const })),
      ].sort((a, b) => new Date((b as any).created_at || 0).getTime() - new Date((a as any).created_at || 0).getTime());

      setRows(all);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des avenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAvenants(); }, [fetchAvenants]);

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (row: AvenantRow) => {
    if (!window.confirm('Supprimer cet avenant ? Cette action est irréversible.')) return;
    const id = (row as any).id;
    setDeletingId(id);
    try {
      const table = row._type === 'transfert' ? 'avenants_transfert' : 'avenants';
      const { error: err } = await supabase.from(table).delete().eq('id', id);
      if (err) throw err;
      setRows(prev => prev.filter(r => (r as any).id !== id));
    } catch (e: any) {
      alert('Erreur lors de la suppression : ' + (e?.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Export PDF depuis la liste ────────────────────────────────────────────
  const handleQuickPdf = async (row: AvenantRow) => {
    setIsExporting(true);
    try {
      if (row._type === 'transfert') await exportAvenantTransfertPdf(row);
      else await exportAvenantPdf(row);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Sauvegarde depuis formulaire Standard ─────────────────────────────────
  const handleSavedStandard = (saved: AvenantData) => {
    const row: AvenantRow = { ...saved, _type: 'standard' };
    setRows(prev => {
      const idx = prev.findIndex(r => (r as any).id === (saved as any).id);
      if (idx >= 0) { const next = [...prev]; next[idx] = row; return next; }
      return [row, ...prev];
    });
  };

  // ── Sauvegarde depuis formulaire Transfert ────────────────────────────────
  const handleSavedTransfert = (saved: AvenantTransfertData) => {
    const row: AvenantRow = { ...saved, _type: 'transfert' };
    setRows(prev => {
      const idx = prev.findIndex(r => (r as any).id === (saved as any).id);
      if (idx >= 0) { const next = [...prev]; next[idx] = row; return next; }
      return [row, ...prev];
    });
  };

  // ── Vue formulaire Standard ───────────────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <AvenantForm
        initial={selected || undefined}
        onBack={() => { setViewMode('list'); setSelected(null); }}
        onSaved={(saved) => { handleSavedStandard(saved); setSelected(saved); }}
      />
    );
  }

  // ── Vue formulaire Transfert ──────────────────────────────────────────────
  if (viewMode === 'formTransfert') {
    return (
      <AvenantTransfertForm
        initial={selectedTransfert || undefined}
        onBack={() => { setViewMode('list'); setSelectedTransfert(null); }}
        onSaved={(saved) => { handleSavedTransfert(saved); setSelectedTransfert(saved); }}
      />
    );
  }

  // ── Vue liste ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* En-tête */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-slate-600" />
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2F5B58]/10 flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-[#2F5B58]" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 dark:text-slate-100">Avenants aux marchés</h1>
                <p className="text-xs text-gray-400 dark:text-slate-500">
                  {rows.length} avenant{rows.length > 1 ? 's' : ''} enregistré{rows.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Dropdown Nouvel avenant */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowNewDropdown(v => !v)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2F5B58] hover:bg-[#234441] rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Nouvel avenant
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>
            {showNewDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-20 overflow-hidden">
                <button
                  onClick={() => { setShowNewDropdown(false); setSelected(null); setViewMode('form'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <span className="w-5 h-5 rounded bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold flex-shrink-0">S</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-100">Avenant standard</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">EXE10 — modification de prestations</p>
                  </div>
                </button>
                <div className="border-t border-gray-100 dark:border-slate-700" />
                <button
                  onClick={() => { setShowNewDropdown(false); setSelectedTransfert(null); setViewMode('formTransfert'); }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-gray-50 dark:hover:bg-slate-700 transition"
                >
                  <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">T</span>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-slate-100">Avenant de transfert</p>
                    <p className="text-xs text-gray-400 dark:text-slate-500">Changement de titulaire (fusion/absorption)</p>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Corps */}
      <div className="max-w-screen-xl mx-auto w-full px-6 py-6 flex-1">
        {loading && (
          <div className="flex items-center justify-center py-20 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Chargement…
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-400 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            {error}
            <button onClick={fetchAvenants} className="ml-auto underline">Réessayer</button>
          </div>
        )}

        {!loading && !error && rows.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2F5B58]/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#2F5B58]/50" />
            </div>
            <p className="text-base font-semibold text-gray-600 dark:text-slate-300">Aucun avenant enregistré</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Cliquez sur "+ Nouvel avenant" pour commencer</p>
          </div>
        )}

        {!loading && !error && rows.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contrat / Parties</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Montant</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {rows.map((row) => {
                  const id = (row as any).id;
                  const isTransfert = row._type === 'transfert';

                  const handleRowClick = () => {
                    if (isTransfert) {
                      setSelectedTransfert(row as AvenantTransfertData);
                      setViewMode('formTransfert');
                    } else {
                      setSelected(row as AvenantData);
                      setViewMode('form');
                    }
                  };

                  return (
                    <tr
                      key={id}
                      className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition"
                      onClick={handleRowClick}
                    >
                      {/* N° */}
                      <td className="px-4 py-3 text-sm font-bold text-[#2F5B58]">
                        {row.numero_avenant ?? '—'}
                      </td>

                      {/* Type badge */}
                      <td className="px-4 py-3">
                        <TypeBadge type={row._type} />
                      </td>

                      {/* Référence demande */}
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{row.demande || '—'}</p>
                      </td>

                      {/* Contrat / Parties */}
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-700 dark:text-slate-200">{row.contrat_reference || '—'}</p>
                        {isTransfert ? (
                          <p className="text-xs text-gray-400 dark:text-slate-500 flex items-center gap-1">
                            {(row as AvenantTransfertData).ancien_titulaire_denomination || ''}
                            {(row as AvenantTransfertData).ancien_titulaire_denomination && (row as AvenantTransfertData).nouveau_titulaire_denomination && (
                              <ArrowRight className="w-3 h-3 inline-block mx-0.5" />
                            )}
                            {(row as AvenantTransfertData).nouveau_titulaire_denomination || ''}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 dark:text-slate-500">
                            {(row as AvenantData).titulaire || ''}
                          </p>
                        )}
                      </td>

                      {/* Montant */}
                      <td className="px-4 py-3 text-right">
                        {isTransfert ? (
                          <span className="text-xs text-gray-400 dark:text-slate-500 italic">Sans incidence</span>
                        ) : (
                          <span className={`text-sm font-semibold ${
                            ((row as AvenantData).montant_avenant_ht ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                          }`}>
                            {((row as AvenantData).montant_avenant_ht ?? 0) >= 0 ? '+' : ''}
                            {formatMontant((row as AvenantData).montant_avenant_ht)}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                        {formatDate((row as any).created_at)}
                      </td>

                      {/* Statut */}
                      <td className="px-4 py-3">
                        <StatutBadge statut={row.statut} />
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => {
                              if (isTransfert) setPreviewTransfert(row as AvenantTransfertData);
                              else setPreviewData(row as AvenantData);
                            }}
                            title="Aperçu"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-[#2F5B58] transition"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleQuickPdf(row)}
                            title="Exporter PDF"
                            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-[#2F5B58] transition"
                          >
                            <FileDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(row)}
                            disabled={deletingId === id}
                            title="Supprimer"
                            className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition"
                          >
                            {deletingId === id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visionneuse Standard */}
      {previewData && (
        <AvenantPreview
          data={previewData}
          onClose={() => setPreviewData(null)}
          onExport={async () => { setIsExporting(true); try { await exportAvenantPdf(previewData); } finally { setIsExporting(false); } }}
          isExporting={isExporting}
        />
      )}

      {/* Visionneuse Transfert */}
      {previewTransfert && (
        <AvenantTransfertPreview
          data={previewTransfert}
          onClose={() => setPreviewTransfert(null)}
          onExport={async () => { setIsExporting(true); try { await exportAvenantTransfertPdf(previewTransfert); } finally { setIsExporting(false); } }}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}
