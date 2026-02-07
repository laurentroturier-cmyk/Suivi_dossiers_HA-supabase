/**
 * Wizard de saisie AN01 : Projet → Lots → Candidats → Financier → Technique → Synthèse
 */

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, ChevronRight, Save, Download, Upload } from 'lucide-react';
import { Button } from '@/components/ui';
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

const An01SaisieWizard: React.FC<An01SaisieWizardProps> = ({ initialProject, initialStep, onComplete, onBack }) => {
  const [step, setStep] = useState<StepIndex>(initialStep ?? 0);
  const [project, setProject] = useState<AN01Project>(() => {
    if (initialProject) return initialProject;
    const stored = loadStored();
    return stored || createDefaultProject();
  });
  const [selectedLotIndex, setSelectedLotIndex] = useState<number>(0);
  const [saveFeedback, setSaveFeedback] = useState<'idle' | 'saved' | 'exported'>('idle');

  useEffect(() => {
    saveStored(project);
  }, [project]);

  const handleSave = useCallback(() => {
    saveStored(project);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 space-y-3">
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
          <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-100 dark:border-gray-700">
            <Button variant="outline" size="sm" icon={<Save className="w-4 h-4" />} onClick={handleSave} title="Enregistrer dans le navigateur">
              Sauvegarder
            </Button>
            <Button variant="outline" size="sm" icon={<Download className="w-4 h-4" />} onClick={handleExportJson} title="Télécharger une copie (JSON)">
              Exporter
            </Button>
            <Button variant="outline" size="sm" icon={<Upload className="w-4 h-4" />} onClick={handleLoadFromFile} title="Charger un projet (fichier JSON)">
              Importer
            </Button>
            {saveFeedback === 'saved' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-1">Enregistré</span>
            )}
            {saveFeedback === 'exported' && (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium whitespace-nowrap ml-1">Téléchargé</span>
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
            onChange={(lots) => setProject((p) => ({ ...p, lots }))}
            onBack={goPrev}
            onNext={goNext}
          />
        )}
        {step === 5 && (() => {
          const result = projectToAnalysisData(project);
          const currentLot = result.lots[selectedLotIndex];
          return (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className="flex justify-between pb-2">
                <Button variant="secondary" onClick={goPrev}>
                  Retour
                </Button>
                <Button variant="primary" onClick={handleCompleteFromSynthèse}>
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
