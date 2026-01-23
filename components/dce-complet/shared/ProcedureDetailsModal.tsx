// ============================================
// ProcedureDetailsModal - Fenêtre modale avec détails de la procédure
// Affiche toutes les informations réelles de la procédure dans des onglets
// ============================================

import React, { useState } from 'react';
import { X, FileText, Calendar, Settings, BarChart3 } from 'lucide-react';
import type { ProjectData } from '../../../types';

interface ProcedureDetailsModalProps {
  procedure: ProjectData | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'marche' | 'dates' | 'performance';

export function ProcedureDetailsModal({ procedure, isOpen, onClose }: ProcedureDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen || !procedure) return null;

  const tabs = [
    { key: 'general' as TabType, label: 'Informations générales', icon: FileText },
    { key: 'marche' as TabType, label: 'Marché et procédure', icon: Settings },
    { key: 'dates' as TabType, label: 'Dates', icon: Calendar },
    { key: 'performance' as TabType, label: 'Performance et RP', icon: BarChart3 },
  ];

  // Organiser les champs par catégorie
  const categorizeFields = () => {
    const general = [
      { label: 'ID Projet', value: procedure['IDProjet'] },
      { label: 'N° de procédure (Afpa)', value: procedure['Numéro de procédure (Afpa)'] },
      { label: 'Nom de la procédure', value: procedure['Nom de la procédure'] },
      { label: 'Objet court', value: procedure['Objet court'] },
      { label: 'Acheteur', value: procedure['Acheteur'] },
      { label: 'Famille Achat Principale', value: procedure['Famille Achat Principale'] },
      { label: 'Code CPV Principal', value: procedure['Code CPV Principal'] },
      { label: 'Montant de la procédure', value: procedure['Montant de la procédure'] },
      { label: 'Statut de la consultation', value: procedure['Statut de la consultation'] },
      { label: 'Finalité de la consultation', value: procedure['Finalité de la consultation'] },
    ];

    const marche = [
      { label: 'Type de procédure', value: procedure['Type de procédure'] },
      { label: 'Forme du marché', value: procedure['Forme du marché'] },
      { label: 'CCAG', value: procedure['CCAG'] },
      { label: 'Nombre de lots', value: procedure['Nombre de lots'] },
      { label: 'Lots réservés', value: procedure['Lots réservés'] },
      { label: 'Durée du marché (en mois)', value: procedure['Durée du marché (en mois)'] },
      { label: 'Durée de validité des offres (en jours)', value: procedure['Durée de validité des offres (en jours)'] },
      { label: 'Support de procédure', value: procedure['Support de procédure'] },
      { label: 'Référence procédure (plateforme)', value: procedure['Référence procédure (plateforme)'] },
      { label: 'Motivation non allotissement', value: procedure['Motivation non allotissement'] },
      { label: 'Nombre de retraits', value: procedure['Nombre de retraits'] },
      { label: 'Nombre de soumissionnaires', value: procedure['Nombre de soumissionnaires'] },
      { label: 'Nombre de questions', value: procedure['Nombre de questions'] },
      { label: 'Dispo sociales', value: procedure['Dispo sociales'] },
      { label: 'Dispo environnementales', value: procedure['Dispo environnementales'] },
      { label: 'Projet ouvert à l\'acquisition de solutions innovantes', value: procedure['Projet ouvert à l\'acquisition de solutions innovantes'] },
      { label: 'Projet facilitant l\'accès aux TPE/PME', value: procedure['Projet facilitant l\'accès aux TPE/PME'] },
    ];

    const dates = [
      { label: 'Date d\'écriture du DCE', value: procedure['Date d\'écriture du DCE'] },
      { label: 'Date de lancement de la consultation', value: procedure['date_de_lancement_de_la_consultation'] },
      { label: 'Date limite étude stratégie avec client interne', value: procedure['Date limite étude stratégie avec client interne'] },
      { label: 'Durée de publication', value: procedure['Durée de publication'] },
      { label: 'Date de remise des candidatures', value: procedure['Date de remise des candidatures'] },
      { label: 'Date de remise des offres', value: procedure['Date de remise des offres'] },
      { label: 'Date de remise des offres finales', value: procedure['Date de remise des offres finales'] },
      { label: 'Date d\'ouverture des offres', value: procedure['Date d\'ouverture des offres'] },
      { label: 'Date de validité des offres (calculée)', value: procedure['Date de validité des offres (calculée)'] },
      { label: 'Date des Rejets', value: procedure['Date des Rejets'] },
      { label: 'Date de Notification', value: procedure['Date de Notification'] },
      { label: 'Date d\'échéance du marché', value: procedure['Date d\'échéance du marché'] },
      { label: 'Date de déploiement prévisionnelle du marché', value: procedure['Date_de_deploiement_previsionnelle_du_marche'] },
      { label: 'Avis d\'attribution', value: procedure['Avis d\'attribution'] },
      { label: 'Données essentielles', value: procedure['Données essentielles'] },
    ];

    const performance = [
      { label: 'Délai de traitement (calcul)', value: procedure['Délai de traitement (calcul)'] },
      { label: 'Perf achat prévisionnelle (en %)', value: procedure['Perf_achat_previsionnelle_(en_%)'] },
      { label: 'Origine du montant pour le calcul de l\'économie', value: procedure['Origine_du_montant_pour_le_calcul_de_l\'economie'] },
      { label: 'RP - Statut', value: procedure['RP - Statut'] },
      { label: 'RP - Date validation MSA', value: procedure['RP - Date validation MSA'] },
      { label: 'RP - Date validation CODIR', value: procedure['RP -  Date validation CODIR'] },
      { label: 'RP - Date envoi signature élec', value: procedure['RP - Date envoi signature élec'] },
      { label: 'RP - Date de validation du document', value: procedure['RP - Date de validation du document'] },
      { label: 'RP - Commentaire', value: procedure['RP - Commentaire'] },
      { label: 'Commission HA', value: procedure['Commission_HA'] ? 'Oui' : 'Non' },
      { label: 'Archivage (Statut)', value: procedure['Archivage (Statut)'] },
    ];

    return { general, marche, dates, performance };
  };

