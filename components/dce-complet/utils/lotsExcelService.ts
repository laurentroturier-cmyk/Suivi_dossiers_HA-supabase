import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

export interface LotExcel {
  numero: string;
  intitule: string;
  montantMax: string;
}

/**
 * Exporte les lots vers un fichier Excel
 * @param lots - Liste des lots à exporter
 * @param nbLots - Nombre de lots attendus (pour pré-remplir si lots vide)
 * @param filename - Nom du fichier (sans extension)
 */
export function exportLotsToExcel(
  lots: LotExcel[],
  nbLots: number,
  filename: string = 'configuration_lots'
): void {
  // Si pas de lots existants, pré-remplir avec le nombre demandé
  let lotsToExport = lots;
  if (lots.length === 0 && nbLots > 0) {
    lotsToExport = Array.from({ length: nbLots }, (_, i) => ({
      numero: String(i + 1),
      intitule: '',
      montantMax: '',
    }));
  }

  // Créer les données pour Excel
  const excelData = lotsToExport.map(lot => ({
    'N° Lot': lot.numero,
    'Intitulé du lot': lot.intitule,
    'Montant max (€ HT)': lot.montantMax,
  }));

  // Créer le workbook et la feuille
  const worksheet = XLSX.utils.json_to_sheet(excelData);

  // Définir les largeurs de colonnes
  worksheet['!cols'] = [
    { wch: 10 },  // N° Lot
    { wch: 50 },  // Intitulé
    { wch: 20 },  // Montant
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Lots');

  // Ajouter une feuille d'instructions
  const instructions = [
    ['Instructions'],
    [''],
    ['1. Remplissez la colonne "Intitulé du lot" pour chaque lot'],
    ['2. Remplissez la colonne "Montant max (€ HT)" avec le montant estimé'],
    ['3. Ne modifiez pas les numéros de lots'],
    ['4. Vous pouvez ajouter des lignes pour créer de nouveaux lots'],
    ['5. Sauvegardez le fichier et importez-le dans l\'application'],
  ];
  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructions);
  instructionsSheet['!cols'] = [{ wch: 60 }];
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

  // Générer le fichier et le télécharger
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
}

/**
 * Importe les lots depuis un fichier Excel
 * @param file - Fichier Excel à importer
 * @returns Promise avec la liste des lots importés
 */
export function importLotsFromExcel(file: File): Promise<LotExcel[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        // Lire la première feuille (Lots)
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

        // Debug : afficher les noms de colonnes de la première ligne
        if (jsonData.length > 0) {
          console.log('📋 Colonnes détectées dans Excel:', Object.keys(jsonData[0]));
        }

        // Mapper vers notre interface
        const lots: LotExcel[] = jsonData
          .map((row, index) => {
            // Gérer les différentes variations de noms de colonnes
            const numero = String(
              row['N° Lot'] ?? row['Numero'] ?? row['numero'] ?? row['N°'] ?? row['__EMPTY'] ?? ''
            ).trim();
            
            const intitule = String(
              row['Intitulé du lot'] ?? row['Intitule'] ?? row['intitule'] ?? row['Intitulé'] ?? row['__EMPTY_1'] ?? ''
            ).trim();
            
            // Essayer de trouver la colonne de montant avec plus de variantes
            let montantMax = '';
            const possibleKeys = [
              'Montant max (€ HT)', 
              'Montant max', 
              'montantMax', 
              'Montant', 
              'Montant (€ HT)', 
              'Montant HT', 
              'Prix', 
              '__EMPTY_2',
              // Variantes avec espaces et parenthèses différentes
              ' Montant max ( HT) ',
              ' Montant max (HT) ',
              'Montant max ( HT)',
              'Montant max (HT)',
            ];
            
            for (const key of possibleKeys) {
              if (row[key] !== undefined && row[key] !== null && row[key] !== '') {
                // Convertir en string et gérer les nombres
                const value = typeof row[key] === 'number' ? row[key].toString() : String(row[key]);
                if (value.trim() !== '') {
                  montantMax = value.trim();
                  break;
                }
              }
            }
            
            // Si pas trouvé, chercher dans toutes les colonnes SAUF celle du numéro
            if (!montantMax) {
              const allKeys = Object.keys(row);
              // Exclure les colonnes qui contiennent le numéro de lot
              const excludedKeys = ['N° Lot', 'Numero', 'numero', 'N°', '__EMPTY'];
              
              for (const key of allKeys) {
                // Ignorer les colonnes de numéro et d'intitulé et les métadonnées
                if (excludedKeys.includes(key) || 
                    key === 'Intitulé du lot' || 
                    key === '__EMPTY_1' ||
                    key === '__rowNum__') {
                  continue;
                }
                
                const rawValue = row[key];
                // Gérer les nombres directement
                let numericValue: number;
                if (typeof rawValue === 'number') {
                  numericValue = rawValue;
                } else {
                  const value = String(rawValue ?? '').trim();
                  const cleanValue = value.replace(/\s/g, '').replace(',', '.');
                  numericValue = parseFloat(cleanValue);
                }
                
                // Vérifier que c'est un nombre valide et suffisamment grand (pas 1, 2, 3...)
                if (!isNaN(numericValue) && numericValue > 100) {
                  montantMax = numericValue.toString();
                  console.log(`💡 Montant détecté dans colonne "${key}":`, rawValue, `(valeur numérique: ${numericValue})`);
                  break;
                }
              }
            }

            // Debug pour chaque ligne
            if (index < 3) {
              console.log(`Ligne ${index + 1}:`, { numero, intitule, montantMax, row });
            }

            return { numero, intitule, montantMax };
          })
          .filter(lot => lot.numero !== ''); // Filtrer les lignes vides

        if (lots.length === 0) {
          reject(new Error('Aucun lot trouvé dans le fichier Excel'));
          return;
        }

        console.log('✅ Lots importés:', lots.length);
        resolve(lots);
      } catch (error) {
        console.error('❌ Erreur import Excel:', error);
        reject(new Error('Erreur lors de la lecture du fichier Excel'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Erreur lors de la lecture du fichier'));
    };

    reader.readAsArrayBuffer(file);
  });
}
