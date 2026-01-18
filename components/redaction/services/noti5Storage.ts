import { supabase } from '../../../lib/supabase';
import type { Noti5Data } from '../types/noti5';

export interface Noti5Record {
  id: string;
  user_id: string;
  numero_procedure: string;
  titre_marche: string | null;
  data: Noti5Data;
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    if (!numeroProcedure || numeroProcedure.length < 5) {
      return { success: false, error: 'Numéro de procédure invalide' };
    }

    // Vérifier si un NOTI5 existe déjà pour cette procédure
    const { data: existing } = await supabase
      .from('noti5_documents')
      .select('id')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure)
      .single();

    const titreMarche = data.objetConsultation || null;

    if (existing) {
      // Mise à jour
      const { error } = await supabase
        .from('noti5_documents')
        .update({
          titre_marche: titreMarche,
          data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);

      if (error) throw error;
      return { success: true, id: existing.id };
    } else {
      // Création
      const { data: newRecord, error } = await supabase
        .from('noti5_documents')
        .insert({
          user_id: user.id,
          numero_procedure: numeroProcedure,
          titre_marche: titreMarche,
          data: data,
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, id: newRecord.id };
    }
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { data: record, error } = await supabase
      .from('noti5_documents')
      .select('data')
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun NOTI5 trouvé pour cette procédure' };
      }
      throw error;
    }

    return { success: true, data: record.data as Noti5Data };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { data: records, error } = await supabase
      .from('noti5_documents')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { error } = await supabase
      .from('noti5_documents')
      .delete()
      .eq('user_id', user.id)
      .eq('numero_procedure', numeroProcedure);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Erreur deleteNoti5:', error);
    return { success: false, error: error.message };
  }
}
