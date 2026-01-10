import { useEffect } from 'react';
import { useDossiersStore } from '@/stores';

/**
 * Hook personnalisé pour les dossiers
 * Charge automatiquement les dossiers au montage
 */
export const useDossiers = (autoLoad = true) => {
  const {
    dossiers,
    loading,
    error,
    searchQuery,
    loadDossiers,
    createDossier,
    updateDossier,
    deleteDossier,
    searchDossiers,
    bulkInsert,
  } = useDossiersStore();

  useEffect(() => {
    if (autoLoad && dossiers.length === 0 && !loading) {
      loadDossiers();
    }
  }, [autoLoad]);

  return {
    dossiers,
    loading,
    error,
    searchQuery,
    loadDossiers,
    createDossier,
    updateDossier,
    deleteDossier,
    searchDossiers,
    bulkInsert,
  };
};
