// ============================================
// AvenantForm — Formulaire de saisie EXE10
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Save, Eye, ChevronDown, ChevronUp,
  FileSignature, Briefcase, PenLine, TrendingUp, CalendarClock, Edit3,
  Loader2, Search,
} from 'lucide-react';
import type { AvenantData } from '../types';
import { RichTextEditor } from '../../dce-complet/components/modules/RichTextEditor';
import { AvenantPreview } from './AvenantPreview';
import { exportAvenantPdf } from '../utils/avenantPdfExport';
import { supabase } from '../../../lib/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMontant(val: number | null): string {
  if (val === null) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' €HT';
}

// ─── Composants UI ────────────────────────────────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', className = '' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition ${className}`}
    />
  );
}

function NumberInput({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      placeholder={placeholder}
      step="0.01"
      className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition"
    />
  );
}

function Section({
  icon: Icon, title, children, defaultOpen = true,
}: { icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 mb-4">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-[#2F5B58]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#2F5B58]" />
          </div>
          <span className="text-sm font-bold text-gray-800 dark:text-slate-100">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-5 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>}
    </div>
  );
}

function FullWidth({ children }: { children: React.ReactNode }) {
  return <div className="col-span-full">{children}</div>;
}

// ─── Composant principal ──────────────────────────────────────────────────────

interface AvenantFormProps {
  initial?: Partial<AvenantData>;
  onBack: () => void;
  onSaved: (saved: AvenantData) => void;
}

