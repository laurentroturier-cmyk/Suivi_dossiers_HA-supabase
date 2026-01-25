/**
 * Fonctions de validation centralisées
 * Validation de données, champs obligatoires, formats, etc.
 */

/**
 * Valide qu'un champ est rempli
 */
export const isRequired = (value: any): boolean => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  return true;
};

/**
 * Valide un email
 */
export const isValidEmail = (email: string): boolean => {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Valide un numéro de téléphone français
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone) return false;
  // Format français : 10 chiffres, peut commencer par 0 ou +33
  const phoneRegex = /^(?:(?:\+|00)33|0)[1-9](?:[0-9]{8})$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Valide un numéro SIRET (14 chiffres)
 */
export const isValidSIRET = (siret: string): boolean => {
  if (!siret) return false;
  const siretRegex = /^\d{14}$/;
  return siretRegex.test(siret.replace(/\s/g, ''));
};

/**
 * Valide un numéro de procédure (5 chiffres)
 */
export const isValidProcedureNumber = (numero: string): boolean => {
  if (!numero) return false;
  return /^\d{5}$/.test(numero);
};

/**
 * Valide qu'un montant est positif
 */
export const isValidAmount = (amount: number | string): boolean => {
  if (amount === null || amount === undefined) return false;
  const num = typeof amount === 'string' 
    ? parseFloat(amount.replace(/,/g, '.').replace(/[^0-9.-]/g, ''))
    : amount;
  return !isNaN(num) && num >= 0;
};

/**
 * Valide qu'une date est valide
 */
export const isValidDate = (date: string | Date | null): boolean => {
  if (!date) return false;
  const d = date instanceof Date ? date : new Date(date);
  return !isNaN(d.getTime());
};

/**
 * Valide qu'une date est dans le futur
 */
export const isFutureDate = (date: string | Date | null): boolean => {
  if (!isValidDate(date)) return false;
  const d = date instanceof Date ? date : new Date(date as string);
  return d > new Date();
};

/**
 * Valide qu'une date est dans le passé
 */
export const isPastDate = (date: string | Date | null): boolean => {
  if (!isValidDate(date)) return false;
  const d = date instanceof Date ? date : new Date(date as string);
  return d < new Date();
};

/**
 * Valide qu'une date est entre deux dates
 */
export const isDateBetween = (
  date: string | Date | null,
  startDate: string | Date | null,
  endDate: string | Date | null
): boolean => {
  if (!isValidDate(date) || !isValidDate(startDate) || !isValidDate(endDate)) return false;
  
  const d = date instanceof Date ? date : new Date(date as string);
  const start = startDate instanceof Date ? startDate : new Date(startDate as string);
  const end = endDate instanceof Date ? endDate : new Date(endDate as string);
  
  return d >= start && d <= end;
};

/**
 * Valide les colonnes obligatoires dans un objet
 */
export const validateRequiredColumns = (
  data: Record<string, any>,
  requiredColumns: string[]
): { isValid: boolean; missingColumns: string[] } => {
  const missingColumns: string[] = [];
  
  for (const col of requiredColumns) {
    if (!isRequired(data[col])) {
      missingColumns.push(col);
    }
  }
  
  return {
    isValid: missingColumns.length === 0,
    missingColumns,
  };
};

/**
 * Valide les colonnes obligatoires dans un tableau d'objets
 */
export const validateRequiredColumnsBatch = (
  dataArray: Record<string, any>[],
  requiredColumns: string[]
): { isValid: boolean; errors: Array<{ row: number; missingColumns: string[] }> } => {
  const errors: Array<{ row: number; missingColumns: string[] }> = [];
  
  dataArray.forEach((data, index) => {
    const validation = validateRequiredColumns(data, requiredColumns);
    if (!validation.isValid) {
      errors.push({
        row: index + 1,
        missingColumns: validation.missingColumns,
      });
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
};
