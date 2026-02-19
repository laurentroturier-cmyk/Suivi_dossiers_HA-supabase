/**
 * Wizard de saisie AN01 : Projet → Lots → Candidats → Financier → Technique → Synthèse
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Save, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui';
import { supabase } from '@/lib/supabase';
import type { AN01Project } from '../types/saisie';
import { createDefaultProject } from '../types/saisie';
import { projectToAnalysisData } from '../utils/saisieToAnalysis';
import {
  An01StepProjet,
  An01StepLots,
  An01StepCandidats,
  An01StepFinancier,
  An01StepTechnique,
  An01StepSynthèseRecap,
} from './saisie';

const STORAGE_KEY = 'an01_saisie_project';
const STEPS = ['Projet', 'Lots', 'Candidats', 'Grille financière', 'Critères techniques', 'Synthèse'] as const;
type StepIndex = 0 | 1 | 2 | 3 | 4 | 5;

interface An01SaisieWizardProps {
  initialProject?: AN01Project | null;
  /** Étape à afficher au montage (0–5). Ex. 5 = Synthèse (retour depuis la page de synthèse). */
  initialStep?: StepIndex;
  onComplete: (result: { lots: import('../types').AnalysisData[]; globalMetadata: Record<string, string> }, project?: AN01Project) => void;
  onBack: () => void;
}

const loadStored = (): AN01Project | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AN01Project;
  } catch {
    return null;
  }
};

