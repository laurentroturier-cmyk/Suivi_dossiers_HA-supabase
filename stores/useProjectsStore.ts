import { create } from 'zustand';
import { ProjectData } from '@/types';
import { projectsService } from '@/services/supabase';

interface ProjectsState {
  projects: ProjectData[];
  loading: boolean;
  error: string | null;
  searchQuery: string;

  // Actions
  setProjects: (projects: ProjectData[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;

  loadProjects: () => Promise<void>;
  createProject: (project: Partial<ProjectData>) => Promise<void>;
  updateProject: (id: string, updates: Partial<ProjectData>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  searchProjects: (query: string) => Promise<void>;
  bulkInsert: (projects: Partial<ProjectData>[]) => Promise<void>;
}

export const useProjectsStore = create<ProjectsState>((set, get) => ({
  projects: [],
  loading: false,
  error: null,
  searchQuery: '',

  setProjects: (projects) => set({ projects }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  loadProjects: async () => {
    try {
      set({ loading: true, error: null });
      const projects = await projectsService.getAll();
      set({ projects });
    } catch (error: any) {
      console.error('Error loading projects:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  createProject: async (project) => {
    try {
      set({ loading: true, error: null });
      const newProject = await projectsService.create(project);
      set({ projects: [newProject, ...get().projects] });
    } catch (error: any) {
      console.error('Error creating project:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProject: async (id, updates) => {
    try {
      set({ loading: true, error: null });
      const updatedProject = await projectsService.update(id, updates);
      set({
        projects: get().projects.map((p) =>
          p.IDProjet === id ? updatedProject : p
        ),
      });
    } catch (error: any) {
      console.error('Error updating project:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteProject: async (id) => {
    try {
      set({ loading: true, error: null });
      await projectsService.delete(id);
      set({ projects: get().projects.filter((p) => p.IDProjet !== id) });
    } catch (error: any) {
      console.error('Error deleting project:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  searchProjects: async (query) => {
    try {
      set({ loading: true, error: null, searchQuery: query });
      if (!query.trim()) {
        await get().loadProjects();
        return;
      }
      const projects = await projectsService.search(query);
      set({ projects });
    } catch (error: any) {
      console.error('Error searching projects:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  bulkInsert: async (projects) => {
    try {
      set({ loading: true, error: null });
      const insertedProjects = await projectsService.bulkInsert(projects);
      set({ projects: [...insertedProjects, ...get().projects] });
    } catch (error: any) {
      console.error('Error bulk inserting projects:', error);
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
