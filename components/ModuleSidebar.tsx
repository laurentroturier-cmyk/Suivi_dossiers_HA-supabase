import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { NAVIGATION_DOMAINES, TAB_TO_DOMAINE_ID, NavAction } from '@/config/navigationConfig';
import { TableType } from '@/types';

interface ModuleSidebarProps {
  isVisible: boolean;
  activeTab: string;
  onNavigate: (tab: TableType, title: string) => void;
  onGoHome: () => void;
  onOpenAdmin: () => void;
  isAdmin?: boolean;
}

const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  isVisible,
  activeTab,
  onNavigate,
  onGoHome,
  onOpenAdmin,
  isAdmin = false,
}) => {
  const domaineId = TAB_TO_DOMAINE_ID[activeTab] ?? null;
  const domaine = domaineId ? (NAVIGATION_DOMAINES.find(d => d.id === domaineId) ?? null) : null;
  const DomainIcon = domaine?.icon ?? null;

  const visibleActions = domaine?.actions.filter(a => !a.isAdmin || isAdmin) ?? [];

  const handleAction = (action: NavAction) => {
    if (action.isAdmin) {
      onOpenAdmin();
    } else if (action.tab) {
      onNavigate(action.tab as TableType, action.label);
    }
  };

  const showSidebar = isVisible && domaine !== null;

  return (
    <div
      className={`flex-shrink-0 overflow-hidden transition-all duration-300 ease-in-out ${
        showSidebar ? 'w-14 md:w-56' : 'w-0'
      }`}
    >
      <aside className="w-14 md:w-56 sticky top-20 h-[calc(100vh-5rem)] flex flex-col bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-slate-700 overflow-y-auto">

        {/* ← Accueil */}
        <div className="p-2 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
          <div className="relative group">
            <button
              onClick={onGoHome}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span className="hidden md:block text-xs font-semibold truncate">Accueil</span>
            </button>
            {/* Mobile tooltip */}
            <span className="md:hidden pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
              Accueil
            </span>
          </div>
        </div>

        {/* Module header */}
        {domaine && DomainIcon && (
          <>
            {/* Desktop: icon + title */}
            <div className="hidden md:block p-4 border-b border-gray-100 dark:border-slate-800 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl ${domaine.iconBg} flex items-center justify-center flex-shrink-0`}>
                  <DomainIcon className={`w-4 h-4 ${domaine.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900 dark:text-white leading-tight truncate">
                    {domaine.titre}
                  </p>
                  {domaine.isExperimental && (
                    <span className="text-[9px] font-medium text-amber-600 dark:text-amber-400">
                      En évolution
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile: icon only */}
            <div className="md:hidden p-2 border-b border-gray-100 dark:border-slate-800 flex justify-center flex-shrink-0">
              <div className="relative group">
                <div className={`w-9 h-9 rounded-xl ${domaine.iconBg} flex items-center justify-center`}>
                  <DomainIcon className={`w-4 h-4 ${domaine.iconColor}`} />
                </div>
                <span className="md:hidden pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {domaine.titre}
                </span>
              </div>
            </div>
          </>
        )}

        {/* Nav items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {visibleActions.map((action, idx) => {
            const isActive = action.tab === activeTab;
            const ActionIcon = action.icon;

            return (
              <div key={action.tab ?? idx} className="relative group">
                <button
                  onClick={() => handleAction(action)}
                  className={`w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left transition-all ${
                    isActive
                      ? 'border-l-2 border-indigo-500 bg-indigo-50 font-semibold text-indigo-600 dark:border-indigo-400 dark:bg-indigo-900/30 dark:text-indigo-400'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                  }`}
                >
                  {ActionIcon ? (
                    <ActionIcon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : action.color ?? domaine?.iconColor ?? ''
                      }`}
                    />
                  ) : DomainIcon ? (
                    <DomainIcon
                      className={`w-4 h-4 flex-shrink-0 ${
                        isActive
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : domaine?.iconColor ?? ''
                      }`}
                    />
                  ) : null}
                  <span className="hidden md:block truncate text-xs">{action.label}</span>
                </button>
                {/* Mobile tooltip */}
                <span className="md:hidden pointer-events-none absolute left-full top-1/2 ml-2 -translate-y-1/2 z-50 whitespace-nowrap rounded bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
                  {action.label}
                </span>
              </div>
            );
          })}
        </nav>
      </aside>
    </div>
  );
};

export default ModuleSidebar;
