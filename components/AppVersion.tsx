import React from 'react';
import version from '../version.json';

/**
 * Composant d'affichage de la version de l'application
 * Affiche: "GestProjet v1.0.1 • Mise à jour : 06/01/2026"
 */
export const AppVersion: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Formater la date en français
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className={`text-sm text-tertiary ${className}`}>
      <span className="font-semibold">{version.name}</span>
      <span className="mx-2">v{version.version}</span>
      <span className="opacity-50">•</span>
      <span className="ml-2">Mise à jour : {formatDate(version.lastUpdate)}</span>
    </div>
  );
};

/**
 * Hook personnalisé pour accéder aux infos de version
 */
export const useVersion = () => {
  return {
    version: version.version,
    name: version.name,
    lastUpdate: version.lastUpdate,
    build: version.build,
    changelog: version.changelog,
    fullVersion: `${version.name} v${version.version}`,
    buildInfo: `Build ${version.build} - ${version.lastUpdate}`
  };
};
