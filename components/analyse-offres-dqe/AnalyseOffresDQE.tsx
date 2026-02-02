// ============================================
// Analyse des offres DQE
// Charge les DQE Excel par lot / par candidat et affiche une analyse comparative
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Upload,
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowLeft,
  Loader2,
  BarChart3,
  AlertCircle,
  FileDown,
  Save,
  Download,
  CheckCircle,
  Database,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { ProcedureSelector } from '../dce-complet/components/shared/ProcedureSelector';
import { ProcedureHeader } from '../dce-complet/components/shared/ProcedureHeader';
import { useProcedure } from '../dce-complet/hooks/useProcedureLoader';
import { parseDQEExcelFile, getExcelSheetNames, type ParsedDQERow, type ParseDQEResult } from './utils/parseDQEExcel';
import { AnalyseOffresDQEService } from './services/analyseOffresDQEService';
import type { ProjectData } from '../../types';
import type { LotConfiguration } from '../dce-complet/types';

interface CandidatDQE {
  id: string;
  name: string;
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
  rows: ParsedDQERow[];
}

interface AnalyseOffresDQEProps {
  onClose?: () => void;
}

export function AnalyseOffresDQE({ onClose }: AnalyseOffresDQEProps) {
  const [numeroProcedure, setNumeroProcedure] = useState('');
  const [procedureInfo, setProcedureInfo] = useState<ProjectData | null>(null);
  const [lotsConfig, setLotsConfig] = useState<LotConfiguration[]>([]);
  const [selectedLotNum, setSelectedLotNum] = useState<number>(1);
  const [candidatsByLot, setCandidatsByLot] = useState<Record<string, CandidatDQE[]>>({});
  const [loadingDCE, setLoadingDCE] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCandidatName, setNewCandidatName] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [viewingDQELot, setViewingDQELot] = useState<number | null>(null);
  const [dqeData, setDqeData] = useState<any>(null);
  const [loadingDQE, setLoadingDQE] = useState(false);
  
  // États pour la sélection de feuille Excel
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [availableSheets, setAvailableSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');

  // États pour la persistence Supabase
  const [analyseId, setAnalyseId] = useState<string | null>(null);
  const [hasSavedData, setHasSavedData] = useState(false);
  const [loadingFromSupabase, setLoadingFromSupabase] = useState(false);
  const [savingToSupabase, setSavingToSupabase] = useState(false);

  const procedureResult = useProcedure(numeroProcedure.length === 5 ? numeroProcedure : null);

  useEffect(() => {
    if (procedureResult.isValid && procedureResult.procedure) {
      setProcedureInfo(procedureResult.procedure);
    } else {
      setProcedureInfo(null);
      setLotsConfig([]);
    }
  }, [procedureResult.isValid, procedureResult.procedure]);

  const loadDCE = useCallback(async () => {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    setLoadingDCE(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Charger la configuration globale pour avoir les lots
      let dceQuery = supabase
        .from('dce')
        .select('configuration_globale')
        .eq('numero_procedure', numeroProcedure);
      if (user?.id) dceQuery = dceQuery.eq('user_id', user.id);
      const { data: dceRow, error: dceError } = await dceQuery.single();

      if (dceError) throw dceError;
      
      if (!dceRow) {
        throw new Error(`Aucun DCE trouvé pour la procédure ${numeroProcedure}`);
      }
      
      const config = (dceRow as any)?.configuration_globale || null;
      const lots = config?.lots || [];
      
      console.log('📊 DCE chargé:', {
        numeroProcedure,
        nbLots: lots.length,
        lots: lots.map((l: any) => ({ numero: l.numero, intitule: l.intitule }))
      });
      
      setLotsConfig(lots);
      if (lots.length > 0 && selectedLotNum > lots.length) {
        setSelectedLotNum(1);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur chargement DCE');
      setLotsConfig([]);
    } finally {
      setLoadingDCE(false);
    }
  }, [numeroProcedure, selectedLotNum]);

  useEffect(() => {
    if (numeroProcedure.length === 5 && procedureResult.isValid) {
      loadDCE();
    } else {
      setLotsConfig([]);
    }
  }, [numeroProcedure, procedureResult.isValid, loadDCE]);

  const totalLots = lotsConfig.length || 1;
  const currentCandidats = candidatsByLot[String(selectedLotNum)] || [];

  const showWelcome = !numeroProcedure || numeroProcedure.length !== 5 || !procedureResult.isValid;

  const handleBackToSelection = () => {
    setNumeroProcedure('');
    setProcedureInfo(null);
    setLotsConfig([]);
    setCandidatsByLot({});
    setSelectedLotNum(1);
    setError(null);
  };

  const handleBackToLotSelection = () => {
    // Retour à la sélection du lot sans perdre les données
    // Vider seulement les candidats du lot actuel si on veut revenir au chargement
    // Ou ne rien faire pour garder toutes les données
    setError(null);
  };

  const addCandidatFromFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingFile(true);
    setError(null);
    
    try {
      // 1. Lire les feuilles disponibles
      const sheets = await getExcelSheetNames(file);
      
      if (sheets.length === 0) {
        throw new Error('Aucune feuille trouvée dans le fichier Excel');
      }
      
      // 2. Stocker le fichier et afficher le sélecteur de feuille
      setPendingFile(file);
      setAvailableSheets(sheets);
      setSelectedSheet(sheets[0]); // Sélectionner la première feuille par défaut
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du fichier Excel');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      setLoadingFile(false);
    }
  };
  
  const confirmSheetAndImport = async () => {
    if (!pendingFile || !selectedSheet) return;
    
    const name = newCandidatName.trim() || pendingFile.name.replace(/\.[^.]+$/, '');
    if (!name) {
      setError('Saisissez un nom de candidat ou utilisez le nom du fichier.');
      return;
    }
    
    setLoadingFile(true);
    setError(null);
    
    try {
      const result: ParseDQEResult = await parseDQEExcelFile(pendingFile, selectedSheet);
      const candidat: CandidatDQE = {
        id: `c-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name,
        totalHT: result.totalHT,
        totalTVA: result.totalTVA,
        totalTTC: result.totalTTC,
        rows: result.rows,
      };
      
      // Ajouter dans l'état local (FUSION, ne remplace pas)
      setCandidatsByLot((prev) => {
        const list = prev[String(selectedLotNum)] || [];
        return {
          ...prev,
          [String(selectedLotNum)]: [...list, candidat],
        };
      });
      
      // Sauvegarder automatiquement dans Supabase
      await saveCandidatToSupabase(candidat, selectedLotNum);
      
      // Message de confirmation
      const nbCandidats = (candidatsByLot[String(selectedLotNum)] || []).length + 1;
      console.log(`✅ Candidat "${name}" ajouté au Lot ${selectedLotNum} (${nbCandidats} candidat(s) total)`);
      
      // Réinitialiser pour permettre un nouveau chargement
      setNewCandidatName('');
      setPendingFile(null);
      setAvailableSheets([]);
      setSelectedSheet('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la lecture du fichier Excel');
    } finally {
      setLoadingFile(false);
    }
  };
  
  const cancelSheetSelection = () => {
    setPendingFile(null);
    setAvailableSheets([]);
    setSelectedSheet('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ===== FONCTIONS DE SAUVEGARDE ET CHARGEMENT SUPABASE =====
  
  // Vérifier si des données existent pour cette procédure
  useEffect(() => {
    const checkSavedData = async () => {
      if (!numeroProcedure || numeroProcedure.length !== 5) {
        setHasSavedData(false);
        return;
      }
      try {
        const hasData = await AnalyseOffresDQEService.hasData(numeroProcedure);
        setHasSavedData(hasData);
      } catch (err) {
        console.error('Erreur vérification données sauvegardées:', err);
      }
    };
    checkSavedData();
  }, [numeroProcedure]);

  // Charger les données depuis Supabase
  const handleLoadFromSupabase = async () => {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    
    setLoadingFromSupabase(true);
    setError(null);
    
    try {
      const candidats = await AnalyseOffresDQEService.loadCandidatsByProcedure(numeroProcedure);
      
      if (candidats.length === 0) {
        setError('Aucune donnée sauvegardée trouvée pour ce numéro de procédure');
        return;
      }
      
      // Charger les lignes pour chaque candidat
      const candidatsComplets: Record<string, CandidatDQE[]> = {};
      
      for (const candidat of candidats) {
        const lignes = await AnalyseOffresDQEService.loadLignesCandidat(candidat.id);
        
        const candidatDQE: CandidatDQE = {
          id: candidat.id,
          name: candidat.nom_candidat,
          totalHT: candidat.total_ht || 0,
          totalTVA: candidat.total_tva || 0,
          totalTTC: candidat.total_ttc || 0,
          rows: lignes.map(ligne => ({
            numero: ligne.numero || '',
            designation: ligne.designation || '',
            unite: ligne.unite || '',
            quantite: ligne.quantite || 0,
            prix_unitaire: ligne.prix_unitaire || 0,
            prix_total: ligne.prix_total || 0,
          })),
        };
        
        const lotKey = String(candidat.numero_lot);
        if (!candidatsComplets[lotKey]) {
          candidatsComplets[lotKey] = [];
        }
        candidatsComplets[lotKey].push(candidatDQE);
      }
      
      // FUSION avec les candidats existants (ne pas effacer)
      setCandidatsByLot(prev => {
        const merged = { ...prev };
        for (const lotKey in candidatsComplets) {
          const existing = merged[lotKey] || [];
          const nouveaux = candidatsComplets[lotKey];
          
          // Éviter les doublons basés sur l'ID Supabase
          const existingIds = new Set(existing.map(c => c.id));
          const candidatsAjouter = nouveaux.filter(c => !existingIds.has(c.id));
          
          merged[lotKey] = [...existing, ...candidatsAjouter];
        }
        return merged;
      });
      
      setError(null);
      const totalCharges = candidats.length;
      console.log(`✅ ${totalCharges} candidat(s) chargé(s) depuis Supabase`);
      
      // Message informatif
      const lotsCharges = Object.keys(candidatsComplets).length;
      alert(`✅ Chargement réussi!\n\n${totalCharges} candidat(s) chargé(s) sur ${lotsCharges} lot(s).\n\nVous pouvez maintenant charger d'autres DQE pour les comparer.`);
      
    } catch (err: any) {
      console.error('Erreur chargement Supabase:', err);
      setError(err.message || 'Erreur lors du chargement des données');
    } finally {
      setLoadingFromSupabase(false);
    }
  };

  // Sauvegarder un candidat dans Supabase (appelé automatiquement après upload)
  const saveCandidatToSupabase = async (candidat: CandidatDQE, lotNum: number) => {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    
    try {
      // Créer ou récupérer l'analyse
      const analyse = await AnalyseOffresDQEService.getOrCreateAnalyse(numeroProcedure);
      
      if (!analyse) {
        throw new Error('Impossible de créer ou récupérer l\'analyse');
      }
      
      setAnalyseId(analyse.id);
      
      // Préparer les lignes au bon format
      const lignes = (candidat.rows || []).map((row, index) => ({
        numero_ligne: index + 1,
        code_article: row.numero || '',
        designation: row.designation || '',
        unite: row.unite || '',
        quantite: row.quantite || 0,
        prix_unitaire_ht: row.prix_unitaire || 0,
        montant_ht: row.prix_total || 0,
      }));
      
      // Sauvegarder le candidat avec ses lignes
      const savedCandidat = await AnalyseOffresDQEService.saveCandidatDQE(
        analyse.id,
        lotNum,
        null, // nom_lot
        candidat.name,
        candidat.totalHT || 0,
        candidat.totalTVA || 0,
        candidat.totalTTC || 0,
        lignes
      );
      
      if (!savedCandidat) {
        throw new Error('Échec de la sauvegarde du candidat');
      }
      
      // Mettre à jour l'ID du candidat avec l'ID Supabase
      setCandidatsByLot(prev => {
        const lotKey = String(lotNum);
        const candidats = prev[lotKey] || [];
        const updatedCandidats = candidats.map(c => 
          c.id === candidat.id ? { ...c, id: savedCandidat.id } : c
        );
        return { ...prev, [lotKey]: updatedCandidats };
      });
      
      setHasSavedData(true);
      console.log(`✅ Candidat "${candidat.name}" sauvegardé (Lot ${lotNum})`);
      
    } catch (err: any) {
      console.error('Erreur sauvegarde Supabase:', err);
      setError(`Erreur sauvegarde: ${err.message}`);
    }
  };

  const removeCandidat = async (lotNum: number, candidatId: string) => {
    // Supprimer de Supabase si l'ID n'est pas généré localement
    if (!candidatId.startsWith('c-')) {
      try {
        await AnalyseOffresDQEService.deleteCandidat(candidatId);
        console.log(`✅ Candidat ${candidatId} supprimé de Supabase`);
      } catch (err: any) {
        console.error('Erreur suppression Supabase:', err);
        setError(`Erreur suppression: ${err.message}`);
        return;
      }
    }
    
    // Supprimer de l'état local
    setCandidatsByLot((prev) => ({
      ...prev,
      [String(lotNum)]: (prev[String(lotNum)] || []).filter((c) => c.id !== candidatId),
    }));
  };

  const getLotName = (num: number) => {
    const lot = lotsConfig.find((l) => parseInt(l.numero, 10) === num || l.numero === String(num));
    return lot?.intitule || `Lot ${num}`;
  };

  const analysisRows = currentCandidats.length > 0 ? currentCandidats[0].rows : [];
  const analysisCandidats = currentCandidats;

  const loadDQEForLot = async (lotNum: number) => {
    setLoadingDQE(true);
    setError(null);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // ⚠️ Le DQE est stocké dans la table 'dqes', PAS dans configuration_globale
      // Charger depuis la table dqes avec procedure_id et numero_lot
      const { data: dqeRow, error: dqeError } = await supabase
        .from('dqes')
        .select('*')
        .eq('procedure_id', numeroProcedure)
        .eq('numero_lot', lotNum)
        .maybeSingle();

      if (dqeError) {
        console.error('Erreur chargement DQE:', dqeError);
        throw dqeError;
      }
      
      console.log('🔍 Recherche DQE pour lot', lotNum, {
        found: !!dqeRow,
        hasData: !!dqeRow?.data,
        dataKeys: dqeRow?.data ? Object.keys(dqeRow.data) : []
      });
      
      if (dqeRow?.data) {
        setDqeData(dqeRow.data);
        setViewingDQELot(lotNum);
      } else {
        setError(`Aucune donnée DQE trouvée pour le lot ${lotNum}. Veuillez d'abord créer le DQE dans le module DCE Complet.`);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement du DQE');
    } finally {
      setLoadingDQE(false);
    }
  };

  const closeDQEView = () => {
    setViewingDQELot(null);
    setDqeData(null);
  };

  const exportToExcel = () => {
    if (analysisCandidats.length === 0 || analysisRows.length === 0) {
      setError('Aucune donnée à exporter. Veuillez charger au moins un candidat.');
      setTimeout(() => setError(null), 3000);
      return;
    }

    const wb = XLSX.utils.book_new();

    // ========== FEUILLE 1 : Informations ==========
    const infoData: any[][] = [
      ['ANALYSE DES OFFRES - DÉCOMPTE QUANTITATIF ESTIMATIF (DQE)'],
      [''],
      ['Informations de la procédure'],
      [''],
      ['Numéro de procédure', numeroProcedure],
      ['Titre du marché', procedureInfo?.['Nom de la procédure'] || 'N/A'],
      [''],
      ['Informations du lot'],
      [''],
      ['Numéro de lot', selectedLotNum],
      ['Libellé du lot', getLotName(selectedLotNum)],
      [''],
      ['Date d\'export', new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      [''],
      ['Candidats analysés'],
      [''],
      ...analysisCandidats.map((c, i) => [`Candidat ${i + 1}`, c.name]),
      [''],
      ['Statistiques'],
      [''],
      ['Nombre de lignes', analysisRows.length],
      ['Nombre de candidats', analysisCandidats.length],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    wsInfo['!cols'] = [
      { wch: 30 },
      { wch: 60 },
    ];

    // ========== FEUILLE 2 : Tableau comparatif ==========
    const wsData: any[][] = [];
    
    // En-tête
    const header = ['Code', 'Désignation'];
    analysisCandidats.forEach(c => header.push(`${c.name} (HT)`));
    if (analysisCandidats.length >= 2) {
      header.push('Min', 'Max', 'Écart');
    }
    wsData.push(header);
    
    // Lignes de données
    analysisRows.forEach(row => {
      const rowData: any[] = [
        row.codeArticle || '—',
        row.designation || '—'
      ];
      
      const valuesByCandidat = analysisCandidats.map((c, idx) => {
        const r = c.rows[analysisRows.indexOf(row)];
        const val = r ? r.montantHT : 0;
        rowData.push(val > 0 ? val : '—');
        return val;
      });
      
      if (analysisCandidats.length >= 2) {
        const min = valuesByCandidat.length ? Math.min(...valuesByCandidat) : 0;
        const max = valuesByCandidat.length ? Math.max(...valuesByCandidat) : 0;
        const ecart = max - min;
        
        rowData.push(
          min > 0 ? min : '—',
          max > 0 ? max : '—',
          ecart > 0 ? ecart : '—'
        );
      }
      
      wsData.push(rowData);
    });
    
    // Ligne de totaux
    const totalRow: any[] = ['', 'Total HT'];
    analysisCandidats.forEach(c => totalRow.push(c.totalHT));
    if (analysisCandidats.length >= 2) {
      const minTotal = Math.min(...analysisCandidats.map(c => c.totalHT));
      const maxTotal = Math.max(...analysisCandidats.map(c => c.totalHT));
      totalRow.push(minTotal, maxTotal, maxTotal - minTotal);
    }
    wsData.push(totalRow);
    
    const wsComparatif = XLSX.utils.aoa_to_sheet(wsData);
    
    // Largeurs de colonnes
    wsComparatif['!cols'] = [
      { wch: 15 }, // Code
      { wch: 40 }, // Désignation
      ...analysisCandidats.map(() => ({ wch: 15 })),
      ...(analysisCandidats.length >= 2 ? [{ wch: 15 }, { wch: 15 }, { wch: 15 }] : [])
    ];

    // ========== FEUILLE 3 : Synthèse des totaux ==========
    const synthData: any[][] = [
      ['SYNTHÈSE DES TOTAUX PAR CANDIDAT'],
      [''],
      ['Rang', 'Candidat', 'Total HT', 'Total TVA', 'Total TTC'],
      [''],
    ];
    
    const candidatsTriés = [...analysisCandidats].sort((a, b) => a.totalHT - b.totalHT);
    candidatsTriés.forEach((c, idx) => {
      synthData.push([
        idx + 1,
        c.name,
        c.totalHT,
        c.totalTVA,
        c.totalTTC
      ]);
    });
    
    const wsSynth = XLSX.utils.aoa_to_sheet(synthData);
    wsSynth['!cols'] = [
      { wch: 8 },
      { wch: 30 },
      { wch: 15 },
      { wch: 15 },
      { wch: 15 }
    ];

    // Ajouter les feuilles
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
    XLSX.utils.book_append_sheet(wb, wsComparatif, 'Analyse comparative');
    XLSX.utils.book_append_sheet(wb, wsSynth, 'Synthèse');
    
    const fileName = `${numeroProcedure}_AnalyseOffres_LOT${selectedLotNum}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Export Excel terminé:', fileName);
  };

  // Si on visualise un DQE, afficher la vue pleine page (comme DQEForm)
  if (viewingDQELot !== null && dqeData) {
    const totalWidth = dqeData.columns.reduce((sum, col) => sum + parseInt(col.width || '150'), 0) + 50;

    return (
      <div className="fixed inset-0 bg-white dark:bg-gray-900 z-50 overflow-hidden flex flex-col">
        {/* En-tête fixe */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm z-20">
          <div className="px-6 py-4">
            {/* Bouton retour et titre */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={closeDQEView}
                  className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Retour
                </button>
                <h1 className="text-xl font-bold text-[#2F5B58] dark:text-teal-400 border-l border-gray-300 dark:border-gray-600 pl-4">
                  DÉCOMPTE QUANTITATIF ESTIMATIF (DQE) - Lot {viewingDQELot} : {getLotName(viewingDQELot)}
                </h1>
              </div>
            </div>

            {/* Info procédure et totaux */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Procédure {numeroProcedure} - {procedureInfo?.['Nom de la procédure'] || ''}
              </p>
              
              {/* Totaux */}
              {dqeData.rows && dqeData.rows.length > 0 && (
                <div className="flex gap-6">
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total HT</div>
                    <div className="text-lg font-bold text-[#2F5B58] dark:text-teal-300">
                      {dqeData.rows
                        .reduce((sum: number, row: any) => sum + (parseFloat(row.montantHT) || 0), 0)
                        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total TVA</div>
                    <div className="text-lg font-bold text-[#2F5B58] dark:text-teal-300">
                      {dqeData.rows
                        .reduce((sum: number, row: any) => sum + (parseFloat(row.montantTVA) || 0), 0)
                        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Total TTC</div>
                    <div className="text-lg font-bold text-[#2F5B58] dark:text-teal-300">
                      {dqeData.rows
                        .reduce((sum: number, row: any) => sum + (parseFloat(row.montantTTC) || 0), 0)
                        .toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Conteneur du tableau avec scroll */}
        <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-900">
          <table 
            className="border-collapse bg-white dark:bg-gray-800 shadow-sm"
            style={{ 
              minWidth: `${totalWidth}px`,
              tableLayout: 'fixed'
            }}
          >
            <thead className="sticky top-0 z-10">
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center" style={{ width: '50px' }}>
                  #
                </th>
                {(dqeData.columns || []).map((col: any) => (
                  <th
                    key={col.id}
                    className={`border border-gray-300 dark:border-gray-600 px-2 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 text-center ${
                      col.isCalculated ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-100 dark:bg-gray-700'
                    }`}
                    style={{ width: col.width || '150px' }}
                  >
                    {dqeData.headerLabels?.[col.id] || col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(dqeData.rows || []).map((row: any, rowIndex: number) => (
                <tr key={row.id || rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/30 px-2 py-1 text-xs text-center font-medium text-gray-600 dark:text-gray-400">
                    {rowIndex + 1}
                  </td>
                  {(dqeData.columns || []).map((col: any) => {
                    // Déterminer si la colonne contient des valeurs numériques ou financières
                    const isNumeric = ['quantite', 'prixUnitaire', 'prixUnitaireVenteHT', 'prixUniteHT', 'prixUniteVenteHT', 'ecoContribution', 'ecoContributionHT', 'montantHT', 'montantTVA', 'montantTTC', 'tva', 'tauxTVA'].includes(col.id) || 
                                      col.label?.toLowerCase().includes('prix') || 
                                      col.label?.toLowerCase().includes('montant') || 
                                      col.label?.toLowerCase().includes('total') ||
                                      col.label?.toLowerCase().includes('quantité') ||
                                      col.label?.toLowerCase().includes('éco-contribution') ||
                                      col.label?.toLowerCase().includes('tva');
                    
                    return (
                      <td
                        key={col.id}
                        className={`border border-gray-300 dark:border-gray-600 px-2 py-1 text-xs text-gray-900 dark:text-white ${
                          isNumeric ? 'text-right tabular-nums' : ''
                        }`}
                        style={{ width: col.width || '150px' }}
                      >
                        {row[col.id] || ''}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Info nombre de lignes */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {(dqeData.rows || []).length} ligne{(dqeData.rows || []).length > 1 ? 's' : ''} × {(dqeData.columns || []).length} colonne{(dqeData.columns || []).length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-6">
        {onClose && !showWelcome && (
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </button>
        )}

        {/* Écran de bienvenue : sélection de la procédure (comme DCE Complet) */}
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] py-8">
            <div className="max-w-2xl w-full">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-[#006d57] dark:text-emerald-400" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  Analyse des offres DQE
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Saisissez un numéro de procédure pour démarrer
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-8">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Numéro de procédure (5 chiffres)
                </label>
                <ProcedureSelector
                  value={numeroProcedure}
                  onChange={setNumeroProcedure}
                  onProcedureSelected={() => {}}
                />

                {procedureResult.error && !procedureResult.isValid && (
                  <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      {procedureResult.error}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-8 flex justify-center gap-4">
                {onClose && (
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                  >
                    Retour au menu précédent
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* En-tête de procédure (comme DCE Complet) */}
            <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl flex-shrink-0">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <ProcedureHeader procedure={procedureInfo} />
                </div>
                <button
                  type="button"
                  onClick={handleBackToSelection}
                  className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 whitespace-nowrap"
                >
                  Retour à la sélection
                </button>
              </div>
              {loadingDCE && (
                <div className="mt-3 flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Chargement des lots...
                </div>
              )}
              {error && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Contenu : lots, candidats, tableau comparatif */}
            
            {/* Message d'aide pour le workflow */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <BarChart3 className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Mode de fonctionnement — Analyse comparative multi-candidats
                  </h3>
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                    <p className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <span><strong>Sélectionnez un lot</strong> ci-dessous</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <span><strong>Chargez autant de DQE candidats que vous le souhaitez</strong> (fichiers Excel/CSV) — ils s'ajoutent sans effacer les précédents</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <span><strong>Analysez et comparez</strong> tous les candidats dans le tableau comparatif ci-dessous</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <span className="flex-shrink-0 w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-xs font-bold">✓</span>
                      <span className="italic">Les données sont sauvegardées automatiquement dans Supabase à chaque ajout. Vous pouvez les recharger à tout moment.</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Sélection du lot */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Lot à analyser
                </h2>
                
                {/* Boutons Sauvegarder / Charger depuis Supabase */}
                <div className="flex items-center gap-2">
                  {hasSavedData && (
                    <button
                      type="button"
                      onClick={handleLoadFromSupabase}
                      disabled={loadingFromSupabase}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm font-medium"
                    >
                      {loadingFromSupabase ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Database className="w-4 h-4" />
                      )}
                      {loadingFromSupabase ? 'Chargement...' : 'Charger depuis Supabase'}
                    </button>
                  )}
                  
                  {hasSavedData && (
                    <div className="px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-green-700 dark:text-green-300 font-medium">
                        Données sauvegardées
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalLots }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setSelectedLotNum(num);
                      loadDQEForLot(num);
                    }}
                    disabled={loadingDQE}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      selectedLotNum === num
                        ? 'bg-[#2F5B58] text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loadingDQE && selectedLotNum === num ? (
                      <Loader2 className="w-4 h-4 animate-spin inline" />
                    ) : (
                      `Lot ${num}`
                    )}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                {getLotName(selectedLotNum)}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-500 italic">
                💡 Cliquez sur un lot pour ouvrir le DQE en pleine page
              </p>
            </div>

            {/* Ajouter un candidat (DQE Excel) */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Charger le DQE Excel d'un candidat — Lot {selectedLotNum}
                </h2>
                {currentCandidats.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span className="text-xs text-green-700 dark:text-green-300">
                      Les fichiers s'ajoutent sans effacer les précédents
                    </span>
                  </div>
                )}
              </div>
              
              {!pendingFile ? (
                <>
                  <div className="flex flex-wrap items-end gap-4">
                    <div className="w-64">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nom du candidat
                      </label>
                      <input
                        type="text"
                        value={newCandidatName}
                        onChange={(e) => setNewCandidatName(e.target.value)}
                        placeholder="Ex: Entreprise A"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={addCandidatFromFile}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loadingFile}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] disabled:opacity-50 transition"
                      >
                        {loadingFile ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        {loadingFile ? 'Chargement...' : 'Choisir un fichier DQE Excel'}
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Fichiers DQE ou BPU acceptés. Les colonnes seront mappées automatiquement.
                  </p>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 mb-3">
                      <FileSpreadsheet className="w-5 h-5" />
                      <span className="font-medium">Fichier sélectionné : {pendingFile.name}</span>
                    </div>
                    
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Choisir l'onglet à importer
                    </label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-[#2F5B58] focus:border-transparent"
                    >
                      {availableSheets.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                      {availableSheets.length} feuille{availableSheets.length > 1 ? 's' : ''} disponible{availableSheets.length > 1 ? 's' : ''} dans ce fichier
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={confirmSheetAndImport}
                      disabled={loadingFile || !selectedSheet}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] disabled:opacity-50 transition"
                    >
                      {loadingFile ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Import en cours...
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="w-4 h-4" />
                          Importer cet onglet
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSheetSelection}
                      disabled={loadingFile}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 transition"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des candidats chargés pour ce lot */}
            {currentCandidats.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Candidats chargés pour le lot {selectedLotNum}
                  </h2>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                      {currentCandidats.length} candidat{currentCandidats.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                
                {currentCandidats.length < 2 && (
                  <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      💡 <strong>Astuce :</strong> Chargez au moins 2 candidats pour activer l'analyse comparative complète.
                    </p>
                  </div>
                )}
                
                <ul className="space-y-2">
                  {currentCandidats.map((c, index) => (
                    <li
                      key={c.id}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-[#2F5B58] text-white text-xs font-bold">
                          {index + 1}
                        </div>
                        <FileSpreadsheet className="w-5 h-5 text-[#2F5B58]" />
                        <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Total HT : {c.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                          — {c.rows.length} ligne{c.rows.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCandidat(selectedLotNum, c.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
                
                {currentCandidats.length >= 2 && (
                  <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      ✅ Analyse comparative activée ! Vous pouvez visualiser les différences de prix ci-dessous.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tableau d'analyse comparative en pleine page */}
            {analysisCandidats.length >= 1 && analysisRows.length > 0 && (
              <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-40 overflow-auto">
                {/* En-tête fixe */}
                <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-50">
                  <div className="max-w-[98%] mx-auto px-6 py-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => {
                            // Vider les candidats du lot actuel pour revenir à l'écran de chargement
                            setCandidatsByLot(prev => {
                              const newState = { ...prev };
                              delete newState[String(selectedLotNum)];
                              return newState;
                            });
                          }}
                          className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition"
                        >
                          <ArrowLeft className="w-5 h-5" />
                          Retour
                        </button>
                        <div className="flex items-center gap-3">
                          <BarChart3 className="w-6 h-6 text-[#2F5B58] dark:text-teal-400" />
                          <h1 className="text-xl font-bold text-[#2F5B58] dark:text-teal-400">
                            Analyse Comparative - Lot {selectedLotNum} : {getLotName(selectedLotNum)}
                          </h1>
                        </div>
                      </div>
                      <button
                        onClick={exportToExcel}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition"
                      >
                        <FileDown className="w-4 h-4" />
                        Exporter Excel
                      </button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Procédure {numeroProcedure} - {procedureInfo?.['Nom de la procédure'] || ''}
                    </p>
                  </div>
                </div>

                <div className="max-w-[98%] mx-auto px-6 py-6 space-y-6">
                  {/* KPIs Comparatifs */}
                  {analysisCandidats.length >= 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Meilleure offre HT */}
                      <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">Meilleure offre HT</span>
                          <div className="w-8 h-8 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center">
                            <span className="text-green-700 dark:text-green-200 font-bold">1</span>
                          </div>
                        </div>
                        {(() => {
                          const minCandidat = analysisCandidats.reduce((prev, curr) => 
                            curr.totalHT < prev.totalHT ? curr : prev
                          );
                          return (
                            <>
                              <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                                {minCandidat.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                              <div className="text-sm text-green-600 dark:text-green-400 mt-1">
                                {minCandidat.name}
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Écart maximum */}
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-700 dark:text-orange-300">Écart max</span>
                          <div className="w-8 h-8 bg-orange-200 dark:bg-orange-800 rounded-full flex items-center justify-center">
                            <span className="text-orange-700 dark:text-orange-200 font-bold">Δ</span>
                          </div>
                        </div>
                        {(() => {
                          const minTotal = Math.min(...analysisCandidats.map(c => c.totalHT));
                          const maxTotal = Math.max(...analysisCandidats.map(c => c.totalHT));
                          const ecart = maxTotal - minTotal;
                          const ecartPct = minTotal > 0 ? ((ecart / minTotal) * 100) : 0;
                          return (
                            <>
                              <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                                {ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                              <div className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                                +{ecartPct.toFixed(1)}% vs meilleur
                              </div>
                            </>
                          );
                        })()}
                      </div>

                      {/* Nombre de candidats */}
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">Candidats analysés</span>
                          <div className="w-8 h-8 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center">
                            <FileSpreadsheet className="w-4 h-4 text-blue-700 dark:text-blue-200" />
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                          {analysisCandidats.length}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                          {analysisRows.length} lignes comparées
                        </div>
                      </div>

                      {/* Moyenne des offres */}
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-purple-700 dark:text-purple-300">Moyenne HT</span>
                          <div className="w-8 h-8 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center">
                            <span className="text-purple-700 dark:text-purple-200 font-bold">μ</span>
                          </div>
                        </div>
                        {(() => {
                          const moyenne = analysisCandidats.reduce((sum, c) => sum + c.totalHT, 0) / analysisCandidats.length;
                          return (
                            <>
                              <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                                {moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                              <div className="text-sm text-purple-600 dark:text-purple-400 mt-1">
                                Prix moyen
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                  {/* Tableau détaillé par candidat */}
                  <div className="grid gap-6">
                    {analysisCandidats.map((candidat, candidatIndex) => {
                      const isWinner = analysisCandidats.every(c => candidat.totalHT <= c.totalHT);
                      return (
                        <div 
                          key={candidat.id} 
                          className={`bg-white dark:bg-gray-800 rounded-xl border-2 ${
                            isWinner 
                              ? 'border-green-500 dark:border-green-600 shadow-green-100 dark:shadow-green-900/20 shadow-lg' 
                              : 'border-gray-200 dark:border-gray-700'
                          } overflow-hidden`}
                        >
                          {/* En-tête candidat */}
                          <div className={`px-6 py-4 ${
                            isWinner 
                              ? 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30' 
                              : 'bg-gray-50 dark:bg-gray-700/50'
                          } border-b border-gray-200 dark:border-gray-600`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                {isWinner && (
                                  <div className="w-10 h-10 bg-green-500 dark:bg-green-600 rounded-full flex items-center justify-center shadow-lg">
                                    <span className="text-white font-bold text-lg">★</span>
                                  </div>
                                )}
                                <div>
                                  <h3 className={`text-xl font-bold ${
                                    isWinner 
                                      ? 'text-green-900 dark:text-green-100' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {candidat.name}
                                    {isWinner && <span className="ml-2 text-sm font-normal text-green-700 dark:text-green-300">(Meilleure offre)</span>}
                                  </h3>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {candidat.rows.length} article{candidat.rows.length > 1 ? 's' : ''}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Totaux */}
                              <div className="flex gap-8">
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Total HT</div>
                                  <div className={`text-2xl font-bold ${
                                    isWinner 
                                      ? 'text-green-700 dark:text-green-300' 
                                      : 'text-gray-900 dark:text-white'
                                  }`}>
                                    {candidat.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">TVA</div>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {candidat.totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-xs text-gray-500 dark:text-gray-400">Total TTC</div>
                                  <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                                    {candidat.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Tableau détail */}
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                                <tr>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-24">Code</th>
                                  <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 min-w-[300px]">Désignation</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-32">Montant HT</th>
                                  <th className="text-center py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-24">TVA (%)</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-32">Montant TVA</th>
                                  <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-32">Montant TTC</th>
                                </tr>
                              </thead>
                              <tbody>
                                {candidat.rows.map((row, rowIdx) => (
                                  <tr 
                                    key={row.id} 
                                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30"
                                  >
                                    <td className="py-2 px-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                                      {row.codeArticle || '—'}
                                    </td>
                                    <td className="py-2 px-4 text-gray-900 dark:text-white">
                                      {row.designation || '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right tabular-nums font-semibold text-gray-900 dark:text-white">
                                      {row.montantHT > 0 
                                        ? row.montantHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) 
                                        : '—'}
                                    </td>
                                    <td className="py-2 px-4 text-center text-gray-700 dark:text-gray-300">
                                      {row.tauxTVA > 0 ? `${row.tauxTVA}%` : '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right tabular-nums text-gray-700 dark:text-gray-300">
                                      {row.montantTVA > 0 
                                        ? row.montantTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) 
                                        : '—'}
                                    </td>
                                    <td className="py-2 px-4 text-right tabular-nums font-medium text-gray-900 dark:text-white">
                                      {row.montantTTC > 0 
                                        ? row.montantTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) 
                                        : '—'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tableau de synthèse comparative */}
                  {analysisCandidats.length >= 2 && (
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                          Synthèse comparative ligne par ligne
                        </h3>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-100 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                            <tr>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 w-24">Code</th>
                              <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300 min-w-[250px]">Désignation</th>
                              {analysisCandidats.map((c) => (
                                <th key={c.id} className="text-right py-3 px-4 font-semibold text-[#2F5B58] dark:text-teal-400 whitespace-nowrap">
                                  {c.name}
                                </th>
                              ))}
                              <th className="text-right py-3 px-4 font-semibold text-green-700 dark:text-green-300 whitespace-nowrap">Min</th>
                              <th className="text-right py-3 px-4 font-semibold text-orange-700 dark:text-orange-300 whitespace-nowrap">Max</th>
                              <th className="text-right py-3 px-4 font-semibold text-red-700 dark:text-red-300 whitespace-nowrap">Écart</th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisRows.map((row, rowIndex) => {
                              const valuesByCandidat = analysisCandidats.map((c) => {
                                const r = c.rows[rowIndex];
                                return r ? r.montantHT : 0;
                              });
                              const min = Math.min(...valuesByCandidat);
                              const max = Math.max(...valuesByCandidat);
                              const ecart = max - min;

                              return (
                                <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                                  <td className="py-2 px-4 text-gray-700 dark:text-gray-300 font-mono text-xs">
                                    {row.codeArticle || '—'}
                                  </td>
                                  <td className="py-2 px-4 text-gray-900 dark:text-white">
                                    {row.designation || '—'}
                                  </td>
                                  {analysisCandidats.map((c) => {
                                    const r = c.rows[rowIndex];
                                    const val = r ? r.montantHT : 0;
                                    const isMin = val > 0 && val === min;
                                    return (
                                      <td 
                                        key={c.id} 
                                        className={`py-2 px-4 text-right tabular-nums font-medium ${
                                          isMin 
                                            ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                                            : 'text-gray-900 dark:text-white'
                                        }`}
                                      >
                                        {val > 0 ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                      </td>
                                    );
                                  })}
                                  <td className="py-2 px-4 text-right tabular-nums font-semibold text-green-700 dark:text-green-300">
                                    {min > 0 ? min.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                  <td className="py-2 px-4 text-right tabular-nums text-orange-700 dark:text-orange-300">
                                    {max > 0 ? max.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                  <td className="py-2 px-4 text-right tabular-nums font-semibold text-red-700 dark:text-red-300">
                                    {ecart > 0 ? ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-gray-100 dark:bg-gray-700/50 font-bold">
                            <tr>
                              <td colSpan={2} className="py-3 px-4 text-gray-900 dark:text-white">TOTAL HT</td>
                              {analysisCandidats.map((c) => {
                                const isMin = analysisCandidats.every(other => c.totalHT <= other.totalHT);
                                return (
                                  <td 
                                    key={c.id} 
                                    className={`py-3 px-4 text-right tabular-nums ${
                                      isMin 
                                        ? 'text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30' 
                                        : 'text-[#2F5B58] dark:text-teal-400'
                                    }`}
                                  >
                                    {c.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                  </td>
                                );
                              })}
                              <td className="py-3 px-4 text-right tabular-nums text-green-700 dark:text-green-300">
                                {Math.min(...analysisCandidats.map(c => c.totalHT)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums text-orange-700 dark:text-orange-300">
                                {Math.max(...analysisCandidats.map(c => c.totalHT)).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </td>
                              <td className="py-3 px-4 text-right tabular-nums text-red-700 dark:text-red-300">
                                {(Math.max(...analysisCandidats.map(c => c.totalHT)) - Math.min(...analysisCandidats.map(c => c.totalHT))).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {procedureResult.isValid && totalLots > 0 && currentCandidats.length === 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-8 text-center text-gray-500 dark:text-gray-400">
                Aucun candidat chargé pour ce lot. Ajoutez un fichier DQE Excel ci-dessus.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
