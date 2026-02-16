/**
 * DuckDB-WASM : chargement des données depuis IndexedDB et requêtes SQL.
 */
import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';
import duckdb_wasm_eh from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url';
import eh_worker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url';
import type { AchatRow, Filters, KPIData } from '../types';
import { achatsDb } from '../db/achatsDb';

const BATCH_SIZE = 8000;
const DUCKDB_JSON_BATCH = 'achats_batch.json';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
  eh: {
    mainModule: duckdb_wasm_eh,
    mainWorker: eh_worker
  }
};

let duckDb: duckdb.AsyncDuckDB | null = null;
let duckConn: duckdb.AsyncDuckDBConnection | null = null;
let duckWorker: Worker | null = null;

function sqlId(name: string): string {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * Initialise DuckDB et charge les données depuis IndexedDB.
 */
export async function initDuckDB(): Promise<void> {
  if (duckConn) return;

  try {
    const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
    if (!bundle.mainWorker || !bundle.mainModule) {
      throw new Error('Bundle DuckDB incomplet');
    }
    
    // Le worker est déjà une URL résolue par Vite avec ?url
    duckWorker = new Worker(bundle.mainWorker);
    
    duckWorker.onerror = (error) => {
      console.error('Worker DuckDB erreur:', error);
    };
    
    duckWorker.onmessageerror = (error) => {
      console.error('Worker DuckDB message erreur:', error);
    };
    
    const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.ERROR);
    duckDb = new duckdb.AsyncDuckDB(logger, duckWorker);
    
    await duckDb.instantiate(bundle.mainModule, bundle.pthreadWorker);
    duckConn = await duckDb.connect();
  } catch (error) {
    console.error('Erreur init DuckDB:', error);
    await closeDuckDB();
    throw error;
  }

  const total = await achatsDb.achats.count();
  let offset = 0;
  let batchIndex = 0;

  // Typage forcé pour éviter que DuckDB infère DOUBLE sur des colonnes texte
  const jsonColumnTypes: Record<string, arrow.DataType> = {
    'Description du CR': new arrow.Utf8(),
    'Description du CRT': new arrow.Utf8(),
    'CR': new arrow.Utf8(),
    'CRT': new arrow.Utf8()
  };

  while (offset < total) {
    const page = await achatsDb.achats.orderBy('id').offset(offset).limit(BATCH_SIZE).toArray();
    const rows = page.map((r) => r.row);
    offset += page.length;

    const jsonStr = JSON.stringify(rows);
    const fileName = DUCKDB_JSON_BATCH + batchIndex;
    await duckDb.registerFileText(fileName, jsonStr);

    if (batchIndex === 0) {
      await duckConn.insertJSONFromPath(fileName, {
        name: 'achats',
        create: true,
        columns: jsonColumnTypes
      });
    } else {
      // Charge le batch dans une table temporaire avec typage contrôlé puis insère dans achats
      await duckConn.insertJSONFromPath(fileName, {
        name: 'achats_tmp',
        create: true,
        columns: jsonColumnTypes
      });
      await duckConn.query('INSERT INTO achats SELECT * FROM achats_tmp');
      await duckConn.query('DROP TABLE achats_tmp');
    }
    batchIndex++;
  }
}

/**
 * Ferme la connexion DuckDB et libère les ressources.
 */
export async function closeDuckDB(): Promise<void> {
  if (duckConn) {
    await duckConn.close();
    duckConn = null;
  }
  if (duckDb) {
    await duckDb.terminate();
    duckDb = null;
  }
  if (duckWorker) {
    duckWorker.terminate();
    duckWorker = null;
  }
}

