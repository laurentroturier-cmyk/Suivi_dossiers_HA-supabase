import React, { useState } from 'react';
import { useImmobilier } from '@/hooks';
import { Search, Filter, X } from 'lucide-react';
import { ImmobilierFilters } from '@/types/immobilier';

interface ImmobilierFiltersProps {
  onSearch?: (filters: ImmobilierFilters) => void;
}

const ImmobilierTableFilters: React.FC<ImmobilierFiltersProps> = ({ onSearch }) => {
  const { projets, searchProjets } = useImmobilier();
  const [filters, setFilters] = useState<ImmobilierFilters>({
    search: '',
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Extraire les valeurs uniques pour les filtres
  const regions = [...new Set(projets.map(p => p['Région']).filter(Boolean))].sort();
  const statuts = [...new Set(projets.map(p => p['Statut']).filter(Boolean))].sort();
  const centres = [...new Set(projets.map(p => p['Centre']).filter(Boolean))].sort();
  const priorites = [...new Set(projets.map(p => p['Priorité']).filter(Boolean))].sort();
  const chefs = [...new Set(projets.map(p => p['Chef de Projet']).filter(Boolean))].sort();
  const programmes = [...new Set(projets.map(p => p['Programme']).filter(Boolean))].sort();

  const handleSearch = async () => {
    await searchProjets(filters);
    onSearch?.(filters);
  };

  const handleReset = () => {
    setFilters({ search: '' });
    searchProjets({ search: '' });
  };

  const handleInputChange = (field: keyof ImmobilierFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value || undefined }));
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border-2 border-gray-200 dark:border-gray-700 p-6 space-y-4">
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
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          Rechercher
        </button>
      </div>

      {/* Bouton filtres avancés */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:text-blue-700 dark:hover:text-blue-300"
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
          </div>

          {/* Boutons d'action */}
          <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSearch}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
            >
              Appliquer les filtres
            </button>
            <button
              onClick={handleReset}
              className="px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 text-gray-900 dark:text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
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
