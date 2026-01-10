import { supabase } from '@/lib/supabase';
import { ProjectData } from '@/types';

export const projectsService = {
  /**
   * Récupérer tous les projets
   */
  async getAll(): Promise<ProjectData[]> {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .order('IDProjet', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer un projet par ID
   */
  async getById(id: string): Promise<ProjectData> {
    const { data, error } = await supabase
      .from('projets')
      .select('*')
      .eq('IDProjet', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Créer un nouveau projet
   */
  async create(project: Partial<ProjectData>): Promise<ProjectData> {
    const { data, error } = await supabase
      .from('projets')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour un projet
   */
  async update(id: string, updates: Partial<ProjectData>): Promise<ProjectData> {
    const { data, error } = await supabase
      .from('projets')
      .update(updates)
      .eq('IDProjet', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprimer un projet
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('projets')
      .delete()
      .eq('IDProjet', id);

    if (error) throw error;
  },

  /**
   * Rechercher des projets
   */
  async search(query: string, fields: string[] = ['Objet court', 'Acheteur']): Promise<ProjectData[]> {
    let queryBuilder = supabase.from('projets').select('*');

    // Recherche sur plusieurs champs
    const orConditions = fields.map(field => `${field}.ilike.%${query}%`).join(',');
    queryBuilder = queryBuilder.or(orConditions);

    const { data, error } = await queryBuilder.order('IDProjet', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Import en masse de projets
   */
  async bulkInsert(projects: Partial<ProjectData>[]): Promise<ProjectData[]> {
    const { data, error } = await supabase
      .from('projets')
      .insert(projects)
      .select();

    if (error) throw error;
    return data || [];
  },
};