function escapeSqlString(s: string): string {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

function buildWhereClause(filters: Filters): string {
  const conditions: string[] = [];

  if (filters.trimestre) {
    conditions.push(`${sqlId('Trimestre')} = ${escapeSqlString(filters.trimestre)}`);
  }
  if (filters.famille) {
    conditions.push(`${sqlId("Famille d'achats")} = ${escapeSqlString(filters.famille)}`);
  }
  if (filters.fournisseur) {
    conditions.push(`${sqlId('Fournisseur')} = ${escapeSqlString(filters.fournisseur)}`);
  }
  if (filters.region) {
    conditions.push(`${sqlId('Description du CRT')} = ${escapeSqlString(filters.region)}`);
  }
  if (filters.statut) {
    conditions.push(`${sqlId('Signification du statut du document')} = ${escapeSqlString(filters.statut)}`);
  }
  if (filters.categorie) {
    conditions.push(`${sqlId("Catégorie d'achats")} = ${escapeSqlString(filters.categorie)}`);
  }

  return conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
}

/**
 * Exécute une requête SQL et retourne les lignes en JSON.
 */
async function queryToArray(sql: string): Promise<Record<string, unknown>[]> {
  if (!duckConn) throw new Error('DuckDB non initialisé');
  const result = await duckConn.query(sql);
  const arr = result.toArray?.() ?? [];
  return arr.map((row: Record<string, unknown>) => {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(row)) {
      const v = row[k];
      out[k] = typeof v === 'bigint' ? Number(v) : v;
    }
    return out;
  }) as Record<string, unknown>[];
}

/**
 * Retourne les KPIs selon les filtres.
 */
export async function queryKPI(filters: Filters): Promise<KPIData> {
  const whereSql = buildWhereClause(filters);
  const base = `FROM achats${whereSql}`;

  const [sums, fournisseurs, commandes, count] = await Promise.all([
    queryToArray(
      `SELECT
        COALESCE(SUM(${sqlId('Montant de la ventilation de commande')}), 0) AS totalCommande,
        COALESCE(SUM(${sqlId('Montant de ventilation facturé')}), 0) AS totalFacture,
        COALESCE(SUM(${sqlId('Montant de ventilation livré')}), 0) AS totalLivre,
        COALESCE(SUM(${sqlId('Montant total')}), 0) AS totalMontant
      ${base}`
    ),
    queryToArray(`SELECT COUNT(DISTINCT ${sqlId('Fournisseur')}) AS c ${base}`),
    queryToArray(`SELECT COUNT(DISTINCT ${sqlId('Commande')}) AS c ${base}`),
    queryToArray(`SELECT COUNT(*) AS c ${base}`)
  ]);

  const row = sums[0];
  return {
    totalCommande: Number(row?.totalCommande ?? 0),
    totalFacture: Number(row?.totalFacture ?? 0),
    totalLivre: Number(row?.totalLivre ?? 0),
    totalMontant: Number(row?.totalMontant ?? 0),
    nbFournisseurs: Number((fournisseurs[0] as any)?.c ?? 0),
    nbCommandes: Number((commandes[0] as any)?.c ?? 0),
    nbLignes: Number((count[0] as any)?.c ?? 0)
  };
}

/**
 * Retourne les lignes filtrées (pour tableaux et graphiques).
 */
export async function queryFilteredData(filters: Filters): Promise<AchatRow[]> {
  const whereSql = buildWhereClause(filters);
  const rows = await queryToArray(`SELECT * FROM achats${whereSql}`);
  return rows as unknown as AchatRow[];
}

/**
 * Retourne les valeurs distinctes par colonne pour les filtres.
 */
export async function getDistinctColumns(): Promise<{
  Trimestre: string[];
  "Famille d'achats": string[];
  Fournisseur: string[];
  "Description du CRT": string[];
  "Signification du statut du document": string[];
  "Catégorie d'achats": string[];
}> {
  if (!duckConn) throw new Error('DuckDB non initialisé');

  const cols = [
    'Trimestre',
    "Famille d'achats",
    'Fournisseur',
    'Description du CRT',
    'Signification du statut du document',
    "Catégorie d'achats"
  ] as const;

  const out = {
    Trimestre: [] as string[],
    "Famille d'achats": [] as string[],
    Fournisseur: [] as string[],
    "Description du CRT": [] as string[],
    "Signification du statut du document": [] as string[],
    "Catégorie d'achats": [] as string[]
  };

  await Promise.all(
    cols.map(async (col) => {
      const res = await queryToArray(
        `SELECT DISTINCT ${sqlId(col)} AS v FROM achats WHERE ${sqlId(col)} IS NOT NULL AND ${sqlId(col)} != '' ORDER BY v`
      );
      out[col] = res.map((r) => String(r.v ?? '')).filter(Boolean);
    })
  );

  return out;
}
