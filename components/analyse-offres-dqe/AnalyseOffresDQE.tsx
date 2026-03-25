// ============================================
// Analyse des offres DQE
// Charge les DQE Excel par lot / par candidat et affiche une analyse comparative
// ============================================

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend as RechartsLegend,
  ResponsiveContainer,
} from 'recharts';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';
import { ProcedureSelector } from '../dce-complet/components/shared/ProcedureSelector';
import { ProcedureHeader } from '../dce-complet/components/shared/ProcedureHeader';
import { useProcedure } from '../dce-complet/hooks/useProcedureLoader';
import { parseDQEExcelFile, getExcelSheetNames, type ParsedDQERow, type ParseDQEResult } from './utils/parseDQEExcel';
import { AnalyseOffresDQEService } from './services/analyseOffresDQEService';
import type { ProjectData } from '../../types';
import type { LotConfiguration } from '../dce-complet/types';
import type { DepotsData } from '../../types/depots';
import { AnalyseOffresDQETechnique } from './components/AnalyseOffresDQETechnique';
import { AnalyseOffresDQESynthese } from './components/AnalyseOffresDQESynthese';

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
  const [activeTab, setActiveTab] = useState<string>('dashboard');
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
  /** Map lotNum -> analyse_id Supabase — utilisé par les Parties 2 et 3 */
  const [analyseIdByLot, setAnalyseIdByLot] = useState<Record<string, string>>({});
  /** Section active : Partie 1 financière, Partie 2 technique, Partie 3 synthèse */
  const [activeSection, setActiveSection] = useState<'financier' | 'technique' | 'synthese'>('financier');
  const [hasSavedData, setHasSavedData] = useState(false);
  const [loadingFromSupabase, setLoadingFromSupabase] = useState(false);
  const [savingToSupabase, setSavingToSupabase] = useState(false);
  const [fullPageCandidatId, setFullPageCandidatId] = useState<string | null>(null);
  const [fullPageComparison, setFullPageComparison] = useState(false);
  const [lastManualSaveAt, setLastManualSaveAt] = useState<string | null>(null);
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [selectedDepotCandidat, setSelectedDepotCandidat] = useState<string>('');

  // Scroll synchronisé pour la vue comparaison (barre en haut + en bas du tableau)
  const comparisonScrollTopRef = useRef<HTMLDivElement | null>(null);
  const comparisonScrollBottomRef = useRef<HTMLDivElement | null>(null);
  const [comparisonScrollWidth, setComparisonScrollWidth] = useState<number | null>(null);

  const handleComparisonTopScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!comparisonScrollBottomRef.current) return;
      const scrollLeft = e.currentTarget.scrollLeft;
      if (comparisonScrollBottomRef.current.scrollLeft !== scrollLeft) {
        comparisonScrollBottomRef.current.scrollLeft = scrollLeft;
      }
    },
    [comparisonScrollBottomRef],
  );

  const handleComparisonBottomScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (!comparisonScrollTopRef.current) return;
      const scrollLeft = e.currentTarget.scrollLeft;
      if (comparisonScrollTopRef.current.scrollLeft !== scrollLeft) {
        comparisonScrollTopRef.current.scrollLeft = scrollLeft;
      }
    },
    [comparisonScrollTopRef],
  );

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
      // Note: Lecture partagée - tous les users peuvent voir toutes les procédures
      const { data: dceRow, error: dceError } = await supabase
        .from('dce')
        .select('configuration_globale')
        .eq('numero_procedure', numeroProcedure)
        .single();

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

  // Candidats proposés depuis le registre des dépôts (si disponible sur la procédure)
  const depotCandidatesForLot = useMemo(() => {
    if (!procedureInfo || !(procedureInfo as any).depots) return [];

    let depots: any = (procedureInfo as any).depots;
    try {
      if (typeof depots === 'string') {
        depots = JSON.parse(depots);
      }
    } catch (e) {
      console.error('[AnalyseOffresDQE] Erreur parsing depots:', e);
      return [];
    }

    const depotsData = depots as DepotsData;
    const entreprises = Array.isArray(depotsData?.entreprises) ? depotsData.entreprises : [];
    if (!entreprises.length) return [];

    const lotLabel = String(selectedLotNum);

    // Filtrer par lot quand l'info est disponible, sinon garder
    const filtered = entreprises.filter((e: any) => {
      const lot = (e.lot || '').toString().toLowerCase();
      if (!lot) return true;
      if (lot.includes('unique')) return true;
      return lot.includes(lotLabel);
    });

    const namesSet = new Set<string>();
    const results: string[] = [];

    filtered.forEach((e: any) => {
      const name = (e.societe || e.nom || e.raisonSociale || '').trim();
      if (name && !namesSet.has(name.toLowerCase())) {
        namesSet.add(name.toLowerCase());
        results.push(name);
      }
    });

    return results.sort((a, b) => a.localeCompare(b, 'fr', { sensitivity: 'base' }));
  }, [procedureInfo, selectedLotNum]);

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
          rows: lignes.map((ligne) => {
            const anyLigne = ligne as any;
            const prixUnitaire =
              anyLigne.prix_unitaire ??
              anyLigne.prix_unitaire_ht ??
              anyLigne.pu_ht ??
              anyLigne.prixUnitaire ??
              0;
            const prixTotal =
              anyLigne.prix_total ??
              anyLigne.montant_ht ??
              anyLigne.montantHT ??
              0;
            return {
              numero: anyLigne.numero || anyLigne.code_article || '',
              designation: anyLigne.designation || '',
              unite: anyLigne.unite || '',
              quantite: anyLigne.quantite || 0,
              prix_unitaire: prixUnitaire,
              prix_total: prixTotal,
            };
          }),
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

      // Peupler analyseIdByLot pour les Parties 2 et 3
      const idsParLot: Record<string, string> = {};
      for (const lotKey of Object.keys(candidatsComplets)) {
        const lotNum = Number(lotKey);
        if (!Number.isFinite(lotNum)) continue;
        const lotConfig = lotsConfig.find(
          l => parseInt(l.numero, 10) === lotNum || l.numero === String(lotNum)
        );
        const nomLot = lotConfig?.intitule ?? null;
        try {
          const analyse = await AnalyseOffresDQEService.getOrCreateAnalyse(numeroProcedure, lotNum, nomLot);
          if (analyse) idsParLot[String(lotNum)] = analyse.id;
        } catch { /* on continue */ }
      }
      setAnalyseIdByLot(prev => ({ ...prev, ...idsParLot }));

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
      // Créer ou récupérer l'analyse pour ce lot
      const lotConfig = lotsConfig.find(
        (l) => parseInt(l.numero, 10) === lotNum || l.numero === String(lotNum)
      );
      const nomLot = lotConfig?.intitule ?? null;

      const analyse = await AnalyseOffresDQEService.getOrCreateAnalyse(
        numeroProcedure,
        lotNum,
        nomLot
      );
      
      if (!analyse) {
        throw new Error('Impossible de créer ou récupérer l\'analyse');
      }
      
      setAnalyseId(analyse.id);
      setAnalyseIdByLot(prev => ({ ...prev, [String(lotNum)]: analyse.id }));

      // Préparer les lignes au bon format attendu par le service local (noms simples)
      const lignes = (candidat.rows || []).map((row) => ({
        numero: row.numero || '',
        designation: row.designation || '',
        unite: row.unite || '',
        quantite: row.quantite || 0,
        prix_unitaire: row.prix_unitaire || 0,
        prix_total: row.prix_total || 0,
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

  // Mesure dynamique de la largeur du contenu pour aligner les deux barres de scroll
  useEffect(() => {
    if (comparisonScrollBottomRef.current) {
      setComparisonScrollWidth(comparisonScrollBottomRef.current.scrollWidth);
    }
  }, [analysisCandidats, analysisRows]);

  // Notes prix selon la méthode GRAMP (proportionnelle inverse) sur 100 points :
  // Note = (Prix le plus bas / Prix de l'offre) × 100
  const scoresByCandidatId = useMemo(() => {
    if (analysisCandidats.length === 0) return {} as Record<string, number>;

    const totals = analysisCandidats
      .map((c) => c.totalHT || 0)
      .filter((v) => v > 0);
    if (totals.length === 0) return {} as Record<string, number>;

    const minTotal = Math.min(...totals);
    const maxScore = 100;
    const scores: Record<string, number> = {};

    analysisCandidats.forEach((c) => {
      const total = c.totalHT || 0;
      if (total <= 0) {
        scores[c.id] = 0;
      } else {
        const ratio = minTotal / total;
        const score = Math.round(Math.min(maxScore, Math.max(0, ratio * maxScore)));
        scores[c.id] = score;
      }
    });

    return scores;
  }, [analysisCandidats]);

  // Données agrégées pour les graphiques (Vue d'ensemble)
  const dashboardChartData = useMemo(() => {
    if (analysisCandidats.length === 0 || analysisRows.length === 0) return [];

    // Regrouper par "catégorie" simple à partir du début du code article
    // Exemple: PC-001 -> "PC", ECR-001 -> "ECR"
    const byCategory: Record<string, { name: string; [key: string]: number | string }> = {};

    analysisCandidats.forEach((candidat) => {
      candidat.rows.forEach((row) => {
        const code = row.numero || '';
        const prefix = code.split('-')[0] || 'Autres';
        const catKey = prefix.toUpperCase();

        if (!byCategory[catKey]) {
          byCategory[catKey] = { name: catKey };
        }
        const key = candidat.name;
        const montant = row.prix_total || 0;
        byCategory[catKey][key] = ((byCategory[catKey][key] as number) || 0) + montant;
      });
    });

    return Object.values(byCategory);
  }, [analysisCandidats, analysisRows]);

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

  // Sauvegarde manuelle de l'état courant (toutes les offres chargées)
  const handleManualSave = async () => {
    if (!numeroProcedure || numeroProcedure.length !== 5) return;
    if (Object.keys(candidatsByLot).length === 0) return;

    setSavingToSupabase(true);
    setError(null);
    try {
      // Réinitialiser toutes les analyses stockées pour cette procédure
      await AnalyseOffresDQEService.resetAnalyse(numeroProcedure);

      // Reconstruire depuis l'état courant pour chaque lot
      for (const [lotKey, candidatsLot] of Object.entries(candidatsByLot)) {
        const lotNum = Number(lotKey);
        if (!Number.isFinite(lotNum)) continue;

        const lotConfig = lotsConfig.find(
          (l) => parseInt(l.numero, 10) === lotNum || l.numero === String(lotNum)
        );
        const nomLot = lotConfig?.intitule ?? null;

        const analyse = await AnalyseOffresDQEService.getOrCreateAnalyse(
          numeroProcedure,
          lotNum,
          nomLot
        );

        if (!analyse) {
          // On log l'erreur mais on continue avec les autres lots
          console.error("Impossible de créer ou récupérer l'analyse pour le lot", lotNum);
          continue;
        }

        for (const candidat of candidatsLot) {
          const lignes = (candidat.rows || []).map((row) => ({
            numero: row.numero || '',
            designation: row.designation || '',
            unite: row.unite || '',
            quantite: row.quantite || 0,
            prix_unitaire: row.prix_unitaire || 0,
            prix_total: row.prix_total || 0,
          }));

          await AnalyseOffresDQEService.saveCandidatDQE(
            analyse.id,
            lotNum,
            nomLot,
            candidat.name,
            candidat.totalHT || 0,
            candidat.totalTVA || 0,
            candidat.totalTTC || 0,
            lignes
          );
        }
      }

      setHasSavedData(true);
      // Mettre à jour analyseIdByLot pour les Parties 2 et 3 (depuis handleManualSave)
      // Les IDs ont déjà été mis à jour lot par lot via saveCandidatDQE → getOrCreateAnalyse
      // Une passe complémentaire pour s’assurer que tous les lots sont couverts
      {
        const idsParLot: Record<string, string> = {};
        for (const [lotKey] of Object.entries(candidatsByLot)) {
          const lotNum = Number(lotKey);
          if (!Number.isFinite(lotNum)) continue;
          const lotConfig = lotsConfig.find(l => parseInt(l.numero, 10) === lotNum || l.numero === String(lotNum));
          const nomLot = lotConfig?.intitule ?? null;
          try {
            const a = await AnalyseOffresDQEService.getOrCreateAnalyse(numeroProcedure, lotNum, nomLot);
            if (a) idsParLot[String(lotNum)] = a.id;
          } catch { /* on continue */ }
        }
        setAnalyseIdByLot(prev => ({ ...prev, ...idsParLot }));
      }
      console.log("✅ Sauvegarde manuelle de l’analyse DQE effectuée");
      setLastManualSaveAt(
        new Date().toLocaleString('fr-FR', {
          day: '2-digit',
          month: '2-digit',
          year: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })
      );
    } catch (err: any) {
      console.error('Erreur sauvegarde manuelle DQE:', err);
      setError(err.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSavingToSupabase(false);
    }
  };

  // Vue plein écran pour la comparaison multi-offres
  if (fullPageComparison && analysisCandidats.length >= 2 && analysisRows.length > 0) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFullPageComparison(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <div>
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Synthèse comparative ligne par ligne
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Procédure {numeroProcedure} — Lot {selectedLotNum} — {getLotName(selectedLotNum)}
                </p>
                <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  Montants comparés : <span className="font-semibold">Montants HT par ligne</span>.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={exportToExcel}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] px-3 py-1.5 text-xs font-semibold text-white shadow-md"
            >
              <FileDown className="h-3.5 w-3.5" />
              Exporter Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <div className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-auto bg-white dark:bg-gray-900">
            <table className="min-w-full text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">
                    Code
                  </th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 min-w-[220px]">
                    Désignation
                  </th>
                  {analysisCandidats.map((c) => (
                    <th
                      key={c.id}
                      className="px-3 py-2 text-right font-semibold text-[#2F5B58] dark:text-teal-300 whitespace-nowrap"
                    >
                      {c.name}
                    </th>
                  ))}
                  <th className="px-3 py-2 text-right font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                    Prix moyen
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                    Min
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                    Max
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap">
                    Écart
                  </th>
                </tr>
              </thead>
              <tbody>
                {analysisRows.map((row, rowIndex) => {
                  const valuesByCandidat = analysisCandidats.map((c) => {
                    const r = c.rows[rowIndex] as any;
                    if (!r) return 0;
                    return (
                      r.prix_total ??
                      r.prixTotal ??
                      r.montantHT ??
                      r.montant_ht ??
                      0
                    );
                  });
                  const min = Math.min(...valuesByCandidat);
                  const max = Math.max(...valuesByCandidat);
                  const ecart = max - min;
                  const somme = valuesByCandidat.reduce((s, v) => s + v, 0);
                  const nbPositifs = valuesByCandidat.filter((v) => v > 0).length;
                  const moyenne = nbPositifs > 0 ? somme / nbPositifs : 0;

                  return (
                    <tr
                      key={`${row.numero}-${rowIndex}`}
                      className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                    >
                      <td className="px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-300">
                        {row.numero || '—'}
                      </td>
                      <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                        {row.designation || '—'}
                      </td>
                      {analysisCandidats.map((c, idx) => {
                        const r = c.rows[rowIndex] as any;
                        const val =
                          r?.prix_total ??
                          r?.prixTotal ??
                          r?.montantHT ??
                          r?.montant_ht ??
                          0;
                        const isMin = val > 0 && val === min;
                        return (
                          <td
                            key={`${c.id}-${idx}`}
                            className={`px-3 py-2 text-right tabular-nums font-medium ${
                              isMin
                                ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                                : 'text-slate-800 dark:text-slate-100'
                            }`}
                          >
                            {val > 0
                              ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                              : '—'}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-right tabular-nums font-medium text-indigo-700 dark:text-indigo-300">
                        {moyenne > 0 ? moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-300">
                        {min > 0 ? min.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-300">
                        {max > 0 ? max.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-700 dark:text-rose-300">
                        {ecart > 0 ? ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // Vue plein écran pour un candidat (offre) avec toutes les colonnes BPU
  const fullPageIndex = fullPageCandidatId
    ? currentCandidats.findIndex((c) => c.id === fullPageCandidatId)
    : -1;
  const fullPageCandidat =
    fullPageIndex >= 0 ? currentCandidats[fullPageIndex] : null;

  if (fullPageCandidat) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-900">
        {/* Header plein écran */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-900/95 backdrop-blur px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFullPageCandidatId(null)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {fullPageCandidat.name}
                  </span>
                  {currentCandidats.every(
                    (c) => fullPageCandidat.totalHT <= c.totalHT
                  ) && (
                    <span className="inline-flex items-center rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      Moins-disant
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Procédure {numeroProcedure} — Lot {selectedLotNum} —{' '}
                  {getLotName(selectedLotNum)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-4 text-xs sm:text-sm">
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total HT
                  </div>
                  <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {fullPageCandidat.totalHT.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    €
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    TVA estimée
                  </div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {fullPageCandidat.totalTVA.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    €
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Total TTC
                  </div>
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {fullPageCandidat.totalTTC.toLocaleString('fr-FR', {
                      minimumFractionDigits: 2,
                    })}{' '}
                    €
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={exportToExcel}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] px-3 py-1.5 text-xs font-semibold text-white shadow-md"
              >
                <FileDown className="h-3.5 w-3.5" />
                Exporter Excel
              </button>

              {currentCandidats.length > 1 && (
                <div className="ml-2 hidden sm:flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (fullPageIndex > 0) {
                        setFullPageCandidatId(
                          currentCandidats[fullPageIndex - 1].id
                        );
                      }
                    }}
                    disabled={fullPageIndex <= 0}
                    className="inline-flex items-center rounded-l-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (fullPageIndex < currentCandidats.length - 1) {
                        setFullPageCandidatId(
                          currentCandidats[fullPageIndex + 1].id
                        );
                      }
                    }}
                    disabled={fullPageIndex >= currentCandidats.length - 1}
                    className="inline-flex items-center rounded-r-lg border border-l-0 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-xs text-gray-700 dark:text-gray-200 disabled:opacity-50"
                  >
                    ▶
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tableau plein écran */}
        <div className="flex-1 overflow-auto px-4 sm:px-6 py-4 bg-gray-50 dark:bg-gray-900">
          <table className="min-w-full border-collapse text-xs sm:text-sm bg-white dark:bg-gray-900 shadow-sm">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Code
                </th>
                <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Désignation
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Unité
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Qté
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  PU HT
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Éco-contrib HT
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Montant HT
                </th>
                <th className="px-3 py-2 text-center font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  TVA (%)
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Montant TVA
                </th>
                <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                  Montant TTC
                </th>
              </tr>
            </thead>
            <tbody>
              {fullPageCandidat.rows.map((row, idx) => (
                <tr
                  key={`${fullPageCandidat.id}-${idx}`}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                >
                  <td className="px-3 py-2 font-mono text-[11px] text-gray-700 dark:text-gray-200">
                    {row.numero || '—'}
                  </td>
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                    {row.designation || '—'}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">
                    {row.unite || '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                    {row.quantite ?? '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                    {row.prix_unitaire
                      ? row.prix_unitaire.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                    {row.eco_contrib
                      ? row.eco_contrib.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
                    {row.prix_total
                      ? row.prix_total.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-center text-gray-700 dark:text-gray-200">
                    {row.tva_pct ? `${row.tva_pct}%` : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                    {row.montant_tva
                      ? row.montant_tva.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                    {row.montant_ttc
                      ? row.montant_ttc.toLocaleString('fr-FR', {
                          minimumFractionDigits: 2,
                        })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-4 sm:px-6 py-6 sm:py-8">
        {onClose && (
          <button
            onClick={onClose}
            className="mb-4 inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour au menu précédent
          </button>
        )}

        {/* Écran de bienvenue : sélection de la procédure */}
        {showWelcome ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="max-w-xl w-full rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-8 text-center shadow-lg">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                <BarChart3 className="h-7 w-7" />
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white mb-2">
                Analyse des offres DQE
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">
                Saisissez un numéro de procédure pour démarrer l’analyse comparative des offres
                (DQE) de vos candidats.
              </p>
              <div className="text-left space-y-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                  Numéro de procédure (5 chiffres)
                </label>
                <ProcedureSelector
                  value={numeroProcedure}
                  onChange={setNumeroProcedure}
                  onProcedureSelected={() => {}}
                />
                {procedureResult.error && !procedureResult.isValid && (
                  <div className="mt-2 flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-2 py-1.5 text-[11px] text-red-700 dark:text-red-100">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span>{procedureResult.error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* En-tête de procédure (inspiré de la maquette, mais aux couleurs de l'app) */}
            <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 sm:py-5 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                    <span>Procédure</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{numeroProcedure}</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span>Lot</span>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-300">{selectedLotNum}</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Analyse</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                      <span>PROC-{numeroProcedure}</span>
                    </div>
                    {procedureInfo?.['Nom de la procédure'] && (
                      <div className="space-y-0.5 text-xs sm:text-sm text-gray-800 dark:text-gray-100">
                        <div className="font-medium">
                          {procedureInfo['Nom de la procédure']}
                        </div>
                        {procedureInfo['Acheteur'] && (
                          <div className="text-gray-500 dark:text-gray-300">
                            Acheteur : {procedureInfo['Acheteur']}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300">
                  {loadingDCE && (
                    <div className="flex items-center gap-1.5">
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600 dark:text-emerald-300" />
                      <span>Chargement des lots…</span>
                    </div>
                  )}
                  {error && (
                    <div className="flex items-center gap-1.5 rounded-md border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 px-3 py-1.5 text-red-700 dark:text-red-100">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Bandeau mode d’emploi */}
            <div className="mb-6 rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-4 sm:px-6 sm:py-5">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    Mode de fonctionnement — Analyse comparative multi-candidats
                  </p>
                  <p className="text-gray-700 dark:text-gray-200">
                    1. Sélectionnez le lot, 2. Chargez les DQE des candidats (Excel), 3. Comparez
                    les montants dans les onglets ci-dessous.
                  </p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    ✓ Les données sont sauvegardées automatiquement par le service d’analyse DQE et
                    peuvent être rechargées plus tard.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation 3 parties */}
            {(() => {
              const currentAnalyseId = analyseIdByLot[String(selectedLotNum)] ?? analyseId;
              return (
                <div className="mb-4 flex gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm">
                  <button
                    onClick={() => setActiveSection('financier')}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                      activeSection === 'financier'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    💰 Partie 1 — Analyse financière
                  </button>
                  <button
                    onClick={() => setActiveSection('technique')}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                      activeSection === 'technique'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    📋 Partie 2 — Analyse technique
                  </button>
                  <button
                    onClick={() => setActiveSection('synthese')}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-all ${
                      activeSection === 'synthese'
                        ? 'bg-teal-600 text-white shadow'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    🏆 Partie 3 — Synthèse
                  </button>
                </div>
              );
            })()}

            {/* Parties 2 et 3 — rendues en dehors du bloc financier */}
            {activeSection === 'technique' && (() => {
              const currentAnalyseId = analyseIdByLot[String(selectedLotNum)] ?? analyseId;
              const currentCandidatsForSection = (candidatsByLot[String(selectedLotNum)] || []).map(c => ({
                id: c.id,
                name: c.name,
                totalHT: c.totalHT,
              }));
              return (
                <AnalyseOffresDQETechnique
                  numeroProcedure={numeroProcedure}
                  selectedLotNum={selectedLotNum}
                  candidats={currentCandidatsForSection}
                  analyseId={currentAnalyseId}
                  lotsConfig={lotsConfig}
                />
              );
            })()}

            {activeSection === 'synthese' && (() => {
              const currentAnalyseId = analyseIdByLot[String(selectedLotNum)] ?? analyseId;
              const currentCandidatsForSection = (candidatsByLot[String(selectedLotNum)] || []).map(c => ({
                id: c.id,
                name: c.name,
                totalHT: c.totalHT,
              }));
              return (
                <AnalyseOffresDQESynthese
                  numeroProcedure={numeroProcedure}
                  selectedLotNum={selectedLotNum}
                  candidats={currentCandidatsForSection}
                  analyseId={currentAnalyseId}
                  lotsConfig={lotsConfig}
                  procedureInfo={procedureInfo}
                />
              );
            })()}

            {/* Partie 1 — Analyse financière DQE (code existant inchangé) */}
            {activeSection === 'financier' && <>

            {/* Sélection du lot + accès sauvegardes */}
            <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 sm:py-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Lot à analyser
                  </h2>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-300">{getLotName(selectedLotNum)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleManualSave}
                    disabled={savingToSupabase || Object.keys(candidatsByLot).length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {savingToSupabase ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    {savingToSupabase ? 'Sauvegarde…' : 'Sauvegarder maintenant'}
                  </button>
                  {hasSavedData && (
                    <button
                      type="button"
                      onClick={handleLoadFromSupabase}
                      disabled={loadingFromSupabase}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingFromSupabase ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Database className="h-3.5 w-3.5" />
                      )}
                      {loadingFromSupabase ? 'Chargement…' : 'Charger une sauvegarde'}
                    </button>
                  )}
                  {hasSavedData && (
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                      <CheckCircle className="h-3.5 w-3.5" />
                      Données sauvegardées
                    </div>
                  )}
                </div>
              </div>

              {lastManualSaveAt && (
                <div className="mb-3 text-[11px] text-emerald-700 dark:text-emerald-300">
                  ✅ Sauvegarde manuelle effectuée à {lastManualSaveAt}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {Array.from({ length: totalLots }, (_, i) => i + 1).map((num) => (
                  <button
                    key={num}
                    onClick={() => {
                      setSelectedLotNum(num);
                      loadDQEForLot(num);
                    }}
                    disabled={loadingDQE}
                    className={`rounded-full px-4 py-1.5 text-xs sm:text-sm font-medium transition ${
                      selectedLotNum === num
                        ? 'bg-[#2F5B58] text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
                    } disabled:cursor-not-allowed disabled:opacity-60`}
                  >
                    {loadingDQE && selectedLotNum === num ? (
                      <Loader2 className="inline h-4 w-4 animate-spin" />
                    ) : (
                      `Lot ${num}`
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Charger le DQE Excel d’un candidat */}
            <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-5 sm:px-6 sm:py-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                  Charger le DQE Excel d’un candidat — Lot {selectedLotNum}
                </h2>
                {currentCandidats.length > 0 && (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Les fichiers s’ajoutent sans effacer les précédents
                  </div>
                )}
              </div>

              {!pendingFile ? (
                <div className="grid gap-4 md:grid-cols-[minmax(0,260px),1fr] md:items-end">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Nom du candidat
                    </label>

                    {/* Sélecteur depuis le registre des dépôts (si disponible) */}
                    {depotCandidatesForLot.length > 0 && (
                      <div className="mb-2">
                        <select
                          value={selectedDepotCandidat}
                          onChange={(e) => {
                            const value = e.target.value;
                            setSelectedDepotCandidat(value);
                            if (value) {
                              setNewCandidatName(value);
                            }
                          }}
                          className="mb-1 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                        >
                          <option value="">
                            — Sélectionner dans le registre des dépôts —
                          </option>
                          {depotCandidatesForLot.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Les candidats proposés proviennent du registre des dépôts de cette
                          procédure (filtré sur le lot si renseigné).
                        </p>
                      </div>
                    )}

                    {/* Saisie libre toujours possible */}
                    <input
                      type="text"
                      value={newCandidatName}
                      onChange={(e) => {
                        setNewCandidatName(e.target.value);
                        if (selectedDepotCandidat && e.target.value !== selectedDepotCandidat) {
                          setSelectedDepotCandidat('');
                        }
                      }}
                      placeholder="Ex : Entreprise A"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    />
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      Laissez vide pour utiliser le nom du fichier, ou choisissez un candidat
                      depuis le registre puis ajustez le nom si besoin.
                    </p>
                  </div>

                  <div className="flex flex-col gap-3">
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
                      className="inline-flex w-fit items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] px-4 py-3 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Chargement…
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Choisir un fichier DQE Excel
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Fichiers DQE ou BPU (.xlsx, .xls, .csv). Les colonnes sont mappées
                      automatiquement.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4">
                    <div className="mb-3 flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <FileSpreadsheet className="h-5 w-5 text-blue-500 dark:text-blue-300" />
                      <span className="font-medium">Fichier sélectionné : {pendingFile.name}</span>
                    </div>
                    <label className="mb-2 block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Choisir l’onglet à importer
                    </label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                    >
                      {availableSheets.map((sheet) => (
                        <option key={sheet} value={sheet}>
                          {sheet}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                      {availableSheets.length} feuille{availableSheets.length > 1 ? 's' : ''} trouvée
                      {availableSheets.length > 1 ? 's' : ''} dans ce fichier.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={confirmSheetAndImport}
                      disabled={loadingFile || !selectedSheet}
                      className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] px-4 py-2 text-sm font-semibold text-white shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loadingFile ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Import en cours…
                        </>
                      ) : (
                        <>
                          <FileSpreadsheet className="h-4 w-4" />
                          Importer cet onglet
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelSheetSelection}
                      disabled={loadingFile}
                      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Liste des candidats chargés pour ce lot */}
            {currentCandidats.length > 0 && (
              <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4 sm:px-6 sm:py-5">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                    Candidats chargés pour le lot {selectedLotNum}
                  </h2>
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-[11px] text-blue-700 dark:text-blue-200">
                    <BarChart3 className="h-3.5 w-3.5 text-blue-500 dark:text-blue-300" />
                    {currentCandidats.length} candidat
                    {currentCandidats.length > 1 ? 's' : ''}
                  </div>
                </div>

                <ul className="space-y-2 text-sm">
                  {(showAllCandidates ? currentCandidats : currentCandidats.slice(0, 3)).map(
                    (c, index) => (
                      <li
                        key={c.id}
                        className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/60 px-3 py-2"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2F5B58] text-xs font-bold text-white">
                            {index + 1}
                          </div>
                          <FileSpreadsheet className="h-4 w-4 text-[#2F5B58]" />
                          <span className="font-medium text-gray-900 dark:text-white">
                            {c.name}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            Total HT :{' '}
                            {c.totalHT.toLocaleString('fr-FR', {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            € — {c.rows.length} ligne{c.rows.length > 1 ? 's' : ''}
                          </span>
                          <span className="text-[11px] text-gray-500 dark:text-gray-300">
                            Note :{' '}
                            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                              {scoresByCandidatId[c.id] ?? 0}
                            </span>
                            /100
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCandidat(selectedLotNum, c.id)}
                          className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-900/30"
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    )
                  )}
                </ul>

                {currentCandidats.length > 3 && (
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => setShowAllCandidates((v) => !v)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-[#2F5B58] hover:underline"
                    >
                      {showAllCandidates
                        ? 'Masquer les offres supplémentaires'
                        : `Afficher les ${currentCandidats.length - 3} autre(s) offre(s)`}
                    </button>
                  </div>
                )}

                {currentCandidats.length >= 2 && (
                  <div className="mt-3 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-200">
                    ✅ Analyse comparative activée : utilisez les onglets ci-dessous pour comparer
                    les offres ligne par ligne.
                  </div>
                )}
              </div>
            )}

            {/* Zone d'analyse avec onglets (inspirée de la maquette HTML, mais en thème clair) */}
            {analysisCandidats.length >= 1 && analysisRows.length > 0 && (
              <div className="mt-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
                {/* En-tête / onglets */}
                <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/60 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                    <span>Procédure</span>
                    <span className="font-semibold text-[#2F5B58]">{numeroProcedure}</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span>Lot</span>
                    <span className="font-semibold text-[#2F5B58]">{selectedLotNum}</span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">Analyse</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-gray-500 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {analysisCandidats.length} offre{analysisCandidats.length > 1 ? 's' : ''} chargée
                    </span>
                    <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                    <span className="hidden sm:inline">
                      {analysisRows.length} ligne{analysisRows.length > 1 ? 's' : ''} comparée{analysisRows.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>

                {/* Barre d'onglets */}
                <div className="border-b border-gray-200 dark:border-gray-700 px-3 py-2 flex gap-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap transition ${
                      activeTab === 'dashboard'
                        ? 'bg-[#2F5B58] text-white shadow-sm'
                        : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    📊 Vue d'ensemble
                  </button>

                  {analysisCandidats.length >= 2 && (
                    <button
                      type="button"
                      onClick={() => setActiveTab('comparaison')}
                      className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                        activeTab === 'comparaison'
                          ? 'bg-gray-900 text-white dark:bg-gray-800'
                          : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }`}
                    >
                      ⚖️ Comparaison
                    </button>
                  )}

                  {analysisCandidats.map((c) => {
                    const isWinner = analysisCandidats.every((other) => c.totalHT <= other.totalHT);
                    const tabId = c.id;
                    return (
                      <button
                        key={tabId}
                        type="button"
                        onClick={() => setActiveTab(tabId)}
                        className={`px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap flex items-center gap-1.5 transition ${
                          activeTab === tabId
                            ? 'bg-gray-900 text-white dark:bg-gray-800'
                            : 'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <span>🏷️ {c.name}</span>
                        {isWinner && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                            Moins-disant
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Contenu des onglets */}
                <div className="p-4 sm:p-6 space-y-6">
                  {/* Onglet Dashboard */}
                  {activeTab === 'dashboard' && (
                    <>
                      {analysisCandidats.length >= 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                          {/* Offres reçues */}
                          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                  Offres reçues
                                </div>
                                <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                  {analysisCandidats.length}
                                </div>
                                <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                  {analysisCandidats.map((c) => c.name).join(' • ')}
                                </div>
                              </div>
                              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                                <BarChart3 className="w-4 h-4" />
                              </div>
                            </div>
                          </div>

                          {/* Montant total HT */}
                          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
                            {(() => {
                              const totals = analysisCandidats.map((c) => c.totalHT);
                              const minTotal = Math.min(...totals);
                              const maxTotal = Math.max(...totals);
                              const avg = totals.reduce((s, v) => s + v, 0) / totals.length;
                              return (
                                <>
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Montant moyen HT
                                      </div>
                                      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                        {avg.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} €
                                      </div>
                                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        Fourchette : {minTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € –{' '}
                                        {maxTotal.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €
                                      </div>
                                    </div>
                                    <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-700 dark:text-emerald-300">
                                      <FileDown className="w-4 h-4" />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Écart min / max */}
                          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-amber-400 to-orange-500" />
                            {(() => {
                              const totals = analysisCandidats.map((c) => c.totalHT);
                              const minTotal = Math.min(...totals);
                              const maxTotal = Math.max(...totals);
                              const ecart = maxTotal - minTotal;
                              const ecartPct = minTotal > 0 ? (ecart / minTotal) * 100 : 0;
                              return (
                                <>
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Écart min / max
                                      </div>
                                      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
                                        {ecartPct.toFixed(1)}%
                                      </div>
                                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {ecart.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € de différence
                                      </div>
                                    </div>
                                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-amber-700 dark:text-amber-300">
                                      <AlertCircle className="w-4 h-4" />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>

                          {/* Moins-disant */}
                          <div className="relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 overflow-hidden">
                            <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-teal-400 to-emerald-500" />
                            {(() => {
                              const winner = analysisCandidats.reduce((prev, curr) =>
                                curr.totalHT < prev.totalHT ? curr : prev
                              );
                              return (
                                <>
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                        Moins-disant
                                      </div>
                                      <div className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                                        {winner.name}
                                      </div>
                                      <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
                                        {winner.totalHT.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} € HT
                                      </div>
                                    </div>
                                    <div className="w-9 h-9 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-md">
                                      <CheckCircle className="w-4 h-4" />
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Graphique comparatif par catégorie (Recharts) */}
                      <div className="mt-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 sm:p-6">
                        <div className="mb-3 flex items-center justify-between gap-3">
                          <div>
                            <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                              Graphique de comparaison par catégorie
                            </div>
                            <div className="text-[11px] text-gray-500 dark:text-gray-400">
                              Montants HT par catégorie et par offre (agrégés à partir du DQE).
                            </div>
                          </div>
                        </div>
                        <div className="h-[260px] sm:h-[320px]">
                          {dashboardChartData.length === 0 ? (
                            <div className="flex h-full items-center justify-center text-[11px] text-gray-500 dark:text-gray-400">
                              Importez au moins une offre complète pour activer le graphique.
                            </div>
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={dashboardChartData}
                                margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                              >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                <XAxis
                                  dataKey="name"
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <YAxis
                                  tickFormatter={(v) =>
                                    typeof v === 'number'
                                      ? `${(v / 1000).toLocaleString('fr-FR', {
                                          maximumFractionDigits: 0,
                                        })} k€`
                                      : v
                                  }
                                  tick={{ fontSize: 11, fill: '#6b7280' }}
                                  axisLine={{ stroke: '#e5e7eb' }}
                                />
                                <RechartsTooltip
                                  formatter={(value: any) =>
                                    typeof value === 'number'
                                      ? `${value.toLocaleString('fr-FR', {
                                          minimumFractionDigits: 2,
                                        })} €`
                                      : value
                                  }
                                />
                                <RechartsLegend wrapperStyle={{ fontSize: 11 }} />
                                {analysisCandidats.map((c, idx) => {
                                  const colors = ['#16a34a', '#0f766e', '#2563eb', '#f97316', '#7c3aed'];
                                  const color = colors[idx % colors.length];
                                  return (
                                    <Bar
                                      key={c.id}
                                      dataKey={c.name}
                                      stackId="offres"
                                      fill={color}
                                      radius={idx === analysisCandidats.length - 1 ? [4, 4, 0, 0] : 0}
                                      maxBarSize={48}
                                    />
                                  );
                                })}
                              </BarChart>
                            </ResponsiveContainer>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Onglet par candidat */}
                  {analysisCandidats.map((candidat) => {
                    if (activeTab !== candidat.id) return null;
                    const isWinner = analysisCandidats.every((c) => candidat.totalHT <= c.totalHT);
                    const score = scoresByCandidatId[candidat.id] ?? null;
                    return (
                      <div key={candidat.id} className="space-y-4">
                        {/* En-tête fournisseur (clair, vert appli) */}
                        <div className="flex flex-col lg:flex-row items-start justify-between gap-4 rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 px-4 py-4 sm:px-6 sm:py-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                                🏪 {candidat.name}
                              </h3>
                              {isWinner && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700">
                                  Moins-disant
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
                              {candidat.rows.length} article{candidat.rows.length > 1 ? 's' : ''} dans le DQE
                            </p>
                            {score !== null && (
                              <p className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-300">
                                Note de prix :{' '}
                                <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                                  {score}
                                </span>
                                /100
                              </p>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Total HT
                              </div>
                              <div className="text-lg font-semibold text-emerald-700 dark:text-emerald-300">
                                {candidat.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                TVA estimée
                              </div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {candidat.totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                                Total TTC
                              </div>
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                                {candidat.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Table DQE du candidat (structure inspirée de la maquette) */}
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                            <div className="relative w-full md:max-w-xs">
                              <Search className="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                              <input
                                type="text"
                                placeholder="Rechercher un article..."
                                className="w-full pl-9 pr-3 py-2 rounded-lg bg-white dark:bg-gray-900/70 border border-gray-300 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/60"
                                disabled
                              />
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setFullPageCandidatId(candidat.id)}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/60 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <ArrowLeft className="h-3.5 w-3.5 rotate-90" />
                                Pleine page
                              </button>
                              <button
                                type="button"
                                onClick={exportToExcel}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-xs font-semibold text-white shadow-md"
                              >
                                <FileDown className="w-3.5 h-3.5" />
                                Exporter Excel
                              </button>
                            </div>
                          </div>

                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-auto">
                            <table className="min-w-full text-xs sm:text-sm">
                              <thead className="bg-gray-100 dark:bg-gray-800/80">
                                <tr>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                    Code
                                  </th>
                                  <th className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                    Désignation
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                    Qté
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                    PU HT
                                  </th>
                                  <th className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-200 border-b border-gray-200 dark:border-gray-700">
                                    Montant HT
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {candidat.rows.map((row, idx) => {
                                  const anyRow = row as any;
                                  const unitPrice =
                                    anyRow.prix_unitaire ??
                                    anyRow.prixUnitaire ??
                                    anyRow.pu_ht ??
                                    anyRow.pu ??
                                    0;
                                  const lineTotal =
                                    anyRow.prix_total ??
                                    anyRow.prixTotal ??
                                    anyRow.montantHT ??
                                    anyRow.montant_ht ??
                                    0;
                                  return (
                                  <tr
                                    key={`${candidat.id}-${idx}`}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                                  >
                                    <td className="px-3 py-2 font-mono text-[11px] text-gray-700 dark:text-gray-200">
                                      {row.numero || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                                      {row.designation || '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                                      {row.quantite ?? '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-gray-700 dark:text-gray-200 tabular-nums">
                                      {unitPrice
                                        ? unitPrice.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                          })
                                        : '—'}
                                    </td>
                                    <td className="px-3 py-2 text-right text-emerald-700 dark:text-emerald-300 font-semibold tabular-nums">
                                      {lineTotal
                                        ? lineTotal.toLocaleString('fr-FR', {
                                            minimumFractionDigits: 2,
                                          })
                                        : '—'}
                                    </td>
                                  </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Onglet comparaison globale (tableau ligne par ligne) */}
                  {activeTab === 'comparaison' && analysisCandidats.length >= 2 && (
                    <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                        Synthèse comparative ligne par ligne
                      </h3>
                      <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                        Mise en évidence automatique de la meilleure offre pour chaque ligne.
                      </p>
                      <p className="mt-0.5 text-[11px] sm:text-xs text-slate-500 dark:text-slate-400">
                        Montants comparés : <span className="font-semibold">Montants HT par ligne</span>.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFullPageComparison(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/60 text-xs font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <ArrowLeft className="h-3.5 w-3.5 rotate-90" />
                        Pleine page
                      </button>
                      <button
                        type="button"
                        onClick={exportToExcel}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#2F5B58] to-teal-600 text-xs font-semibold text-white shadow-sm"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        Exporter Excel
                      </button>
                    </div>
                  </div>

                      <div className="space-y-1">
                        {/* Barre de défilement horizontale en haut du tableau pour faciliter la lecture */}
                        <div
                          ref={comparisonScrollTopRef}
                          className="block overflow-x-auto h-4 bg-slate-50 dark:bg-slate-900/60 rounded-md"
                          onScroll={handleComparisonTopScroll}
                        >
                          <div
                            style={{
                              width: comparisonScrollWidth
                                ? `${comparisonScrollWidth}px`
                                : '2000px',
                              height: 2,
                            }}
                          />
                        </div>

                        <div
                          ref={comparisonScrollBottomRef}
                          className="rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto overflow-y-hidden"
                          onScroll={handleComparisonBottomScroll}
                        >
                        <table className="min-w-full text-xs sm:text-sm table-fixed">
                          <thead className="bg-slate-50 dark:bg-slate-800">
                            <tr>
                              <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300">
                                Code
                              </th>
                              <th className="px-3 py-2 text-left font-semibold text-slate-700 dark:text-slate-300 min-w-[220px]">
                                Désignation
                              </th>
                              {analysisCandidats.map((c) => (
                                <th
                                  key={c.id}
                                  className="px-3 py-2 text-right font-semibold text-[#2F5B58] dark:text-teal-300 whitespace-nowrap"
                                >
                                  {c.name}
                                </th>
                              ))}
                              <th className="px-3 py-2 text-right font-semibold text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                                Prix moyen
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                                Min
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                Max
                              </th>
                              <th className="px-3 py-2 text-right font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap">
                                Écart
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {analysisRows.map((row, rowIndex) => {
                              const valuesByCandidat = analysisCandidats.map((c) => {
                                const r = c.rows[rowIndex] as any;
                                if (!r) return 0;
                                return (
                                  r.prix_total ??
                                  r.prixTotal ??
                                  r.montantHT ??
                                  r.montant_ht ??
                                  0
                                );
                              });
                              const min = Math.min(...valuesByCandidat);
                              const max = Math.max(...valuesByCandidat);
                              const ecart = max - min;
                              const somme = valuesByCandidat.reduce((s, v) => s + v, 0);
                              const nbPositifs = valuesByCandidat.filter((v) => v > 0).length;
                              const moyenne = nbPositifs > 0 ? somme / nbPositifs : 0;

                              return (
                                <tr
                                  key={`${row.numero}-${rowIndex}`}
                                  className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                >
                                  <td className="px-3 py-2 font-mono text-[11px] text-slate-500 dark:text-slate-300 whitespace-nowrap">
                                    {row.numero || '—'}
                                  </td>
                                  <td className="px-3 py-2 text-slate-800 dark:text-slate-100">
                                    {row.designation || '—'}
                                  </td>
                                  {analysisCandidats.map((c, idx) => {
                                    const r = c.rows[rowIndex] as any;
                                    const val =
                                      r?.prix_total ??
                                      r?.prixTotal ??
                                      r?.montantHT ??
                                      r?.montant_ht ??
                                      0;
                                    const isMin = val > 0 && val === min;
                                    return (
                                      <td
                                        key={`${c.id}-${idx}`}
                                        className={`px-3 py-2 text-right tabular-nums font-medium whitespace-nowrap min-w-[110px] ${
                                          isMin
                                            ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                                            : 'text-slate-800 dark:text-slate-100'
                                        }`}
                                      >
                                        {val > 0
                                          ? val.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                          : '—'}
                                      </td>
                                    );
                                  })}
                                  <td className="px-3 py-2 text-right tabular-nums font-medium text-indigo-700 dark:text-indigo-300 whitespace-nowrap min-w-[110px]">
                                    {moyenne > 0
                                      ? moyenne.toLocaleString('fr-FR', { minimumFractionDigits: 2 })
                                      : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap min-w-[110px]">
                                    {min > 0 ? min.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-300 whitespace-nowrap min-w-[110px]">
                                    {max > 0 ? max.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                  <td className="px-3 py-2 text-right tabular-nums font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap min-w-[110px]">
                                    {ecart > 0 ? ecart.toLocaleString('fr-FR', { minimumFractionDigits: 2 }) : '—'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot className="bg-slate-50 dark:bg-slate-800/80 font-semibold">
                            <tr>
                              <td
                                colSpan={2}
                                className="px-3 py-2 text-slate-800 dark:text-slate-100 text-right whitespace-nowrap"
                              >
                                TOTAL HT
                              </td>
                              {analysisCandidats.map((c) => {
                                const isMin = analysisCandidats.every((other) => c.totalHT <= other.totalHT);
                                return (
                                  <td
                                    key={c.id}
                                    className={`px-3 py-2 text-right tabular-nums whitespace-nowrap min-w-[110px] ${
                                      isMin
                                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/40'
                                        : 'text-[#2F5B58] dark:text-teal-300'
                                    }`}
                                  >
                                    {c.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                                  </td>
                                );
                              })}
                              <td className="px-3 py-2 text-right tabular-nums text-emerald-700 dark:text-emerald-300 whitespace-nowrap min-w-[110px]">
                                {Math.min(...analysisCandidats.map((c) => c.totalHT)).toLocaleString('fr-FR', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                €
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-amber-700 dark:text-amber-300 whitespace-nowrap min-w-[110px]">
                                {Math.max(...analysisCandidats.map((c) => c.totalHT)).toLocaleString('fr-FR', {
                                  minimumFractionDigits: 2,
                                })}{' '}
                                €
                              </td>
                              <td className="px-3 py-2 text-right tabular-nums text-rose-700 dark:text-rose-300 whitespace-nowrap min-w-[110px]">
                                {(
                                  Math.max(...analysisCandidats.map((c) => c.totalHT)) -
                                  Math.min(...analysisCandidats.map((c) => c.totalHT))
                                ).toLocaleString('fr-FR', { minimumFractionDigits: 2 })}{' '}
                                €
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                        </div>
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
            </>}
          </>
        )}
      </div>
    </div>
  );
}
