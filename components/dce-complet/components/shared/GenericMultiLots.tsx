// ============================================
// WRAPPER GÉNÉRIQUE MULTI-LOTS
// Template réutilisable pour tous les modules DCE
// ============================================

import React, { useState, useEffect, ReactElement } from 'react';
import { Maximize2, List } from 'lucide-react';
import { LotSelector } from '../shared/LotSelector';
import { lotService, ModuleType } from '../../../../services/lotService';
import type { LotConfiguration } from '../../types';

interface GenericMultiLotsProps<T> {
  procedureId: string;
  moduleType: ModuleType;
  moduleName: string;
  defaultData: T;
  FormComponent: React.ComponentType<{
    data: T;
    onSave: (data: T) => Promise<void> | void;
    isSaving?: boolean;
    [key: string]: any; // 🆕 Permettre des props supplémentaires
  }>;
  onSave?: () => void;
  configurationGlobale?: {
    lots: Array<{
      numero: string;
      intitule: string;
      montant: string;
      description?: string;
    }>;
  } | null;
  formComponentProps?: Record<string, any>; // 🆕 Props supplémentaires pour le FormComponent
  lotsFromConfigurationGlobale?: LotConfiguration[]; // 🆕 Lots depuis Configuration Globale
  /** Afficher une vue synthèse (tableau des lots avec accès pleine page) quand plusieurs lots */
  showSummaryViewWhenMultipleLots?: boolean;
}

