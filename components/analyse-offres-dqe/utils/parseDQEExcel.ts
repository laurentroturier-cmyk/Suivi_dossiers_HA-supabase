import * as XLSX from 'xlsx';

export interface ParsedDQERow {
  numero: string;
  designation: string;
  unite: string;
  quantite: number;
  prix_unitaire: number;
  prix_total: number;
  // Champs enrichis pour les vues détaillées
  eco_contrib?: number;
  tva_pct?: number;
  montant_tva?: number;
  montant_ttc?: number;
}

export interface ParseDQEResult {
  rows: ParsedDQERow[];
  totalHT: number;
  totalTVA: number;
  totalTTC: number;
}

/**
 * Retourne la liste des feuilles disponibles dans un fichier Excel.
 */
export async function getExcelSheetNames(file: File): Promise<string[]> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  return workbook.SheetNames || [];
}

/**
 * Parse un fichier Excel DQE pour une feuille donnée et renvoie les lignes normalisées.
 * On s'appuie sur la structure décrite dans le prompt (Code, Désignation, Qté, PU, etc.).
 */
export async function parseDQEExcelFile(
  file: File,
  sheetName: string
): Promise<ParseDQEResult> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Feuille "${sheetName}" introuvable dans le fichier.`);
  }

  // Conversion en tableau d'objets (première ligne = en-têtes)
  const json = XLSX.utils.sheet_to_json<any>(sheet, { header: 1 }) as any[][];

  if (!json || json.length === 0) {
    throw new Error('La feuille sélectionnée est vide.');
  }

  // On cherche la première ligne qui ressemble à un en-tête (contient au moins "code" et "désignation")
  let headerRowIndex = 0;
  for (let i = 0; i < json.length; i++) {
    const row = json[i].map((cell) => String(cell || '').toLowerCase());
    const hasCode = row.some((c) => c.includes('code'));
    const hasDesignation =
      row.some((c) => c.includes('désignation')) || row.some((c) => c.includes('designation'));
    if (hasCode && hasDesignation) {
      headerRowIndex = i;
      break;
    }
  }

  const headerRow = json[headerRowIndex] || [];
  const dataRows = json.slice(headerRowIndex + 1);

  // Trouver l'index des colonnes intéressantes
  const findCol = (keywords: string[]): number => {
    const lower = headerRow.map((c: any) => String(c || '').toLowerCase());
    for (const kw of keywords) {
      const idx = lower.findIndex((c) => c.includes(kw));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const idxCode = findCol(['code']);
  const idxDesignation = findCol(['désignation', 'designation']);
  const idxUnite = findCol(['unité', 'unite']);
  const idxQuantite = findCol(['quantité', 'quantite', 'qté', 'qte']);
  const idxPrixUnitaire = findCol(['pu ht', 'prix unitaire', 'prix ht', "prix à l'unité de vente"]);
  const idxEco = findCol(['éco', 'eco']);
  const idxMontantHT = findCol(['montant ht']);
  const idxTvaPct = findCol(['tva']);
  const idxMontantTTC = findCol(['montant ttc']);

  const rows: ParsedDQERow[] = [];
  let totalHT = 0;
  let totalTVA = 0;
  let totalTTC = 0;

  const toNumber = (val: any): number => {
    if (val == null || val === '') return 0;
    if (typeof val === 'number') return val;
    const s = String(val).replace(/\s/g, '').replace(',', '.');
    const n = Number(s);
    return isNaN(n) ? 0 : n;
  };

  for (const row of dataRows) {
    const code = idxCode >= 0 ? String(row[idxCode] || '').trim() : '';
    const designation = idxDesignation >= 0 ? String(row[idxDesignation] || '').trim() : '';

    // Ignorer les lignes vides
    if (!code && !designation) continue;

    const unite = idxUnite >= 0 ? String(row[idxUnite] || '').trim() : '';
    const quantite = idxQuantite >= 0 ? toNumber(row[idxQuantite]) : 0;
    let pu = idxPrixUnitaire >= 0 ? toNumber(row[idxPrixUnitaire]) : 0;
    const eco = idxEco >= 0 ? toNumber(row[idxEco]) : 0;
    const montantHT =
      idxMontantHT >= 0 ? toNumber(row[idxMontantHT]) : quantite * (pu + eco);

    // Si la colonne PU HT n'existe pas dans le fichier,
    // on la reconstitue à partir du Montant HT / Quantité (en retirant l'éco-contribution si possible)
    if (pu === 0 && quantite > 0 && montantHT > 0) {
      const base = montantHT / quantite;
      pu = eco > 0 ? base - eco : base;
    }
    const tvaPct = idxTvaPct >= 0 ? toNumber(row[idxTvaPct]) : 20;
    const montantTVA = (montantHT * tvaPct) / 100;
    const montantTTC =
      idxMontantTTC >= 0 ? toNumber(row[idxMontantTTC]) : montantHT + montantTVA;

    rows.push({
      numero: code,
      designation,
      unite,
      quantite,
      prix_unitaire: pu,
      prix_total: montantHT,
      eco_contrib: eco,
      tva_pct: tvaPct,
      montant_tva: montantTVA,
      montant_ttc: montantTTC,
    });

    totalHT += montantHT;
    totalTVA += montantTVA;
    totalTTC += montantTTC;
  }

  return {
    rows,
    totalHT,
    totalTVA,
    totalTTC,
  };
}

