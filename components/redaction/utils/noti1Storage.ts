import { supabase } from '../../../lib/supabase';
import type { Noti1Data } from '../types';

export interface Noti1Record {
  id: string;
  user_id: string;
  numero_procedure: string;
  titre_marche: string | null;
  data: Noti1Data;
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
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // Valider le numéro de procédure (5 chiffres)
    if (!numeroProcedure || numeroProcedure.length !== 5 || !/^\d{5}$/.test(numeroProcedure)) {
      return { success: false, error: 'Numéro de procédure invalide (doit être 5 chiffres)' };
    }

    // Préparer les données
    const record = {
      user_id: user.id,
      numero_procedure: numeroProcedure,
      titre_marche: data.objetConsultation || null,
      data: data,
    };

    // Utiliser upsert pour insérer ou mettre à jour
    const { data: result, error } = await supabase
      .from('noti1')
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

    return { success: true, id: result.id };
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
    // Vérifier l'authentification
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    // Valider le numéro de procédure
    if (!numeroProcedure || numeroProcedure.length !== 5 || !/^\d{5}$/.test(numeroProcedure)) {
      return { success: false, error: 'Numéro de procédure invalide (doit être 5 chiffres)' };
    }

    // Charger depuis Supabase
    const { data: result, error } = await supabase
      .from('noti1')
      .select('*')
      .eq('numero_procedure', numeroProcedure)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun NOTI1 trouvé pour ce numéro de procédure' };
      }
      console.error('Erreur chargement NOTI1 Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: result.data as Noti1Data };
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { data: results, error } = await supabase
      .from('noti1')
      .select('*')
      .eq('user_id', user.id)
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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { error } = await supabase
      .from('noti1')
      .delete()
      .eq('numero_procedure', numeroProcedure)
      .eq('user_id', user.id);

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
