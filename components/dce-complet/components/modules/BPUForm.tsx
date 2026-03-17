import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Edit2, ArrowLeft, Save, Upload, ChevronLeft, ChevronRight, AlertTriangle, Copy, FileDown, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../../lib/supabase';
import JSZip from 'jszip';
import {
  exportBPUSingleLot,
  buildBPULotBuffer,
  exportBPUConsolidated,
} from '../../utils/bpuExcelExport';

interface BPUColumn {
  id: string;
  label: string;
  width?: string;
}

interface BPURow {
  id: string;
  [key: string]: any;
}

interface BPUTableData {
  columns: BPUColumn[];
  headerLabels: { [key: string]: string };
  rows: BPURow[];
}

interface LotInfo {
  numero: string;
  intitule: string;
  montant?: string;
  description?: string;
}

interface Props {
  data: BPUTableData;
  onSave: (data: BPUTableData) => Promise<void> | void;
  isSaving?: boolean;
  procedureInfo?: {
    numeroProcedure?: string;
    titreMarche?: string;
    acheteur?: string;
    numeroLot?: string;
    libelleLot?: string;
  };
  // Props pour la navigation lot (optionnel)
  totalLots?: number;
  currentLot?: number;
  onLotChange?: (lot: number) => void;
  // Lots de Configuration Globale
  lotsConfig?: LotInfo[];
}

// Colonnes complètes selon les images fournies
const DEFAULT_COLUMNS: BPUColumn[] = [
  { id: 'codeArticle', label: 'Code Article', width: '120px' },
  { id: 'categorie', label: 'Catégorie', width: '280px' },
  { id: 'designation', label: "Désignation de l'article", width: '450px' },
  { id: 'unite', label: 'Unité', width: '90px' },
  { id: 'qteCond', label: 'Qté dans le cond.', width: '110px' },
  { id: 'refFournisseur', label: 'Réf. Fournisseur', width: '150px' },
  { id: 'designationFournisseur', label: 'Désignation Fournisseur', width: '200px' },
  { id: 'caracteristiques', label: 'Caractéristique technique du produit (Dimension, Puissance, etc...)', width: '250px' },
  { id: 'marqueFabricant', label: 'Marque Fabricant', width: '150px' },
  { id: 'hmbghn', label: 'hmbghn', width: '100px' },
  { id: 'qteConditionnement', label: 'Qté dans le conditionnement', width: '150px' },
  { id: 'prixUniteVenteHT', label: "Prix à l'unité de vente HT", width: '150px' },
  { id: 'prixUniteHT', label: "Prix à l'Unité HT", width: '130px' },
  { id: 'ecoContribution', label: 'Éco-contribution HT', width: '140px' },
  { id: 'urlPhotoProduit', label: 'Lien URL pour la photo du produit proposé', width: '200px' },
  { id: 'urlFicheSecurite', label: 'Lien URL pour la fiche de données de sécurité du produit proposé', width: '250px' },
  { id: 'urlFicheTechnique', label: 'Lien URL pour la fiche technique du produit proposé', width: '200px' },
  { id: 'urlDocumentSupp', label: 'Lien URL pour un document supplémentaire du produit proposé', width: '250px' },
];

