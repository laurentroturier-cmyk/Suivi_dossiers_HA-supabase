import React, { useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { AppRoutes, MainLayout } from '@/routes';
import Login from '@/components/auth/Login';

/**
 * App.tsx refactorisé - Version 2.0
 * Passe de 4199 lignes à ~50 lignes
 * 
 * Architecture:
 * - React Router pour la navigation
 * - Zustand pour la gestion d'état
 * - Services Supabase pour les requêtes
 * - Hooks personnalisés pour la logique métier
 */
const App: React.FC = () => {
  const { isAuthenticated, loading, initialize } = useAuth();

  // Initialiser l'authentification au démarrage
  useEffect(() => {
    initialize();
  }, []);

  // Loader pendant l'initialisation
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Chargement de GestProjet...</p>
        </div>
      </div>
    );
  }

  // Afficher le login si non authentifié
  if (!isAuthenticated) {
    return <Login />;
  }

  // Application principale avec routing
  return (
    <BrowserRouter>
      <MainLayout>
        <AppRoutes />
      </MainLayout>
    </BrowserRouter>
  );
};

export default App;
