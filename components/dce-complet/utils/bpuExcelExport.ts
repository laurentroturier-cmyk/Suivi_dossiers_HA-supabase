/**
 * Export BPU vers Excel avec mise en page enrichie (ExcelJS)
 * Reproduit fidèlement le rendu visuel du tableau à l'écran :
 *   - En-têtes fond teal #2F5B58, texte blanc, gras
 *   - Lignes alternées blanc / gris clair
 *   - Bordures grises fines sur toutes les cellules
 *   - Feuille "Informations" avec sections colorées
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ---- Types (mirrors BPUForm interfaces) ----

export interface BPUExportColumn {
  id: string;
  label: string;
  width?: string;
}

export interface BPUExportRow {
  id: string;
  [key: string]: any;
}

export interface BPUExportTableData {
  columns: BPUExportColumn[];
  headerLabels: { [key: string]: string };
  rows: BPUExportRow[];
}

export interface BPUExportProcedureInfo {
  numeroProcedure?: string;
  titreMarche?: string;
  acheteur?: string;
  numeroLot?: string | number;
  libelleLot?: string;
}

export interface BPULotExportData {
  lotNum: number;
  lotName: string;
  lotAmount: string;
  data?: BPUExportTableData;
}

// ---- Palette couleurs (identique au rendu écran) ----

const C = {
  teal:        '2F5B58', // bg-[#2F5B58] — en-têtes
  tealLight:   'E8F2F1', // teinte claire pour sections info
  white:       'FFFFFF',
  grayBorder:  'D1D5DB', // border-gray-300
  grayAlt:     'F9FAFB', // bg-gray-50 — lignes impaires
  grayText:    '6B7280', // text-gray-500 — colonne #
  darkText:    '1F2937', // text-gray-800 — contenu
  tealDark:    '1A3D3B', // titres de section
  amber:       'D97706', // avertissements
  amberLight:  'FEF3C7', // bg avertissements
  amberBorder: 'FCD34D', // bordure avertissements
  slate50:     'F8FAFC', // bg labels clé-valeur
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

function addEmptyRow(ws: ExcelJS.Worksheet): void {
  const r = ws.addRow([]);
  r.height = 6;
}

/** Ligne de section (fond teal clair, texte teal foncé, gras) */
function addSectionRow(ws: ExcelJS.Worksheet, text: string, endCol: string = 'B'): void {
  const row = ws.addRow([text]);
  row.height = 22;
  ws.mergeCells(`A${row.number}:${endCol}${row.number}`);
  const cell = ws.getCell(`A${row.number}`);
  cell.font  = { bold: true, size: 11, color: { argb: argb(C.tealDark) } };
  cell.fill  = solidFill(C.tealLight);
  cell.border = thinBorder() as ExcelJS.Borders;
  cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
}

/** Ligne clé / valeur avec fond alterné */
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

// ---- Constructeurs de feuilles ----

/**
 * Feuille "Informations" : titre enrichi, sections colorées, avertissements
 */
function buildInfoSheet(
  wb: ExcelJS.Workbook,
  info: BPUExportProcedureInfo,
  rowCount: number,
  colCount: number,
): void {
  const ws = wb.addWorksheet('Informations');
  ws.columns = [{ width: 34 }, { width: 66 }];

  // Titre principal
  const titleRow = ws.addRow(['BORDEREAU DE PRIX UNITAIRES']);
  ws.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  titleRow.height = 38;
  const titleCell = ws.getCell(`A${titleRow.number}`);
  titleCell.font      = { bold: true, size: 16, color: { argb: argb(C.white) }, name: 'Calibri' };
  titleCell.fill      = solidFill(C.teal);
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // Section Procédure
  addSectionRow(ws, 'Informations de la procédure');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Numéro de procédure', info.numeroProcedure || 'N/A');
  addKeyValueRow(ws, 'Titre du marché',     info.titreMarche    || 'N/A');
  addKeyValueRow(ws, 'Acheteur',            info.acheteur       || 'N/A');
  addEmptyRow(ws);

  // Section Lot
  addSectionRow(ws, 'Informations du lot');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Numéro de lot',  String(info.numeroLot  ?? 'N/A'));
  addKeyValueRow(ws, 'Libellé du lot', info.libelleLot || 'N/A');
  addEmptyRow(ws);

  // Date export
  addKeyValueRow(ws, "Date d'export", new Date().toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  }));
  addEmptyRow(ws);

  // Section Statistiques
  addSectionRow(ws, 'Statistiques');
  addEmptyRow(ws);
  addKeyValueRow(ws, 'Nombre de lignes',   rowCount);
  addKeyValueRow(ws, 'Nombre de colonnes', colCount);
  addEmptyRow(ws);
  addEmptyRow(ws);

  // Zone d'attention
  const warnRow = ws.addRow(['⚠️  Attention :']);
  ws.mergeCells(`A${warnRow.number}:B${warnRow.number}`);
  warnRow.height = 24;
  const warnCell = ws.getCell(`A${warnRow.number}`);
  warnCell.font      = { bold: true, size: 11, color: { argb: argb(C.amber) } };
  warnCell.fill      = solidFill(C.amberLight);
  warnCell.border    = thinBorder(C.amberBorder) as ExcelJS.Borders;
  warnCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const note1 = ws.addRow(["* Si les lignes du Bordereau de prix ne sont pas toutes complétées, l'offre ne sera pas retenue."]);
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
 * Feuille BPU (données) :
 *   - En-tête teal avec texte blanc gras
 *   - Lignes alternées blanc / gris-50
 *   - Bordures grises fines
 *   - Première colonne = numéro de ligne (centré, texte gris)
 *   - Ligne d'en-tête figée
 */
