import * as XLSX from 'xlsx';
import { AnalysisData, Metadata, Offer, Stats, CandidateTechnicalAnalysis, GlobalAnalysisResult } from '../types';

// Helper to round to 2 decimal places strictly
const round2 = (num: number): number => {
  return Math.round((num + Number.EPSILON) * 100) / 100;
};

export const parseExcelFile = async (file: File): Promise<GlobalAnalysisResult> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // --- 1. Extract Global Metadata from "Synthèse" sheet ---
        const globalMetadata: Record<string, string> = {};
        const synthesisSheetName = workbook.SheetNames.find((n: string) => n.trim().toLowerCase() === "synthèse" || n.trim().toLowerCase() === "synthese");
        
        if (synthesisSheetName) {
            const synthesisWorksheet = workbook.Sheets[synthesisSheetName];
            const synthesisData = XLSX.utils.sheet_to_json(synthesisWorksheet, { header: 1, defval: "" });
            
            // Read rows 2 to 8 (Index 1 to 7)
            // Columns 1 and 2 (Index 0 and 1)
            for (let i = 1; i <= 7; i++) {
                const row = synthesisData[i];
                if (row && row.length >= 2) {
                    const key = String(row[0]).trim();
                    const value = String(row[1]).trim();
                    if (key) {
                        globalMetadata[key] = value;
                    }
                }
            }
        }

        // --- 2. Find and Parse Lot Sheets ---
        
        // Find all sheets that look like "Lot X" (and exclude "QT-" or "Analyse QT" sheets from this main list)
        // If no "Lot" sheets found, fallback to "AN01" for backward compatibility
        let lotSheetNames = workbook.SheetNames.filter((n: string) => {
            const upper = n.toUpperCase();
            return upper.includes("LOT") && !upper.includes("QT") && !upper.includes("ANALYSE QT");
        });

        if (lotSheetNames.length === 0) {
            // Fallback: look for AN01
            const an01 = workbook.SheetNames.find((n: string) => n.toUpperCase().includes("AN01"));
            if (an01) lotSheetNames = [an01];
        }

        if (lotSheetNames.length === 0) {
            // Last resort: just take the first sheet if it's not a QT sheet
            if (workbook.SheetNames.length > 0) {
                 lotSheetNames = [workbook.SheetNames[0]];
            } else {
                 throw new Error("Aucune feuille 'Lot' ou 'AN01' trouvée.");
            }
        }

        const lots: AnalysisData[] = [];

        // Iterate through each detected Lot sheet
        for (const sheetName of lotSheetNames) {
            const worksheet = workbook.Sheets[sheetName];
            const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
            
            try {
                const metadata = extractMetadata(rawData);
                const offers = extractOffers(rawData);
                
                // Skip sheets that don't look like valid analysis sheets (no offers)
                if (offers.length === 0) {
                    console.warn(`Skipping sheet ${sheetName}: No offers found.`);
                    continue;
                }
                
                const stats = calculateStats(offers);

                // 2. Technical Analysis (Find corresponding QT sheet)
                // Logic: Look for "QT-Lot X" or "QT-[Same Name]"
                let techAnalysis: CandidateTechnicalAnalysis[] | undefined = undefined;
                
                // normalize: remove "Lot" to just get the identifier "1", "2", etc if needed, or just match substrings
                const normalizedLotName = sheetName.replace(/lot/i, '').trim();
                
                let qtSheetName = workbook.SheetNames.find((n: string) => {
                    const upper = n.toUpperCase();
                    // Match "QT-Lot X" or "QT - Lot X" or "QT Lot X" or simply containing "QT" and the sheet name
                    return (upper.includes("QT") && upper.includes(sheetName.toUpperCase())) ||
                           (upper.includes("QT") && upper.includes(normalizedLotName) && normalizedLotName.length > 0);
                });

                // FALLBACK: If specific QT sheet not found, look for generic "Analyse QT"
                if (!qtSheetName) {
                    qtSheetName = workbook.SheetNames.find((n: string) => n.trim().toUpperCase() === "ANALYSE QT");
                }
                
                if (qtSheetName) {
                    const qtWorksheet = workbook.Sheets[qtSheetName];
                    const qtRawData = XLSX.utils.sheet_to_json(qtWorksheet, { header: 1, defval: "" });
                    // Pass known offers to match candidate names columns
                    techAnalysis = extractTechnicalAnalysis(qtRawData, offers.map(o => o.name));
                }

                lots.push({
                    lotName: sheetName,
                    metadata,
                    offers,
                    stats,
                    technicalAnalysis: techAnalysis
                });

            } catch (err) {
                console.warn(`Error parsing sheet ${sheetName}`, err);
                // We allow partial failures (if one lot fails, others might succeed)
            }
        }

        if (lots.length === 0) {
            throw new Error("Aucune donnée d'offre valide trouvée dans les onglets identifiés.");
        }
        
        // Sort results by Lot name (numeric sort if possible: Lot 1, Lot 2...)
        lots.sort((a, b) => {
             const numA = parseInt(a.lotName.replace(/\D/g, '')) || 0;
             const numB = parseInt(b.lotName.replace(/\D/g, '')) || 0;
             if (numA !== 0 && numB !== 0) return numA - numB;
             return a.lotName.localeCompare(b.lotName);
        });

        resolve({ lots, globalMetadata });
      } catch (err) {
        reject(err);
      }
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

