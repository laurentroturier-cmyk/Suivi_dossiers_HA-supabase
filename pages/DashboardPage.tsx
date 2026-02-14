import React, { useState } from 'react';
import { ChevronDown, ChevronUp, RefreshCw, X, AlertCircle } from 'lucide-react';

/**
 * Dashboard Page - Tableau de bord avec séparation claire Projets / Procédures
 * Architecture Accordion pour éviter la confusion des filtres
 */

interface DashboardPageProps {
  // Props pour les données et filtres projets
  kpis?: any;
  selectedAcheteurs?: string[];
  selectedPriorities?: string[];
  selectedFamilies?: string[];
  selectedDeployYears?: string[];
  selectedStatuses?: string[];
  onToggleAcheteur?: (val: string) => void;
  onTogglePriority?: (val: string) => void;
  onToggleFamily?: (val: string) => void;
  onToggleDeployYear?: (val: string) => void;
  onToggleDossierStatus?: (val: string) => void;
  onResetProjectFilters?: () => void;
  
  // Props pour les données et filtres procédures  
  selectedProcTypes?: string[];
  selectedYears?: string[];
  selectedProcedureStatuses?: string[];
  selectedLaunchYears?: string[];
  selectedOfferYears?: string[];
  onToggleProcType?: (val: string) => void;
  onToggleYear?: (val: string) => void;
  onToggleProcedureStatus?: (val: string) => void;
  onToggleLaunchYear?: (val: string) => void;
  onToggleOfferYear?: (val: string) => void;
  onResetProcedureFilters?: () => void;
  
  // Handler pour la navigation vers le détail
  navigateToDetail?: (detailInfo: { type: string; data: any[]; title: string; filterField: string; filterValue: string }) => void;
  
  // Props pour les graphiques (composants à passer)
  FilterDropdown?: React.FC<any>;
  SimpleBarChart?: React.FC<any>;
  KPITile?: React.FC<any>;
  
  // Options pour les filtres
  refAcheteurs?: any[];
  priorityOptions?: string[];
  uniqueFamilies?: string[];
  uniqueDeployYears?: string[];
  DOSSIER_STATUS_OPTIONS?: string[];
  uniqueTypesForFilter?: string[];
  uniqueYears?: string[];
  uniqueLaunchYears?: string[];
  uniqueOfferYears?: string[];
  PROCEDURE_STATUS_OPTIONS?: string[];
}