export function AvenantForm({ initial, onBack, onSaved }: AvenantFormProps) {
  const [form, setForm] = useState<AvenantData>({
    demande: '',
    demandeur: '',
    valideur_direction: '',
    contrat_reference: '',
    contrat_libelle: '',
    titulaire: '',
    description_avenant: '',
    montant_avenant_ht: null,
    nouvelle_date_fin: null,
    redige_par: '',
    numero_avenant: null,
    montant_initial_ht: null,
    montant_precedent_ht: null,
    taux_tva: '20.0%',
    frn_nom_signataire: '',
    frn_fonction_signataire: '',
    duree_marche: '',
    date_notification: null,
    statut: 'brouillon',
    ...initial,
  });
  const [saving, setSaving]             = useState(false);
  const [savedMsg, setSavedMsg]         = useState('');
  const [showPreview, setShowPreview]   = useState(false);
  const [isExporting, setIsExporting]   = useState(false);
  const [contratSearch, setContratSearch] = useState(form.contrat_reference || '');
  const [contratResults, setContratResults] = useState<any[]>([]);
  const [contratsLoading, setContratsLoading] = useState(false);
  const [showContratList, setShowContratList] = useState(false);
  const contratBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calcul automatique
  const montantNouveau = (form.montant_precedent_ht ?? 0) + (form.montant_avenant_ht ?? 0);

  const set = useCallback(<K extends keyof AvenantData>(key: K, value: AvenantData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  // ── Recherche dans TBL_Contrats (debounce 300ms) ───────────────────────────
  useEffect(() => {
    const q = contratSearch.trim();
    if (!q || q.length < 2) { setContratResults([]); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setContratsLoading(true);
      try {
        const { data, error } = await supabase
          .from('TBL_Contrats')
          .select('*')
          .or(`"Agreement Number".ilike.%${q}%,"Supplier".ilike.%${q}%`)
          .limit(20);
        if (!error) setContratResults(data || []);
      } finally {
        setContratsLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [contratSearch]);

  // Fermer la liste si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contratBoxRef.current && !contratBoxRef.current.contains(e.target as Node))
        setShowContratList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Sélection d'un contrat depuis TBL_Contrats ───────────────────────────
  const handleSelectContrat = (c: any) => {
    const montantRaw = c['Montant du marché'];
    const montant    = montantRaw != null ? parseFloat(String(montantRaw).replace(/[^\d.-]/g, '')) : null;
    setForm(f => ({
      ...f,
      contrat_reference:    c['Agreement Number']               || '',
      contrat_libelle:      c['Description']                    || '',
      titulaire:            c['Supplier']                       || '',
      montant_initial_ht:   isNaN(montant as number) ? null : montant,
      montant_precedent_ht: isNaN(montant as number) ? null : montant,
      date_notification:    c['Date notification']              || null,
      frn_nom_signataire:   c['Nom du signataire (fournisseur)'] || '',
      duree_marche:         '',   // pas de colonne durée dans TBL_Contrats
    }));
    setContratSearch(c['Agreement Number'] || '');
    setShowContratList(false);
  };

  // Sauvegarde Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, updated_at: new Date().toISOString() };
      let result;
      if (form.id) {
        const { data, error } = await supabase.from('avenants').update(payload).eq('id', form.id).select().single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase.from('avenants').insert(payload).select().single();
        if (error) throw error;
        result = data;
      }
      setForm(result as AvenantData);
      setSavedMsg('Enregistré');
      setTimeout(() => setSavedMsg(''), 3000);
      onSaved(result as AvenantData);
    } catch (err) {
      console.error('[Avenants] save error:', err);
      setSavedMsg('Erreur lors de la sauvegarde');
      setTimeout(() => setSavedMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExporting(true);
    try {
      await exportAvenantPdf(form);
    } finally {
      setIsExporting(false);
      setShowPreview(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* ── En-tête fixe ── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour
            </button>
            <div className="h-5 w-px bg-gray-200 dark:bg-slate-600" />
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-slate-100">
                {form.id ? `Avenant N° ${form.numero_avenant ?? '—'}` : 'Nouvel avenant'}
              </h1>
              <p className="text-xs text-gray-400 dark:text-slate-500">{form.contrat_reference || 'Aucun contrat sélectionné'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {savedMsg && (
              <span className={`text-xs font-medium px-2 py-1 rounded-lg ${savedMsg.startsWith('Erreur') ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                {savedMsg}
              </span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-[#2F5B58] border border-[#2F5B58]/30 hover:bg-[#2F5B58]/5 rounded-lg transition"
            >
              <Eye className="w-4 h-4" />
              Aperçu PDF
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#2F5B58] hover:bg-[#234441] disabled:opacity-60 rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {/* Bande récap montant */}
        <div className="bg-gradient-to-r from-[#2F5B58]/5 to-[#2F5B58]/10 dark:from-[#2F5B58]/20 dark:to-[#2F5B58]/30 px-6 py-2 flex gap-6 text-xs text-gray-600 dark:text-slate-400">
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Montant précédent :</span> {formatMontant(form.montant_precedent_ht)}</span>
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Avenant :</span> <span className={form.montant_avenant_ht != null && form.montant_avenant_ht >= 0 ? 'text-emerald-600' : 'text-red-600'}>{form.montant_avenant_ht != null && form.montant_avenant_ht >= 0 ? '+' : ''}{formatMontant(form.montant_avenant_ht)}</span></span>
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Nouveau total :</span> <span className="font-bold text-[#2F5B58]">{formatMontant(montantNouveau)}</span></span>
        </div>
      </div>

      {/* ── Corps du formulaire ── */}
      <div className="max-w-screen-xl mx-auto w-full px-6 py-6">

        {/* SECTION EN-TÊTE */}
        <Section icon={FileSignature} title="En-tête">
          <div>
            <Label required>Référence de la demande</Label>
            <Input value={form.demande} onChange={v => set('demande', v)} placeholder="Ex : 23333-8-Avenant 2" />
          </div>
          <div>
            <Label required>Demandeur</Label>
            <Input value={form.demandeur} onChange={v => set('demandeur', v)} placeholder="Nom du demandeur" />
          </div>
          <div>
            <Label>Valideur Direction DIA</Label>
            <Input value={form.valideur_direction} onChange={v => set('valideur_direction', v)} placeholder="Nom du valideur" />
          </div>
        </Section>

        {/* SECTION CONTRAT */}
        <Section icon={Briefcase} title="Contrat">
          <FullWidth>
            <Label required>Contrat (N° agreement ou fournisseur)</Label>
            <div className="relative" ref={contratBoxRef}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={contratSearch}
                  onChange={e => { setContratSearch(e.target.value); setShowContratList(true); }}
                  onFocus={() => contratSearch.length >= 2 && setShowContratList(true)}
                  placeholder="Rechercher par n° contrat ou fournisseur (min. 2 caractères)…"
                  className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition"
                />
                {contratsLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2F5B58] animate-spin" />
                )}
              </div>
              {showContratList && (contratResults.length > 0 || contratsLoading) && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                  {contratsLoading && contratResults.length === 0 && (
                    <div className="flex items-center justify-center gap-2 px-4 py-4 text-xs text-gray-400">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Recherche en cours…
                    </div>
                  )}
                  {contratResults.map(c => (
                    <button
                      key={c['Id'] || c['Agreement Number']}
                      type="button"
                      onClick={() => handleSelectContrat(c)}
                      className="w-full text-left px-4 py-3 hover:bg-[#2F5B58]/5 dark:hover:bg-[#2F5B58]/20 transition border-b border-gray-100 dark:border-slate-700 last:border-0"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold text-[#2F5B58]">{c['Agreement Number']}</p>
                        {c['Agreement Status Meaning'] && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 text-gray-500 rounded">{c['Agreement Status Meaning']}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-200 truncate mt-0.5">{c['Description'] || '—'}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[10px] text-gray-400">{c['Supplier']}</p>
                        {c['Montant du marché'] && <p className="text-[10px] text-gray-400">{c['Montant du marché']} €HT</p>}
                        {c['Date notification'] && <p className="text-[10px] text-gray-400">Notif. {c['Date notification']}</p>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showContratList && contratSearch.length >= 2 && !contratsLoading && contratResults.length === 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-50 px-4 py-3 text-xs text-gray-400">
                  Aucun contrat trouvé pour « {contratSearch} »
                </div>
              )}
            </div>
          </FullWidth>

          {form.contrat_reference && (
            <>
              <div>
                <Label>Titulaire (auto)</Label>
                <Input value={form.titulaire} onChange={v => set('titulaire', v)} />
              </div>
              <div>
                <Label>Durée du marché</Label>
                <Input value={form.duree_marche} onChange={v => set('duree_marche', v)} placeholder="Ex : 48 mois" />
              </div>
              <div>
                <Label>Date de notification</Label>
                <Input type="date" value={form.date_notification || ''} onChange={v => set('date_notification', v || null)} />
              </div>
            </>
          )}
        </Section>

        {/* SECTION MODIFICATION DES PRESTATIONS */}
        <Section icon={PenLine} title="Modification des prestations">
          <FullWidth>
            <Label required>Description de l'avenant</Label>
            <RichTextEditor
              value={form.description_avenant}
              onChange={v => set('description_avenant', v)}
              placeholder="Décrivez les modifications apportées au marché…"
            />
          </FullWidth>
        </Section>

        {/* SECTION MODIFICATION DU MONTANT */}
        <Section icon={TrendingUp} title="Modification du montant du marché">
          <div>
            <Label>Montant initial HT (€)</Label>
            <NumberInput value={form.montant_initial_ht} onChange={v => set('montant_initial_ht', v)} placeholder="0.00" />
          </div>
          <div>
            <Label>Montant précédent HT (€)</Label>
            <NumberInput value={form.montant_precedent_ht} onChange={v => set('montant_precedent_ht', v)} placeholder="0.00" />
            <p className="text-[10px] text-gray-400 mt-1">Montant du marché après le dernier avenant</p>
          </div>
          <div>
            <Label required>Montant avenant HT (€)</Label>
            <NumberInput value={form.montant_avenant_ht} onChange={v => set('montant_avenant_ht', v)} placeholder="0.00" />
            <p className="text-[10px] text-gray-400 mt-1">Négatif si diminution</p>
          </div>
          <div>
            <Label>Nouveau montant total HT</Label>
            <div className="px-3 py-2 text-sm font-bold text-[#2F5B58] bg-[#2F5B58]/5 border border-[#2F5B58]/20 rounded-lg">
              {formatMontant(montantNouveau)}
            </div>
          </div>
          <div>
            <Label>Taux de TVA</Label>
            <Input value={form.taux_tva} onChange={v => set('taux_tva', v)} placeholder="20.0%" />
          </div>
        </Section>

        {/* SECTION MODIFICATION DU DÉLAI */}
        <Section icon={CalendarClock} title="Modification du délai" defaultOpen={false}>
          <div>
            <Label>Nouvelle date de fin</Label>
            <Input type="date" value={form.nouvelle_date_fin || ''} onChange={v => set('nouvelle_date_fin', v || null)} />
            <p className="text-[10px] text-gray-400 mt-1">Laisser vide si le délai n'est pas modifié</p>
          </div>
        </Section>

        {/* SECTION RÉDACTION */}
        <Section icon={Edit3} title="Rédaction">
          <div>
            <Label required>Rédigé par</Label>
            <Input value={form.redige_par} onChange={v => set('redige_par', v)} placeholder="Nom du rédacteur" />
          </div>
          <div>
            <Label required>Numéro d'avenant</Label>
            <NumberInput value={form.numero_avenant} onChange={v => set('numero_avenant', v)} placeholder="Ex : 2" />
          </div>
          <div>
            <Label>Frn Nom Signataire</Label>
            <Input value={form.frn_nom_signataire} onChange={v => set('frn_nom_signataire', v)} placeholder="Nom du signataire fournisseur" />
          </div>
          <div>
            <Label>Frn Fonction Signataire</Label>
            <Input value={form.frn_fonction_signataire} onChange={v => set('frn_fonction_signataire', v)} placeholder="Fonction du signataire fournisseur" />
          </div>
          <div>
            <Label>Statut</Label>
            <select
              value={form.statut}
              onChange={e => set('statut', e.target.value as 'brouillon' | 'valide')}
              className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition"
            >
              <option value="brouillon">Brouillon</option>
              <option value="valide">Validé</option>
            </select>
          </div>
        </Section>
      </div>

      {/* ── Visionneuse PDF ── */}
      {showPreview && (
        <AvenantPreview
          data={form}
          onClose={() => setShowPreview(false)}
          onExport={handleExportPdf}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}
