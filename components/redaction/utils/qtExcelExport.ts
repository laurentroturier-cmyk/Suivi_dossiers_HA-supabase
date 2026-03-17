/**
 * Export Questionnaire Technique vers Excel avec mise en page enrichie (ExcelJS)
 *
 * Reproduit le rendu visuel hiérarchique de l'écran :
 *   - Bandeau critère : fond teal-100 (#CCFBF1), texte teal foncé, gras
 *   - Sous-critère    : fond teal-50 (#F0FDFA), indenté
 *   - En-tête questions : fond #4A9B8E (teal moyen), blanc, gras
 *   - Lignes questions  : alternées blanc / gris-50
 *
 * 3 feuilles générées :
 *   1. "Structure détaillée" — vue hiérarchique complète
 *   2. "Synthèse critères"   — tableau récapitulatif par critère
 *   3. "Toutes les questions" — liste plate pour analyse
 */
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// ---- Types (miroir de questionnaire.ts) ----

export interface QTQuestion {
  id: string;
  intitule: string;
  pointsMax: number;
  type?: string;
  obligatoire?: boolean;
  description?: string;
  evaluateurs?: string;
}

export interface QTSousCritere {
  id: string;
  nom: string;
  ponderation?: number;
  questions: QTQuestion[];
}

export interface QTCritere {
  id: string;
  nom: string;
  ponderation?: number;
  sousCriteres: QTSousCritere[];
}

export interface QTExportParams {
  criteres: QTCritere[];
  numeroProcedure?: string;
  nomProcedure?: string;
  numeroLot?: number | string;
}

// ---- Palette couleurs (fidèle au rendu Tailwind) ----

const C = {
  teal:          '2F5B58', // bg-[#2F5B58] — titres principaux, en-têtes questions
  tealEditable:  '4A9B8E', // en-tête lignes questions (teal moyen)
  teal100:       'CCFBF1', // bg-teal-100 — bandeau critère
  teal50:        'F0FDFA', // bg-teal-50 — bandeau sous-critère
  teal200:       '99F6E4', // bg-teal-200 — badge total
  white:         'FFFFFF',
  grayBorder:    'D1D5DB',
  grayAlt:       'F9FAFB', // bg-gray-50 — lignes alternées
  grayText:      '6B7280',
  darkText:      '1F2937',
  tealDark:      '042F2E', // teal-950 — texte critère
  teal800:       '115E59', // text-teal-800 — texte sous-critère
  totalRowBg:    'EFF6FF',
  totalRowBorder:'BFDBFE',
  totalText:     '1E3A5F',
  slate50:       'F8FAFC',
};

const argb = (hex: string) => `FF${hex}`;

const solidFill = (hex: string): ExcelJS.Fill => ({
  type: 'pattern', pattern: 'solid', fgColor: { argb: argb(hex) },
});

const thinBorder = (hex = C.grayBorder): Partial<ExcelJS.Borders> => {
  const s: ExcelJS.Border = { style: 'thin', color: { argb: argb(hex) } };
  return { top: s, bottom: s, left: s, right: s };
};

const mediumBorder = (hex = C.totalRowBorder): Partial<ExcelJS.Borders> => {
  const s: ExcelJS.Border = { style: 'medium', color: { argb: argb(hex) } };
  return { top: s, bottom: s, left: s, right: s };
};

function addEmptyRow(ws: ExcelJS.Worksheet): void {
  ws.addRow([]).height = 6;
}

// ---- Feuille 1 : Structure détaillée (hiérarchique) ----