const extractMetadata = (rows: any[]): Metadata => {
  const meta: Metadata = {
    consultation: "Non spécifié",
    date: "-",
    description: "-",
    buyer: "-",
    requester: "-",
    tva: "20%"
  };

  const limit = Math.min(rows.length, 25);
  for (let i = 0; i < limit; i++) {
    const row = rows[i];
    if (!row) continue;
    
    const rowStr = row.join(" ").toUpperCase();
    
    if (rowStr.includes("CONSULTATION")) meta.consultation = findValueInRow(row, "CONSULTATION") || meta.consultation;
    if (rowStr.includes("DATE")) meta.date = findValueInRow(row, "DATE") || meta.date;
    if (rowStr.includes("DESCRIPTION")) meta.description = findValueInRow(row, "DESCRIPTION") || meta.description;
    if (rowStr.includes("ACHETEUR")) meta.buyer = findValueInRow(row, "ACHETEUR") || meta.buyer;
    if (rowStr.includes("DEMANDEUR")) meta.requester = findValueInRow(row, "DEMANDEUR") || meta.requester;
    
    if (rowStr.includes("TVA")) {
      row.forEach((cell: any) => {
        if (typeof cell === 'number' && cell < 1 && cell > 0) meta.tva = (cell * 100) + "%";
        if (typeof cell === 'string' && cell.includes("%")) meta.tva = cell;
      });
    }
  }
  return meta;
};

const findValueInRow = (row: any[], key: string): string | null => {
  for (let j = 0; j < row.length - 1; j++) {
    if (String(row[j]).toUpperCase().includes(key)) {
      for (let k = j + 1; k < row.length; k++) {
        if (row[k]) return row[k];
      }
    }
  }
  return null;
};

const extractOffers = (rows: any[]): Offer[] => {
  let headerIndex = -1;
  // Look for header row
  for (let i = 0; i < rows.length; i++) {
    if (rows[i] && rows[i][0] && String(rows[i][0]).trim().toLowerCase() === "raison sociale") {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) return [];

  const offers: Offer[] = [];
  // Data starts usually 2 rows after header in AN01 exports
  const dataStartIndex = headerIndex + 2; 

  for (let i = dataStartIndex; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[0]) continue;
    
    const firstCell = String(row[0]).toLowerCase();
    // Stop parsing if we encounter summary rows or user-requested exclusions
    if (firstCell.includes("calcul des gains") || 
        firstCell.includes("moyenne des offres") || 
        firstCell.includes("prix histo") || 
        firstCell.includes("offre retenue")) break;

    let rawAmount = row[7]; // Column H
    let amount = 0;
    
    if (typeof rawAmount === 'number') {
      amount = rawAmount;
    } else if (typeof rawAmount === 'string') {
      amount = parseFloat(rawAmount.replace(/[^0-9,.-]/g, '').replace(',', '.'));
    }

    if (!amount) continue;

    offers.push({
      id: i,
      name: row[0],
      rankFinal: parseInt(row[1]) || 99,
      scoreFinal: round2(parseFloat(row[2]) || 0),
      rankFinancial: parseInt(row[3]) || 99,
      scoreFinancial: round2(parseFloat(row[4]) || 0),
      rankTechnical: parseInt(row[5]) || 99,
      scoreTechnical: round2(parseFloat(row[6]) || 0),
      amountTTC: round2(amount)
    });
  }
  return offers;
};

