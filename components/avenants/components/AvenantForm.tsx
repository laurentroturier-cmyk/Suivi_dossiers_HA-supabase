// ============================================
// AvenantForm — Formulaire de saisie EXE10
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Save, Eye, ChevronDown, ChevronUp,
  FileSignature, Briefcase, PenLine, TrendingUp, CalendarClock, Edit3,
  Loader2, Search, Building2, CheckCircle2, ChevronRight,
} from 'lucide-react';
import type { AvenantData } from '../types';
import { RichTextEditor } from '../../dce-complet/components/modules/RichTextEditor';
import { AvenantPreview } from './AvenantPreview';
import { exportAvenantPdf } from '../utils/avenantPdfExport';
import { supabase } from '../../../lib/supabase';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatMontant(val: number | null): string {
  if (val === null) return '—';
  return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' €';
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

function MoneyInput({ value, onChange, placeholder }: { value: number | null; onChange: (v: number | null) => void; placeholder?: string }) {
  const [focused, setFocused] = useState(false);
  const formatted = value !== null && value !== undefined
    ? new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + ' €'
    : '';
  return (
    <input
      type={focused ? 'number' : 'text'}
      value={focused ? (value ?? '') : formatted}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={e => onChange(e.target.value === '' ? null : parseFloat(e.target.value))}
      placeholder={placeholder ?? '0,00 €'}
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
    contrat_reference: '',
    contrat_libelle: '',
    titulaire: '',
    titulaire_nom: '',
    titulaire_siret: '',
    titulaire_adresse: '',
    titulaire_email: '',
    description_avenant: '',
    incidence_financiere: true,
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

  // ── Référentiel fournisseurs ────────────────────────────────────────────────
  const [frnSearch,        setFrnSearch]        = useState('');
  const [frnEntetes,       setFrnEntetes]        = useState<any[]>([]);
  const [frnLoading,       setFrnLoading]        = useState(false);
  const [showFrnList,      setShowFrnList]       = useState(false);
  const [selectedEntete,   setSelectedEntete]    = useState<any | null>(null);
  const [frnSites,         setFrnSites]          = useState<any[]>([]);
  const [sitesLoading,     setSitesLoading]      = useState(false);
  const [showSiteList,     setShowSiteList]      = useState(false);
  const frnBoxRef   = useRef<HTMLDivElement>(null);
  const frnDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Historique des avenants du contrat ────────────────────────────────────
  const [historiqueAvenants, setHistoriqueAvenants] = useState<any[]>([]);
  const [loadingHistorique,  setLoadingHistorique]  = useState(false);

  // Calculs automatiques
  const montantNouveau    = (form.montant_precedent_ht ?? 0) + (form.montant_avenant_ht ?? 0);
  const montantCumule     = montantNouveau - (form.montant_initial_ht ?? 0);
  const pctAvenantCourant = form.montant_initial_ht
    ? (form.montant_avenant_ht ?? 0) / form.montant_initial_ht * 100
    : null;
  const pctCumule = form.montant_initial_ht
    ? montantCumule / form.montant_initial_ht * 100
    : null;

  const set = useCallback(<K extends keyof AvenantData>(key: K, value: AvenantData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  // ── Chargement de l'historique à l'ouverture d'un avenant existant ────────
  useEffect(() => {
    if (form.id && form.contrat_reference) {
      fetchAvenantsPrecedents(form.contrat_reference, form.montant_initial_ht, form.id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionnellement vide — exécuté une seule fois à l'ouverture

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

  // ── Fetch des avenants existants pour un contrat ─────────────────────────
  const fetchAvenantsPrecedents = useCallback(async (
    contratRef: string,
    montantInitial: number | null,
    excludeId?: string,
  ) => {
    if (!contratRef) return;
    setLoadingHistorique(true);
    try {
      let q = supabase
        .from('avenants')
        .select('id, numero_avenant, montant_avenant_ht, statut, created_at, description_avenant')
        .eq('contrat_reference', contratRef)
        .order('numero_avenant', { ascending: true });
      if (excludeId) q = q.neq('id', excludeId);
      const { data } = await q;
      const precedents = data || [];
      setHistoriqueAvenants(precedents);

      // Numéro suivant
      const maxNum = precedents.reduce((m, a) => Math.max(m, a.numero_avenant ?? 0), 0);
      // Somme des montants précédents
      const sommePrecedents = precedents.reduce((s, a) => s + (a.montant_avenant_ht ?? 0), 0);
      const nouveauPrecedent = (montantInitial ?? 0) + sommePrecedents;

      setForm(f => ({
        ...f,
        numero_avenant:      excludeId ? f.numero_avenant : maxNum + 1,
        montant_precedent_ht: nouveauPrecedent,
      }));
    } finally {
      setLoadingHistorique(false);
    }
  }, []);

  // ── Sélection d'un contrat depuis TBL_Contrats ───────────────────────────
  const handleSelectContrat = (c: any) => {
    const montantRaw    = c['Montant du marché'];
    const montant       = montantRaw != null ? parseFloat(String(montantRaw).replace(/[^\d.-]/g, '')) : null;
    const montantInitial = isNaN(montant as number) ? null : montant;
    setForm(f => ({
      ...f,
      contrat_reference:    c['Agreement Number']               || '',
      contrat_libelle:      c['Description']                    || '',
      titulaire:            c['Supplier']                       || '',
      numero_procedure:     c['numero_procedure']               || null,
      numero_lot:           c['numero_lot']                     || null,
      montant_initial_ht:   montantInitial,
      montant_precedent_ht: montantInitial,   // sera recalculé par fetchAvenantsPrecedents
      date_notification:    c['Date notification']              || null,
      frn_nom_signataire:   c['Nom du signataire (fournisseur)'] || '',
      duree_marche:         '',
    }));
    setContratSearch(c['Agreement Number'] || '');
    setShowContratList(false);
    fetchAvenantsPrecedents(c['Agreement Number'] || '', montantInitial, form.id);
  };

  // ── Recherche entête fournisseur (debounce 300ms) ─────────────────────────
  useEffect(() => {
    const q = frnSearch.trim();
    if (!q || q.length < 2) { setFrnEntetes([]); return; }
    if (frnDebounce.current) clearTimeout(frnDebounce.current);
    frnDebounce.current = setTimeout(async () => {
      setFrnLoading(true);
      try {
        const { data } = await supabase
          .from('Referentiel_Fournisseurs_Entete')
          .select('*')
          .or(`"Nom du fournisseur".ilike.%${q}%,"Numero du fournisseur".ilike.%${q}%`)
          .eq('Statut', 'Actif')
          .limit(20);
        setFrnEntetes(data || []);
      } finally {
        setFrnLoading(false);
      }
    }, 300);
    return () => { if (frnDebounce.current) clearTimeout(frnDebounce.current); };
  }, [frnSearch]);

  // ── Pré-remplissage depuis form.titulaire (auto) ───────────────────────────
  useEffect(() => {
    if (!form.titulaire || form.titulaire_nom) return;
    setFrnSearch(form.titulaire);
  }, [form.titulaire]);

  // ── Chargement des sites pour l'entête sélectionnée ──────────────────────
  useEffect(() => {
    if (!selectedEntete) { setFrnSites([]); return; }
    setSitesLoading(true);
    supabase
      .from('Referentiel_Fournisseur_Site')
      .select('*')
      .eq('Numéro de fournisseur', selectedEntete['Numero du fournisseur'])
      .then(({ data }) => {
        setFrnSites(data || []);
        setSitesLoading(false);
        if (data && data.length === 1) handleSelectSite(data[0]); // auto-sélection si 1 seul site
      });
  }, [selectedEntete]);

  // ── Clic extérieur — fermer dropdowns fournisseur ─────────────────────────
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (frnBoxRef.current && !frnBoxRef.current.contains(e.target as Node)) {
        setShowFrnList(false);
        setShowSiteList(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelectEntete = (entete: any) => {
    setSelectedEntete(entete);
    setFrnSearch(entete['Nom du fournisseur'] || '');
    setShowFrnList(false);
    setShowSiteList(true);
  };

  const handleSelectSite = (site: any) => {
    const adresse = [
      site['Ligne adresse 1'],
      site['Ligne adresse 2'],
      site['Code postal'] && site['Ville']
        ? `${site['Code postal']} ${site['Ville']}`
        : site['Ville'] || site['Code postal'],
    ].filter(Boolean).join(', ');

    setForm(f => ({
      ...f,
      titulaire_nom:     selectedEntete?.['Nom du fournisseur'] || f.titulaire,
      titulaire_siret:   site['SIRET'] || '',
      titulaire_adresse: adresse,
      titulaire_email:   site['Courriel'] || '',
    }));
    setShowSiteList(false);
  };

  // Sauvegarde Supabase
  const handleSave = async () => {
    setSaving(true);
    try {
      const sanitizeDate = (val: string | null | undefined): string | null => {
        if (!val) return null;
        return val.includes('T') ? val.split('T')[0] : val;
      };
      const payload = {
        ...form,
        date_notification: sanitizeDate(form.date_notification),
        nouvelle_date_fin: sanitizeDate(form.nouvelle_date_fin),
        updated_at: new Date().toISOString(),
      };
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
        <div className="bg-gradient-to-r from-[#2F5B58]/5 to-[#2F5B58]/10 dark:from-[#2F5B58]/20 dark:to-[#2F5B58]/30 px-6 py-2 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600 dark:text-slate-400">
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Montant initial :</span> {formatMontant(form.montant_initial_ht)}</span>
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Avenant N°{form.numero_avenant ?? '?'} :</span> <span className={(form.montant_avenant_ht ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600'}>{(form.montant_avenant_ht ?? 0) >= 0 ? '+' : ''}{formatMontant(form.montant_avenant_ht)}</span></span>
          <span><span className="font-semibold text-gray-800 dark:text-slate-200">Nouveau total :</span> <span className="font-bold text-[#2F5B58]">{formatMontant(montantNouveau)}</span></span>
          {pctAvenantCourant !== null && <span><span className="font-semibold text-gray-800 dark:text-slate-200">% avenant :</span> <span className={pctAvenantCourant >= 0 ? 'text-emerald-600 font-bold' : 'text-red-600 font-bold'}>{pctAvenantCourant >= 0 ? '+' : ''}{pctAvenantCourant.toFixed(2)} %</span></span>}
          {pctCumule !== null && <span><span className="font-semibold text-gray-800 dark:text-slate-200">% cumulé :</span> <span className={pctCumule >= 0 ? 'text-emerald-700 font-bold' : 'text-red-700 font-bold'}>{pctCumule >= 0 ? '+' : ''}{pctCumule.toFixed(2)} %</span></span>}
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
                        {c['Montant du marché'] && <p className="text-[10px] text-gray-400">{c['Montant du marché']} €</p>}
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

        {/* SECTION TITULAIRE */}
        <Section icon={Building2} title="Identification du titulaire du marché public">
          <FullWidth>
            <div ref={frnBoxRef} className="space-y-3">

              {/* ── Étape 1 : Recherche entête ── */}
              <div>
                <Label required>Rechercher le fournisseur</Label>
                <p className="text-[10px] text-gray-400 mb-1">
                  Recherche automatique depuis « {form.titulaire || '—'} » — vous pouvez affiner
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={frnSearch}
                    onChange={e => { setFrnSearch(e.target.value); setShowFrnList(true); setSelectedEntete(null); }}
                    onFocus={() => frnSearch.length >= 2 && setShowFrnList(true)}
                    placeholder="Nom ou n° fournisseur…"
                    className="w-full pl-9 pr-9 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition"
                  />
                  {frnLoading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#2F5B58] animate-spin" />}
                </div>

                {/* Dropdown entêtes */}
                {showFrnList && (frnEntetes.length > 0 || frnLoading) && (
                  <div className="relative">
                    <div className="absolute top-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto">
                      {frnLoading && frnEntetes.length === 0 && (
                        <div className="flex items-center justify-center gap-2 px-4 py-3 text-xs text-gray-400">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />Recherche…
                        </div>
                      )}
                      {frnEntetes.map((e, i) => (
                        <button
                          key={e['Numero du fournisseur'] || i}
                          type="button"
                          onClick={() => handleSelectEntete(e)}
                          className="w-full text-left px-4 py-3 hover:bg-[#2F5B58]/5 dark:hover:bg-[#2F5B58]/20 transition border-b border-gray-100 dark:border-slate-700 last:border-0"
                        >
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-[#2F5B58]">{e['Nom du fournisseur']}</p>
                            {e['Statut'] && (
                              <span className={`text-[9px] px-1.5 py-0.5 rounded ${e['Statut'] === 'Actif' ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                {e['Statut']}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-3 mt-0.5">
                            <p className="text-[10px] text-gray-400">N° {e['Numero du fournisseur']}</p>
                            {e['Type de fournisseur'] && <p className="text-[10px] text-gray-400">{e['Type de fournisseur']}</p>}
                            {e['Code NAF'] && <p className="text-[10px] text-gray-400">NAF {e['Code NAF']}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {showFrnList && frnSearch.length >= 2 && !frnLoading && frnEntetes.length === 0 && (
                  <div className="relative">
                    <div className="absolute top-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-xl z-50 px-4 py-3 text-xs text-gray-400">
                      Aucun fournisseur trouvé pour « {frnSearch} »
                    </div>
                  </div>
                )}
              </div>

              {/* ── Étape 2 : Sélection du site ── */}
              {selectedEntete && (
                <div className="bg-[#2F5B58]/5 border border-[#2F5B58]/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-[#2F5B58]" />
                    <p className="text-xs font-bold text-[#2F5B58]">{selectedEntete['Nom du fournisseur']}</p>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    <p className="text-xs text-gray-500">Sélectionner un site</p>
                  </div>

                  {sitesLoading ? (
                    <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />Chargement des sites…
                    </div>
                  ) : frnSites.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Aucun site trouvé pour ce fournisseur</p>
                  ) : (
                    <div className="space-y-1.5">
                      {frnSites.map((site, i) => {
                        const isSelected = form.titulaire_siret === (site['SIRET'] || '');
                        return (
                          <button
                            key={site['SIRET'] || i}
                            type="button"
                            onClick={() => handleSelectSite(site)}
                            className={`w-full text-left px-3 py-2.5 rounded-lg border transition text-xs ${
                              isSelected
                                ? 'bg-[#2F5B58] text-white border-[#2F5B58]'
                                : 'bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-600 hover:border-[#2F5B58]/40'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-semibold ${isSelected ? 'text-white' : 'text-gray-800 dark:text-slate-100'}`}>
                                  {site['Nom Adresse'] || `Site ${i + 1}`}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                                  {[site['Ligne adresse 1'], site['Code postal'], site['Ville']].filter(Boolean).join(' · ')}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {site['SIRET'] && (
                                  <p className={`text-[10px] font-mono ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                    SIRET {site['SIRET']}
                                  </p>
                                )}
                                {site['Courriel'] && (
                                  <p className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                    {site['Courriel']}
                                  </p>
                                )}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ── Champs remplis ── */}
              {form.titulaire_nom && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
                  <div>
                    <Label>Nom (auto)</Label>
                    <Input value={form.titulaire_nom} onChange={v => set('titulaire_nom', v)} />
                  </div>
                  <div>
                    <Label>SIRET (auto)</Label>
                    <Input value={form.titulaire_siret} onChange={v => set('titulaire_siret', v)} />
                  </div>
                  <div>
                    <Label>Adresse (auto)</Label>
                    <Input value={form.titulaire_adresse} onChange={v => set('titulaire_adresse', v)} />
                  </div>
                  <div>
                    <Label>E-mail (auto)</Label>
                    <Input value={form.titulaire_email} onChange={v => set('titulaire_email', v)} />
                  </div>
                </div>
              )}
            </div>
          </FullWidth>
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
          {/* Oui / Non — incidence financière */}
          <FullWidth>
            <Label>L'avenant a une incidence financière sur le montant du marché public</Label>
            <div className="flex gap-4 mt-1">
              {(['Oui', 'Non'] as const).map(opt => {
                const checked = opt === 'Oui' ? form.incidence_financiere : !form.incidence_financiere;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set('incidence_financiere', opt === 'Oui')}
                    className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition font-medium ${
                      checked
                        ? 'bg-[#2F5B58] text-white border-[#2F5B58]'
                        : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-slate-300 border-gray-200 dark:border-slate-600 hover:border-[#2F5B58]/40'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${checked ? 'border-white' : 'border-gray-400'}`}>
                      {checked && <span className="w-2 h-2 bg-white rounded-sm block" />}
                    </span>
                    {opt}
                  </button>
                );
              })}
            </div>
          </FullWidth>

          {form.incidence_financiere && (
            <>
              <div>
                <Label>Montant initial HT (€)</Label>
                <MoneyInput value={form.montant_initial_ht} onChange={v => set('montant_initial_ht', v)} />
              </div>
              <div>
                <Label>Montant précédent HT (€)</Label>
                <MoneyInput value={form.montant_precedent_ht} onChange={v => set('montant_precedent_ht', v)} />
                <p className="text-[10px] text-gray-400 mt-1">Montant du marché après le dernier avenant</p>
              </div>
              <div>
                <Label required>Montant avenant HT (€)</Label>
                <MoneyInput value={form.montant_avenant_ht} onChange={v => set('montant_avenant_ht', v)} />
                <p className="text-[10px] text-gray-400 mt-1">Négatif si diminution</p>
              </div>
              <div>
                <Label>Taux de TVA</Label>
                <Input value={form.taux_tva} onChange={v => set('taux_tva', v)} placeholder="20.0%" />
              </div>
              <div>
                <Label>Montant avenant TTC (calculé)</Label>
                <div className="px-3 py-2 text-sm font-semibold text-gray-700 dark:text-slate-200 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg">
                  {(() => {
                    const tva = parseFloat((form.taux_tva || '20').replace('%', '').trim()) / 100;
                    return formatMontant((form.montant_avenant_ht ?? 0) * (1 + tva));
                  })()}
                </div>
              </div>
              <div>
                <Label>Nouveau montant total HT (calculé)</Label>
                <div className="px-3 py-2 text-sm font-bold text-[#2F5B58] bg-[#2F5B58]/5 border border-[#2F5B58]/20 rounded-lg">
                  {formatMontant(montantNouveau)}
                </div>
              </div>
              <div>
                <Label>% avenant en cours / montant initial (calculé)</Label>
                <div className={`px-3 py-2 text-sm font-bold rounded-lg border ${
                  (pctAvenantCourant ?? 0) >= 0
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {pctAvenantCourant !== null
                    ? `${pctAvenantCourant >= 0 ? '+' : ''}${pctAvenantCourant.toFixed(2)} %`
                    : '—'}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Avenant courant / montant initial du marché</p>
              </div>
              <div>
                <Label>% cumulé tous avenants / montant initial (calculé)</Label>
                <div className={`px-3 py-2 text-sm font-bold rounded-lg border ${
                  (pctCumule ?? 0) >= 0
                    ? 'text-blue-700 bg-blue-50 border-blue-200'
                    : 'text-red-700 bg-red-50 border-red-200'
                }`}>
                  {pctCumule !== null
                    ? `${pctCumule >= 0 ? '+' : ''}${pctCumule.toFixed(2)} %`
                    : '—'}
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Cumul de tous les avenants / montant initial</p>
              </div>

              {/* ── Historique des avenants du contrat ── */}
              {(loadingHistorique || historiqueAvenants.length > 0) && (
                <FullWidth>
                  <div className="mt-2 border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between">
                      <p className="text-xs font-bold text-gray-700 dark:text-slate-200">
                        Historique des avenants — {form.contrat_reference}
                      </p>
                      {loadingHistorique && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#2F5B58]" />}
                    </div>
                    {historiqueAvenants.length === 0 && !loadingHistorique ? (
                      <p className="px-4 py-3 text-xs text-gray-400 italic">Aucun avenant précédent pour ce contrat</p>
                    ) : (
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
                            <th className="px-4 py-2 text-left font-semibold text-gray-500">N°</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Montant avenant HT</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-500">% / initial</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-500">Statut</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historiqueAvenants.map((a, i) => {
                            const pct = form.montant_initial_ht
                              ? (a.montant_avenant_ht ?? 0) / form.montant_initial_ht * 100
                              : null;
                            return (
                              <tr key={a.id || i} className="border-b border-gray-100 dark:border-slate-700 last:border-0">
                                <td className="px-4 py-2 font-bold text-[#2F5B58]">Av. {a.numero_avenant ?? i + 1}</td>
                                <td className={`px-4 py-2 font-semibold ${(a.montant_avenant_ht ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {(a.montant_avenant_ht ?? 0) >= 0 ? '+' : ''}{formatMontant(a.montant_avenant_ht)}
                                </td>
                                <td className={`px-4 py-2 ${pct !== null && pct >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                  {pct !== null ? `${pct >= 0 ? '+' : ''}${pct.toFixed(2)} %` : '—'}
                                </td>
                                <td className="px-4 py-2">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${a.statut === 'valide' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                                    {a.statut === 'valide' ? 'Validé' : 'Brouillon'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                          {/* Ligne avenant en cours */}
                          {form.montant_avenant_ht !== null && (
                            <tr className="bg-[#2F5B58]/5 border-t-2 border-[#2F5B58]/30">
                              <td className="px-4 py-2 font-bold text-[#2F5B58]">Av. {form.numero_avenant ?? '?'} (en cours)</td>
                              <td className={`px-4 py-2 font-bold ${(form.montant_avenant_ht ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {(form.montant_avenant_ht ?? 0) >= 0 ? '+' : ''}{formatMontant(form.montant_avenant_ht)}
                              </td>
                              <td className={`px-4 py-2 font-bold ${(pctAvenantCourant ?? 0) >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                                {pctAvenantCourant !== null ? `${pctAvenantCourant >= 0 ? '+' : ''}${pctAvenantCourant.toFixed(2)} %` : '—'}
                              </td>
                              <td className="px-4 py-2 text-gray-400 italic text-[10px]">en saisie</td>
                            </tr>
                          )}
                          {/* Ligne cumul */}
                          {pctCumule !== null && (
                            <tr className="bg-[#2F5B58]/10 font-bold">
                              <td className="px-4 py-2 text-gray-700 dark:text-slate-200" colSpan={2}>Cumul total des avenants</td>
                              <td className={`px-4 py-2 ${pctCumule >= 0 ? 'text-blue-700' : 'text-red-700'}`} colSpan={2}>
                                {pctCumule >= 0 ? '+' : ''}{pctCumule.toFixed(2)} %
                                <span className="ml-2 text-gray-500 font-normal">({formatMontant(montantCumule)})</span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </FullWidth>
              )}
            </>
          )}
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
            <div className="flex items-center gap-2 mb-1">
              <label className="text-xs font-semibold text-gray-600 dark:text-slate-400">Numéro d'avenant <span className="text-red-500">*</span></label>
              {form.contrat_reference && (
                <span className="text-[9px] px-1.5 py-0.5 bg-[#2F5B58]/10 text-[#2F5B58] rounded font-medium">
                  auto — modifiable
                </span>
              )}
            </div>
            <NumberInput value={form.numero_avenant} onChange={v => set('numero_avenant', v)} placeholder="Ex : 2" />
            {form.contrat_reference && (
              <p className="text-[10px] text-gray-400 mt-1">
                Calculé depuis les {historiqueAvenants.length} avenant(s) existant(s) pour ce contrat
              </p>
            )}
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
