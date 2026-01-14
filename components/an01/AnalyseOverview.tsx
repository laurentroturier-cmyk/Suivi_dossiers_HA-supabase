import React from 'react';
import { Download, Upload, LineChart, Info, FileText } from 'lucide-react';

interface AnalyseOverviewProps {
  onNavigate: (tab: 'retraits' | 'depots' | 'an01' | 'rapport') => void;
}

const AnalyseOverview: React.FC<AnalyseOverviewProps> = ({ onNavigate }) => {
  const cards = [
    {
      id: 'retraits',
      title: 'Registre Retraits',
      description: "Suivi des retraits de DCE et des candidats",
      icon: Download,
      iconColor: 'text-orange-600 dark:text-orange-400',
      iconBg: 'bg-orange-100 dark:bg-orange-500/20',
      borderColor: 'border-orange-200 dark:border-orange-500/40',
      action: () => onNavigate('retraits'),
    },
    {
      id: 'depots',
      title: 'Registre Dépôts',
      description: "Suivi des dépôts de plis et horodatages",
      icon: Upload,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-100 dark:bg-cyan-500/20',
      borderColor: 'border-cyan-200 dark:border-cyan-500/40',
      action: () => onNavigate('depots'),
    },
    {
      id: 'an01',
      title: 'Analyse AN01',
      description: "Analyse technique des offres par lots (imports XLSX)",
      icon: LineChart,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
      borderColor: 'border-emerald-200 dark:border-emerald-500/40',
      action: () => onNavigate('an01'),
    },
    {
      id: 'rapport',
      title: 'Rapport de Présentation',
      description: "Génération automatique du rapport de présentation Word",
      icon: FileText,
      iconColor: 'text-purple-600 dark:text-purple-400',
      iconBg: 'bg-purple-100 dark:bg-purple-500/20',
      borderColor: 'border-purple-200 dark:border-purple-500/40',
      action: () => onNavigate('rapport'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analyse</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Vue d'ensemble des modules d'analyse et registres</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Accédez aux registres et à l'analyse AN01
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

export default AnalyseOverview;
