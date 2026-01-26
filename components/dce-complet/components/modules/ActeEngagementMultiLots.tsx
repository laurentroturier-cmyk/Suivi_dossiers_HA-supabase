// ============================================
// ACTE D'ENGAGEMENT - WRAPPER MULTI-LOTS
// Gère la navigation et sauvegarde par lot
// Version avec formulaire ATTRI1 complet
// ============================================

import React, { useState, useEffect } from 'react';
import { Info, PackageOpen } from 'lucide-react';
import JSZip from 'jszip';
import { ActeEngagementEditor } from './ActeEngagementEditor';
import { LotSelector } from '../shared/LotSelector';
import { lotService } from '../../../../services/lotService';
import type { ActeEngagementATTRI1Data } from '../../types/acteEngagement';
import { createDefaultActeEngagementATTRI1 } from '../../types/acteEngagement';
import type { RapportCommissionData } from '../../../redaction/types/rapportCommission';
import type { ConfigurationGlobale } from '../../types';
import { generateActeEngagementWord } from '../../utils/acteEngagementGenerator';

interface Props {
  procedureId: string;
  onSave?: () => void;
  configurationGlobale?: ConfigurationGlobale | null;
  reglementConsultation?: RapportCommissionData | null;
}

export function ActeEngagementMultiLots({ procedureId, onSave, configurationGlobale, reglementConsultation }: Props) {
  const [currentLot, setCurrentLot] = useState(1);
  const [totalLots, setTotalLots] = useState(1);
  const [formDataATTRI1, setFormDataATTRI1] = useState<ActeEngagementATTRI1Data>(createDefaultActeEngagementATTRI1());
  const [lotLibelle, setLotLibelle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportingZip, setExportingZip] = useState(false);

  // 🆕 Utiliser les lots de la Configuration Globale si disponibles
  const hasConfigGlobale = configurationGlobale && configurationGlobale.lots && configurationGlobale.lots.length > 0;
  const configLots = hasConfigGlobale ? configurationGlobale!.lots : [];

  // Charger les données au montage et à chaque changement de lot
  useEffect(() => {
    loadLotData();
  }, [currentLot, procedureId]);

  // Charger le nombre total de lots
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
      // Sinon, charger depuis la base de données (ancien comportement)
      loadTotalLots();
    }
  }, [procedureId, configurationGlobale, currentLot]);

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
      
      if (lot && lot.data) {
        // Charger les données ATTRI1
        setFormDataATTRI1(lot.data as ActeEngagementATTRI1Data);
        setLotLibelle(lot.libelle_lot || `Lot ${currentLot}`);
      } else {
        // Lot n'existe pas encore, créer avec données ATTRI1 par défaut
        setFormDataATTRI1(createDefaultActeEngagementATTRI1());
        setLotLibelle(`Lot ${currentLot}`);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du lot:', err);
      setError('Impossible de charger les données du lot');
      setFormDataATTRI1(createDefaultActeEngagementATTRI1());
    } finally {
      setLoading(false);
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

  /**
   * Exporte tous les actes d'engagement dans un fichier ZIP
   */
  const handleExportAllLotsAsZip = async () => {
    setExportingZip(true);
    try {
      console.log('📦 Export ZIP - DEBUG RC:', {
        'RC disponible': !!reglementConsultation,
        'RC.enTete': reglementConsultation?.enTete,
        'RC.enTete.numeroMarche': reglementConsultation?.enTete?.numeroMarche,
      });

      const zip = new JSZip();
      let filesAdded = 0;

      // Charger tous les lots
      for (let lotNum = 1; lotNum <= totalLots; lotNum++) {
        try {
          const lot = await lotService.getLot(procedureId, lotNum, 'ae');

          // Utiliser les données du lot ou des données par défaut
          let lotData = (lot?.data as ActeEngagementATTRI1Data) || createDefaultActeEngagementATTRI1();

          // 🔄 IMPORTANT: Synchroniser les numéros ET l'objet du marché avec le Règlement de Consultation
          // (car les lots sauvegardés peuvent avoir d'anciens numéros courts ou un objet vide)
          if (reglementConsultation?.enTete?.numeroMarche || reglementConsultation?.enTete?.titreMarche) {
            const numeroFromRC = reglementConsultation.enTete?.numeroMarche;
            const objetFromRC = reglementConsultation.enTete?.titreMarche; // Titre du marché = objet complet
            
            console.log(`🔄 Lot ${lotNum} | Objet: "${objetFromRC?.substring(0, 50)}..." | Numero: "${numeroFromRC}"`);
            
            lotData = {
              ...lotData,
              objet: {
                ...lotData.objet,
                numeroReference: numeroFromRC || lotData.objet.numeroReference,
                intitule: objetFromRC || lotData.objet.intitule,
                objetMarche: objetFromRC || lotData.objet.objetMarche, // 🔥 IMPORTANT pour le Word
              },
              piecesConstitutives: {
                ...lotData.piecesConstitutives,
                ccapNumero: numeroFromRC || lotData.piecesConstitutives.ccapNumero,
                ccatpNumero: numeroFromRC || lotData.piecesConstitutives.ccatpNumero,
                cctpNumero: numeroFromRC || lotData.piecesConstitutives.cctpNumero,
              }
            };
          }

          // Récupérer le libellé depuis la Configuration Globale ou depuis le lot
          let lotLabel = `Lot ${lotNum}`;
          if (hasConfigGlobale) {
            const configLot = configLots.find(l => parseInt(l.numero) === lotNum);
            if (configLot) {
              lotLabel = configLot.intitule;
            }
          } else if (lot?.libelle_lot) {
            lotLabel = lot.libelle_lot;
          }

          console.log(`Génération du lot ${lotNum} - ${lotLabel}`);

          // Générer le document Word pour ce lot
          const blob = await generateActeEngagementWord(lotData, procedureId, lotNum);

          console.log(`Blob généré pour lot ${lotNum}, taille:`, blob.size);

          // Créer un nom de fichier avec le numéro et le nom du lot
          // Nettoyer le nom pour éviter les caractères invalides
          const cleanLabel = lotLabel.replace(/[<>:"/\\|?*]/g, '_');
          const fileName = `AE_Lot_${String(lotNum).padStart(2, '0')}_${cleanLabel}.docx`;

          // Ajouter au ZIP
          zip.file(fileName, blob);
          filesAdded++;
        } catch (lotErr) {
          console.error(`Erreur lors de la génération du lot ${lotNum}:`, lotErr);
          // Continuer avec les autres lots même si un échoue
        }
      }

      if (filesAdded === 0) {
        alert('❌ Aucun fichier n\'a pu être généré');
        return;
      }

      console.log(`${filesAdded} fichiers ajoutés au ZIP, génération...`);

      // Générer le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });

      console.log('ZIP généré, taille:', zipBlob.size);

      // Télécharger le ZIP
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `Actes_Engagement_${procedureId}_tous_lots.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      alert(`✅ Export ZIP réussi : ${filesAdded} acte(s) d'engagement exporté(s)`);
    } catch (err) {
      console.error('Erreur lors de l\'export ZIP:', err);
      alert(`❌ Erreur lors de l\'export ZIP: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
    } finally {
      setExportingZip(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Message d'info si Configuration Globale active */}
      {hasConfigGlobale && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <Info className="w-5 h-5 text-[#2F5B58] mt-0.5 flex-shrink-0" />
          <div className="text-sm text-green-800">
            <strong>Configuration Globale active :</strong> Les lots sont gérés depuis l'onglet "⚙️ Configuration Globale".
            Vous travaillez sur <strong>{configLots.length} lot{configLots.length > 1 ? 's' : ''}</strong> configuré{configLots.length > 1 ? 's' : ''}.
          </div>
        </div>
      )}

      {/* Sélecteur de lot */}
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

      {/* Libellé du lot et Export ZIP */}
      <div className="mx-6 mt-4 flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200">
        <button
          onClick={handleExportAllLotsAsZip}
          disabled={exportingZip || totalLots === 0}
          className="flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <PackageOpen className="w-4 h-4" />
          {exportingZip ? 'Export en cours...' : `Export ZIP (${totalLots} lot${totalLots > 1 ? 's' : ''})`}
        </button>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Libellé :</label>
          <input
            value={lotLibelle}
            onChange={(e) => setLotLibelle(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 focus:border-green-500"
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

      {/* Formulaire ATTRI1 */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2F5B58] mx-auto mb-4"></div>
              <p className="text-gray-600">Chargement du lot {currentLot}...</p>
            </div>
          </div>
        ) : (
          <ActeEngagementEditor
            data={formDataATTRI1}
            onSave={handleSaveLotATTRI1}
            isSaving={saving}
            numeroProcedure={procedureId}
            numeroLot={currentLot}
            reglementConsultation={reglementConsultation}
            configurationGlobale={configurationGlobale}
          />
        )}
      </div>
    </div>
  );
}
