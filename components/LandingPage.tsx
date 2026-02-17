import React, { useState } from 'react';
import { BarChart3, FileText, ClipboardList, PlayCircle, Download, Settings, TrendingUp, Building2, LineChart, Upload, Edit3, ChevronDown, ChevronRight, BookOpen, PackageOpen, Bell, Construction, GitBranch, FileSpreadsheet, ShoppingCart } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
  projectsCount: number;
  proceduresCount: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAdmin, projectsCount, proceduresCount }) => {
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
        { label: 'DCE Complet', tab: 'dce-complet', isAdmin: false, icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Accès rapide NOTI', tab: 'notifications-quick', isAdmin: false, icon: Bell, color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'NOTI Multi 🚧', tab: 'noti-multi', isAdmin: false, icon: Construction, color: 'text-gray-500 dark:text-gray-400' },
      ]
    },
    {
      id: 'analyse',
      titre: 'Analyse',
      description: 'Ouverture des plis, analyse des offres et rapports',
      icon: LineChart,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      borderHover: 'hover:border-emerald-400 dark:hover:border-emerald-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      isExperimental: true,
      actions: [
        { label: 'Ouverture des plis', tab: 'ouverture-plis', isAdmin: false, icon: PackageOpen, color: 'text-purple-600 dark:text-purple-400', description: 'Registres des retraits/dépôts et analyse des candidatures' },
        { label: 'Analyse AN01', tab: 'an01', isAdmin: false, icon: LineChart, color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Rapport de Présentation', tab: 'rapport-presentation', isAdmin: false, icon: FileText, color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Analyse des offres DQE', tab: 'analyse-offres-dqe', isAdmin: false, icon: BarChart3, color: 'text-[#004d3d] dark:text-cyan-400' },
        { label: 'Analyse DPGF', tab: 'analyse-dpgf', isAdmin: false, icon: FileSpreadsheet, color: 'text-teal-600 dark:text-teal-400' },

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
      id: 'immobilier',
      titre: 'ImmoVision',
      description: 'Module immobilier et gestion des biens',
      icon: Building2,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-500/40',
      borderHover: 'hover:border-amber-400 dark:hover:border-amber-400',
      btnBg: 'bg-gray-100 hover:bg-gray-200 dark:bg-[#252525] dark:hover:bg-[#2a2a2a]',
      btnText: 'text-gray-700 dark:text-gray-200',
      actions: [
        { label: 'ImmoVision', tab: 'immobilier', isAdmin: false },
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
  ];

  const [openTileId, setOpenTileId] = useState<string | null>(null);

  return (
    <div className="landing-page min-h-screen relative overflow-hidden">
      {/* Fond : clair (off-blanc) / sombre (bleu nuit) - ciblé aussi par dark-theme.css */}
      <div className="landing-bg-layer fixed inset-0 pointer-events-none -z-10 bg-[#f5f6fb] dark:bg-[#0f172a]" />

      {/* Header : glass clair / barre sombre lisible en dark */}
      <header className="landing-header relative z-10 sticky top-0 bg-white/10 dark:bg-slate-900/95 dark:border-slate-700 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 ring-2 ring-white/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">GestProjet</h1>
              <p className="text-[11px] text-gray-600 dark:text-slate-400">Projets achats DNA</p>
            </div>
          </div>
          {/* Stats en petit en haut à droite */}
          <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-slate-400">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{projectsCount} projet{projectsCount > 1 ? 's' : ''}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5 text-violet-500 dark:text-violet-400" />
              <span>{proceduresCount} procédure{proceduresCount > 1 ? 's' : ''}</span>
            </span>
          </div>
        </div>
      </header>

      {/* Grille de tuiles en verre */}
      <main className="landing-content-section relative z-10 max-w-6xl mx-auto px-6 py-10">
        <p className="landing-subtitle text-sm text-gray-600 dark:text-slate-300 mb-6">Choisissez un domaine pour accéder aux modules</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {domaines.map((domaine) => {
            const Icon = domaine.icon;
            const isOpen = openTileId === domaine.id;
            const firstAction = domaine.actions[0];
            const hasMultiple = domaine.actions.length > 1 || (firstAction && 'isGroup' in firstAction && firstAction.isGroup);

            return (
              <div
                key={domaine.id}
                className="landing-card relative rounded-2xl bg-white/25 dark:bg-slate-800 dark:border-slate-600 backdrop-blur-xl border border-slate-300/70 dark:border-slate-600 shadow-lg shadow-slate-200/30 dark:shadow-xl dark:shadow-black/30 overflow-hidden transition-all duration-300 hover:shadow-xl hover:bg-white/35 dark:hover:bg-slate-700 hover:border-slate-400/80 dark:hover:border-slate-500 flex flex-col h-full min-h-0"
              >
                <div className="p-5 flex flex-col flex-1 min-h-0">
                  <div className="flex items-start gap-3 flex-shrink-0">
                    <div className={`w-12 h-12 rounded-xl ${domaine.iconBg} flex items-center justify-center flex-shrink-0 ring-1 ring-black/5 dark:ring-white/10`}>
                      <Icon className={`w-6 h-6 ${domaine.iconColor}`} />
                    </div>
                    <div className="flex-1 min-w-0 text-left flex flex-col items-start">
                      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-0.5 w-full text-left">{domaine.titre}</h3>
                      <p className="text-xs text-gray-600 dark:text-slate-400 leading-snug w-full text-left">{domaine.description}</p>
                      {domaine.isExperimental && (
                        <span className="inline-block mt-1.5 text-[10px] font-medium text-amber-700 dark:text-amber-300 text-left">En évolution</span>
                      )}
                    </div>
                  </div>

                  {/* Zone actions alignée en bas de la tuile */}
                  <div className="mt-auto pt-4 flex-shrink-0">
                  {hasMultiple ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setOpenTileId(isOpen ? null : domaine.id)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-b from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-medium shadow-lg shadow-blue-400/30 transition"
                      >
                        Accéder aux modules
                        {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                      {isOpen && (
                        <div className="mt-3 space-y-1.5 pl-1">
                          {domaine.actions.map((action, idx) => {
                            const ActionIcon = action.icon;
                            if (action.isGroup && action.subActions) {
                              const isExpanded = (domaine.id === 'redaction' && notiExpanded);
                              return (
                                <div key={idx}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (domaine.id === 'redaction') setNotiExpanded(!notiExpanded);
                                    }}
                                    className="landing-card-action w-full flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-white/30 dark:bg-slate-700/60 dark:text-slate-200 text-sm text-gray-700 dark:hover:bg-slate-600/60 hover:bg-white/50 transition text-left"
                                  >
                                    <div className="flex items-start gap-2 min-w-0 flex-1 justify-start">
                                      {ActionIcon && <ActionIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.color || domaine.iconColor}`} />}
                                      <span className="block text-left flex-1 min-w-0">{action.label}</span>
                                    </div>
                                    {isExpanded ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                                  </button>
                                  {isExpanded && (
                                    <div className="ml-3 mt-1 space-y-1">
                                      {action.subActions!.map((subAction, i) => {
                                        const SubIcon = subAction.icon;
                                        return (
                                          <button
                                            key={i}
                                            type="button"
                                            onClick={() => subAction.isAdmin ? onOpenAdmin() : onNavigate(subAction.tab)}
                                            className="landing-card-subaction w-full flex items-start gap-2 px-3 py-1.5 rounded-lg text-xs text-gray-600 dark:text-slate-400 hover:bg-white/40 dark:hover:bg-slate-600/50 hover:text-gray-900 dark:hover:text-white transition text-left"
                                          >
                                            {SubIcon && <SubIcon className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />}
                                            <span className="block text-left flex-1 min-w-0">{subAction.label}</span>
                                          </button>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            }
                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => action.isAdmin ? onOpenAdmin() : onNavigate(action.tab!)}
                                className="landing-card-action w-full flex items-start justify-between gap-2 px-3 py-2 rounded-lg bg-white/30 dark:bg-slate-700/60 dark:text-slate-200 text-sm text-gray-700 dark:hover:bg-slate-600/60 hover:bg-white/50 transition text-left"
                              >
                                <div className="flex items-start gap-2 min-w-0 flex-1 justify-start">
                                  {ActionIcon && <ActionIcon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${action.color || domaine.iconColor}`} />}
                                  <span className="block text-left flex-1 min-w-0">{action.label}</span>
                                  {action.badge && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-800 dark:text-cyan-200 flex-shrink-0">{action.badge}</span>
                                  )}
                                </div>
                                <svg className="w-4 h-4 opacity-60 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => firstAction?.isAdmin ? onOpenAdmin() : firstAction?.tab && onNavigate(firstAction.tab)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-b from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600 text-white text-sm font-medium shadow-lg shadow-blue-400/30 transition"
                    >
                      Accéder
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer className="relative z-10 max-w-6xl mx-auto px-6 py-6 text-center">
        <p className="text-xs text-gray-500 dark:text-slate-500">
          Afpa - Direction Nationale des Achats - {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
