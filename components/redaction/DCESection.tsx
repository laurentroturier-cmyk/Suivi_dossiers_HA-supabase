import React from 'react';
import { FileText, ClipboardList, Book, Info } from 'lucide-react';

interface DCESectionProps {
  onNavigate: (subsection: 'questionnaire-technique' | 'cctp' | 'bpu') => void;
}

const DCESection: React.FC<DCESectionProps> = ({ onNavigate }) => {
  const subsections = [
    {
      id: 'questionnaire-technique',
      title: 'Questionnaire Technique',
      description: "Critères et grille d'évaluation technique",
      icon: ClipboardList,
      iconColor: 'text-teal-800 dark:text-teal-300',
      iconBg: 'bg-teal-200 dark:bg-teal-900/30',
      borderColor: 'border-teal-300 dark:border-teal-700',
      action: () => onNavigate('questionnaire-technique'),
    },
    {
      id: 'cctp',
      title: 'CCTP',
      description: "Cahier des Clauses Techniques Particulières",
      icon: FileText,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-500/20',
      borderColor: 'border-blue-200 dark:border-blue-500/40',
      action: () => onNavigate('cctp'),
    },
    {
      id: 'bpu',
      title: 'BPU',
      description: "Bordereau des Prix Unitaires",
      icon: Book,
      iconColor: 'text-teal-800 dark:text-teal-300',
      iconBg: 'bg-teal-200 dark:bg-teal-900/30',
      borderColor: 'border-teal-300 dark:border-teal-700',
      action: () => onNavigate('bpu'),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Rédaction — DCE</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Dossier de Consultation des Entreprises</p>
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
            <Info className="w-4 h-4 text-gray-500" />
            <span className="text-xs text-gray-600 dark:text-gray-300">
              Outils de rédaction et génération
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subsections.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                onClick={s.action}
                className={`bg-white dark:bg-gray-800 rounded-2xl border-2 ${s.borderColor} p-6 cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 ${s.iconBg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${s.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DCESection;
