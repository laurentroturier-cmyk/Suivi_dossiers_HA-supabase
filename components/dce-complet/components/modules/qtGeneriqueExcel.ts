/**
 * qtGeneriqueExcel.ts
 * Import / Export Excel enrichi – Questionnaire Technique Générique
 * Export  : ExcelJS – un seul onglet, codes couleurs, en-tête procédure
 * Import  : XLSX (SheetJS) – compatible .xls et .xlsx
 */

import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { QTGeneriqueData, QTGeneriqueCritere, QTGeneriqueQuestion } from '../../types';

// ─── Palette couleurs (cohérente avec le reste de l'app) ─────────────────────

const C = {
  tealDark:     '1A3330', // titres principaux — fond foncé
  teal:         '2F5B58', // en-têtes de tableau
  tealMid:      '3D7A75', // critère header
  tealLight:    'E8F2F1', // fond clair teal
  olive:        '4A7C59', // sous-titres
  yellow:       'FFFDE7', // cellule soumissionnaire
  yellowBorder: 'F9A825',
  white:        'FFFFFF',
  grayBorder:   'D1D5DB',
  grayAlt:      'F9FAFB',
  grayMid:      'E5E7EB',
  darkText:     '1F2937',
  grayText:     '6B7280',
  red:          'C62828',
  redLight:     'FFEBEE',
  green:        '2E7D32',
  greenLight:   'E8F5E9',
  amber:        'E65100',
  amberLight:   'FFF3E0',
};

// ─── Template par défaut (structure du fichier DNA) ───────────────────────────

export const DEFAULT_QT_GENERIQUE: Omit<QTGeneriqueData, 'reference' | 'objetProcedure' | 'lot'> = {
  nomSoumissionnaire: '',
  notes: '',
  criteres: [
    buildCritere('Critère 1', [
      q('1.1', '', 'Oui / Non'),
      q('1.2', '', 'Oui / Non'),
      q('1.3', '', 'Décrire'),
      q('1.4', '', 'Décrire'),
      q('1.5', '', 'Décrire'),
      q('1.6', '', 'Décrire'),
      q('1.7', '', 'Décrire'),
    ]),
    buildCritere('Critère 2', [
      q('2.1', '', 'Décrire'),
      q('2.2', '', 'Décrire'),
      q('2.3', '', 'Oui / Non'),
      q('2.4', '', 'Décrire'),
      q('2.5', '', 'Décrire'),
    ]),
    buildCritere('Critère 3', [
      q('3.1', '', 'Décrire'),
      q('3.2', '', 'Décrire'),
      q('3.3', '', 'Oui / Non'),
      q('3.4', '', 'Décrire'),
      q('3.5', '', 'Décrire'),
      q('3.6', '', 'Décrire'),
      q('3.7', '', 'Décrire'),
      q('3.8', '', 'Décrire'),
    ]),
    buildCritere('Critère 4', [
      q('4.1', '', 'Décrire'),
      q('4.2', '', 'Oui / Non'),
      q('4.3', '', 'Décrire'),
      q('4.4', '', 'Oui / Non'),
      q('4.5', '', 'Décrire'),
      q('4.6', '', 'Décrire'),
    ]),
    buildCritere('Critère 5', [
      q('5.1', '', 'Décrire'),
      q('5.2', '', 'Oui / Non'),
      q('5.3', '', 'Décrire'),
      q('5.4', '', 'Oui / Non'),
      q('5.5', '', 'Décrire'),
      q('5.6', '', 'Décrire'),
    ]),
    buildCritere('Critère 6', [
      q('6.1', '', 'Décrire'),
      q('6.2', '', 'Oui / Non'),
      q('6.3', '', 'Décrire'),
      q('6.4', '', 'Oui / Non'),
      q('6.5', '', 'Décrire'),
      q('6.6', '', 'Décrire'),
    ]),
  ],
};

function q(ref: string, intitule: string, reponseAttendue: string): QTGeneriqueQuestion {
  return { ref, intitule, reponseAttendue, reponseSoumissionnaire: '', points: 0 };
}

function buildCritere(ref: string, questions: QTGeneriqueQuestion[]): QTGeneriqueCritere {
  return { ref, intitule: '', questions };
}

// ─── Helpers ExcelJS ──────────────────────────────────────────────────────────

