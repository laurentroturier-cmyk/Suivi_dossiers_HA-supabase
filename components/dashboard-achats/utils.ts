/**
 * Utilitaires pour le module Dashboard Achats
 */

import { AchatRow } from './types';

/**
 * Parse une valeur en nombre pour les colonnes monétaires
 */
export function parseNumber(value: any): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return value;
  const str = String(value).replace(/\s/g, '').replace(/,/g, '.');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

/**
 * Somme les valeurs d'une clé dans un tableau d'objets
 */
export function sumBy(data: AchatRow[], key: keyof AchatRow): number {
  return data.reduce((sum, row) => sum + (Number(row[key]) || 0), 0);
}

/**
 * Groupe les données et somme par clé
 */
export function groupSum(
  data: AchatRow[],
  groupKey: keyof AchatRow,
  sumKey: keyof AchatRow
): Record<string, number> {
  const result: Record<string, number> = {};
  data.forEach(row => {
    const key = String(row[groupKey] || '(Vide)');
    result[key] = (result[key] || 0) + (Number(row[sumKey]) || 0);
  });
  return result;
}

/**
 * Retourne les N premiers éléments d'un objet trié par valeur
 */
export function topN(obj: Record<string, number>, n: number): [string, number][] {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  return entries.slice(0, n);
}

/**
 * Formate un nombre en devise euros
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0
  }).format(value);
}

/**
 * Formate un nombre en devise courte (K€, M€)
 */
export function formatCurrencyShort(value: number): string {
  if (value >= 1e6) return (value / 1e6).toFixed(1) + ' M€';
  if (value >= 1e3) return (value / 1e3).toFixed(0) + ' K€';
  return formatCurrency(value);
}

/**
 * Calcule un pourcentage
 */
export function percentage(a: number, b: number): string {
  return b ? (a / b * 100).toFixed(1) + '%' : '0%';
}

/**
 * Extrait les valeurs uniques d'une colonne
 */
export function unique(data: AchatRow[], key: keyof AchatRow): string[] {
  const set = new Set(
    data
      .map(row => row[key])
      .filter(v => v != null && v !== '')
      .map(v => String(v))
  );
  return Array.from(set).sort();
}

/**
 * Tronque une chaîne de caractères
 */
export function truncate(str: string, max: number): string {
  return str && str.length > max ? str.slice(0, max) + '…' : str;
}
