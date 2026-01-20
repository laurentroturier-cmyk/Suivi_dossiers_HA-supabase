// ============================================
// ProcedureHeader - En-tête de procédure
// Affiche les informations clés de la procédure
// ============================================

import React from 'react';
import { FileText, Calendar, Euro, Building2, MapPin } from 'lucide-react';
import type { ProjectData } from '../../../types';

interface ProcedureHeaderProps {
  procedure: ProjectData | null;
  className?: string;
}

export function ProcedureHeader({ procedure, className = '' }: ProcedureHeaderProps) {
  if (!procedure) return null;

  const numeroProcedure = String(procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || '');
  const titre = String(procedure['Nom de la procédure'] || 'Sans titre');
  const montantRaw = String(procedure['Montant de la procédure'] || '').replace(/[^0-9.,-]/g, '').replace(',', '.');
  const montant = montantRaw ? Number(montantRaw) : 0;
  const acheteur = String(procedure['Acheteur'] || '');
  const ville = String(procedure['Ville'] || '');
  const codePostal = String(procedure['Code postal'] || '');
  const dateLimite = String(procedure['Date limite de transmission des offres'] || procedure['Date limite de candidature'] || '');

  return (
    <div className={`bg-white border border-gray-200 rounded-lg p-6 ${className}`}>
      {/* Titre principal */}
      <div className="flex items-start gap-4 mb-4">
        <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <span className="font-mono font-semibold text-blue-600 text-lg">
              {numeroProcedure}
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 leading-tight">
            {titre}
          </h2>
        </div>
      </div>

      {/* Informations en grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
        {/* Montant de la procédure */}
        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          <Euro className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Montant de la procédure</p>
            <p className="text-sm font-semibold text-gray-900 truncate">
              {montant ? `${montant.toLocaleString('fr-FR')} € HT` : '0 € HT'}
            </p>
          </div>
        </div>

        {/* Acheteur */}
        {acheteur && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Building2 className="w-5 h-5 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Acheteur</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {acheteur}
              </p>
            </div>
          </div>
        )}

        {/* Localisation */}
        {(ville || codePostal) && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <MapPin className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Localisation</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {codePostal} {ville}
              </p>
            </div>
          </div>
        )}

        {/* Date limite */}
        {dateLimite && (
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Calendar className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Date limite</p>
              <p className="text-sm font-semibold text-gray-900 truncate">
                {dateLimite}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
