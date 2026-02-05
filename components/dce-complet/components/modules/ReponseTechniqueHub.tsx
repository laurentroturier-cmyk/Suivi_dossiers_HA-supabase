import React from 'react';
import { FileText, ClipboardList, ArrowRight } from 'lucide-react';
import type { DCESectionType } from '../../types';

interface ReponseTechniqueHubProps {
  onSelectSection: (section: DCESectionType) => void;
}

export const ReponseTechniqueHub: React.FC<ReponseTechniqueHubProps> = ({ onSelectSection }) => {
  const cards: Array<{
    key: DCESectionType;
    title: string;
    description: string;
    icon: React.ReactNode;
    accentClass: string;
  }> = [
    {
      key: 'crt',
      title: 'Cadre de réponse technique (CRT)',
      description:
        'Structure les réponses techniques attendues des candidats : rubriques, critères, modalités de renseignement.',
      icon: <FileText className="w-6 h-6" />,
      accentClass: 'bg-sky-50 border-sky-200',
    },
    {
      key: 'qt',
      title: 'Questionnaire technique',
      description:
        'Questionnaire détaillé pour recueillir les engagements techniques, fonctionnels et organisationnels des candidats.',
      icon: <ClipboardList className="w-6 h-6" />,
      accentClass: 'bg-indigo-50 border-indigo-200',
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête contextuelle */}
      <div className="bg-emerald-50 dark:bg-emerald-900/15 border border-emerald-200 dark:border-emerald-800 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
          Réponse technique des candidats
        </h3>
        <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-200">
          Centralisez les supports de réponse technique mis à disposition des candidats : cadre de
          réponse et questionnaire technique.
        </p>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            onClick={() => onSelectSection(card.key)}
            className={`
              group flex flex-col items-start p-4 border-2 rounded-xl text-left transition-all
              bg-white dark:bg-slate-900/60 hover:shadow-md hover:-translate-y-0.5
              ${card.accentClass}
            `}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg bg-white/70 dark:bg-slate-800 flex items-center justify-center text-emerald-700">
                {card.icon}
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                {card.title}
              </h4>
            </div>
            <p className="text-xs text-slate-700 dark:text-slate-300 flex-1">{card.description}</p>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Ouvrir la section
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