function buildBPUDataSheet(
  wb: ExcelJS.Workbook,
  columns: BPUExportColumn[],
  headerLabels: { [key: string]: string },
  rows: BPUExportRow[],
  sheetName: string = 'BPU',
): void {
  const ws = wb.addWorksheet(sheetName);

  // Largeurs : col # (6 car) + colonnes data (px → car, min 12)
  ws.columns = [
    { width: 6 },
    ...columns.map(col => ({
      width: Math.max(12, Math.round(parseInt(col.width || '150') / 7)),
    })),
  ];

  // Ligne d'en-tête
  const headerValues = ['#', ...columns.map(col => headerLabels[col.id] || col.label)];
  const headerRow = ws.addRow(headerValues);
  headerRow.height = 36;
  headerRow.eachCell((cell, colNum) => {
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) }, name: 'Calibri' };
    cell.fill      = solidFill(C.teal);
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
    const bg = idx % 2 === 0 ? C.white : C.grayAlt;

    dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill   = solidFill(bg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = {
        size:  10,
        color: { argb: argb(colNum === 1 ? C.grayText : C.darkText) },
      };
      cell.alignment = {
        horizontal: colNum === 1 ? 'center' : 'left',
        vertical:   'middle',
      };
    });
  });

  // Figer la ligne d'en-tête
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
}

/**
 * Page de garde pour l'export consolidé :
 *   - Titre principal
 *   - Informations procédure
 *   - Tableau récapitulatif des lots (avec mise en forme)
 *   - Section navigation
 */
