// ============================================
// ACTE D'ENGAGEMENT - WRAPPER MULTI-LOTS
// Gère la navigation et sauvegarde par lot
// Version avec formulaire ATTRI1 complet
// ============================================

import React, { useState, useEffect } from 'react';
import { FileText, Settings } from 'lucide-react';
import { ActeEngagementForm } from './ActeEngagementForm';
import { ActeEngagementEditor } from './ActeEngagementEditor';
import { LotSelector } from '../shared/LotSelector';
import { lotService } from '../../../services/lotService';
import type { ActeEngagementData } from '../types';
import type { ActeEngagementATTRI1Data } from '../types/acteEngagement';
import { createDefaultActeEngagementATTRI1 } from '../types/acteEngagement';

interface Props {
  procedureId: string;
  onSave?: () => void;
}

// Type de formulaire à afficher
type FormType = 'simple' | 'attri1';

// Données par défaut pour un nouveau lot (formulaire simple)
const defaultActeEngagementData: ActeEngagementData = {
  acheteur: {
    nom: '',
    representant: '',
    qualite: '',
    siret: '',
    adresse: '',
    codePostal: '',
    ville: '',
  },
  marche: {
    numero: '',
    objet: '',
    montant: '',
    duree: '',
    dateNotification: '',
  },
  candidat: {
    raisonSociale: '',
    formeJuridique: '',
    representant: '',
    qualite: '',
    siret: '',
    adresse: '',
    codePostal: '',
    ville: '',
  },
  prix: {
    montantHT: '',
    tva: '',
    montantTTC: '',
    delaiPaiement: '',
  },
  conditions: {
    delaiExecution: '',
    garantieFinanciere: false,
    avance: false,
    montantAvance: '',
  },
};

