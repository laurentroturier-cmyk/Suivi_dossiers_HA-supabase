import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Download, Edit2, ArrowLeft, Save, Upload, ChevronLeft, ChevronRight, AlertTriangle, Database } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../../../../lib/supabase';

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
}

// Colonnes complètes selon les images fournies
const DEFAULT_COLUMNS: BPUColumn[] = [
  { id: 'codeArticle', label: 'Code Article', width: '120px' },
  { id: 'categorie', label: 'Catégorie', width: '130px' },
  { id: 'designation', label: "Désignation de l'article", width: '250px' },
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

export function BPUForm({ data, onSave, isSaving = false, procedureInfo, totalLots, currentLot, onLotChange }: Props) {
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
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  
  // Refs pour synchroniser les scrolls
  const topScrollRef = useRef<HTMLDivElement>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleSave = () => {
    const updatedData: BPUTableData = {
      columns,
      headerLabels,
      rows,
    };
    onSave(updatedData);
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

  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();

    // ========== FEUILLE 1 : Informations de la procédure ==========
    const infoData: any[][] = [
      ['BORDEREAU DE PRIX UNITAIRES'],
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
      [''],
      ['Attention :'],
      [''],
      ['* Si les lignes du Bordereau de prix ne sont pas toutes complétées, l\'offre ne sera pas retenue.'],
      [''],
      ['* Il est impératif de respecter à minima les caractéristiques techniques indiquées dans la désignation de l\'article, sans quoi l\'offre ne sera pas retenue.'],
    ];

    const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
    
    // Mise en forme de la feuille d'informations
    wsInfo['!cols'] = [
      { wch: 30 }, // Colonne A (libellés)
      { wch: 60 }, // Colonne B (valeurs)
    ];

    // ========== FEUILLE 2 : Données BPU ==========
    const wsData: any[][] = [];
    
    // En-tête avec les labels personnalisés
    wsData.push(columns.map(col => headerLabels[col.id] || col.label));
    
    // Lignes de données
    rows.forEach(row => {
      wsData.push(columns.map(col => row[col.id] || ''));
    });

    const wsBPU = XLSX.utils.aoa_to_sheet(wsData);
    
    // Définir les largeurs des colonnes pour la feuille BPU
    wsBPU['!cols'] = columns.map(col => ({
      wch: Math.max(15, parseInt(col.width || '150') / 8) // Conversion approximative de px en caractères
    }));

    // Ajouter les feuilles au classeur
    XLSX.utils.book_append_sheet(wb, wsInfo, 'Informations');
    XLSX.utils.book_append_sheet(wb, wsBPU, 'BPU');
    
    const fileName = `BPU_${procedureInfo?.numeroProcedure || 'export'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(wb, fileName);
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

        console.log('📥 Import Excel - Toutes les lignes:', jsonData.slice(0, 10)); // Afficher les 10 premières lignes

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
        
        importedHeaders.forEach((importedHeader, index) => {
          const normalizedImported = importedHeader.toString().toLowerCase().trim();
          
          // Chercher une correspondance dans nos colonnes
          const matchingColumn = columns.find(col => {
            const colLabel = (headerLabels[col.id] || col.label).toLowerCase().trim();
            return colLabel === normalizedImported || 
                   colLabel.includes(normalizedImported) || 
                   normalizedImported.includes(colLabel);
          });

          if (matchingColumn) {
            columnMapping[index] = matchingColumn.id;
            console.log(`✅ Mapping: Colonne ${index} "${importedHeader}" → ${matchingColumn.id}`);
          } else {
            console.log(`⚠️ Pas de correspondance pour: "${importedHeader}"`);
          }
        });

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

          // Log la première ligne pour vérification
          if (rowIndex === 0) {
            console.log('📝 Première ligne importée:', newRow);
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

  // Sauvegarder dans Supabase
  const handleSaveToSupabase = async () => {
    if (!procedureInfo?.numeroProcedure || !procedureInfo?.numeroLot) {
      setSaveStatus('❌ Erreur: Informations de procédure manquantes');
      setTimeout(() => setSaveStatus(null), 4000);
      return;
    }

    setIsSavingToDb(true);
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
        setSaveStatus('✅ Enregistré dans Supabase !');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      setSaveStatus(`❌ Erreur: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setIsSavingToDb(false);
      setTimeout(() => setSaveStatus(null), 4000);
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
            className="px-6 py-3 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition font-medium"
          >
            Ouvrir en pleine page
          </button>
        </div>
      </div>
    );
  }

  const totalWidth = columns.reduce((sum, col) => sum + parseInt(col.width || '150'), 0) + 50 + 60; // # + Actions

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-hidden flex flex-col">
      {/* En-tête fixe */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-20">
        <div className="px-6 py-4">
          {/* Bouton retour et actions principales */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsFullPage(false)}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </button>

              {/* Navigation entre les lots */}
              {totalLots && totalLots > 1 && currentLot && onLotChange && (
                <div className="flex items-center gap-3 border-l border-gray-300 pl-4">
                  {/* Bouton précédent */}
                  <button
                    onClick={() => currentLot > 1 && onLotChange(currentLot - 1)}
                    disabled={currentLot <= 1}
                    className={`p-2 rounded-lg transition-colors ${
                      currentLot > 1
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-300 cursor-not-allowed'
                    }`}
                    title="Lot précédent"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Sélecteur de lot */}
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">Lot</span>
                    <select
                      value={currentLot}
                      onChange={(e) => onLotChange(Number(e.target.value))}
                      className="px-3 py-2 border border-gray-300 rounded-lg font-medium focus:ring-2 focus:ring-[#2F5B58] focus:border-[#2F5B58] bg-white"
                    >
                      {Array.from({ length: totalLots }, (_, i) => i + 1).map((lot) => (
                        <option key={lot} value={lot}>
                          {lot}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-500">/ {totalLots}</span>
                  </div>

                  {/* Bouton suivant */}
                  <button
                    onClick={() => currentLot < totalLots && onLotChange(currentLot + 1)}
                    disabled={currentLot >= totalLots}
                    className={`p-2 rounded-lg transition-colors ${
                      currentLot < totalLots
                        ? 'text-gray-700 hover:bg-gray-100'
                        : 'text-gray-300 cursor-not-allowed'
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
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm"
                title="Importer un fichier Excel ou CSV"
              >
                <Upload className="w-4 h-4" />
                Importer Excel
              </button>
              <button
                onClick={exportToExcel}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm"
                title="Exporter vers Excel"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </button>
              <button
                onClick={handleClearData}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm"
                title="Effacer toutes les données"
              >
                <Trash2 className="w-4 h-4" />
                Effacer tout
              </button>
              <button
                onClick={handleSaveToSupabase}
                disabled={isSavingToDb}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50 text-sm"
                title="Sauvegarder dans la base de données"
              >
                <Database className="w-4 h-4" />
                {isSavingToDb ? 'Sauvegarde...' : 'Sauvegarder BD'}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-3 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition disabled:opacity-50 text-sm"
                title="Enregistrer dans le module DCE"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>

          {/* Informations de la procédure */}
          {procedureInfo && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-5 gap-4 text-sm">
                <div>
                  <span className="font-semibold text-gray-700">Procédure :</span>{' '}
                  <span className="text-gray-900">{procedureInfo.numeroProcedure || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Marché :</span>{' '}
                  <span className="text-gray-900">{procedureInfo.titreMarche || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Acheteur :</span>{' '}
                  <span className="text-gray-900">{procedureInfo.acheteur || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Lot N° :</span>{' '}
                  <span className="text-gray-900">{procedureInfo.numeroLot || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-semibold text-gray-700">Nom du lot :</span>{' '}
                  <span className="text-gray-900">{procedureInfo.libelleLot || 'N/A'}</span>
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
            <span className="text-sm text-gray-600 ml-auto">
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
          className="h-full overflow-auto px-6 py-6"
          onScroll={() => syncScroll('table')}
        >
          <div className="border border-gray-300 rounded-lg overflow-hidden inline-block min-w-full">
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
                className="px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition"
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
                className="px-4 py-2 bg-[#2F5B58] text-white rounded-lg hover:bg-[#234441] transition"
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Effacer tout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
