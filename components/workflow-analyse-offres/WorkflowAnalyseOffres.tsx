// ============================================
// Workflow Analyse des Offres
// Processus complet d'analyse des appels d'offres — couleurs app GestProjet
// ============================================

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, FileText, AlertCircle, Download, X } from 'lucide-react';
import { ProcedureSelector } from '../dce-complet/components/shared/ProcedureSelector';
import { ProcedureHeader } from '../dce-complet/components/shared/ProcedureHeader';
import { useProcedure } from '../dce-complet/hooks/useProcedureLoader';
import { exportRapportPresentationFromWorkflow } from '../analyse/utils/exportRapportPresentationFromWorkflow';

type SubActionId = 'retraits' | 'depots' | 'ouverture-candidature' | 'ouverture-recevabilite' | 'rapport-presentation' | 'export-pdf' | null;

const STEPS = [
  {
    id: 1,
    title: 'Gestion des Registres',
    subtitle: 'Import et gestion des registres de l\'appel d\'offres',
    subActions: [
      { title: 'Registre des retraits', desc: 'Charger les entreprises ayant retiré le DCE', subId: 'retraits' as SubActionId },
      { title: 'Registre des dépôts', desc: 'Charger les candidats ayant déposé une offre', subId: 'depots' as SubActionId },
      { title: 'Questions/Réponses', desc: 'Gérer les questions des candidats (à construire)', subId: null },
    ],
  },
  {
    id: 2,
    title: 'Ouverture des Plis',
    subtitle: 'Saisie des données administratives des candidats',
    subActions: [
      { title: 'Analyse des candidatures', desc: 'Examen des candidatures reçues', subId: 'ouverture-candidature' as SubActionId },
      { title: 'Recevabilité des offres', desc: 'Vérification de la conformité des offres', subId: 'ouverture-recevabilite' as SubActionId },
      { title: 'Procès-verbal d\'ouverture des offres', desc: 'Rédaction du PV d\'ouverture des plis', subId: null },
    ],
  },
  {
    id: 3,
    title: 'Analyse Économique',
    subtitle: 'Analyse des offres financières et classement',
    subActions: [
      { title: 'Import DCE', desc: 'Charger les variables du DCE', subId: null },
      { title: 'Import DQE/DPGF', desc: 'Charger les fichiers Excel des candidats', subId: null },
      { title: 'Analyse des offres', desc: 'Contrôle et analyse des prix', subId: null },
      { title: 'Classement', desc: 'Calcul de la note économique', subId: null },
    ],
  },
  {
    id: 4,
    title: 'Analyse Technique',
    subtitle: 'Évaluation technique des offres',
    subActions: [
      { title: 'Cadres de réponse', desc: 'Charger les questionnaires techniques', subId: null },
      { title: 'Grilles de notation', desc: 'Configurer les critères d\'évaluation', subId: null },
      { title: 'Notation', desc: 'Saisir les notes techniques', subId: null },
      { title: 'Synthèse', desc: 'Calcul de la note technique finale', subId: null },
    ],
  },
  {
    id: 5,
    title: 'Analyse AN01',
    subtitle: 'Synthèse des notes et classement final',
    subActions: [
      { title: 'Pondération', desc: 'Appliquer les coefficients', subId: null },
      { title: 'Classement final', desc: 'Calcul du classement définitif', subId: null },
      { title: 'Tableau de synthèse', desc: 'Vue d\'ensemble des résultats', subId: null },
    ],
  },
  {
    id: 6,
    title: 'Rapport de Présentation',
    subtitle: 'Génération du rapport final',
    subActions: [
      { title: 'Rédaction', desc: 'Compilation des analyses', subId: 'rapport-presentation' as SubActionId },
      { title: 'Annexes', desc: 'Tableaux et graphiques', subId: null },
      { title: 'Validation', desc: 'Relecture et signature', subId: null },
      { title: 'Export PDF', desc: 'Génération du document final', subId: 'export-pdf' as SubActionId },
    ],
  },
];

interface WorkflowAnalyseOffresProps {
  onClose?: () => void;
  /** Ouvre le module Registre des retraits (retour via Retour de l'app) */
  onNavigateToRetraits?: () => void;
  /** Ouvre le module Registre des dépôts (retour via Retour de l'app) */
  onNavigateToDepots?: () => void;
  /** Ouvre la page Ouverture des plis (numeroProcedure = 5 chiffres) */
  onNavigateToOuverturePlis?: (numeroProcedure: string) => void;
  /** Ouvre Ouverture des plis → Analyse des candidatures (numeroProcedure = 5 chiffres) */
  onNavigateToOuverturePlisCandidature?: (numeroProcedure: string) => void;
  /** Ouvre Ouverture des plis → Recevabilité des offres (numeroProcedure = 5 chiffres) */
  onNavigateToOuverturePlisRecevabilite?: (numeroProcedure: string) => void;
  /** Ouvre le module Rapport de Présentation */
  onNavigateToRapportPresentation?: () => void;
}

