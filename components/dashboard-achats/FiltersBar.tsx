import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Filters } from './types';
import { AchatRow } from './types';

export interface DistinctColumns {
  Trimestre: string[];
  "Famille d'achats": string[];
  Fournisseur: string[];
  "Description du CRT": string[];
  "Signification du statut du document": string[];
  "Catégorie d'achats": string[];
}

interface FiltersBarProps {
  filters: Filters;
  onFilterChange: (key: keyof Filters, value: string) => void;
  onReset: () => void;
  data?: AchatRow[];
  distinctColumns?: DistinctColumns;
}

export const FiltersBar: React.FC<FiltersBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  data = [],
  distinctColumns
}) => {
  const uniqueValues = (key: 'Trimestre' | "Famille d'achats" | 'Fournisseur' | 'Description du CRT' | 'Signification du statut du document' | "Catégorie d'achats"): string[] => {
    if (distinctColumns) {
      return distinctColumns[key] ?? [];
    }
    const set = new Set(
      data.map(row => row[key]).filter(v => v != null && v !== '').map(v => String(v))
    );
    return Array.from(set).sort() as string[];
  };

  return (
    <div className="flex gap-3 px-7 py-4 bg-white border-b border-gray-200 dark:bg-[#1E1E1E] dark:border-[#333333] flex-wrap items-center">
      <FilterSelect
        label="Trimestre"
        value={filters.trimestre}
        onChange={(v) => onFilterChange('trimestre', v)}
        options={uniqueValues('Trimestre')}
        placeholder="Tous"
      />
      <FilterSelect
        label="Famille d'achats"
        value={filters.famille}
        onChange={(v) => onFilterChange('famille', v)}
        options={uniqueValues("Famille d'achats")}
        placeholder="Toutes"
      />
      <FilterSelectWithSearch
        label="Fournisseur"
        value={filters.fournisseur}
        onChange={(v) => onFilterChange('fournisseur', v)}
        options={uniqueValues('Fournisseur')}
        placeholder="Rechercher un fournisseur..."
      />
      <FilterSelect
        label="Région (CRT)"
        value={filters.region}
        onChange={(v) => onFilterChange('region', v)}
        options={uniqueValues('Description du CRT')}
        placeholder="Toutes"
      />
      <FilterSelect
        label="Statut"
        value={filters.statut}
        onChange={(v) => onFilterChange('statut', v)}
        options={uniqueValues('Signification du statut du document')}
        placeholder="Tous"
      />
      <FilterSelect
        label="Catégorie d'achats"
        value={filters.categorie}
        onChange={(v) => onFilterChange('categorie', v)}
        options={uniqueValues("Catégorie d'achats")}
        placeholder="Toutes"
      />
      <button
        onClick={onReset}
        className="ml-auto px-4 py-1.5 text-sm border border-gray-300 dark:border-[#444444] rounded-lg hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-all self-end flex items-center gap-2 text-gray-700 dark:text-gray-300"
      >
        <X className="w-4 h-4" />
        Réinitialiser
      </button>
    </div>
  );
};

interface FilterSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

const FilterSelect: React.FC<FilterSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder
}) => {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-gray-50 dark:bg-[#252525] border border-gray-300 dark:border-[#444444] text-gray-900 dark:text-gray-100 px-3 py-1.5 rounded-lg text-sm cursor-pointer hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors min-w-[150px] max-w-[220px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
      >
        <option value="">{placeholder}</option>
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
};

interface FilterSelectWithSearchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder: string;
}

const FilterSelectWithSearch: React.FC<FilterSelectWithSearchProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (option: string) => {
    onChange(option);
    setSearchQuery('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setSearchQuery('');
  };

  const displayValue = value || searchQuery;

  return (
    <div className="flex flex-col gap-1 relative" ref={wrapperRef}>
      <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
        {label}
      </label>
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
          <input
            type="text"
            value={displayValue}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
              if (value) onChange(''); // Clear selection when typing
            }}
            onFocus={() => setIsOpen(true)}
            placeholder={placeholder}
            className="bg-gray-50 dark:bg-[#252525] border border-gray-300 dark:border-[#444444] text-gray-900 dark:text-gray-100 pl-9 pr-8 py-1.5 rounded-lg text-sm hover:border-cyan-500 dark:hover:border-cyan-400 transition-colors min-w-[200px] max-w-[280px] focus:outline-none focus:ring-2 focus:ring-cyan-500/50 w-full"
          />
          {(value || searchQuery) && (
            <button
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {isOpen && filteredOptions.length > 0 && (
          <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#444444] rounded-lg shadow-lg">
            {filteredOptions.slice(0, 100).map((opt, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(opt)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-cyan-50 dark:hover:bg-cyan-900/20 transition-colors ${
                  value === opt
                    ? 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-medium'
                    : 'text-gray-900 dark:text-gray-100'
                }`}
              >
                {opt}
              </button>
            ))}
            {filteredOptions.length > 100 && (
              <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 italic border-t border-gray-200 dark:border-[#333333]">
                +{filteredOptions.length - 100} autres résultats...
              </div>
            )}
          </div>
        )}
        
        {isOpen && searchQuery && filteredOptions.length === 0 && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#252525] border border-gray-300 dark:border-[#444444] rounded-lg shadow-lg px-3 py-2 text-sm text-gray-500 dark:text-gray-400 italic">
            Aucun résultat trouvé
          </div>
        )}
      </div>
    </div>
  );
};
