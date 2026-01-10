import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { UserProfile } from '@/types/auth';
import { authService } from '@/services/supabase';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  error: string | null;

  // Actions
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loadProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),

  signIn: async (email, password) => {
    try {
      set({ loading: true, error: null });
      const data = await authService.signIn(email, password);
      
      if (data.user) {
        set({ user: data.user, session: data.session });
        await get().loadProfile(data.user.id);
      }
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null });
      await authService.signOut();
      get().reset();
    } catch (error: any) {
      set({ error: error.message });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadProfile: async (userId) => {
    try {
      const profile = await authService.getProfile(userId);
      set({ profile });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      set({ error: error.message });
    }
  },

  initialize: async () => {
    try {
      set({ loading: true });
      
      // Récupérer la session actuelle
      const session = await authService.getSession();
      
      if (session?.user) {
        set({ user: session.user, session });
        await get().loadProfile(session.user.id);
      }
      
      // Écouter les changements d'authentification
      authService.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          set({ user: session.user, session });
          await get().loadProfile(session.user.id);
        } else {
          get().reset();
        }
      });
    } catch (error: any) {
      console.error('Error initializing auth:', error);
      set({ error: error.message });
    } finally {
      set({ loading: false });
    }
  },

  reset: () => {
    set({
      user: null,
      profile: null,
      session: null,
      loading: false,
      error: null,
    });
  },
}));
