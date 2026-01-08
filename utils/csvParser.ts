
/**
 * Simple CSV parser that handles basic quotes and commas.
 */
export const parseCSV = <T,>(csv: string, mapping: Record<string, keyof T>): T[] => {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    // Regex to handle quoted strings with commas inside
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const obj = {} as T;
    headers.forEach((header, index) => {
      const key = mapping[header.trim()];
      if (key) {
        obj[key] = (values[index] || '') as any;
      }
    });
    return obj;
  });
};