const WORKFLOW_PROCEDURE_KEY = 'workflow_analyse_procedure';

export function WorkflowAnalyseOffres({
  onClose,
  onNavigateToRetraits,
  onNavigateToDepots,
  onNavigateToOuverturePlis,
  onNavigateToOuverturePlisCandidature,
  onNavigateToOuverturePlisRecevabilite,
  onNavigateToRapportPresentation,
}: WorkflowAnalyseOffresProps) {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const procedureResult = useProcedure(numeroProcedure.length === 5 ? numeroProcedure : null);

  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStep, setExportStep] = useState('');
  const [exportProgress, setExportProgress] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportSuccess, setExportSuccess] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(WORKFLOW_PROCEDURE_KEY);
      if (stored && /^\d{5}$/.test(stored)) {
        setNumeroProcedure(stored);
        sessionStorage.removeItem(WORKFLOW_PROCEDURE_KEY);
      }
    } catch {
      // ignore
    }
  }, []);

  const showWelcome = !numeroProcedure || numeroProcedure.length !== 5 || !procedureResult.isValid;

  const procedureData = procedureResult.procedure as { retraits?: unknown; depots?: unknown } | null | undefined;
  const retraitsLoaded = Boolean(procedureData?.retraits != null && typeof procedureData.retraits === 'object');
  const depotsLoaded = Boolean(procedureData?.depots != null && typeof procedureData.depots === 'object');

  const handleBackToSelection = () => {
    setNumeroProcedure('');
  };

  const saveNumeroAndNavigate = (navigate: () => void) => {
    try {
      if (numeroProcedure.length === 5) sessionStorage.setItem(WORKFLOW_PROCEDURE_KEY, numeroProcedure);
    } catch {
      // ignore
    }
    navigate();
  };

  const handleExportPdf = async () => {
    setShowExportModal(true);
    setExportStep('Préparation...');
    setExportProgress(0);
    setExportError(null);
    setExportSuccess(false);
    const result = await exportRapportPresentationFromWorkflow(
      numeroProcedure,
      procedureResult.procedure,
      (step, progress) => {
        setExportStep(step);
        setExportProgress(progress);
      }
    );
    if (result.success) {
      setExportStep('Export terminé.');
      setExportProgress(1);
      setExportSuccess(true);
    } else {
      setExportError(result.error ?? 'Erreur inconnue lors de l\'export.');
    }
  };

  const closeExportModal = () => {
    setShowExportModal(false);
    setExportStep('');
    setExportProgress(0);
    setExportError(null);
    setExportSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Modal Export PDF : progression et messages */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => e.target === e.currentTarget && (exportSuccess || exportError) && closeExportModal()}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200 dark:border-gray-700" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Download className="w-5 h-5 text-[#004d3d] dark:text-cyan-400" />
                Export Rapport de Présentation (PDF)
              </h3>
              {(exportSuccess || exportError) && (
                <button type="button" onClick={closeExportModal} className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Fermer">
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {!exportError && !exportSuccess && (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{exportStep}</p>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-[#004d3d] dark:bg-cyan-500 transition-all duration-300" style={{ width: `${Math.round(exportProgress * 100)}%` }} />
                </div>
              </>
            )}
            {exportSuccess && (
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Le PDF a été généré et téléchargé avec succès.</p>
            )}
            {exportError && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3">
                <p className="text-sm text-red-700 dark:text-red-300">{exportError}</p>
              </div>
            )}
            {(exportSuccess || exportError) && (
              <div className="mt-4 flex justify-end">
                <button type="button" onClick={closeExportModal} className="px-4 py-2 rounded-lg bg-[#004d3d] dark:bg-cyan-600 text-white font-medium hover:bg-[#006d57] dark:hover:bg-cyan-500 transition">
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-8">
        {onClose && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        <header className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Analyse des Offres — Workflow
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Processus complet d'analyse des appels d'offres
          </p>
        </header>

        {/* Sélection de la procédure : affichée en premier, puis entête + étapes */}
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] py-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#006d57] dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Charger les variables de votre procédure
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Saisissez un numéro de procédure pour suivre la progression de l'analyse
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Numéro de procédure (5 chiffres)
                </label>
                <ProcedureSelector
                  value={numeroProcedure}
                  onChange={setNumeroProcedure}
                  onProcedureSelected={() => {}}
                />
                {procedureResult.error && !procedureResult.isValid && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {procedureResult.error}
                    </p>
                  </div>
                )}
              </div>
              {onClose && (
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Retour au menu précédent
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* En-tête procédure chargée + Retour à la sélection */}
            <div className="mb-8 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl flex-shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <ProcedureHeader procedure={procedureResult.procedure} />
                </div>
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap"
                >
                  Retour à la sélection
                </button>
              </div>
            </div>

        <div className="relative space-y-6">
          {/* Ligne de connexion verticale (desktop) */}
          <div
            className="hidden md:block absolute left-8 top-20 bottom-20 w-0.5 bg-gray-200 dark:bg-gray-700"
            style={{ marginLeft: '1.25rem' }}
          />

          {STEPS.map((step) => {
              const isOuverturePlisStep = step.id === 2;
              const onHeaderClick = isOuverturePlisStep && onNavigateToOuverturePlis
                ? () => saveNumeroAndNavigate(() => onNavigateToOuverturePlis!(numeroProcedure))
                : undefined;
              return (
              <div key={step.id} className="relative">
                <div className="rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6 transition-all duration-300 bg-white dark:bg-gray-800">
                  <div
                    role={onHeaderClick ? 'button' : undefined}
                    onClick={onHeaderClick}
                    className={`flex flex-col md:flex-row md:items-center gap-4 mb-4 ${onHeaderClick ? 'cursor-pointer rounded-xl -m-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors' : ''}`}
                    tabIndex={onHeaderClick ? 0 : undefined}
                    onKeyDown={onHeaderClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onHeaderClick(); } } : undefined}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 ${onHeaderClick ? 'ring-2 ring-[#004d3d]/30 dark:ring-cyan-500/30' : ''}`}>
                      {step.id}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {step.title}
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                        {step.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-4">
                    {step.subActions.map((sub, i) => {
                      const subId = (sub as { subId?: SubActionId }).subId;
                      const isRetraits = subId === 'retraits';
                      const isDepots = subId === 'depots';
                      const isOuvertureCandidature = subId === 'ouverture-candidature';
                      const isOuvertureRecevabilite = subId === 'ouverture-recevabilite';
                      const isRapportPresentation = subId === 'rapport-presentation';
                      const isExportPdf = subId === 'export-pdf';
                      const isLoaded = isRetraits ? retraitsLoaded : isDepots ? depotsLoaded : false;
                      const onClick = isRetraits && onNavigateToRetraits
                        ? () => saveNumeroAndNavigate(onNavigateToRetraits)
                        : isDepots && onNavigateToDepots
                        ? () => saveNumeroAndNavigate(onNavigateToDepots)
                        : isOuvertureCandidature && onNavigateToOuverturePlisCandidature
                        ? () => saveNumeroAndNavigate(() => onNavigateToOuverturePlisCandidature!(numeroProcedure))
                        : isOuvertureRecevabilite && onNavigateToOuverturePlisRecevabilite
                        ? () => saveNumeroAndNavigate(() => onNavigateToOuverturePlisRecevabilite!(numeroProcedure))
                        : isRapportPresentation && onNavigateToRapportPresentation
                        ? () => onNavigateToRapportPresentation()
                        : isExportPdf
                        ? () => handleExportPdf()
                        : undefined;
                      return (
                        <div
                          key={i}
                          role={onClick ? 'button' : undefined}
                          onClick={onClick}
                          className={`
                            p-4 rounded-xl border-l-4 transition-colors
                            bg-gray-50 dark:bg-gray-700/50
                            border-[#004d3d] dark:border-cyan-500
                            ${onClick ? 'cursor-pointer hover:bg-[#004d3d]/10 dark:hover:bg-cyan-500/10' : ''}
                            ${isLoaded ? 'bg-[#004d3d]/10 dark:bg-cyan-500/10 border-l-[#006d57] dark:border-l-cyan-400' : ''}
                          `}
                        >
                          <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                            {sub.title}
                          </h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                            {sub.desc}
                          </p>
                          {isLoaded && (
                            <p className="mt-2 text-xs font-semibold text-[#004d3d] dark:text-cyan-400 flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" />
                              Chargé
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
          </>
        )}
      </div>
    </div>
  );
}
