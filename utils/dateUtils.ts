
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
    return d.toISOString().split('T')[0];
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

export const isDateField = (fieldName: string): boolean => {
  const lower = fieldName.toLowerCase();
  return lower.includes('date') || lower.includes('échéance') || lower === "avis d'attribution" || lower === 'données essentielles';
};
