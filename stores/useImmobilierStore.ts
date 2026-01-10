import { create } from 'zustand';
import { Immobilier, ImmobilierStats, ImmobilierFilters } from '@/types/immobilier';
import { immobilierService } from '@/services/supabase';

interface ImmobilierState {
  // Data
  projets: Immobilier[];
  stats: ImmobilierStats | null;
  
  // UI State
  loading: boolean;
  error: string | null;
  selectedProjet: Immobilier | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedProjet: (projet: Immobilier | null) => void;

  // CRUD operations
  loadProjets: () => Promise<void>;
  loadStats: () => Promise<void>;
  createProjet: (projet: Immobilier) => Promise<void>;
  updateProjet: (codeDemande: string, updates: Partial<Immobilier>) => Promise<void>;
  deleteProjet: (codeDemande: string) => Promise<void>;
  
  // Search & Filter
  searchProjets: (filters: ImmobilierFilters) => Promise<void>;
  
  // Bulk operations
  bulkImport: (projets: Immobilier[]) => Promise<void>;
}

export const useImmobilierStore = create<ImmobilierState>((set, get) => ({
  projets: [],
  stats: null,
  loading: false,
  error: null,
  selectedProjet: null,

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedProjet: (projet) => set({ selectedProjet: projet }),

  loadProjets: async () => {
    try {
      set({ loading: true, error: null });
      const projets = await immobilierService.getAll();
      set({ projets });
    } catch (error: any) {
      console.error('Error loading immobilier projets:', error);
      set({ error: error.message || 'Erreur lors du chargement des projets' });
    } finally {
      set({ loading: false });
    }
  },

  loadStats: async () => {
    try {
      set({ loading: true, error: null });
      const stats = await immobilierService.getStats();
      set({ stats: stats as ImmobilierStats });
    } catch (error: any) {
      console.error('Error loading immobilier stats:', error);
      set({ error: error.message || 'Erreur lors du chargement des statistiques' });
    } finally {
      set({ loading: false });
    }
  },

  createProjet: async (projet) => {
    try {
      set({ loading: true, error: null });
      const newProjet = await immobilierService.create(projet);
      set({ projets: [newProjet, ...get().projets] });
    } catch (error: any) {
      console.error('Error creating immobilier projet:', error);
      set({ error: error.message || 'Erreur lors de la création du projet' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProjet: async (codeDemande, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedProjet = await immobilierService.update(codeDemande, updates);
      
      const projets = get().projets.map(p =>
        p['Code demande'] === codeDemande ? updatedProjet : p
      );
      set({ projets });

      if (get().selectedProjet?.['Code demande'] === codeDemande) {
        set({ selectedProjet: updatedProjet });
      }
    } catch (error: any) {
      console.error('Error updating immobilier projet:', error);
      set({ error: error.message || 'Erreur lors de la mise à jour du projet' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProjet: async (codeDemande) => {
    try {
      set({ loading: true, error: null });
      await immobilierService.delete(codeDemande);
      
      const projets = get().projets.filter(p => p['Code demande'] !== codeDemande);
      set({ projets });

      if (get().selectedProjet?.['Code demande'] === codeDemande) {
        set({ selectedProjet: null });
      }
    } catch (error: any) {
      console.error('Error deleting immobilier projet:', error);
      set({ error: error.message || 'Erreur lors de la suppression du projet' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  searchProjets: async (filters) => {
    try {
      set({ loading: true, error: null });
      const projets = await immobilierService.search(filters);
      set({ projets });
    } catch (error: any) {
      console.error('Error searching immobilier projets:', error);
      set({ error: error.message || 'Erreur lors de la recherche' });
    } finally {
      set({ loading: false });
    }
  },

  bulkImport: async (projets) => {
    try {
      set({ loading: true, error: null });
      const imported = await immobilierService.bulkInsert(projets);
      set({ projets: imported });
    } catch (error: any) {
      console.error('Error importing immobilier projets:', error);
      set({ error: error.message || 'Erreur lors de l\'importation' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
