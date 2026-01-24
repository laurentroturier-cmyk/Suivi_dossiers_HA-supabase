// ============================================
// CONFIGURATION GLOBALE - Variables communes du DCE
// Onglet de saisie préalable des informations réutilisées dans tous les modules
// ============================================

import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle, 
  Package,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  FileText,
  Settings
} from 'lucide-react';
import type { ConfigurationGlobale, LotConfiguration } from '../types';
import type { ProjectData } from '../../../types';

interface ConfigurationGlobaleProps {
  data: ConfigurationGlobale | null;
  onChange: (data: ConfigurationGlobale) => void;
  procedure?: ProjectData | null;
}

export function ConfigurationGlobaleForm({ 
  data, 
  onChange, 
  procedure 
}: ConfigurationGlobaleProps) {
  
  const [config, setConfig] = useState<ConfigurationGlobale>(
    data || {
      informationsGenerales: {
        acheteur: procedure?.Acheteur || '',
        titreMarche: procedure?.['Objet court'] || '',
        typeProcedure: procedure?.['Type de procédure'] || '',
        dureeMarche: procedure?.['Durée du marché (en mois)'] || '',
        dateRemiseOffres: procedure?.['Date de remise des offres'] || '',
      },
      lots: [],
      variablesCommunes: {
        ccagApplicable: procedure?.CCAG || '',
        delaiPaiement: '30',
        delaiExecution: '',
        garantieFinanciere: false,
        avance: false,
        montantAvance: '',
      },
      contacts: {
        responsableProcedure: '',
        emailContact: '',
        telephoneContact: '',
      }
    }
  );

  const [hasChanges, setHasChanges] = useState(false);

  // Initialiser les lots depuis la procédure
  useEffect(() => {
    if (procedure && (!data || data.lots.length === 0)) {
      const nombreLots = parseInt(procedure['Nombre de lots'] || '1');
      if (nombreLots > 0) {
        const lotsInitiaux: LotConfiguration[] = Array.from(
          { length: nombreLots }, 
          (_, i) => ({
            numero: String(i + 1),
            intitule: `Lot ${i + 1}`,
            montant: '',
            description: '',
          })
        );
        
        setConfig(prev => ({
          ...prev,
          lots: lotsInitiaux
        }));
        setHasChanges(true);
      }
    }
  }, [procedure, data]);

  // Notifier les changements au parent
  useEffect(() => {
    if (hasChanges) {
      onChange(config);
      setHasChanges(false);
    }
  }, [hasChanges, config, onChange]);

  const handleInfoGeneraleChange = (field: keyof ConfigurationGlobale['informationsGenerales'], value: string) => {
    setConfig(prev => ({
      ...prev,
      informationsGenerales: {
        ...prev.informationsGenerales,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleVariableCommuneChange = (field: keyof ConfigurationGlobale['variablesCommunes'], value: any) => {
    setConfig(prev => ({
      ...prev,
      variablesCommunes: {
        ...prev.variablesCommunes,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleContactChange = (field: keyof ConfigurationGlobale['contacts'], value: string) => {
    setConfig(prev => ({
      ...prev,
      contacts: {
        ...prev.contacts,
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleLotChange = (index: number, field: keyof LotConfiguration, value: string) => {
    const newLots = [...config.lots];
    newLots[index] = {
      ...newLots[index],
      [field]: value
    };
    setConfig(prev => ({
      ...prev,
      lots: newLots
    }));
    setHasChanges(true);
  };

  const addLot = () => {
    const newLot: LotConfiguration = {
      numero: String(config.lots.length + 1),
      intitule: `Lot ${config.lots.length + 1}`,
      montant: '',
      description: '',
    };
    setConfig(prev => ({
      ...prev,
      lots: [...prev.lots, newLot]
    }));
    setHasChanges(true);
  };

  const removeLot = (index: number) => {
    if (config.lots.length <= 1) {
      alert('Vous devez conserver au moins un lot');
      return;
    }
    const newLots = config.lots.filter((_, i) => i !== index);
    // Renuméroter les lots
    newLots.forEach((lot, i) => {
      lot.numero = String(i + 1);
    });
    setConfig(prev => ({
      ...prev,
      lots: newLots
    }));
    setHasChanges(true);
  };

  const totalMontant = config.lots.reduce((sum, lot) => {
    const montant = parseFloat(lot.montant.replace(/\s/g, '').replace(',', '.')) || 0;
    return sum + montant;
  }, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Configuration Globale</h1>
        </div>
        <p className="text-gray-600">
          Définissez ici les variables communes qui seront automatiquement propagées à tous les documents du DCE.
          Cela vous évite de ressaisir les mêmes informations dans chaque module.
        </p>
        
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <strong>Important :</strong> Les informations saisies ici seront automatiquement reprises dans :
            <ul className="list-disc ml-5 mt-2">
              <li>Règlement de consultation</li>
              <li>Acte d'engagement</li>
              <li>CCAP, CCTP</li>
              <li>BPU, DQE, DPGF (structure des lots)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* 1. INFORMATIONS GÉNÉRALES */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Informations Générales</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Acheteur
              </label>
              <input
                type="text"
                value={config.informationsGenerales.acheteur}
                onChange={(e) => handleInfoGeneraleChange('acheteur', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Afpa"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre du marché
              </label>
              <input
                type="text"
                value={config.informationsGenerales.titreMarche}
                onChange={(e) => handleInfoGeneraleChange('titreMarche', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Travaux de rénovation..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type de procédure
              </label>
              <input
                type="text"
                value={config.informationsGenerales.typeProcedure}
                onChange={(e) => handleInfoGeneraleChange('typeProcedure', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Appel d'offres ouvert"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Durée du marché (mois)
              </label>
              <input
                type="text"
                value={config.informationsGenerales.dureeMarche}
                onChange={(e) => handleInfoGeneraleChange('dureeMarche', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 12"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de remise des offres
              </label>
              <input
                type="date"
                value={config.informationsGenerales.dateRemiseOffres}
                onChange={(e) => handleInfoGeneraleChange('dateRemiseOffres', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 2. CONFIGURATION DES LOTS */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Configuration des lots</h2>
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                {config.lots.length} lot{config.lots.length > 1 ? 's' : ''}
              </span>
            </div>
            <button
              onClick={addLot}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Ajouter un lot
            </button>
          </div>

          {config.lots.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Aucun lot configuré. Cliquez sur "Ajouter un lot" pour commencer.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {config.lots.map((lot, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 font-semibold rounded-full text-sm">
                        {lot.numero}
                      </span>
                      <span className="font-medium text-gray-700">Lot {lot.numero}</span>
                    </div>
                    {config.lots.length > 1 && (
                      <button
                        onClick={() => removeLot(index)}
                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition-colors"
                        title="Supprimer ce lot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Intitulé du lot
                      </label>
                      <input
                        type="text"
                        value={lot.intitule}
                        onChange={(e) => handleLotChange(index, 'intitule', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Ex: Travaux de gros œuvre"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Montant estimatif (€ HT)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={lot.montant}
                          onChange={(e) => handleLotChange(index, 'montant', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Ex: 50000"
                        />
                        <DollarSign className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description courte
                      </label>
                      <input
                        type="text"
                        value={lot.description || ''}
                        onChange={(e) => handleLotChange(index, 'description', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Optionnel"
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Total */}
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-700">Total estimatif (tous lots)</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {totalMontant.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € HT
                  </span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. VARIABLES COMMUNES */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Variables Communes</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CCAG applicable
              </label>
              <input
                type="text"
                value={config.variablesCommunes.ccagApplicable}
                onChange={(e) => handleVariableCommuneChange('ccagApplicable', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: CCAG-Travaux"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai de paiement (jours)
              </label>
              <input
                type="text"
                value={config.variablesCommunes.delaiPaiement}
                onChange={(e) => handleVariableCommuneChange('delaiPaiement', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Délai d'exécution
              </label>
              <input
                type="text"
                value={config.variablesCommunes.delaiExecution}
                onChange={(e) => handleVariableCommuneChange('delaiExecution', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 6 mois"
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.variablesCommunes.garantieFinanciere}
                  onChange={(e) => handleVariableCommuneChange('garantieFinanciere', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Garantie financière</span>
              </label>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.variablesCommunes.avance}
                  onChange={(e) => handleVariableCommuneChange('avance', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Avance</span>
              </label>
            </div>

            {config.variablesCommunes.avance && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant de l'avance (%)
                </label>
                <input
                  type="text"
                  value={config.variablesCommunes.montantAvance || ''}
                  onChange={(e) => handleVariableCommuneChange('montantAvance', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 5"
                />
              </div>
            )}
          </div>
        </section>

        {/* 4. CONTACTS */}
        <section className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-gray-700" />
            <h2 className="text-xl font-semibold text-gray-900">Contacts</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responsable de la procédure
              </label>
              <input
                type="text"
                value={config.contacts.responsableProcedure}
                onChange={(e) => handleContactChange('responsableProcedure', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: Jean Dupont"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email de contact
              </label>
              <input
                type="email"
                value={config.contacts.emailContact}
                onChange={(e) => handleContactChange('emailContact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: jean.dupont@afpa.fr"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone de contact
              </label>
              <input
                type="tel"
                value={config.contacts.telephoneContact}
                onChange={(e) => handleContactChange('telephoneContact', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ex: 01 23 45 67 89"
              />
            </div>
          </div>
        </section>
      </div>

      {/* Message de confirmation */}
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
        <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
        <div className="text-sm text-green-800">
          Les modifications sont enregistrées automatiquement et seront propagées aux autres modules du DCE.
        </div>
      </div>
    </div>
  );
}
