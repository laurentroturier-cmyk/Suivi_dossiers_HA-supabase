import { useEffect } from 'react';
import { useContratsStore } from '@/stores';

/**
 * Hook personnalisé pour les contrats
 * Charge automatiquement les contrats au montage
 */
export const useContrats = (autoLoad = true) => {
  const {
    contrats,
    loading,
    error,
    loadContrats,
    createContrat,
    updateContrat,
    deleteContrat,
    searchContrats,
    bulkInsert,
  } = useContratsStore();

  useEffect(() => {
    if (autoLoad && contrats.length === 0 && !loading) {
      loadContrats();
    }
  }, [autoLoad]);

  return {
    contrats,
    loading,
    error,
    loadContrats,
    createContrat,
    updateContrat,
    deleteContrat,
    searchContrats,
    bulkInsert,
  };
};
