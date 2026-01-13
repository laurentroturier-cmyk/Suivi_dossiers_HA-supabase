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
  ImmobilierPage,
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
 * Route protégée Admin - nécessite rôle admin
 */
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
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
        path="/immobilier"
        element={
          <ProtectedRoute>
            <ImmobilierPage />
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
      
      {/* Route admin uniquement : Rédaction */}
      <Route
        path="/redaction"
        element={
          <AdminRoute>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
              <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Module Rédaction
                </h1>
                <p className="text-xl text-gray-600 dark:text-gray-300">
                  Module en cours de développement...
                </p>
              </div>
            </div>
          </AdminRoute>
        }
      />

      {/* Catch-all : redirect vers home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
