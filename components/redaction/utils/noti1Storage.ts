import { supabase } from '../../../lib/supabase';
import type { Noti1Data } from '../types/noti1';

export interface Noti1Record {
  numero_procedure: string;
  noti1: Noti1Data | null;
  noti3: any | null;
  noti5: any | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sauvegarde ou met à jour un NOTI1 dans Supabase
 * Utilise le numéro de procédure (5 chiffres) comme clé unique
 */
export async function saveNoti1(
  numeroProcedure: string,
  data: Noti1Data
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    // Valider le numéro de procédure (5 chiffres)
    if (!numeroProcedure || numeroProcedure.length !== 5 || !/^\d{5}$/.test(numeroProcedure)) {
      return { success: false, error: 'Numéro de procédure invalide (doit être 5 chiffres)' };
    }

    // Préparer les données pour une table unique noti_documents
    const record = {
      numero_procedure: numeroProcedure,
      noti1: data,
    };

    // Utiliser upsert sur noti_documents (1 ligne par procédure)
    const { data: result, error } = await supabase
      .from('noti_documents')
      .upsert(record, {
        onConflict: 'numero_procedure',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde NOTI1 Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, id: result?.numero_procedure };
  } catch (error: any) {
    console.error('Erreur sauvegarde NOTI1:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Charge un NOTI1 depuis Supabase par numéro de procédure
 */
export async function loadNoti1(
  numeroProcedure: string
): Promise<{ success: boolean; data?: Noti1Data; error?: string }> {
  try {
    // Valider le numéro de procédure
    if (!numeroProcedure || numeroProcedure.length !== 5 || !/^\d{5}$/.test(numeroProcedure)) {
      return { success: false, error: 'Numéro de procédure invalide (doit être 5 chiffres)' };
    }

    // Charger depuis Supabase (table noti_documents)
    const { data: result, error } = await supabase
      .from('noti_documents')
      .select('noti1')
      .eq('numero_procedure', numeroProcedure)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun NOTI1 trouvé pour ce numéro de procédure' };
      }
      console.error('Erreur chargement NOTI1 Supabase:', error);
      return { success: false, error: error.message };
    }

    if (!result?.noti1) {
      return { success: false, error: 'Aucun NOTI1 enregistré pour ce numéro de procédure' };
    }

    return { success: true, data: result.noti1 as Noti1Data };
  } catch (error: any) {
    console.error('Erreur chargement NOTI1:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Liste tous les NOTI1 de l'utilisateur connecté
 */
export async function listNoti1(): Promise<{
  success: boolean;
  data?: Noti1Record[];
  error?: string;
}> {
  try {
    const { data: results, error } = await supabase
      .from('noti_documents')
      .select('*')
      .not('noti1', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur liste NOTI1 Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: results as Noti1Record[] };
  } catch (error: any) {
    console.error('Erreur liste NOTI1:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Supprime un NOTI1
 */
export async function deleteNoti1(
  numeroProcedure: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('noti_documents')
      .update({ noti1: null })
      .eq('numero_procedure', numeroProcedure);

    if (error) {
      console.error('Erreur suppression NOTI1 Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erreur suppression NOTI1:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}
