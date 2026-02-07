/**
 * Export / Import Excel pour la grille des critères techniques (étape 5 AN01).
 * Export : en-tête procédure + tableau structuré (notes 0-4 et commentaires par candidat).
 * Import : lecture du fichier complété et mise à jour des notations.
 */

import * as XLSX from 'xlsx';
import type { AN01Lot, AN01Criterion, AN01ProjectMeta } from '../types/saisie';

const SHEET_NAME = 'Critères techniques';
const ID_CRIT_COL = 'ID critère';
const CODE_COL = 'Code';
const LIBELLE_COL = 'Libellé';
const BAREME_COL = 'Barème';
const NOTE_SUFFIX = ' — Note (0-4)';
const COMMENT_SUFFIX = ' — Commentaire';

/** Exporte la grille des critères techniques du lot vers un fichier Excel. */
export function exportTechnicalCriteriaToExcel(
  lot: AN01Lot,
  meta?: AN01ProjectMeta | null
): void {
  const wb = XLSX.utils.book_new();

  const consultation = meta?.consultation_number ?? '';
  const description = meta?.description ?? '';
  const lotLabel = `${lot.lot_number} — ${lot.lot_name || '(sans nom)'}`;
  const candidatesList = lot.candidates.map((c) => c.company_name || c.id).join(', ');
  const dateExport = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const headerRows: (string | number)[][] = [
    ['Grille de notation — Critères techniques'],
    [],
    ['N° Consultation', consultation],
    ['Description', description],
    ['Lot', lotLabel],
    ['Candidats', candidatesList],
    ['Date d\'export', dateExport],
    [],
    ['Instructions : Remplir les colonnes « Note (0-4) » (valeurs 0, 1, 2, 3 ou 4) et « Commentaire » pour chaque candidat. Ne pas modifier les colonnes ID critère, Code, Libellé et Barème pour permettre la réimportation.'],
    [],
  ];

  const colHeaders: string[] = [ID_CRIT_COL, CODE_COL, LIBELLE_COL, BAREME_COL];
  lot.candidates.forEach((c) => {
    const name = c.company_name || c.id;
    colHeaders.push(`${name}${NOTE_SUFFIX}`);
    colHeaders.push(`${name}${COMMENT_SUFFIX}`);
  });

  const dataRows: (string | number)[][] = lot.criteria.map((crit) => {
    const row: (string | number)[] = [crit.id, crit.code, crit.label ?? '', crit.base_points ?? 0];
    lot.candidates.forEach((cand) => {
      const n = lot.notations[cand.id]?.[crit.id];
      const score = typeof n?.score === 'number' ? n.score : '';
      const comment = n?.comment ?? '';
      row.push(score);
      row.push(comment);
    });
    return row;
  });

  const allRows = [...headerRows, colHeaders, ...dataRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  const colWidths = [
    { wch: 24 },
    { wch: 12 },
    { wch: 40 },
    { wch: 8 },
    ...lot.candidates.flatMap(() => [{ wch: 10 }, { wch: 28 }]),
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, SHEET_NAME);
  const safeName = (consultation || lot.lot_number || 'criteres').replace(/[^a-z0-9_-]/gi, '_');
  const date = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `Criteres_techniques_${safeName}_Lot${lot.lot_number}_${date}.xlsx`);
}

export interface ImportTechnicalCriteriaResult {
  success: boolean;
  error?: string;
  updatedLot?: AN01Lot;
  stats?: { rowsMatched: number; rowsTotal: number };
}

/**
 * Importe un fichier Excel complété et met à jour les notations du lot.
 * Conserve les critères et candidats existants ; met à jour uniquement les notes et commentaires.
 */
