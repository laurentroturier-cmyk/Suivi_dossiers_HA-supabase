import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import { MainLayout } from '@/routes';
import Login from '@/components/auth/Login';
import {
  HomePage,
  ProjectsPage,
  DossiersPage,
  ContratsPage,
  RetraitsPage,
  DepotsPage,
  AdminPage,
} from '@/pages';

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

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

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

  // Application principale avec routing
  return (
    <BrowserRouter>
      <Routes>
        {/* Route publique : Login */}
        <Route path="/login" element={<Login />} />

        {/* Routes protégées avec layout */}
        <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/projets" element={<ProjectsPage />} />
          <Route path="/procedures" element={<DossiersPage />} />
          <Route path="/contrats" element={<ContratsPage />} />
          <Route path="/retraits" element={<RetraitsPage />} />
          <Route path="/depots" element={<DepotsPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>

        {/* Catch-all : redirect vers home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
