// ============================================
// HOOK useDCEState
// Gestion centralisée de l'état du DCE
// ============================================

import { useState, useCallback, useEffect } from 'react';
import type { DCEState, DCESectionType, DCEStatut } from '../types';
import { dceService } from '../services/dceService';

interface UseDCEStateOptions {
  numeroProcedure: string;
  autoLoad?: boolean;
}

interface UseDCEStateReturn {
  dceState: DCEState | null;
  isLoading: boolean;
  isNew: boolean;
  error: string | null;
  
  // Actions
  loadDCE: () => Promise<void>;
  updateSection: (section: DCESectionType, data: any) => Promise<boolean>;
  saveDCE: () => Promise<boolean>;
  changeStatut: (statut: DCEStatut) => Promise<boolean>;
  publishDCE: () => Promise<boolean>;
  refreshDCE: () => Promise<void>;
  
  // Utilitaires
  isDirty: boolean;
  markClean: () => void;
}

/**
 * Hook principal pour gérer l'état du DCE
 * Centralise toutes les opérations CRUD et la synchronisation avec Supabase
 */
export function useDCEState({ 
  numeroProcedure, 
  autoLoad = true 
}: UseDCEStateOptions): UseDCEStateReturn {
  
  const [dceState, setDceState] = useState<DCEState | null>(null);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [isNew, setIsNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedVersion, setSavedVersion] = useState<string | null>(null);

  /**
   * Charge le DCE depuis Supabase (ou le crée s'il n'existe pas)
   */
  const loadDCE = useCallback(async () => {
    if (!numeroProcedure) {
      setError('Numéro de procédure manquant');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    const result = await dceService.loadDCE(numeroProcedure);

    if (result.success && result.data) {
      setDceState(result.data);
      setIsNew(result.isNew || false);
      setSavedVersion(JSON.stringify(result.data));
      setIsDirty(false);
    } else {
      setError(result.error || 'Erreur inconnue');
    }

    setIsLoading(false);
  }, [numeroProcedure]);

  /**
   * Met à jour une section spécifique du DCE
   */
  const updateSection = useCallback(async (
    section: DCESectionType,
    data: any
  ): Promise<boolean> => {
    if (!dceState || !numeroProcedure) {
      setError('État DCE invalide');
      return false;
    }

    // Mise à jour optimiste de l'état local
    setDceState(prev => prev ? { ...prev, [section]: data } : null);
    setIsDirty(true);

    // Sauvegarde immédiate dans Supabase
    const result = await dceService.updateSection(numeroProcedure, section, data);

    if (result.success && result.data) {
      setDceState(result.data);
      setSavedVersion(JSON.stringify(result.data));
      setIsDirty(false);
      setError(null);
      return true;
    } else {
      setError(result.error || 'Erreur de sauvegarde');
      // Recharger pour annuler l'update optimiste
      await loadDCE();
      return false;
    }
  }, [dceState, numeroProcedure, loadDCE]);

  /**
   * Sauvegarde complète du DCE
   */
  const saveDCE = useCallback(async (): Promise<boolean> => {
    if (!dceState) {
      setError('Aucun DCE à sauvegarder');
      return false;
    }

    setIsLoading(true);
    const result = await dceService.saveDCE(dceState);
    setIsLoading(false);

    if (result.success && result.data) {
      setDceState(result.data);
      setSavedVersion(JSON.stringify(result.data));
      setIsDirty(false);
      setError(null);
      return true;
    } else {
      setError(result.error || 'Erreur de sauvegarde');
      return false;
    }
  }, [dceState]);

  /**
   * Change le statut du DCE
   */
  const changeStatut = useCallback(async (statut: DCEStatut): Promise<boolean> => {
    if (!numeroProcedure) {
      setError('Numéro de procédure manquant');
      return false;
    }

    const result = await dceService.updateStatut(numeroProcedure, statut);

    if (result.success && result.data) {
      setDceState(result.data);
      setSavedVersion(JSON.stringify(result.data));
      setError(null);
      return true;
    } else {
      setError(result.error || 'Erreur de mise à jour statut');
      return false;
    }
  }, [numeroProcedure]);

  /**
   * Publie le DCE (raccourci pour changeStatut('publié'))
   */
  const publishDCE = useCallback(async (): Promise<boolean> => {
    return changeStatut('publié');
  }, [changeStatut]);

  /**
   * Recharge le DCE depuis Supabase
   */
  const refreshDCE = useCallback(async () => {
    await loadDCE();
  }, [loadDCE]);

  /**
   * Marque le DCE comme "propre" (non modifié)
   */
  const markClean = useCallback(() => {
    if (dceState) {
      setSavedVersion(JSON.stringify(dceState));
      setIsDirty(false);
    }
  }, [dceState]);

  /**
   * Détecte les modifications non sauvegardées
   */
  useEffect(() => {
    if (dceState && savedVersion) {
      const currentVersion = JSON.stringify(dceState);
      setIsDirty(currentVersion !== savedVersion);
    }
  }, [dceState, savedVersion]);

  /**
   * Chargement automatique au montage
   */
  useEffect(() => {
    if (autoLoad && numeroProcedure) {
      loadDCE();
    }
  }, [autoLoad, numeroProcedure, loadDCE]);

  return {
    dceState,
    isLoading,
    isNew,
    error,
    loadDCE,
    updateSection,
    saveDCE,
    changeStatut,
    publishDCE,
    refreshDCE,
    isDirty,
    markClean,
  };
}
