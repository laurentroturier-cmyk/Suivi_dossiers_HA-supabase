import React from 'react';

interface ModuleComingSoonProps {
  title: string;
  description?: string;
  onBack?: () => void;
}

export const ModuleComingSoon: React.FC<ModuleComingSoonProps> = ({ title, description, onBack }) => {
  return (
    <div className="dce-module-coming-soon space-y-4">
      <div className="bg-amber-50 dark:bg-slate-800 border border-amber-200 dark:border-slate-600 rounded-xl p-5">
        {onBack && (
          <div className="mb-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900 dark:text-slate-200 dark:hover:text-slate-100"
            >
              <span className="text-base leading-none">←</span>
              Retour aux pièces administratives & techniques
            </button>
          </div>
        )}
        <h3 className="text-lg font-semibold text-amber-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-amber-800 dark:text-slate-300">
          {description ||
            'Ce module est en cours de préparation et sera bientôt disponible.'}
        </p>
      </div>
    </div>
  );
};

