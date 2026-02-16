/**
 * IndexedDB (Dexie) pour le module Commandes Fina.
 * Tables : achats (lignes), metadata (date MAJ, nombre de lignes).
 */
import Dexie, { type EntityTable } from 'dexie';
import type { AchatRow } from '../types';

export interface AchatsRowRecord {
  id?: number;
  row: AchatRow;
}

export interface AchatsMetadata {
  id: 'singleton';
  lastUpdated: string; // ISO date
  rowCount: number;
}

export const ACHATS_DB_NAME = 'gestprojet-achats';

export class AchatsDexieDB extends Dexie {
  achats!: EntityTable<AchatsRowRecord, 'id'>;
  metadata!: EntityTable<AchatsMetadata, 'id'>;

  constructor() {
    super(ACHATS_DB_NAME);
    this.version(1).stores({
      achats: '++id',
      metadata: 'id'
    });
  }
}

export const achatsDb = new AchatsDexieDB();

/** Récupère les métadonnées (date MAJ, nombre de lignes). */
export async function getMetadata(): Promise<AchatsMetadata | undefined> {
  return achatsDb.metadata.get('singleton');
}

/** Indique si des données existent. */
export async function hasData(): Promise<boolean> {
  const meta = await getMetadata();
  return (meta?.rowCount ?? 0) > 0;
}

/** Compte les lignes (pour mise à jour des métadonnées). */
export async function countRows(): Promise<number> {
  return achatsDb.achats.count();
}

/** Purge complète des données achats + métadonnées. */
export async function clearAllData(): Promise<void> {
  await achatsDb.transaction('rw', achatsDb.achats, achatsDb.metadata, async () => {
    await achatsDb.achats.clear();
    await achatsDb.metadata.clear();
  });
}
