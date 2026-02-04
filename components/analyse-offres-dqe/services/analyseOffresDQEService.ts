/**
 * Service d'analyse des offres DQE basé sur localStorage.
 * Objectif : fournir une persistance légère sans créer de nouvelles tables Supabase.
 *
 * Structure stockée :
 *  - clé: `analyse_offres_dqe_<numeroProcedure>`
 *  - valeur: {
 *      procedureNumero: string;
 *      candidats: StoredCandidat[];
 *    }
 */

export interface StoredLigneCandidat {
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
}

export interface StoredCandidat {
  id: string;
  numero_lot: number;
  nom_candidat: string;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
  lignes: StoredLigneCandidat[];
}

interface StoredAnalyse {
  procedureNumero: string;
  candidats: StoredCandidat[];
}

const STORAGE_PREFIX = 'analyse_offres_dqe_';

function getStorageKey(numeroProcedure: string): string {
  return `${STORAGE_PREFIX}${numeroProcedure}`;
}

function loadAnalyse(numeroProcedure: string): StoredAnalyse | null {
  try {
    const raw = localStorage.getItem(getStorageKey(numeroProcedure));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredAnalyse;
    if (!parsed || parsed.procedureNumero !== numeroProcedure) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveAnalyse(analyse: StoredAnalyse): void {
  try {
    localStorage.setItem(getStorageKey(analyse.procedureNumero), JSON.stringify(analyse));
  } catch {
    // En cas d'erreur de quota ou autre, on ne bloque pas l'UI.
    console.warn('[AnalyseOffresDQE] Impossible de sauvegarder dans localStorage.');
  }
}

export const AnalyseOffresDQEService = {
  /**
   * Indique s'il existe des données sauvegardées pour cette procédure.
   */
  async hasData(numeroProcedure: string): Promise<boolean> {
    const analyse = loadAnalyse(numeroProcedure);
    return !!(analyse && analyse.candidats && analyse.candidats.length > 0);
  },

  /**
   * Retourne la liste des candidats (sans leurs lignes détaillées) pour une procédure.
   */
  async loadCandidatsByProcedure(
    numeroProcedure: string
  ): Promise<Array<StoredCandidat & { id: string }>> {
    const analyse = loadAnalyse(numeroProcedure);
    if (!analyse) return [];
    return analyse.candidats.map((c) => ({ ...c, id: c.id }));
  },

  /**
   * Charge les lignes d'un candidat par son ID.
   */
  async loadLignesCandidat(candidatId: string): Promise<StoredLigneCandidat[]> {
    // Parcourir tous les enregistrements des différentes procédures.
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const analyse = JSON.parse(raw) as StoredAnalyse;
        const candidat = analyse.candidats.find((c) => c.id === candidatId);
        if (candidat) {
          return candidat.lignes || [];
        }
      }
    } catch {
      // ignore
    }
    return [];
  },

  /**
   * Crée ou récupère une "analyse" locale pour une procédure.
   * Ici, l'ID de l'analyse est simplement le numéro de procédure.
   */
  async getOrCreateAnalyse(
    numeroProcedure: string
  ): Promise<{ id: string; procedureNumero: string } | null> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return null;
    const existing = loadAnalyse(numeroProcedure);
    if (!existing) {
      const empty: StoredAnalyse = {
        procedureNumero: numeroProcedure,
        candidats: [],
      };
      saveAnalyse(empty);
    }
    return { id: numeroProcedure, procedureNumero: numeroProcedure };
  },

  /**
   * Réinitialise complètement l'analyse pour une procédure (supprime tous les candidats sauvegardés).
   */
  async resetAnalyse(numeroProcedure: string): Promise<void> {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    const empty: StoredAnalyse = {
      procedureNumero: numeroProcedure,
      candidats: [],
    };
    saveAnalyse(empty);
  },

  /**
   * Sauvegarde un candidat et ses lignes pour une analyse donnée (localStorage).
   */
  async saveCandidatDQE(
    analyseId: string,
    numeroLot: number,
    _nomLot: string | null,
    nomCandidat: string,
    totalHT: number,
    totalTVA: number,
    totalTTC: number,
    lignes: StoredLigneCandidat[]
  ): Promise<{ id: string; numero_lot: number; nom_candidat: string } | null> {
    if (!analyseId || analyseId.length !== 5) return null;
    const numeroProcedure = analyseId;
    const analyse = loadAnalyse(numeroProcedure) || {
      procedureNumero: numeroProcedure,
      candidats: [],
    };

    const id = `c-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const stored: StoredCandidat = {
      id,
      numero_lot: numeroLot,
      nom_candidat: nomCandidat,
      total_ht: totalHT,
      total_tva: totalTVA,
      total_ttc: totalTTC,
      lignes,
    };

    analyse.candidats.push(stored);
    saveAnalyse(analyse);

    return {
      id,
      numero_lot: numeroLot,
      nom_candidat: nomCandidat,
    };
  },

  /**
   * Supprime un candidat (et ses lignes) pour toutes les procédures où il apparaît.
   */
  async deleteCandidat(candidatId: string): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const analyse = JSON.parse(raw) as StoredAnalyse;
        const before = analyse.candidats.length;
        analyse.candidats = analyse.candidats.filter((c) => c.id !== candidatId);
        if (analyse.candidats.length !== before) {
          saveAnalyse(analyse);
        }
      }
    } catch {
      // ignore
    }
  },
};

