import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface OuverturePlisData {
  id?: string;
  num_proc: string;
  reference_proc?: string;
  nom_proc?: string;
  id_projet?: string;
  msa?: string;
  valideur_technique?: string;
  demandeur?: string;
  type_analyse: 'candidature' | 'recevabilite' | 'complet';
  statut?: 'brouillon' | 'en_cours' | 'valide' | 'archive';
  version?: number;
  notes?: string;
  candidats?: any[];
  recevabilite?: {
    candidats: any[];
    raisonInfructuosite: string;
    lotsInfructueux: any[];
  };
  metadata?: any;
  created_at?: string;
  updated_at?: string;
}

export const useOuverturePlis = (numProc: string | null) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OuverturePlisData | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Charger les données depuis Supabase
  const loadData = useCallback(async (typeAnalyse: 'candidature' | 'recevabilite' | 'complet') => {
    if (!numProc) return null;

    setLoading(true);
    setError(null);

    try {
      const { data: existingData, error: fetchError } = await supabase
        .from('ouverture_plis')
        .select('*')
        .eq('num_proc', numProc)
        .eq('type_analyse', typeAnalyse)
        .maybeSingle();

      if (fetchError) throw fetchError;

      if (existingData) {
        setData(existingData);
        setLastSaved(new Date(existingData.updated_at));
        return existingData;
      }

      return null;
    } catch (err: any) {
      console.error('Erreur lors du chargement:', err);
      setError(err.message || 'Erreur lors du chargement des données');
      return null;
    } finally {
      setLoading(false);
    }
  }, [numProc]);

  // Sauvegarder les données dans Supabase
  const saveData = useCallback(async (
    dataToSave: Partial<OuverturePlisData>,
    autoSave: boolean = false
  ) => {
    if (!numProc) {
      setError('Numéro de procédure manquant');
      return { success: false, error: 'Numéro de procédure manquant' };
    }

    setSaving(true);
    setError(null);

    try {
      // Récupérer l'utilisateur connecté
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Utilisateur non connecté');
      }

      // Préparer les données
      const payload = {
        num_proc: numProc,
        ...dataToSave,
        created_by: user.id,
        updated_at: new Date().toISOString(),
      };

      // Upsert (insert ou update)
      const { data: savedData, error: saveError } = await supabase
        .from('ouverture_plis')
        .upsert(payload, {
          onConflict: 'num_proc,type_analyse',
        })
        .select()
        .single();

      if (saveError) throw saveError;

      setData(savedData);
      setLastSaved(new Date());

      if (!autoSave) {
        // Notification de succès visible uniquement pour sauvegarde manuelle
        console.log('✅ Données sauvegardées avec succès');
      }

      return { success: true, data: savedData };
    } catch (err: any) {
      console.error('Erreur lors de la sauvegarde:', err);
      const errorMessage = err.message || 'Erreur lors de la sauvegarde';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setSaving(false);
    }
  }, [numProc]);

  // Sauvegarder automatiquement (debounced)
  const autoSave = useCallback(
    async (dataToSave: Partial<OuverturePlisData>) => {
      return saveData(dataToSave, true);
    },
    [saveData]
  );

  // Supprimer une sauvegarde
  const deleteData = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from('ouverture_plis')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setData(null);
      setLastSaved(null);

      return { success: true };
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err);
      const errorMessage = err.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Lister toutes les sauvegardes pour une procédure
  const listSaves = useCallback(async () => {
    if (!numProc) return [];

    try {
      const { data: saves, error: fetchError } = await supabase
        .from('ouverture_plis')
        .select('*')
        .eq('num_proc', numProc)
        .order('updated_at', { ascending: false });

      if (fetchError) throw fetchError;

      return saves || [];
    } catch (err: any) {
      console.error('Erreur lors de la récupération des sauvegardes:', err);
      return [];
    }
  }, [numProc]);

  // Changer le statut d'une sauvegarde
  const updateStatus = useCallback(async (
    id: string,
    newStatus: 'brouillon' | 'en_cours' | 'valide' | 'archive'
  ) => {
    try {
      const { error: updateError } = await supabase
        .from('ouverture_plis')
        .update({ statut: newStatus })
        .eq('id', id);

      if (updateError) throw updateError;

      if (data?.id === id) {
        setData({ ...data, statut: newStatus });
      }

      return { success: true };
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour du statut:', err);
      return { success: false, error: err.message };
    }
  }, [data]);

  return {
    // États
    loading,
    saving,
    error,
    data,
    lastSaved,

    // Actions
    loadData,
    saveData,
    autoSave,
    deleteData,
    listSaves,
    updateStatus,
  };
};
