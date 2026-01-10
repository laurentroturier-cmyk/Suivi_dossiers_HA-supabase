import { supabase } from '@/lib/supabase';
import { Immobilier, ImmobilierFilters } from '@/types/immobilier';

export const immobilierService = {
  /**
   * Récupérer tous les projets immobiliers
   */
  async getAll(): Promise<Immobilier[]> {
    const { data, error } = await supabase
      .from('immobilier')
      .select('*')
      .order('Code demande', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer un projet par code demande
   */
  async getByCodeDemande(codeDemande: string): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .select('*')
      .eq('Code demande', codeDemande)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Créer un nouveau projet immobilier
   */
  async create(project: Immobilier): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .insert([project])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Mettre à jour un projet immobilier
   */
  async update(codeDemande: string, updates: Partial<Immobilier>): Promise<Immobilier> {
    const { data, error } = await supabase
      .from('immobilier')
      .update(updates)
      .eq('Code demande', codeDemande)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Supprimer un projet immobilier
   */
  async delete(codeDemande: string): Promise<void> {
    const { error } = await supabase
      .from('immobilier')
      .delete()
      .eq('Code demande', codeDemande);

    if (error) throw error;
  },

  /**
   * Rechercher des projets avec filtres
   */
  async search(filters: ImmobilierFilters): Promise<Immobilier[]> {
    let query = supabase.from('immobilier').select('*');

    if (filters.search) {
      query = query.or(
        `"Code demande".ilike.%${filters.search}%,` +
        `"Intitulé".ilike.%${filters.search}%,` +
        `"Code Site".ilike.%${filters.search}%`
      );
    }

    if (filters.statut) {
      query = query.eq('Statut', filters.statut);
    }

    if (filters.region) {
      query = query.eq('Région', filters.region);
    }

    if (filters.centre) {
      query = query.eq('Centre', filters.centre);
    }

    if (filters.priorite) {
      query = query.eq('Priorité', filters.priorite);
    }

    if (filters.chefProjet) {
      query = query.eq('Chef de Projet', filters.chefProjet);
    }

    if (filters.programme) {
      query = query.eq('Programme', filters.programme);
    }

    const { data, error } = await query.order('Code demande', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Insérer plusieurs projets en masse
   */
  async bulkInsert(projects: Immobilier[]): Promise<Immobilier[]> {
    const { data, error } = await supabase
      .from('immobilier')
      .insert(projects)
      .select();

    if (error) throw error;
    return data || [];
  },

  /**
   * Récupérer les statistiques
   */
  async getStats() {
    const { data, error } = await supabase
      .from('immobilier')
      .select('*');

    if (error) throw error;

    const projects = data || [];
    const budgetValues = projects
      .map(p => {
        const budget = p['Budget en €'];
        return typeof budget === 'string' ? parseFloat(budget.replace(/,/g, '.')) : budget;
      })
      .filter(v => !isNaN(v));

    const engagedValues = projects
      .map(p => {
        const engaged = p['Engagé en €'];
        return typeof engaged === 'string' ? parseFloat(engaged.replace(/,/g, '.')) : engaged;
      })
      .filter(v => !isNaN(v));

    const realizedValues = projects
      .map(p => {
        const realized = p['Réalisé en €'];
        return typeof realized === 'string' ? parseFloat(realized.replace(/,/g, '.')) : realized;
      })
      .filter(v => !isNaN(v));

    const realizationRates = projects
      .map(p => {
        const rate = p['% Réalisé'];
        return typeof rate === 'string' ? parseFloat(rate.replace(/,/g, '.')) : rate;
      })
      .filter(v => !isNaN(v));

    return {
      totalProjets: projects.length,
      budgetTotal: budgetValues.reduce((a, b) => a + b, 0),
      budgetEngage: engagedValues.reduce((a, b) => a + b, 0),
      budgetRealise: realizedValues.reduce((a, b) => a + b, 0),
      tauxMoyenRealisation: realizationRates.length > 0
        ? realizationRates.reduce((a, b) => a + b, 0) / realizationRates.length
        : 0,
      projetEnCours: projects.filter(p => p['Statut']?.toLowerCase().includes('cours') || p['Statut']?.toLowerCase().includes('en cours')).length,
      projetsTermines: projects.filter(p => p['Statut']?.toLowerCase().includes('termin')).length,
    };
  },
};
