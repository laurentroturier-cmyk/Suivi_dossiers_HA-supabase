import { supabase } from '../../../lib/supabase';
import type { Noti3Data } from '../types/noti3';

export interface Noti3Record {
  numero_procedure: string;
  noti1: any | null;
  noti3: Noti3Data[] | null;
  noti5: any | null;
  created_at: string;
  updated_at: string;
}

function getNoti3Key(data: Noti3Data): string {
  const candidat = (data.candidat.denomination || '').trim().toLowerCase();
  const lotNumero = data.notification.lots?.[0]?.numero ?? '';
  return `${candidat}::${String(lotNumero).trim()}`;
}

/**
 * Sauvegarde ou met à jour un NOTI3 pour un candidat / lot donné
 * Plusieurs NOTI3 peuvent être associés à une même procédure (un par candidat/perdant)
 */
export async function saveNoti3(
  numeroProcedure: string,
  data: Noti3Data
): Promise<{ success: boolean; error?: string }> {
  try {
    const match = numeroProcedure.match(/^(\d{5})/);
    const keyNumero = match ? match[1] : numeroProcedure;

    if (!keyNumero || !/^\d{5}$/.test(keyNumero)) {
      return { success: false, error: 'Numéro de procédure invalide (doit commencer par 5 chiffres)' };
    }

    // Récupérer l'éventuelle ligne existante
    const { data: existing, error: fetchError } = await supabase
      .from('noti_documents')
      .select('noti3')
      .eq('numero_procedure', keyNumero)
      .maybeSingle();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Erreur lecture NOTI3 avant sauvegarde:', fetchError);
      return { success: false, error: fetchError.message };
    }

    let list: Noti3Data[] = [];
    if (existing?.noti3 && Array.isArray(existing.noti3)) {
      list = existing.noti3 as Noti3Data[];
    }

    const newKey = getNoti3Key(data);
    const index = list.findIndex((item) => getNoti3Key(item) === newKey);

    if (index >= 0) {
      list[index] = data;
    } else {
      list.push(data);
    }

    const record = {
      numero_procedure: keyNumero,
      noti3: list,
    };

    const { error: upsertError } = await supabase
      .from('noti_documents')
      .upsert(record, {
        onConflict: 'numero_procedure',
        ignoreDuplicates: false,
      });

    if (upsertError) {
      console.error('Erreur sauvegarde NOTI3 Supabase:', upsertError);
      return { success: false, error: upsertError.message };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Erreur saveNoti3:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

/**
 * Charge un NOTI3 pour un candidat (et éventuellement un lot) donné
 */
export async function loadNoti3(
  numeroProcedure: string,
  candidatDenomination: string,
  lotNumero?: string | number
): Promise<{ success: boolean; data?: Noti3Data; error?: string }> {
  try {
    const match = numeroProcedure.match(/^(\d{5})/);
    const keyNumero = match ? match[1] : numeroProcedure;

    if (!keyNumero || !/^\d{5}$/.test(keyNumero)) {
      return { success: false, error: 'Numéro de procédure invalide (doit commencer par 5 chiffres)' };
    }

    const { data: record, error } = await supersetFromNotiDocuments(keyNumero);
    if (error) {
      if (error.code === 'PGRST116') {
        return { success: false, error: 'Aucun NOTI3 trouvé pour cette procédure' };
      }
      throw error;
    }

    if (!record?.noti3 || !Array.isArray(record.noti3)) {
      return { success: false, error: 'Aucun NOTI3 enregistré pour cette procédure' };
    }

    const normalizedCandidat = candidatDenomination.trim().toLowerCase();
    const lotStr = lotNumero !== undefined ? String(lotNumero).trim() : undefined;

    let found: Noti3Data | undefined;

    if (lotStr) {
      found = (record.noti3 as Noti3Data[]).find((n) => {
        const cand = (n.candidat.denomination || '').trim().toLowerCase();
        const numLot = n.notification.lots?.[0]?.numero
          ? String(n.notification.lots[0].numero).trim()
          : '';
        return cand === normalizedCandidat && numLot === lotStr;
      });
    } else {
      found = (record.noti3 as Noti3Data[]).find((n) => {
        const cand = (n.candidat.denomination || '').trim().toLowerCase();
        return cand === normalizedCandidat;
      });
    }

    if (!found) {
      return { success: false, error: 'Aucun NOTI3 trouvé pour ce candidat/lot' };
    }

    return { success: true, data: found };
  } catch (error: any) {
    console.error('Erreur loadNoti3:', error);
    return { success: false, error: error.message || 'Erreur inconnue' };
  }
}

async function supersetFromNotiDocuments(numero: string) {
  return await supabase.from('noti_documents').select('noti3').eq('numero_procedure', numero).single();
}

