/**
 * Fonctions utilitaires pour Excel
 * Parsing, conversion, extraction de données
 */

import * as XLSX from 'xlsx';
import { convertExcelDate } from './dateUtils';

/**
 * Parse un fichier Excel et retourne les données JSON
 */
export const parseExcelFile = async (file: File, options?: {
  sheetIndex?: number;
  sheetName?: string;
  raw?: boolean;
}): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        // Détecter le type de fichier
        let workbook: XLSX.WorkBook;
        if (data instanceof ArrayBuffer) {
          workbook = XLSX.read(new Uint8Array(data), { type: 'array' });
        } else if (typeof data === 'string') {
          workbook = XLSX.read(data, { type: 'binary', codepage: 65001 });
        } else {
          throw new Error('Format de fichier non supporté');
        }
        
        // Sélectionner la feuille
        let sheetName: string;
        if (options?.sheetName) {
          sheetName = options.sheetName;
        } else if (options?.sheetIndex !== undefined) {
          sheetName = workbook.SheetNames[options.sheetIndex];
        } else {
          sheetName = workbook.SheetNames[0];
        }
        
        if (!sheetName) {
          throw new Error('Aucune feuille trouvée');
        }
        
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          raw: options?.raw ?? false,
          defval: '',
        });
        
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    
    // Lire le fichier selon son type
    if (file.name.endsWith('.xlsx') || file.name.endsWith('.xlsm')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsBinaryString(file);
    }
  });
};

/**
 * Convertit les dates Excel dans un objet de données
 */
export const convertExcelDatesInObject = (
  obj: Record<string, any>,
  dateColumns: string[]
): Record<string, any> => {
  const converted = { ...obj };
  
  for (const col of dateColumns) {
    if (converted[col] !== undefined && converted[col] !== null) {
      const convertedDate = convertExcelDate(converted[col]);
      if (convertedDate) {
        converted[col] = convertedDate;
      }
    }
  }
  
  return converted;
};

/**
 * Convertit les dates Excel dans un tableau d'objets
 */
export const convertExcelDatesInArray = (
  dataArray: Record<string, any>[],
  dateColumns: string[]
): Record<string, any>[] => {
  return dataArray.map(obj => convertExcelDatesInObject(obj, dateColumns));
};

/**
 * Trouve une colonne dans un objet avec recherche floue (insensible à la casse, accents, etc.)
 */
export const findColumn = (row: Record<string, any>, ...names: string[]): any => {
  // Recherche exacte d'abord
  for (const name of names) {
    if (row[name] !== undefined) return row[name];
  }
  
  // Recherche floue
  const keys = Object.keys(row);
  for (const name of names) {
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = keys.find(k => {
      const normalizedKey = k.toLowerCase().replace(/[^a-z0-9]/g, '');
      return normalizedKey.includes(normalizedName) || normalizedName.includes(normalizedKey);
    });
    if (found) return row[found];
  }
  
  return null;
};

/**
 * Extrait les métadonnées d'une feuille Excel (premières lignes)
 */
export const extractMetadata = (
  rows: any[][],
  maxRows: number = 25
): Record<string, string> => {
  const metadata: Record<string, string> = {};
  
  const limit = Math.min(rows.length, maxRows);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row || row.length < 2) continue;
    
    const key = String(row[0] || '').trim();
    const value = String(row[1] || '').trim();
    
    if (key && value) {
      metadata[key] = value;
    }
  }
  
  return metadata;
};

/**
 * Trouve une valeur dans une ligne Excel en cherchant une clé
 */
export const findValueInRow = (row: any[], key: string): string | null => {
  if (!row || row.length < 2) return null;
  
  const keyUpper = key.toUpperCase();
  
  for (let j = 0; j < row.length - 1; j++) {
    const cell = String(row[j] || '').toUpperCase();
    if (cell.includes(keyUpper)) {
      // Chercher la valeur dans les cellules suivantes
      for (let k = j + 1; k < row.length; k++) {
        const value = row[k];
        if (value !== undefined && value !== null && value !== '') {
          return String(value);
        }
      }
    }
  }
  
  return null;
};
