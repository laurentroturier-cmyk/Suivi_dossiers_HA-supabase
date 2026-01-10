import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks';
import {
  HomePage,
  ProjectsPage,
  DossiersPage,
  ContratsPage,
  RetraitsPage,
  DepotsPage,
  AdminPage,
} from '@/pages';
import Login from '@/components/auth/Login';

/**
 * Route protégée - nécessite authentification
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

/**
 * Configuration des routes de l'application
 */
export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Route publique : Login */}
      <Route path="/login" element={<Login />} />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HomePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/projets"
        element={
          <ProtectedRoute>
            <ProjectsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/procedures"
        element={
          <ProtectedRoute>
            <DossiersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/contrats"
        element={
          <ProtectedRoute>
            <ContratsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/retraits"
        element={
          <ProtectedRoute>
            <RetraitsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/depots"
        element={
          <ProtectedRoute>
            <DepotsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        }
      />

      {/* Catch-all : redirect vers home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
