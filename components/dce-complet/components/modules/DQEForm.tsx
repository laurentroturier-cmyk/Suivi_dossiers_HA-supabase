import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Edit2, ArrowLeft, Save, Upload, ChevronLeft, ChevronRight, AlertTriangle, Copy, FileDown, RefreshCw, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../../lib/supabase';
import JSZip from 'jszip';

interface DQEColumn {
  id: string;
  label: string;
  width?: string;
  isEditable?: boolean; // Pour identifier les colonnes avec en-tête coloré différemment
  isCalculated?: boolean; // Pour identifier les colonnes calculées automatiquement
}

interface DQERow {
  id: string;
  [key: string]: any;
}

interface DQETableData {
  columns: DQEColumn[];
  headerLabels: { [key: string]: string };
  rows: DQERow[];
}

interface LotInfo {
  numero: string;
  intitule: string;
  montant?: string;
  description?: string;
}

interface Props {
  data: DQETableData;
  onSave: (data: DQETableData) => Promise<void> | void;
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

// Colonnes par défaut pour le DQE (14 colonnes : 10 saisie + 4 calcul)
const DEFAULT_COLUMNS: DQEColumn[] = [
  { id: 'codeArticle', label: 'Code Article', width: '120px' },
  { id: 'categorie', label: 'Catégorie', width: '280px' },
  { id: 'designation', label: "Désignation de l'article", width: '450px' },
  { id: 'unite', label: 'Unité', width: '90px' },
  { id: 'quantite', label: 'Quantité', width: '110px', isEditable: true },
  { id: 'refFournisseur', label: 'Réf. Fournisseur', width: '150px' },
  { id: 'designationFournisseur', label: 'Désignation Fournisseur', width: '200px' },
  { id: 'prixUniteVenteHT', label: "Prix à l'unité de vente HT", width: '150px', isEditable: true },
  { id: 'prixUniteHT', label: "Prix à l'Unité HT", width: '130px' },
  { id: 'ecoContribution', label: 'Éco-contribution HT', width: '140px', isEditable: true },
  // Colonnes calculées (en-tête vert clair)
  { id: 'montantHT', label: 'Montant HT', width: '130px', isEditable: true, isCalculated: true },
  { id: 'tauxTVA', label: 'TVA (%)', width: '100px', isEditable: true },
  { id: 'montantTVA', label: 'Montant TVA', width: '130px', isEditable: true, isCalculated: true },
  { id: 'montantTTC', label: 'Montant TTC', width: '140px', isEditable: true, isCalculated: true },
];

export function DQEForm({ data, onSave, isSaving = false, procedureInfo, totalLots, currentLot, onLotChange, lotsConfig = [] }: Props) {
  const [isFullPage, setIsFullPage] = useState(true); // Ouvrir directement en pleine page
  const [columns, setColumns] = useState<DQEColumn[]>(data.columns || DEFAULT_COLUMNS);
  const [headerLabels, setHeaderLabels] = useState<{ [key: string]: string }>(
    data.headerLabels || DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: col.label }), {})
  );
  const [rows, setRows] = useState<DQERow[]>(data.rows || []);
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
  const [totalHT, setTotalHT] = useState(0);
  const [totalTVA, setTotalTVA] = useState(0);
  const [totalTTC, setTotalTTC] = useState(0);
  const [isLoadingBPU, setIsLoadingBPU] = useState(false);
  
  // Refs pour synchroniser les scrolls
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🆕 Synchroniser les données depuis les props quand elles changent (changement de lot)
  useEffect(() => {
    console.log('📥 Chargement des données DQE depuis Supabase');
    
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
      const initialRows: DQERow[] = Array.from({ length: 10 }, (_, i) => ({
        id: `row-${Date.now()}-${i}`,
        ...DEFAULT_COLUMNS.reduce((acc, col) => ({ ...acc, [col.id]: '' }), {}),
        tauxTVA: '20', // TVA par défaut à 20%
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

  // 🆕 Fonction pour nettoyer et convertir les valeurs numériques
  const parseNumericValue = (value: any): number => {
    if (value === null || value === undefined || value === '') return 0;
    
    // Convertir en string et nettoyer
    let cleaned = String(value)
      .trim()
      .replace(/\s+/g, '') // Supprimer tous les espaces
      .replace(/,/g, '.'); // Remplacer virgules par points
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculer automatiquement les montants et totaux
  useEffect(() => {
    let sumHT = 0;
    let sumTVA = 0;
    let sumTTC = 0;
    let needsUpdate = false;

    const updatedRows = rows.map((row, index) => {
      const quantite = parseNumericValue(row.quantite);
      const prixUniteVenteHT = parseNumericValue(row.prixUniteVenteHT);
      const ecoContribution = parseNumericValue(row.ecoContribution);
      const tauxTVA = parseNumericValue(row.tauxTVA) || 20;

      // Log de débogage pour la première ligne avec des valeurs (ou première ligne)
      if (index === 0) {
        console.log('🧮 Calcul DQE ligne 1:', {
          quantite_raw: row.quantite,
          quantite_parsed: quantite,
          prixUniteVenteHT_raw: row.prixUniteVenteHT,
          prixUniteVenteHT_parsed: prixUniteVenteHT,
          ecoContribution_raw: row.ecoContribution,
          ecoContribution_parsed: ecoContribution,
          tauxTVA_raw: row.tauxTVA,
          tauxTVA_parsed: tauxTVA,
          formule: `${quantite} × (${prixUniteVenteHT} + ${ecoContribution})`,
          resultat_HT: quantite * (prixUniteVenteHT + ecoContribution)
        });
      }

      // Calcul Montant HT = Quantité × (Prix Unité Vente HT + Éco-contribution HT)
      const montantHT = quantite * (prixUniteVenteHT + ecoContribution);
      
      // Calcul Montant TVA = Montant HT × (TVA / 100)
      const montantTVA = montantHT * (tauxTVA / 100);
      
      // Calcul Montant TTC = Montant HT + Montant TVA
      const montantTTC = montantHT + montantTVA;

      // Accumuler les totaux
      sumHT += montantHT;
      sumTVA += montantTVA;
      sumTTC += montantTTC;

      const newMontantHT = montantHT > 0 ? montantHT.toFixed(2) : '';
      const newMontantTVA = montantTVA > 0 ? montantTVA.toFixed(2) : '';
      const newMontantTTC = montantTTC > 0 ? montantTTC.toFixed(2) : '';

      // Vérifier si une mise à jour est nécessaire
      if (row.montantHT !== newMontantHT || row.montantTVA !== newMontantTVA || row.montantTTC !== newMontantTTC) {
        needsUpdate = true;
      }

      return {
        ...row,
        montantHT: newMontantHT,
        montantTVA: newMontantTVA,
        montantTTC: newMontantTTC,
      };
    });

    // Mettre à jour les lignes uniquement si nécessaire
    if (needsUpdate) {
      setRows(updatedRows);
    }

    // Mettre à jour les totaux
    setTotalHT(sumHT);
    setTotalTVA(sumTVA);
    setTotalTTC(sumTTC);
  }, [rows.map(r => `${r.quantite}-${r.prixUniteVenteHT}-${r.ecoContribution}-${r.tauxTVA}`).join('|')]);

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
      const dqeData = {
        columns,
        headerLabels,
        rows,
      };
      
      console.log('💾 Sauvegarde DQE:', {
        procedure_id: procedureInfo.numeroProcedure,
        numero_lot: procedureInfo.numeroLot,
        nb_colonnes: columns.length,
        nb_lignes: rows.length
      });

      const { data, error } = await supabase
        .from('dqes')
        .upsert({
          procedure_id: procedureInfo.numeroProcedure,
          numero_lot: parseInt(procedureInfo.numeroLot),
          libelle_lot: procedureInfo.libelleLot || '',
          data: dqeData,
        }, {
          onConflict: 'procedure_id,numero_lot',
        });

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        setSaveStatus(`❌ Erreur: ${error.message}`);
      } else {
        console.log('✅ DQE sauvegardé avec succès');
        setSaveStatus('✅ Enregistré avec succès !');
        // Appeler aussi onSave pour mettre à jour l'état local du module DCE si nécessaire
        const updatedData: DQETableData = { columns, headerLabels, rows };
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
    const newRows: DQERow[] = Array.from({ length: count }, (_, i) => ({
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
    const newCols: DQEColumn[] = Array.from({ length: count }, (_, i) => ({
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

  const exportToExcel = () => {
    // Vérifier s'il y a des données à exporter
    const hasData = rows.some(row => 
      columns.some(col => !col.isCalculated && row[col.id] && row[col.id].toString().trim() !== '')
    );
    
    if (!hasData) {
      setSaveStatus('⚠️ Aucune donnée à exporter. Veuillez saisir des données ou charger depuis le BPU.');
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }
    
    const wb = XLSX.utils.book_new();

    // ========== FEUILLE 1 : Informations de la procédure ==========
    const infoData: any[][] = [
      ['DÉCOMPTE QUANTITATIF ESTIMATIF'],
      [''],
      ['Informations de la procédure'],
      [''],
      ['Numéro de procédure', procedureInfo?.numeroProcedure || 'N/A'],
      ['Titre du marché', procedureInfo?.titreMarche || 'N/A'],
      ['Acheteur', procedureInfo?.acheteur || 'N/A'],
      [''],
      ['Informations du lot'],
      [''],
      ['Numéro de lot', procedureInfo?.numeroLot || 'N/A'],
      ['Libellé du lot', procedureInfo?.libelleLot || 'N/A'],
      [''],
      ['Date d\'export', new Date().toLocaleDateString('fr-FR', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })],
      [''],
      ['Statistiques'],
      [''],
      ['Nombre de lignes', rows.length],
      ['Nombre de colonnes', columns.length],
      [''],
      ['Totaux calculés'],
      [''],
      ['Total HT', `${totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
      ['Total TVA', `${totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
      ['Total TTC', `${totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
      [''],
      [''],
      ['Attention :'],
      [''],
      ['* Si les lignes du Décompte ne sont pas toutes complétées, l\'offre ne sera pas retenue.'],
      [''],
      ['* Il est impératif de respecter à minima les caractéristiques techniques indiquées dans la désignation de l\'article, sans quoi l\'offre ne sera pas retenue.'],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    
    // Mise en forme de la feuille d'informations
    wsInfo['!cols'] = [
      { wch: 30 }, // Colonne A (libellés)
      { wch: 60 }, // Colonne B (valeurs)
    ];

    // ========== FEUILLE 2 : Données DQE ==========
    const wsData: any[][] = [];
    
    // En-tête avec les labels personnalisés
    wsData.push(columns.map(col => headerLabels[col.id] || col.label));
    
    // Lignes de données - filtrer les lignes vides
    const nonEmptyRows = rows.filter(row => {
      // Ligne considérée non vide si au moins une colonne (hors id et calculées) a une valeur
      return columns.some(col => !col.isCalculated && row[col.id] && row[col.id].toString().trim() !== '');
    });
    
    // Si aucune ligne non vide, inclure toutes les lignes
    const rowsToExport = nonEmptyRows.length > 0 ? nonEmptyRows : rows;
    
    rowsToExport.forEach(row => {
      wsData.push(columns.map(col => row[col.id] || ''));
    });
    
    console.log('📊 Export Excel - Lignes exportées:', rowsToExport.length, '/', rows.length);

    const wsDQE = XLSX.utils.aoa_to_sheet(wsData);
    
    // Définir les largeurs des colonnes pour la feuille DQE
    wsDQE['!cols'] = columns.map(col => ({
      wch: Math.max(15, parseInt(col.width || '150') / 8) // Conversion approximative de px en caractères
    }));

    // Ajouter les feuilles au classeur
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
    XLSX.utils.book_append_sheet(wb, wsDQE, 'DQE');
    
    const fileName = `${procedureInfo?.numeroProcedure || 'export'}_DQE_LOT${procedureInfo?.numeroLot || '1'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    console.log('✅ Export Excel terminé:', fileName);
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

        // Chercher l'onglet "DQE", "BPU" ou utiliser le premier onglet
        console.log('📋 Onglets disponibles:', workbook.SheetNames);
        
        let sheetName = workbook.SheetNames[0];
        const dataSheet = workbook.SheetNames.find(name => 
          name.toLowerCase().includes('dqe') || 
          name.toLowerCase().includes('decompte') ||
          name.toLowerCase().includes('bpu') ||
          name.toLowerCase().includes('bordereau')
        );
        
        if (dataSheet) {
          sheetName = dataSheet;
          console.log('✅ Onglet de données trouvé:', sheetName);
        } else {
          console.log('⚠️ Onglet de données non trouvé, utilisation du premier onglet:', sheetName);
        }
        
        const sheet = workbook.Sheets[sheetName];
        const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
          setImportStatus('❌ Fichier vide ou invalide');
          setTimeout(() => setImportStatus(null), 3000);
          return;
        }

        console.log('📥 Import Excel - Toutes les lignes:', jsonData.slice(0, 15)); // Afficher les 15 premières lignes

        // Trouver la ligne d'en-tête en cherchant des mots-clés typiques du DQE/BPU
        let headerRowIndex = 0;
        const dqeKeywords = ['code', 'article', 'categorie', 'catégorie', 'designation', 'désignation', 'unite', 'unité', 'quantite', 'quantité', 'prix', 'ref', 'référence', 'fournisseur', 'marque', 'conditionnement'];
        
        for (let i = 0; i < Math.min(20, jsonData.length); i++) {
          const row = jsonData[i];
          if (!row || row.length === 0) continue;
          
          // Compter combien de cellules contiennent des mots-clés DQE
          const keywordMatches = row.filter(cell => {
            if (!cell) return false;
            const cellStr = cell.toString().toLowerCase();
            return dqeKeywords.some(keyword => cellStr.includes(keyword));
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
          
          // Chercher une correspondance EXACTE d'abord (exclure les colonnes calculées)
          let matchingColumn = columns.find(col => {
            if (usedColumns.has(col.id)) return false; // Déjà utilisé
            if (col.isCalculated) return false; // Ne pas mapper les colonnes calculées
            const colLabel = normalize(headerLabels[col.id] || col.label);
            const colId = normalize(col.id);
            return colLabel === normalizedImported || colId === normalizedImported;
          });

          // Si pas de correspondance exacte, chercher une correspondance partielle
          if (!matchingColumn) {
            matchingColumn = columns.find(col => {
              if (usedColumns.has(col.id)) return false; // Déjà utilisé
              if (col.isCalculated) return false; // Ne pas mapper les colonnes calculées
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
        const newRows: DQERow[] = importedRows.map((row, rowIndex) => {
          const newRow: DQERow = {
            id: `row-${Date.now()}-${rowIndex}`,
            tauxTVA: '20', // TVA par défaut à 20%
          };

          // Initialiser toutes les colonnes (sauf les colonnes calculées)
          columns.forEach(col => {
            if (!col.isCalculated) {
              newRow[col.id] = col.id === 'tauxTVA' ? '20' : '';
            }
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

        console.log('✅ Import terminé - Les montants seront calculés automatiquement');
        
        // Remplacer les lignes existantes ou les étendre si nécessaire
        if (newRows.length > rows.length) {
          // Plus de lignes dans l'import : remplacer et ajouter
          setRows(newRows);
          setImportStatus(`✅ ${newRows.length} lignes importées (${newRows.length - rows.length} lignes ajoutées) - Calculs automatiques activés`);
        } else {
          // Moins de lignes : remplacer les premières et garder les anciennes après
          const updatedRows = [...newRows];
          for (let i = newRows.length; i < rows.length; i++) {
            updatedRows.push(rows[i]);
          }
          setRows(updatedRows);
          setImportStatus(`✅ ${newRows.length} lignes importées - Calculs automatiques activés`);
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

  // Charger les données depuis le BPU
  const handleLoadFromBPU = async () => {
    if (!procedureInfo?.numeroProcedure || !procedureInfo?.numeroLot) {
      setSaveStatus('❌ Erreur: Informations de procédure manquantes');
      setTimeout(() => setSaveStatus(null), 3000);
      return;
    }

    setIsLoadingBPU(true);
    setSaveStatus('⏳ Chargement des données BPU...');

    try {
      // Récupérer les données BPU depuis Supabase
      const { data: bpuData, error } = await supabase
        .from('bpus')
        .select('data')
        .eq('procedure_id', procedureInfo.numeroProcedure)
        .eq('numero_lot', parseInt(procedureInfo.numeroLot))
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du BPU:', error);
        setSaveStatus('❌ Aucun BPU trouvé pour ce lot');
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      if (!bpuData || !bpuData.data) {
        setSaveStatus('❌ Aucune donnée BPU disponible pour ce lot');
        setTimeout(() => setSaveStatus(null), 3000);
        return;
      }

      const bpuTableData = bpuData.data as any;
      const bpuRows = bpuTableData.rows || [];

      console.log('📥 Données BPU chargées:', bpuRows.length, 'lignes');

      // Mapper les données BPU vers le format DQE
      const newRows: DQERow[] = bpuRows.map((bpuRow: any, index: number) => ({
        id: `row-${Date.now()}-${index}`,
        codeArticle: bpuRow.codeArticle || '',
        categorie: bpuRow.categorie || '',
        designation: bpuRow.designation || '',
        unite: bpuRow.unite || '',
        quantite: '', // À compléter par le candidat
        refFournisseur: bpuRow.refFournisseur || '',
        designationFournisseur: bpuRow.designationFournisseur || '',
        prixUniteVenteHT: bpuRow.prixUniteVenteHT || '',
        prixUniteHT: bpuRow.prixUniteHT || '',
        ecoContribution: bpuRow.ecoContribution || '',
        tauxTVA: '20', // TVA par défaut
        // Les colonnes calculées seront générées automatiquement
      }));

      setRows(newRows);
      setSaveStatus(`✅ ${newRows.length} lignes chargées depuis le BPU - Complétez les quantités`);
      setTimeout(() => setSaveStatus(null), 5000);
    } catch (error: any) {
      console.error('Erreur:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
      setTimeout(() => setSaveStatus(null), 3000);
    } finally {
      setIsLoadingBPU(false);
    }
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

      // Récupérer les données DQE de chaque lot depuis Supabase
      const { data: dqesData, error } = await supabase
        .from('dqes')
        .select('*')
        .eq('procedure_id', procedureInfo.numeroProcedure)
        .in('numero_lot', lotsToExport);

      if (error) {
        console.error('Erreur Supabase:', error);
      }

      console.log(`📦 Export ZIP - ${dqesData?.length || 0} DQE trouvés dans Supabase`);
      console.log(`📦 Export ZIP - Lots à exporter:`, lotsToExport);
      
      // Créer un fichier Excel pour chaque lot demandé
      for (const lotNum of lotsToExport) {
        const dqeRecord = dqesData?.find(b => b.numero_lot === lotNum);
        const lotData = dqeRecord?.data as DQETableData | undefined;
        const wb = XLSX.utils.book_new();
        
        console.log(`📄 Création du fichier pour lot ${lotNum}:`, dqeRecord ? 'Données trouvées' : 'Tableau vide');

        // Calculer les totaux pour ce lot
        const lotTotals = lotData ? {
          totalHT: 0,
          totalTVA: 0,
          totalTTC: 0
        } : { totalHT: 0, totalTVA: 0, totalTTC: 0 };

        if (lotData && lotData.rows) {
          lotData.rows.forEach((row: any) => {
            const quantite = parseNumericValue(row.quantite);
            const prixUniteVenteHT = parseNumericValue(row.prixUniteVenteHT);
            const ecoContribution = parseNumericValue(row.ecoContribution);
            const tauxTVA = parseNumericValue(row.tauxTVA) || 20;

            const montantHT = quantite * (prixUniteVenteHT + ecoContribution);
            const montantTVA = montantHT * (tauxTVA / 100);
            const montantTTC = montantHT + montantTVA;

            lotTotals.totalHT += montantHT;
            lotTotals.totalTVA += montantTVA;
            lotTotals.totalTTC += montantTTC;
          });
        }

        // Page d'informations
        const infoData: any[][] = [
          ['DÉCOMPTE QUANTITATIF ESTIMATIF'],
          [''],
          ['Procédure', procedureInfo.numeroProcedure],
          ['Marché', procedureInfo.titreMarche || 'N/A'],
          ['Acheteur', procedureInfo.acheteur || 'N/A'],
          [''],
          ['Lot N°', lotNum],
          ['Nom du lot', getLotName(lotNum)],
          [''],
          ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
          [''],
          ['Totaux calculés'],
          ['Total HT', `${lotTotals.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
          ['Total TVA', `${lotTotals.totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
          ['Total TTC', `${lotTotals.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`],
        ];

        const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
        wsInfo['!cols'] = [{ wch: 30 }, { wch: 60 }];

        // Données DQE
        let wsData: any[][] = [];
        
        if (lotData && lotData.columns && lotData.rows) {
          // Lot avec données DQE existantes
          console.log(`📊 Lot ${lotNum} - Export de ${lotData.rows.length} lignes avec ${lotData.columns.length} colonnes`);
          
          wsData.push(lotData.columns.map(col => lotData.headerLabels?.[col.id] || col.label));
          
          // Filtrer les lignes vides et exporter
          const nonEmptyRows = lotData.rows.filter((row: any) => {
            return lotData.columns.some((col: any) => !col.isCalculated && row[col.id] && row[col.id].toString().trim() !== '');
          });
          
          const rowsToExport = nonEmptyRows.length > 0 ? nonEmptyRows : lotData.rows;
          
          rowsToExport.forEach((row: any) => {
            wsData.push(lotData.columns.map((col: any) => row[col.id] || ''));
          });
          
          console.log(`✅ Lot ${lotNum} - ${rowsToExport.length} lignes exportées`);
        } else {
          // Lot sans données DQE : utiliser la structure par défaut
          console.log(`⚠️ Lot ${lotNum} - Aucune donnée, utilisation du tableau par défaut`);
          wsData.push(DEFAULT_COLUMNS.map(col => col.label));
          // Ajouter 10 lignes vides
          for (let i = 0; i < 10; i++) {
            wsData.push(DEFAULT_COLUMNS.map(() => ''));
          }
        }

        const wsDQE = XLSX.utils.aoa_to_sheet(wsData);
        
        // Définir les largeurs
        if (lotData?.columns) {
          wsDQE['!cols'] = lotData.columns.map(col => ({
            wch: Math.max(15, parseInt(col.width || '150') / 8)
          }));
        } else {
          wsDQE['!cols'] = DEFAULT_COLUMNS.map(col => ({
            wch: Math.max(15, parseInt(col.width || '150') / 8)
          }));
        }

        XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
        XLSX.utils.book_append_sheet(wb, wsDQE, 'DQE');

        // Convertir en buffer et ajouter au ZIP
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        
        // Nom de fichier sécurisé
        const safeLotName = getLotName(lotNum).replace(/[<>:"/\\|?*]/g, '_').substring(0, 100);
        zip.file(`${procedureInfo.numeroProcedure}_DQE_LOT${lotNum}_${safeLotName}.xlsx`, wbout);
      }

      // Générer et télécharger le ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = `${procedureInfo.numeroProcedure}_DQE_${lotsToExport.length}_lots.zip`;
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
      const wb = XLSX.utils.book_new();

      console.log('📋 Export Consolidé - Lots Configuration depuis props:', lotsConfig.length, 'lots');

      // Fonction pour obtenir le nom d'un lot - VERSION ROBUSTE
      const getLotName = (numeroLot: number): string => {
        // Essayer plusieurs méthodes de correspondance
        let lot = lotsConfig.find((l: any) => {
          if (typeof l.numero === 'number' && l.numero === numeroLot) return true;
          if (typeof l.numero === 'string' && parseInt(l.numero) === numeroLot) return true;
          if (typeof l.numero === 'string' && l.numero === numeroLot.toString()) return true;
          return false;
        });
        
        return lot ? (lot.intitule || `Lot ${numeroLot}`) : `Lot ${numeroLot}`;
      };

      // Fonction pour obtenir le montant estimé d'un lot
      const getLotAmount = (numeroLot: number): string => {
        let lot = lotsConfig.find((l: any) => {
          if (typeof l.numero === 'number' && l.numero === numeroLot) return true;
          if (typeof l.numero === 'string' && parseInt(l.numero) === numeroLot) return true;
          if (typeof l.numero === 'string' && l.numero === numeroLot.toString()) return true;
          return false;
        });
        
        return lot && lot.montant ? lot.montant : '';
      };

      // Fonction pour obtenir le montant estimé HT numérique
      const getLotAmountNumeric = (numeroLot: number): number => {
        const amountStr = getLotAmount(numeroLot);
        if (!amountStr) return 0;
        
        // Extraire le nombre (enlever espaces, € HT, etc.)
        const cleaned = amountStr.replace(/[^\d,.-]/g, '').replace(/,/g, '.');
        return parseFloat(cleaned) || 0;
      };

      // Fonction pour calculer les totaux d'un lot DQE
      const calculateLotTotals = (lotData: DQETableData | undefined): { totalHT: number; totalTVA: number; totalTTC: number } => {
        if (!lotData || !lotData.rows || lotData.rows.length === 0) {
          return { totalHT: 0, totalTVA: 0, totalTTC: 0 };
        }

        let sumHT = 0;
        let sumTVA = 0;
        let sumTTC = 0;

        lotData.rows.forEach((row: any) => {
          const quantite = parseNumericValue(row.quantite);
          const prixUniteVenteHT = parseNumericValue(row.prixUniteVenteHT);
          const ecoContribution = parseNumericValue(row.ecoContribution);
          const tauxTVA = parseNumericValue(row.tauxTVA) || 20;

          const montantHT = quantite * (prixUniteVenteHT + ecoContribution);
          const montantTVA = montantHT * (tauxTVA / 100);
          const montantTTC = montantHT + montantTVA;

          sumHT += montantHT;
          sumTVA += montantTVA;
          sumTTC += montantTTC;
        });

        return { totalHT: sumHT, totalTVA: sumTVA, totalTTC: sumTTC };
      };

      // Récupérer les données DQE de chaque lot depuis Supabase
      const { data: dqesData, error } = await supabase
        .from('dqes')
        .select('*')
        .eq('procedure_id', procedureInfo.numeroProcedure)
        .in('numero_lot', lotsToExport)
        .order('numero_lot');

      if (error) {
        console.error('Erreur Supabase DQE:', error);
      }

      console.log(`📊 ${dqesData?.length || 0} DQE trouvés sur ${lotsToExport.length} lots demandés`);

      // ===== PAGE DE GARDE =====
      const coverData: any[][] = [
        ['DÉCOMPTE QUANTITATIF ESTIMATIF'],
        [''],
        ['INFORMATIONS DE LA PROCÉDURE'],
        [''],
        ['Numéro de procédure', procedureInfo.numeroProcedure],
        ['Titre du marché', procedureInfo.titreMarche || 'N/A'],
        ['Acheteur', procedureInfo.acheteur || 'N/A'],
        [''],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })],
        [''],
        [''],
        ['LOTS INCLUS DANS CE DOCUMENT'],
        [''],
        ['N° Lot', 'Nom du lot', 'Montant estimé', 'Nb lignes DQE', 'Total HT', 'Total TVA', 'Total TTC', 'Écart HT'],
      ];

      // Ajouter la liste de TOUS les lots demandés (même sans DQE)
      lotsToExport.forEach(lotNum => {
        const dqeForLot = dqesData?.find(b => b.numero_lot === lotNum);
        const lotData = dqeForLot?.data as DQETableData | undefined;
        const totals = calculateLotTotals(lotData);
        const montantEstime = getLotAmountNumeric(lotNum);
        const ecartHT = totals.totalHT - montantEstime;
        
        coverData.push([
          `Lot ${lotNum}`,
          getLotName(lotNum),
          montantEstime > 0 ? `${montantEstime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '',
          lotData?.rows?.length || 0,
          totals.totalHT > 0 ? `${totals.totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €',
          totals.totalTVA > 0 ? `${totals.totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €',
          totals.totalTTC > 0 ? `${totals.totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €',
          montantEstime > 0 ? `${ecartHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : ''
        ]);
      });

      coverData.push(['']);
      coverData.push(['']);
      coverData.push(['NAVIGATION']);
      coverData.push(['']);
      coverData.push(['Chaque lot dispose de son propre onglet dans ce classeur.']);
      coverData.push(['Utilisez les onglets en bas pour naviguer entre les lots.']);
      coverData.push(['']);
      coverData.push(['Note : Les lots sans données DQE affichent un tableau vide à compléter.']);

      const wsCover = XLSX.utils.aoa_to_sheet(coverData);
      wsCover['!cols'] = [
        { wch: 15 },  // N° Lot
        { wch: 50 },  // Nom du lot
        { wch: 18 },  // Montant estimé
        { wch: 15 },  // Nb lignes DQE
        { wch: 18 },  // Total HT
        { wch: 18 },  // Total TVA
        { wch: 18 },  // Total TTC
        { wch: 18 }   // Écart HT
      ];
      XLSX.utils.book_append_sheet(wb, wsCover, 'Page de garde');

      // ===== ONGLETS PAR LOT =====
      console.log(`📦 Export Consolidé - ${dqesData?.length || 0} DQE trouvés dans Supabase`);
      
      // Créer un onglet pour CHAQUE lot demandé
      for (const lotNum of lotsToExport) {
        const dqeRecord = dqesData?.find(b => b.numero_lot === lotNum);
        const lotData = dqeRecord?.data as DQETableData | undefined;
        
        console.log(`📄 Lot ${lotNum}:`, dqeRecord ? `${lotData?.rows?.length || 0} lignes` : 'Tableau vide');
        
        let wsData: any[][] = [];
        
        if (lotData && lotData.columns && lotData.rows) {
          // Lot avec données DQE existantes
          wsData.push(lotData.columns.map(col => lotData.headerLabels?.[col.id] || col.label));
          
          // Filtrer les lignes vides et exporter
          const nonEmptyRows = lotData.rows.filter((row: any) => {
            return lotData.columns.some((col: any) => !col.isCalculated && row[col.id] && row[col.id].toString().trim() !== '');
          });
          
          const rowsToExport = nonEmptyRows.length > 0 ? nonEmptyRows : lotData.rows;
          
          rowsToExport.forEach((row: any) => {
            wsData.push(lotData.columns.map((col: any) => row[col.id] || ''));
          });
        } else {
          // Lot sans données DQE : utiliser la structure par défaut
          wsData.push(DEFAULT_COLUMNS.map(col => col.label));
          // Ajouter 10 lignes vides
          for (let i = 0; i < 10; i++) {
            wsData.push(DEFAULT_COLUMNS.map(() => ''));
          }
        }

        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        // Définir les largeurs
        if (lotData?.columns) {
          ws['!cols'] = lotData.columns.map(col => ({
            wch: Math.max(15, parseInt(col.width || '150') / 8)
          }));
        } else {
          ws['!cols'] = DEFAULT_COLUMNS.map(col => ({
            wch: Math.max(15, parseInt(col.width || '150') / 8)
          }));
        }

        // Nom d'onglet limité à 31 caractères
        const sheetName = `Lot ${lotNum}`.substring(0, 31);
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
      }

      // Télécharger le fichier
      const fileName = `${procedureInfo.numeroProcedure}_DQE_Consolidé_${lotsToExport.length}_lots.xlsx`;
      XLSX.writeFile(wb, fileName);

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
    const emptyRows: DQERow[] = Array.from({ length: 10 }, (_, i) => ({
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
      const dqeData = {
        columns,
        headerLabels,
        rows,
      };

      // ÉTAPE 1 : Sauvegarder le lot actuel AVANT de dupliquer
      console.log('💾 Sauvegarde du lot source:', currentLot);
      const { error: saveError } = await supabase
        .from('dqes')
        .upsert({
          procedure_id: procedureInfo.numeroProcedure,
          numero_lot: parseInt(procedureInfo.numeroLot!),
          libelle_lot: procedureInfo.libelleLot || '',
          data: dqeData,
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
        data: dqeData,
      }));

      // Upsert en masse
      const { error: duplicateError } = await supabase
        .from('dqes')
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
        const updatedData: DQETableData = { columns, headerLabels, rows };
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
            Décompte Quantitatif Estimatif
          </h3>
          <p className="text-gray-600 mb-6">
            Créez votre maquette de décompte avec un tableau personnalisable
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
    <div className="dce-dqe-fullpage fixed inset-0 bg-white dark:bg-slate-900 z-50 overflow-hidden flex flex-col">
      {/* En-tête fixe */}
      <div className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-600 shadow-sm z-20">
        <div className="px-6 py-4">
          {/* Bouton retour et actions principales */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullPage(false)}
                className="dce-dqe-retour flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 dark:border dark:border-slate-600 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>

              {/* Titre du module */}
              <h1 className="text-xl font-bold text-[#2F5B58] dark:text-emerald-300 border-l border-gray-300 dark:border-slate-600 pl-4">
                DÉCOMPTE QUANTITATIF ESTIMATIF (DQE)
              </h1>

              {/* Navigation entre les lots */}
              {totalLots && totalLots > 1 && currentLot && onLotChange && (
                <div className="flex items-center gap-3 border-l border-gray-300 dark:border-slate-600 pl-4">
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
                      className="dce-dqe-select px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg font-medium focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] bg-white dark:bg-slate-700 dark:text-slate-100"
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
                onClick={handleLoadFromBPU}
                disabled={isLoadingBPU}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                title="Charger les données depuis le BPU du même lot"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingBPU ? 'animate-spin' : ''}`} />
                {isLoadingBPU ? 'Chargement...' : 'Charger depuis BPU'}
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
                className="flex items-center gap-2 px-3 py-2 bg-gradient-to-b from-[#2F5B58] to-[#234441] hover:from-[#234441] hover:to-[#1a3330] text-white rounded-lg transition disabled:opacity-50 text-sm shadow-md"
                title="Enregistrer le DQE"
              >
                <Save className="w-4 h-4" />
                {isSavingData ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Informations de la procédure */}
          {procedureInfo && (
            <div className="dce-dqe-procedure-info bg-gradient-to-r from-green-50 to-emerald-50 dark:from-slate-700 dark:to-slate-800 rounded-lg p-4 mb-4 dark:border dark:border-slate-600">
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

          {/* Écart Budget / Total HT réel */}
          {procedureInfo?.numeroLot && (() => {
            const currentLotNum = parseInt(procedureInfo.numeroLot, 10) || currentLot || 1;
            const lotFromConfig = lotsConfig.find((l: LotInfo) => {
              const n = typeof l.numero === 'string' ? parseInt(l.numero, 10) : l.numero;
              return n === currentLotNum;
            });
            const budgetEstime = lotFromConfig?.montant
              ? parseFloat(String(lotFromConfig.montant).replace(/[^\d,.-]/g, '').replace(/,/g, '.')) || 0
              : 0;
            const ecartHT = totalHT - budgetEstime;
            const hasBudget = budgetEstime > 0;

            if (!hasBudget) return null;

            const ecartColor =
              ecartHT > 0 ? 'text-red-600 font-bold'   // supérieur → rouge
              : ecartHT < 0 ? 'text-green-600 font-bold' // inférieur → vert
              : 'text-gray-900 font-bold';              // égal → noir

            const ecartLabel =
              ecartHT > 0 ? `+ ${ecartHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
              : ecartHT < 0 ? `${ecartHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
              : '0,00 €';

            return (
              <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div>
                    <span className="font-semibold text-gray-600">Budget estimé HT :</span>{' '}
                    <span className="text-gray-900">{budgetEstime.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Total HT réel :</span>{' '}
                    <span className="text-gray-900">{totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-600">Écart :</span>{' '}
                    <span className={ecartColor}>{ecartLabel}</span>
                    {ecartHT > 0 && <span className="text-red-600 text-xs ml-1">(au-dessus du budget)</span>}
                    {ecartHT < 0 && <span className="text-green-600 text-xs ml-1">(sous le budget)</span>}
                    {ecartHT === 0 && <span className="text-gray-500 text-xs ml-1">(égal au budget)</span>}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Totaux DQE */}
          <div className="bg-gradient-to-r from-[#4A9B8E] to-[#3A8B7E] rounded-lg p-4 mb-4 shadow-md">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-xs font-medium text-white opacity-90 mb-1">TOTAL HT</div>
                <div className="text-2xl font-bold text-white">
                  {totalHT.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-xs font-medium text-white opacity-90 mb-1">TOTAL TVA</div>
                <div className="text-2xl font-bold text-white">
                  {totalTVA.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3">
                <div className="text-xs font-medium text-white opacity-90 mb-1">TOTAL TTC</div>
                <div className="text-2xl font-bold text-white">
                  {totalTTC.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                </div>
              </div>
            </div>
            
            {/* Message d'aide si totaux = 0 */}
            {totalHT === 0 && rows.some(r => r.prixUniteVenteHT || r.ecoContribution) && (
              <div className="mt-3 bg-white bg-opacity-20 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-white font-medium">
                  💡 Astuce : Remplissez les <strong>Quantités</strong> pour voir les calculs automatiques (Montant HT, TVA, TTC)
                </p>
              </div>
            )}
          </div>

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
          className="dce-dqe-table-scroll h-full overflow-auto px-6 py-6"
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
                      className={`border border-gray-300 px-2 py-3 text-left font-semibold relative group ${
                        col.isEditable ? 'bg-[#4A9B8E] text-white' : ''
                      }`}
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
                      <td 
                        key={col.id} 
                        className={`border border-gray-300 dark:border-slate-600 px-2 py-1 ${col.isCalculated ? 'bg-[#E8F5F3] dark:bg-slate-700' : ''}`}
                        style={{ width: col.width || '150px', minWidth: col.width || '150px' }}
                      >
                        {col.isCalculated ? (
                          // Colonne calculée : affichage en lecture seule
                          <div className="w-full px-2 py-1 text-sm font-medium text-gray-700 dark:text-slate-200">
                            {row[col.id] || ''}
                          </div>
                        ) : (
                          // Colonne éditable : input
                          <input
                            type="text"
                            value={row[col.id] || ''}
                            onChange={(e) => handleCellChange(row.id, col.id, e.target.value)}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#2F5B58] rounded bg-transparent text-sm"
                            placeholder={col.id.includes('url') ? 'https://...' : ''}
                          />
                        )}
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
                  Dupliquer le DQE vers d'autres lots
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
