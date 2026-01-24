// ============================================
// ProcedureSelector - Sélecteur de procédure
// Interface de recherche et sélection de procédure
// ============================================

import React, { useState, useEffect, useRef } from 'react';
import { Search, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useProcedureLoader } from '../hooks/useProcedureLoader';
import type { ProjectData } from '../../../types';

interface ProcedureSelectorProps {
  value: string;
  onChange: (numeroProcedure: string) => void;
  onProcedureSelected?: (procedure: ProjectData) => void;
  disabled?: boolean;
  className?: string;
}

export function ProcedureSelector({
  value,
  onChange,
  onProcedureSelected,
  disabled = false,
  className = '',
}: ProcedureSelectorProps) {
  const {
    allProcedures,
    isLoadingAll,
    errorAll,
    searchByNumero,
    suggestProcedures,
    loadAllProcedures,
  } = useProcedureLoader({ autoLoad: true });

  const [inputValue, setInputValue] = useState(value);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [validationState, setValidationState] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [validationMessage, setValidationMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Suggestions filtrées
  const suggestions = suggestProcedures(inputValue, 10);

  /**
   * Validation du numéro saisi
   */
  useEffect(() => {
    if (!inputValue) {
      setValidationState('idle');
      setValidationMessage('');
      return;
    }

    // Validation format (5 chiffres)
    if (inputValue.length < 5) {
      setValidationState('idle');
      setValidationMessage('');
      return;
    }

    if (inputValue.length === 5 && /^\d{5}$/.test(inputValue)) {
      const result = searchByNumero(inputValue);
      
      if (result.isValid && result.procedure) {
        setValidationState('valid');
        setValidationMessage(`✓ ${result.procedure['Intitulé']}`);
        onProcedureSelected?.(result.procedure);
      } else {
        setValidationState('invalid');
        setValidationMessage(result.error || 'Procédure non trouvée');
      }
    } else {
      setValidationState('invalid');
      setValidationMessage('Format invalide (5 chiffres)');
    }
  }, [inputValue, searchByNumero, allProcedures, onProcedureSelected]);

  /**
   * Gestion des clics extérieurs (ferme les suggestions)
   */
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Changement du champ input
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);
    
    // Afficher suggestions si > 2 caractères
    setShowSuggestions(newValue.length >= 2);
  };

  /**
   * Sélection d'une suggestion
   */
  const handleSelectSuggestion = (procedure: ProjectData) => {
    const numProc = String(procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || '').substring(0, 5);
    setInputValue(numProc);
    onChange(numProc);
    setShowSuggestions(false);
    onProcedureSelected?.(procedure);
  };

  /**
   * Icône de validation
   */
  const ValidationIcon = () => {
    if (isLoadingAll) return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    if (validationState === 'valid') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (validationState === 'invalid') return <AlertCircle className="w-5 h-5 text-red-500" />;
    return <Search className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input principal */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(inputValue.length >= 2)}
          disabled={disabled || isLoadingAll}
          placeholder="Ex: 20241"
          maxLength={5}
          className={`
            w-full px-4 py-3 pr-12 
            border-2 rounded-lg
            font-mono text-lg
            transition-all duration-200
            ${validationState === 'valid' ? 'border-green-500 bg-green-50' : ''}
            ${validationState === 'invalid' ? 'border-red-500 bg-red-50' : ''}
            ${validationState === 'idle' ? 'border-gray-300 focus:border-green-500' : ''}
            disabled:bg-gray-100 disabled:cursor-not-allowed
            focus:outline-none focus:ring-2 focus:ring-green-200
          `}
        />
        
        {/* Icône de validation */}
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
          <ValidationIcon />
        </div>
      </div>

      {/* Message de validation */}
      {validationMessage && (
        <p className={`
          mt-2 text-sm px-2
          ${validationState === 'valid' ? 'text-green-700' : ''}
          ${validationState === 'invalid' ? 'text-red-700' : ''}
        `}>
          {validationMessage}
        </p>
      )}

      {/* Erreur de chargement */}
      {errorAll && (
        <div className="mt-2 p-3 bg-red-100 border border-red-300 rounded-lg">
          <p className="text-sm text-red-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {errorAll}
          </p>
          <button
            onClick={loadAllProcedures}
            className="mt-2 text-xs text-red-600 underline hover:text-red-800"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Liste de suggestions (autocomplete) */}
      {showSuggestions && suggestions.length > 0 && !disabled && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white border-2 border-gray-200 rounded-lg shadow-xl"
        >
          {suggestions.map((proc, index) => {
            const numProc = String(proc['Numéro de procédure (Afpa)'] || proc['NumProc'] || '');
            const titre = String(proc['Nom de la procédure'] || 'Sans titre');
            const montantRaw = String(proc['Montant de la procédure'] || '').replace(/[^0-9.,-]/g, '').replace(',', '.');
            const montant = montantRaw ? Number(montantRaw) : 0;
            
            return (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(proc)}
                className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-green-700 text-sm">
                      {numProc}
                    </p>
                    <p className="text-sm text-gray-800 truncate mt-1">
                      {titre}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-gray-500 font-semibold">
                      {montant.toLocaleString('fr-FR')} € HT
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Message "Aucune suggestion" */}
      {showSuggestions && suggestions.length === 0 && inputValue.length >= 2 && !isLoadingAll && (
        <div className="absolute z-50 mt-2 w-full p-4 bg-white border-2 border-gray-200 rounded-lg shadow-xl text-center text-gray-500">
          <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucune procédure trouvée</p>
        </div>
      )}
    </div>
  );
}
