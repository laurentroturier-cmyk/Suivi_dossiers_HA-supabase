import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { NAVIGATION_DOMAINES } from '@/config/navigationConfig';

interface LandingPageProps {
  onNavigate: (tab: string) => void;
  onOpenAdmin: () => void;
  projectsCount: number;
  proceduresCount: number;
  isAdmin?: boolean;
  acheteurNom?: string | null;
  acheteurPrenom?: string | null;
  userEmoji?: string | null;
  userEmail?: string | null;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, onOpenAdmin, projectsCount, proceduresCount, isAdmin = false, acheteurNom, acheteurPrenom, userEmoji, userEmail }) => {
  // Résolution du prénom (par ordre de priorité) :
  // 1. acheteur_prenom (colonne dédiée dans profiles)
  // 2. Dernier mot de acheteur_nom ("Auvray Laurine" → "Laurine")
  // 3. Première partie de l'email avant le point ("laurine.auvray@…" → "Laurine")
  const prenom = (() => {
    if (acheteurPrenom) return acheteurPrenom.trim();
    if (acheteurNom) {
      const last = acheteurNom.trim().split(/\s+/).pop();
      if (last) return last;
    }
    if (userEmail) {
      const local = userEmail.split('@')[0];
      const first = local.split('.')[0];
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
    }
    return null;
  })();
  // État pour gérer l'expansion de la section NOTI dans Rédaction
  const [notiExpanded, setNotiExpanded] = useState(false);
  
  // Domaines fonctionnels — source unique dans config/navigationConfig.ts
  const domaines = NAVIGATION_DOMAINES;

  const [openTileId, setOpenTileId] = useState<string | null>(null);
  const visibleDomaines = domaines.filter(d => !d.adminOnly || isAdmin);

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
          {/* Message de bienvenue */}
          {prenom && (
            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700 dark:text-slate-200">
              <span>Bonjour {prenom}</span>
              {userEmoji && <span>{userEmoji}</span>}
            </div>
          )}

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
          {visibleDomaines.map((domaine) => {
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
