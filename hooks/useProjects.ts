import { useEffect } from 'react';
import { useProjectsStore } from '@/stores';

/**
 * Hook personnalisé pour les projets
 * Charge automatiquement les projets au montage
 */
export const useProjects = (autoLoad = true) => {
  const {
    projects,
    loading,
    error,
    searchQuery,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    bulkInsert,
  } = useProjectsStore();

  useEffect(() => {
    if (autoLoad && projects.length === 0 && !loading) {
      loadProjects();
    }
  }, [autoLoad]);

  return {
    projects,
    loading,
    error,
    searchQuery,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
    searchProjects,
    bulkInsert,
  };
};