function buildDetailSheet(wb: ExcelJS.Workbook, params: QTExportParams): void {
  const { criteres, numeroProcedure, nomProcedure, numeroLot } = params;
  const ws = wb.addWorksheet('Structure détaillée');
  const NCOLS = 9; // A à I

  ws.columns = [
    { width: 20 }, // A — niveau critère
    { width: 36 }, // B — niveau sous-critère
    { width: 10 }, // C — N°
    { width: 68 }, // D — Question
    { width: 12 }, // E — Points Max
    { width: 18 }, // F — Type
    { width: 14 }, // G — Obligatoire
    { width: 58 }, // H — Description/Attente
    { width: 38 }, // I — Évaluateurs
  ];

  const lastCol = 'I';

  // ── Titre principal ──
  const titleRow = ws.addRow(['QUESTIONNAIRE TECHNIQUE — CONFIGURATION DÉTAILLÉE']);
  ws.mergeCells(`A${titleRow.number}:${lastCol}${titleRow.number}`);
  titleRow.height = 38;
  const tc = ws.getCell(`A${titleRow.number}`);
  tc.font      = { bold: true, size: 16, color: { argb: argb(C.white) }, name: 'Calibri' };
  tc.fill      = solidFill(C.teal);
  tc.alignment = { horizontal: 'center', vertical: 'middle' };
  tc.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // ── Infos procédure ──
  const addInfo = (key: string, value: string) => {
    const row = ws.addRow([key, value]);
    ws.mergeCells(`B${row.number}:${lastCol}${row.number}`);
    row.height = 18;
    const k = ws.getCell(`A${row.number}`);
    k.font      = { bold: true, size: 10, color: { argb: argb(C.darkText) } };
    k.fill      = solidFill(C.slate50);
    k.border    = thinBorder() as ExcelJS.Borders;
    k.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    const v = ws.getCell(`B${row.number}`);
    v.font      = { size: 10, color: { argb: argb(C.darkText) } };
    v.border    = thinBorder() as ExcelJS.Borders;
    v.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  };

  addInfo('Procédure :', numeroProcedure || 'Non définie');
  addInfo('Nom :',      nomProcedure || '');
  addInfo('Lot :',      String(numeroLot ?? 'N/A'));
  addInfo("Date d'export :", new Date().toLocaleString('fr-FR'));

  addEmptyRow(ws);

  // ── Ligne TOTAUX ──
  const totalCriteres    = criteres.length;
  const totalSousCriteres = criteres.reduce((s, c) => s + c.sousCriteres.length, 0);
  const totalQuestions   = criteres.reduce((s, c) =>
    s + c.sousCriteres.reduce((ss, sc) => ss + sc.questions.length, 0), 0);
  const totalPointsMax   = criteres.reduce((s, c) =>
    s + c.sousCriteres.reduce((ss, sc) =>
      ss + sc.questions.reduce((q, quest) => q + (quest.pointsMax || 0), 0), 0), 0);

  const totRow = ws.addRow([
    'TOTAUX',
    `${totalCriteres} critère(s)`,
    `${totalSousCriteres} sous-critère(s)`,
    `${totalQuestions} question(s)`,
    `${totalPointsMax} pts max`,
  ]);
  totRow.height = 24;
  totRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
    if (colNum > 5) return;
    cell.fill   = solidFill(C.totalRowBg);
    cell.border = mediumBorder() as ExcelJS.Borders;
    cell.font   = { bold: true, size: 10, color: { argb: argb(C.totalText) } };
    cell.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  });

  addEmptyRow(ws);
  addEmptyRow(ws);

  // ── Itération hiérarchique ──
  criteres.forEach((critere, ci) => {
    // Bandeau CRITÈRE (bg teal-100)
    const critRow = ws.addRow([
      `CRITÈRE ${ci + 1}`,
      critere.nom,
      `Pondération : ${critere.ponderation ?? 0} %`,
      `${critere.sousCriteres.length} sous-critère(s)`,
    ]);
    critRow.height = 24;
    critRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      if (colNum > NCOLS) return;
      cell.fill   = solidFill(C.teal100);
      cell.border = thinBorder(C.teal200) as ExcelJS.Borders;
      cell.font   = { bold: true, size: 11, color: { argb: argb(C.tealDark) } };
      cell.alignment = { horizontal: 'left', vertical: 'middle', indent: colNum === 1 ? 1 : 0 };
    });

    addEmptyRow(ws);

    critere.sousCriteres.forEach((sc, si) => {
      // Bandeau SOUS-CRITÈRE (bg teal-50)
      const scRow = ws.addRow([
        '',
        `  ├─ SOUS-CRITÈRE ${ci + 1}.${si + 1}`,
        sc.nom,
        `Pondération : ${sc.ponderation ?? 0} %`,
        `${sc.questions.length} question(s)`,
      ]);
      scRow.height = 20;
      scRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
        if (colNum > NCOLS) return;
        cell.fill   = solidFill(C.teal50);
        cell.border = thinBorder(C.teal200) as ExcelJS.Borders;
        cell.font   = { size: 10, color: { argb: argb(C.teal800) }, italic: colNum > 2 };
        cell.alignment = { horizontal: 'left', vertical: 'middle', indent: colNum === 2 ? 1 : 0 };
      });
      // Colonne B en gras (label sous-critère)
      ws.getCell(`B${scRow.number}`).font = { bold: true, size: 10, color: { argb: argb(C.teal800) } };

      if (sc.questions.length > 0) {
        // En-tête des questions (bg tealEditable)
        const qhRow = ws.addRow(['', '', 'N°', 'Question', 'Points Max', 'Type', 'Obligatoire', 'Description / Attente', 'Évaluateurs']);
        qhRow.height = 26;
        qhRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
          if (colNum > NCOLS) return;
          if (colNum < 3) return; // A et B restent vides
          cell.fill   = solidFill(C.tealEditable);
          cell.border = thinBorder() as ExcelJS.Borders;
          cell.font   = { bold: true, size: 10, color: { argb: argb(C.white) } };
          cell.alignment = { horizontal: colNum === 5 ? 'center' : 'left', vertical: 'middle' };
        });

        // Lignes de questions
        sc.questions.forEach((q, qi) => {
          const numQ = `${ci + 1}.${si + 1}.${qi + 1}`;
          const qRow = ws.addRow([
            '', '',
            numQ,
            q.intitule || '–',
            q.pointsMax || 0,
            q.type || 'Texte libre',
            q.obligatoire ? 'Oui' : 'Non',
            q.description || '–',
            q.evaluateurs || '–',
          ]);
          qRow.height = 22;
          const bg = qi % 2 === 0 ? C.white : C.grayAlt;
          qRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
            if (colNum > NCOLS) return;
            if (colNum < 3) return;
            cell.fill   = solidFill(bg);
            cell.border = thinBorder() as ExcelJS.Borders;
            cell.font   = {
              size:  10,
              color: { argb: argb(colNum === 3 ? C.grayText : C.darkText) },
            };
            cell.alignment = {
              horizontal: colNum === 5 ? 'center' : 'left',
              vertical:   'middle',
              wrapText:   colNum === 4 || colNum === 8,
            };
          });
        });
      } else {
        const emptyQ = ws.addRow(['', '', '', '(aucune question définie)']);
        emptyQ.height = 18;
        ws.getCell(`D${emptyQ.number}`).font = { italic: true, size: 10, color: { argb: argb(C.grayText) } };
      }

      addEmptyRow(ws);
    });

    addEmptyRow(ws);
    addEmptyRow(ws);
  });
}

