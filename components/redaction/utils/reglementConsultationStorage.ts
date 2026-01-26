import { supabase } from '../../../lib/supabase';
import type { RapportCommissionData } from '../types';

export interface ReglementConsultationRecord {
  id: string;
  user_id: string;
  numero_procedure: string;
  titre_marche: string | null;
  numero_marche: string | null;
  data: RapportCommissionData;
  created_at: string;
  updated_at: string;
}

/**
 * Sauvegarde ou met à jour un règlement de consultation dans Supabase
 * Utilise le numéro de procédure (5 chiffres) comme clé unique
 */
export async function saveReglementConsultation(
  numeroProcedure: string,
  data: RapportCommissionData
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
      titre_marche: data.enTete?.titreMarche || null,
      numero_marche: data.enTete?.numeroMarche || null,
      data: data,
    };

    // Utiliser upsert pour insérer ou mettre à jour
    const { data: result, error } = await supabase
      .from('reglements_consultation')
      .upsert(record, {
        onConflict: 'numero_procedure',
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Erreur sauvegarde RC Supabase:', error);
      return { success: false, error: error.message };
    }

    // Synchroniser la colonne reglement_consultation de la table DCE pour conserver l'historique
    // ⚠️ Synchro NON-CRITIQUE : on log mais on continue si elle échoue
    try {
      const { error: dceError } = await supabase
        .from('dce')
        .upsert({
          user_id: user.id,
          numero_procedure: numeroProcedure,
          titre_marche: record.titre_marche,
          reglement_consultation: record.data,
        }, {
          onConflict: 'numero_procedure,user_id',
          ignoreDuplicates: false,
        });

      if (dceError) {
        console.warn('⚠️ Synchro RC → DCE non critique:', dceError);
        // On continue quand même - la sauvegarde dans reglements_consultation a réussi
      }
    } catch (syncErr) {
      console.warn('⚠️ Erreur synchro RC → DCE:', syncErr);
      // On continue quand même
    }

    return { success: true, id: result.id };
  } catch (error: any) {
    console.error('Erreur sauvegarde RC:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Charge un règlement de consultation depuis Supabase par numéro de procédure
 */
export async function loadReglementConsultation(
  numeroProcedure: string
): Promise<{ success: boolean; data?: RapportCommissionData; error?: string }> {
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
      .from('reglements_consultation')
      .select('*')
      .eq('numero_procedure', numeroProcedure)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun règlement trouvé pour ce numéro de procédure' };
      }
      console.error('Erreur chargement RC Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: result.data as RapportCommissionData };
  } catch (error: any) {
    console.error('Erreur chargement RC:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Liste tous les règlements de consultation de l'utilisateur connecté
 */
export async function listReglementConsultations(): Promise<{
  success: boolean;
  data?: ReglementConsultationRecord[];
  error?: string;
}> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { data: results, error } = await supabase
      .from('reglements_consultation')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erreur liste RC Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: results as ReglementConsultationRecord[] };
  } catch (error: any) {
    console.error('Erreur liste RC:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Supprime un règlement de consultation
 */
export async function deleteReglementConsultation(
  numeroProcedure: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return { success: false, error: 'Utilisateur non authentifié' };
    }

    const { error } = await supabase
      .from('reglements_consultation')
      .delete()
      .eq('numero_procedure', numeroProcedure)
      .eq('user_id', user.id);

    if (error) {
      console.error('Erreur suppression RC Supabase:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erreur suppression RC:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}
