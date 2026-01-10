import React, { useState, useMemo } from 'react';
import { useImmobilier } from '@/hooks';
import { Search, Filter, X } from 'lucide-react';
import { ImmobilierFilters } from '@/types/immobilier';
import { Immobilier } from '@/types/immobilier';

interface ImmobilierFiltersProps {
  onSearch?: (filters: ImmobilierFilters) => void;
}

const ImmobilierTableFilters: React.FC<ImmobilierFiltersProps> = ({ onSearch }) => {
  const { projets, searchProjets, filters, updateFilters } = useImmobilier();
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Filtrer les projets dynamiquement selon les filtres actifs (côté client)
  const filteredProjets = useMemo(() => {
    return projets.filter((projet) => {
      // Filtre de recherche textuelle
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          projet['Code demande']?.toLowerCase().includes(searchLower) ||
          projet['Intitulé']?.toLowerCase().includes(searchLower) ||
          projet['Site']?.toLowerCase().includes(searchLower) ||
          projet['Code Site']?.toLowerCase().includes(searchLower) ||
          projet['Descriptif']?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      // Filtres par valeur exacte
      if (filters.region && projet['Région'] !== filters.region) return false;
      if (filters.centre && projet['Centre'] !== filters.centre) return false;
      if (filters.statut && projet['Statut'] !== filters.statut) return false;
      if (filters.priorite && projet['Priorité'] !== filters.priorite) return false;
      if (filters.chefProjet && projet['Chef de Projet'] !== filters.chefProjet) return false;
      if (filters.programme && projet['Programme'] !== filters.programme) return false;
      if (filters.etapeDemande && projet['Etape demande'] !== filters.etapeDemande) return false;
      if (filters.rpa && projet['RPA'] !== filters.rpa) return false;
      if (filters.composant && projet['Composant principal'] !== filters.composant) return false;
      if (filters.decisionCNI && projet['Décision CNI'] !== filters.decisionCNI) return false;

      // Filtre par période de date de travaux
      if (filters.dateTravauxDebut || filters.dateTravauxFin) {
        const dateDebut = projet['Date de démarrage travaux'];
        if (dateDebut) {
          const projetDate = new Date(dateDebut);
          if (filters.dateTravauxDebut && projetDate < new Date(filters.dateTravauxDebut)) return false;
          if (filters.dateTravauxFin && projetDate > new Date(filters.dateTravauxFin)) return false;
        } else {
          return false; // Exclure les projets sans date si un filtre de date est actif
        }
      }

      return true;
    });
  }, [projets, filters]);

  // Extraire les valeurs uniques pour les filtres DEPUIS LES PROJETS FILTRÉS
  const regions = useMemo(() => [...new Set(filteredProjets.map(p => p['Région']).filter(Boolean))].sort(), [filteredProjets]);
  const statuts = useMemo(() => [...new Set(filteredProjets.map(p => p['Statut']).filter(Boolean))].sort(), [filteredProjets]);
  const centres = useMemo(() => [...new Set(filteredProjets.map(p => p['Centre']).filter(Boolean))].sort(), [filteredProjets]);
  const priorites = useMemo(() => [...new Set(filteredProjets.map(p => p['Priorité']).filter(Boolean))].sort(), [filteredProjets]);
  const chefs = useMemo(() => [...new Set(filteredProjets.map(p => p['Chef de Projet']).filter(Boolean))].sort(), [filteredProjets]);
  const programmes = useMemo(() => [...new Set(filteredProjets.map(p => p['Programme']).filter(Boolean))].sort(), [filteredProjets]);
  const etapeDemandes = useMemo(() => [...new Set(filteredProjets.map(p => p['Etape demande']).filter(Boolean))].sort(), [filteredProjets]);
  const rpas = useMemo(() => [...new Set(filteredProjets.map(p => p['RPA']).filter(Boolean))].sort(), [filteredProjets]);
  const composants = useMemo(() => [...new Set(filteredProjets.map(p => p['Composant principal']).filter(Boolean))].sort(), [filteredProjets]);
  const decisionsCNI = useMemo(() => [...new Set(filteredProjets.map(p => p['Décision CNI']).filter(Boolean))].sort(), [filteredProjets]);

  const handleSearch = async () => {
    await searchProjets(filters);
    onSearch?.(filters);
  };

  const handleReset = () => {
    updateFilters({
      search: '',
      region: undefined,
      centre: undefined,
      statut: undefined,
      priorite: undefined,
      chefProjet: undefined,
      programme: undefined,
      etapeDemande: undefined,
      rpa: undefined,
      composant: undefined,
      decisionCNI: undefined,
      dateTravauxDebut: undefined,
      dateTravauxFin: undefined,
    });
  };

  const handleInputChange = (field: keyof ImmobilierFilters, value: string) => {
    const newFilters = { ...filters, [field]: value || undefined };
    updateFilters(newFilters);
    onSearch?.(newFilters);
  };

  // Déterminer si des filtres sont actifs pour afficher/activer le bouton d'annulation
  const hasActiveFilters = useMemo(() => {
    const entries = Object.entries(filters || {});
    return entries.some(([, v]) => !!v);
  }, [filters]);

  // Libellés lisibles pour les badges
  const labelsMap: Record<keyof ImmobilierFilters, string> = {
    search: 'Recherche',
    statut: 'Statut',
    region: 'Région',
    centre: 'Centre',
    priorite: 'Priorité',
    chefProjet: 'Chef de Projet',
    programme: 'Programme',
    etapeDebut: 'Étape début',
    etapeFin: 'Étape fin',
    etapeDemande: 'Étape demande',
    rpa: 'RPA',
    composant: 'Composant',
    decisionCNI: 'Décision CNI',
    dateTravauxDebut: 'Début Travaux (de)',
    dateTravauxFin: 'Début Travaux (à)'
  };

  const formatBadgeValue = (key: keyof ImmobilierFilters, value?: string) => {
    if (!value) return '';
    if (key === 'dateTravauxDebut' || key === 'dateTravauxFin') {
      try {
        return new Date(value).toLocaleDateString('fr-FR');
      } catch {
        return value;
      }
    }
    return value;
  };

  const clearFilter = (key: keyof ImmobilierFilters) => {
    const next = { ...filters, [key]: undefined };
    updateFilters(next);
    onSearch?.(next);
  };

  return (
    <div data-export="filters" className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-4">
      {/* Recherche rapide */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher par code, intitulé, site..."
            value={filters.search}
            onChange={(e) => handleInputChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-6 py-2 bg-[#005c4d] hover:bg-[#00483f] text-white rounded-lg font-semibold transition-colors"
        >
          Rechercher
        </button>
        <button
          onClick={handleReset}
          disabled={!hasActiveFilters}
          className="px-6 py-2 border border-[#005c4d] text-[#005c4d] rounded-lg font-semibold transition-colors hover:bg-[#005c4d] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Annuler les filtres
        </button>
      </div>

      {/* Filtres actifs (badges) */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.12em] mr-1">Filtres actifs</span>
          {Object.entries(filters)
            .filter(([_, v]) => !!v)
            .map(([k, v]) => {
              const key = k as keyof ImmobilierFilters;
              return (
                <button
                  key={key}
                  onClick={() => clearFilter(key)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
                  title={`${labelsMap[key]}: ${formatBadgeValue(key, v)}`}
                >
                  <span className="text-gray-600 dark:text-gray-300">{labelsMap[key]}:</span>
                  <span className="font-bold">{formatBadgeValue(key, v as string)}</span>
                  <X className="w-3 h-3 ml-1" />
                </button>
              );
            })}
          <button
            onClick={handleReset}
            className="ml-1 text-[11px] text-[#005c4d] font-semibold hover:underline"
          >
            Effacer tout
          </button>
        </div>
      )}

      {/* Bouton filtres avancés */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-[#005c4d] font-semibold hover:text-[#00483f]"
      >
        <Filter className="w-4 h-4" />
        {showAdvanced ? 'Masquer les filtres' : 'Afficher les filtres avancés'}
      </button>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Région */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Région
              </label>
              <select
                value={filters.region || ''}
                onChange={(e) => handleInputChange('region', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les régions</option>
                {regions.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>

            {/* Centre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Centre
              </label>
              <select
                value={filters.centre || ''}
                onChange={(e) => handleInputChange('centre', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les centres</option>
                {centres.map((centre) => (
                  <option key={centre} value={centre}>
                    {centre}
                  </option>
                ))}
              </select>
            </div>

            {/* Statut */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Statut
              </label>
              <select
                value={filters.statut || ''}
                onChange={(e) => handleInputChange('statut', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                {statuts.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Priorité
              </label>
              <select
                value={filters.priorite || ''}
                onChange={(e) => handleInputChange('priorite', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Toutes les priorités</option>
                {priorites.map((priorite) => (
                  <option key={priorite} value={priorite}>
                    {priorite}
                  </option>
                ))}
              </select>
            </div>

            {/* Chef de Projet */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Chef de Projet
              </label>
              <select
                value={filters.chefProjet || ''}
                onChange={(e) => handleInputChange('chefProjet', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les chefs</option>
                {chefs.map((chef) => (
                  <option key={chef} value={chef}>
                    {chef}
                  </option>
                ))}
              </select>
            </div>

            {/* Programme */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Programme
              </label>
              <select
                value={filters.programme || ''}
                onChange={(e) => handleInputChange('programme', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les programmes</option>
                {programmes.map((programme) => (
                  <option key={programme} value={programme}>
                    {programme}
                  </option>
                ))}
              </select>
            </div>

            {/* Étape demande */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Étape demande
              </label>
              <select
                value={filters.etapeDemande || ''}
                onChange={(e) => handleInputChange('etapeDemande', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {etapeDemandes.map((etape) => (
                  <option key={etape} value={etape}>
                    {etape}
                  </option>
                ))}
              </select>
            </div>

            {/* RPA */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                RPA
              </label>
              <select
                value={filters.rpa || ''}
                onChange={(e) => handleInputChange('rpa', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {rpas.map((rpa) => (
                  <option key={rpa} value={rpa}>
                    {rpa}
                  </option>
                ))}
              </select>
            </div>

            {/* Composant */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Composant
              </label>
              <select
                value={filters.composant || ''}
                onChange={(e) => handleInputChange('composant', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {composants.map((composant) => (
                  <option key={composant} value={composant}>
                    {composant}
                  </option>
                ))}
              </select>
            </div>

            {/* Décision CNI */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Décision CNI
              </label>
              <select
                value={filters.decisionCNI || ''}
                onChange={(e) => handleInputChange('decisionCNI', e.target.value)}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous</option>
                {decisionsCNI.map((decision) => (
                  <option key={decision} value={decision}>
                    {decision}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Période Début Travaux */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Début Travaux (Période)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="date"
                value={filters.dateTravauxDebut || ''}
                onChange={(e) => handleInputChange('dateTravauxDebut', e.target.value)}
                placeholder="jj/mm/aaaa"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={filters.dateTravauxFin || ''}
                onChange={(e) => handleInputChange('dateTravauxFin', e.target.value)}
                placeholder="jj/mm/aaaa"
                className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-[#005c4d] hover:bg-[#00483f] text-white rounded-lg font-semibold transition-colors"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-[#005c4d] text-[#005c4d] rounded-lg font-semibold transition-colors hover:bg-[#005c4d] hover:text-white flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Réinitialiser
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmobilierTableFilters;
