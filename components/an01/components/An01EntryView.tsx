/**
 * Écran d'accueil AN01 : choix du mode (Import Excel / Nouveau projet saisie / Charger depuis la base)
 */

import React from 'react';
import { Upload, FileEdit, Database, LineChart } from 'lucide-react';
import { Card } from '@/components/ui';

export type An01EntryChoice = 'upload' | 'saisie' | 'load-base';

interface An01EntryViewProps {
  onChoice: (choice: An01EntryChoice) => void;
}

const cards: Array<{
  id: An01EntryChoice;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  borderColor: string;
}> = [
  {
    id: 'upload',
    title: 'Importer un fichier Excel',
    description: 'Glissez un fichier AN01 (.xlsx) pour analyser les offres comme aujourd\'hui.',
    icon: Upload,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-500/20',
    borderColor: 'border-emerald-200 dark:border-emerald-500/40',
  },
  {
    id: 'saisie',
    title: 'Nouveau projet (saisie)',
    description: 'Saisissez les données directement : projet, lots, candidats, grilles financière et technique.',
    icon: FileEdit,
    iconColor: 'text-teal-600 dark:text-teal-400',
    iconBg: 'bg-teal-100 dark:bg-teal-500/20',
    borderColor: 'border-teal-200 dark:border-teal-500/40',
  },
  {
    id: 'load-base',
    title: 'Charger depuis la base',
    description: 'Saisissez le numéro de procédure Afpa pour charger le fichier AN01 depuis le stockage.',
    icon: Database,
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    borderColor: 'border-indigo-200 dark:border-indigo-500/40',
  },
];

const An01EntryView: React.FC<An01EntryViewProps> = ({ onChoice }) => {
  return (
    <div className="an01-page min-h-screen bg-gray-50 dark:bg-[#0f172a] flex flex-col">
      <div className="max-w-4xl mx-auto px-6 py-10 w-full">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
            <LineChart className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Analyse AN01</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Choisissez comment alimenter votre analyse des offres</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <Card
                key={c.id}
                variant="outlined"
                className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-0.5 ${c.borderColor} border-2`}
                padding="lg"
                onClick={() => onChoice(c.id)}
              >
                <div className="flex flex-col h-full">
                  <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${c.iconColor}`} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{c.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex-1">{c.description}</p>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default An01EntryView;