export function ActeEngagementMultiLots({ procedureId, onSave }: Props) {
  const [currentLot, setCurrentLot] = useState(1);
  const [totalLots, setTotalLots] = useState(1);
  const [formData, setFormData] = useState<ActeEngagementData>(defaultActeEngagementData);
  const [formDataATTRI1, setFormDataATTRI1] = useState<ActeEngagementATTRI1Data>(createDefaultActeEngagementATTRI1());
  const [lotLibelle, setLotLibelle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formType, setFormType] = useState<FormType>('attri1'); // Par défaut ATTRI1

  // Charger les données au montage et à chaque changement de lot
  useEffect(() => {
    loadLotData();
  }, [currentLot, procedureId]);

  // Charger le nombre total de lots
  useEffect(() => {
    loadTotalLots();
  }, [procedureId]);

  /**
   * Charge le nombre total de lots pour cette procédure
   */
  const loadTotalLots = async () => {
    try {
      const count = await lotService.countLots(procedureId, 'ae');
      setTotalLots(Math.max(count, 1));
    } catch (err) {
      console.error('Erreur lors du comptage des lots:', err);
    }
  };

  /**
   * Charge les données du lot actuel
   */
  const loadLotData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const lot = await lotService.getLot(procedureId, currentLot, 'ae');
      
      if (lot) {
        // Détecter le type de données stockées
        if (lot.data && lot.data.objet && lot.data.titulaire) {
          // Format ATTRI1
          setFormDataATTRI1(lot.data as ActeEngagementATTRI1Data);
          setFormType('attri1');
        } else if (lot.data && lot.data.acheteur) {
          // Format simple (ancien)
          setFormData(lot.data as ActeEngagementData || defaultActeEngagementData);
          setFormType('simple');
        } else {
          // Nouveau lot - utiliser ATTRI1 par défaut
          setFormDataATTRI1(createDefaultActeEngagementATTRI1());
          setFormType('attri1');
        }
        setLotLibelle(lot.libelle_lot || `Lot ${currentLot}`);
      } else {
        // Lot n'existe pas encore, créer avec données ATTRI1 par défaut
        setFormDataATTRI1(createDefaultActeEngagementATTRI1());
        setFormData(defaultActeEngagementData);
        setFormType('attri1');
        setLotLibelle(`Lot ${currentLot}`);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du lot:', err);
      setError('Impossible de charger les données du lot');
      setFormDataATTRI1(createDefaultActeEngagementATTRI1());
      setFormData(defaultActeEngagementData);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sauvegarde les données du lot actuel
   */
  const handleSaveLot = async (data: ActeEngagementData) => {
    setSaving(true);
    setError(null);
    
    try {
      await lotService.saveLot(
        procedureId,
        currentLot,
        data,
        'ae',
        lotLibelle
      );
      
      // Notifier le parent
      if (onSave) {
        onSave();
      }
      
      // Recharger pour confirmer
      await loadLotData();
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du lot:', err);
      setError('Impossible de sauvegarder le lot');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Sauvegarde les données ATTRI1 du lot actuel
   */
  const handleSaveLotATTRI1 = async (data: ActeEngagementATTRI1Data) => {
    setSaving(true);
    setError(null);
    
    try {
      await lotService.saveLot(
        procedureId,
        currentLot,
        data,
        'ae',
        lotLibelle
      );
      
      // Notifier le parent
      if (onSave) {
        onSave();
      }
      
      // Recharger pour confirmer
      await loadLotData();
      
      alert('✅ Acte d\'engagement sauvegardé avec succès');
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du lot:', err);
      setError('Impossible de sauvegarder le lot');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  /**
   * Crée un nouveau lot
   */
  const handleAddLot = async () => {
    try {
      setLoading(true);
      const newLot = await lotService.createNewLot(procedureId, 'ae');
      await loadTotalLots();
      setCurrentLot(newLot.numero_lot);
    } catch (err) {
      console.error('Erreur lors de la création du lot:', err);
      setError('Impossible de créer un nouveau lot');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Duplique le lot actuel
   */
  const handleDuplicateLot = async () => {
    if (!confirm(`Dupliquer le lot ${currentLot} ?`)) return;
    
    try {
      setLoading(true);
      const nextLotNumber = await lotService.getNextLotNumber(procedureId, 'ae');
      await lotService.duplicateLot(procedureId, currentLot, nextLotNumber, 'ae');
      await loadTotalLots();
      setCurrentLot(nextLotNumber);
    } catch (err) {
      console.error('Erreur lors de la duplication du lot:', err);
      setError('Impossible de dupliquer le lot');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Supprime le lot actuel
   */
  const handleDeleteLot = async () => {
    if (totalLots <= 1) {
      alert('Impossible de supprimer le dernier lot');
      return;
    }

    if (!confirm(`Supprimer définitivement le lot ${currentLot} ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    try {
      setLoading(true);
      await lotService.deleteLot(procedureId, currentLot, 'ae');
      
      // Aller au lot précédent ou suivant
      const newLot = Math.max(1, currentLot - 1);
      await loadTotalLots();
      setCurrentLot(newLot);
    } catch (err) {
      console.error('Erreur lors de la suppression du lot:', err);
      setError('Impossible de supprimer le lot');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change de lot (avec confirmation si modifications non sauvegardées)
   */
  const handleLotChange = (newLot: number) => {
    // TODO: Ajouter détection de changements non sauvegardés
    // if (hasUnsavedChanges) {
    //   if (!confirm('Des modifications non sauvegardées seront perdues. Continuer ?')) return;
    // }
    setCurrentLot(newLot);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Sélecteur de lot */}
      <LotSelector
        procedureId={procedureId}
        totalLots={totalLots}
        currentLot={currentLot}
        onLotChange={handleLotChange}
        onAddLot={handleAddLot}
        onDuplicateLot={handleDuplicateLot}
        onDeleteLot={handleDeleteLot}
        loading={loading}
        disabled={saving}
        lotLibelle={lotLibelle}
      />

      {/* Sélecteur de type de formulaire */}
      <div className="mx-6 mt-4 flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-700">Type de formulaire :</span>
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setFormType('attri1')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                formType === 'attri1' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              ATTRI1 (Complet)
            </button>
            <button
              onClick={() => setFormType('simple')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md transition ${
                formType === 'simple' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
              }`}
            >
              <Settings className="w-4 h-4" />
              Simplifié
            </button>
          </div>
        </div>
        
        {/* Champ éditable pour le libellé du lot */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Libellé :</label>
          <input
            value={lotLibelle}
            onChange={(e) => setLotLibelle(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Ex: Lot 1 - Travaux de plomberie"
          />
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-700 underline"
          >
            Fermer
          </button>
        </div>
      )}

      {/* Formulaire */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du lot {currentLot}...</p>
            </div>
          </div>
        ) : formType === 'attri1' ? (
          <ActeEngagementEditor
            data={formDataATTRI1}
            onSave={handleSaveLotATTRI1}
            isSaving={saving}
            numeroProcedure={procedureId}
            numeroLot={currentLot}
          />
        ) : (
          <div className="h-full overflow-y-auto px-6 py-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                  Acte d'Engagement - Lot {currentLot} (Formulaire simplifié)
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Pour le formulaire officiel ATTRI1 complet, utilisez le mode "ATTRI1 (Complet)"
                </p>
              </div>

              <ActeEngagementForm
                data={formData}
                onSave={handleSaveLot}
                isSaving={saving}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
