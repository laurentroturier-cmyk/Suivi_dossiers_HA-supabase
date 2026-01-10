import { create } from 'zustand';
import { DossierData } from '@/types';
import { dossiersService } from '@/services/supabase';

interface DossiersState {
  dossiers: DossierData[];
  loading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  setDossiers: (dossiers: DossierData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;

  loadDossiers: () => Promise<void>;
  createDossier: (dossier: Partial<DossierData>) => Promise<void>;
  updateDossier: (id: string, updates: Partial<DossierData>) => Promise<void>;
  deleteDossier: (id: string) => Promise<void>;
  searchDossiers: (query: string) => Promise<void>;
  bulkInsert: (dossiers: Partial<DossierData>[]) => Promise<void>;
}

export const useDossiersStore = create<DossiersState>((set, get) => ({
  dossiers: [],
  loading: false,
  error: null,
  searchQuery: '',

  setDossiers: (dossiers) => set({ dossiers }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  loadDossiers: async () => {
    try {
      set({ loading: true, error: null });
      const dossiers = await dossiersService.getAll();
      set({ dossiers });
    } catch (error: any) {
      console.error('Error loading dossiers:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createDossier: async (dossier) => {
    try {
      set({ loading: true, error: null });
      const newDossier = await dossiersService.create(dossier);
      set({ dossiers: [newDossier, ...get().dossiers] });
    } catch (error: any) {
      console.error('Error creating dossier:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateDossier: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedDossier = await dossiersService.update(id, updates);
      set({
        dossiers: get().dossiers.map((d) =>
          d.IDProjet === id ? updatedDossier : d
        ),
      });
    } catch (error: any) {
      console.error('Error updating dossier:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteDossier: async (id) => {
    try {
      set({ loading: true, error: null });
      await dossiersService.delete(id);
      set({ dossiers: get().dossiers.filter((d) => d.IDProjet !== id) });
    } catch (error: any) {
      console.error('Error deleting dossier:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  searchDossiers: async (query) => {
    try {
      set({ loading: true, error: null, searchQuery: query });
      if (!query.trim()) {
        await get().loadDossiers();
        return;
      }
      const dossiers = await dossiersService.search(query);
      set({ dossiers });
    } catch (error: any) {
      console.error('Error searching dossiers:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  bulkInsert: async (dossiers) => {
    try {
      set({ loading: true, error: null });
      const insertedDossiers = await dossiersService.bulkInsert(dossiers);
      set({ dossiers: [...insertedDossiers, ...get().dossiers] });
    } catch (error: any) {
      console.error('Error bulk inserting dossiers:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
