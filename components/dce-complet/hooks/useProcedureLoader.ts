// ============================================
// HOOK useProcedureLoader
// Charge et valide les procédures pour le DCE
// ============================================

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ProjectData } from '../../../types';

interface ProcedureSearchResult {
  procedure: ProjectData | null;
  isLoading: boolean;
  error: string | null;
  isValid: boolean;
}

interface UseProcedureLoaderOptions {
  autoLoad?: boolean;
}

/**
 * Hook pour rechercher et charger une procédure par son numéro court (5 chiffres)
 */
export function useProcedureLoader(options: UseProcedureLoaderOptions = {}) {
  const { autoLoad = false } = options;

  const [allProcedures, setAllProcedures] = useState<ProjectData[]>([]);
  const [isLoadingAll, setIsLoadingAll] = useState(autoLoad);
  const [errorAll, setErrorAll] = useState<string | null>(null);

  /**
   * Charge toutes les procédures au montage (pour autocomplete / recherche)
   */
  const loadAllProcedures = useCallback(async () => {
    setIsLoadingAll(true);
    setErrorAll(null);

    try {
      const { data, error } = await supabase
        .from('procédures')
        .select('*')
        .order('numero court procédure afpa', { ascending: false });

      if (error) {
        console.error('Erreur chargement procédures:', error);
        setErrorAll(error.message);
        setAllProcedures([]);
      } else {
        setAllProcedures((data || []) as ProjectData[]);
      }
    } catch (err: any) {
      console.error('Exception loadAllProcedures:', err);
      setErrorAll(err.message || 'Erreur inconnue');
      setAllProcedures([]);
    }

    setIsLoadingAll(false);
  }, []);

  /**
   * Recherche une procédure par numéro court (5 chiffres)
   */
  const searchByNumero = useCallback((numeroProc: string): ProcedureSearchResult => {
    // Validation format
    if (!numeroProc || numeroProc.length !== 5 || !/^\d{5}$/.test(numeroProc)) {
      return {
        procedure: null,
        isLoading: false,
        error: 'Numéro invalide (doit être 5 chiffres)',
        isValid: false,
      };
    }

    // Recherche dans la liste chargée
    const matches = allProcedures.filter(p => {
      const numCourt = String(p['numero court procédure afpa'] || '');
      const numAfpa = String(p['Numéro de procédure (Afpa)'] || '');
      const numProc = String(p['NumProc'] || '');
      return numCourt === numeroProc || numAfpa.startsWith(numeroProc) || numProc.startsWith(numeroProc);
    });

    if (matches.length === 0) {
      return {
        procedure: null,
        isLoading: false,
        error: `Aucune procédure trouvée pour le numéro ${numeroProc}`,
        isValid: false,
      };
    }

    if (matches.length > 1) {
      return {
        procedure: matches[0],
        isLoading: false,
        error: `⚠️ ${matches.length} procédures trouvées, utilisation de la première`,
        isValid: true,
      };
    }

    return {
      procedure: matches[0],
      isLoading: false,
      error: null,
      isValid: true,
    };
  }, [allProcedures]);

  /**
   * Recherche avec suggestions (autocomplete)
   */
  const suggestProcedures = useCallback((partialNumero: string, limit = 10): ProjectData[] => {
    if (!partialNumero) return [];

    const normalizeText = (text: any): string => {
      if (!text) return '';
      return String(text)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const search = normalizeText(partialNumero);

    return allProcedures
      .filter(p => {
         const numCourt = normalizeText(p['numero court procédure afpa'] || '');
         const numAfpa = normalizeText(p['Numéro de procédure (Afpa)'] || '');
         const numProc = normalizeText(p['NumProc'] || '');
        const titre = normalizeText(p['Intitulé'] || '');
        
         return numCourt.includes(search) ||
           numAfpa.includes(search) || 
               numProc.includes(search) || 
               titre.includes(search);
      })
      .slice(0, limit);
  }, [allProcedures]);

  /**
   * Extrait le numéro court (5 premiers chiffres) d'un numéro complet
   */
  const extractShortNumber = useCallback((fullNumber: string): string => {
    const cleaned = String(fullNumber).replace(/\D/g, '');
    return cleaned.substring(0, 5);
  }, []);

  /**
   * Chargement automatique au montage si autoLoad=true
   */
  useEffect(() => {
    if (autoLoad) {
      loadAllProcedures();
    }
  }, [autoLoad, loadAllProcedures]);

  return {
    // État
    allProcedures,
    isLoadingAll,
    errorAll,
    
    // Actions
    loadAllProcedures,
    searchByNumero,
    suggestProcedures,
    extractShortNumber,
  };
}

/**
 * Hook simplifié pour un seul numéro de procédure
 */
export function useProcedure(numeroProcedure: string | null): ProcedureSearchResult {
  const { allProcedures, isLoadingAll, errorAll, searchByNumero, loadAllProcedures } = useProcedureLoader({ autoLoad: true });
  const [result, setResult] = useState<ProcedureSearchResult>({
    procedure: null,
    isLoading: true,
    error: null,
    isValid: false,
  });

  useEffect(() => {
    if (isLoadingAll) {
      setResult({
        procedure: null,
        isLoading: true,
        error: null,
        isValid: false,
      });
      return;
    }

    if (errorAll) {
      setResult({
        procedure: null,
        isLoading: false,
        error: errorAll,
        isValid: false,
      });
      return;
    }

    if (!numeroProcedure) {
      setResult({
        procedure: null,
        isLoading: false,
        error: null,
        isValid: false,
      });
      return;
    }

    const searchResult = searchByNumero(numeroProcedure);
    setResult(searchResult);
  }, [numeroProcedure, isLoadingAll, errorAll, searchByNumero, allProcedures]);

  return result;
}
