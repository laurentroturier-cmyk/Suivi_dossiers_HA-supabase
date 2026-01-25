/**
 * Fonctions de formatage centralisées
 * Formatage de devises, nombres, pourcentages, etc.
 */

/**
 * Formate un nombre en devise EUR avec formatage français
 * @param num - Nombre à formater
 * @param options - Options de formatage (fractionDigits, etc.)
 * @returns String formatée (ex: "1 234,56 €")
 */
export const formatCurrency = (num: number | string | null | undefined, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  if (num === null || num === undefined) return '-';
  
  // Convertir string en number si nécessaire
  const numValue = typeof num === 'string' 
    ? parseFloat(num.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : num;
  
  if (isNaN(numValue)) return String(num);
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: options?.minimumFractionDigits ?? 2,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(numValue);
};

/**
 * Formate un nombre avec conventions françaises (séparateurs d'espaces)
 * @param num - Nombre à formater
 * @param options - Options de formatage
 * @returns String formatée (ex: "1 234")
 */
export const formatNumberFR = (num: number | string | null | undefined, options?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  if (num === null || num === undefined) return '-';
  
  const numValue = typeof num === 'string' 
    ? parseFloat(num.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : num;
  
  if (isNaN(numValue)) return String(num);
  
  return new Intl.NumberFormat('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 2,
  }).format(numValue).replace(/\s/g, '\u202F'); // Espace insécable
};

/**
 * Formate un nombre en pourcentage
 * @param num - Nombre à formater (peut être déjà un pourcentage ou une valeur 0-1)
 * @param options - Options de formatage
 * @returns String formatée (ex: "12,5 %")
 */
export const formatPercent = (num: number | string | null | undefined, options?: {
  isDecimal?: boolean; // Si true, num est entre 0 et 1, sinon entre 0 et 100
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string => {
  if (num === null || num === undefined) return '-';
  
  const numValue = typeof num === 'string' 
    ? parseFloat(num.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : num;
  
  if (isNaN(numValue)) return String(num);
  
  // Si c'est une valeur décimale (0-1), la convertir en pourcentage
  const percentValue = options?.isDecimal ? numValue * 100 : numValue;
  
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: options?.minimumFractionDigits ?? 1,
    maximumFractionDigits: options?.maximumFractionDigits ?? 1,
  }).format(percentValue / 100);
};

/**
 * Formate un montant en milliers d'euros (K€)
 * @param num - Montant en euros
 * @returns String formatée (ex: "1 234 K€")
 */
export const formatKCurrency = (num: number | string | null | undefined): string => {
  if (num === null || num === undefined) return '-';
  
  const numValue = typeof num === 'string' 
    ? parseFloat(num.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : num;
  
  if (isNaN(numValue)) return '-';
  
  const kValue = Math.round(numValue / 1000);
  return `${kValue.toLocaleString('fr-FR')} K€`;
};

/**
 * Formate un nombre simple avec options de décimales
 * @param num - Nombre à formater
 * @param maxFractionDigits - Nombre maximum de décimales
 * @returns String formatée
 */
export const formatNumber = (num: number | string | null | undefined, maxFractionDigits: number = 2): string => {
  if (num === null || num === undefined) return '-';
  
  const numValue = typeof num === 'string' 
    ? parseFloat(num.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : num;
  
  if (isNaN(numValue)) return String(num);
  
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: maxFractionDigits,
  }).format(numValue);
};
