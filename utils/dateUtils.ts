/**
 * Fonctions utilitaires pour les dates
 * Conversion Excel, formatage, parsing
 */

/**
 * Convertit un numéro de série Excel (ex: 44792) en objet Date JS.
 * Excel utilise le 30/12/1899 comme base.
 */
export const excelDateToJSDate = (serial: number | string): Date | null => {
  const n = typeof serial === 'string' ? parseFloat(serial) : serial;
  if (isNaN(n) || n < 10000) return null; // Sécurité pour éviter de convertir des petits nombres qui ne sont pas des dates
  
  // Correction pour le bug de l'année bissextile 1900 d'Excel
  const utc_days = Math.floor(n - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);

  const fractional_day = n - Math.floor(n) + 0.0000001;
  let total_seconds = Math.floor(86400 * fractional_day);

  const seconds = total_seconds % 60;
  total_seconds -= seconds;

  const hours = Math.floor(total_seconds / (60 * 60));
  const minutes = Math.floor(total_seconds / 60) % 60;

  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
};

/**
 * Convertit une valeur Excel (nombre, string) en date ISO (YYYY-MM-DD)
 * Utilisé pour l'import de données depuis Excel
 */
export const convertExcelDate = (value: any): string | null => {
  if (!value) return null;
  
  // Si c'est déjà une date ISO, la retourner
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.split('T')[0]; // Retourner juste la partie date
  }
  
  // Si c'est un nombre (format Excel)
  if (typeof value === 'number') {
    // Excel date serial number: jours depuis 1900-01-01
    const excelEpoch = new Date(1900, 0, 1);
    const date = new Date(excelEpoch.getTime() + (value - 1) * 24 * 60 * 60 * 1000);
    
    // Correction pour le bug du 29 février 1900 dans Excel
    if (value > 60) {
      date.setDate(date.getDate() + 1);
    }
    
    // Retourner au format ISO (YYYY-MM-DD)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  
  // Si c'est une chaîne, essayer de la parser
  if (typeof value === 'string') {
    try {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        const year = parsed.getFullYear();
        const month = String(parsed.getMonth() + 1).padStart(2, '0');
        const day = String(parsed.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    } catch (e) {
      // Continuer
    }
  }
  
  return null;
};

/**
 * Formate une date Excel en date française (DD/MM/YYYY)
 */
export const formatExcelDate = (dateValue: any): string => {
  if (!dateValue) return '';
  
  try {
    // Si c'est déjà une string de date
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('fr-FR');
      }
    }
    
    // Si c'est un nombre Excel (jours depuis 1900)
    if (typeof dateValue === 'number') {
      const excelEpoch = new Date(1900, 0, 1);
      const date = new Date(excelEpoch.getTime() + (dateValue - 2) * 24 * 60 * 60 * 1000);
      return date.toLocaleDateString('fr-FR');
    }
    
    return String(dateValue);
  } catch {
    return String(dateValue);
  }
};

/**
 * Formate une valeur brute (string, number, excel serial) en date courte française DD/MM/YYYY.
 */
export const formatDisplayDate = (val: any): string => {
  if (!val) return '';
  
  // Si c'est un nombre (possible date Excel)
  if (!isNaN(parseFloat(val)) && String(val).length >= 5 && /^\d+(\.\d+)?$/.test(String(val))) {
    const d = excelDateToJSDate(val);
    if (d) return d.toLocaleDateString('fr-FR');
  }

  // Si c'est déjà une date ISO ou un format reconnaissable
  const d = new Date(val);
  if (!isNaN(d.getTime()) && val.includes('-')) {
    return d.toLocaleDateString('fr-FR');
  }

  return String(val); // Retourne tel quel si déjà au format DD/MM/YYYY ou autre
};

/**
 * Parse une date au format DD/MM/YYYY ou autre format
 */
export const parseDate = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  
  // Format DD/MM/YYYY
  if (dateStr.includes('/')) {
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }
  
  // Format ISO ou autre
  return new Date(dateStr);
};

/**
 * Formate une date pour l'affichage (DD/MM/YYYY) depuis une string
 */
export const formatDateFromString = (dateStr: string | null): string => {
  if (!dateStr) return '-';
  const date = parseDate(dateStr);
  if (!date || isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('fr-FR');
};

/**
 * Formate une date avec format long (ex: "15 janvier 2024")
 */
export const formatDateLong = (dateString: string | null | undefined): string => {
  if (!dateString) return '';
  const date = parseDate(dateString);
  if (!date || isNaN(date.getTime())) return dateString || '';
  return date.toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

/**
 * Convertit une valeur de date (Excel, FR, ISO) vers le format YYYY-MM-DD requis par <input type="date">.
 */
export const formatToInputDate = (val: any): string => {
  if (!val) return '';

  let d: Date | null = null;

  // Cas Excel
  if (!isNaN(parseFloat(val)) && String(val).length >= 5 && /^\d+(\.\d+)?$/.test(String(val))) {
    d = excelDateToJSDate(val);
  } else if (String(val).includes('/')) {
    // Cas DD/MM/YYYY
    const [day, month, year] = String(val).split('/');
    d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  } else {
    // Cas ISO ou autre
    d = new Date(val);
  }

  if (d && !isNaN(d.getTime())) {
    // FIX: Utiliser les méthodes locales au lieu de toISOString() pour éviter le décalage de fuseau horaire
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
};

/**
 * Convertit une date YYYY-MM-DD (input) vers le format de stockage DD/MM/YYYY.
 */
export const inputToStoreDate = (isoDate: string): string => {
  if (!isoDate) return '';
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

/**
 * Détecte si un nom de champ correspond à une date
 */
export const isDateField = (fieldName: string): boolean => {
  const lower = fieldName.toLowerCase();
  return lower.includes('date') || lower.includes('échéance') || lower === "avis d'attribution" || lower === 'données essentielles';
};
