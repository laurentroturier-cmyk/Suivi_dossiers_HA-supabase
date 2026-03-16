// ============================================
// AvenantTransfertForm — Formulaire de saisie
// Avenant de transfert (art. R2194-6 2° CCP)
// ============================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft, Save, Eye, ChevronDown, ChevronUp,
  Briefcase, Users, Building2, FileSignature, PenLine,
  Loader2, Search, Edit3,
} from 'lucide-react';
import type { AvenantTransfertData } from '../types';
import { AVENANT_TRANSFERT_EMPTY } from '../types';
import { AvenantTransfertPreview } from './AvenantTransfertPreview';
import { exportAvenantTransfertPdf } from '../utils/avenantTransfertPdfExport';
import { supabase } from '../../../lib/supabase';

// ─── Composants UI (identiques à AvenantForm) ────────────────────────────────

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400 mb-1">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function Input({ value, onChange, placeholder, type = 'text', disabled = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full px-3 py-2 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] transition ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
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
        className="w-full flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 transition rounded-xl"
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

interface AvenantTransfertFormProps {
  initial?: Partial<AvenantTransfertData>;
  onBack: () => void;
  onSaved: (saved: AvenantTransfertData) => void;
}

export function AvenantTransfertForm({ initial, onBack, onSaved }: AvenantTransfertFormProps) {
  const [form, setForm] = useState<AvenantTransfertData>({
    ...AVENANT_TRANSFERT_EMPTY,
    ...initial,
  });
  const [saving, setSaving]           = useState(false);
  const [savedMsg, setSavedMsg]       = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Recherche contrat
  const [contratSearch, setContratSearch]     = useState(form.contrat_reference || '');
  const [contratResults, setContratResults]   = useState<any[]>([]);
  const [contratsLoading, setContratsLoading] = useState(false);
  const [showContratList, setShowContratList] = useState(false);
  const contratBoxRef = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const set = useCallback(<K extends keyof AvenantTransfertData>(key: K, value: AvenantTransfertData[K]) => {
    setForm(f => ({ ...f, [key]: value }));
  }, []);

  // ── Recherche TBL_Contrats (debounce 300ms) ────────────────────────────────
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
          .or(`"Agreement Number".ilike.%${q}%,"Supplier".ilike.%${q}%,"Description".ilike.%${q}%`)
          .limit(20);
        if (!error) setContratResults(data || []);
      } finally {
        setContratsLoading(false);
      }
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [contratSearch]);

  // Fermer dropdown si clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (contratBoxRef.current && !contratBoxRef.current.contains(e.target as Node))
        setShowContratList(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Sélection d'un contrat ────────────────────────────────────────────────
  const handleSelectContrat = (c: any) => {
    const supplier = c['Supplier'] || '';
    setForm(f => ({
      ...f,
      contrat_reference:              c['Agreement Number']  || '',
      contrat_libelle:                c['Description']       || '',
      date_notification:              c['Date notification'] || null,
      // pré-remplir l'ancien titulaire depuis le titulaire du contrat
      ancien_titulaire_denomination:  f.ancien_titulaire_denomination || supplier,
    }));
    setContratSearch(c['Agreement Number'] || '');
    setShowContratList(false);
  };

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const sanitize = (d: string | null | undefined) => d ? d.split('T')[0] : null;
      const payload = {
        ...form,
        date_notification: sanitize(form.date_notification),
        date_accord_afpa:  sanitize(form.date_accord_afpa),
        date_prise_effet:  sanitize(form.date_prise_effet),
        updated_at: new Date().toISOString(),
      };
      delete (payload as any).id;

      let result: AvenantTransfertData;
      if (form.id) {
        const { data, error } = await supabase
          .from('avenants_transfert')
          .update(payload)
          .eq('id', form.id)
          .select()
          .single();
        if (error) throw error;
        result = data as AvenantTransfertData;
      } else {
        const { data, error } = await supabase
          .from('avenants_transfert')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        result = data as AvenantTransfertData;
      }
      setForm(result);
      onSaved(result);
      setSavedMsg('Enregistré avec succès.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch (err: any) {
      setSavedMsg('Erreur : ' + (err.message || 'inconnue'));
      setTimeout(() => setSavedMsg(''), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try { await exportAvenantTransfertPdf(form); } finally { setIsExporting(false); }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900">

      {/* ── Barre d'action sticky ────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 shadow-sm px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#2F5B58] transition"
            >
              <ArrowLeft className="w-4 h-4" /> Retour
            </button>
            <div className="h-5 w-px bg-gray-200" />
            <div>
              <span className="text-sm font-bold text-gray-800 dark:text-slate-100">
                Avenant de transfert{form.numero_avenant != null ? ` N° ${form.numero_avenant}` : ''}
              </span>
              {form.contrat_reference && (
                <span className="ml-2 text-xs text-gray-400">{form.contrat_reference}</span>
              )}
            </div>
            {/* Badge type */}
            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wide">
              Transfert
            </span>
          </div>
          <div className="flex items-center gap-2">
            {savedMsg && (
              <span className={`text-xs px-3 py-1.5 rounded-full font-medium ${
                savedMsg.startsWith('Erreur') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
              }`}>{savedMsg}</span>
            )}
            <button
              onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
            >
              <Eye className="w-4 h-4" /> Aperçu
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white text-sm font-medium rounded-lg hover:bg-[#254845] disabled:opacity-50 transition"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Corps du formulaire ───────────────────────────────────────────────── */}
      <div className="flex-1 px-6 py-6 max-w-5xl mx-auto w-full space-y-0">

        {/* ═══ Section : En-tête ════════════════════════════════════════════════ */}
        <Section icon={PenLine} title="En-tête">
          <div>
            <Label required>Référence de la demande</Label>
            <Input value={form.demande} onChange={v => set('demande', v)} placeholder="ex : 23333-8-Transfert 1" />
          </div>
          <div>
            <Label>Demandeur</Label>
            <Input value={form.demandeur} onChange={v => set('demandeur', v)} placeholder="Nom du demandeur" />
          </div>
          <div>
            <Label>N° d'avenant</Label>
            <input
              type="number"
              value={form.numero_avenant ?? ''}
              onChange={e => set('numero_avenant', e.target.value === '' ? null : parseInt(e.target.value))}
              placeholder="Calculé automatiquement"
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] focus:outline-none"
            />
          </div>
          <div>
            <Label>Rédigé par</Label>
            <Input value={form.redige_par} onChange={v => set('redige_par', v)} placeholder="Prénom Nom" />
          </div>
          <div>
            <Label>Statut</Label>
            <select
              value={form.statut}
              onChange={e => set('statut', e.target.value as 'brouillon' | 'valide')}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] focus:outline-none"
            >
              <option value="brouillon">Brouillon</option>
              <option value="valide">Validé</option>
            </select>
          </div>
        </Section>

        {/* ═══ Section : Contrat ════════════════════════════════════════════════ */}
        <Section icon={Briefcase} title="Contrat">
          <FullWidth>
            <Label required>Rechercher un contrat</Label>
            <div ref={contratBoxRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={contratSearch}
                  onChange={e => { setContratSearch(e.target.value); setShowContratList(true); }}
                  onFocus={() => setShowContratList(true)}
                  placeholder="Numéro de marché, fournisseur, objet…"
                  className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#2F5B58]/40 focus:border-[#2F5B58] focus:outline-none"
                />
                {contratsLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 animate-spin" />
                )}
              </div>
              {showContratList && contratResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-30 max-h-64 overflow-y-auto">
                  {contratResults.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSelectContrat(c)}
                      className="w-full text-left px-4 py-3 hover:bg-[#e8f4f3] border-b border-gray-50 last:border-0 transition"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#2F5B58]">{c['Agreement Number']}</span>
                        <span className="text-[10px] text-gray-400">{c['Supplier']}</span>
                      </div>
                      <div className="text-[11px] text-gray-600 mt-0.5 truncate">{c['Description']}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </FullWidth>
          <div>
            <Label>Objet du marché</Label>
            <Input value={form.contrat_libelle} onChange={v => set('contrat_libelle', v)} placeholder="Description du marché" />
          </div>
          <div>
            <Label>Date de notification</Label>
            <Input type="date" value={form.date_notification || ''} onChange={v => set('date_notification', v || null)} />
          </div>
        </Section>

        {/* ═══ Section : A — Parties ════════════════════════════════════════════ */}
        <Section icon={Edit3} title="A — Pouvoir adjudicateur (pré-rempli)">
          <FullWidth>
            <div className="p-3 bg-[#e8f4f3] border border-[#a7d4d1] rounded-lg text-xs text-[#1e3d3b]">
              <strong>Personne publique contractante :</strong> Afpa — Agence nationale pour la Formation Professionnelle des Adultes<br />
              <strong>Conducteur de l'opération :</strong> Direction Nationale des Achats / Afpa - CITYSCOPE — 3 rue Franklin, 93100 MONTREUIL
            </div>
          </FullWidth>
          <div>
            <Label>Titre du responsable du contrat</Label>
            <Input value={form.responsable_contrat_titre} onChange={v => set('responsable_contrat_titre', v)} />
          </div>
          <div>
            <Label>Nom du responsable du contrat</Label>
            <Input value={form.responsable_contrat_nom} onChange={v => set('responsable_contrat_nom', v)} placeholder="ex : Mme Pascale d'ARTOIS" />
          </div>
        </Section>

        {/* ═══ Section : Nouveau Titulaire ══════════════════════════════════════ */}
        <Section icon={Users} title="Nouveau Titulaire">
          <div>
            <Label required>Dénomination</Label>
            <Input value={form.nouveau_titulaire_denomination} onChange={v => set('nouveau_titulaire_denomination', v)} placeholder="ex : STIMULUS" />
          </div>
          <div>
            <Label>Forme juridique</Label>
            <Input value={form.nouveau_titulaire_forme_juridique} onChange={v => set('nouveau_titulaire_forme_juridique', v)} placeholder="ex : Société par actions simplifiée" />
          </div>
          <div>
            <Label>N° RCS</Label>
            <Input value={form.nouveau_titulaire_rcs} onChange={v => set('nouveau_titulaire_rcs', v)} placeholder="ex : 349 428 995" />
          </div>
          <div>
            <Label>Ville du RCS</Label>
            <Input value={form.nouveau_titulaire_rcs_ville} onChange={v => set('nouveau_titulaire_rcs_ville', v)} placeholder="ex : Paris" />
          </div>
          <FullWidth>
            <Label required>Adresse</Label>
            <Input value={form.nouveau_titulaire_adresse} onChange={v => set('nouveau_titulaire_adresse', v)} placeholder="ex : 28, rue de Mogador, 75009 Paris" />
          </FullWidth>
        </Section>

        {/* ═══ Section : Ancien Titulaire ═══════════════════════════════════════ */}
        <Section icon={Building2} title="Ancien Titulaire (depuis le contrat)" defaultOpen={false}>
          <div>
            <Label>Dénomination</Label>
            <Input value={form.ancien_titulaire_denomination} onChange={v => set('ancien_titulaire_denomination', v)} placeholder="ex : PSYA" />
          </div>
          <div>
            <Label>Forme juridique</Label>
            <Input value={form.ancien_titulaire_forme_juridique} onChange={v => set('ancien_titulaire_forme_juridique', v)} placeholder="ex : Société par actions simplifiée" />
          </div>
          <div>
            <Label>N° RCS</Label>
            <Input value={form.ancien_titulaire_rcs} onChange={v => set('ancien_titulaire_rcs', v)} placeholder="ex : 414 510 027" />
          </div>
          <div>
            <Label>Ville du RCS</Label>
            <Input value={form.ancien_titulaire_rcs_ville} onChange={v => set('ancien_titulaire_rcs_ville', v)} placeholder="ex : Paris" />
          </div>
          <FullWidth>
            <Label>Adresse</Label>
            <Input value={form.ancien_titulaire_adresse} onChange={v => set('ancien_titulaire_adresse', v)} placeholder="ex : 28, rue de Mogador, 75009 Paris" />
          </FullWidth>
        </Section>

        {/* ═══ Section : B — Objet ══════════════════════════════════════════════ */}
        <Section icon={FileSignature} title="B — Objet de l'avenant">
          <div>
            <Label>Nature de l'opération</Label>
            <Input value={form.nature_operation} onChange={v => set('nature_operation', v)} placeholder="ex : Fusion Absorption" />
          </div>
          <div>
            <Label>Date de l'accord préalable Afpa</Label>
            <Input type="date" value={form.date_accord_afpa || ''} onChange={v => set('date_accord_afpa', v || null)} />
          </div>
          <div>
            <Label>Date de prise d'effet (Art. 3)</Label>
            <Input type="date" value={form.date_prise_effet || ''} onChange={v => set('date_prise_effet', v || null)} />
          </div>
          <FullWidth>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800">
              Les textes des Articles 1, 2, 4 et 5 sont générés automatiquement dans le PDF et
              l'aperçu à partir des données saisies dans les sections ci-dessus.
            </div>
          </FullWidth>
        </Section>

        {/* ═══ Section : Signatures ═════════════════════════════════════════════ */}
        <Section icon={PenLine} title="Signatures">
          <div>
            <Label>Signataire Afpa — Nom</Label>
            <Input value={form.signataire_afpa_nom} onChange={v => set('signataire_afpa_nom', v)} placeholder="Nom du signataire" />
          </div>
          <div>
            <Label>Signataire Afpa — Titre</Label>
            <Input value={form.signataire_afpa_titre} onChange={v => set('signataire_afpa_titre', v)} placeholder="ex : Direction Nationale des Achats" />
          </div>
        </Section>

      </div>

      {/* ── Aperçu modal ─────────────────────────────────────────────────────── */}
      {showPreview && (
        <AvenantTransfertPreview
          data={form}
          onClose={() => setShowPreview(false)}
          onExport={handleExport}
          isExporting={isExporting}
        />
      )}
    </div>
  );
}
