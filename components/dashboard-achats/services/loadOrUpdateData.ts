/**
 * Charge ou met à jour les données Excel dans IndexedDB.
 * Écrase les anciennes données et met à jour la date de dernière modification.
 */
import * as XLSX from 'xlsx';
import { achatsDb, getMetadata } from '../db/achatsDb';
import { MONEY_COLS } from '../constants';
import { parseNumber } from '../utils';
import type { AchatRow } from '../types';

const BATCH_SIZE = 5000;

function readFile(file: File): Promise<AchatRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array', cellText: true, cellDates: true });
        let rows: AchatRow[] = [];
        for (const sheetName of wb.SheetNames) {
          const json = XLSX.utils.sheet_to_json<AchatRow>(wb.Sheets[sheetName], { defval: '' });
          rows = rows.concat(json);
        }
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function normalizeRow(row: AchatRow, sourceName: string): AchatRow {
  const out = { ...row, _source: sourceName } as AchatRow;

  // 1) Colonnes monétaires -> toujours des nombres
  MONEY_COLS.forEach((col) => {
    if (col in out) {
      out[col] = parseNumber(out[col]) as any;
    }
  });

  // 2) Toutes les autres colonnes -> toujours des chaînes (VARCHAR)
  for (const key of Object.keys(out)) {
    if (key === '_source') continue;
    if (MONEY_COLS.includes(key as any)) continue;
    const value = (out as any)[key];
    if (value == null) {
      (out as any)[key] = '';
    } else if (typeof value !== 'string') {
      (out as any)[key] = String(value);
    }
  }

  return out;
}

/**
 * Charge ou met à jour les données à partir des fichiers Excel/CSV.
 * Remplace toutes les données existantes et met à jour les métadonnées.
 */
export async function loadOrUpdateData(files: File[]): Promise<{ rowCount: number; lastUpdated: string }> {
  let allRows: AchatRow[] = [];

  for (const file of files) {
    const rows = await readFile(file);
    rows.forEach((r) => allRows.push(normalizeRow(r, file.name)));
  }

  await achatsDb.transaction('rw', achatsDb.achats, achatsDb.metadata, async () => {
    await achatsDb.achats.clear();
    const records = allRows.map((row) => ({ row }));
    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      await achatsDb.achats.bulkAdd(batch);
    }
    const lastUpdated = new Date().toISOString();
    await achatsDb.metadata.put({
      id: 'singleton',
      lastUpdated,
      rowCount: allRows.length
    });
  });

  const meta = await getMetadata();
  return {
    rowCount: meta?.rowCount ?? allRows.length,
    lastUpdated: meta?.lastUpdated ?? new Date().toISOString()
  };
}
