// ============================================
// SERVICE DE GESTION DES LOTS
// Gère les opérations CRUD sur les lots par procédure
// Support pour tous les modules DCE
// ============================================

import { supabase } from '../lib/supabase';

/**
 * Types de modules supportant les lots
 */
export type ModuleType = 'ae' | 'qt' | 'cctp' | 'ccap' | 'bpu' | 'dqe' | 'dpgf';

/**
 * Mapping entre type de module et nom de table Supabase
 */
const TABLE_MAPPING: Record<ModuleType, string> = {
  ae: 'actes_engagement',
  qt: 'questionnaires_techniques',
  cctp: 'cctps', // À créer
  ccap: 'ccaps', // À créer
  bpu: 'bpus',   // À créer
  dqe: 'dqes',   // À créer
  dpgf: 'dpgfs', // À créer
};

/**
 * Interface pour un lot
 */
export interface Lot {
  id: string;
  procedure_id: string;
  numero_lot: number;
  libelle_lot?: string;
  data: any;
  created_at: string;
  updated_at: string;
}

/**
 * Service de gestion des lots
 */
export class LotService {
  /**
   * Récupère tous les lots d'une procédure pour un module donné
   */
  async getLotsForProcedure(procedureId: string, moduleType: ModuleType): Promise<Lot[]> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('procedure_id', procedureId)
      .order('numero_lot', { ascending: true });
    
    if (error) {
      console.error(`Erreur lors de la récupération des lots ${moduleType}:`, error);
      throw error;
    }
    
    return data || [];
  }

  /**
   * Récupère un lot spécifique
   */
  async getLot(
    procedureId: string,
    numeroLot: number,
    moduleType: ModuleType
  ): Promise<Lot | null> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('procedure_id', procedureId)
      .eq('numero_lot', numeroLot)
      .maybeSingle();
    
    if (error) {
      console.error(`Erreur lors de la récupération du lot ${numeroLot}:`, error);
      throw error;
    }
    
    return data;
  }

  /**
   * Crée ou met à jour un lot (upsert)
   */
  async saveLot(
    procedureId: string,
    numeroLot: number,
    data: any,
    moduleType: ModuleType,
    libelleLot?: string
  ): Promise<Lot> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const payload = {
      procedure_id: procedureId,
      numero_lot: numeroLot,
      libelle_lot: libelleLot,
      data,
      updated_at: new Date().toISOString(),
    };

    const { data: result, error } = await supabase
      .from(tableName)
      .upsert(payload, {
        onConflict: 'procedure_id,numero_lot',
      })
      .select()
      .single();
    
    if (error) {
      console.error(`Erreur lors de la sauvegarde du lot ${numeroLot}:`, error);
      throw error;
    }
    
    return result;
  }

  /**
   * Supprime un lot
   */
  async deleteLot(
    procedureId: string,
    numeroLot: number,
    moduleType: ModuleType
  ): Promise<void> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { error } = await supabase
      .from(tableName)
      .delete()
      .eq('procedure_id', procedureId)
      .eq('numero_lot', numeroLot);
    
    if (error) {
      console.error(`Erreur lors de la suppression du lot ${numeroLot}:`, error);
      throw error;
    }
  }

  /**
   * Duplique un lot existant vers un nouveau numéro
   */
  async duplicateLot(
    procedureId: string,
    fromLot: number,
    toLot: number,
    moduleType: ModuleType
  ): Promise<Lot> {
    // Récupérer le lot source
    const sourceLot = await this.getLot(procedureId, fromLot, moduleType);
    
    if (!sourceLot) {
      throw new Error(`Le lot ${fromLot} n'existe pas`);
    }

    // Créer le nouveau lot avec les données du lot source
    return await this.saveLot(
      procedureId,
      toLot,
      sourceLot.data,
      moduleType,
      `${sourceLot.libelle_lot || 'Lot'} (copie)`
    );
  }

  /**
   * Compte le nombre de lots pour une procédure
   */
  async countLots(procedureId: string, moduleType: ModuleType): Promise<number> {
    const tableName = TABLE_MAPPING[moduleType];
    
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('procedure_id', procedureId);
    
    if (error) {
      console.error(`Erreur lors du comptage des lots:`, error);
      throw error;
    }
    
    return count || 0;
  }

  /**
   * Récupère le numéro du prochain lot disponible
   */
  async getNextLotNumber(procedureId: string, moduleType: ModuleType): Promise<number> {
    const lots = await this.getLotsForProcedure(procedureId, moduleType);
    
    if (lots.length === 0) {
      return 1;
    }
    
    // Trouver le plus grand numéro de lot
    const maxLot = Math.max(...lots.map(lot => lot.numero_lot));
    return maxLot + 1;
  }

  /**
   * Vérifie si un lot existe
   */
  async lotExists(
    procedureId: string,
    numeroLot: number,
    moduleType: ModuleType
  ): Promise<boolean> {
    const lot = await this.getLot(procedureId, numeroLot, moduleType);
    return lot !== null;
  }

  /**
   * Crée un nouveau lot vide
   */
  async createNewLot(
    procedureId: string,
    moduleType: ModuleType,
    libelleLot?: string
  ): Promise<Lot> {
    const nextLotNumber = await this.getNextLotNumber(procedureId, moduleType);
    
    return await this.saveLot(
      procedureId,
      nextLotNumber,
      {},
      moduleType,
      libelleLot || `Lot ${nextLotNumber}`
    );
  }

  /**
   * Réorganise les numéros de lots (après suppression par exemple)
   */
  async reorderLots(procedureId: string, moduleType: ModuleType): Promise<void> {
    const lots = await this.getLotsForProcedure(procedureId, moduleType);
    
    // Trier par numero_lot actuel
    lots.sort((a, b) => a.numero_lot - b.numero_lot);
    
    // Réassigner les numéros de 1 à N
    for (let i = 0; i < lots.length; i++) {
      const newNumber = i + 1;
      if (lots[i].numero_lot !== newNumber) {
        await this.saveLot(
          procedureId,
          newNumber,
          lots[i].data,
          moduleType,
          lots[i].libelle_lot
        );
        
        // Supprimer l'ancien si différent
        if (lots[i].numero_lot !== newNumber) {
          await this.deleteLot(procedureId, lots[i].numero_lot, moduleType);
        }
      }
    }
  }
}

// Export singleton
export const lotService = new LotService();