// ---- Feuille 2 : Synthèse critères ----

function buildSyntheseSheet(wb: ExcelJS.Workbook, criteres: QTCritere[]): void {
  if (criteres.length === 0) return;
  const ws = wb.addWorksheet('Synthèse critères');
  ws.columns = [
    { width: 8 },  // N°
    { width: 42 }, // Critère
    { width: 18 }, // Pondération
    { width: 18 }, // Nb Sous-critères
    { width: 15 }, // Nb Questions
    { width: 18 }, // Points Max Total
    { width: 24 }, // Pts moyens/question
  ];

  // Titre
  const titleRow = ws.addRow(['SYNTHÈSE DES CRITÈRES', '', '', '', '', '', '']);
  ws.mergeCells(`A${titleRow.number}:G${titleRow.number}`);
  titleRow.height = 32;
  const tc = ws.getCell(`A${titleRow.number}`);
  tc.font      = { bold: true, size: 14, color: { argb: argb(C.white) }, name: 'Calibri' };
  tc.fill      = solidFill(C.teal);
  tc.alignment = { horizontal: 'center', vertical: 'middle' };
  tc.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // En-tête
  const headers = ['N°', 'Critère', 'Pondération (%)', 'Nb Sous-critères', 'Nb Questions', 'Points Max Total', 'Pts moyens / question'];
  const hRow = ws.addRow(headers);
  hRow.height = 26;
  hRow.eachCell(cell => {
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) } };
    cell.fill      = solidFill(C.tealEditable);
    cell.border    = thinBorder() as ExcelJS.Borders;
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  // Données
  criteres.forEach((critere, idx) => {
    const nbSC     = critere.sousCriteres.length;
    const nbQ      = critere.sousCriteres.reduce((s, sc) => s + sc.questions.length, 0);
    const ptsMax   = critere.sousCriteres.reduce((s, sc) =>
      s + sc.questions.reduce((q, qu) => q + (qu.pointsMax || 0), 0), 0);
    const ptsMoyen = nbQ > 0 ? (ptsMax / nbQ).toFixed(1) : '0.0';

    const dRow = ws.addRow([idx + 1, critere.nom, critere.ponderation ?? 0, nbSC, nbQ, ptsMax, ptsMoyen]);
    dRow.height = 22;
    const bg = idx % 2 === 0 ? C.white : C.grayAlt;
    dRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill   = solidFill(bg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = { size: 10, color: { argb: argb(C.darkText) } };
      cell.alignment = {
        horizontal: colNum === 2 ? 'left' : 'center',
        vertical:   'middle',
        indent:     colNum === 2 ? 1 : 0,
      };
    });
  });

  // Ligne de totaux
  const totPts = criteres.reduce((s, c) =>
    s + c.sousCriteres.reduce((ss, sc) =>
      ss + sc.questions.reduce((q, qu) => q + (qu.pointsMax || 0), 0), 0), 0);
  const totQ   = criteres.reduce((s, c) =>
    s + c.sousCriteres.reduce((ss, sc) => ss + sc.questions.length, 0), 0);
  const totPond = criteres.reduce((s, c) => s + (c.ponderation ?? 0), 0);

  const tRow = ws.addRow(['', 'TOTAL', totPond, '', totQ, totPts, '']);
  tRow.height = 24;
  tRow.eachCell({ includeEmpty: true }, (cell) => {
    cell.fill   = solidFill(C.totalRowBg);
    cell.border = mediumBorder() as ExcelJS.Borders;
    cell.font   = { bold: true, size: 10, color: { argb: argb(C.totalText) } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });
  ws.getCell(`B${tRow.number}`).alignment = { horizontal: 'right', vertical: 'middle' };
}

