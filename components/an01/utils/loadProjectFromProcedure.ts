/**
 * Charge un projet AN01 prérempli depuis une procédure (5 chiffres), le DCE associé
 * et la sauvegarde Analyse des offres DQE si elle existe.
 * Récupère : procédure (meta), Configuration Globale DCE (lots), DQE (candidats + grille financière par lot).
 */

import { supabase } from '@/lib/supabase';
import type { ProjectData } from '@/types';
import { dceService } from '@/components/dce-complet/utils/dceService';
import { loadAN01FromDQE } from './loadProjectFromDQE';
import type { AN01Project, AN01Lot } from '../types/saisie';
import { createDefaultProject, createDefaultLot } from '../types/saisie';

export interface LoadAN01FromProcedureResult {
  success: boolean;
  project?: AN01Project;
  error?: string;
}

/**
 * Charge la procédure depuis Supabase par numéro court (5 chiffres).
 */
async function loadProcedure(numeroProcedure: string): Promise<ProjectData | null> {
  const { data, error } = await supabase
    .from('procédures')
    .select('*')
    .eq('numero court procédure afpa', numeroProcedure)
    .limit(2)
    .order('numero court procédure afpa', { ascending: false });

  if (error) {
    console.error('Erreur chargement procédure AN01:', error);
    return null;
  }

  const procedures = (data || []) as ProjectData[];
  if (procedures.length === 0) return null;
  return procedures[0];
}

/**
 * Charge les données procédure + DCE et les mappe en AN01Project.
 * - Meta : n° consultation, description, acheteur, demandeur (depuis procédure + DCE configurationGlobale)
 * - Lots : depuis DCE configurationGlobale.lots (numero, intitule → lot_number, lot_name)
 */
export async function loadAN01ProjectFromProcedure(numeroProcedure: string): Promise<LoadAN01FromProcedureResult> {
  const numero = String(numeroProcedure).trim();
  if (numero.length !== 5 || !/^\d{5}$/.test(numero)) {
    return { success: false, error: 'Numéro invalide (doit être 5 chiffres)' };
  }

  try {
    const [procedure, dceResult] = await Promise.all([
      loadProcedure(numero),
      dceService.loadDCE(numero),
    ]);

    if (!procedure) {
      return { success: false, error: `Aucune procédure trouvée pour le numéro ${numero}` };
    }

    const base = createDefaultProject();
    const numAfpa = String(procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || numero);
    const titre = String(procedure['Intitulé'] || procedure['Nom de la procédure'] || '');
    const acheteur = String(procedure['Acheteur'] || '');

    const project: AN01Project = {
      ...base,
      id: `an01-${Date.now()}`,
      meta: {
        consultation_number: numAfpa,
        description: titre,
        buyer: acheteur,
        requester: '',
        tva_rate: 0.2,
        financial_weight: 60,
        selected_suppliers: 1,
      },
      lots: [],
    };

    // Enrichir depuis le DCE si disponible
    if (dceResult.success && dceResult.data) {
      const dce = dceResult.data;
      const config = dce.configurationGlobale;

      if (config?.informationsGenerales) {
        if (config.informationsGenerales.acheteur) project.meta.buyer = config.informationsGenerales.acheteur;
        if (config.informationsGenerales.titreMarche && !project.meta.description) {
          project.meta.description = config.informationsGenerales.titreMarche;
        }
      }
      if (config?.contacts?.responsableProcedure) {
        project.meta.requester = config.contacts.responsableProcedure;
      }
      if (dce.titreMarche && !project.meta.description) {
        project.meta.description = dce.titreMarche;
      }

      // Lots depuis Configuration Globale DCE
      if (config?.lots && config.lots.length > 0) {
        project.lots = config.lots.map((lot, index): AN01Lot => {
          const an01Lot = createDefaultLot();
          return {
            ...an01Lot,
            id: `lot-${Date.now()}-${index}`,
            lot_number: String(lot.numero || index + 1),
            lot_name: String(lot.intitule || `Lot ${lot.numero || index + 1}`),
            candidates: [],
            financial_rows: [],
            criteria: [],
            notations: {},
          };
        });
      }
    }

    // Enrichir avec la sauvegarde Analyse des offres DQE (candidats + grille financière par lot)
    const dqeResult = await loadAN01FromDQE(numero);
    if (dqeResult.success && dqeResult.lots && dqeResult.lots.length > 0) {
      const dqeLotsByNum = new Map<string, AN01Lot>();
      dqeResult.lots.forEach((l) => dqeLotsByNum.set(String(l.lot_number), l));
      if (project.lots.length > 0) {
        project.lots = project.lots.map((lot) => {
          const dqeLot = dqeLotsByNum.get(lot.lot_number);
          if (!dqeLot || (dqeLot.candidates.length === 0 && dqeLot.financial_rows.length === 0))
            return lot;
          return {
            ...lot,
            candidates: dqeLot.candidates.length > 0 ? dqeLot.candidates : lot.candidates,
            financial_rows:
              dqeLot.financial_rows.length > 0 ? dqeLot.financial_rows : lot.financial_rows,
          };
        });
      } else {
        project.lots = dqeResult.lots.map((l) => ({
          ...l,
          lot_name: l.lot_name || `Lot ${l.lot_number}`,
        }));
      }
    }

    return { success: true, project };
  } catch (err: any) {
    console.error('loadAN01ProjectFromProcedure:', err);
    return {
      success: false,
      error: err?.message || 'Erreur lors du chargement des données',
    };
  }
}
