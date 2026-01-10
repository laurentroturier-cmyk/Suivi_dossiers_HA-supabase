import { useAuthStore } from '@/stores';

/**
 * Hook personnalisé pour l'authentification
 * Simplifie l'accès au store auth
 */
export const useAuth = () => {
  const {
    user,
    profile,
    session,
    loading,
    error,
    signIn,
    signOut,
    initialize,
  } = useAuthStore();

  return {
    user,
    profile,
    session,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signIn,
    signOut,
    initialize,
  };
};