// ---- Feuille 3 : Toutes les questions (liste plate) ----

function buildQuestionsSheet(wb: ExcelJS.Workbook, criteres: QTCritere[]): void {
  const allRows: any[][] = [];
  let numGlobal = 1;

  criteres.forEach((critere, ci) => {
    critere.sousCriteres.forEach((sc, si) => {
      sc.questions.forEach((q, qi) => {
        allRows.push([
          numGlobal++,
          `${ci + 1}.${si + 1}.${qi + 1}`,
          ci + 1,
          critere.nom,
          critere.ponderation ?? 0,
          `${ci + 1}.${si + 1}`,
          sc.nom,
          sc.ponderation ?? 0,
          qi + 1,
          q.intitule || '–',
          q.pointsMax || 0,
          q.type || 'Texte libre',
          q.obligatoire ? 'Oui' : 'Non',
          q.description || '–',
          q.evaluateurs || '–',
        ]);
      });
    });
  });

  if (allRows.length === 0) return;

  const ws = wb.addWorksheet('Toutes les questions');
  ws.columns = [
    { width: 12 }, // N° Global
    { width: 16 }, // N° Hiérarchique
    { width: 12 }, // Critère N°
    { width: 32 }, // Critère
    { width: 16 }, // Pond. Critère
    { width: 16 }, // Sous-critère N°
    { width: 32 }, // Sous-critère
    { width: 14 }, // Pond. S-C
    { width: 12 }, // N° Question
    { width: 68 }, // Question
    { width: 12 }, // Points Max
    { width: 18 }, // Type
    { width: 12 }, // Obligatoire
    { width: 58 }, // Description/Attente
    { width: 38 }, // Évaluateurs
  ];

  // Titre
  const titleRow = ws.addRow(['LISTE COMPLÈTE DES QUESTIONS']);
  ws.mergeCells(`A${titleRow.number}:O${titleRow.number}`);
  titleRow.height = 32;
  const tc = ws.getCell(`A${titleRow.number}`);
  tc.font      = { bold: true, size: 14, color: { argb: argb(C.white) }, name: 'Calibri' };
  tc.fill      = solidFill(C.teal);
  tc.alignment = { horizontal: 'center', vertical: 'middle' };
  tc.border    = thinBorder() as ExcelJS.Borders;

  addEmptyRow(ws);

  // En-tête
  const headers = [
    'N° Global', 'N° Hiérarchique', 'Critère N°', 'Critère', 'Pond. Critère (%)',
    'S-C N°', 'Sous-critère', 'Pond. S-C (%)', 'N° Question',
    'Question', 'Points Max', 'Type Réponse', 'Obligatoire', 'Description / Attente', 'Évaluateurs',
  ];
  const hRow = ws.addRow(headers);
  hRow.height = 28;
  hRow.eachCell(cell => {
    cell.font      = { bold: true, size: 10, color: { argb: argb(C.white) } };
    cell.fill      = solidFill(C.teal);
    cell.border    = thinBorder() as ExcelJS.Borders;
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  });

  // Données
  allRows.forEach((row, idx) => {
    const dRow = ws.addRow(row);
    dRow.height = 22;
    const bg = idx % 2 === 0 ? C.white : C.grayAlt;
    dRow.eachCell({ includeEmpty: true }, (cell, colNum) => {
      cell.fill   = solidFill(bg);
      cell.border = thinBorder() as ExcelJS.Borders;
      cell.font   = {
        size:  10,
        color: { argb: argb([1, 2, 3, 5, 6, 8, 9, 11, 13].includes(colNum) ? C.grayText : C.darkText) },
      };
      cell.alignment = {
        horizontal: [1, 2, 3, 5, 6, 8, 9, 11, 13].includes(colNum) ? 'center' : 'left',
        vertical:   'middle',
        wrapText:   colNum === 10 || colNum === 14,
        indent:     [4, 7, 10, 14, 15].includes(colNum) ? 1 : 0,
      };
    });
  });

  // Figer l'en-tête
  ws.views = [{ state: 'frozen', xSplit: 0, ySplit: 3 }]; // ligne 1 = titre, 2 = vide, 3 = headers
}

// ---- API publique ----

/**
 * Exporte le questionnaire technique complet vers Excel enrichi
 */
export async function exportQuestionnaireTechnique(params: QTExportParams): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator  = 'Suivi Dossiers HA';
  wb.created  = new Date();
  wb.modified = new Date();

  buildDetailSheet(wb, params);
  buildSyntheseSheet(wb, params.criteres);
  buildQuestionsSheet(wb, params.criteres);

  const buffer = await wb.xlsx.writeBuffer();
  const blob   = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const procedureRef = params.numeroProcedure || 'questionnaire';
  const lotSuffix    = params.numeroLot ? `_lot${params.numeroLot}` : '';
  const date         = new Date().toISOString().split('T')[0];
  saveAs(blob, `QT_${procedureRef}${lotSuffix}_${date}.xlsx`);
}
