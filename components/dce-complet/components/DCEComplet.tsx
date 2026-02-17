// ============================================
// DCEComplet - Page principale du module DCE Complet
// Interface centralisée pour tous les documents du DCE
// ============================================

import React, { useState, useEffect } from 'react';
import { X, FileText, CheckSquare, FileCheck, FileSpreadsheet, FolderOpen, ArrowLeft, AlertTriangle, Settings, ChevronDown, ChevronRight } from 'lucide-react';
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
import { BPUTMAMultiLots } from './modules/BPUTMAMultiLots';
import { DQEMultiLots } from './modules/DQEMultiLots';
import { DPGFMultiLots } from './modules/DPGFMultiLots';
import { DocumentsAnnexesForm } from './modules/DocumentsAnnexesForm';
import { CRTForm } from './modules/CRTForm';
import { AnnexesFinancieresHub } from './modules/AnnexesFinancieresHub';
import { ClausesContractuellesHub } from './modules/ClausesContractuellesHub';
import { ModuleComingSoon } from './modules/ModuleComingSoon';
import { ReponseTechniqueHub } from './modules/ReponseTechniqueHub';
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
  /** Sous-menu Règlement de Consultation : ouvert/fermé */
  const [rcSubmenuOpen, setRcSubmenuOpen] = useState(false);
  /** Section RC affichée (index 0–7) quand activeSection === 'reglementConsultation' */
  const [rcSelectedSection, setRcSelectedSection] = useState(0);

  /** Sections du Règlement de consultation (même ordre que dans ReglementConsultation.tsx) */
  const RC_SECTIONS = [
    'En-tête',
    'Pouvoir adjudicateur',
    'Objet de la consultation',
    'Conditions',
    'Type de marché',
    'DCE',
    'Jugement des offres',
  ];

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
    { key: 'clausesContractuelles', label: 'Pièces administratives & techniques', icon: <FileCheck className="w-5 h-5" /> },
    { key: 'annexesFinancieres', label: 'Annexes financières', icon: <FileSpreadsheet className="w-5 h-5" /> },
    { key: 'documentsAnnexes', label: 'Documents Annexes', icon: <FolderOpen className="w-5 h-5" /> },
    { key: 'reponseTechnique', label: 'Réponse technique', icon: <FileText className="w-5 h-5" /> },
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
      nbLots: dceState.configurationGlobale?.lots?.length || 0,
    });

    // Afficher immédiatement un feedback visuel
    console.log('⏳ Sauvegarde en cours...');
    
    const success = await saveDCE();
    
    if (success) {
      console.log('✅ Sauvegarde terminée avec succès');
      alert('✓ DCE sauvegardé avec succès dans la base de données');
    } else {
      console.error('❌ Échec de la sauvegarde');
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
   * Met à jour l'état local ET sauvegarde immédiatement en base
   */
  const handleSectionSave = async (section: DCESectionType, data: any) => {
    console.log(`📝 Section ${section} - Sauvegarde en cours...`);
    
    // Utiliser updateSection qui sauvegarde directement en base
    const success = await updateSection(section, data);
    
    if (!success) {
      // L'erreur sera affichée par le composant appelant
      throw new Error(`Échec de la sauvegarde de la section ${section}`);
    }
    
    console.log(`✅ Section ${section} sauvegardée avec succès`);
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
            lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
            initialRCSection={Math.min(rcSelectedSection, RC_SECTIONS.length - 1)}
            hideRCSectionsSidebar
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
            openTypeSelectorOnMount={!dceState.ccap?.typeCCAP}
            onBackToHub={() => setActiveSection('clausesContractuelles')}
          />
        );
      case 'cctp':
        return (
          <ModuleComingSoon
            title="Module CCTP – en cours de préparation"
            description="Le module CCTP multi-lots est en cours de finalisation."
            onBack={() => setActiveSection('clausesContractuelles')}
          />
        );
      case 'clausesContractuelles':
        return (
          <ClausesContractuellesHub
            onSelectSection={(section) => setActiveSection(section)}
          />
        );
      case 'annexesFinancieres':
        return (
          <AnnexesFinancieresHub
            onSelectSection={(section) => setActiveSection(section)}
          />
        );
      case 'bpu':
        return (
          <BPUMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
            procedureInfo={{
              numeroProcedure: numeroProcedure,
              titreMarche: dceState.titreMarche || selectedProcedure?.['Intitulé'] || '',
              acheteur: selectedProcedure?.['Acheteur'] || dceState.configurationGlobale?.informationsGenerales?.acheteur || '',
            }}
            lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
            onBackToHub={() => setActiveSection('annexesFinancieres')}
          />
        );
      case 'bpuTMA':
        return (
          <BPUTMAMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
            lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
            onBackToHub={() => setActiveSection('annexesFinancieres')}
          />
        );
      case 'dqe':
        return (
          <DQEMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
            procedureInfo={{
              numeroProcedure: numeroProcedure,
              titreMarche: dceState.titreMarche || selectedProcedure?.['Intitulé'] || '',
              acheteur: selectedProcedure?.['Acheteur'] || dceState.configurationGlobale?.informationsGenerales?.acheteur || '',
            }}
            lotsFromConfigurationGlobale={dceState.configurationGlobale?.lots || []}
            onBackToHub={() => setActiveSection('annexesFinancieres')}
          />
        );
      case 'dpgf':
        return (
          <DPGFMultiLots
            procedureId={numeroProcedure}
            onSave={() => loadDCE()}
            configurationGlobale={dceState.configurationGlobale}
            onBackToHub={() => setActiveSection('annexesFinancieres')}
          />
        );
      case 'documentsAnnexes':
        return (
          <div className="dce-documents-annexes-placeholder">
            <ModuleComingSoon
              title="Annexes au CCAP / CCTP – en cours de préparation"
              description="Ce module centralisera prochainement les annexes communes (administratives et techniques) rattachées au CCAP et au CCTP."
              onBack={() => setActiveSection('clausesContractuelles')}
            />
          </div>
        );
      case 'reponseTechnique':
        return (
          <ReponseTechniqueHub
            onSelectSection={(section) => setActiveSection(section)}
          />
        );
      case 'crt':
        return (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveSection('reponseTechnique')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              <span className="text-base leading-none">←</span>
              Retour à la réponse technique
            </button>
            <CRTForm
              data={ensureCRT(dceState.crt)}
              onSave={data => handleSectionSave('crt', data)}
              isSaving={savingSection === 'crt' || isLoadingDCE}
            />
          </div>
        );
      case 'qt':
        return (
          <div className="space-y-4">
            <button
              type="button"
              onClick={() => setActiveSection('reponseTechnique')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900"
            >
              <span className="text-base leading-none">←</span>
              Retour à la réponse technique
            </button>
            <QuestionnaireTechnique
              initialNumeroProcedure={numeroProcedure}
              onSave={data => handleSectionSave('qt', data)}
            />
          </div>
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
            <div className="p-3 dce-header-bg dce-header-container dce-fixed-header border-b border-gray-200 flex-shrink-0">
              <div className="flex items-start justify-between gap-6">
                {/* Colonne gauche : carte procédure */}
                <div className="flex flex-col gap-3">
                  <ProcedureHeader procedure={selectedProcedure} />
                </div>

                {/* Colonne droite : barre d'état du DCE (avec bouton retour inclus) */}
                {dceState && (
                  <div className="flex items-center">
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
                      onBackToSelection={handleBackToSelection}
                    />
                  </div>
                )}
              </div>

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
                      const isRc = section.key === 'reglementConsultation';
                      const isActive = activeSection === section.key;
                      const isRcExpanded = isRc && rcSubmenuOpen;

                      if (isRc) {
                        return (
                          <div key={section.key} className="space-y-0">
                            <button
                              onClick={() => {
                                setRcSubmenuOpen(prev => !prev);
                                if (!rcSubmenuOpen) {
                                  setActiveSection('reglementConsultation');
                                  setRcSelectedSection(0);
                                }
                              }}
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
                              <span className={`flex-shrink-0 transition-transform ${isRcExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-4 h-4" />
                              </span>
                            </button>
                            {isRcExpanded && (
                              <div className="pl-4 pr-2 py-1 space-y-0.5 border-l-2 border-green-200 ml-4 mt-1 mb-2">
                                {RC_SECTIONS.map((label, index) => (
                                  <button
                                    key={index}
                                    onClick={() => {
                                      setActiveSection('reglementConsultation');
                                      setRcSelectedSection(index);
                                    }}
                                    className={`
                                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all
                                      ${activeSection === 'reglementConsultation' && rcSelectedSection === index
                                        ? 'bg-green-50 text-green-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-50'
                                      }
                                    `}
                                  >
                                    <span className="flex items-center gap-2">
                                      {activeSection === 'reglementConsultation' && rcSelectedSection === index && (
                                        <ChevronRight className="w-3.5 h-3.5 text-green-600" />
                                      )}
                                      {label}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={section.key}
                          onClick={() => {
                            setActiveSection(section.key);
                            if (section.key !== 'reglementConsultation') setRcSubmenuOpen(false);
                          }}
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
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Zone de contenu */}
              <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                {!activeSection ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">Sélectionnez une section dans le menu</p>
                      <p className="text-sm mt-2">Toutes les sections ont été pré-remplies automatiquement</p>
                    </div>
                  </div>
                ) : (
                  <div className="dce-complet-content bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-lg shadow-sm p-6 mr-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-slate-100 mb-4">
                      {activeSection === 'reglementConsultation'
                        ? `Règlement de Consultation – ${RC_SECTIONS[rcSelectedSection]}`
                        : sections.find(s => s.key === activeSection)?.label}
                    </h2>
                    {renderSectionContent()}
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