export function BPUForm({ data, onSave, isSaving = false, procedureInfo, totalLots, currentLot, onLotChange, lotsConfig = [] }: Props) {
  const [isFullPage, setIsFullPage] = useState(true); // Ouvrir directement en pleine page
  const [columns, setColumns] = useState<BPUColumn[]>(data.columns || DEFAULT_COLUMNS);
  const [headerLabels, setHeaderLabels] = useState<{ [key: string]: string }>(
    data.headerLabels || DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.label }), {})
  );
  const [rows, setRows] = useState<BPURow[]>(data.rows || []);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [showAddRowsDialog, setShowAddRowsDialog] = useState(false);
  const [showAddColumnsDialog, setShowAddColumnsDialog] = useState(false);
  const [rowsToAdd, setRowsToAdd] = useState('10');
  const [columnsToAdd, setColumnsToAdd] = useState('1');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSavingData, setIsSavingData] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateMode, setDuplicateMode] = useState<'all' | 'select'>('select');
  const [selectedLots, setSelectedLots] = useState<number[]>([]);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMode, setExportMode] = useState<'all' | 'select'>('select');
  const [selectedLotsForExport, setSelectedLotsForExport] = useState<number[]>([]);
  const [exportType, setExportType] = useState<'zip' | 'consolidated'>('zip');
  const [isExporting, setIsExporting] = useState(false);
  
  // Refs pour synchroniser les scrolls
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🆕 Synchroniser les données depuis les props quand elles changent (changement de lot)
  useEffect(() => {
    console.log('📥 Chargement des données BPU depuis Supabase');
    
    if (data.columns && data.columns.length > 0) {
      setColumns(data.columns);
      console.log(`✅ ${data.columns.length} colonnes chargées`);
    } else {
      setColumns(DEFAULT_COLUMNS);
      console.log('⚠️ Aucune colonne sauvegardée, utilisation des colonnes par défaut');
    }
    
    if (data.headerLabels && Object.keys(data.headerLabels).length > 0) {
      setHeaderLabels(data.headerLabels);
    } else {
      setHeaderLabels(DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.label }), {}));
    }
    
    if (data.rows && data.rows.length > 0) {
      setRows(data.rows);
      console.log(`✅ ${data.rows.length} lignes chargées depuis Supabase`);
    } else {
      // Initialiser avec 10 lignes vides si aucune donnée
      const initialRows: BPURow[] = Array.from({ length: 10 }, (_, i) => ({
        id: `row-${Date.now()}-${i}`,
        ...DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
      }));
      setRows(initialRows);
      console.log('⚠️ Aucune ligne sauvegardée, initialisation avec 10 lignes vides');
    }
  }, [data, currentLot]); // Se déclenche quand data change (changement de lot)

  // Mettre à jour les largeurs des colonnes avec les valeurs par défaut
  useEffect(() => {
    const updatedColumns = columns.map(col => {
      const defaultCol = DEFAULT_COLUMNS.find(dc => dc.id === col.id);
      if (defaultCol && defaultCol.width !== col.width) {
        return { ...col, width: defaultCol.width };
      }
      return col;
    });
    
    // Vérifier s'il y a eu des changements
    const hasChanges = updatedColumns.some((col, i) => col.width !== columns[i].width);
    if (hasChanges) {
      console.log('📏 Mise à jour des largeurs de colonnes');
      setColumns(updatedColumns);
    }
  }, []); // Exécuter une seule fois au montage

  // Initialiser avec 10 lignes si vide
  useEffect(() => {
    if (rows.length === 0) {
      const initialRows: BPURow[] = Array.from({ length: 10 }, (_, i) => ({
        id: `row-${Date.now()}-${i}`,
        ...columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
      }));
      setRows(initialRows);
    }
  }, []);

  // Synchroniser les scrolls
  const syncScroll = (source: 'top' | 'table') => {
    if (source === 'top' && topScrollRef.current && tableScrollRef.current) {
      tableScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    } else if (source === 'table' && topScrollRef.current && tableScrollRef.current) {
      topScrollRef.current.scrollLeft = tableScrollRef.current.scrollLeft;
    }
  };

  const handleSave = async () => {
    if (!procedureInfo?.numeroProcedure || !procedureInfo?.numeroLot) {
      setSaveStatus('❌ Erreur: Informations de procédure manquantes');
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }

    setIsSavingData(true);
    setSaveStatus('⏳ Sauvegarde en cours...');

    try {
      const bpuData = {
        columns,
        headerLabels,
        rows,
      };

      const { data, error } = await supabase
        .from('bpus')
        .upsert({
          procedure_id: procedureInfo.numeroProcedure,
          numero_lot: parseInt(procedureInfo.numeroLot),
          libelle_lot: procedureInfo.libelleLot || '',
          type_bpu: 'standard',
          data: bpuData,
        }, {
          onConflict: 'procedure_id,numero_lot',
        });

      if (error) {
        console.error('Erreur Supabase:', error);
        setSaveStatus(`❌ Erreur: ${error.message}`);
      } else {
        setSaveStatus('✅ Enregistré avec succès !');
        // Appeler aussi onSave pour mettre à jour l'état local du module DCE si nécessaire
        const updatedData: BPUTableData = { columns, headerLabels, rows };
        onSave(updatedData);
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSavingData(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleCellChange = (rowId: string, columnId: string, value: string) => {
    setRows(rows.map(row => (row.id === rowId ? { ...row, [columnId]: value } : row)));
  };

  const handleHeaderLabelChange = (columnId: string, newLabel: string) => {
    setHeaderLabels({ ...headerLabels, [columnId]: newLabel });
  };

  const addRows = () => {
    const count = parseInt(rowsToAdd) || 1;
    const newRows: BPURow[] = Array.from({ length: count }, (_, i) => ({
      id: `row-${Date.now()}-${i}`,
      ...columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
    }));
    setRows([...rows, ...newRows]);
    setShowAddRowsDialog(false);
    setRowsToAdd('10');
  };

  const deleteRow = (rowId: string) => {
    if (rows.length > 1) {
      setRows(rows.filter(row => row.id !== rowId));
    }
  };

  const addColumns = () => {
    const count = parseInt(columnsToAdd) || 1;
    const newCols: BPUColumn[] = Array.from({ length: count }, (_, i) => ({
      id: `col-${Date.now()}-${i}`,
      label: `Nouvelle colonne ${i + 1}`,
      width: '150px',
    }));
    setColumns([...columns, ...newCols]);
    newCols.forEach(col => {
      headerLabels[col.id] = col.label;
    });
    setHeaderLabels({ ...headerLabels });
    setShowAddColumnsDialog(false);
    setColumnsToAdd('1');
  };

  const deleteColumn = (columnId: string) => {
    if (columns.length > 1) {
      setColumns(columns.filter(col => col.id !== columnId));
      const newHeaderLabels = { ...headerLabels };
      delete newHeaderLabels[columnId];
      setHeaderLabels(newHeaderLabels);
      setRows(rows.map(row => {
        const newRow = { ...row };
        delete newRow[columnId];
        return newRow;
      }));
    }
  };

  const exportToExcel = async () => {
    try {
      setSaveStatus('⏳ Génération du fichier Excel...');
      await exportBPUSingleLot(columns, headerLabels, rows, {
        numeroProcedure: procedureInfo?.numeroProcedure,
        titreMarche:     procedureInfo?.titreMarche,
        acheteur:        procedureInfo?.acheteur,
        numeroLot:       procedureInfo?.numeroLot,
        libelleLot:      procedureInfo?.libelleLot,
      });
      setSaveStatus('✅ Export Excel réussi !');
    } catch (err: any) {
      setSaveStatus(`❌ Erreur: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleImportFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportStatus('Lecture du fichier...');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        let workbook: XLSX.WorkBook;

        // Lire le fichier selon son type
        if (file.name.endsWith('.csv')) {
          workbook = XLSX.read(data, { type: 'binary' });
        } else {
          workbook = XLSX.read(data, { type: 'array' });
        }

        // Chercher l'onglet "BPU" ou utiliser le premier onglet
        console.log('📋 Onglets disponibles:', workbook.SheetNames);
        
        let sheetName = workbook.SheetNames[0];
        const bpuSheet = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('bpu') || 
          name.toLowerCase().includes('bordereau')
        );
        
        if (bpuSheet) {
          sheetName = bpuSheet;
          console.log('✅ Onglet BPU trouvé:', sheetName);
        } else {
          console.log('⚠️ Onglet BPU non trouvé, utilisation du premier onglet:', sheetName);
        }
        
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          setImportStatus('❌ Fichier vide ou invalide');
          setTimeout(() => setImportStatus(null), 3000);
          return;
        }

        console.log('📥 Import Excel - Toutes les lignes:', jsonData.slice(0, 15)); // Afficher les 15 premières lignes

        // Trouver la ligne d'en-tête en cherchant des mots-clés typiques du BPU
        let headerRowIndex = 0;
        const bpuKeywords = ['code', 'article', 'categorie', 'catégorie', 'designation', 'désignation', 'unite', 'unité', 'prix', 'ref', 'référence', 'fournisseur'];
        
        for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          // Compter combien de cellules contiennent des mots-clés BPU
          const keywordMatches = row.filter(cell => {
            if (!cell) return false;
            const cellStr = cell.toString().toLowerCase();
            return bpuKeywords.some(keyword => cellStr.includes(keyword));
          }).length;
          
          console.log(`Ligne ${i}: ${keywordMatches} mots-clés détectés →`, row.slice(0, 6));
          
          // Si au moins 3 colonnes contiennent des mots-clés, c'est probablement la ligne d'en-tête
          if (keywordMatches >= 3) {
            headerRowIndex = i;
            console.log(`✅ Ligne d'en-tête trouvée à l'index ${i} (${keywordMatches} mots-clés détectés)`);
            break;
          }
        }

        console.log('📥 Import Excel - Ligne d\'en-tête détectée:', headerRowIndex);

        // Ligne d'en-têtes du fichier importé
        const importedHeaders: string[] = jsonData[headerRowIndex].map(h => String(h || ''));
        const importedRows = jsonData.slice(headerRowIndex + 1).filter(row => {
          // Ignorer les lignes complètement vides
          return row.some(cell => cell !== undefined && cell !== null && cell.toString().trim() !== '');
        });

        console.log('📥 Import Excel - En-têtes détectés:', importedHeaders);
        console.log('📥 Import Excel - Nombre de lignes (non vides):', importedRows.length);

        // Mapper les colonnes importées aux colonnes existantes
        const columnMapping: { [key: number]: string } = {};
        
        // Fonction pour normaliser les chaînes (enlever accents, ponctuation)
        const normalize = (str: string) => {
          return str.toLowerCase()
            .trim()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
            .replace(/[^a-z0-9]/g, ''); // Enlever la ponctuation
        };

        // Mapper les colonnes - ÉVITER LES DOUBLONS
        const usedColumns = new Set<string>(); // Suivre les colonnes déjà mappées

        importedHeaders.forEach((importedHeader, index) => {
          const normalizedImported = normalize(importedHeader.toString());
          
          // Chercher une correspondance EXACTE d'abord
          let matchingColumn = columns.find(col => {
            if (usedColumns.has(col.id)) return false; // Déjà utilisé
            const colLabel = normalize(headerLabels[col.id] || col.label);
            const colId = normalize(col.id);
            return colLabel === normalizedImported || colId === normalizedImported;
          });

          // Si pas de correspondance exacte, chercher une correspondance partielle
          if (!matchingColumn) {
            matchingColumn = columns.find(col => {
              if (usedColumns.has(col.id)) return false; // Déjà utilisé
              const colLabel = normalize(headerLabels[col.id] || col.label);
              const colId = normalize(col.id);
              
              // Correspondance partielle MAIS avec des règles strictes
              // - Le terme doit être au début ou à la fin
              // - Ou correspondance de plus de 60% des caractères
              const importedLength = normalizedImported.length;
              const labelLength = colLabel.length;
              
              if (importedLength < 3 || labelLength < 3) return false;
              
              // Si l'importé commence par le label ou inversement
              if (normalizedImported.startsWith(colLabel) || colLabel.startsWith(normalizedImported)) {
                return true;
              }
              
              // Si l'importé se termine par le label ou inversement
              if (normalizedImported.endsWith(colLabel) || colLabel.endsWith(normalizedImported)) {
                return true;
              }
              
              return false;
            });
          }

          if (matchingColumn) {
            columnMapping[index] = matchingColumn.id;
            usedColumns.add(matchingColumn.id); // Marquer comme utilisé
            console.log(`✅ Mapping: Colonne ${index} "${importedHeader}" → ${matchingColumn.id}`);
          } else {
            console.log(`⚠️ Pas de correspondance pour: "${importedHeader}"`);
          }
        });

        console.log('📊 Mapping complet des colonnes:', columnMapping);

        // Créer les nouvelles lignes
        const newRows: BPURow[] = importedRows.map((row, rowIndex) => {
          const newRow: BPURow = {
            id: `row-${Date.now()}-${rowIndex}`,
          };

          // Initialiser toutes les colonnes
          columns.forEach(col => {
            newRow[col.id] = '';
          });

          // Remplir avec les données importées
          row.forEach((cell, cellIndex) => {
            const columnId = columnMapping[cellIndex];
            if (columnId && cell !== undefined && cell !== null) {
              newRow[columnId] = cell.toString();
            }
          });

          // Log les 3 premières lignes pour vérification
          if (rowIndex < 3) {
            console.log(`📝 Ligne ${rowIndex + 1} importée:`, newRow);
            console.log(`   Source Excel ligne ${headerRowIndex + 1 + rowIndex}:`, row);
          }

          return newRow;
        });

        // Remplacer les lignes existantes ou les étendre si nécessaire
        if (newRows.length > rows.length) {
          // Plus de lignes dans l'import : remplacer et ajouter
          setRows(newRows);
          setImportStatus(`✅ ${newRows.length} lignes importées (${newRows.length - rows.length} lignes ajoutées)`);
        } else {
          // Moins de lignes : remplacer les premières et garder les anciennes après
          const updatedRows = [...newRows];
          for (let i = newRows.length; i < rows.length; i++) {
            updatedRows.push(rows[i]);
          }
          setRows(updatedRows);
          setImportStatus(`✅ ${newRows.length} lignes importées`);
        }

        setTimeout(() => setImportStatus(null), 5000);

      } catch (error) {
        console.error('Erreur lors de l\'import:', error);
        setImportStatus('❌ Erreur lors de la lecture du fichier');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };

    // Lire le fichier
    if (file.name.endsWith('.csv')) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

    // Réinitialiser l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileImport = () => {
    fileInputRef.current?.click();
  };

  // Gérer la sélection des lots pour l'export
  const toggleLotSelectionForExport = (lotNumber: number) => {
    setSelectedLotsForExport(prev => 
      prev.includes(lotNumber) 
        ? prev.filter(l => l !== lotNumber)
        : [...prev, lotNumber]
    );
  };

  const toggleAllLotsForExport = () => {
    if (!totalLots) return;
    
    const allLotNumbers = Array.from({ length: totalLots }, (_, i) => i + 1);
    
    if (selectedLotsForExport.length === allLotNumbers.length) {
      setSelectedLotsForExport([]);
    } else {
      setSelectedLotsForExport(allLotNumbers);
    }
  };

  // Export avancé : ZIP avec 1 fichier par lot
  const handleExportMultipleLotsZip = async () => {
    if (!procedureInfo?.numeroProcedure || !totalLots) {
      setSaveStatus('❌ Erreur: Informations manquantes');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const lotsToExport = exportMode === 'all' 
      ? Array.from({ length: totalLots }, (_, i) => i + 1)
      : selectedLotsForExport;

    if (lotsToExport.length === 0) {
      setSaveStatus('❌ Aucun lot sélectionné');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsExporting(true);
    setSaveStatus(`⏳ Export de ${lotsToExport.length} lot(s) en cours...`);

    try {
      const zip = new JSZip();

      console.log('📋 Export ZIP - Lots Configuration depuis props:', lotsConfig.length, 'lots');
      
      // Afficher les 3 premiers lots pour vérification
      if (lotsConfig.length > 0) {
        console.log('📋 Exemple lots (3 premiers):', lotsConfig.slice(0, 3));
      }

      // Fonction pour obtenir le nom d'un lot - VERSION ROBUSTE
      const getLotName = (numeroLot: number): string => {
        console.log(`🔍 Recherche du lot ${numeroLot} dans ${lotsConfig.length} lots`);
        
        // Essayer plusieurs méthodes de correspondance
        let lot = lotsConfig.find((l: any) => {
          // Méthode 1: numero est un nombre
          if (typeof l.numero === 'number' && l.numero === numeroLot) return true;
          // Méthode 2: numero est une chaîne
          if (typeof l.numero === 'string' && parseInt(l.numero) === numeroLot) return true;
          // Méthode 3: numero est une chaîne exacte
          if (typeof l.numero === 'string' && l.numero === numeroLot.toString()) return true;
          return false;
        });
        
        if (lot) {
          console.log(`✅ Lot ${numeroLot} trouvé:`, lot.intitule);
          return lot.intitule || `Lot ${numeroLot}`;
        } else {
          console.log(`⚠️ Lot ${numeroLot} NON TROUVÉ. Lots disponibles:`, lotsConfig.map((l: any) => ({ numero: l.numero, type: typeof l.numero })));
          return `Lot ${numeroLot}`;
        }
      };

      // Récupérer les données BPU de chaque lot depuis Supabase
      const { data: bpusData, error } = await supabase
        .from('bpus')
        .select('*')
        .eq('procedure_id', procedureInfo.numeroProcedure)
        .in('numero_lot', lotsToExport);

      if (error) {
        console.error('Erreur Supabase:', error);
      }

      // Créer un fichier Excel pour chaque lot demandé
      for (const lotNum of lotsToExport) {
        const bpuRecord = bpusData?.find(b => b.numero_lot === lotNum);
        const lotData = bpuRecord?.data as BPUTableData | undefined;
        const lotCols   = lotData?.columns?.length ? lotData.columns : DEFAULT_COLUMNS;
        const lotLabels = lotData?.headerLabels && Object.keys(lotData.headerLabels).length
          ? lotData.headerLabels
          : DEFAULT_COLUMNS.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: c.label }), {});
        const lotRows   = lotData?.rows?.length
          ? lotData.rows
          : Array.from({ length: 10 }, (_, i) => ({
              id: `empty-${i}`,
              ...DEFAULT_COLUMNS.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: '' }), {}),
            }));

        const wbout = await buildBPULotBuffer(
          lotCols,
          lotLabels,
          lotRows,
          {
            numeroProcedure: procedureInfo.numeroProcedure,
            titreMarche:     procedureInfo.titreMarche,
            acheteur:        procedureInfo.acheteur,
          },
          lotNum,
          getLotName(lotNum),
          DEFAULT_COLUMNS,
        );
        
        // Nom de fichier sécurisé
        const safeLotName = getLotName(lotNum).replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
        zip.file(`${procedureInfo.numeroProcedure}_BPU_LOT${lotNum}_${safeLotName}.xlsx`, wbout);
      }

      // Générer et télécharger le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${procedureInfo.numeroProcedure}_BPU_${lotsToExport.length}_lots.zip`;
      link.click();

      setSaveStatus(`✅ ${lotsToExport.length} lot(s) exporté(s) en ZIP !`);
      setShowExportModal(false);
      setSelectedLotsForExport([]);
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Export consolidé : 1 fichier avec page de garde + 1 onglet par lot
  const handleExportConsolidated = async () => {
    if (!procedureInfo?.numeroProcedure || !totalLots) {
      setSaveStatus('❌ Erreur: Informations manquantes');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const lotsToExport = exportMode === 'all' 
      ? Array.from({ length: totalLots }, (_, i) => i + 1)
      : selectedLotsForExport;

    if (lotsToExport.length === 0) {
      setSaveStatus('❌ Aucun lot sélectionné');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsExporting(true);
    setSaveStatus(`⏳ Création du fichier consolidé...`);

    try {
      console.log('📋 Export Consolidé - Lots Configuration depuis props:', lotsConfig.length, 'lots');

      // Fonction pour obtenir le nom d'un lot - VERSION ROBUSTE
      const getLotName = (numeroLot: number): string => {
        let lot = lotsConfig.find((l: any) => {
          if (typeof l.numero === 'number' && l.numero === numeroLot) return true;
          if (typeof l.numero === 'string' && parseInt(l.numero) === numeroLot) return true;
          if (typeof l.numero === 'string' && l.numero === numeroLot.toString()) return true;
          return false;
        });
        return lot ? (lot.intitule || `Lot ${numeroLot}`) : `Lot ${numeroLot}`;
      };

      // Fonction pour obtenir le montant d'un lot
      const getLotAmount = (numeroLot: number): string => {
        let lot = lotsConfig.find((l: any) => {
          if (typeof l.numero === 'number' && l.numero === numeroLot) return true;
          if (typeof l.numero === 'string' && parseInt(l.numero) === numeroLot) return true;
          if (typeof l.numero === 'string' && l.numero === numeroLot.toString()) return true;
          return false;
        });
        return lot && lot.montant ? `${lot.montant} € HT` : '';
      };

      // Récupérer les données BPU de chaque lot depuis Supabase
      const { data: bpusData, error } = await supabase
        .from('bpus')
        .select('*')
        .eq('procedure_id', procedureInfo.numeroProcedure)
        .in('numero_lot', lotsToExport)
        .order('numero_lot');

      if (error) {
        console.error('Erreur Supabase BPU:', error);
      }

      console.log(`📊 ${bpusData?.length || 0} BPU trouvés sur ${lotsToExport.length} lots demandés`);

      // Construire la liste des lots avec leurs données
      const lotExportData = lotsToExport.map(lotNum => ({
        lotNum,
        lotName:   getLotName(lotNum),
        lotAmount: getLotAmount(lotNum),
        data:      bpusData?.find(b => b.numero_lot === lotNum)?.data as BPUTableData | undefined,
      }));

      const fileName = `${procedureInfo.numeroProcedure}_BPU_Consolidé_${lotsToExport.length}_lots.xlsx`;
      await exportBPUConsolidated(
        lotExportData,
        {
          numeroProcedure: procedureInfo.numeroProcedure,
          titreMarche:     procedureInfo.titreMarche,
          acheteur:        procedureInfo.acheteur,
        },
        DEFAULT_COLUMNS,
        fileName,
      );

      setSaveStatus(`✅ Fichier consolidé créé avec ${lotsToExport.length} lot(s) !`);
      setShowExportModal(false);
      setSelectedLotsForExport([]);
    } catch (error: any) {
      console.error('Erreur lors de l\'export:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsExporting(false);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  // Lancer l'export selon le type choisi
  const handleAdvancedExport = async () => {
    if (exportType === 'zip') {
      await handleExportMultipleLotsZip();
    } else {
      await handleExportConsolidated();
    }
  };

  // Effacer toutes les données avec confirmation
  const handleClearData = () => {
    setShowClearConfirm(true);
  };

  const confirmClearData = () => {
    // Réinitialiser avec 10 lignes vides
    const emptyRows: BPURow[] = Array.from({ length: 10 }, (_, i) => ({
      id: `row-${Date.now()}-${i}`,
      ...columns.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
    }));
    setRows(emptyRows);
    setShowClearConfirm(false);
    setImportStatus('✅ Toutes les données ont été effacées');
    setTimeout(() => setImportStatus(null), 3000);
  };

  // Gérer la sélection des lots pour la duplication
  const toggleLotSelection = (lotNumber: number) => {
    setSelectedLots(prev => 
      prev.includes(lotNumber) 
        ? prev.filter(l => l !== lotNumber)
        : [...prev, lotNumber]
    );
  };

  const toggleAllLots = () => {
    if (!totalLots || !currentLot) return;
    
    const allLotNumbers = Array.from({ length: totalLots }, (_, i) => i + 1)
      .filter(lot => lot !== currentLot); // Exclure le lot actuel
    
    if (selectedLots.length === allLotNumbers.length) {
      setSelectedLots([]);
    } else {
      setSelectedLots(allLotNumbers);
    }
  };

  // Dupliquer le tableau vers d'autres lots
  const handleDuplicate = async () => {
    if (!procedureInfo?.numeroProcedure || !currentLot || !totalLots) {
      setSaveStatus('❌ Erreur: Informations manquantes');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    const lotsToUpdate = duplicateMode === 'all' 
      ? Array.from({ length: totalLots }, (_, i) => i + 1).filter(lot => lot !== currentLot)
      : selectedLots;

    if (lotsToUpdate.length === 0) {
      setSaveStatus('❌ Aucun lot sélectionné');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsDuplicating(true);
    setSaveStatus(`⏳ Sauvegarde du lot actuel...`);

    try {
      const bpuData = {
        columns,
        headerLabels,
        rows,
      };

      // ÉTAPE 1 : Sauvegarder le lot actuel AVANT de dupliquer
      console.log('💾 Sauvegarde du lot source:', currentLot);
      const { error: saveError } = await supabase
        .from('bpus')
        .upsert({
          procedure_id: procedureInfo.numeroProcedure,
          numero_lot: parseInt(procedureInfo.numeroLot!),
          libelle_lot: procedureInfo.libelleLot || '',
          type_bpu: 'standard',
          data: bpuData,
        }, {
          onConflict: 'procedure_id,numero_lot',
        });

      if (saveError) {
        console.error('Erreur lors de la sauvegarde du lot source:', saveError);
        setSaveStatus(`❌ Erreur lors de la sauvegarde: ${saveError.message}`);
        setIsDuplicating(false);
        setTimeout(() => setSaveStatus(null), 4000);
        return;
      }

      // ÉTAPE 2 : Dupliquer vers les autres lots
      setSaveStatus(`⏳ Duplication vers ${lotsToUpdate.length} lot(s)...`);
      console.log('📋 Duplication vers les lots:', lotsToUpdate);

      // Préparer les données pour tous les lots cibles
      const upsertData = lotsToUpdate.map(lotNumber => ({
        procedure_id: procedureInfo.numeroProcedure,
        numero_lot: lotNumber,
        libelle_lot: `Lot ${lotNumber}`,
        type_bpu: 'standard',
        data: bpuData,
      }));

      // Upsert en masse
      const { error: duplicateError } = await supabase
        .from('bpus')
        .upsert(upsertData, {
          onConflict: 'procedure_id,numero_lot',
        });

      if (duplicateError) {
        console.error('Erreur Supabase lors de la duplication:', duplicateError);
        setSaveStatus(`❌ Erreur: ${duplicateError.message}`);
      } else {
        console.log('✅ Duplication réussie');
        setSaveStatus(`✅ Lot ${currentLot} sauvegardé et dupliqué vers ${lotsToUpdate.length} lot(s) !`);
        setShowDuplicateModal(false);
        setSelectedLots([]);
        
        // Appeler onSave pour mettre à jour l'état local du module DCE
        const updatedData: BPUTableData = { columns, headerLabels, rows };
        onSave(updatedData);
      }
    } catch (error: any) {
      console.error('Erreur lors de la duplication:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsDuplicating(false);
      setTimeout(() => setSaveStatus(null), 5000);
    }
  };

  if (!isFullPage) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            Bordereau de Prix Unitaires
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre maquette de bordereau de prix avec un tableau personnalisable
          </p>
          <button
            onClick={() => setIsFullPage(true)}
            className="px-6 py-3 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition font-medium shadow-md"
          >
            Ouvrir en pleine page
          </button>
        </div>
      </div>
    );
  }

  const totalWidth = columns.reduce((sum, col) => sum + parseInt(col.width || '150'), 0) + 50 + 60; // # + Actions

  return (
    <div className="dce-bpu-fullpage fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-hidden flex flex-col">
      {/* En-tête fixe */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 shadow-sm z-20">
        <div className="px-6 py-4">
          {/* Bouton retour et actions principales */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullPage(false)}
                className="dce-bpu-retour flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border dark:border-slate-600 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>

              {/* Titre du module */}
              <h1 className="text-xl font-bold text-[#2F5B58] dark:text-emerald-300 border-l border-gray-300 dark:border-slate-600 pl-4">
                BORDEREAU DE PRIX UNITAIRES (BPU)
              </h1>

              {/* Navigation entre les lots */}
              {totalLots && totalLots > 1 && currentLot && onLotChange && (
                <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
                  {/* Bouton précédent */}
                  <button
                    onClick={() => currentLot > 1 && onLotChange(currentLot - 1)}
                    disabled={currentLot <= 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentLot > 1
                        ? 'text-gray-700 dark:text-slate-200 dark:hover:bg-slate-600 hover:bg-gray-100'
                        : 'text-gray-300 dark:text-slate-500 cursor-not-allowed'
                    }`}
                    title="Lot précédent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Sélecteur de lot */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600 dark:text-slate-300">Lot</span>
                    <select
                      value={currentLot}
                      onChange={(e) => onLotChange(Number(e.target.value))}
                      className="dce-bpu-select px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] bg-white dark:bg-slate-700 dark:text-slate-100"
                    >
                      {Array.from({ length: totalLots }, (_, i) => i + 1).map((lot) => (
                        <option key={lot} value={lot}>
                          {lot}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-500 dark:text-slate-400">/ {totalLots}</span>
                  </div>

                  {/* Bouton suivant */}
                  <button
                    onClick={() => currentLot < totalLots && onLotChange(currentLot + 1)}
                    disabled={currentLot >= totalLots}
                    className={`p-2 rounded-lg transition-colors ${
                      currentLot < totalLots
                        ? 'text-gray-700 dark:text-slate-200 dark:hover:bg-slate-600 hover:bg-gray-100'
                        : 'text-gray-300 dark:text-slate-500 cursor-not-allowed'
                    }`}
                    title="Lot suivant"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleImportFile}
                className="hidden"
              />
              <button
                onClick={triggerFileImport}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition text-sm shadow-md"
                title="Importer un fichier Excel ou CSV"
              >
                <Table className="w-4 h-4" />
                <Upload className="w-3.5 h-3.5" />
                Importer Excel
              </button>
              <button
                onClick={() => totalLots && totalLots > 1 ? setShowExportModal(true) : exportToExcel()}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition text-sm shadow-md"
                title={totalLots && totalLots > 1 ? "Options d'export avancées" : "Exporter vers Excel"}
              >
                <Table className="w-4 h-4" />
                <Download className="w-3.5 h-3.5" />
                Exporter Excel
              </button>
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition text-sm shadow-md"
                title="Effacer toutes les données"
              >
                <Trash2 className="w-4 h-4" />
                Effacer tout
              </button>
              {totalLots && totalLots > 1 && (
                <button
                  onClick={() => setShowDuplicateModal(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition text-sm"
                  title="Dupliquer vers d'autres lots"
                >
                  <Copy className="w-4 h-4" />
                  Dupliquer
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSavingData}
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition disabled:opacity-50 text-sm shadow-md"
                title="Enregistrer le BPU"
              >
                <Save className="w-4 h-4" />
                {isSavingData ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Informations de la procédure */}
          {procedureInfo && (
            <div className="dce-bpu-procedure-info bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-800 rounded-lg p-4 mb-4 dark:border dark:border-slate-600">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Procédure :</span>{' '}
                  <span className="text-gray-900 dark:text-slate-100">{procedureInfo.numeroProcedure || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Marché :</span>{' '}
                  <span className="text-gray-900 dark:text-slate-100">{procedureInfo.titreMarche || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Acheteur :</span>{' '}
                  <span className="text-gray-900 dark:text-slate-100">{procedureInfo.acheteur || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Lot N° :</span>{' '}
                  <span className="text-gray-900 dark:text-slate-100">{procedureInfo.numeroLot || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700 dark:text-slate-300">Nom du lot :</span>{' '}
                  <span className="text-gray-900 dark:text-slate-100">{procedureInfo.libelleLot || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Statut d'import */}
          {importStatus && (
            <div className={`rounded-lg p-3 mb-4 text-sm ${
              importStatus.startsWith('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {importStatus}
            </div>
          )}

          {/* Statut de sauvegarde Supabase */}
          {saveStatus && (
            <div className={`rounded-lg p-3 mb-4 text-sm ${
              saveStatus.startsWith('✅') 
                ? 'bg-green-50 border border-green-200 text-green-800' 
                : saveStatus.startsWith('⏳')
                ? 'bg-blue-50 border border-blue-200 text-blue-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {saveStatus}
            </div>
          )}

          {/* Barre d'outils */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsEditingHeader(!isEditingHeader)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition text-sm ${
                isEditingHeader
                  ? 'bg-[#2F5B58] bg-opacity-10 border-[#2F5B58] text-[#2F5B58]'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Edit2 className="w-4 h-4" />
              {isEditingHeader ? 'Terminer édition en-tête' : 'Modifier en-tête'}
            </button>
            <button
              onClick={() => setShowAddRowsDialog(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter des lignes
            </button>
            <button
              onClick={() => setShowAddColumnsDialog(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition text-sm"
            >
              <Plus className="w-4 h-4" />
              Ajouter des colonnes
            </button>
            <span className="text-sm text-gray-600 dark:text-slate-300 ml-auto">
              {rows.length} ligne{rows.length > 1 ? 's' : ''} × {columns.length} colonne{columns.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Scroll horizontal du haut */}
        <div 
          ref={topScrollRef}
          className="overflow-x-auto overflow-y-hidden px-6 pb-2"
          onScroll={() => syncScroll('top')}
          style={{ height: '20px' }}
        >
          <div style={{ width: `${totalWidth}px`, height: '1px' }}></div>
        </div>
      </div>

      {/* Tableau avec scroll */}
      <div className="flex-1 overflow-hidden">
        <div 
          ref={tableScrollRef}
          className="dce-bpu-table-scroll h-full overflow-auto px-6 py-6"
          onScroll={() => syncScroll('table')}
        >
          <div className="border border-gray-300 dark:border-slate-600 rounded-lg overflow-hidden inline-block min-w-full">
            <table className="text-sm border-collapse" style={{ minWidth: `${totalWidth}px`, width: 'max-content' }}>
              <thead>
                <tr className="bg-[#2F5B58] text-white">
                  <th className="border border-gray-300 px-2 py-3 text-left font-semibold sticky left-0 bg-[#2F5B58] z-10" style={{ width: '50px', minWidth: '50px' }}>
                    #
                  </th>
                  {columns.map((col) => (
                    <th
                      key={col.id}
                      className="border border-gray-300 px-2 py-3 text-left font-semibold relative group"
                      style={{ width: col.width || '150px', minWidth: col.width || '150px' }}
                    >
                      {isEditingHeader ? (
                        <input
                          type="text"
                          value={headerLabels[col.id] || col.label}
                          onChange={(e) => handleHeaderLabelChange(col.id, e.target.value)}
                          className="w-full px-2 py-1 text-gray-900 border border-white rounded focus:outline-none focus:ring-2 focus:ring-white"
                        />
                      ) : (
                        <div className="flex items-center justify-between">
                          <span className="text-xs">{headerLabels[col.id] || col.label}</span>
                          {columns.length > 1 && (
                            <button
                              onClick={() => deleteColumn(col.id)}
                              className="opacity-0 group-hover:opacity-100 ml-2 p-1 hover:bg-red-500 rounded transition"
                              title="Supprimer cette colonne"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                  <th className="border border-gray-300 px-2 py-3 text-center font-semibold" style={{ width: '60px', minWidth: '60px' }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIndex) => (
                  <tr key={row.id} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-2 py-2 text-center font-medium text-gray-600 sticky left-0 bg-inherit">
                      {rowIndex + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col.id} className="border border-gray-300 px-2 py-1" style={{ width: col.width || '150px', minWidth: col.width || '150px' }}>
                        <input
                          type="text"
                          value={row[col.id] || ''}
                          onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#2F5B58] rounded bg-transparent text-sm"
                          placeholder={col.id.includes('url') ? 'https://...' : ''}
                        />
                      </td>
                    ))}
                    <td className="border border-gray-300 px-2 py-2 text-center">
                      <button
                        onClick={() => deleteRow(row.id)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                        title="Supprimer cette ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialog Ajouter des lignes */}
      {showAddRowsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter des lignes</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de lignes à ajouter :
            </label>
            <input
              type="number"
              min="1"
              value={rowsToAdd}
              onChange={(e) => setRowsToAdd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5B58] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddRowsDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={addRows}
                className="px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition shadow-md"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialog Ajouter des colonnes */}
      {showAddColumnsDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ajouter des colonnes</h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de colonnes à ajouter :
            </label>
            <input
              type="number"
              min="1"
              value={columnsToAdd}
              onChange={(e) => setColumnsToAdd(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2F5B58] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddColumnsDialog(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={addColumns}
                className="px-4 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition shadow-md"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de confirmation pour effacer les données */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Confirmer l'effacement
                </h3>
                <p className="text-gray-600">
                  Êtes-vous sûr de vouloir effacer toutes les données du tableau ? Cette action ne peut pas être annulée.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
              >
                Annuler
              </button>
              <button
                onClick={confirmClearData}
                className="px-4 py-2 bg-gradient-to-b from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition shadow-md"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale de duplication vers d'autres lots */}
      {showDuplicateModal && totalLots && currentLot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start gap-3 mb-4">
              <Copy className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Dupliquer le BPU vers d'autres lots
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Cette action va copier la structure et les données du tableau actuel (Lot {currentLot}) vers les lots sélectionnés.
                </p>

                {/* Options de duplication */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="duplicateMode"
                      checked={duplicateMode === 'all'}
                      onChange={() => setDuplicateMode('all')}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Tous les lots</div>
                      <div className="text-sm text-gray-600">
                        Dupliquer vers tous les {totalLots - 1} autres lots
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="duplicateMode"
                      checked={duplicateMode === 'select'}
                      onChange={() => setDuplicateMode('select')}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Sélectionner les lots</div>
                      <div className="text-sm text-gray-600">
                        Choisir manuellement les lots de destination
                      </div>
                    </div>
                  </label>
                </div>

                {/* Sélection des lots si mode "select" */}
                {duplicateMode === 'select' && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Lots disponibles ({selectedLots.length} sélectionné{selectedLots.length > 1 ? 's' : ''})
                      </span>
                      <button
                        onClick={toggleAllLots}
                        className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                      >
                        {selectedLots.length === totalLots - 1 ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                      {Array.from({ length: totalLots }, (_, i) => i + 1)
                        .filter(lot => lot !== currentLot)
                        .map(lot => (
                          <label
                            key={lot}
                            className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLots.includes(lot)}
                              onChange={() => toggleLotSelection(lot)}
                              className="w-4 h-4 text-orange-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Lot {lot}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setSelectedLots([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={isDuplicating}
              >
                Annuler
              </button>
              <button
                onClick={handleDuplicate}
                disabled={isDuplicating || (duplicateMode === 'select' && selectedLots.length === 0)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition disabled:opacity-50"
              >
                {isDuplicating ? 'Duplication...' : `Dupliquer vers ${duplicateMode === 'all' ? totalLots - 1 : selectedLots.length} lot(s)`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modale d'export avancé */}
      {showExportModal && totalLots && totalLots > 1 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-start gap-3 mb-4">
              <FileDown className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Export Excel avancé
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Choisissez le type d'export et les lots à inclure
                </p>

                {/* Type d'export */}
                <div className="space-y-3 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Type d'export</div>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportType"
                      checked={exportType === 'zip'}
                      onChange={() => setExportType('zip')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">ZIP - Un fichier par lot</div>
                      <div className="text-sm text-gray-600">
                        Génère un fichier ZIP contenant un fichier Excel pour chaque lot sélectionné
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportType"
                      checked={exportType === 'consolidated'}
                      onChange={() => setExportType('consolidated')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Fichier consolidé</div>
                      <div className="text-sm text-gray-600">
                        Un seul fichier Excel avec une page de garde et un onglet par lot
                      </div>
                    </div>
                  </label>
                </div>

                {/* Sélection des lots */}
                <div className="space-y-3 mb-4">
                  <div className="text-sm font-medium text-gray-700 mb-2">Lots à inclure</div>
                  
                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'all'}
                      onChange={() => setExportMode('all')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Tous les lots</div>
                      <div className="text-sm text-gray-600">
                        Exporter tous les {totalLots} lots
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="exportMode"
                      checked={exportMode === 'select'}
                      onChange={() => setExportMode('select')}
                      className="w-4 h-4 text-green-600"
                    />
                    <div>
                      <div className="font-medium text-gray-900">Sélectionner les lots</div>
                      <div className="text-sm text-gray-600">
                        Choisir manuellement les lots à exporter
                      </div>
                    </div>
                  </label>
                </div>

                {/* Grille de sélection des lots si mode "select" */}
                {exportMode === 'select' && (
                  <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">
                        Lots disponibles ({selectedLotsForExport.length} sélectionné{selectedLotsForExport.length > 1 ? 's' : ''})
                      </span>
                      <button
                        onClick={toggleAllLotsForExport}
                        className="text-sm text-green-600 hover:text-green-700 font-medium"
                      >
                        {selectedLotsForExport.length === totalLots ? 'Tout désélectionner' : 'Tout sélectionner'}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                      {Array.from({ length: totalLots }, (_, i) => i + 1)
                        .map(lot => (
                          <label
                            key={lot}
                            className="flex items-center gap-2 p-2 border border-gray-300 rounded cursor-pointer hover:bg-white"
                          >
                            <input
                              type="checkbox"
                              checked={selectedLotsForExport.includes(lot)}
                              onChange={() => toggleLotSelectionForExport(lot)}
                              className="w-4 h-4 text-green-600 rounded"
                            />
                            <span className="text-sm text-gray-700">Lot {lot}</span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setSelectedLotsForExport([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                disabled={isExporting}
              >
                Annuler
              </button>
              <button
                onClick={handleAdvancedExport}
                disabled={isExporting || (exportMode === 'select' && selectedLotsForExport.length === 0)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-b from-emerald-500 to-emerald-600 text-white rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition disabled:opacity-50 shadow-md"
              >
                <Table className="w-4 h-4" />
                {isExporting 
                  ? 'Export en cours...' 
                  : `Exporter ${exportMode === 'all' ? totalLots : selectedLotsForExport.length} lot(s)`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
