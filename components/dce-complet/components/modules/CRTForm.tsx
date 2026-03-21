/**
 * CRTForm.tsx
 * Cadre de Réponse Technique — éditeur complet
 *
 * Fonctionnalités :
 *  - Template par défaut basé sur le modèle AAXXX_05_CRT.docx
 *  - Édition en-tête (référence, objet, soumissionnaire, répartition)
 *  - Édition sections / sous-sections (titre, points, réponse)
 *  - Import Word (.docx) et PDF
 *  - Export PDF stylisé
 *  - Prévisualisation HTML fidèle au PDF
 *  - Sauvegarde Supabase
 *  - Pré-remplissage depuis variables DCE (configurationGlobale)
 */

import React, { useState, useRef, useCallback, useId } from 'react';
import {
  Save, Download, Upload, Plus, Trash2, ChevronDown, ChevronRight,
  FileText, AlertCircle, CheckCircle2, Info, Pencil, X, Eye,
  FileUp,
} from 'lucide-react';
import type {
  CRTData, CRTSection, CRTSousSection, ConfigurationGlobale,
} from '../../types';
import {
  DEFAULT_CRT_TEMPLATE,
  exportCRTPDF,
  importCRTFromWord,
  importCRTFromPDF,
} from './crtUtils';

// ─── Props ────────────────────────────────────────────────────────────────────

