// ============================================
// DCEComplet - Page principale du module DCE Complet
// Interface centralisée pour tous les documents du DCE
// ============================================

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckSquare, FileCheck, FileSpreadsheet, FolderOpen, ArrowLeft, AlertTriangle, Settings } from 'lucide-react';
import { ProcedureSelector } from './shared/ProcedureSelector';
import { ProcedureHeader } from './shared/ProcedureHeader';
import { DCEStatusBar } from './shared/DCEStatusBar';
import { ConflictResolverModal } from './shared/ConflictResolverModal';
import { useDCEState } from '../hooks/useDCEState';
import { useProcedure } from '../hooks/useProcedureLoader';
import type { DCESectionType } from '../types';
import type { ProjectData } from '../../../types';
import { ConfigurationGlobaleForm } from './modules/ConfigurationGlobale';
import { ReglementConsultationLegacyWrapper } from './modules/ReglementConsultationLegacyWrapper';
import { ActeEngagementMultiLots } from './modules/ActeEngagementMultiLots';
import { CCAPMultiLots } from './modules/CCAPMultiLots';
import { CCTPMultiLots } from './modules/CCTPMultiLots';
import { BPUMultiLots } from './modules/BPUMultiLots';
import { DQEMultiLots } from './modules/DQEMultiLots';
import { DPGFMultiLots } from './modules/DPGFMultiLots';
import { DocumentsAnnexesForm } from './modules/DocumentsAnnexesForm';
import { CRTForm } from './modules/CRTForm';
import QuestionnaireTechnique from "../../redaction/components/questionnaire/QuestionnaireTechnique";
import {
  ensureActeEngagement,
  ensureBPU,
  ensureCCAP,
  ensureCCTP,
  ensureDPGF,
  ensureDQE,
  ensureDocumentsAnnexes,
  ensureCRT,
  ensureReglementConsultation,
} from './modules/defaults';

interface DCECompletProps {
  onClose: () => void;
}

