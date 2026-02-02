import React, { useState } from 'react';
import { BarChart3, FileText, ClipboardList, PlayCircle, Download, Settings, TrendingUp, Building2, LineChart, Upload, Edit3, ChevronDown, ChevronRight, BookOpen, PackageOpen, Bell, Construction, GitBranch } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
  projectsCount: number;
  proceduresCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAdmin, projectsCount, proceduresCount }) => {
  // État pour gérer l'expansion de la section Registres dans Analyse
  const [registresExpanded, setRegistresExpanded] = useState(false);
  // État pour gérer l'expansion de la section NOTI dans Rédaction
  const [notiExpanded, setNotiExpanded] = useState(false);
  
  // Domaines fonctionnels avec leurs actions
  const domaines = [
    {
      id: 'indicateurs',
      titre: 'Indicateurs & Pilotage',
      description: 'Tableaux de bord, analyses et visualisation Gantt pour piloter vos projets',
      icon: BarChart3,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
      borderColor: 'border-cyan-200 dark:border-cyan-500/40',
      borderHover: 'hover:border-cyan-400 dark:hover:border-cyan-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Tableau de bord', tab: 'dashboard', isAdmin: false },
        { label: 'Planning Gantt', tab: 'gantt', isAdmin: false },
      ]
    },
    {
      id: 'projets',
      titre: 'Projets d\'achats',
      description: 'Gestion complète de vos dossiers et projets d\'achats publics',
      icon: FileText,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Tous les projets', tab: 'dossiers', isAdmin: false },
        { label: 'ImmoVision', tab: 'immobilier', isAdmin: false, icon: Building2, color: 'text-amber-600 dark:text-amber-400' },
      ]
    },
    {
      id: 'procedures',
      titre: 'Procédures',
      description: 'Suivi des procédures de marchés publics et appels d\'offres',
      icon: ClipboardList,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 dark:bg-violet-500/20',
      borderColor: 'border-violet-200 dark:border-violet-500/40',
      borderHover: 'hover:border-violet-400 dark:hover:border-violet-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Toutes les procédures', tab: 'procedures', isAdmin: false },
      ]
    },
    {
      id: 'redaction',
      titre: 'Rédaction',
      description: 'Rédaction des documents et DCE',
      icon: Edit3,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-500/40',
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      isExperimental: true,
      actions: [
        { label: 'DCE Complet ✨', tab: 'dce-complet', isAdmin: false, icon: FileText, color: 'text-blue-600 dark:text-blue-400', badge: 'NOUVEAU' },
        { label: 'Accès rapide NOTI', tab: 'notifications-quick', isAdmin: false, icon: Bell, color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'NOTI Multi 🚧', tab: 'noti-multi', isAdmin: false, icon: Construction, color: 'text-gray-500 dark:text-gray-400' },
      ]
    },
    {
      id: 'analyse',
      titre: 'Analyse',
      description: 'Registres Retraits/Dépôts et analyse des offres AN01',
      icon: LineChart,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      isExperimental: true,
      actions: [
        { 
          label: 'Registres', 
          isGroup: true,
          icon: BookOpen, 
          color: 'text-indigo-600 dark:text-indigo-400',
          subActions: [
            { label: 'Registre des retraits', tab: 'retraits', isAdmin: false, icon: Download, color: 'text-orange-600 dark:text-orange-400' },
            { label: 'Registre des dépôts', tab: 'depots', isAdmin: false, icon: Upload, color: 'text-cyan-600 dark:text-cyan-400' },
          ]
        },
        { label: 'Ouverture des plis', tab: 'ouverture-plis', isAdmin: false, icon: PackageOpen, color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Analyse AN01', tab: 'an01', isAdmin: false, icon: LineChart, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Rapport de Présentation', tab: 'rapport-presentation', isAdmin: false, icon: FileText, color: 'text-blue-600 dark:text-blue-400' },

      ]
    },
    {
      id: 'execution',
      titre: 'Exécution des marchés',
      description: 'Gestion des contrats',
      icon: PlayCircle,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      borderColor: 'border-orange-200 dark:border-orange-500/40',
      borderHover: 'hover:border-orange-400 dark:hover:border-orange-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Contrats', tab: 'contrats', isAdmin: false },
      ]
    },
    {
      id: 'exports',
      titre: 'Exports & Données',
      description: 'Exportation et import de vos données en format Excel/CSV',
      icon: Download,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      borderColor: 'border-blue-200 dark:border-blue-500/40',
      borderHover: 'hover:border-blue-400 dark:hover:border-blue-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Exporter les données', tab: 'export', isAdmin: false },
      ]
    },
    {
      id: 'admin',
      titre: 'Administration',
      description: 'Gestion des utilisateurs et paramètres de l\'application',
      icon: Settings,
      iconColor: 'text-slate-600 dark:text-slate-400',
      iconBg: 'bg-slate-100 dark:bg-slate-500/20',
      borderColor: 'border-slate-200 dark:border-slate-500/40',
      borderHover: 'hover:border-slate-400 dark:hover:border-slate-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'Paramètres', tab: 'admin', isAdmin: true },
      ]
    },
    {
      id: 'endev',
      titre: 'EN Dev',
      description: 'Fonctionnalités en cours de développement et maquettes',
      icon: GitBranch,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-500/40',
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      isExperimental: true,
      actions: [
        { label: 'Workflow Analyse des offres', tab: 'workflow-analyse-offres', isAdmin: false, icon: BarChart3, color: 'text-[#004d3d] dark:text-cyan-400' },
      ]
    },
  ];

  return (
    <div className="landing-page min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-[#0d0f12] dark:via-[#121212] dark:to-[#0d0f12]">
      {/* Header */}
      <div className="landing-header bg-white/80 backdrop-blur-sm border-b border-gray-200 dark:bg-[#1E1E1E]/80 dark:border-[#333333] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#004d3d] to-[#006d57] dark:from-cyan-500 dark:to-cyan-600 flex items-center justify-center shadow-lg">
              <svg className="w-9 h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white">GestProjet</h1>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Plateforme de gestion des projets achats DNA</p>
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-[#252525] dark:border-[#333333]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Projets actifs</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{projectsCount}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 dark:bg-[#252525] dark:border-[#333333]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-950/30 flex items-center justify-center">
                  <ClipboardList className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Procédures</p>
                  <p className="text-2xl font-black text-gray-900 dark:text-white">{proceduresCount}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grille des domaines */}
      <div className="landing-content-section max-w-7xl mx-auto px-6 py-10">
        <div className="landing-section-header mb-8">
          <h2 className="landing-title text-2xl font-black text-gray-900 dark:text-white mb-2">Domaines fonctionnels</h2>
          <p className="landing-subtitle text-sm text-gray-600 dark:text-gray-400">Accédez rapidement aux différentes sections de l'application</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {domaines.map((domaine) => {
            const Icon = domaine.icon;
            
            return (
              <div
                key={domaine.id}
                className={`bg-white dark:bg-[#1E1E1E] rounded-3xl border-2 ${domaine.borderColor} ${domaine.borderHover} shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden`}
              >
                {/* Header de la carte */}
                <div className="p-6 pb-4">
                  <div className="flex items-start gap-4">
                    <div className={`w-14 h-14 rounded-2xl ${domaine.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <Icon className={`w-7 h-7 ${domaine.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">{domaine.titre}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{domaine.description}</p>
                        </div>
                        {domaine.isExperimental && (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200 border border-amber-200 dark:border-amber-500/60">
                            ⚠️ En évolution
                          </span>
                        )}
                      </div>
                      {domaine.isExperimental && (
                        <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                          Certaines fonctionnalités sont en cours de développement ou en phase bêta.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Séparateur */}
                <div className="border-t border-gray-200 dark:border-[#333333]"></div>

                {/* Actions */}
                <div className="p-6 space-y-2">
                  {domaine.actions.map((action, idx) => {
                    const ActionIcon = action.icon;
                    
                    // Si c'est un groupe (ex: Registres, NOTI)
                    if (action.isGroup && action.subActions) {
                      const isExpanded =
                        (domaine.id === 'analyse' && registresExpanded) ||
                        (domaine.id === 'redaction' && notiExpanded);
                      return (
                        <div key={idx}>
                          <button
                            onClick={() => {
                              if (domaine.id === 'analyse') setRegistresExpanded(!registresExpanded);
                              if (domaine.id === 'redaction') setNotiExpanded(!notiExpanded);
                            }}
                            className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${domaine.btnBg} ${domaine.btnText} border border-gray-200 dark:border-[#333333]`}
                          >
                            <div className="flex items-center gap-2">
                              {ActionIcon && (
                                <ActionIcon className={`w-4 h-4 ${action.color || domaine.iconColor}`} />
                              )}
                              <span>{action.label}</span>
                            </div>
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 transition-transform" />
                            ) : (
                              <ChevronRight className="w-4 h-4 transition-transform" />
                            )}
                          </button>
                          
                          {/* Sous-actions */}
                          {isExpanded && (
                            <div className="mt-2 ml-4 space-y-2">
                              {action.subActions.map((subAction, subIdx) => {
                                const SubIcon = subAction.icon;
                                return (
                                  <button
                                    key={subIdx}
                                    onClick={() => subAction.isAdmin ? onOpenAdmin() : onNavigate(subAction.tab)}
                                    className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-between group ${domaine.btnBg} ${domaine.btnText} border border-gray-200 dark:border-[#333333]`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {SubIcon && (
                                        <SubIcon className={`w-4 h-4 ${subAction.color || domaine.iconColor}`} />
                                      )}
                                      <span>{subAction.label}</span>
                                    </div>
                                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                                    </svg>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    }
                    
                    // Action normale
                    return (
                      <button
                        key={idx}
                        onClick={() => action.isAdmin ? onOpenAdmin() : onNavigate(action.tab)}
                        className={`w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-between group ${domaine.btnBg} ${domaine.btnText} border border-gray-200 dark:border-[#333333]`}
                      >
                        <div className="flex items-center gap-2">
                          {ActionIcon && (
                            <ActionIcon className={`w-4 h-4 ${action.color || domaine.iconColor}`} />
                          )}
                          <span>{action.label}</span>
                        </div>
                        <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto px-6 py-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Afpa - Direction Nationale des Achats - {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};

export default LandingPage;
