import React from 'react';
import { FileText, CheckCircle, Zap, AlertCircle, Mail, Info } from 'lucide-react';

interface RedactionOverviewProps {
  onNavigate: (section: 'DCE' | 'NOTI' | 'EXE' | 'Avenants' | 'Courriers') => void;
}

const RedactionOverview: React.FC<RedactionOverviewProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'DCE',
      title: 'DCE',
      description: "Cahier des charges et spécifications techniques",
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      borderColor: 'border-blue-200 dark:border-blue-500/40',
      action: () => onNavigate('DCE'),
    },
    {
      id: 'NOTI',
      title: 'NOTI',
      description: "Notifications et avis officiels",
      icon: AlertCircle,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      borderColor: 'border-purple-200 dark:border-purple-500/40',
      action: () => onNavigate('NOTI'),
    },
    {
      id: 'EXE',
      title: 'EXE',
      description: "Exécution et suivi des contrats",
      icon: CheckCircle,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      action: () => onNavigate('EXE'),
    },
    {
      id: 'Avenants',
      title: 'Avenants',
      description: "Modifications et amendements de contrats",
      icon: Zap,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-500/20',
      borderColor: 'border-amber-200 dark:border-amber-500/40',
      action: () => onNavigate('Avenants'),
    },
    {
      id: 'Courriers',
      title: 'Courriers',
      description: "Correspondances et documents administratifs",
      icon: Mail,
      iconColor: 'text-red-600 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-500/20',
      borderColor: 'border-red-200 dark:border-red-500/40',
      action: () => onNavigate('Courriers'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Rédaction</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vue d'ensemble des modules de rédaction et documents</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Modules en construction
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.id}
                onClick={c.action}
                className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${c.borderColor} p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${c.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{c.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{c.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RedactionOverview;
