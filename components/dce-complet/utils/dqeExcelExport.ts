/**
 * Export DQE vers Excel avec mise en page enrichie (ExcelJS)
 * Spécificités DQE vs BPU :
 *   - En-têtes colonnes "isEditable" en vert teal moyen #4A9B8E (au lieu de #2F5B58)
 *   - Cellules "isCalculated" en fond #E8F5F3 dans les lignes de données
 *   - Ligne de totaux HT / TVA / TTC en bas du tableau
 *   - Feuille "Informations" enrichie avec section Totaux calculés
 *   - Page de garde consolidée : 8 colonnes dont Total HT/TVA/TTC et Écart HT
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ---- Types ----

export interface DQEExportColumn {
  id: string;
  label: string;
  width?: string;
  isEditable?: boolean;
  isCalculated?: boolean;
}

export interface DQEExportRow {
  id: string;
  [key: string]: any;
}

export interface DQEExportTableData {
  columns: DQEExportColumn[];
  headerLabels: { [key: string]: string };
  rows: DQEExportRow[];
}

export interface DQEExportProcedureInfo {
  numeroProcedure?: string;
  titreMarche?: string;
  acheteur?: string;
  numeroLot?: string | number;
  libelleLot?: string;
}

export interface DQETotals {
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export interface DQELotExportData {
  lotNum: number;
  lotName: string;
  lotAmount: string;        // texte formaté ex: "50 000 € HT"
  lotAmountNumeric: number; // valeur numérique pour calcul d'écart
  data?: DQEExportTableData;
}

// ---- Palette couleurs ----

const C = {
  teal:          '2F5B58', // en-têtes colonnes standard
  tealEditable:  '4A9B8E', // en-têtes colonnes isEditable
  tealCalcBg:    'E8F5F3', // fond cellules isCalculated
  tealLight:     'E8F2F1', // sections info
  white:         'FFFFFF',
  grayBorder:    'D1D5DB',
  grayAlt:       'F9FAFB',
  grayText:      '6B7280',
  darkText:      '1F2937',
  tealDark:      '1A3D3B',
  amber:         'D97706',
  amberLight:    'FEF3C7',
  amberBorder:   'FCD34D',
  slate50:       'F8FAFC',
  totalRowBg:    'EFF6FF', // bleu très clair pour la ligne de totaux
  totalRowBorder:'BFDBFE', // bordure ligne totaux (blue-200)
  totalText:     '1E3A5F', // texte totaux
};

// ---- Helpers bas niveau ----

const argb = (hex: string) => `FF${hex}`;

const solidFill = (hex: string): ExcelJS.Fill => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: argb(hex) },
});

const thinBorder = (hex = C.grayBorder): Partial<ExcelJS.Borders> => {
  const side: ExcelJS.Border = { style: 'thin', color: { argb: argb(hex) } };
  return { top: side, bottom: side, left: side, right: side };
};

const mediumBorder = (hex = C.totalRowBorder): Partial<ExcelJS.Borders> => {
  const side: ExcelJS.Border = { style: 'medium', color: { argb: argb(hex) } };
  return { top: side, bottom: side, left: side, right: side };
};

function addEmptyRow(ws: ExcelJS.Worksheet): void {
  ws.addRow([]).height = 6;
}

function addSectionRow(ws: ExcelJS.Worksheet, text: string, endCol = 'B'): void {
  const row = ws.addRow([text]);
  row.height = 22;
  ws.mergeCells(`A${row.number}:${endCol}${row.number}`);
  const cell = ws.getCell(`A${row.number}`);
  cell.font      = { bold: true, size: 11, color: { argb: argb(C.tealDark) } };
  cell.fill      = solidFill(C.tealLight);
  cell.border    = thinBorder() as ExcelJS.Borders;
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
}

function addKeyValueRow(ws: ExcelJS.Worksheet, key: string, value: string | number): void {
  const row = ws.addRow([key, typeof value === 'number' ? value : String(value)]);
  row.height = 18;
  const kCell = ws.getCell(`A${row.number}`);
  kCell.font      = { bold: true, size: 10, color: { argb: argb(C.darkText) } };
  kCell.fill      = solidFill(C.slate50);
  kCell.border    = thinBorder() as ExcelJS.Borders;
  kCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  const vCell = ws.getCell(`B${row.number}`);
  vCell.font      = { size: 10, color: { argb: argb(C.darkText) } };
  vCell.border    = thinBorder() as ExcelJS.Borders;
  vCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
}

/** Convertit une valeur saisie en nombre (gère virgules, espaces, etc.) */
function parseNum(value: any): number {
  if (value === null || value === undefined || value === '') return 0;
  const cleaned = String(value).trim().replace(/\s+/g, '').replace(/,/g, '.');
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

/** Formate un nombre en monnaie FR */
function fmtEur(n: number): string {
  return `${n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** Calcule les totaux HT/TVA/TTC d'une collection de lignes DQE */
export function calculateDQETotals(rows: DQEExportRow[]): DQETotals {
  let totalHT = 0, totalTVA = 0, totalTTC = 0;
  rows.forEach(row => {
    const q    = parseNum(row.quantite);
    const pu   = parseNum(row.prixUniteVenteHT);
    const eco  = parseNum(row.ecoContribution);
    const tva  = parseNum(row.tauxTVA) || 20;
    const ht   = q * (pu + eco);
    const tvaM = ht * (tva / 100);
    totalHT  += ht;
    totalTVA += tvaM;
    totalTTC += ht + tvaM;
  });
  return { totalHT, totalTVA, totalTTC };
}

/** Filtre les lignes non vides (au moins une valeur dans une colonne non calculée) */
function filterNonEmpty(columns: DQEExportColumn[], rows: DQEExportRow[]): DQEExportRow[] {
  const nonEmpty = rows.filter(row =>
    columns.some(col => !col.isCalculated && row[col.id] && String(row[col.id]).trim() !== '')
  );
  return nonEmpty.length > 0 ? nonEmpty : rows;
}

// ---- Constructeurs de feuilles ----

/**
 * Feuille "Informations" avec totaux DQE
 */
function buildInfoSheet(
  wb: ExcelJS.Workbook,
  info: DQEExportProcedureInfo,
  rowCount: number,
  colCount: number,
  totals: DQETotals,
): void {
  const ws = wb.addWorksheet('Informations');
  ws.columns = [{ width: 34 }, { width: 66 }];

  // Titre
  const titleRow = ws.addRow(['DÉCOMPTE QUANTITATIF ESTIMATIF']);
  ws.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  titleRow.height = 38;
  const titleCell = ws.getCell(`A${titleRow.number}`);
  titleCell.font      = { bold: true, size: 16, color: { argb: argb(C.white) }, name: 'Calibri' };
  titleCell.fill      = solidFill(C.teal);
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);
  addSectionRow(ws, 'Informations de la procédure');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Numéro de procédure', info.numeroProcedure || 'N/A');
  addKeyValueRow(ws, 'Titre du marché',     info.titreMarche    || 'N/A');
  addKeyValueRow(ws, 'Acheteur',            info.acheteur       || 'N/A');
  addEmptyRow(ws);

  addSectionRow(ws, 'Informations du lot');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Numéro de lot',  String(info.numeroLot  ?? 'N/A'));
  addKeyValueRow(ws, 'Libellé du lot', info.libelleLot || 'N/A');
  addEmptyRow(ws);

  addKeyValueRow(ws, "Date d'export", new Date().toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }));
  addEmptyRow(ws);

  addSectionRow(ws, 'Statistiques');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Nombre de lignes',   rowCount);
  addKeyValueRow(ws, 'Nombre de colonnes', colCount);
  addEmptyRow(ws);

  // Section totaux (spécifique DQE)
  addSectionRow(ws, 'Totaux calculés');
  addEmptyRow(ws);

  const addTotalRow = (key: string, value: string) => {
    const row = ws.addRow([key, value]);
    row.height = 20;
    const kCell = ws.getCell(`A${row.number}`);
    kCell.font      = { bold: true, size: 10, color: { argb: argb(C.totalText) } };
    kCell.fill      = solidFill(C.totalRowBg);
    kCell.border    = mediumBorder() as ExcelJS.Borders;
    kCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    const vCell = ws.getCell(`B${row.number}`);
    vCell.font      = { bold: true, size: 10, color: { argb: argb(C.totalText) } };
    vCell.fill      = solidFill(C.totalRowBg);
    vCell.border    = mediumBorder() as ExcelJS.Borders;
    vCell.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
  };

  addTotalRow('Total HT',  fmtEur(totals.totalHT));
  addTotalRow('Total TVA', fmtEur(totals.totalTVA));
  addTotalRow('Total TTC', fmtEur(totals.totalTTC));
  addEmptyRow(ws);
  addEmptyRow(ws);

  // Avertissements
  const warnRow = ws.addRow(['⚠️  Attention :']);
  ws.mergeCells(`A${warnRow.number}:B${warnRow.number}`);
  warnRow.height = 24;
  const warnCell = ws.getCell(`A${warnRow.number}`);
  warnCell.font      = { bold: true, size: 11, color: { argb: argb(C.amber) } };
  warnCell.fill      = solidFill(C.amberLight);
  warnCell.border    = thinBorder(C.amberBorder) as ExcelJS.Borders;
  warnCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const note1 = ws.addRow(["* Si les lignes du Décompte ne sont pas toutes complétées, l'offre ne sera pas retenue."]);
  ws.mergeCells(`A${note1.number}:B${note1.number}`);
  note1.height = 32;
  const n1c = ws.getCell(`A${note1.number}`);
  n1c.font      = { italic: true, size: 10, color: { argb: argb(C.darkText) } };
  n1c.alignment = { wrapText: true, horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const note2 = ws.addRow(["* Il est impératif de respecter à minima les caractéristiques techniques indiquées dans la désignation de l'article, sans quoi l'offre ne sera pas retenue."]);
  ws.mergeCells(`A${note2.number}:B${note2.number}`);
  note2.height = 38;
  const n2c = ws.getCell(`A${note2.number}`);
  n2c.font      = { italic: true, size: 10, color: { argb: argb(C.darkText) } };
  n2c.alignment = { wrapText: true, horizontal: 'left', vertical: 'middle', indent: 1 };
}

/**
 * Feuille DQE (données) :
 *   - En-têtes : teal standard ou #4A9B8E si isEditable
 *   - Cellules isCalculated : fond #E8F5F3
 *   - Ligne de totaux HT/TVA/TTC en bas
 *   - Ligne d'en-tête figée
 */
function buildDQEDataSheet(
  wb: ExcelJS.Workbook,
  columns: DQEExportColumn[],
  headerLabels: { [key: string]: string },
  rows: DQEExportRow[],
  totals: DQETotals,
  sheetName = 'DQE',
): void {
  const ws = wb.addWorksheet(sheetName);

  ws.columns = [
    { width: 6 }, // #
    ...columns.map(col => ({
      width: Math.max(12, Math.round(parseInt(col.width || '150') / 7)),
    })),
  ];

  // Ligne d'en-tête
  const headerValues = ['#', ...columns.map(col => headerLabels[col.id] || col.label)];
  const headerRow = ws.addRow(headerValues);
  headerRow.height = 36;
  headerRow.eachCell((cell, colNum) => {
    // colNum 1 = '#', colNum 2+ = colonnes data (index = colNum - 2)
    const col = colNum >= 2 ? columns[colNum - 2] : null;
    const bgHex = col?.isEditable ? C.tealEditable : C.teal;
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) }, name: 'Calibri' };
    cell.fill      = solidFill(bgHex);
    cell.border    = thinBorder() as ExcelJS.Borders;
    cell.alignment = {
      horizontal: colNum === 1 ? 'center' : 'left',
      vertical:   'middle',
      wrapText:   true,
    };
  });

  // Lignes de données
  rows.forEach((row, idx) => {
    const values  = [idx + 1, ...columns.map(col => row[col.id] ?? '')];
    const dataRow = ws.addRow(values);
    dataRow.height = 22;
    const rowBg = idx % 2 === 0 ? C.white : C.grayAlt;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const col = colNum >= 2 ? columns[colNum - 2] : null;
      const cellBg = col?.isCalculated ? C.tealCalcBg : rowBg;
      cell.fill   = solidFill(cellBg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = {
        size:    10,
        color:   { argb: argb(colNum === 1 ? C.grayText : C.darkText) },
        italic:  col?.isCalculated ? true : false,
      };
      cell.alignment = {
        horizontal: colNum === 1 ? 'center' : 'left',
        vertical:   'middle',
      };
    });
  });

  // Ligne de totaux
  if (rows.length > 0) {
    // Construire la ligne : '#' = 'TOTAL', colonnes intermédiaires vides,
    // montantHT / montantTVA / montantTTC en position exacte
    const totalValues: (string | number)[] = ['TOTAL', ...columns.map(col => {
      if (col.id === 'montantHT')  return fmtEur(totals.totalHT);
      if (col.id === 'montantTVA') return fmtEur(totals.totalTVA);
      if (col.id === 'montantTTC') return fmtEur(totals.totalTTC);
      return '';
    })];

    const totalRow = ws.addRow(totalValues);
    totalRow.height = 26;
    totalRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      const col = colNum >= 2 ? columns[colNum - 2] : null;
      const isAmount = col?.id === 'montantHT' || col?.id === 'montantTVA' || col?.id === 'montantTTC';
      cell.fill   = solidFill(C.totalRowBg);
      cell.border = mediumBorder() as ExcelJS.Borders;
      cell.font   = {
        bold:  true,
        size:  10,
        color: { argb: argb(C.totalText) },
      };
      cell.alignment = {
        horizontal: (colNum === 1 || isAmount) ? 'center' : 'left',
        vertical:   'middle',
      };
    });
  }

  // Figer la ligne d'en-tête
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Page de garde consolidée DQE :
 *   8 colonnes : N° Lot, Nom du lot, Montant estimé, Nb lignes, Total HT, Total TVA, Total TTC, Écart HT
 */
function buildCoverSheet(
  wb: ExcelJS.Workbook,
  info: DQEExportProcedureInfo,
  lots: DQELotExportData[],
): void {
  const ws = wb.addWorksheet('Page de garde');
  ws.columns = [
    { width: 12 }, // N° Lot
    { width: 46 }, // Nom du lot
    { width: 18 }, // Montant estimé
    { width: 14 }, // Nb lignes
    { width: 18 }, // Total HT
    { width: 18 }, // Total TVA
    { width: 18 }, // Total TTC
    { width: 18 }, // Écart HT
  ];

  // Titre (8 colonnes)
  const titleRow = ws.addRow(['DÉCOMPTE QUANTITATIF ESTIMATIF', '', '', '', '', '', '', '']);
  ws.mergeCells(`A${titleRow.number}:H${titleRow.number}`);
  titleRow.height = 44;
  const titleCell = ws.getCell(`A${titleRow.number}`);
  titleCell.font      = { bold: true, size: 18, color: { argb: argb(C.white) }, name: 'Calibri' };
  titleCell.fill      = solidFill(C.teal);
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // Section procédure
  const procRow = ws.addRow(['INFORMATIONS DE LA PROCÉDURE', '', '', '', '', '', '', '']);
  ws.mergeCells(`A${procRow.number}:H${procRow.number}`);
  procRow.height = 24;
  const procCell = ws.getCell(`A${procRow.number}`);
  procCell.font      = { bold: true, size: 12, color: { argb: argb(C.tealDark) } };
  procCell.fill      = solidFill(C.tealLight);
  procCell.border    = thinBorder() as ExcelJS.Borders;
  procCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const addCoverKV = (key: string, value: string) => {
    const row = ws.addRow([key, value, '', '', '', '', '', '']);
    ws.mergeCells(`B${row.number}:H${row.number}`);
    row.height = 18;
    const kCell = ws.getCell(`A${row.number}`);
    kCell.font      = { bold: true, size: 10, color: { argb: argb(C.darkText) } };
    kCell.fill      = solidFill(C.slate50);
    kCell.border    = thinBorder() as ExcelJS.Borders;
    kCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    const vCell = ws.getCell(`B${row.number}`);
    vCell.font      = { size: 10, color: { argb: argb(C.darkText) } };
    vCell.border    = thinBorder() as ExcelJS.Borders;
    vCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
  };

  addCoverKV('Numéro de procédure', info.numeroProcedure || 'N/A');
  addCoverKV('Titre du marché',     info.titreMarche    || 'N/A');
  addCoverKV('Acheteur',            info.acheteur       || 'N/A');
  addCoverKV("Date d'export",       new Date().toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  }));

  addEmptyRow(ws);
  addEmptyRow(ws);

  // Section lots
  const lotsSec = ws.addRow(['LOTS INCLUS DANS CE DOCUMENT', '', '', '', '', '', '', '']);
  ws.mergeCells(`A${lotsSec.number}:H${lotsSec.number}`);
  lotsSec.height = 24;
  const lotsSecCell = ws.getCell(`A${lotsSec.number}`);
  lotsSecCell.font      = { bold: true, size: 12, color: { argb: argb(C.tealDark) } };
  lotsSecCell.fill      = solidFill(C.tealLight);
  lotsSecCell.border    = thinBorder() as ExcelJS.Borders;
  lotsSecCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  // En-tête tableau récap
  const thRow = ws.addRow([
    'N° Lot', 'Nom du lot', 'Montant estimé', 'Nb lignes DQE',
    'Total HT', 'Total TVA', 'Total TTC', 'Écart HT',
  ]);
  thRow.height = 26;
  thRow.eachCell(cell => {
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) } };
    cell.fill      = solidFill(C.teal);
    cell.border    = thinBorder() as ExcelJS.Borders;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Données lots
  lots.forEach((lot, idx) => {
    const totals    = lot.data ? calculateDQETotals(filterNonEmpty(lot.data.columns, lot.data.rows)) : { totalHT: 0, totalTVA: 0, totalTTC: 0 };
    const ecartHT   = lot.lotAmountNumeric > 0 ? totals.totalHT - lot.lotAmountNumeric : null;
    const ecartPositif = ecartHT !== null && ecartHT > 0;

    const dataRow = ws.addRow([
      `Lot ${lot.lotNum}`,
      lot.lotName,
      lot.lotAmountNumeric > 0 ? fmtEur(lot.lotAmountNumeric) : '–',
      lot.data?.rows?.length ?? 0,
      fmtEur(totals.totalHT),
      fmtEur(totals.totalTVA),
      fmtEur(totals.totalTTC),
      ecartHT !== null ? fmtEur(ecartHT) : '–',
    ]);
    dataRow.height = 20;
    const bg = idx % 2 === 0 ? C.white : C.grayAlt;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill   = solidFill(bg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = { size: 10, color: { argb: argb(C.darkText) } };
      cell.alignment = {
        horizontal: (colNum === 1 || colNum === 4) ? 'center' : (colNum >= 3 ? 'right' : 'left'),
        vertical:   'middle',
        indent:     colNum === 2 ? 1 : 0,
      };
      // Colorier l'écart HT en rouge si dépassement
      if (colNum === 8 && ecartPositif) {
        cell.font = { size: 10, bold: true, color: { argb: 'FFDC2626' } }; // red-600
      }
    });
  });

  addEmptyRow(ws);
  addEmptyRow(ws);

  // Navigation
  const navRow = ws.addRow(['NAVIGATION', '', '', '', '', '', '', '']);
  ws.mergeCells(`A${navRow.number}:H${navRow.number}`);
  navRow.height = 22;
  const navCell = ws.getCell(`A${navRow.number}`);
  navCell.font      = { bold: true, size: 11, color: { argb: argb(C.tealDark) } };
  navCell.fill      = solidFill(C.tealLight);
  navCell.border    = thinBorder() as ExcelJS.Borders;
  navCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const addNavLine = (text: string, italic = false) => {
    const row = ws.addRow([text, '', '', '', '', '', '', '']);
    ws.mergeCells(`A${row.number}:H${row.number}`);
    row.height = 18;
    const cell = ws.getCell(`A${row.number}`);
    cell.font      = { italic, size: 10, color: { argb: argb(italic ? C.grayText : C.darkText) } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  };

  addNavLine('Chaque lot dispose de son propre onglet dans ce classeur.');
  addNavLine('Utilisez les onglets en bas pour naviguer entre les lots.');
  addEmptyRow(ws);
  addNavLine('Note : Les lots sans données DQE affichent un tableau vide à compléter.', true);
}

// ---- API publique ----

/**
 * Export lot unique DQE vers Excel enrichi
 */
export async function exportDQESingleLot(
  columns: DQEExportColumn[],
  headerLabels: { [key: string]: string },
  rows: DQEExportRow[],
  info: DQEExportProcedureInfo,
  totals: DQETotals,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  const exportRows = filterNonEmpty(columns, rows);
  buildInfoSheet(wb, info, exportRows.length, columns.length, totals);
  buildDQEDataSheet(wb, columns, headerLabels, exportRows, totals, 'DQE');

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const date     = new Date().toISOString().split('T')[0];
  const fileName = `${info.numeroProcedure || 'export'}_DQE_LOT${info.numeroLot || '1'}_${date}.xlsx`;
  saveAs(blob, fileName);
}

/**
 * Construit le buffer Excel d'un lot DQE (pour ZIP multi-lots)
 */
export async function buildDQELotBuffer(
  columns: DQEExportColumn[],
  headerLabels: { [key: string]: string },
  rows: DQEExportRow[],
  info: DQEExportProcedureInfo,
  lotNum: number,
  lotName: string,
  defaultColumns: DQEExportColumn[],
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  const cols      = columns.length > 0 ? columns : defaultColumns;
  const labels    = Object.keys(headerLabels).length > 0
    ? headerLabels
    : defaultColumns.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: c.label }), {});
  const exportRows = filterNonEmpty(cols, rows);
  const totals     = calculateDQETotals(exportRows);

  buildInfoSheet(wb, { ...info, numeroLot: lotNum, libelleLot: lotName }, exportRows.length, cols.length, totals);
  buildDQEDataSheet(wb, cols, labels, exportRows, totals, 'DQE');

  return wb.xlsx.writeBuffer();
}

/**
 * Export consolidé DQE : page de garde + 1 onglet par lot
 */
export async function exportDQEConsolidated(
  lots: DQELotExportData[],
  info: DQEExportProcedureInfo,
  defaultColumns: DQEExportColumn[],
  fileName: string,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  buildCoverSheet(wb, info, lots);

  for (const lot of lots) {
    const cols   = lot.data?.columns?.length ? lot.data.columns : defaultColumns;
    const labels = lot.data?.headerLabels && Object.keys(lot.data.headerLabels).length
      ? lot.data.headerLabels
      : defaultColumns.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: c.label }), {});
    const rawRows = lot.data?.rows?.length
      ? lot.data.rows
      : Array.from({ length: 10 }, (_, i) => ({
          id: `empty-${i}`,
          ...defaultColumns.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: '' }), {}),
        }));
    const exportRows = filterNonEmpty(cols, rawRows);
    const totals     = calculateDQETotals(exportRows);

    const sheetName = `Lot ${lot.lotNum}`.substring(0, 31);
    buildDQEDataSheet(wb, cols, labels, exportRows, totals, sheetName);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}
