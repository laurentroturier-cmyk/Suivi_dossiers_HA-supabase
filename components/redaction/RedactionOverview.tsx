import React from 'react';
import { FileText, ClipboardList, Bell, Construction, ChevronRight, Edit2 } from 'lucide-react';

interface RedactionOverviewProps {
  onNavigate: (section: 'DCEComplet' | 'NOTI' | 'NOTIMulti' | 'EXE' | 'Avenants' | 'Courriers' | 'RapportCommission') => void;
}

const RedactionOverview: React.FC<RedactionOverviewProps> = ({ onNavigate }) => {
  const modules = [
    { label: 'DCE Complet ✨', tab: 'DCEComplet', isAdmin: false, icon: FileText, color: 'text-blue-600 dark:text-blue-400', badge: 'NOUVEAU' },
    { label: 'Questionnaire technique', tab: 'questionnaire-technique', isAdmin: false, icon: ClipboardList, color: 'text-teal-600 dark:text-teal-400' },
    { label: 'Accès rapide NOTI', tab: 'NOTI', isAdmin: false, icon: Bell, color: 'text-indigo-600 dark:text-indigo-400' },
    { label: 'NOTI Multi 🚧', tab: 'NOTIMulti', isAdmin: false, icon: Construction, color: 'text-gray-500 dark:text-gray-400' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white dark:bg-gray-800 rounded-3xl border-2 border-amber-200 dark:border-amber-500/40 p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-500/20 rounded-2xl flex items-center justify-center">
              <Edit2 className="w-7 h-7 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Rédaction</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rédaction des documents de DCE</p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-gray-700 my-6"></div>

          {/* Modules List */}
          <div className="space-y-2">
            {modules.map((module) => {
              const Icon = module.icon;
              return (
                <button
                  key={module.tab}
                  onClick={() => onNavigate(module.tab as any)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-lg transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${module.color}`} />
                    <span className="font-medium text-gray-900 dark:text-white">{module.label}</span>
                    {module.badge && (
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full font-semibold ml-1">
                        {module.badge}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RedactionOverview;
