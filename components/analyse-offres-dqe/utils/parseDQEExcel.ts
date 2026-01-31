/**
 * Parse un fichier Excel DQE candidat et retourne les lignes + total HT calculé.
 * Réutilise la logique de mapping du DQEForm (colonnes DQE / BPU).
 */

import * as XLSX from 'xlsx';

const DQE_COLUMN_IDS = [
  'codeArticle',
  'categorie',
  'designation',
  'unite',
  'quantite',
  'refFournisseur',
  'designationFournisseur',
  'prixUniteVenteHT',
  'prixUniteHT',
  'ecoContribution',
  'montantHT',
  'tauxTVA',
  'montantTVA',
  'montantTTC',
] as const;

const DQE_KEYWORDS = [
  'code',
  'article',
  'categorie',
  'catégorie',
  'designation',
  'désignation',
  'unite',
  'unité',
  'quantite',
  'quantité',
  'prix',
  'ref',
  'référence',
  'fournisseur',
  'marque',
  'conditionnement',
  'montant',
  'tva',
  'eco',
  'contribution',
];

function normalize(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function parseNumericValue(value: unknown): number {
  if (value === null || value === undefined || value === '') return 0;
  const cleaned = String(value)
    .trim()
    .replace(/\s+/g, '')
    .replace(/,/g, '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export interface ParsedDQERow {
  id: string;
  codeArticle: string;
  designation: string;
  quantite: number;
  prixUniteVenteHT: number;
  ecoContribution: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  [key: string]: unknown;
}

export interface ParseDQEResult {
  rows: ParsedDQERow[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

export async function parseDQEExcelFile(file: File): Promise<ParseDQEResult> {
  const data = await readFileAsArrayBuffer(file);
  const workbook = XLSX.read(data, { type: 'array' });

  const sheetName =
    workbook.SheetNames.find(
      (n) =>
        n.toLowerCase().includes('dqe') ||
        n.toLowerCase().includes('decompte') ||
        n.toLowerCase().includes('bpu') ||
        n.toLowerCase().includes('bordereau')
    ) || workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];
  const jsonData: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!jsonData || jsonData.length < 2) {
    throw new Error('Fichier vide ou invalide');
  }

  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(20, jsonData.length); i++) {
    const row = jsonData[i] as string[];
    if (!row?.length) continue;
    const keywordMatches = row.filter((cell) => {
      if (!cell) return false;
      return DQE_KEYWORDS.some((k) => String(cell).toLowerCase().includes(k));
    }).length;
    if (keywordMatches >= 3) {
      headerRowIndex = i;
      break;
    }
  }

  const importedHeaders = (jsonData[headerRowIndex] as string[]).map((h) => String(h || ''));
  const importedRows = (jsonData as string[][]).slice(headerRowIndex + 1).filter((row) =>
    row.some((cell) => cell != null && String(cell).trim() !== '')
  );

  const columnMapping: Record<number, string> = {};
  const usedColumns = new Set<string>();

  importedHeaders.forEach((importedHeader, index) => {
    const normalizedImported = normalize(importedHeader);
    const matchingId = DQE_COLUMN_IDS.find((colId) => {
      if (usedColumns.has(colId)) return false;
      const colNorm = normalize(colId);
      return (
        normalizedImported === colNorm ||
        normalizedImported.includes(colNorm) ||
        colNorm.includes(normalizedImported)
      );
    });
    if (matchingId) {
      columnMapping[index] = matchingId;
      usedColumns.add(matchingId);
    }
  });

  let totalHT = 0;
  let totalTVA = 0;
  let totalTTC = 0;

  const rows: ParsedDQERow[] = importedRows.map((row, rowIndex) => {
    const record: Record<string, unknown> = { id: `row-${rowIndex}` };
    row.forEach((cell, cellIndex) => {
      const colId = columnMapping[cellIndex];
      if (colId) record[colId] = cell != null ? String(cell).trim() : '';
    });

    const quantite = parseNumericValue(record.quantite);
    const prixUniteVenteHT = parseNumericValue(record.prixUniteVenteHT);
    const ecoContribution = parseNumericValue(record.ecoContribution);
    const tauxTVA = parseNumericValue(record.tauxTVA) || 20;

    const montantHT = quantite * (prixUniteVenteHT + ecoContribution);
    const montantTVA = montantHT * (tauxTVA / 100);
    const montantTTC = montantHT + montantTVA;

    totalHT += montantHT;
    totalTVA += montantTVA;
    totalTTC += montantTTC;

    return {
      ...record,
      codeArticle: String(record.codeArticle || ''),
      designation: String(record.designation || ''),
      quantite,
      prixUniteVenteHT,
      ecoContribution,
      tauxTVA,
      montantHT,
      montantTVA,
      montantTTC,
    } as ParsedDQERow;
  });

  return { rows, totalHT, totalTVA, totalTTC };
}

function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}