function bg(hex: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + hex } };
}
function border(hex = C.grayBorder): Partial<ExcelJS.Borders> {
  const s: ExcelJS.Border = { style: 'thin', color: { argb: 'FF' + hex } };
  return { top: s, left: s, bottom: s, right: s };
}
function font(color: string, bold = false, sz = 10): Partial<ExcelJS.Font> {
  return { color: { argb: 'FF' + color }, bold, size: sz, name: 'Calibri' };
}

/** Applique un style à un range de cellules */
function styleRange(
  ws: ExcelJS.Worksheet,
  startRow: number, startCol: number,
  endRow: number, endCol: number,
  fill?: ExcelJS.Fill,
  fnt?: Partial<ExcelJS.Font>,
  brd?: Partial<ExcelJS.Borders>,
  align?: Partial<ExcelJS.Alignment>,
) {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      if (fill) cell.fill = fill;
      if (fnt)  cell.font = fnt;
      if (brd)  cell.border = brd;
      if (align) cell.alignment = align;
    }
  }
}

// ─── Export Excel enrichi (ExcelJS, 1 seul onglet) ───────────────────────────

export async function exportQTGeneriqueExcel(data: QTGeneriqueData, numeroProcedure?: string): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'DNA – Application DCE';
  wb.created = new Date();

  const ws = wb.addWorksheet('Questionnaire Technique', {
    pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
    views: [{ state: 'frozen', ySplit: 13 }], // geler au-dessus du tableau
  });

  // ── Largeurs de colonnes ────────────────────────────────────────────────────
  ws.columns = [
    { width: 10 },  // A – N°
    { width: 50 },  // B – Questions
    { width: 18 },  // C – Réponse attendue
    { width: 50 },  // D – Réponse du soumissionnaire
    { width: 9  },  // E – Points
    { width: 22 },  // F – Conformité
  ];

  let row = 1; // curseur ligne courante

  // ══════════════════════════════════════════════════════════════════════════
  // BLOC EN-TÊTE PROCÉDURE
  // ══════════════════════════════════════════════════════════════════════════

  // R1 — Titre principal
  ws.mergeCells(row, 1, row, 6);
  const rTitre = ws.getRow(row);
  rTitre.height = 30;
  const cTitre = ws.getCell(row, 1);
  cTitre.value = 'QUESTIONNAIRE TECHNIQUE';
  cTitre.fill = bg(C.tealDark);
  cTitre.font = { ...font(C.white, true, 16), name: 'Calibri' };
  cTitre.alignment = { horizontal: 'center', vertical: 'middle' };
  row++;

  // R2 — Référence
  ws.mergeCells(row, 1, row, 6);
  const cRef = ws.getCell(row, 1);
  cRef.value = data.reference || '—';
  cRef.fill = bg(C.teal);
  cRef.font = font(C.white, false, 11);
  cRef.alignment = { horizontal: 'center', vertical: 'middle' };
  ws.getRow(row).height = 18;
  row++;

  // R3 — Objet procédure (label + valeur)
  ws.getRow(row).height = 20;
  const cObjLabel = ws.getCell(row, 1);
  cObjLabel.value = 'Objet';
  cObjLabel.fill = bg(C.tealLight);
  cObjLabel.font = font(C.teal, true, 10);
  cObjLabel.border = border();
  cObjLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws.mergeCells(row, 2, row, 6);
  const cObjVal = ws.getCell(row, 2);
  cObjVal.value = data.objetProcedure || '—';
  cObjVal.fill = bg(C.white);
  cObjVal.font = font(C.darkText, true, 11);
  cObjVal.border = border();
  cObjVal.alignment = { horizontal: 'left', vertical: 'middle', indent: 1, wrapText: true };
  row++;

  // R4 — Lot
  ws.getRow(row).height = 18;
  const cLotLabel = ws.getCell(row, 1);
  cLotLabel.value = 'Lot';
  cLotLabel.fill = bg(C.tealLight);
  cLotLabel.font = font(C.teal, true, 10);
  cLotLabel.border = border();
  cLotLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws.mergeCells(row, 2, row, 6);
  const cLotVal = ws.getCell(row, 2);
  cLotVal.value = data.lot || '—';
  cLotVal.fill = bg(C.white);
  cLotVal.font = font(C.darkText, false, 10);
  cLotVal.border = border();
  cLotVal.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  row++;

  // R5 — Soumissionnaire (fond jaune)
  ws.getRow(row).height = 22;
  const cSousLabel = ws.getCell(row, 1);
  cSousLabel.value = 'Soumissionnaire';
  cSousLabel.fill = bg(C.yellow);
  cSousLabel.font = font(C.darkText, true, 10);
  cSousLabel.border = border(C.yellowBorder);
  cSousLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  ws.mergeCells(row, 2, row, 6);
  const cSousVal = ws.getCell(row, 2);
  cSousVal.value = data.nomSoumissionnaire || 'Veuillez indiquer le nom du soumissionnaire';
  cSousVal.fill = bg(C.yellow);
  cSousVal.font = {
    ...font(data.nomSoumissionnaire ? C.darkText : C.amber, data.nomSoumissionnaire !== '', 11),
    italic: !data.nomSoumissionnaire,
  };
  cSousVal.border = border(C.yellowBorder);
  cSousVal.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
  row++;

  // R6 — Ligne vide séparateur
  ws.getRow(row).height = 6;
  ws.mergeCells(row, 1, row, 6);
  ws.getCell(row, 1).fill = bg(C.white);
  row++;

  // R7 — Note contractuelle (texte condensé)
  ws.mergeCells(row, 1, row, 6);
  ws.getRow(row).height = 14;
  const cNote = ws.getCell(row, 1);
  cNote.value =
    "Le Questionnaire Technique est contractuel. Le soumissionnaire s'engage à respecter l'ensemble de ce qu'il y est écrit. " +
    "Les apports du QT ne peuvent avoir pour effet de modifier les termes du CCTP.";
  cNote.fill = bg('EFF8FF');
  cNote.font = { ...font('1D4ED8', false, 9), italic: true };
  cNote.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true, indent: 1 };
  cNote.border = border('BFDBFE');
  row++;

  // R8 — Avertissement questionnaire incomplet (formule dynamique sur colonne F)
  // =IF(COUNTIF(F:F,"Absence de réponse")>=1,"***Questionnaire incomplet…***","")
  // → s'actualise automatiquement si le soumissionnaire complète le fichier Excel
  ws.mergeCells(row, 1, row, 6);
  ws.getRow(row).height = 18;
  const cWarning = ws.getCell(row, 1);
  const hasAbsence = data.criteres.some(c => c.questions.some(q2 => !q2.reponseSoumissionnaire?.trim()));
  const warningText = '***Questionnaire incomplet, merci de répondre à l\'ensemble des questions***';
  cWarning.value = {
    formula: `IF(COUNTIF(F:F,"Absence de réponse")>=1,"${warningText}","")`,
    result: hasAbsence ? warningText : '',
  };
  cWarning.fill = bg(C.amberLight);
  cWarning.font = { color: { argb: 'FFCC0000' }, bold: true, size: 10, name: 'Calibri', italic: true };
  cWarning.alignment = { horizontal: 'center', vertical: 'middle' };
  cWarning.border = border('FCA5A5');
  row++;

  // R9 — Ligne vide
  ws.getRow(row).height = 6;
  ws.mergeCells(row, 1, row, 6);
  ws.getCell(row, 1).fill = bg(C.white);
  row++;

  // ══════════════════════════════════════════════════════════════════════════
  // EN-TÊTE DU TABLEAU
  // ══════════════════════════════════════════════════════════════════════════

  ws.getRow(row).height = 28;
  const headers = ['N°', 'Questions', 'Réponse attendue', 'Réponse du soumissionnaire', 'Points', 'Conformité'];
  headers.forEach((h, i) => {
    const cell = ws.getCell(row, i + 1);
    cell.value = h;
    cell.fill = bg(C.teal);
    cell.font = font(C.white, true, 11);
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = border(C.tealDark);
  });
  const tableHeaderRow = row;
  row++;

  // Figer les lignes au-dessus du tableau
  ws.views = [{ state: 'frozen', ySplit: tableHeaderRow, xSplit: 0 }];

  // ══════════════════════════════════════════════════════════════════════════
  // CORPS DU TABLEAU
  // ══════════════════════════════════════════════════════════════════════════

  let questionRowIndex = 0; // pour alternance des couleurs
  const subtotalRows: number[] = []; // mémorise les lignes sous-total pour le total général
  let firstEverQuestionRow = -1; // pour la mise en forme conditionnelle col F
  let lastEverQuestionRow  = -1;

  for (const critere of data.criteres) {
    const critereHeaderRowNum = row; // mémorisé pour rétro-remplir la formule col F
    const critereStaticTotal = critere.questions.reduce((s, q2) => s + (q2.points || 0), 0);

    // ── Ligne critère ────────────────────────────────────────────────────────
    ws.getRow(row).height = 22;
    ws.mergeCells(row, 1, row, 5);
    const cCritLabel = ws.getCell(row, 1);
    cCritLabel.value = critere.ref + (critere.intitule ? ' — ' + critere.intitule : '');
    cCritLabel.fill = bg(C.tealMid);
    cCritLabel.font = font(C.white, true, 11);
    cCritLabel.alignment = { horizontal: 'left', vertical: 'middle', indent: 1 };
    cCritLabel.border = border(C.tealDark);

    // Col F — sera remplie avec formule après avoir écrit le sous-total
    const cCritPts = ws.getCell(row, 6);
    cCritPts.fill = bg(C.tealMid);
    cCritPts.font = font(C.white, true, 12);
    cCritPts.alignment = { horizontal: 'center', vertical: 'middle' };
    cCritPts.border = border(C.tealDark);
    row++;

    // ── Lignes questions ─────────────────────────────────────────────────────
    const firstQuestionRow = row;
    if (firstEverQuestionRow === -1) firstEverQuestionRow = row;

    for (const question of critere.questions) {
      const isEven = questionRowIndex % 2 === 0;
      const rowBg = isEven ? C.white : C.grayAlt;
      const isRenseignee = Boolean(question.reponseSoumissionnaire?.trim());
      const conformite = isRenseignee ? 'Renseigné' : 'Absence de réponse';

      ws.getRow(row).height = Math.max(30, Math.ceil((question.intitule?.length || 0) / 40) * 14 + 10);

      // Col A – N°
      const cNum = ws.getCell(row, 1);
      cNum.value = question.ref;
      cNum.fill = bg(rowBg);
      cNum.font = { ...font(C.grayText, true, 9), name: 'Courier New' };
      cNum.alignment = { horizontal: 'center', vertical: 'top' };
      cNum.border = border();

      // Col B – Question
      const cQ = ws.getCell(row, 2);
      cQ.value = question.intitule || '';
      cQ.fill = bg(rowBg);
      cQ.font = font(C.darkText, false, 10);
      cQ.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
      cQ.border = border();

      // Col C – Réponse attendue
      const cRA = ws.getCell(row, 3);
      cRA.value = question.reponseAttendue || '';
      cRA.fill = bg(rowBg);
      cRA.font = font(C.grayText, false, 10);
      cRA.alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
      cRA.border = border();

      // Col D – Réponse soumissionnaire (fond jaune si vide)
      const cRS = ws.getCell(row, 4);
      cRS.value = question.reponseSoumissionnaire || '';
      cRS.fill = bg(isRenseignee ? rowBg : C.yellow);
      cRS.font = font(isRenseignee ? C.darkText : C.amber, false, 10);
      cRS.alignment = { horizontal: 'left', vertical: 'top', wrapText: true, indent: 1 };
      cRS.border = border();

      // Col E – Points (valeur statique, éditable dans Excel)
      const cPts = ws.getCell(row, 5);
      cPts.value = question.points || 0;
      cPts.fill = bg(rowBg);
      cPts.font = font(C.teal, true, 10);
      cPts.alignment = { horizontal: 'center', vertical: 'top' };
      cPts.border = border();

      // Col F – Conformité  ✅ FORMULE dynamique : vide col D → "Absence de réponse"
      const cConf = ws.getCell(row, 6);
      cConf.value = {
        formula: `IF(D${row}="","Absence de réponse","Répondu")`,
        result: conformite,
      };
      // Fond neutre — les couleurs sont gérées par mise en forme conditionnelle
      cConf.fill = bg(rowBg);
      cConf.font = font(C.grayText, true, 9);
      cConf.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cConf.border = border();

      row++;
      questionRowIndex++;
    }

    const lastQuestionRow = row - 1;
    lastEverQuestionRow = lastQuestionRow;

    // ── Sous-total critère — FORMULE SUM sur la plage des questions ──────────
    const subtotalRowNum = row;
    subtotalRows.push(subtotalRowNum);

    ws.getRow(row).height = 16;
    ws.mergeCells(row, 1, row, 4);
    const cSubLabel = ws.getCell(row, 1);
    cSubLabel.value = `Sous-total ${critere.ref}`;
    cSubLabel.fill = bg(C.tealLight);
    cSubLabel.font = font(C.teal, true, 9);
    cSubLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 1 };
    cSubLabel.border = border();
    for (let c = 2; c <= 4; c++) {
      const cell = ws.getCell(row, c);
      cell.fill = bg(C.tealLight);
      cell.border = border();
    }
    const cSubPts = ws.getCell(row, 5);
    // ✅ FORMULE : somme de toutes les lignes points de ce critère
    cSubPts.value = { formula: `SUM(E${firstQuestionRow}:E${lastQuestionRow})`, result: critereStaticTotal };
    cSubPts.fill = bg(C.tealLight);
    cSubPts.font = font(C.teal, true, 10);
    cSubPts.alignment = { horizontal: 'center', vertical: 'middle' };
    cSubPts.border = border();
    ws.getCell(row, 6).fill = bg(C.tealLight);
    ws.getCell(row, 6).border = border();
    row++;

    // ✅ Rétro-remplir la formule de l'en-tête critère col F → référence le sous-total
    ws.getCell(critereHeaderRowNum, 6).value = {
      formula: `E${subtotalRowNum}`,
      result: critereStaticTotal,
    };

    // Ligne vide entre critères
    ws.getRow(row).height = 5;
    for (let c = 1; c <= 6; c++) ws.getCell(row, c).fill = bg(C.white);
    row++;
  }

  // ── Mise en forme conditionnelle col F — couleurs dynamiques ─────────────
  // Rouge  si "Absence de réponse", vert si "Répondu"
  if (firstEverQuestionRow !== -1 && lastEverQuestionRow !== -1) {
    const cfRef = `F${firstEverQuestionRow}:F${lastEverQuestionRow}`;
    ws.addConditionalFormatting({
      ref: cfRef,
      rules: [
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'Absence de réponse',
          priority: 1,
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFFFEBEE' } },
            font: { bold: true, color: { argb: 'FFC62828' }, size: 9 },
          },
        } as any,
        {
          type: 'containsText',
          operator: 'containsText',
          text: 'Répondu',
          priority: 2,
          style: {
            fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFE8F5E9' } },
            font: { bold: true, color: { argb: 'FF2E7D32' }, size: 9 },
          },
        } as any,
      ],
    });
  }

  // ── Total général — FORMULE : somme de tous les sous-totaux ───────────────
  const grandTotal = data.criteres.reduce(
    (s, cr) => s + cr.questions.reduce((ss, q2) => ss + (q2.points || 0), 0), 0
  );
  // Formule : =E{st1}+E{st2}+... (référence chaque ligne sous-total)
  const grandTotalFormula = subtotalRows.map(r => `E${r}`).join('+');

  ws.getRow(row).height = 24;
  ws.mergeCells(row, 1, row, 4);
  const cTotalLabel = ws.getCell(row, 1);
  cTotalLabel.value = 'TOTAL GÉNÉRAL';
  cTotalLabel.fill = bg(C.tealDark);
  cTotalLabel.font = font(C.white, true, 12);
  cTotalLabel.alignment = { horizontal: 'right', vertical: 'middle', indent: 2 };
  cTotalLabel.border = border(C.tealDark);
  for (let c = 2; c <= 4; c++) {
    const cell = ws.getCell(row, c);
    cell.fill = bg(C.tealDark);
    cell.border = border(C.tealDark);
  }
  const cTotalPts = ws.getCell(row, 5);
  // ✅ FORMULE : somme des lignes sous-total de chaque critère
  cTotalPts.value = { formula: grandTotalFormula, result: grandTotal };
  cTotalPts.fill = bg(C.tealDark);
  cTotalPts.font = font(C.white, true, 14);
  cTotalPts.alignment = { horizontal: 'center', vertical: 'middle' };
  cTotalPts.border = border(C.tealDark);
  ws.getCell(row, 6).fill = bg(C.tealDark);
  ws.getCell(row, 6).border = border(C.tealDark);

  // ── Pied de page ──────────────────────────────────────────────────────────
  ws.headerFooter.oddFooter =
    `&L&8Document généré le ${new Date().toLocaleDateString('fr-FR')}&C&8Questionnaire Technique – Confidentiel&R&8Page &P / &N`;

  // ── Sauvegarde ────────────────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const numCourt = numeroProcedure
    ? numeroProcedure.substring(0, 5)
    : (data.reference ? data.reference.substring(0, 5) : 'AAXXX');
  const filename = `${numCourt}_05_QT.xlsx`;
  saveAs(blob, filename);
}

