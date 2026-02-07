/**
 * Récupère les raisons sociales des candidats depuis l'ouverture des plis (et éventuellement le registre des dépôts).
 * Utilisé pour proposer une liste de candidats dans l'étape "Gestion des candidats" du wizard AN01.
 */

import { supabase } from '@/lib/supabase';

/** Extrait le numéro de procédure 5 chiffres (Afpa) d'une référence complète */
export function extractNumProc5(consultationNumber: string): string | null {
  const cleaned = String(consultationNumber || '').replace(/\D/g, '');
  const match = cleaned.slice(0, 5);
  return match.length === 5 ? match : null;
}

/**
 * Charge les raisons sociales depuis la table ouverture_plis (candidats de la procédure).
 * Essaie type_analyse 'candidature' puis 'complet' pour récupérer candidats[].societe.
 */
export async function fetchCandidatesFromOuverturePlis(numProc5: string): Promise<string[]> {
  if (!numProc5 || numProc5.length !== 5) return [];

  try {
    const typesToTry: ('candidature' | 'complet')[] = ['candidature', 'complet'];
    for (const typeAnalyse of typesToTry) {
      const { data, error } = await supabase
        .from('ouverture_plis')
        .select('candidats')
        .eq('num_proc', numProc5)
        .eq('type_analyse', typeAnalyse)
        .maybeSingle();

      if (error) continue;
      const candidats = (data?.candidats as Array<{ societe?: string }>) || [];
      const noms = candidats
        .map((c) => (c?.societe != null ? String(c.societe).trim() : ''))
        .filter(Boolean);
      if (noms.length > 0) {
        const unique = Array.from(new Set(noms)).sort((a, b) => a.localeCompare(b, 'fr'));
        return unique;
      }
    }
    return [];
  } catch (e) {
    console.warn('fetchCandidatesFromOuverturePlis:', e);
    return [];
  }
}
