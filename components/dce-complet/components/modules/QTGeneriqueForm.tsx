/**
 * QTGeneriqueForm.tsx
 * Questionnaire Technique Générique commun – fidèle au template DNA Excel
 * Fonctionnalités : visualisation, édition, import Excel, export Excel, sauvegarde Supabase
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  Save, Download, Upload, Plus, Trash2, ChevronDown, ChevronRight,
  FileSpreadsheet, AlertCircle, CheckCircle2, Info, Pencil, X, Eye
} from 'lucide-react';
import type { QTGeneriqueData, QTGeneriqueCritere, QTGeneriqueQuestion, ConfigurationGlobale } from '../../types';
import {
  exportQTGeneriqueExcel,
  importQTGeneriqueExcel,
  DEFAULT_QT_GENERIQUE,
} from './qtGeneriqueExcel';

// ─── Props ────────────────────────────────────────────────────────────────────

interface QTGeneriqueFormProps {
  data: QTGeneriqueData | null;
  onSave: (data: QTGeneriqueData) => Promise<void>;
  isSaving?: boolean;
  /** Variables DCE pour pré-remplir l'en-tête */
  configurationGlobale?: ConfigurationGlobale | null;
  numeroProcedure?: string;
  titreMarche?: string;
}

// ─── Valeurs par défaut ───────────────────────────────────────────────────────

function buildDefault(
  numeroProcedure?: string,
  configurationGlobale?: ConfigurationGlobale | null,
  titreMarche?: string,
): QTGeneriqueData {
  const acheteur = configurationGlobale?.informationsGenerales?.acheteur || '';
  const titre = titreMarche || configurationGlobale?.informationsGenerales?.titreMarche || 'Objet de la procédure';
  const premierLot = configurationGlobale?.lots?.[0];
  const lot = premierLot
    ? `Lot ${premierLot.numero} : ${premierLot.intitule}`
    : 'Lot X : XXX';

  return {
    reference: numeroProcedure
      ? `AA_${numeroProcedure}_XXX-XXX_XXX`
      : 'AA_XXX_XXX_XXX-XXX_XXX',
    objetProcedure: titre,
    lot,
    nomSoumissionnaire: '',
    criteres: DEFAULT_QT_GENERIQUE.criteres.map(c => ({ ...c, questions: c.questions.map(q => ({ ...q })) })),
    notes: '',
  };
}

// ─── Types de réponse prédéfinis ──────────────────────────────────────────────

const TYPES_REPONSE = ['Oui / Non', 'Décrire', 'Numérique', 'Date', 'Pourcentage', 'Libre'];

// ─── Composant principal ──────────────────────────────────────────────────────