interface CRTFormProps {
  data: CRTData | null;
  onSave: (data: CRTData) => Promise<void>;
  isSaving?: boolean;
  configurationGlobale?: ConfigurationGlobale | null;
  numeroProcedure?: string;
  /** Référence complète de la procédure ex: 25006_AOO_TMA-EPM_LAY */
  procedureRefComplete?: string;
  titreMarche?: string;
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

function buildDefault(
  numeroProcedure?: string,
  configurationGlobale?: ConfigurationGlobale | null,
  titreMarche?: string,
): CRTData {
  const titre  = titreMarche || configurationGlobale?.informationsGenerales?.titreMarche || DEFAULT_CRT_TEMPLATE.objetMarche;
  const numRef = numeroProcedure || '';
  const type   = configurationGlobale?.informationsGenerales?.typeProcedure || '';
  // Référence construite depuis les variables DCE disponibles
  const ref = numRef ? `${numRef}${type ? `_${type}` : ''}` : DEFAULT_CRT_TEMPLATE.reference;

  return {
    ...DEFAULT_CRT_TEMPLATE,
    reference:   ref,
    objetMarche: titre,
    sections: DEFAULT_CRT_TEMPLATE.sections.map(s => ({
      ...s,
      sousSections: s.sousSections.map(ss => ({ ...ss })),
    })),
  };
}

/**
 * Détecte si la donnée reçue est à l'ancien format {contenu, notes}
 * et la remplace par un template propre construit depuis les variables DCE.
 */
function resolveInitialData(
  data: CRTData | null,
  numeroProcedure?: string,
  configurationGlobale?: ConfigurationGlobale | null,
  titreMarche?: string,
): CRTData {
  // Ancien format (avant refonte) — champ `contenu` au lieu de `sections`
  if (!data || !('sections' in data) || !(data as CRTData).sections) {
    return buildDefault(numeroProcedure, configurationGlobale, titreMarche);
  }
  // Données existantes : on surcharge seulement si les champs clés sont vides
  const base = buildDefault(numeroProcedure, configurationGlobale, titreMarche);
  return {
    ...data,
    objetMarche: data.objetMarche && data.objetMarche !== DEFAULT_CRT_TEMPLATE.objetMarche
      ? data.objetMarche
      : base.objetMarche,
    reference: data.reference && data.reference !== DEFAULT_CRT_TEMPLATE.reference
      ? data.reference
      : base.reference,
  };
}

// ─── Petit compteur d'ID unique ───────────────────────────────────────────────

let _uid = 0;
const uid = () => String(++_uid);

// ─── Composant principal ──────────────────────────────────────────────────────

export function CRTForm({
  data,
  onSave,
  isSaving = false,
  configurationGlobale,
  numeroProcedure,
  procedureRefComplete,
  titreMarche,
}: CRTFormProps) {
  // Référence affichable : numéro long si disponible, sinon court
  const displayRef = procedureRefComplete || numeroProcedure || '';
  const [form, setForm] = useState<CRTData>(
    () => resolveInitialData(data, procedureRefComplete || numeroProcedure, configurationGlobale, titreMarche),
  );
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['1']));
  const [editingHeader, setEditingHeader] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [saveStatus, setSaveStatus]   = useState<'idle'|'saving'|'success'|'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalSections = form.sections.length;
  const totalPoints   = form.sections.reduce((s, sec) => s + (sec.points || 0), 0);

  // ── Toggle section ────────────────────────────────────────────────────────

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Header ────────────────────────────────────────────────────────────────

  const updateHeader = (field: keyof CRTData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // ── Sections ──────────────────────────────────────────────────────────────

  const updateSection = (si: number, field: keyof CRTSection, value: string | number) => {
    setForm(prev => {
      const sections = [...prev.sections];
      sections[si] = { ...sections[si], [field]: value };
      return { ...prev, sections };
    });
  };

  const addSection = () => {
    setForm(prev => {
      const n = prev.sections.length + 1;
      const id = uid();
      const newSec: CRTSection = {
        id,
        ref: String(n),
        titre: '',
        points: 0,
        sousSections: [{ id: uid(), ref: `${n}.1`, titre: '', reponse: '' }],
      };
      setExpandedSections(s => new Set(s).add(id));
      return { ...prev, sections: [...prev.sections, newSec] };
    });
  };

  const removeSection = (si: number) => {
    setForm(prev => ({ ...prev, sections: prev.sections.filter((_, i) => i !== si) }));
  };

  // ── Sous-sections ─────────────────────────────────────────────────────────

  const updateSousSec = (si: number, ssi: number, field: keyof CRTSousSection, value: string) => {
    setForm(prev => {
      const sections = [...prev.sections];
      const sousSections = [...sections[si].sousSections];
      sousSections[ssi] = { ...sousSections[ssi], [field]: value };
      sections[si] = { ...sections[si], sousSections };
      return { ...prev, sections };
    });
  };

  const addSousSec = (si: number) => {
    setForm(prev => {
      const sections = [...prev.sections];
      const subs = sections[si].sousSections;
      const lastNum = subs.length > 0
        ? (parseInt(subs[subs.length - 1].ref.split('.')[1] || '0', 10))
        : 0;
      const newRef = `${sections[si].ref}.${lastNum + 1}`;
      sections[si] = {
        ...sections[si],
        sousSections: [...subs, { id: uid(), ref: newRef, titre: '', reponse: '' }],
      };
      return { ...prev, sections };
    });
  };

  const removeSousSec = (si: number, ssi: number) => {
    setForm(prev => {
      const sections = [...prev.sections];
      sections[si] = {
        ...sections[si],
        sousSections: sections[si].sousSections.filter((_, i) => i !== ssi),
      };
      return { ...prev, sections };
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    setSaveStatus('saving');
    try {
      await onSave({ ...form, savedAt: new Date().toISOString() });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  }, [form, onSave]);

  // ── Export PDF ────────────────────────────────────────────────────────────

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      await exportCRTPDF(form, undefined, displayRef);
    } catch (err) {
      console.error('Export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Import ────────────────────────────────────────────────────────────────

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    try {
      let partial: Partial<CRTData>;
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (ext === 'docx' || ext === 'doc') {
        partial = await importCRTFromWord(file);
      } else if (ext === 'pdf') {
        partial = await importCRTFromPDF(file);
      } else {
        setImportError('Format non supporté. Utilisez un fichier .docx ou .pdf');
        return;
      }

      // Fusion avec le formulaire actuel
      setForm(prev => {
        const merged: CRTData = {
          ...prev,
          reference:       partial.reference       || prev.reference,
          objetMarche:     partial.objetMarche      || prev.objetMarche,
          introduction:    partial.introduction     || prev.introduction,
          partFinanciere:  partial.partFinanciere   ?? prev.partFinanciere,
          partTechnique:   partial.partTechnique    ?? prev.partTechnique,
          sections:        (partial.sections && partial.sections.length > 0)
                             ? partial.sections
                             : prev.sections,
        };
        return merged;
      });
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 3000);
    } catch (err: any) {
      setImportError(`Erreur lors de l'import : ${err?.message ?? 'inconnue'}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Rendu ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">

      {/* ── Barre d'outils ── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 pb-3 flex flex-wrap items-center gap-2">
        {/* Statistiques */}
        <div className="flex gap-3 mr-auto flex-wrap">
          <Stat label="Sections" value={totalSections} />
          {totalPoints > 0 && <Stat label="Points" value={totalPoints} />}
        </div>

        {/* Actions */}
        <button type="button" onClick={() => fileInputRef.current?.click()}
          className="btn-tool">
          <FileUp className="w-3.5 h-3.5" /> Importer
        </button>
        <input ref={fileInputRef} type="file" accept=".docx,.doc,.pdf" className="hidden" onChange={handleImport} />

        <button type="button" onClick={() => setShowPreview(true)} className="btn-tool">
          <Eye className="w-3.5 h-3.5" /> Prévisualiser
        </button>

        <button type="button" onClick={handleExportPDF} disabled={isExporting}
          className="btn-tool text-red-700 border-red-200 hover:bg-red-50">
          <Download className="w-3.5 h-3.5" />
          {isExporting ? 'Export...' : 'Exporter PDF'}
        </button>

        <button type="button" onClick={handleSave}
          disabled={isSaving || saveStatus === 'saving'}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-sm bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-sm">
          <Save className="w-3.5 h-3.5" />
          {saveStatus === 'saving' ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>

        {saveStatus === 'success' && (
          <span className="flex items-center gap-1 text-xs text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> Sauvegardé
          </span>
        )}
        {saveStatus === 'error' && (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" /> Erreur
          </span>
        )}
      </div>

      {/* Notifications import */}
      {importError && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {importError}
          <button onClick={() => setImportError(null)} className="ml-auto"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {importSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> Document importé avec succès. Vérifiez et complétez les sections.
        </div>
      )}

      {/* ── En-tête du document ── */}
      <section className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between bg-gradient-to-r from-[#1A3330] to-[#2F5B58] px-4 py-3">
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-4 h-4" />
            <span className="text-sm font-semibold">En-tête du document</span>
          </div>
          <button type="button" onClick={() => setEditingHeader(!editingHeader)}
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white">
            <Pencil className="w-3 h-3" /> {editingHeader ? 'Fermer' : 'Modifier'}
          </button>
        </div>

        {editingHeader ? (
          <div className="p-4 space-y-4 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Référence procédure">
                <input value={form.reference}
                  onChange={e => updateHeader('reference', e.target.value)}
                  className="input-sm" placeholder="AAXXX_XX_XX-XX_XXX" />
              </Field>
              <Field label="Nom du soumissionnaire">
                <input value={form.nomSoumissionnaire}
                  onChange={e => updateHeader('nomSoumissionnaire', e.target.value)}
                  className="input-sm" placeholder="Raison sociale de l'entreprise" />
              </Field>
            </div>
            <Field label="Objet du marché">
              <input value={form.objetMarche}
                onChange={e => updateHeader('objetMarche', e.target.value)}
                className="input-sm" placeholder="Description du marché" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Nb pages max (hors annexes)">
                <input type="number" value={form.nbPagesMax}
                  onChange={e => updateHeader('nbPagesMax', parseInt(e.target.value) || 30)}
                  className="input-sm" min={1} />
              </Field>
              <Field label="Part financière (%)">
                <input type="number" value={form.partFinanciere}
                  onChange={e => updateHeader('partFinanciere', parseInt(e.target.value) || 0)}
                  className="input-sm" min={0} max={100} />
              </Field>
              <Field label="Part technique (%)">
                <input type="number" value={form.partTechnique}
                  onChange={e => updateHeader('partTechnique', parseInt(e.target.value) || 0)}
                  className="input-sm" min={0} max={100} />
              </Field>
            </div>
          </div>
        ) : (
          <div className="px-4 py-3 bg-white space-y-1">
            <p className="text-xs text-gray-400 font-mono">{form.reference}</p>
            <p className="text-sm font-semibold text-gray-800">{form.objetMarche}</p>
            {form.nomSoumissionnaire ? (
              <p className="text-xs text-gray-600">Soumissionnaire : <span className="font-medium">{form.nomSoumissionnaire}</span></p>
            ) : (
              <p className="text-xs text-amber-500 italic">Soumissionnaire : non renseigné</p>
            )}
            {(form.partFinanciere > 0 || form.partTechnique > 0) && (
              <p className="text-xs text-gray-500">
                Financier : {form.partFinanciere} %  &nbsp;|&nbsp;  Technique : {form.partTechnique} %
              </p>
            )}
          </div>
        )}
      </section>

      {/* ── Introduction ── */}
      <section className="rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center gap-2 bg-[#2F5B58] px-4 py-2.5">
          <Info className="w-4 h-4 text-white/80" />
          <span className="text-sm font-semibold text-white">Introduction</span>
          <span className="ml-auto text-xs text-white/60">Texte contractuel — modifiable</span>
        </div>
        <div className="p-3 bg-sky-50 border-b border-sky-100">
          <p className="text-xs text-sky-700 italic">
            Ce texte est affiché en préambule du CRT. Il encadre les obligations du soumissionnaire.
          </p>
        </div>
        <div className="p-3 bg-white">
          <textarea
            value={form.introduction}
            onChange={e => updateHeader('introduction', e.target.value)}
            rows={6}
            className="w-full text-xs text-gray-700 border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#2F5B58] resize-y leading-relaxed"
          />
        </div>
      </section>

      {/* ── Sections ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">Sections du cadre</h3>
          <button type="button" onClick={addSection}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs text-[#2F5B58] border border-[#2F5B58] rounded-lg hover:bg-[#2F5B58] hover:text-white transition">
            <Plus className="w-3 h-3" /> Ajouter une section
          </button>
        </div>

        {form.sections.map((section, si) => {
          const isOpen = expandedSections.has(section.id);
          const ssTotal = section.sousSections.length;

          return (
            <div key={section.id} className="rounded-xl border border-gray-200 overflow-hidden">
              {/* Header section */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 cursor-pointer hover:bg-gray-100 transition"
                onClick={() => toggleSection(section.id)}
              >
                <div className="text-gray-400">
                  {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </div>
                {/* Ref */}
                <span className="text-xs font-mono font-bold text-[#2F5B58] bg-[#E8F2F1] px-2 py-0.5 rounded">
                  {section.ref}
                </span>
                {/* Titre éditable */}
                <input
                  value={section.titre}
                  onChange={e => { e.stopPropagation(); updateSection(si, 'titre', e.target.value); }}
                  onClick={e => e.stopPropagation()}
                  placeholder="Intitulé de la section…"
                  className="flex-1 text-sm font-semibold text-gray-800 bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-[#2F5B58] rounded px-1 py-0.5 min-w-0"
                />
                {/* Points */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <input
                    type="number"
                    value={section.points || ''}
                    onChange={e => { e.stopPropagation(); updateSection(si, 'points', parseInt(e.target.value) || 0); }}
                    onClick={e => e.stopPropagation()}
                    placeholder="0"
                    min={0}
                    className="w-16 text-center text-xs border border-gray-200 rounded px-1 py-0.5 focus:ring-1 focus:ring-[#2F5B58]"
                  />
                  <span className="text-xs text-gray-400">pts</span>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">{ssTotal} rubrique{ssTotal > 1 ? 's' : ''}</span>
                <button type="button" onClick={e => { e.stopPropagation(); removeSection(si); }}
                  className="p-1 text-gray-300 hover:text-red-500 flex-shrink-0 transition">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Corps section — sous-sections */}
              {isOpen && (
                <div className="p-3 space-y-3 bg-white">
                  {section.sousSections.map((ss, ssi) => (
                    <div key={ss.id} className="rounded-lg border border-gray-200 overflow-hidden">
                      {/* Header sous-section */}
                      <div className="flex items-center gap-2 px-3 py-2 bg-[#E8F2F1]">
                        <span className="text-xs font-mono font-bold text-[#2F5B58]">{ss.ref}</span>
                        <input
                          value={ss.titre}
                          onChange={e => updateSousSec(si, ssi, 'titre', e.target.value)}
                          placeholder="Titre / consigne de la sous-section…"
                          className="flex-1 text-xs font-medium text-gray-700 bg-transparent border-none outline-none focus:bg-white focus:ring-1 focus:ring-[#2F5B58] rounded px-1 py-0.5"
                        />
                        <button type="button" onClick={() => removeSousSec(si, ssi)}
                          className="p-0.5 text-gray-300 hover:text-red-500 transition flex-shrink-0">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Zone de réponse */}
                      <div className="p-2">
                        <textarea
                          value={ss.reponse}
                          onChange={e => updateSousSec(si, ssi, 'reponse', e.target.value)}
                          placeholder="Réponse libre du soumissionnaire…"
                          rows={4}
                          className="w-full text-xs border border-gray-200 bg-white rounded px-3 py-2 focus:ring-1 focus:ring-[#2F5B58] resize-y leading-relaxed"
                        />
                      </div>
                    </div>
                  ))}

                  <button type="button" onClick={() => addSousSec(si)}
                    className="inline-flex items-center gap-1 text-xs text-[#2F5B58] hover:underline">
                    <Plus className="w-3 h-3" /> Ajouter une sous-section
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Notes internes ── */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes internes (non exportées)</label>
        <textarea
          value={form.notes}
          onChange={e => updateHeader('notes', e.target.value)}
          rows={2}
          className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-[#2F5B58]"
          placeholder="Observations, instructions internes…"
        />
      </div>

      {/* ── Bouton save bas ── */}
      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button type="button" onClick={handleSave}
          disabled={isSaving || saveStatus === 'saving'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-md text-sm">
          <Save className="w-4 h-4" />
          {saveStatus === 'saving' ? 'Sauvegarde…' : 'Sauvegarder dans Supabase'}
        </button>
      </div>

      {/* ── Modal prévisualisation ── */}
      {showPreview && (
        <PreviewModal data={form} procedureRef={displayRef} onClose={() => setShowPreview(false)} onExport={handleExportPDF} />
      )}

      {/* Styles utilitaires inline */}
      <style>{`
        .btn-tool {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 5px 10px; font-size: 12px;
          border: 1px solid #E5E7EB; border-radius: 8px;
          color: #374151; background: #fff;
          cursor: pointer; transition: background 0.15s;
        }
        .btn-tool:hover { background: #F9FAFB; }
        .input-sm {
          width: 100%; border: 1px solid #D1D5DB; border-radius: 6px;
          padding: 5px 10px; font-size: 13px;
          focus: ring; outline: none;
        }
        .input-sm:focus { border-color: #2F5B58; box-shadow: 0 0 0 1px #2F5B58; }
      `}</style>
    </div>
  );
}

// ─── Composants auxiliaires ────────────────────────────────────────────────────

function Stat({ label, value, color = 'text-gray-700' }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="text-center">
      <div className={`text-base font-bold ${color}`}>{value}</div>
      <div className="text-[10px] text-gray-400">{label}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
    </div>
  );
}

// ─── Modal prévisualisation ────────────────────────────────────────────────────

function PreviewModal({ data, procedureRef, onClose, onExport }: { data: CRTData; procedureRef?: string; onClose: () => void; onExport: () => void }) {
  const totalPts = data.sections.reduce((s, sec) => s + (sec.points || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 overflow-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl my-4">
        {/* Toolbar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 sticky top-0 bg-white rounded-t-2xl z-10">
          <span className="text-sm font-semibold text-gray-800">Prévisualisation — Cadre de Réponse Technique</span>
          <div className="flex gap-2">
            <button type="button" onClick={onExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600 hover:bg-red-700 text-white rounded-lg">
              <Download className="w-3.5 h-3.5" /> Exporter PDF
            </button>
            <button type="button" onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Document */}
        <div className="p-6 font-serif" style={{ fontFamily: 'Calibri, Georgia, serif', fontSize: 12 }}>

          {/* Bandeau titre */}
          <div style={{ background: '#1A3330', color: '#fff', padding: '18px 24px', borderRadius: 4, marginBottom: 4 }}>
            <div style={{ fontSize: 20, fontWeight: 'bold', textAlign: 'center', fontFamily: 'Helvetica, Arial, sans-serif' }}>
              CADRE DE RÉPONSE TECHNIQUE
            </div>
            <div style={{ fontSize: 11, textAlign: 'center', marginTop: 8, opacity: 0.9 }}>
              {data.objetMarche}
            </div>
          </div>
          {/* Référence — centrée */}
          <div style={{ background: '#2F5B58', color: '#fff', padding: '6px 24px', textAlign: 'center', fontSize: 9, fontFamily: 'monospace', marginBottom: 12 }}>
            {data.reference}{totalPts > 0 ? `   |   ${totalPts} points` : ''}
          </div>

          {/* Soumissionnaire */}
          <div style={{
            border: `2px solid ${data.nomSoumissionnaire ? '#3D7A75' : '#F9A825'}`,
            background: data.nomSoumissionnaire ? '#E8F2F1' : '#FFFDE7',
            padding: '8px 16px', borderRadius: 4, marginBottom: 12,
            color: data.nomSoumissionnaire ? '#1A3330' : '#E65100',
            fontStyle: data.nomSoumissionnaire ? 'normal' : 'italic',
            fontWeight: data.nomSoumissionnaire ? 'bold' : 'normal',
          }}>
            {data.nomSoumissionnaire || 'Veuillez indiquer le nom du soumissionnaire'}
          </div>


          {/* Répartition */}
          {(data.partFinanciere > 0 || data.partTechnique > 0) && (
            <div style={{ background: '#F9FAFB', padding: '8px 16px', borderRadius: 4, marginBottom: 12, fontSize: 10, border: '1px solid #E5E7EB' }}>
              <strong>Répartition des critères :</strong>
              &nbsp; Proposition financière : {data.partFinanciere} %
              &nbsp;|&nbsp; Valeur technique : {data.partTechnique} %
              {totalPts > 0 && <span style={{ color: '#2F5B58', marginLeft: 12 }}>({totalPts} points au total)</span>}
            </div>
          )}

          {/* Introduction */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ background: '#2F5B58', color: '#fff', fontWeight: 'bold', padding: '6px 12px', borderRadius: '4px 4px 0 0', fontSize: 11 }}>
              Introduction
            </div>
            <div style={{ border: '1px solid #E5E7EB', borderTop: 'none', padding: '10px 14px', fontSize: 9.5, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#374151', background: '#FAFAFA' }}>
              {data.introduction}
            </div>
          </div>

          {/* Sections */}
          {data.sections.map((section) => (
            <div key={section.id} style={{ marginBottom: 16 }}>
              {/* Header section */}
              <div style={{ background: '#2F5B58', color: '#fff', padding: '8px 14px', fontWeight: 'bold', fontSize: 12, display: 'flex', justifyContent: 'space-between', borderRadius: '4px 4px 0 0' }}>
                <span>{section.ref}. {section.titre}</span>
                {section.points > 0 && <span style={{ fontSize: 11, opacity: 0.85 }}>{section.points} pts</span>}
              </div>

              {/* Sous-sections */}
              {section.sousSections.map((ss, ssi) => (
                <div key={ss.id} style={{ border: '1px solid #E5E7EB', borderTop: ssi === 0 ? 'none' : '1px solid #E5E7EB' }}>
                  {/* Sub-header */}
                  <div style={{ background: '#E8F2F1', color: '#1A3330', fontWeight: 'bold', padding: '5px 14px', fontSize: 10 }}>
                    {ss.ref}&nbsp;&nbsp;{ss.titre}
                  </div>
                  {/* Réponse */}
                  <div style={{ padding: '8px 14px', fontSize: 9.5, lineHeight: 1.6, whiteSpace: 'pre-line', color: '#1F2937', minHeight: 30 }}>
                    {ss.reponse || ''}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Pied de page — gauche : titre + n° procédure, droite : page */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, paddingTop: 8, borderTop: '1px solid #E5E7EB', fontSize: 8, color: '#9CA3AF' }}>
            <span>Afpa{procedureRef ? ` — ${procedureRef}` : ''}</span>
            <span>Page 1 / 1</span>
          </div>
        </div>
      </div>
    </div>
  );
}