function buildCoverSheet(
  wb: ExcelJS.Workbook,
  info: BPUExportProcedureInfo,
  lots: BPULotExportData[],
): void {
  const ws = wb.addWorksheet('Page de garde');
  ws.columns = [
    { width: 14 }, // N° Lot
    { width: 52 }, // Nom du lot
    { width: 22 }, // Montant estimé
    { width: 16 }, // Nb lignes
  ];

  // Titre principal (4 colonnes)
  const titleRow = ws.addRow(['BORDEREAU DE PRIX UNITAIRES', '', '', '']);
  ws.mergeCells(`A${titleRow.number}:D${titleRow.number}`);
  titleRow.height = 44;
  const titleCell = ws.getCell(`A${titleRow.number}`);
  titleCell.font      = { bold: true, size: 18, color: { argb: argb(C.white) }, name: 'Calibri' };
  titleCell.fill      = solidFill(C.teal);
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // Section procédure
  const procRow = ws.addRow(['INFORMATIONS DE LA PROCÉDURE', '', '', '']);
  ws.mergeCells(`A${procRow.number}:D${procRow.number}`);
  procRow.height = 24;
  const procCell = ws.getCell(`A${procRow.number}`);
  procCell.font      = { bold: true, size: 12, color: { argb: argb(C.tealDark) } };
  procCell.fill      = solidFill(C.tealLight);
  procCell.border    = thinBorder() as ExcelJS.Borders;
  procCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  // Clé-valeur sur 4 colonnes (B:D mergé)
  const addCoverKV = (key: string, value: string) => {
    const row = ws.addRow([key, value, '', '']);
    ws.mergeCells(`B${row.number}:D${row.number}`);
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
  const lotsSec = ws.addRow(['LOTS INCLUS DANS CE DOCUMENT', '', '', '']);
  ws.mergeCells(`A${lotsSec.number}:D${lotsSec.number}`);
  lotsSec.height = 24;
  const lotsSecCell = ws.getCell(`A${lotsSec.number}`);
  lotsSecCell.font      = { bold: true, size: 12, color: { argb: argb(C.tealDark) } };
  lotsSecCell.fill      = solidFill(C.tealLight);
  lotsSecCell.border    = thinBorder() as ExcelJS.Borders;
  lotsSecCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  // En-tête du tableau récap
  const thRow = ws.addRow(['N° Lot', 'Nom du lot', 'Montant estimé', 'Nb lignes BPU']);
  thRow.height = 26;
  thRow.eachCell(cell => {
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) } };
    cell.fill      = solidFill(C.teal);
    cell.border    = thinBorder() as ExcelJS.Borders;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Données lots
  lots.forEach((lot, idx) => {
    const dataRow = ws.addRow([
      `Lot ${lot.lotNum}`,
      lot.lotName,
      lot.lotAmount || '–',
      lot.data?.rows?.length ?? 0,
    ]);
    dataRow.height = 20;
    const bg = idx % 2 === 0 ? C.white : C.grayAlt;
    dataRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill   = solidFill(bg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = { size: 10, color: { argb: argb(C.darkText) } };
      cell.alignment = {
        horizontal: (colNum === 1 || colNum === 4) ? 'center' : 'left',
        vertical:   'middle',
        indent:     (colNum === 1 || colNum === 4) ? 0 : 1,
      };
    });
  });

  addEmptyRow(ws);
  addEmptyRow(ws);

  // Section navigation
  const navRow = ws.addRow(['NAVIGATION', '', '', '']);
  ws.mergeCells(`A${navRow.number}:D${navRow.number}`);
  navRow.height = 22;
  const navCell = ws.getCell(`A${navRow.number}`);
  navCell.font      = { bold: true, size: 11, color: { argb: argb(C.tealDark) } };
  navCell.fill      = solidFill(C.tealLight);
  navCell.border    = thinBorder() as ExcelJS.Borders;
  navCell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };

  addEmptyRow(ws);

  const addNavLine = (text: string, italic = false) => {
    const row = ws.addRow([text, '', '', '']);
    ws.mergeCells(`A${row.number}:D${row.number}`);
    row.height = 18;
    const cell = ws.getCell(`A${row.number}`);
    cell.font      = { italic, size: 10, color: { argb: argb(italic ? C.grayText : C.darkText) } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  };

  addNavLine('Chaque lot dispose de son propre onglet dans ce classeur.');
  addNavLine('Utilisez les onglets en bas pour naviguer entre les lots.');
  addEmptyRow(ws);
  addNavLine('Note : Les lots sans données BPU affichent un tableau vide à compléter.', true);
}

// ---- API publique ----

/**
 * Export lot unique vers Excel enrichi
 */
export async function exportBPUSingleLot(
  columns: BPUExportColumn[],
  headerLabels: { [key: string]: string },
  rows: BPUExportRow[],
  info: BPUExportProcedureInfo,
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  buildInfoSheet(wb, info, rows.length, columns.length);
  buildBPUDataSheet(wb, columns, headerLabels, rows, 'BPU');

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const date     = new Date().toISOString().split('T')[0];
  const fileName = `BPU_${info.numeroProcedure || 'export'}_${date}.xlsx`;
  saveAs(blob, fileName);
}

/**
 * Construit le buffer Excel d'un lot (pour ZIP multi-lots)
 */
export async function buildBPULotBuffer(
  columns: BPUExportColumn[],
  headerLabels: { [key: string]: string },
  rows: BPUExportRow[],
  info: BPUExportProcedureInfo,
  lotNum: number,
  lotName: string,
  defaultColumns: BPUExportColumn[],
): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  const cols   = columns.length   > 0                            ? columns       : defaultColumns;
  const labels = Object.keys(headerLabels).length > 0            ? headerLabels  : defaultColumns.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: c.label }), {});

  buildInfoSheet(wb, { ...info, numeroLot: lotNum, libelleLot: lotName }, rows.length, cols.length);
  buildBPUDataSheet(wb, cols, labels, rows, 'BPU');

  return wb.xlsx.writeBuffer();
}

/**
 * Export consolidé : page de garde + 1 onglet par lot
 */
export async function exportBPUConsolidated(
  lots: BPULotExportData[],
  info: BPUExportProcedureInfo,
  defaultColumns: BPUExportColumn[],
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
    const rows = lot.data?.rows?.length
      ? lot.data.rows
      : Array.from({ length: 10 }, (_, i) => ({
          id: `empty-${i}`,
          ...defaultColumns.reduce<Record<string, string>>((a, c) => ({ ...a, [c.id]: '' }), {}),
        }));

    const sheetName = `Lot ${lot.lotNum}`.substring(0, 31);
    buildBPUDataSheet(wb, cols, labels, rows, sheetName);
  }

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  saveAs(blob, fileName);
}