export function QTGeneriqueForm({
  data,
  onSave,
  isSaving = false,
  configurationGlobale,
  numeroProcedure,
  titreMarche,
}: QTGeneriqueFormProps) {
  const [form, setForm] = useState<QTGeneriqueData>(
    data ?? buildDefault(numeroProcedure, configurationGlobale, titreMarche)
  );
  const [expandedCriteres, setExpandedCriteres] = useState<Set<number>>(new Set([0]));
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [editingHeader, setEditingHeader] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleCritere = (idx: number) => {
    setExpandedCriteres(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });
  };

  const updateHeader = (field: keyof Pick<QTGeneriqueData, 'reference' | 'objetProcedure' | 'lot' | 'nomSoumissionnaire' | 'notes'>, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const updateCritere = (ci: number, field: keyof QTGeneriqueCritere, value: string) => {
    setForm(prev => {
      const criteres = [...prev.criteres];
      criteres[ci] = { ...criteres[ci], [field]: value };
      return { ...prev, criteres };
    });
  };

  const updateQuestion = (ci: number, qi: number, field: keyof QTGeneriqueQuestion, value: string | number) => {
    setForm(prev => {
      const criteres = [...prev.criteres];
      const questions = [...criteres[ci].questions];
      questions[qi] = { ...questions[qi], [field]: value };
      criteres[ci] = { ...criteres[ci], questions };
      return { ...prev, criteres };
    });
  };

  const addQuestion = (ci: number) => {
    setForm(prev => {
      const criteres = [...prev.criteres];
      const c = criteres[ci];
      const lastRef = c.questions[c.questions.length - 1]?.ref || `${ci + 1}.0`;
      const lastNum = parseInt(lastRef.split('.')[1] || '0', 10);
      const newRef = `${ci + 1}.${lastNum + 1}`;
      criteres[ci] = {
        ...c,
        questions: [...c.questions, { ref: newRef, intitule: '', reponseAttendue: 'Décrire', reponseSoumissionnaire: '', points: 0 }],
      };
      return { ...prev, criteres };
    });
  };

  const removeQuestion = (ci: number, qi: number) => {
    setForm(prev => {
      const criteres = [...prev.criteres];
      criteres[ci] = { ...criteres[ci], questions: criteres[ci].questions.filter((_, i) => i !== qi) };
      return { ...prev, criteres };
    });
  };

  const addCritere = () => {
    setForm(prev => {
      const n = prev.criteres.length + 1;
      const newCritere: QTGeneriqueCritere = {
        ref: `Critère ${n}`,
        intitule: '',
        questions: [{ ref: `${n}.1`, intitule: '', reponseAttendue: 'Décrire', reponseSoumissionnaire: '', points: 0 }],
      };
      const criteres = [...prev.criteres, newCritere];
      setExpandedCriteres(s => new Set(s).add(criteres.length - 1));
      return { ...prev, criteres };
    });
  };

  const removeCritere = (ci: number) => {
    if (!confirm(`Supprimer le critère ${form.criteres[ci].ref} et toutes ses questions ?`)) return;
    setForm(prev => ({
      ...prev,
      criteres: prev.criteres.filter((_, i) => i !== ci),
    }));
  };

  // ── Sauvegarde ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      await onSave({ ...form, savedAt: new Date().toISOString() });
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  // ── Export Excel ─────────────────────────────────────────────────────────────

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await exportQTGeneriqueExcel(form);
    } finally {
      setIsExporting(false);
    }
  };

  // ── Import Excel ─────────────────────────────────────────────────────────────

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);
    setImportSuccess(false);

    const result = await importQTGeneriqueExcel(file);
    if (result.success && result.data) {
      setForm(prev => ({
        ...prev,
        ...result.data,
        criteres: result.data!.criteres ?? prev.criteres,
      }));
      setExpandedCriteres(new Set([0]));
      setImportSuccess(true);
      setTimeout(() => setImportSuccess(false), 4000);
    } else {
      setImportError(result.error || 'Erreur lors de l\'import.');
    }
    // reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // ── Calculs ──────────────────────────────────────────────────────────────────

  const totalPoints = form.criteres.reduce(
    (sum, c) => sum + c.questions.reduce((s, q) => s + (q.points || 0), 0),
    0,
  );
  const questionsRenseignees = form.criteres.reduce(
    (sum, c) => sum + c.questions.filter(q => q.reponseSoumissionnaire?.trim()).length,
    0,
  );
  const totalQuestions = form.criteres.reduce((sum, c) => sum + c.questions.length, 0);

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ── Barre d'actions ── */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          {/* Import */}
          <label
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg cursor-pointer shadow-sm"
            title="Importer un fichier Excel QT complété"
          >
            <Upload className="w-4 h-4" />
            Importer Excel
            <input
              ref={fileInputRef}
              type="file"
              accept=".xls,.xlsx"
              onChange={handleImport}
              className="hidden"
            />
          </label>

          {/* Prévisualiser */}
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm"
            title="Prévisualiser le questionnaire"
          >
            <Eye className="w-4 h-4" />
            Prévisualiser
          </button>

          {/* Export */}
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg shadow-sm disabled:opacity-50"
            title="Exporter le questionnaire en Excel enrichi"
          >
            {isExporting
              ? <><div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />Génération...</>
              : <><Download className="w-4 h-4" />Exporter Excel</>
            }
          </button>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || saveStatus === 'saving'}
          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-md text-sm"
        >
          {saveStatus === 'saving' ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sauvegarde...</>
          ) : saveStatus === 'success' ? (
            <><CheckCircle2 className="w-4 h-4" />Sauvegardé !</>
          ) : (
            <><Save className="w-4 h-4" />Sauvegarder</>
          )}
        </button>
      </div>

      {/* Notifications import */}
      {importError && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{importError}</span>
          <button onClick={() => setImportError(null)} className="ml-auto"><X className="w-4 h-4" /></button>
        </div>
      )}
      {importSuccess && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          Fichier importé avec succès. Vérifiez les données puis sauvegardez.
        </div>
      )}
      {saveStatus === 'error' && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          Erreur lors de la sauvegarde. Réessayez.
        </div>
      )}

      {/* ── Statistiques rapides ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{form.criteres.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Critères</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{questionsRenseignees}<span className="text-sm font-normal text-slate-400">/{totalQuestions}</span></p>
          <p className="text-xs text-slate-500 mt-0.5">Questions renseignées</p>
        </div>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-center">
          <p className="text-2xl font-bold text-slate-800">{totalPoints}</p>
          <p className="text-xs text-slate-500 mt-0.5">Points totaux</p>
        </div>
      </div>

      {/* ── En-tête du questionnaire ── */}
      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-[#004d3d] text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span className="text-sm font-semibold">En-tête du questionnaire</span>
          </div>
          <button
            type="button"
            onClick={() => setEditingHeader(e => !e)}
            className="flex items-center gap-1 text-xs text-white/80 hover:text-white"
          >
            {editingHeader ? <><X className="w-3.5 h-3.5" />Fermer</> : <><Pencil className="w-3.5 h-3.5" />Modifier</>}
          </button>
        </div>

        {editingHeader ? (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Référence</label>
              <input
                type="text"
                value={form.reference}
                onChange={e => updateHeader('reference', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="AA_XXX_XXX_XXX-XXX_XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Objet de la procédure</label>
              <input
                type="text"
                value={form.objetProcedure}
                onChange={e => updateHeader('objetProcedure', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lot concerné</label>
              <input
                type="text"
                value={form.lot}
                onChange={e => updateHeader('lot', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Lot X : XXX"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nom du soumissionnaire</label>
              <input
                type="text"
                value={form.nomSoumissionnaire}
                onChange={e => updateHeader('nomSoumissionnaire', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Nom de l'entreprise candidate"
              />
            </div>
          </div>
        ) : (
          /* Mode lecture - fidèle à la mise en page du fichier Excel */
          <div className="p-4 space-y-1 text-sm">
            <p className="text-xs text-gray-400 font-mono">{form.reference || '—'}</p>
            <p className="font-semibold text-gray-800">{form.objetProcedure || '—'}</p>
            <p className="text-gray-600">{form.lot || '—'}</p>
            {form.nomSoumissionnaire && (
              <p className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-emerald-50 border border-emerald-200 rounded text-emerald-800 text-xs font-medium">
                Soumissionnaire : {form.nomSoumissionnaire}
              </p>
            )}
            {!form.nomSoumissionnaire && (
              <p className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded text-amber-700 text-xs">
                <Info className="w-3 h-3" />
                Veuillez indiquer le nom du soumissionnaire
              </p>
            )}
          </div>
        )}
      </div>

      {/* ── Note d'information ── */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
        <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
        <span>
          Le Questionnaire Technique est contractuel. Le soumissionnaire s'engage à respecter l'ensemble de ce qu'il y est écrit.
          Les apports du QT ne peuvent avoir pour effet de modifier les termes du CCTP.
        </span>
      </div>

      {/* ── Critères ── */}
      <div className="space-y-3">
        {form.criteres.map((critere, ci) => {
          const isExpanded = expandedCriteres.has(ci);
          const criterePoints = critere.questions.reduce((s, q) => s + (q.points || 0), 0);
          const renseignees = critere.questions.filter(q => q.reponseSoumissionnaire?.trim()).length;

          return (
            <div key={ci} className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
              {/* Header critère */}
              <div
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 cursor-pointer select-none hover:bg-gray-100 transition-colors"
                onClick={() => toggleCritere(ci)}
              >
                <span className="text-gray-400">
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-800">{critere.ref}</span>
                    {critere.intitule && (
                      <span className="text-sm text-gray-600">– {critere.intitule}</span>
                    )}
                    {!critere.intitule && (
                      <span className="text-xs text-gray-400 italic">Intitulé non renseigné</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0 text-xs text-gray-500">
                  <span>{renseignees}/{critere.questions.length} rép.</span>
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded font-medium">{criterePoints} pts</span>
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); removeCritere(ci); }}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Supprimer ce critère"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4">
                  {/* Intitulé du critère */}
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Intitulé du critère</label>
                    <input
                      type="text"
                      value={critere.intitule}
                      onChange={e => updateCritere(ci, 'intitule', e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder={`Ex : Moyens humains, Organisation, Méthodologie…`}
                    />
                  </div>

                  {/* Tableau des questions */}
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="w-full text-sm border-collapse min-w-[700px]">
                      <thead>
                        <tr className="bg-[#004d3d] text-white text-xs">
                          <th className="px-2 py-2 text-left w-14">N°</th>
                          <th className="px-2 py-2 text-left">Question</th>
                          <th className="px-2 py-2 text-left w-36">Réponse attendue</th>
                          <th className="px-2 py-2 text-left">Réponse du soumissionnaire</th>
                          <th className="px-2 py-2 text-center w-16">Points</th>
                          <th className="px-2 py-2 text-center w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {critere.questions.map((question, qi) => (
                          <tr key={qi} className={qi % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            {/* Ref */}
                            <td className="px-2 py-1.5 align-top">
                              <input
                                type="text"
                                value={question.ref}
                                onChange={e => updateQuestion(ci, qi, 'ref', e.target.value)}
                                className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs font-mono bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            {/* Intitulé question */}
                            <td className="px-2 py-1.5 align-top">
                              <textarea
                                value={question.intitule}
                                onChange={e => updateQuestion(ci, qi, 'intitule', e.target.value)}
                                rows={2}
                                className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 resize-none"
                                placeholder="Libellé de la question…"
                              />
                            </td>
                            {/* Réponse attendue */}
                            <td className="px-2 py-1.5 align-top">
                              <select
                                value={TYPES_REPONSE.includes(question.reponseAttendue) ? question.reponseAttendue : '__custom__'}
                                onChange={e => {
                                  if (e.target.value !== '__custom__') updateQuestion(ci, qi, 'reponseAttendue', e.target.value);
                                }}
                                className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 mb-1"
                              >
                                {TYPES_REPONSE.map(t => <option key={t} value={t}>{t}</option>)}
                                {!TYPES_REPONSE.includes(question.reponseAttendue) && (
                                  <option value="__custom__">{question.reponseAttendue}</option>
                                )}
                              </select>
                            </td>
                            {/* Réponse soumissionnaire */}
                            <td className="px-2 py-1.5 align-top">
                              {question.reponseAttendue === 'Oui / Non' ? (
                                <select
                                  value={question.reponseSoumissionnaire}
                                  onChange={e => updateQuestion(ci, qi, 'reponseSoumissionnaire', e.target.value)}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500"
                                >
                                  <option value="">— Choisir —</option>
                                  <option value="Oui">Oui</option>
                                  <option value="Non">Non</option>
                                </select>
                              ) : (
                                <textarea
                                  value={question.reponseSoumissionnaire}
                                  onChange={e => updateQuestion(ci, qi, 'reponseSoumissionnaire', e.target.value)}
                                  rows={2}
                                  className="w-full border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500 resize-none"
                                  placeholder="Saisir la réponse…"
                                />
                              )}
                              {/* Badge conformité */}
                              <span className={`text-[10px] mt-0.5 inline-block px-1 rounded ${question.reponseSoumissionnaire?.trim() ? 'text-green-700 bg-green-50' : 'text-amber-700 bg-amber-50'}`}>
                                {question.reponseSoumissionnaire?.trim() ? 'Renseigné' : 'Absence de réponse'}
                              </span>
                            </td>
                            {/* Points */}
                            <td className="px-2 py-1.5 align-top text-center">
                              <input
                                type="number"
                                min={0}
                                value={question.points}
                                onChange={e => updateQuestion(ci, qi, 'points', Number(e.target.value))}
                                className="w-14 border border-transparent hover:border-gray-300 focus:border-emerald-500 rounded px-1 py-0.5 text-xs text-center bg-transparent focus:bg-white focus:ring-1 focus:ring-emerald-500"
                              />
                            </td>
                            {/* Supprimer */}
                            <td className="px-1 py-1.5 align-top text-center">
                              <button
                                type="button"
                                onClick={() => removeQuestion(ci, qi)}
                                className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      {/* Pied de tableau critère */}
                      <tfoot>
                        <tr className="bg-gray-100 border-t border-gray-200">
                          <td colSpan={4} className="px-2 py-1.5 text-xs text-gray-500 font-medium">Total {critere.ref}</td>
                          <td className="px-2 py-1.5 text-center text-xs font-bold text-emerald-700">{criterePoints}</td>
                          <td />
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Ajouter une question */}
                  <button
                    type="button"
                    onClick={() => addQuestion(ci)}
                    className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs text-emerald-700 border border-emerald-300 hover:bg-emerald-50 rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Ajouter une question
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Ajouter un critère */}
      <button
        type="button"
        onClick={addCritere}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-xl transition-colors text-sm"
      >
        <Plus className="w-4 h-4" />
        Ajouter un critère
      </button>

      {/* Notes internes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Notes internes (non exportées)</label>
        <textarea
          value={form.notes}
          onChange={e => updateHeader('notes', e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          placeholder="Notes ou instructions complémentaires…"
        />
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL PRÉVISUALISATION
          ══════════════════════════════════════════════════════════════════ */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-white">
          {/* Header modal */}
          <div className="flex items-center justify-between px-6 py-3 bg-[#1A3330] text-white flex-shrink-0">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5" />
              <div>
                <p className="text-sm font-bold">Prévisualisation — Questionnaire Technique</p>
                <p className="text-xs text-white/70">{form.objetProcedure}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/10 hover:bg-white/20 border border-white/30 text-white rounded-lg"
              >
                <Download className="w-3.5 h-3.5" />
                {isExporting ? 'Génération...' : 'Exporter Excel'}
              </button>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Corps scrollable */}
          <div className="flex-1 overflow-auto bg-gray-100 p-6">
            <div className="max-w-5xl mx-auto">

              {/* ── En-tête procédure ── */}
              <table className="w-full border-collapse mb-0" style={{ fontFamily: 'Calibri, sans-serif' }}>
                <tbody>
                  {/* Titre */}
                  <tr>
                    <td colSpan={6} style={{
                      background: '#1A3330', color: '#fff', fontWeight: 'bold', fontSize: 18,
                      textAlign: 'center', padding: '10px 16px', letterSpacing: 1,
                    }}>
                      QUESTIONNAIRE TECHNIQUE
                    </td>
                  </tr>
                  {/* Référence */}
                  <tr>
                    <td colSpan={6} style={{
                      background: '#2F5B58', color: '#fff', fontSize: 12,
                      textAlign: 'center', padding: '5px 16px', fontFamily: 'Courier New, monospace',
                    }}>
                      {form.reference || '—'}
                    </td>
                  </tr>
                  {/* Objet */}
                  <tr>
                    <td style={{ background: '#E8F2F1', color: '#2F5B58', fontWeight: 'bold', fontSize: 10, padding: '5px 10px', width: 90, borderRight: '1px solid #D1D5DB' }}>
                      Objet
                    </td>
                    <td colSpan={5} style={{ background: '#fff', color: '#1F2937', fontWeight: 'bold', fontSize: 12, padding: '5px 10px', border: '1px solid #D1D5DB' }}>
                      {form.objetProcedure || '—'}
                    </td>
                  </tr>
                  {/* Lot */}
                  <tr>
                    <td style={{ background: '#E8F2F1', color: '#2F5B58', fontWeight: 'bold', fontSize: 10, padding: '5px 10px', borderRight: '1px solid #D1D5DB' }}>
                      Lot
                    </td>
                    <td colSpan={5} style={{ background: '#fff', color: '#1F2937', fontSize: 11, padding: '5px 10px', border: '1px solid #D1D5DB' }}>
                      {form.lot || '—'}
                    </td>
                  </tr>
                  {/* Soumissionnaire */}
                  <tr>
                    <td style={{ background: '#FFFDE7', color: '#1F2937', fontWeight: 'bold', fontSize: 10, padding: '6px 10px', borderRight: '2px solid #F9A825' }}>
                      Soumissionnaire
                    </td>
                    <td colSpan={5} style={{
                      background: '#FFFDE7',
                      color: form.nomSoumissionnaire ? '#1F2937' : '#E65100',
                      fontWeight: form.nomSoumissionnaire ? 'bold' : 'normal',
                      fontStyle: form.nomSoumissionnaire ? 'normal' : 'italic',
                      fontSize: 12, padding: '6px 10px', border: '2px solid #F9A825',
                    }}>
                      {form.nomSoumissionnaire || 'Veuillez indiquer le nom du soumissionnaire'}
                    </td>
                  </tr>
                  {/* Note contractuelle */}
                  <tr>
                    <td colSpan={6} style={{ background: '#EFF8FF', color: '#1D4ED8', fontSize: 9, fontStyle: 'italic', padding: '6px 12px', borderLeft: '3px solid #BFDBFE' }}>
                      Le Questionnaire Technique est contractuel. Le soumissionnaire s'engage à respecter l'ensemble de ce qu'il y est écrit.
                      Les apports du QT ne peuvent avoir pour effet de modifier les termes du CCTP.
                    </td>
                  </tr>
                  {/* Avertissement si incomplet */}
                  {form.criteres.some(c => c.questions.some(q2 => !q2.reponseSoumissionnaire?.trim())) && (
                    <tr>
                      <td colSpan={6} style={{ background: '#FFF3E0', color: '#E65100', fontWeight: 'bold', fontSize: 10, textAlign: 'center', padding: '6px', borderTop: '1px solid #FCA5A5' }}>
                        *** Questionnaire incomplet, merci de répondre à l'ensemble des questions ***
                      </td>
                    </tr>
                  )}
                  {/* Ligne vide */}
                  <tr><td colSpan={6} style={{ height: 8, background: '#fff' }} /></tr>

                  {/* ── En-tête tableau ── */}
                  {(['N°', 'Questions', 'Réponse attendue', 'Réponse du soumissionnaire', 'Points', 'Conformité'] as const).map((h, i) => null)}
                  <tr>
                    {['N°', 'Questions', 'Réponse attendue', 'Réponse du soumissionnaire', 'Points', 'Conformité'].map((h, i) => (
                      <th key={i} style={{
                        background: '#2F5B58', color: '#fff', fontWeight: 'bold', fontSize: 11,
                        padding: '8px 6px', textAlign: 'center', border: '1px solid #1A3330',
                        width: i === 0 ? 55 : i === 4 ? 55 : i === 5 ? 110 : i === 2 ? 110 : undefined,
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </tbody>
              </table>

              {/* ── Corps : critères + questions ── */}
              {form.criteres.map((critere, ci) => {
                const totalPts = critere.questions.reduce((s, q2) => s + (q2.points || 0), 0);
                return (
                  <table key={ci} className="w-full border-collapse mb-0" style={{ fontFamily: 'Calibri, sans-serif' }}>
                    <tbody>
                      {/* Critère header */}
                      <tr>
                        <td colSpan={5} style={{
                          background: '#3D7A75', color: '#fff', fontWeight: 'bold', fontSize: 12,
                          padding: '8px 12px', border: '1px solid #1A3330',
                        }}>
                          {critere.ref}{critere.intitule ? ` — ${critere.intitule}` : ''}
                        </td>
                        <td style={{
                          background: '#3D7A75', color: '#fff', fontWeight: 'bold', fontSize: 13,
                          textAlign: 'center', padding: '8px 6px', border: '1px solid #1A3330',
                        }}>
                          {totalPts}
                        </td>
                      </tr>

                      {/* Questions */}
                      {critere.questions.map((question, qi) => {
                        const isEven = qi % 2 === 0;
                        const rowBg = isEven ? '#fff' : '#F9FAFB';
                        const isRenseignee = Boolean(question.reponseSoumissionnaire?.trim());
                        return (
                          <tr key={qi}>
                            {/* N° */}
                            <td style={{ background: rowBg, color: '#6B7280', fontFamily: 'Courier New, monospace', fontSize: 9, fontWeight: 'bold', textAlign: 'center', padding: '5px 4px', border: '1px solid #E5E7EB', width: 55, verticalAlign: 'top' }}>
                              {question.ref}
                            </td>
                            {/* Question */}
                            <td style={{ background: rowBg, color: '#1F2937', fontSize: 10, padding: '5px 8px', border: '1px solid #E5E7EB', verticalAlign: 'top', lineHeight: 1.4 }}>
                              {question.intitule || <span style={{ color: '#9CA3AF', fontStyle: 'italic' }}>—</span>}
                            </td>
                            {/* Réponse attendue */}
                            <td style={{ background: rowBg, color: '#6B7280', fontSize: 10, textAlign: 'center', padding: '5px 6px', border: '1px solid #E5E7EB', width: 110, verticalAlign: 'top' }}>
                              {question.reponseAttendue}
                            </td>
                            {/* Réponse soumissionnaire */}
                            <td style={{ background: isRenseignee ? rowBg : '#FFFDE7', color: isRenseignee ? '#1F2937' : '#E65100', fontSize: 10, padding: '5px 8px', border: '1px solid #E5E7EB', verticalAlign: 'top', lineHeight: 1.4, fontStyle: isRenseignee ? 'normal' : 'italic' }}>
                              {question.reponseSoumissionnaire || '—'}
                            </td>
                            {/* Points */}
                            <td style={{ background: rowBg, color: '#2F5B58', fontWeight: 'bold', fontSize: 10, textAlign: 'center', padding: '5px 4px', border: '1px solid #E5E7EB', width: 55, verticalAlign: 'top' }}>
                              {question.points}
                            </td>
                            {/* Conformité */}
                            <td style={{
                              background: isRenseignee ? '#E8F5E9' : '#FFEBEE',
                              color: isRenseignee ? '#2E7D32' : '#C62828',
                              fontWeight: 'bold', fontSize: 9, textAlign: 'center',
                              padding: '5px 6px', border: '1px solid #E5E7EB',
                              width: 110, verticalAlign: 'middle',
                            }}>
                              {isRenseignee ? 'Renseigné' : 'Absence de réponse'}
                            </td>
                          </tr>
                        );
                      })}

                      {/* Sous-total */}
                      <tr>
                        <td colSpan={4} style={{ background: '#E8F2F1', color: '#2F5B58', fontWeight: 'bold', fontSize: 9, textAlign: 'right', padding: '4px 12px', border: '1px solid #D1D5DB' }}>
                          Sous-total {critere.ref}
                        </td>
                        <td style={{ background: '#E8F2F1', color: '#2F5B58', fontWeight: 'bold', fontSize: 10, textAlign: 'center', padding: '4px', border: '1px solid #D1D5DB' }}>
                          {totalPts}
                        </td>
                        <td style={{ background: '#E8F2F1', border: '1px solid #D1D5DB' }} />
                      </tr>
                      <tr><td colSpan={6} style={{ height: 6, background: '#fff' }} /></tr>
                    </tbody>
                  </table>
                );
              })}

              {/* Total général */}
              <table className="w-full border-collapse" style={{ fontFamily: 'Calibri, sans-serif' }}>
                <tbody>
                  <tr>
                    <td colSpan={4} style={{ background: '#1A3330', color: '#fff', fontWeight: 'bold', fontSize: 13, textAlign: 'right', padding: '10px 16px', border: '1px solid #1A3330' }}>
                      TOTAL GÉNÉRAL
                    </td>
                    <td style={{ background: '#1A3330', color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center', padding: '10px', border: '1px solid #1A3330' }}>
                      {totalPoints}
                    </td>
                    <td style={{ background: '#1A3330', border: '1px solid #1A3330' }} />
                  </tr>
                </tbody>
              </table>

              {/* Note bas */}
              <p className="text-xs text-gray-400 mt-4 text-center">
                Généré le {new Date().toLocaleDateString('fr-FR')} — Questionnaire Technique confidentiel
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bouton save bas de page */}
      <div className="flex justify-end pt-2 border-t border-gray-200">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || saveStatus === 'saving'}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg disabled:opacity-50 shadow-md text-sm"
        >
          <Save className="w-4 h-4" />
          {saveStatus === 'saving' ? 'Sauvegarde...' : 'Sauvegarder dans Supabase'}
        </button>
      </div>
    </div>
  );
}
