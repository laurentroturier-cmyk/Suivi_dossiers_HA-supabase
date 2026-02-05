import React from 'react';

interface ModuleComingSoonProps {
  title: string;
  description?: string;
  onBack?: () => void;
}

export const ModuleComingSoon: React.FC<ModuleComingSoonProps> = ({ title, description, onBack }) => {
  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-5">
        {onBack && (
          <div className="mb-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-800 hover:text-amber-900"
            >
              <span className="text-base leading-none">←</span>
              Retour aux pièces administratives & techniques
            </button>
          </div>
        )}
        <h3 className="text-lg font-semibold text-amber-900 dark:text-amber-100">
          {title}
        </h3>
        <p className="mt-2 text-sm text-amber-800 dark:text-amber-100/80">
          {description ||
            'Ce module est en cours de préparation et sera bientôt disponible.'}
        </p>
      </div>
    </div>
  );
};

