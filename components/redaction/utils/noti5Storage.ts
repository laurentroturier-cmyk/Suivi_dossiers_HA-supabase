import { supabase } from '../../../lib/supabase';
import type { Noti5Data } from '../types/noti5';

export interface Noti5Record {
  numero_procedure: string;
  noti1: any | null;
  noti3: any | null;
  noti5: Noti5Data | null;
  created_at: string;
  updated_at: string;
}

/**
 * Sauvegarde ou met à jour un NOTI5 dans Supabase
 */
export async function saveNoti5(
  numeroProcedure: string,
  data: Noti5Data
): Promise<{ success: boolean; error?: string; id?: string }> {
  try {
    if (!numeroProcedure || numeroProcedure.length < 5) {
      return { success: false, error: 'Numéro de procédure invalide' };
    }

    const record = {
      numero_procedure: numeroProcedure,
      noti5: data,
    };

    const { data: result, error } = await supabase
      .from('noti_documents')
      .upsert(record, {
        onConflict: 'numero_procedure',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, id: result?.numero_procedure };
  } catch (error: any) {
    console.error('Erreur saveNoti5:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Charge un NOTI5 depuis Supabase
 */
export async function loadNoti5(
  numeroProcedure: string
): Promise<{ success: boolean; data?: Noti5Data; error?: string }> {
  try {
    const { data: record, error } = await supabase
      .from('noti_documents')
      .select('noti5')
      .eq('numero_procedure', numeroProcedure)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun NOTI5 trouvé pour cette procédure' };
      }
      throw error;
    }

    if (!record?.noti5) {
      return { success: false, error: 'Aucun NOTI5 enregistré pour cette procédure' };
    }

    return { success: true, data: record.noti5 as Noti5Data };
  } catch (error: any) {
    console.error('Erreur loadNoti5:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Liste tous les NOTI5 de l'utilisateur
 */
export async function listNoti5(): Promise<{ success: boolean; data?: Noti5Record[]; error?: string }> {
  try {
    const { data: records, error } = await supabase
      .from('noti_documents')
      .select('*')
      .not('noti5', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return { success: true, data: records as Noti5Record[] };
  } catch (error: any) {
    console.error('Erreur listNoti5:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Supprime un NOTI5
 */
export async function deleteNoti5(
  numeroProcedure: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('noti_documents')
      .update({ noti5: null })
      .eq('numero_procedure', numeroProcedure);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erreur deleteNoti5:', error);
    return { success: false, error: error.message };
  }
}