  const categories = categorizeFields();

  const renderFields = (fields: Array<{ label: string; value: any }>) => {
    return (
      <div className="space-y-3">
        {fields.map((field, idx) => {
          // Formater la valeur pour l'affichage
          let displayValue = field.value;

          if (displayValue === undefined || displayValue === null || displayValue === '') {
            displayValue = '-';
          } else if (typeof displayValue === 'boolean') {
            displayValue = displayValue ? 'Oui' : 'Non';
          } else {
            displayValue = String(displayValue);
          }

          return (
            <InfoField
              key={idx}
              label={field.label}
              value={displayValue}
              isEmpty={displayValue === '-'}
            />
          );
        })}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return renderFields(categories.general);
      case 'marche':
        return renderFields(categories.marche);
      case 'dates':
        return renderFields(categories.dates);
      case 'performance':
        return renderFields(categories.performance);
      default:
        return null;
    }
  };

  const numeroProcedure = procedure['Numéro de procédure (Afpa)'] || procedure['NumProc'] || 'N/A';
  const titre = procedure['Nom de la procédure'] || 'Sans titre';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="bg-[#2F5B58] text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono font-bold text-lg">{numeroProcedure}</span>
            </div>
            <h2 className="text-base font-semibold opacity-95">{titre}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Onglets */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'bg-white text-[#2F5B58] border-b-2 border-[#2F5B58]'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher un champ d'information
function InfoField({ label, value, isEmpty }: { label: string; value: string; isEmpty?: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-4 py-2 border-b border-gray-100 last:border-b-0">
      <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide col-span-1">
        {label}
      </label>
      <p className={`text-sm col-span-2 break-words ${isEmpty ? 'text-gray-400 italic' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
