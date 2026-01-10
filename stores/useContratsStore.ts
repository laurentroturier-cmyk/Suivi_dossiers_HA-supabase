import { create } from 'zustand';
import { Contrat } from '@/types/contrats';
import { contratsService } from '@/services/supabase';

interface ContratsState {
  contrats: Contrat[];
  loading: boolean;
  error: string | null;

  // Actions
  setContrats: (contrats: Contrat[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  loadContrats: () => Promise<void>;
  createContrat: (contrat: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateContrat: (id: number, updates: Partial<Contrat>) => Promise<void>;
  deleteContrat: (id: number) => Promise<void>;
  searchContrats: (filters: any) => Promise<void>;
  bulkInsert: (contrats: Omit<Contrat, 'id' | 'created_at' | 'updated_at'>[]) => Promise<void>;
}

export const useContratsStore = create<ContratsState>((set, get) => ({
  contrats: [],
  loading: false,
  error: null,

  setContrats: (contrats) => set({ contrats }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  loadContrats: async () => {
    try {
      set({ loading: true, error: null });
      const contrats = await contratsService.getAll();
      set({ contrats });
    } catch (error: any) {
      console.error('Error loading contrats:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createContrat: async (contrat) => {
    try {
      set({ loading: true, error: null });
      const newContrat = await contratsService.create(contrat);
      set({ contrats: [newContrat, ...get().contrats] });
    } catch (error: any) {
      console.error('Error creating contrat:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateContrat: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedContrat = await contratsService.update(id, updates);
      set({
        contrats: get().contrats.map((c) =>
          c.id === id ? updatedContrat : c
        ),
      });
    } catch (error: any) {
      console.error('Error updating contrat:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteContrat: async (id) => {
    try {
      set({ loading: true, error: null });
      await contratsService.delete(id);
      set({ contrats: get().contrats.filter((c) => c.id !== id) });
    } catch (error: any) {
      console.error('Error deleting contrat:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  searchContrats: async (filters) => {
    try {
      set({ loading: true, error: null });
      const contrats = await contratsService.search(filters);
      set({ contrats });
    } catch (error: any) {
      console.error('Error searching contrats:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  bulkInsert: async (contrats) => {
    try {
      set({ loading: true, error: null });
      const insertedContrats = await contratsService.bulkInsert(contrats);
      set({ contrats: [...insertedContrats, ...get().contrats] });
    } catch (error: any) {
      console.error('Error bulk inserting contrats:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