// ─── Import Excel ─────────────────────────────────────────────────────────────

export interface ImportResult {
  success: boolean;
  data?: Partial<QTGeneriqueData>;
  error?: string;
}

export function importQTGeneriqueExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const wb = XLSX.read(buffer, { type: 'array' });

        // Chercher la feuille QT (ou la première)
        const sheetName = wb.SheetNames.includes('QT') ? 'QT' : wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        if (!ws) {
          resolve({ success: false, error: 'Feuille "QT" introuvable dans le fichier.' });
          return;
        }

        const rows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

        // ── Recherche de la ligne d'en-tête du tableau (contient "N°") ────────
        let tableHeaderRow = -1;
        for (let i = 0; i < rows.length; i++) {
          if (String(rows[i]?.[0] || '').trim() === 'N°') {
            tableHeaderRow = i;
            break;
          }
        }

        if (tableHeaderRow === -1) {
          resolve({ success: false, error: 'Structure du tableau non reconnue (en-tête "N°" introuvable).' });
          return;
        }

        // ── Extraction de l'en-tête procédure ────────────────────────────────
        const reference = String(rows[1]?.[0] || '').trim();
        const objetProcedure = String(rows[2]?.[0] || '').trim();
        const lot = String(rows[3]?.[0] || '').trim();

        // Soumissionnaire : chercher dans les lignes avant le tableau
        let nomSoumissionnaire = '';
        for (let i = 0; i < tableHeaderRow; i++) {
          const c0 = String(rows[i]?.[0] || '').trim();
          const c1 = String(rows[i]?.[1] || '').trim();
          if (!c0 && c1 && !/veuillez|complét|indiqu/i.test(c1)) {
            nomSoumissionnaire = c1;
            break;
          }
        }

        // ── Extraction du tableau ─────────────────────────────────────────────
        const criteres: QTGeneriqueCritere[] = [];
        let currentCritere: QTGeneriqueCritere | null = null;

        for (let i = tableHeaderRow + 1; i < rows.length; i++) {
          const row = rows[i];
          const col0 = String(row[0] || '').trim();
          if (!col0) continue;

          const col1 = String(row[1] || '').trim();
          const isQuestionRef = /^\d+\.\d+$/.test(col0);

          if (isQuestionRef) {
            // ── Ligne question ────────────────────────────────────────────────
            if (!currentCritere) {
              currentCritere = { ref: `Critère ${criteres.length + 1}`, intitule: '', questions: [] };
              criteres.push(currentCritere);
            }
            currentCritere.questions.push({
              ref: col0,
              intitule: col1,
              reponseAttendue: String(row[2] || '').trim() || 'Décrire',
              reponseSoumissionnaire: String(row[3] || '').trim(),
              points: Number(row[4]) || 0,
            });
          } else {
            // ── Ligne critère ─────────────────────────────────────────────────
            // Format template : "Critère 1" ou "Critère 1 – Titre"
            // Format complété : titre direct (ex: "Présentation et organisation...")
            let ref: string;
            let intitule: string;

            if (/^[Cc]rit[eè]re\s+\d+/i.test(col0)) {
              const dashIdx = col0.indexOf('–');
              ref = dashIdx > 0 ? col0.slice(0, dashIdx).trim() : col0;
              intitule = dashIdx > 0 ? col0.slice(dashIdx + 1).trim() : '';
            } else if (/^Sous-total|^TOTAL/i.test(col0)) {
              // Ignorer les lignes de sous-total (export de notre propre app)
              continue;
            } else {
              ref = `Critère ${criteres.length + 1}`;
              intitule = col0;
            }

            currentCritere = { ref, intitule, questions: [] };
            criteres.push(currentCritere);
          }
        }

        resolve({
          success: true,
          data: {
            reference,
            objetProcedure,
            lot,
            nomSoumissionnaire,
            criteres: criteres.length > 0 ? criteres : DEFAULT_QT_GENERIQUE.criteres,
          },
        });
      } catch (err: any) {
        resolve({ success: false, error: err?.message || 'Erreur de lecture du fichier.' });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Impossible de lire le fichier.' });
    reader.readAsArrayBuffer(file);
  });
}
