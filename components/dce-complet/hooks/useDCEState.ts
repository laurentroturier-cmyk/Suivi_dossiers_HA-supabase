// ============================================
// HOOK useDCEState
// Gestion centralisée de l'état du DCE
// ============================================

import { useState, useCallback, useEffect } from 'react';
import type { DCEState, DCESectionType, DCEStatut } from '../types';
import { dceService } from '../utils/dceService';
import { 
  detectConflicts, 
  loadAndMergeProcedureData,
  type ConflictDetectionResult,
  type ConflictResolution,
  resolveConflicts as applyConflictResolutions,
  updateProcedure as updateProcedureInDB,
} from '../utils/procedureSyncService';
import type { ProjectData } from '../../../types';

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
  
  // 🆕 Gestion des conflits
  conflicts: ConflictDetectionResult | null;
  resolveConflicts: (resolutions: Record<string, ConflictResolution>) => Promise<boolean>;
  checkConflicts: () => Promise<void>;
  updateSectionLocal: (section: DCESectionType, data: any) => void;
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
  const [conflicts, setConflicts] = useState<ConflictDetectionResult | null>(null);
  const [currentProcedure, setCurrentProcedure] = useState<ProjectData | null>(null);

  /**
   * Charge le DCE depuis Supabase (ou le crée s'il n'existe pas)
   * 🆕 Charge aussi les données de procedures et détecte les conflits
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
      // Charger les données de procedures et fusionner
      const { mergedDCE, procedure, conflicts: detectedConflicts } = await loadAndMergeProcedureData(
        numeroProcedure,
        result.data
      );
      
      setDceState(mergedDCE);
      setCurrentProcedure(procedure);
      setConflicts(detectedConflicts);
      setIsNew(result.isNew || false);
      setSavedVersion(JSON.stringify(mergedDCE));
      setIsDirty(false);
      
      // Log des conflits
      if (detectedConflicts.hasConflicts) {
        console.warn(`⚠️ ${detectedConflicts.conflicts.length} conflit(s) détecté(s) entre DCE et procédures`);
      }
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
      console.error('❌ updateSection: État DCE invalide', { dceState: !!dceState, numeroProcedure });
      setError('État DCE invalide');
      return false;
    }

    console.log(`📤 updateSection: Sauvegarde de ${section} pour ${numeroProcedure}`, { data });

    // Mise à jour optimiste de l'état local
    setDceState(prev => prev ? { ...prev, [section]: data } : null);
    setIsDirty(true);

    // Sauvegarde immédiate dans Supabase
    const result = await dceService.updateSection(numeroProcedure, section, data);

    if (result.success && result.data) {
      console.log(`✅ updateSection: Succès pour ${section}`);
      setDceState(result.data);
      setSavedVersion(JSON.stringify(result.data));
      setIsDirty(false);
      setError(null);
      return true;
    } else {
      console.error(`❌ updateSection: Erreur pour ${section}`, result.error);
      setError(result.error || 'Erreur de sauvegarde');
      // Recharger pour annuler l'update optimiste
      await loadDCE();
      return false;
    }
  }, [dceState, numeroProcedure, loadDCE]);

  /**
   * Met à jour une section localement SANS sauvegarder en base
   * Utilisé pour les modifications en cours avant la sauvegarde globale
   */
  const updateSectionLocal = useCallback((
    section: DCESectionType,
    data: any
  ) => {
    console.log(`📝 updateSectionLocal: Modification locale de ${section} (non sauvegardée)`);
    setDceState(prev => prev ? { ...prev, [section]: data } : null);
    setIsDirty(true);
  }, []);

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
   * 🆕 Vérifie les conflits entre DCE et procedures
   */
  const checkConflicts = useCallback(async () => {
    if (!dceState || !currentProcedure) {
      console.warn('⚠️ checkConflicts: Pas de DCE ou de procédure chargée');
      return;
    }

    const detectedConflicts = await detectConflicts(dceState, currentProcedure);
    setConflicts(detectedConflicts);

    if (detectedConflicts.hasConflicts) {
      console.warn(`⚠️ ${detectedConflicts.conflicts.length} conflit(s) détecté(s)`);
    }
  }, [dceState, currentProcedure]);

  /**
   * 🆕 Résout les conflits en appliquant les choix de l'utilisateur
   */
  const resolveConflictsHandler = useCallback(async (
    resolutions: Record<string, ConflictResolution>
  ): Promise<boolean> => {
    if (!dceState || !currentProcedure || !conflicts) {
      setError('État invalide pour résoudre les conflits');
      return false;
    }

    setIsLoading(true);

    try {
      // Appliquer les résolutions
      const { updatedDCE, updatedProcedure, needsDCEUpdate, needsProcedureUpdate } = 
        await applyConflictResolutions(conflicts.conflicts, resolutions, dceState, currentProcedure);

      // Mettre à jour la table procedures si nécessaire
      if (needsProcedureUpdate && Object.keys(updatedProcedure).length > 0) {
        const procedureUpdateResult = await updateProcedureInDB(numeroProcedure, updatedProcedure);
        if (!procedureUpdateResult.success) {
          setError(`Erreur mise à jour procédures: ${procedureUpdateResult.error}`);
          setIsLoading(false);
          return false;
        }
        console.log('✅ Table procédures mise à jour avec succès');
      }

      // Mettre à jour le DCE si nécessaire
      if (needsDCEUpdate) {
        setDceState(updatedDCE);
        // Sauvegarder le DCE mis à jour
        const result = await dceService.saveDCE(updatedDCE);
        if (!result.success) {
          setError(result.error || 'Erreur sauvegarde DCE');
          setIsLoading(false);
          return false;
        }
        setSavedVersion(JSON.stringify(updatedDCE));
        console.log('✅ DCE mis à jour avec succès');
      }

      // Réinitialiser les conflits
      setConflicts(null);
      setIsDirty(false);
      setError(null);
      setIsLoading(false);
      return true;

    } catch (err: any) {
      setError(`Erreur résolution conflits: ${err.message}`);
      setIsLoading(false);
      return false;
    }
  }, [dceState, currentProcedure, conflicts, numeroProcedure]);

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
    updateSectionLocal,
    saveDCE,
    changeStatut,
    publishDCE,
    refreshDCE,
    isDirty,
    markClean,
    conflicts,
    resolveConflicts: resolveConflictsHandler,
    checkConflicts,
  };
}
