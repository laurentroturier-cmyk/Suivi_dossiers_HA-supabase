// ============================================
// ProcedureHeader - En-tête de procédure
// Affiche les informations clés de la procédure
// ============================================

import React, { useState } from 'react';
import { FileText, Calendar, Euro, Building2, MapPin, Eye } from 'lucide-react';
import type { ProjectData } from '../../../types';
import { ProcedureDetailsModal } from './ProcedureDetailsModal';

interface ProcedureHeaderProps {
  procedure: ProjectData | null;
  className?: string;
}

export function ProcedureHeader({ procedure, className = '' }: ProcedureHeaderProps) {
  const [showModal, setShowModal] = useState(false);

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
    <div className={`bg-white border border-gray-200 rounded-lg p-3 ${className}`}>
      {/* Titre principal + bouton Visualiser */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-[#2F5B58]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold text-green-700 text-sm">
                {numeroProcedure}
              </span>
            </div>
            <h2 className="text-base font-semibold text-gray-900 leading-tight">
              {titre}
            </h2>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 px-3 py-1.5 bg-gradient-to-b from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-md"
          title="Visualiser les détails de la procédure"
        >
          <Eye className="w-3.5 h-3.5" />
          Visualiser
        </button>
      </div>

      {/* Informations en grille */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-2">
        {/* Montant de la procédure */}
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
          <Euro className="w-4 h-4 text-green-600 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 font-medium">Montant de la procédure</p>
            <p className="text-xs font-semibold text-gray-900 truncate">
              {montant ? `${montant.toLocaleString('fr-FR')} € HT` : '0 € HT'}
            </p>
          </div>
        </div>

        {/* Acheteur */}
        {acheteur && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Building2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Acheteur</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {acheteur}
              </p>
            </div>
          </div>
        )}

        {/* Localisation */}
        {(ville || codePostal) && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <MapPin className="w-4 h-4 text-red-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Localisation</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {codePostal} {ville}
              </p>
            </div>
          </div>
        )}

        {/* Date limite */}
        {dateLimite && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Calendar className="w-4 h-4 text-orange-600 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium">Date limite</p>
              <p className="text-xs font-semibold text-gray-900 truncate">
                {dateLimite}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de détails */}
      <ProcedureDetailsModal
        procedure={procedure}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
