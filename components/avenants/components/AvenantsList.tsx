// ============================================
// AvenantsList — Vue principale du module
// Liste + accès au formulaire
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowLeft, Plus, FileText, Trash2, Eye, FileDown,
  Loader2, AlertCircle, ClipboardList,
} from 'lucide-react';
import type { AvenantData } from '../types';
import { AvenantForm } from './AvenantForm';
import { AvenantPreview } from './AvenantPreview';
import { exportAvenantPdf } from '../utils/avenantPdfExport';
import { supabase } from '../../../lib/supabase';

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

// ─── Composant principal ──────────────────────────────────────────────────────

interface AvenantsListProps {
  onBack: () => void;
}

type ViewMode = 'list' | 'form' | 'preview';

export function AvenantsList({ onBack }: AvenantsListProps) {
  const [avenants, setAvenants]         = useState<AvenantData[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [viewMode, setViewMode]         = useState<ViewMode>('list');
  const [selected, setSelected]         = useState<AvenantData | null>(null);
  const [previewData, setPreviewData]   = useState<AvenantData | null>(null);
  const [isExporting, setIsExporting]   = useState(false);
  const [deletingId, setDeletingId]     = useState<string | null>(null);

  // ── Chargement ────────────────────────────────────────────────────────────
  const fetchAvenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('avenants')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setAvenants((data || []) as AvenantData[]);
    } catch (e: any) {
      setError(e?.message || 'Erreur lors du chargement des avenants');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAvenants(); }, [fetchAvenants]);

  // ── Suppression ───────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!window.confirm('Supprimer cet avenant ? Cette action est irréversible.')) return;
    setDeletingId(id);
    try {
      const { error: err } = await supabase.from('avenants').delete().eq('id', id);
      if (err) throw err;
      setAvenants(prev => prev.filter(a => (a as any).id !== id));
    } catch (e: any) {
      alert('Erreur lors de la suppression : ' + (e?.message || ''));
    } finally {
      setDeletingId(null);
    }
  };

  // ── Export PDF rapide depuis la liste ────────────────────────────────────
  const handleQuickPdf = async (avenant: AvenantData) => {
    setIsExporting(true);
    try {
      await exportAvenantPdf(avenant);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Sauvegarde depuis le formulaire ──────────────────────────────────────
  const handleSaved = (saved: AvenantData) => {
    setAvenants(prev => {
      const idx = prev.findIndex(a => (a as any).id === (saved as any).id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
  };

  // ── Vue formulaire ────────────────────────────────────────────────────────
  if (viewMode === 'form') {
    return (
      <AvenantForm
        initial={selected || undefined}
        onBack={() => { setViewMode('list'); setSelected(null); }}
        onSaved={(saved) => { handleSaved(saved); setSelected(saved); }}
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
                <p className="text-xs text-gray-400 dark:text-slate-500">{avenants.length} avenant{avenants.length > 1 ? 's' : ''} enregistré{avenants.length > 1 ? 's' : ''}</p>
              </div>
            </div>
          </div>
          <button
            onClick={() => { setSelected(null); setViewMode('form'); }}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2F5B58] hover:bg-[#234441] rounded-lg transition"
          >
            <Plus className="w-4 h-4" />
            Nouvel avenant
          </button>
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

        {!loading && !error && avenants.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#2F5B58]/10 flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-[#2F5B58]/50" />
            </div>
            <p className="text-base font-semibold text-gray-600 dark:text-slate-300">Aucun avenant enregistré</p>
            <p className="text-sm text-gray-400 dark:text-slate-500 mt-1">Cliquez sur "+ Nouvel avenant" pour commencer</p>
            <button
              onClick={() => { setSelected(null); setViewMode('form'); }}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-[#2F5B58] hover:bg-[#234441] rounded-lg transition"
            >
              <Plus className="w-4 h-4" />
              Créer le premier avenant
            </button>
          </div>
        )}

        {!loading && !error && avenants.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">N°</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Référence</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Contrat / Titulaire</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Montant avenant</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                {avenants.map((a) => (
                  <tr
                    key={(a as any).id}
                    className="hover:bg-gray-50 dark:hover:bg-slate-700/30 cursor-pointer transition"
                    onClick={() => { setSelected(a); setViewMode('form'); }}
                  >
                    <td className="px-4 py-3 text-sm font-bold text-[#2F5B58]">
                      {a.numero_avenant ?? '—'}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 dark:text-slate-100">{a.demande || '—'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm text-gray-700 dark:text-slate-200">{a.contrat_reference || '—'}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500">{a.titulaire || ''}</p>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-sm font-semibold ${
                        (a.montant_avenant_ht ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {(a.montant_avenant_ht ?? 0) >= 0 ? '+' : ''}{formatMontant(a.montant_avenant_ht)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-slate-400">
                      {formatDate((a as any).created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <StatutBadge statut={a.statut} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => { setPreviewData(a); }}
                          title="Aperçu"
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-[#2F5B58] transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleQuickPdf(a)}
                          title="Exporter PDF"
                          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-[#2F5B58] transition"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete((a as any).id)}
                          disabled={deletingId === (a as any).id}
                          title="Supprimer"
                          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition"
                        >
                          {deletingId === (a as any).id
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Visionneuse depuis la liste */}
      {previewData && (
        <AvenantPreview
          data={previewData}
          onClose={() => setPreviewData(null)}
          onExport={() => handleQuickPdf(previewData)}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}