export function DCEComplet({ onClose }: DCECompletProps) {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const [selectedProcedure, setSelectedProcedure] = useState<ProjectData | null>(null);
  const [activeSection, setActiveSection] = useState<DCESectionType | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [savingSection, setSavingSection] = useState<DCESectionType | null>(null);

  // Charger la procédure
  const procedureResult = useProcedure(numeroProcedure.length === 5 ? numeroProcedure : null);

  // Charger le DCE
  const {
    dceState,
    isLoading: isLoadingDCE,
    isNew,
    error: dceError,
    loadDCE,
    updateSection,
    updateSectionLocal,
    saveDCE,
    publishDCE,
    refreshDCE,
    isDirty,
    conflicts,
    resolveConflicts,
    checkConflicts,
  } = useDCEState({
    numeroProcedure: numeroProcedure.length === 5 ? numeroProcedure : '',
    autoLoad: false,
  });

  /**
   * Afficher automatiquement le modal de conflits quand des conflits sont détectés
   */
  useEffect(() => {
    if (conflicts?.hasConflicts) {
      setShowConflictModal(true);
    }
  }, [conflicts]);

  /**
   * Quand une procédure valide est sélectionnée, charger le DCE
   */
  useEffect(() => {
    if (numeroProcedure.length === 5 && procedureResult.isValid) {
      setSelectedProcedure(procedureResult.procedure);
      setShowWelcome(false);
      loadDCE();
    } else {
      setSelectedProcedure(null);
      setShowWelcome(true);
    }
  }, [numeroProcedure, procedureResult.isValid, procedureResult.procedure, loadDCE]);

  /**
   * Menu des sections du DCE
   */
  const sections: Array<{ key: DCESectionType; label: string; icon: React.ReactNode }> = [
    { key: 'configurationGlobale', label: '⚙️ Configuration Globale', icon: <Settings className="w-5 h-5" /> },
    { key: 'reglementConsultation', label: 'Règlement de Consultation', icon: <FileText className="w-5 h-5" /> },
    { key: 'acteEngagement', label: 'Acte d\'Engagement', icon: <CheckSquare className="w-5 h-5" /> },
    { key: 'ccap', label: 'CCAP', icon: <FileCheck className="w-5 h-5" /> },
    { key: 'cctp', label: 'CCTP', icon: <FileCheck className="w-5 h-5" /> },
    { key: 'bpu', label: 'BPU', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { key: 'dqe', label: 'DQE', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { key: 'dpgf', label: 'DPGF', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { key: 'documentsAnnexes', label: 'Documents Annexes', icon: <FolderOpen className="w-5 h-5" /> },
    { key: 'crt', label: 'CRT (Cadre de réponse technique)', icon: <FileText className="w-5 h-5" /> },
    { key: 'qt', label: 'Questionnaire technique', icon: <FileText className="w-5 h-5" /> },
  ];

  /**
   * Vérifier si une section est complétée
   */
  const isSectionCompleted = (sectionKey: DCESectionType): boolean => {
    if (!dceState) return false;
    const data = dceState[sectionKey];
    if (!data) return false;

    const values = Object.values(data);
    return values.some(v => {
      if (Array.isArray(v)) return v.length > 0;
      if (typeof v === 'object' && v !== null) return Object.keys(v).length > 0;
      if (typeof v === 'string') return v.trim().length > 0;
      if (typeof v === 'number') return v > 0;
      return false;
    });
  };

  /**
   * Gestion des actions
   */
  const handleSave = async () => {
    if (!dceState) {
      alert('✗ Aucun DCE à sauvegarder');
      return;
    }

    console.log('💾 Sauvegarde globale du DCE:', {
      numeroProcedure: dceState.numeroProcedure,
      sections: Object.keys(dceState).filter(k => 
        !['id', 'userId', 'numeroProcedure', 'procedureId', 'statut', 'titreMarche', 'version', 'notes', 'createdAt', 'updatedAt'].includes(k)
      ),
    });

    const success = await saveDCE();
    if (success) {
      alert('✓ DCE sauvegardé avec succès dans la base de données');
    } else {
      alert('✗ Erreur lors de la sauvegarde du DCE');
    }
  };

  const handlePublish = async () => {
    if (!confirm('Êtes-vous sûr de vouloir publier ce DCE ?')) return;
    const success = await publishDCE();
    if (success) {
      alert('✓ DCE publié avec succès');
    } else {
      alert('✗ Erreur lors de la publication');
    }
  };

  /**
   * Gestion de la sauvegarde d'une section
   * Met à jour l'état local SANS sauvegarder immédiatement en base
   * La sauvegarde globale se fera via le bouton "Sauvegarder"
   */
  const handleSectionSave = async (section: DCESectionType, data: any) => {
    console.log(`📝 Section ${section} modifiée localement (pas encore sauvegardée en base)`);
    
    // Mise à jour locale uniquement - pas de sauvegarde immédiate
    updateSectionLocal(section, data);
    
    // Optionnel : afficher un message de confirmation
    // console.log(`✓ Section ${section} mise à jour localement. N'oubliez pas de sauvegarder !`);
  };

  /**
   * Changement d'onglet avec sauvegarde automatique si modifications non sauvegardées
   */
  const handleSectionChange = async (newSection: DCESectionType) => {
    // Si des modifications non sauvegardées ET que l'utilisateur change d'onglet
    if (isDirty && activeSection && activeSection !== newSection) {
      console.log('⚠️ Modifications non sauvegardées détectées lors du changement d\'onglet');
      
      // Demander confirmation ou sauvegarder automatiquement
      const shouldSave = window.confirm(
        'Vous avez des modifications non sauvegardées. Voulez-vous les sauvegarder maintenant ?'
      );
      
      if (shouldSave) {
        try {
          await saveDCE();
          console.log('✅ Sauvegarde automatique effectuée avant changement d\'onglet');
        } catch (error) {
          console.error('❌ Erreur lors de la sauvegarde automatique:', error);
          alert('Erreur lors de la sauvegarde. Vos modifications ne seront pas perdues mais veuillez sauvegarder manuellement.');
          return; // Ne pas changer d'onglet si la sauvegarde échoue
        }
      }
    }
    
    // Changer d'onglet
    setActiveSection(newSection);
  };

  const handleBackToSelection = () => {
    setShowWelcome(true);
    setActiveSection(null);
    setNumeroProcedure('');
    setSelectedProcedure(null);
  };

  /**
   * 🆕 Handler pour résoudre les conflits
   */
  const handleResolveConflicts = async (resolutions: Record<string, any>) => {
    const success = await resolveConflicts(resolutions);
    if (success) {
      setShowConflictModal(false);
      // Recharger le DCE pour afficher les données mises à jour
      await loadDCE();
    }
  };

  const renderSectionContent = () => {
    if (!dceState || !activeSection) return null;

    switch (activeSection) {
      case 'configurationGlobale':
        return (
          <ConfigurationGlobaleForm
            data={dceState.configurationGlobale}
            onChange={data => handleSectionSave('configurationGlobale', data)}
            procedure={selectedProcedure}
          />
        );
      case 'reglementConsultation':
        return (
          <ReglementConsultationLegacyWrapper 
            numeroProcedure={numeroProcedure}
            onSave={data => handleSectionSave('reglementConsultation', data)}
            initialData={dceState.reglementConsultation}
          />
        );
      case 'acteEngagement':
        return (
          <ActeEngagementMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
            reglementConsultation={dceState.reglementConsultation}
          />
        );
      case 'ccap':
        return (
          <CCAPMultiLots
            procedureId={numeroProcedure}
            onSave={data => handleSectionSave('ccap', data)}
            initialData={dceState.ccap}
          />
        );
      case 'cctp':
        return (
          <CCTPMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
          />
        );
      case 'bpu':
        return (
          <BPUMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
          />
        );
      case 'dqe':
        return (
          <DQEMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
          />
        );
      case 'dpgf':
        return (
          <DPGFMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
          />
        );
      case 'documentsAnnexes':
        return (
          <DocumentsAnnexesForm
            data={ensureDocumentsAnnexes(dceState.documentsAnnexes)}
            onSave={data => handleSectionSave('documentsAnnexes', data)}
            isSaving={savingSection === 'documentsAnnexes' || isLoadingDCE}
          />
        );
      case 'crt':
        return (
          <CRTForm
            data={ensureCRT(dceState.crt)}
            onSave={data => handleSectionSave('crt', data)}
            isSaving={savingSection === 'crt' || isLoadingDCE}
          />
        );
      case 'qt':
        return (
          <QuestionnaireTechnique
            initialNumeroProcedure={numeroProcedure}
            onSave={data => handleSectionSave('qt', data)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#004d3d] to-[#003329] text-white px-4 py-2 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              title="Retour"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">DCE Complet</h1>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Écran de bienvenue / Sélecteur */}
        {showWelcome ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-[#006d57]" />
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  Créer ou ouvrir un DCE
                </h2>
                <p className="text-gray-600">
                  Saisissez un numéro de procédure pour démarrer
                </p>
              </div>

              <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Numéro de procédure (5 chiffres)
                </label>
                <ProcedureSelector
                  value={numeroProcedure}
                  onChange={setNumeroProcedure}
                  onProcedureSelected={setSelectedProcedure}
                />

                {procedureResult.error && !procedureResult.isValid && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-700">{procedureResult.error}</p>
                  </div>
                )}
              </div>

              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <FileText className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Auto-remplissage</p>
                  <p className="text-xs text-gray-600 mt-1">Depuis la procédure</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <CheckSquare className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Une seule saisie</p>
                  <p className="text-xs text-gray-600 mt-1">Données synchronisées</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                  <FolderOpen className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Tous les documents</p>
                  <p className="text-xs text-gray-600 mt-1">RC, AE, CCAP, CCTP...</p>
                </div>
              </div>

              <div className="mt-6 flex justify-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                >
                  Retour au menu précédent
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* En-tête de procédure */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center justify-between mb-2 gap-3">
                <ProcedureHeader procedure={selectedProcedure} />
                <button
                  onClick={handleBackToSelection}
                  className="px-3 py-1.5 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Retour à la sélection
                </button>
              </div>
              
              {dceState && (
                <DCEStatusBar
                  dceState={dceState}
                  isDirty={isDirty}
                  isNew={isNew}
                  onSave={handleSave}
                  onPublish={publishDCE}
                  onRefresh={refreshDCE}
                  isSaving={isLoadingDCE}
                  conflicts={conflicts}
                  onShowConflicts={() => setShowConflictModal(true)}
                />
              )}

              {dceError && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{dceError}</p>
                </div>
              )}
            </div>

            {/* Zone de travail : Sidebar + Contenu */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar - Menu des sections */}
              <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto flex-shrink-0">
                <div className="p-4">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                    Sections du DCE
                  </h3>
                  <nav className="space-y-1">
                    {sections.map(section => {
                      const isActive = activeSection === section.key;
                      const isCompleted = isSectionCompleted(section.key);

                      return (
                        <button
                          key={section.key}
                          onClick={() => setActiveSection(section.key)}
                          className={`
                            w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all
                            ${isActive
                              ? 'bg-green-50 text-green-700 font-medium shadow-sm'
                              : 'text-gray-700 hover:bg-gray-50'
                            }
                          `}
                        >
                          <div className={`flex-shrink-0 ${isActive ? 'text-[#2F5B58]' : 'text-gray-400'}`}>
                            {section.icon}
                          </div>
                          <span className="flex-1 truncate text-sm">
                            {section.label}
                          </span>
                          {isCompleted && (
                            <CheckSquare className="w-4 h-4 text-green-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Zone de contenu */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-8">
                {!activeSection ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Sélectionnez une section dans le menu</p>
                      <p className="text-sm mt-2">Toutes les sections ont été pré-remplies automatiquement</p>
                    </div>
                  </div>
                ) : (
                  <div className="max-w-5xl mx-auto">
                    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">
                        {sections.find(s => s.key === activeSection)?.label}
                      </h2>
                      {renderSectionContent()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 🆕 Modal de résolution des conflits */}
      {conflicts && conflicts.hasConflicts && (
        <ConflictResolverModal
          conflicts={conflicts.conflicts}
          onResolve={handleResolveConflicts}
          onCancel={() => setShowConflictModal(false)}
          isOpen={showConflictModal}
        />
      )}
    </div>
  );
}
