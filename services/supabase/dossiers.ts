import { supabase } from '@/lib/supabase';
import { DossierData } from '@/types';

export const dossiersService = {
  /**
   * Récupérer tous les dossiers
   */
  async getAll(): Promise<DossierData[]> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .order('IDProjet', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer un dossier par ID
   */
  async getById(id: string): Promise<DossierData> {
    const { data, error } = await supabase
      .from('dossiers')
      .select('*')
      .eq('IDProjet', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Créer un nouveau dossier
   */
  async create(dossier: Partial<DossierData>): Promise<DossierData> {
    const { data, error } = await supabase
      .from('dossiers')
      .insert([dossier])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour un dossier
   */
  async update(id: string, updates: Partial<DossierData>): Promise<DossierData> {
    const { data, error } = await supabase
      .from('dossiers')
      .update(updates)
      .eq('IDProjet', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprimer un dossier
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('dossiers')
      .delete()
      .eq('IDProjet', id);

    if (error) throw error;
  },

  /**
   * Rechercher des dossiers
   */
  async search(query: string, fields: string[] = ['Titre_du_dossier', 'Acheteur']): Promise<DossierData[]> {
    let queryBuilder = supabase.from('dossiers').select('*');

    const orConditions = fields.map(field => `${field}.ilike.%${query}%`).join(',');
    queryBuilder = queryBuilder.or(orConditions);

    const { data, error } = await queryBuilder.order('IDProjet', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Import en masse de dossiers
   */
  async bulkInsert(dossiers: Partial<DossierData>[]): Promise<DossierData[]> {
    const { data, error } = await supabase
      .from('dossiers')
      .insert(dossiers)
      .select();

    if (error) throw error;
    return data || [];
  },
};
