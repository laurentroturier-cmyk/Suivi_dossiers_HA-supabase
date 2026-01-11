import React from 'react';
import { Edit3, AlertCircle } from 'lucide-react';

interface RedactionPlaceholderProps {
  selectedSection?: 'DCE' | 'NOTI' | 'EXE' | 'Avenants' | 'Courriers' | null;
}

const RedactionPlaceholder: React.FC<RedactionPlaceholderProps> = ({ selectedSection }) => {
  return (
    <div className="min-h-[50vh] bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center justify-center text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-4">
        <Edit3 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
      </div>
      <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Rédaction{selectedSection ? ` — ${selectedSection}` : ''}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Module de rédaction des documents et DCE</p>
      <div className="inline-flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
        <AlertCircle className="w-4 h-4 text-gray-500" />
        <span className="text-xs text-gray-700 dark:text-gray-300">En construction — fonctionnalités à venir</span>
      </div>
    </div>
  );
};

export default RedactionPlaceholder;