export function GenericMultiLots<T>({
  procedureId,
  moduleType,
  moduleName,
  defaultData,
  FormComponent,
  onSave,
  configurationGlobale,
  formComponentProps = {},
  lotsFromConfigurationGlobale = [],
  showSummaryViewWhenMultipleLots = false,
}: GenericMultiLotsProps<T>) {
  // 🆕 Utiliser les lots de la Configuration Globale si disponibles
  const hasConfigGlobale = configurationGlobale && configurationGlobale.lots && configurationGlobale.lots.length > 0;
  const configLots = hasConfigGlobale ? configurationGlobale!.lots : [];
  const [currentLot, setCurrentLot] = useState(1);
  const [totalLots, setTotalLots] = useState(1);
  const [formData, setFormData] = useState<T>(defaultData);
  const [lotLibelle, setLotLibelle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Vue synthèse : tableau des lots avec bouton d'accès pleine page (quand plusieurs lots) */
  const [showSummaryView, setShowSummaryView] = useState(true);

  useEffect(() => {
    loadLotData();
  }, [currentLot, procedureId]);

  useEffect(() => {
    // 🆕 Si Configuration Globale disponible, utiliser ses lots
    if (hasConfigGlobale) {
      setTotalLots(configLots.length);
      // Mettre à jour le libellé du lot depuis la config
      const currentConfigLot = configLots.find(l => parseInt(l.numero) === currentLot);
      if (currentConfigLot) {
        setLotLibelle(currentConfigLot.intitule);
      }
    } else {
      loadTotalLots();
    }
  }, [procedureId, configurationGlobale, currentLot]);

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

  /** Liste des lots pour la vue synthèse (config globale ou fallback) */
  const lotsForSummary: Array<{ numero: string; intitule: string; montant: string }> = (() => {
    if (lotsFromConfigurationGlobale.length > 0) {
      return lotsFromConfigurationGlobale.map(l => ({ numero: l.numero, intitule: l.intitule, montant: l.montant || '' }));
    }
    if (configLots.length > 0) {
      return configLots.map(l => ({ numero: l.numero, intitule: l.intitule, montant: l.montant || '' }));
    }
    // Fallback : lots numérotés 1 à totalLots
    return Array.from({ length: totalLots }, (_, i) => ({
      numero: String(i + 1),
      intitule: `Lot ${i + 1}`,
      montant: '',
    }));
  })();

  const showSummaryTable = showSummaryViewWhenMultipleLots && totalLots > 1 && showSummaryView;

  // Bouton de retour vers le hub (annexes financières, pièces administratives, etc.)
  const onBackToHub: (() => void) | undefined = (formComponentProps as any)?.onBackToHub;

  const openLotFullPage = (lotNum: number) => {
    setCurrentLot(lotNum);
    setShowSummaryView(false);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      <LotSelector
        procedureId={procedureId}
        totalLots={totalLots}
        currentLot={currentLot}
        onLotChange={handleLotChange}
        onAddLot={hasConfigGlobale ? undefined : handleAddLot}
        onDuplicateLot={hasConfigGlobale ? undefined : handleDuplicateLot}
        onDeleteLot={hasConfigGlobale ? undefined : handleDeleteLot}
        loading={loading}
        disabled={saving}
        lotLibelle={lotLibelle}
      />
      
      {/* Message d'info si Configuration Globale active */}
      {hasConfigGlobale && (
        <div className="mx-6 mt-2 mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <svg className="w-5 h-5 text-green-700 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <div className="text-sm text-green-800">
            <strong>Configuration Globale active :</strong> Les lots sont gérés depuis l'onglet "⚙️ Configuration Globale".
            Vous travaillez sur <strong>{configLots.length} lot{configLots.length > 1 ? 's' : ''}</strong> configuré{configLots.length > 1 ? 's' : ''}.
          </div>
        </div>
      )}

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
        {/* Vue synthèse : tableau des lots avec accès pleine page */}
        {showSummaryTable ? (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                {moduleName} — Synthèse des lots
              </h2>
              <p className="text-sm text-gray-600">
                {lotsForSummary.length} lot{lotsForSummary.length > 1 ? 's' : ''} — Cliquez sur « Ouvrir » pour accéder au détail d'un lot
              </p>
            </div>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#2F5B58] text-white">
                    <th className="px-4 py-3 font-semibold w-24">N° Lot</th>
                    <th className="px-4 py-3 font-semibold">Nom du lot</th>
                    <th className="px-4 py-3 font-semibold w-36">Montant estimé</th>
                    <th className="px-4 py-3 font-semibold w-40 text-center">Accès</th>
                  </tr>
                </thead>
                <tbody>
                  {lotsForSummary.map((lot, index) => {
                    const lotNum = parseInt(lot.numero, 10) || index + 1;
                    return (
                      <tr
                        key={lot.numero}
                        className="border-b border-gray-200 hover:bg-gray-50 even:bg-gray-50/50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">Lot {lot.numero}</td>
                        <td className="px-4 py-3 text-gray-700">{lot.intitule || `Lot ${lot.numero}`}</td>
                        <td className="px-4 py-3 text-gray-700">{lot.montant ? `${lot.montant} € HT` : '—'}</td>
                        <td className="px-4 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => openLotFullPage(lotNum)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition text-sm font-medium shadow-md"
                            title="Ouvrir ce lot en pleine page"
                          >
                            <Maximize2 className="w-4 h-4" />
                            Ouvrir
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5B58] mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du lot {currentLot}...</p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {onBackToHub && (
                  <button
                    type="button"
                    onClick={onBackToHub}
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 hover:text-emerald-900"
                  >
                    <span className="text-base leading-none">←</span>
                    Retour aux {moduleName === 'BPU' || moduleName === 'BPU TMA' || moduleName === 'DQE' || moduleName === 'DPGF' ? 'annexes financières' : 'pièces administratives & techniques'}
                  </button>
                )}
                {showSummaryViewWhenMultipleLots && totalLots > 1 && (
                  <button
                    type="button"
                    onClick={() => setShowSummaryView(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
                    title="Retour à la synthèse des lots"
                  >
                    <List className="w-4 h-4" />
                    Retour à la synthèse
                  </button>
                )}
                <h2 className="text-xl font-bold text-gray-800">
                  {moduleName} - Lot {currentLot}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Libellé :</label>
                <input
                  value={lotLibelle}
                  onChange={(e) => setLotLibelle(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ex: Lot 1 - Travaux de plomberie"
                />
              </div>
            </div>

            <FormComponent
              data={formData}
              onSave={handleSaveLot}
              isSaving={saving}
              {...formComponentProps}
              totalLots={totalLots}
              currentLot={currentLot}
              onLotChange={handleLotChange}
              lotsConfig={lotsFromConfigurationGlobale}
              procedureInfo={{
                ...formComponentProps.procedureInfo,
                numeroLot: (() => {
                  // Priorité 1: Lot depuis Configuration Globale (source unique)
                  const lotFromConfig = lotsFromConfigurationGlobale.find(l => l.numero === currentLot.toString());
                  if (lotFromConfig) return lotFromConfig.numero;
                  
                  // Priorité 2: Lot depuis la Configuration Globale (ancien système)
                  const currentConfigLot = configLots.find(l => parseInt(l.numero) === currentLot);
                  if (currentConfigLot) return currentConfigLot.numero;
                  
                  // Fallback: Numéro actuel
                  return currentLot.toString();
                })(),
                libelleLot: (() => {
                  // Priorité 1: Lot depuis Configuration Globale (source unique)
                  const lotFromConfig = lotsFromConfigurationGlobale.find(l => l.numero === currentLot.toString());
                  if (lotFromConfig) return lotFromConfig.intitule;
                  
                  // Priorité 2: Lot depuis la Configuration Globale (ancien système)
                  const currentConfigLot = configLots.find(l => parseInt(l.numero) === currentLot);
                  if (currentConfigLot) return currentConfigLot.intitule;
                  
                  // Fallback: Libellé saisi manuellement
                  return lotLibelle;
                })(),
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