export function importTechnicalCriteriaFromExcel(
  file: File,
  lot: AN01Lot
): Promise<ImportTechnicalCriteriaResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          resolve({ success: false, error: 'Fichier vide ou illisible.' });
          return;
        }
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        if (!sheet) {
          resolve({ success: false, error: 'Aucune feuille trouvée dans le fichier.' });
          return;
        }
        const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1, defval: '' }) as (string | number)[][];
        if (!rows.length) {
          resolve({ success: false, error: 'Feuille vide.' });
          return;
        }

        const headerRowIndex = rows.findIndex(
          (r) =>
            Array.isArray(r) &&
            r.some((c) => String(c).trim() === ID_CRIT_COL) &&
            r.some((c) => String(c).trim() === CODE_COL)
        );
        if (headerRowIndex === -1) {
          resolve({ success: false, error: 'En-tête de tableau introuvable (colonnes « ID critère », « Code » attendues). Utilisez un fichier exporté par l\'application.' });
          return;
        }

        const headerRow = rows[headerRowIndex].map((c) => String(c ?? '').trim());
        const idColIdx = headerRow.indexOf(ID_CRIT_COL);
        const codeColIdx = headerRow.indexOf(CODE_COL);
        const baremeColIdx = headerRow.indexOf(BAREME_COL);
        if (idColIdx === -1 && codeColIdx === -1) {
          resolve({ success: false, error: 'Colonnes « ID critère » ou « Code » introuvables.' });
          return;
        }

        const critById = new Map<string, AN01Criterion>(lot.criteria.map((c) => [c.id, c]));
        const critByCode = new Map<string, AN01Criterion>(lot.criteria.map((c) => [c.code, c]));

        const candidateCols: { candidateId: string; noteCol: number; commentCol: number }[] = [];
        lot.candidates.forEach((cand) => {
          const name = cand.company_name || cand.id;
          const noteLabel = `${name}${NOTE_SUFFIX}`;
          const commentLabel = `${name}${COMMENT_SUFFIX}`;
          const noteCol = headerRow.indexOf(noteLabel);
          const commentCol = headerRow.indexOf(commentLabel);
          if (noteCol !== -1) candidateCols.push({ candidateId: cand.id, noteCol, commentCol });
        });

        const newNotations: AN01Lot['notations'] = JSON.parse(JSON.stringify(lot.notations));
        let rowsMatched = 0;
        const dataStart = headerRowIndex + 1;

        for (let i = dataStart; i < rows.length; i++) {
          const row = rows[i];
          if (!Array.isArray(row) || row.length < 2) continue;
          const idVal = row[idColIdx] != null ? String(row[idColIdx]).trim() : '';
          const codeVal = codeColIdx >= 0 && row[codeColIdx] != null ? String(row[codeColIdx]).trim() : '';
          const crit = idVal ? critById.get(idVal) : codeVal ? critByCode.get(codeVal) : null;
          if (!crit) continue;
          rowsMatched++;
          candidateCols.forEach(({ candidateId, noteCol, commentCol }) => {
            const noteRaw = row[noteCol];
            let score = 0;
            if (noteRaw !== undefined && noteRaw !== null && noteRaw !== '') {
              const num = typeof noteRaw === 'number' ? noteRaw : parseFloat(String(noteRaw).replace(',', '.'));
              if (!isNaN(num) && num >= 0 && num <= 4) score = Math.round(num);
            }
            const comment = commentCol >= 0 && row[commentCol] != null ? String(row[commentCol]).trim() : '';
            if (!newNotations[candidateId]) newNotations[candidateId] = {};
            newNotations[candidateId][crit.id] = {
              score,
              comment: comment || (lot.notations[candidateId]?.[crit.id]?.comment ?? ''),
            };
          });
        }

        const updatedLot: AN01Lot = {
          ...lot,
          notations: newNotations,
        };
        resolve({
          success: true,
          updatedLot,
          stats: { rowsMatched, rowsTotal: lot.criteria.length },
        });
      } catch (err) {
        resolve({
          success: false,
          error: err instanceof Error ? err.message : 'Erreur lors de la lecture du fichier Excel.',
        });
      }
    };
    reader.onerror = () => resolve({ success: false, error: 'Impossible de lire le fichier.' });
    reader.readAsArrayBuffer(file);
  });
}
