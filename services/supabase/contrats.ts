import { supabase } from '@/lib/supabase';
import { Contrat } from '@/types/contrats';

export const contratsService = {
  /**
   * Récupérer tous les contrats
   */
  async getAll(): Promise<Contrat[]> {
    const { data, error } = await supabase
      .from('contrats')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer un contrat par ID
   */
  async getById(id: number): Promise<Contrat> {
    const { data, error } = await supabase
      .from('contrats')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Créer un nouveau contrat
   */
  async create(contrat: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>): Promise<Contrat> {
    const { data, error } = await supabase
      .from('contrats')
      .insert([contrat])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour un contrat
   */
  async update(id: number, updates: Partial<Contrat>): Promise<Contrat> {
    const { data, error } = await supabase
      .from('contrats')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprimer un contrat
   */
  async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('contrats')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Rechercher des contrats
   */
  async search(filters: {
    objet?: string;
    titulaire?: string;
    acheteur?: string;
    statut?: string;
  }): Promise<Contrat[]> {
    let queryBuilder = supabase.from('contrats').select('*');

    if (filters.objet) {
      queryBuilder = queryBuilder.ilike('objet', `%${filters.objet}%`);
    }
    if (filters.titulaire) {
      queryBuilder = queryBuilder.ilike('titulaire', `%${filters.titulaire}%`);
    }
    if (filters.acheteur) {
      queryBuilder = queryBuilder.ilike('acheteur', `%${filters.acheteur}%`);
    }
    if (filters.statut) {
      queryBuilder = queryBuilder.eq('statut', filters.statut);
    }

    const { data, error } = await queryBuilder.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Import en masse de contrats
   */
  async bulkInsert(contrats: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>[]): Promise<Contrat[]> {
    const { data, error } = await supabase
      .from('contrats')
      .insert(contrats)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Statistiques des contrats
   */
  async getStats(): Promise<{
    total: number;
    actifs: number;
    expires: number;
    montantTotal: number;
  }> {
    const { data, error } = await supabase
      .from('contrats')
      .select('statut, montant_annuel');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      actifs: data?.filter(c => c.statut === 'Actif').length || 0,
      expires: data?.filter(c => c.statut === 'Échu').length || 0,
      montantTotal: data?.reduce((sum, c) => sum + (parseFloat(c.montant_annuel?.toString() || '0') || 0), 0) || 0,
    };

    return stats;
  },
};
