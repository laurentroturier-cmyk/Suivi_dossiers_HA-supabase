import { useImmobilierStore } from '@/stores/useImmobilierStore';
import { Immobilier, ImmobilierFilters } from '@/types/immobilier';

/**
 * Hook pour accéder aux fonctionnalités du module immobilier
 */
export const useImmobilier = () => {
  // États
  const projets = useImmobilierStore((state) => state.projets);
  const stats = useImmobilierStore((state) => state.stats);
  const loading = useImmobilierStore((state) => state.loading);
  const error = useImmobilierStore((state) => state.error);
  const selectedProjet = useImmobilierStore((state) => state.selectedProjet);

  // Actions de chargement
  const loadProjets = useImmobilierStore((state) => state.loadProjets);
  const loadStats = useImmobilierStore((state) => state.loadStats);

  // Actions CRUD
  const createProjet = useImmobilierStore((state) => state.createProjet);
  const updateProjet = useImmobilierStore((state) => state.updateProjet);
  const deleteProjet = useImmobilierStore((state) => state.deleteProjet);

  // Actions de recherche
  const searchProjets = useImmobilierStore((state) => state.searchProjets);

  // Actions utilitaires
  const setSelectedProjet = useImmobilierStore((state) => state.setSelectedProjet);
  const bulkImport = useImmobilierStore((state) => state.bulkImport);

  // Méthodes facilitantes
  const getProjetByCode = (codeDemande: string): Immobilier | undefined => {
    return projets.find(p => p['Code demande'] === codeDemande);
  };

  const getProjetsParRegion = (region: string): Immobilier[] => {
    return projets.filter(p => p['Région'] === region);
  };

  const getProjetsParStatut = (statut: string): Immobilier[] => {
    return projets.filter(p => p['Statut'] === statut);
  };

  const getProjetsParChef = (chef: string): Immobilier[] => {
    return projets.filter(p => p['Chef de Projet'] === chef);
  };

  const getProjetsParPriorite = (priorite: string): Immobilier[] => {
    return projets.filter(p => p['Priorité'] === priorite);
  };

  const searchProjetsQuick = (searchTerm: string): Immobilier[] => {
    return projets.filter(p =>
      p['Code demande']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p['Intitulé']?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p['Code Site']?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  return {
    // États
    projets,
    stats,
    loading,
    error,
    selectedProjet,

    // Actions de chargement
    loadProjets,
    loadStats,

    // Actions CRUD
    createProjet,
    updateProjet,
    deleteProjet,

    // Actions de recherche
    searchProjets,

    // Actions utilitaires
    setSelectedProjet,
    bulkImport,

    // Méthodes facilitantes
    getProjetByCode,
    getProjetsParRegion,
    getProjetsParStatut,
    getProjetsParChef,
    getProjetsParPriorite,
    searchProjetsQuick,
  };
};