const DashboardPage: React.FC<DashboardPageProps> = (props) => {
  const [projectsSectionExpanded, setProjectsSectionExpanded] = useState(true);
  const [proceduresSectionExpanded, setProceduresSectionExpanded] = useState(true);
  
  // Si pas de props (mode standalone), afficher le message de migration
  if (!props.kpis) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
            Tableau de bord
          </h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl p-6">
            <p className="text-yellow-800 dark:text-yellow-200">
              ⚠️ Ce composant doit être utilisé depuis App.tsx avec les props appropriées
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  const {
    kpis,
    selectedAcheteurs = [],
    selectedPriorities = [],
    selectedFamilies = [],
    selectedDeployYears = [],
    selectedStatuses = [],
    selectedProcTypes = [],
    selectedYears = [],
    selectedProcedureStatuses = [],
    selectedLaunchYears = [],
    selectedOfferYears = [],
    onToggleAcheteur,
    onTogglePriority,
    onToggleFamily,
    onToggleDeployYear,
    onToggleDossierStatus,
    onResetProjectFilters,
    onToggleProcType,
    onToggleYear,
    onToggleProcedureStatus,
    onToggleLaunchYear,
    onToggleOfferYear,
    onResetProcedureFilters,
    navigateToDetail,
    FilterDropdown,
    SimpleBarChart,
    KPITile,
    refAcheteurs = [],
    priorityOptions = [],
    uniqueFamilies = [],
    uniqueDeployYears = [],
    DOSSIER_STATUS_OPTIONS = [],
    uniqueTypesForFilter = [],
    uniqueYears = [],
    uniqueLaunchYears = [],
    uniqueOfferYears = [],
    PROCEDURE_STATUS_OPTIONS = [],
  } = props;
  
  const getProp = (obj: any, key: string) => {
    if (!obj || !key) return undefined;
    if (obj[key] !== undefined) return obj[key];
    const target = key.toLowerCase().replace(/[\s_()-]/g, '');
    const actualKeys = Object.keys(obj);
    const foundKey = actualKeys.find(k => k.toLowerCase().replace(/[\s_()-]/g, '') === target);
    return foundKey ? obj[foundKey] : undefined;
  };
  
  // Compteurs de filtres actifs
  const projectFiltersCount = selectedAcheteurs.length + selectedPriorities.length + 
    selectedFamilies.length + selectedDeployYears.length + 
    (selectedStatuses.length !== DOSSIER_STATUS_OPTIONS.filter(s => !s.startsWith('4') && !s.startsWith('5')).length ? 1 : 0);
  
  const procedureFiltersCount = selectedAcheteurs.length + selectedProcTypes.length + selectedYears.length + selectedProcedureStatuses.length + selectedLaunchYears.length + selectedOfferYears.length;
  
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      
      {/* KPI Globaux (non filtrés) */}
      <div className="dashboard-kpi-section bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-6 rounded-3xl border-2 border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-2 h-8 bg-slate-600 rounded-full"></div>
          <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
            Indicateurs Globaux
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold">(Non filtrés)</span>
        </div>
        {KPITile && (
          <div className="dashboard-kpi-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            <KPITile label="NB PROJETS" value={kpis.nbP} />
            <KPITile label="NB PROCÉDURES" value={kpis.nbProc} />
            <KPITile label="TOTAL PROJET" value={Math.round(kpis.amtP)} unit="€" />
            <KPITile label="TOTAL PROCÉDURES" value={Math.round(kpis.amtProc)} unit="€" />
            <KPITile label="MOYENNE PROJET" value={Math.round(kpis.avgP)} unit="€" />
          </div>
        )}
      </div>

      {/* SECTION PROJETS - Accordion */}
      <div className="dashboard-section-card dashboard-section-projets bg-white dark:bg-gray-800 rounded-3xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden shadow-lg">
        {/* Header cliquable */}
        <button
          onClick={() => setProjectsSectionExpanded(!projectsSectionExpanded)}
          className="dashboard-section-header w-full px-6 py-5 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/50 dark:hover:to-cyan-900/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-black text-blue-900 dark:text-blue-100 uppercase tracking-wide">
              🏗️ Projets
            </h2>
            <span className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded-full">
              {kpis.nbP} projets
            </span>
            {projectFiltersCount > 0 && (
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                {projectFiltersCount} filtre{projectFiltersCount > 1 ? 's' : ''} actif{projectFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              {projectsSectionExpanded ? 'Réduire' : 'Développer'}
            </span>
            {projectsSectionExpanded ? (
              <ChevronUp className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            )}
          </div>
        </button>
        
        {/* Contenu */}
        {projectsSectionExpanded && (
          <div className="dashboard-section-content p-6 space-y-6 bg-blue-50/30 dark:bg-blue-950/20">
            
            {/* Message explicatif */}
            <div className="dashboard-info-banner dashboard-info-banner-projets bg-blue-100 dark:bg-blue-900/40 border-l-4 border-blue-600 p-4 rounded-r-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-blue-900 dark:text-blue-100">
                    💡 Ces filtres affectent UNIQUEMENT les données projets ci-dessous
                  </p>
                  <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                    Les graphiques procédures ne sont pas impactés par ces filtres
                  </p>
                </div>
              </div>
            </div>
            
            {/* Filtres Projets */}
            {FilterDropdown && (
              <div className="dashboard-filters-box bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-blue-200 dark:border-blue-700 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-blue-900 dark:text-blue-100 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    Filtres Projets
                  </h3>
                  {projectFiltersCount > 0 && onResetProjectFilters && (
                    <button
                      onClick={onResetProjectFilters}
                      className="px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  <FilterDropdown
                    id="proj-acheteur"
                    label="Acheteur"
                    options={[...refAcheteurs].sort((a, b) => {
                      const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                      const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                      return String(nameA).localeCompare(String(nameB));
                    }).map(a => getProp(a, 'Personne') || getProp(a, 'Nom'))}
                    selected={selectedAcheteurs}
                    onToggle={onToggleAcheteur}
                  />
                  <FilterDropdown
                    id="proj-priority"
                    label="Priorité"
                    options={priorityOptions}
                    selected={selectedPriorities}
                    onToggle={onTogglePriority}
                  />
                  <FilterDropdown
                    id="proj-family"
                    label="Famille d'achat"
                    options={uniqueFamilies}
                    selected={selectedFamilies}
                    onToggle={onToggleFamily}
                  />
                  <FilterDropdown
                    id="proj-deploy-year"
                    label="Année de Déploiement"
                    options={uniqueDeployYears}
                    selected={selectedDeployYears}
                    onToggle={onToggleDeployYear}
                  />
                  <FilterDropdown
                    id="proj-status"
                    label="Statut projet"
                    options={DOSSIER_STATUS_OPTIONS}
                    selected={selectedStatuses}
                    onToggle={onToggleDossierStatus}
                  />
                </div>
              </div>
            )}
            
            {/* Graphiques Projets */}
            {SimpleBarChart && (
              <div>
                <h3 className="text-lg font-black text-blue-900 dark:text-blue-100 mb-4 uppercase tracking-wide">
                  📊 Graphiques Projets
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  <SimpleBarChart
                    data={kpis.charts.projetsAcheteur}
                    title="Top Acheteurs (Projets)"
                    color="bg-blue-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Acheteur', filterField: 'Acheteur', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.projetsPriorite}
                    title="Projets par Priorité"
                    color="bg-cyan-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Priorité', filterField: 'Priorite', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.projetsStatut}
                    title="Projets par Statut"
                    color="bg-teal-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Statut', filterField: 'StatutDossier', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.projetsClientInterne}
                    title="Projets par Client Interne"
                    color="bg-indigo-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'procedure', data: kpis.filteredDossiers, title: 'Projets par Client Interne', filterField: 'ClientInterne', filterValue: label });
                    } : undefined}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* SECTION PROCÉDURES - Accordion */}
      <div className="dashboard-section-card dashboard-section-procedures bg-white dark:bg-gray-800 rounded-3xl border-2 border-green-200 dark:border-green-800 overflow-hidden shadow-lg">
        {/* Header cliquable */}
        <button
          onClick={() => setProceduresSectionExpanded(!proceduresSectionExpanded)}
          className="dashboard-section-header w-full px-6 py-5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/50 dark:hover:to-emerald-900/50 transition-all flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
            <h2 className="text-2xl font-black text-green-900 dark:text-green-100 uppercase tracking-wide">
              📋 Procédures
            </h2>
            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full">
              {kpis.nbProc} procédures
            </span>
            {procedureFiltersCount > 0 && (
              <span className="px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full animate-pulse">
                {procedureFiltersCount} filtre{procedureFiltersCount > 1 ? 's' : ''} actif{procedureFiltersCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-green-700 dark:text-green-300 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              {proceduresSectionExpanded ? 'Réduire' : 'Développer'}
            </span>
            {proceduresSectionExpanded ? (
              <ChevronUp className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <ChevronDown className="w-6 h-6 text-green-600 dark:text-green-400" />
            )}
          </div>
        </button>
        
        {/* Contenu */}
        {proceduresSectionExpanded && (
          <div className="dashboard-section-content p-6 space-y-6 bg-green-50/30 dark:bg-green-950/20">
            
            {/* Message explicatif */}
            <div className="dashboard-info-banner dashboard-info-banner-procedures bg-green-100 dark:bg-green-900/40 border-l-4 border-green-600 p-4 rounded-r-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-bold text-green-900 dark:text-green-100">
                    💡 Ces filtres affectent UNIQUEMENT les données procédures ci-dessous
                  </p>
                  <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                    Les graphiques projets ne sont pas impactés par ces filtres
                  </p>
                </div>
              </div>
            </div>
            
            {/* Filtres Procédures */}
            {FilterDropdown && (
              <div className="dashboard-filters-box bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-green-200 dark:border-green-700 space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-green-900 dark:text-green-100 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    Filtres Procédures
                  </h3>
                  {procedureFiltersCount > 0 && onResetProcedureFilters && (
                    <button
                      onClick={onResetProcedureFilters}
                      className="px-4 py-2 text-xs font-bold text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Réinitialiser
                    </button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <FilterDropdown
                    id="proc-acheteur"
                    label="Acheteur"
                    options={[...refAcheteurs].sort((a, b) => {
                      const nameA = getProp(a, 'Personne') || getProp(a, 'Nom') || '';
                      const nameB = getProp(b, 'Personne') || getProp(b, 'Nom') || '';
                      return String(nameA).localeCompare(String(nameB));
                    }).map(a => getProp(a, 'Personne') || getProp(a, 'Nom'))}
                    selected={selectedAcheteurs}
                    onToggle={onToggleAcheteur}
                  />
                  <FilterDropdown
                    id="proc-type"
                    label="Type de procédure"
                    options={uniqueTypesForFilter}
                    selected={selectedProcTypes}
                    onToggle={onToggleProcType}
                  />
                  <FilterDropdown
                    id="proc-status"
                    label="Statut procédure"
                    options={PROCEDURE_STATUS_OPTIONS}
                    selected={selectedProcedureStatuses}
                    onToggle={onToggleProcedureStatus}
                  />
                  <FilterDropdown
                    id="proc-launch-year"
                    label="Année lancement"
                    options={uniqueLaunchYears}
                    selected={selectedLaunchYears}
                    onToggle={onToggleLaunchYear}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                  <FilterDropdown
                    id="proc-offer-year"
                    label="Année remise offres"
                    options={uniqueOfferYears}
                    selected={selectedOfferYears}
                    onToggle={onToggleOfferYear}
                  />
                </div>
              </div>
            )}
            
            {/* Graphiques Procédures */}
            {SimpleBarChart && (
              <div>
                <h3 className="text-lg font-black text-green-900 dark:text-green-100 mb-4 uppercase tracking-wide">
                  📊 Graphiques Procédures
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                  <SimpleBarChart
                    data={kpis.charts.proceduresAcheteur}
                    title="Top Acheteurs (Procédures)"
                    color="bg-green-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Acheteur', filterField: 'Acheteur', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresType}
                    title="Procédures par Type"
                    color="bg-emerald-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Type', filterField: 'Type de procédure', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresStatut}
                    title="Procédures par Statut"
                    color="bg-teal-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Procédures par Statut', filterField: 'Statut de la consultation', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresTypeMoyenne}
                    title="Montant Moyen par Type (€)"
                    color="bg-lime-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Montant Moyen par Type', filterField: 'Type de procédure', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresDispoEnv}
                    title="Dispositions Environnementales"
                    color="bg-green-700"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Dispositions Environnementales', filterField: 'Dispo environnementales', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresDispoSoc}
                    title="Dispositions Sociales"
                    color="bg-emerald-700"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Dispositions Sociales', filterField: 'Dispo sociales', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresProjetsInnovants}
                    title="Projets Innovants"
                    color="bg-cyan-600"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Projets Innovants', filterField: 'Projet ouvert à l\'acquisition de solutions innovantes', filterValue: label });
                    } : undefined}
                  />
                  <SimpleBarChart
                    data={kpis.charts.proceduresProjetsTPEPME}
                    title="Projets TPE/PME"
                    color="bg-teal-700"
                    onClick={navigateToDetail ? (label) => {
                      navigateToDetail({ type: 'project', data: kpis.filteredProcedures, title: 'Projets TPE/PME', filterField: 'Projet facilitant l\'accès aux TPE/PME', filterValue: label });
                    } : undefined}
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