const saveStored = (project: AN01Project) => {
  try {
    const toSave = { ...project, updated_at: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (e) {
    console.warn('AN01 save to localStorage failed', e);
  }
};

const buildAnalyseTechPayload = (project: AN01Project) => ({
  source: 'an01_step_5',
  updated_at: new Date().toISOString(),
  meta: {
    consultation_number: project.meta?.consultation_number || '',
  },
  lots: project.lots.map((lot) => ({
    id: lot.id,
    lot_number: lot.lot_number,
    lot_name: lot.lot_name,
    criteria: lot.criteria,
    notations: lot.notations,
    candidates: lot.candidates.map((c) => ({ id: c.id, company_name: c.company_name })),
  })),
});

const resolveProcedureNumProc = async (consultationNumber: string): Promise<{ numProc?: string; error?: string }> => {
  const trimmed = String(consultationNumber || '').trim();
  const digitsMatch = trimmed.match(/\d{5}/);
  const short = digitsMatch ? digitsMatch[0] : trimmed;

  const baseSelect = 'NumProc, "numero court procédure afpa", "Numéro de procédure (Afpa)"';

  const exactShort = await supabase
    .from('procédures')
    .select(baseSelect)
    .eq('numero court procédure afpa', short)
    .limit(1);

  if (exactShort.error) {
    return { error: exactShort.error.message || 'Erreur recherche procedure.' };
  }
  if (exactShort.data?.length) {
    return { numProc: exactShort.data[0]?.NumProc };
  }

  const ilikeShort = await supabase
    .from('procédures')
    .select(baseSelect)
    .ilike('numero court procédure afpa', `%${short}%`)
    .limit(1);

  if (ilikeShort.error) {
    return { error: ilikeShort.error.message || 'Erreur recherche procedure.' };
  }
  if (ilikeShort.data?.length) {
    return { numProc: ilikeShort.data[0]?.NumProc };
  }

  const ilikeAfpa = await supabase
    .from('procédures')
    .select(baseSelect)
    .ilike('Numéro de procédure (Afpa)', `%${trimmed}%`)
    .limit(1);

  if (ilikeAfpa.error) {
    return { error: ilikeAfpa.error.message || 'Erreur recherche procedure.' };
  }
  if (ilikeAfpa.data?.length) {
    return { numProc: ilikeAfpa.data[0]?.NumProc };
  }

  return { error: `Aucune procedure trouvee pour: ${trimmed}` };
};

const An01SaisieWizard: React.FC<An01SaisieWizardProps> = ({ initialProject, initialStep, onComplete, onBack }) => {
  const [step, setStep] = useState<StepIndex>(initialStep ?? 0);
  const [project, setProject] = useState<AN01Project>(() => {
    if (initialProject) return initialProject;
    const stored = loadStored();
    return stored || createDefaultProject();
  });
  const [selectedLotIndex, setSelectedLotIndex] = useState<number>(0);
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saving' | 'saved' | 'exported' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    saveStored(project);
  }, [project]);

  const handleSave = useCallback(async () => {
    saveStored(project);
    setSaveError(null);
    setSaveFeedback('saving');

    let targetNumProc = String(project.meta?.num_proc || '').trim();

    if (!targetNumProc) {
      const numeroCourt = String(project.meta?.procedure_short || project.meta?.consultation_number || '').trim();
      if (!numeroCourt) {
        setSaveFeedback('error');
        setSaveError('Numero de procedure manquant.');
        const t = setTimeout(() => setSaveFeedback('idle'), 2500);
        return () => clearTimeout(t);
      }

      const resolved = await resolveProcedureNumProc(numeroCourt);
      if (!resolved.numProc) {
        setSaveFeedback('error');
        setSaveError(resolved.error || 'Procedure introuvable.');
        const t = setTimeout(() => setSaveFeedback('idle'), 3000);
        return () => clearTimeout(t);
      }
      targetNumProc = resolved.numProc;
    }

    const payload = buildAnalyseTechPayload(project);
    console.log('💾 Sauvegarde analyse_tech pour NumProc:', targetNumProc);
    console.log('📦 Payload:', payload);

    const { data: updated, error } = await supabase
      .from('procédures')
      .update({ analyse_tech: payload })
      .eq('NumProc', targetNumProc)
      .select('NumProc, analyse_tech');

    if (error) {
      console.error('❌ AN01 sauvegarde analyse_tech:', error);
      setSaveFeedback('error');
      setSaveError(error.message || 'Erreur lors de la sauvegarde.');
      const t = setTimeout(() => setSaveFeedback('idle'), 3000);
      return () => clearTimeout(t);
    }

    if (!updated || updated.length === 0) {
      console.error('❌ Aucune ligne mise à jour pour NumProc:', targetNumProc);
      setSaveFeedback('error');
      setSaveError('Aucune procedure mise a jour.');
      const t = setTimeout(() => setSaveFeedback('idle'), 3000);
      return () => clearTimeout(t);
    }

    console.log('✅ Sauvegarde réussie pour NumProc:', updated[0].NumProc);
    console.log('📊 Analyse_tech enregistrée:', JSON.stringify(updated[0].analyse_tech, null, 2));
    setSaveFeedback('saved');
    const t = setTimeout(() => setSaveFeedback('idle'), 2000);
    return () => clearTimeout(t);
  }, [project]);

  const handleExportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify({ ...project, updated_at: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const num = (project.meta?.consultation_number || 'projet').replace(/[^a-z0-9_-]/gi, '_');
    const date = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `an01_projet_${num}_${date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setSaveFeedback('exported');
    const t = setTimeout(() => setSaveFeedback('idle'), 2000);
    return () => clearTimeout(t);
  }, [project]);

  const handleLoadFromFile = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string) as AN01Project;
          if (data && typeof data.meta === 'object' && Array.isArray(data.lots)) {
            setProject({ ...data, id: data.id || `an01-${Date.now()}`, updated_at: new Date().toISOString() });
            setSaveFeedback('saved');
            setTimeout(() => setSaveFeedback('idle'), 2000);
          } else {
            alert('Fichier invalide : structure de projet AN01 attendue.');
          }
        } catch (e) {
          alert('Fichier JSON invalide.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, []);

  const goNext = useCallback(() => {
    if (step < 5) {
      setStep((s) => (s + 1) as StepIndex);
      return;
    }
    // step === 5 : Synthèse → convertir et terminer
    const result = projectToAnalysisData(project);
    if (result.lots.length === 0) {
      alert('Aucun lot avec des candidats. Ajoutez au moins un lot et des candidats.');
      return;
    }
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    onComplete(result, project);
  }, [step, project, onComplete]);

  const goPrev = useCallback(() => {
    if (step > 0) setStep((s) => (s - 1) as StepIndex);
  }, [step]);

  const handleCompleteFromSynthèse = () => {
    goNext();
  };

  return (
    <div className="an01-page min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col">
      <header className="an01-wizard-header border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-[#0f172a] shadow-sm">
        <div className="w-full px-4 py-3 space-y-3">
          {/* Ligne 1 : Retour + Fil d'étapes (scroll horizontal si besoin) */}
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Button variant="ghost" size="sm" icon={<ArrowLeft className="w-4 h-4" />} onClick={onBack} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                Retour au choix
              </Button>
            </div>
            <nav className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden flex items-center gap-1 pb-0.5" aria-label="Étapes">
              {STEPS.map((label, i) => (
                <React.Fragment key={label}>
                  <button
                    type="button"
                    onClick={() => setStep(i as StepIndex)}
                    className={`flex-shrink-0 text-xs font-medium whitespace-nowrap py-2 px-2.5 rounded-md cursor-pointer transition-colors ${
                      i === step
                        ? 'bg-emerald-100 dark:bg-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                  >
                    {i + 1}. {label}
                  </button>
                  {i < STEPS.length - 1 && (
                    <ChevronRight className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" aria-hidden />
                  )}
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* Ligne 2 : Enregistrement (toujours visible, pas de chevauchement) */}
          <div className="flex items-center justify-center gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
            <Button variant="outline" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSave} title="Enregistrer dans Supabase">
              Sauvegarder
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportJson} title="Télécharger une copie (JSON)">
              Exporter
            </Button>
            <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />} onClick={handleLoadFromFile} title="Charger un projet (fichier JSON)">
              Importer
            </Button>
            {saveFeedback === 'saving' && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap ml-1">Sauvegarde...</span>
            )}
            {saveFeedback === 'saved' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-1">Enregistré</span>
            )}
            {saveFeedback === 'exported' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-1">Téléchargé</span>
            )}
            {saveFeedback === 'error' && saveError && (
              <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap ml-1">{saveError}</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 py-8 px-4">
        {step === 0 && (
          <An01StepProjet
            meta={project.meta}
            onChange={(meta) => setProject((p) => ({ ...p, meta }))}
            onNext={goNext}
          />
        )}
        {step === 1 && (
          <An01StepLots
            lots={project.lots}
            onChange={(lots) => setProject((p) => ({ ...p, lots }))}
            onBack={goPrev}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <An01StepCandidats
            lots={project.lots}
            consultationNumber={project.meta.consultation_number}
            onChange={(lots) => setProject((p) => ({ ...p, lots }))}
            onBack={goPrev}
            onNext={goNext}
          />
        )}
        {step === 3 && (
          <An01StepFinancier
            lots={project.lots}
            onChange={(lots) => setProject((p) => ({ ...p, lots }))}
            onBack={goPrev}
            onNext={goNext}
          />
        )}
        {step === 4 && (
          <An01StepTechnique
            lots={project.lots}
            consultationNumber={project.meta?.consultation_number}
            meta={project.meta}
            onChange={(lots) => setProject((p) => ({ ...p, lots }))}
            onBack={goPrev}
            onNext={goNext}
          />
        )}
        {step === 5 && (() => {
          const result = projectToAnalysisData(project);
          const currentLot = result.lots[selectedLotIndex];
          return (
            <div className="w-full space-y-6">
              <div className="flex justify-between pb-2">
                <Button variant="secondary" onClick={goPrev} rounded="2xl" className="rounded-2xl">
                  Retour
                </Button>
                <Button variant="primary" onClick={handleCompleteFromSynthèse} rounded="2xl" className="rounded-2xl">
                  Voir l&apos;analyse
                </Button>
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Synthèse</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tableau récapitulatif des offres et calcul des gains. Cliquez sur &quot;Voir l&apos;analyse&quot; pour afficher le classement et les graphiques.
              </p>
              {result.lots.length === 0 ? (
                <p className="text-amber-600 dark:text-amber-400">Aucun lot avec des candidats. Ajoutez au moins un lot et des candidats.</p>
              ) : result.lots.length > 1 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Lot :</label>
                    <select
                      className="rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                      value={selectedLotIndex}
                      onChange={(e) => setSelectedLotIndex(Number(e.target.value))}
                    >
                      {result.lots.map((lot, i) => (
                        <option key={i} value={i}>{lot.lotName}</option>
                      ))}
                    </select>
                  </div>
                  {currentLot && <An01StepSynthèseRecap data={currentLot} meta={project.meta} />}
                </div>
              ) : (
                currentLot && <An01StepSynthèseRecap data={currentLot} meta={project.meta} />
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default An01SaisieWizard;
