export interface FileData {
  id: string;
  name: string;
  rows: Record<string, unknown>[];
  rowCount: number;
}

export interface MergedRow {
  _index: number;
  _source: string;
  [key: string]: unknown;
}

export type SortDirection = 'asc' | 'desc' | null;

export interface SortState {
  column: string | null;
  direction: SortDirection;
}
