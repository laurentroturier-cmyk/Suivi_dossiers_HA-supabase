// ============================================
// ProjectDetailsModal - Fenêtre modale avec détails du projet/dossier
// Affiche toutes les informations réelles du projet dans des onglets,
// avec la même interface visuelle que ProcedureDetailsModal
// ============================================

import React, { useState } from 'react';
import { X, FileText, Calendar, Settings, BarChart3 } from 'lucide-react';
import type { DossierData } from '../../../types';

interface ProjectDetailsModalProps {
  project: DossierData | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'general' | 'projet' | 'dates' | 'performance';

export function ProjectDetailsModal({ project, isOpen, onClose }: ProjectDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!isOpen || !project) return null;

  const tabs = [
    { key: 'general' as TabType, label: 'Informations générales', icon: FileText },
    { key: 'projet' as TabType, label: 'Projet & stratégie', icon: Settings },
    { key: 'dates' as TabType, label: 'Dates & validations', icon: Calendar },
    { key: 'performance' as TabType, label: 'Performance & NO', icon: BarChart3 },
  ];

  // Organiser les champs par catégorie
  const categorizeFields = () => {
    const general = [
      { label: 'ID Projet', value: project.IDProjet },
      { label: 'Titre du dossier', value: project.Titre_du_dossier },
      { label: 'Acheteur', value: project.Acheteur },
      { label: 'Type de procédure', value: project['Type de procédure'] },
      { label: 'Prescripteur', value: project.Prescripteur },
      { label: 'Client interne', value: project.Client_Interne },
      { label: 'Statut du dossier', value: project.Statut_du_Dossier },
      { label: 'Programme', value: project.Programme },
      { label: 'Opération', value: project.Operation },
      { label: 'Priorité', value: project.Priorite },
      { label: 'Numéro de procédure (rattachement)', value: project.NumProc },
      { label: 'Ancien ID Consultation', value: project.Old_ID_Consult },
      { label: 'Ancien ID Projet', value: project.Old_ID_Projet },
      { label: 'Codes CPV DAE', value: project.CodesCPVDAE },
    ];

    const projet = [
      { label: 'Levier Achat', value: project.Levier_Achat },
      { label: 'Renouvellement de marché', value: project.Renouvellement_de_marche },
      { label: 'Commission Achat', value: project.Commission_Achat },
      { label: 'Projet ouvert à l’acquisition de solutions innovantes', value: project["Projet_ouvert_à_l'acquisition_de_solutions_innovantes"] },
      { label: 'Projet facilitant l’accès aux TPE/PME', value: project["Projet_facilitant_l'accès_aux_TPE/PME"] },
    ];

    const dates = [
      { label: 'Date de lancement de la consultation', value: project.Date_de_lancement_de_la_consultation },
      { label: 'Date de déploiement prévisionnelle du marché', value: project.Date_de_deploiement_previsionnelle_du_marche },
      { label: 'NO - Date validation MSA', value: project['NO_-_Date_validation_MSA'] },
      { label: 'NO - Date prévisionnelle CA ou Commission', value: project['NO_-_Date_previsionnelle_CA_ou_Commission'] },
      { label: 'NO - Date validation CODIR', value: project['NO_-_Date_validation_CODIR'] },
      { label: 'NO - Date envoi signature électronique', value: project['NO_-_Date_envoi_signature_electronique'] },
      { label: 'NO - Date de validation du document', value: project['NO_-_Date_de_validation_du_document'] },
    ];

    const performance = [
      { label: 'Perf achat prévisionnelle (en %)', value: project['Perf_achat_previsionnelle_(en_%)'] },
      { label: 'Montant prévisionnel du marché (HT)', value: project['Montant_previsionnel_du_marche_(_HT)_'] },
      { label: 'Origine du montant pour le calcul de l’économie', value: project["Origine_du_montant_pour_le_calcul_de_l'economie"] },
      { label: 'Sur 12 mois - Économie achat prévisionnelle (€)', value: project['Sur_12_mois_economie_achat_previsionnelle_(€)'] },
      { label: 'NO - Type de validation', value: project['NO_-_Type_de_validation'] },
      { label: 'NO - MSA', value: project['NO_-_MSA'] },
      { label: 'Nom des valideurs', value: project.Nom_des_valideurs },
      { label: 'NO - Statut', value: project['NO_-_Statut'] },
      { label: 'NO - Commentaire', value: project['NO_-_Commentaire'] },
    ];

    return { general, projet, dates, performance };
  };

  const categories = categorizeFields();

  const renderFields = (fields: Array<{ label: string; value: any }>) => {
    return (
      <div className="space-y-3">
        {fields.map((field, idx) => {
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
      case 'projet':
        return renderFields(categories.projet);
      case 'dates':
        return renderFields(categories.dates);
      case 'performance':
        return renderFields(categories.performance);
      default:
        return null;
    }
  };

  const titre =
    project.Titre_du_dossier ||
    `Projet ${project.IDProjet || ''}`;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* En-tête */}
        <div className="bg-[#2F5B58] text-white p-6 flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <span className="font-mono font-bold text-lg">
                {project.IDProjet || 'Projet'}
              </span>
            </div>
            <h2 className="text-base font-semibold opacity-95">
              {titre}
            </h2>
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

