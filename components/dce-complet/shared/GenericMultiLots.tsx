// ============================================
// WRAPPER GÉNÉRIQUE MULTI-LOTS
// Template réutilisable pour tous les modules DCE
// ============================================

import React, { useState, useEffect, ReactElement } from 'react';
import { LotSelector } from '../shared/LotSelector';
import { lotService, ModuleType } from '../../../services/lotService';

interface GenericMultiLotsProps<T> {
  procedureId: string;
  moduleType: ModuleType;
  moduleName: string;
  defaultData: T;
  FormComponent: React.ComponentType<{
    data: T;
    onSave: (data: T) => Promise<void> | void;
    isSaving?: boolean;
  }>;
  onSave?: () => void;
}

export function GenericMultiLots<T>({
  procedureId,
  moduleType,
  moduleName,
  defaultData,
  FormComponent,
  onSave,
}: GenericMultiLotsProps<T>) {
  const [currentLot, setCurrentLot] = useState(1);
  const [totalLots, setTotalLots] = useState(1);
  const [formData, setFormData] = useState<T>(defaultData);
  const [lotLibelle, setLotLibelle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLotData();
  }, [currentLot, procedureId]);

  useEffect(() => {
    loadTotalLots();
  }, [procedureId]);

  const loadTotalLots = async () => {
    try {
      const count = await lotService.countLots(procedureId, moduleType);
      setTotalLots(Math.max(count, 1));
    } catch (err) {
      console.error('Erreur lors du comptage des lots:', err);
    }
  };

  const loadLotData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const lot = await lotService.getLot(procedureId, currentLot, moduleType);
      
      if (lot) {
        setFormData(lot.data || defaultData);
        setLotLibelle(lot.libelle_lot || `Lot ${currentLot}`);
      } else {
        setFormData(defaultData);
        setLotLibelle(`Lot ${currentLot}`);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du lot:', err);
      setError('Impossible de charger les données du lot');
      setFormData(defaultData);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLot = async (data: T) => {
    setSaving(true);
    setError(null);
    
    try {
      await lotService.saveLot(
        procedureId,
        currentLot,
        data,
        moduleType,
        lotLibelle
      );
      
      if (onSave) {
        onSave();
      }
      
      await loadLotData();
      
    } catch (err) {
      console.error('Erreur lors de la sauvegarde du lot:', err);
      setError('Impossible de sauvegarder le lot');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handleAddLot = async () => {
    try {
      setLoading(true);
      const newLot = await lotService.createNewLot(procedureId, moduleType);
      await loadTotalLots();
      setCurrentLot(newLot.numero_lot);
    } catch (err) {
      console.error('Erreur lors de la création du lot:', err);
      setError('Impossible de créer un nouveau lot');
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicateLot = async () => {
    if (!confirm(`Dupliquer le lot ${currentLot} ?`)) return;
    
    try {
      setLoading(true);
      const nextLotNumber = await lotService.getNextLotNumber(procedureId, moduleType);
      await lotService.duplicateLot(procedureId, currentLot, nextLotNumber, moduleType);
      await loadTotalLots();
      setCurrentLot(nextLotNumber);
    } catch (err) {
      console.error('Erreur lors de la duplication du lot:', err);
      setError('Impossible de dupliquer le lot');
    } finally {
      setLoading(false);
    }
  };

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
      await lotService.deleteLot(procedureId, currentLot, moduleType);
      
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

  const handleLotChange = (newLot: number) => {
    setCurrentLot(newLot);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
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

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du lot {currentLot}...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {moduleName} - Lot {currentLot}
              </h2>
              
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Libellé :</label>
                <input
                  value={lotLibelle}
                  onChange={(e) => setLotLibelle(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: Lot 1 - Travaux de plomberie"
                />
              </div>
            </div>

            <FormComponent
              data={formData}
              onSave={handleSaveLot}
              isSaving={saving}
            />
          </div>
        )}
      </div>
    </div>
  );
}