const calculateStats = (offers: Offer[]): Stats => {
  const validOffers = offers.filter(o => o.amountTTC > 0);
  if (validOffers.length === 0) {
    return { average: 0, max: 0, min: 0, winner: null, savingAmount: 0, savingPercent: 0 };
  }

  const total = validOffers.reduce((sum, o) => sum + o.amountTTC, 0);
  const average = round2(total / validOffers.length);
  
  const winner = validOffers.find(o => o.rankFinal === 1) || validOffers[0];
  const max = Math.max(...validOffers.map(o => o.amountTTC)); // max/min often don't need rounding if inputs are rounded, but okay to leave raw if inputs are rounded
  const min = Math.min(...validOffers.map(o => o.amountTTC));

  const savingAmount = round2(average - winner.amountTTC);
  const savingPercent = round2((savingAmount / average) * 100);

  return { average, max: round2(max), min: round2(min), winner, savingAmount, savingPercent };
};

const extractTechnicalAnalysis = (rows: any[], candidateNames: string[]): CandidateTechnicalAnalysis[] => {
    // 1. Identify Header Row (Assuming E1/Row 0 contains candidate names)
    const headerRow = rows[0]; 
    if (!headerRow) return [];

    let candidateColumnMap: { name: string, colIndex: number }[] = [];
    const sortedCandidateNames = [...candidateNames].sort((a, b) => b.length - a.length);

    headerRow.forEach((cell: any, colIndex: number) => {
        // Skip first 3 columns
        if (colIndex < 3) return;

        if (typeof cell === 'string') {
            const cellVal = cell.trim().toLowerCase();
            const match = sortedCandidateNames.find(c => cellVal.includes(c.toLowerCase()));
            
            if (match) {
                 const exists = candidateColumnMap.find(m => m.name === match);
                 if (!exists) {
                     candidateColumnMap.push({ name: match, colIndex });
                 }
            }
        }
    });

    if (candidateColumnMap.length === 0) return [];

    const results: CandidateTechnicalAnalysis[] = candidateColumnMap.map(c => ({
        candidateName: c.name,
        criteria: []
    }));

    const startIndex = 1;
    const CRITERIA_NAME_COL_INDEX = 2; // Column C
    const MAX_SCORE_COL_INDEX = 1;     // Column B

    for (let i = startIndex; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;

        const criteriaName = row[CRITERIA_NAME_COL_INDEX];
        if (!criteriaName || typeof criteriaName !== 'string') continue;
        const cleanName = criteriaName.trim();
        
        if (cleanName === "" || cleanName.toLowerCase().startsWith("total") || cleanName.toLowerCase().includes("note technique globale")) break;

        const maxScore = row[MAX_SCORE_COL_INDEX];

        results.forEach((res) => {
            const map = candidateColumnMap.find(m => m.name === res.candidateName);
            if (!map) return;

            const scoreCell = row[map.colIndex];
            const commentCell = row[map.colIndex + 1]; 
            let comment = typeof commentCell === 'string' ? commentCell : undefined;

            if (scoreCell !== undefined && scoreCell !== "") {
                 let scoreVal: number | string = scoreCell;
                 
                 // Try to parse and round the score if it's numeric
                 if (typeof scoreCell === 'number') {
                     scoreVal = round2(scoreCell);
                 } else if (typeof scoreCell === 'string') {
                     const parsed = parseFloat(scoreCell.replace(',', '.'));
                     if (!isNaN(parsed)) {
                         scoreVal = round2(parsed);
                     }
                 }

                 res.criteria.push({
                     name: cleanName,
                     score: scoreVal,
                     maxScore: maxScore,
                     comment: comment
                 });
            }
        });
    }

    return results;
};