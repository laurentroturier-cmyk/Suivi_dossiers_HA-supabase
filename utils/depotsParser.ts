import * as pdfjsLib from 'pdfjs-dist';
import { DepotsData, EntrepriseDepot, DepotsProcedureInfo, DepotsStats } from '../types/depots';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Parse un fichier PDF de registre des dépôts
 */
export const parsePdfDepots = async (file: File): Promise<DepotsData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const entreprises: EntrepriseDepot[] = [];
    const allLines: string[] = [];
    
    // Variables pour les informations de procédure
    let auteur = '';
    let objet = '';
    let reference = '';
    let datePublication = '';
    let dateCandidature = '';
    let dateOffre = '';
    let dateExport = '';
    let idEmp = '';
    let totalEnveloppesElectroniques = 0;
    let totalEnveloppesPapier = 0;

    // Lire toutes les pages et collecter les lignes
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      
      // Grouper les éléments de texte par position Y (ligne)
      const lines: Record<number, { x: number; text: string }[]> = {};
      content.items.forEach((item: any) => {
        if ('str' in item && item.str.trim()) {
          const y = Math.round(item.transform[5]);
          const x = Math.round(item.transform[4]);
          if (!lines[y]) {
            lines[y] = [];
          }
          lines[y].push({ x, text: item.str });
        }
      });

      // Trier les lignes par position Y (du haut vers le bas)
      const sortedY = Object.keys(lines).map(Number).sort((a, b) => b - a);
      
      sortedY.forEach(y => {
        // Trier les éléments par position X (gauche à droite)
        const sortedItems = lines[y].sort((a, b) => a.x - b.x);
        const lineText = sortedItems.map(item => item.text).join(' ').trim();
        if (lineText) {
          allLines.push(lineText);
        }
        
        // Extraction des informations d'en-tête
        if (lineText.includes('Auteur de la procédure :')) {
          auteur = lineText.split('Auteur de la procédure :')[1]?.trim() || '';
        }
        if (lineText.includes('Objet du marché :') || lineText.includes('Objet du marche :')) {
          objet = lineText.replace('Objet du marché :', '').replace('Objet du marche :', '').trim();
        }
        if (lineText.includes('Votre référence :')) {
          reference = lineText.split('Votre référence :')[1]?.trim().split(/\s+/)[0] || '';
        } else if (lineText.includes('Référence :') && !reference) {
          reference = lineText.split('Référence :')[1]?.trim().split(/\s+/)[0] || '';
        }
        if (lineText.includes('Date de publication :')) {
          datePublication = lineText.split('Date de publication :')[1]?.trim() || '';
        }
        if (lineText.includes('Date de candidature :')) {
          dateCandidature = lineText.split('Date de candidature :')[1]?.trim() || '';
        }
        if (lineText.includes("Date d'offre :") || lineText.includes('Date offre :')) {
          const match = lineText.match(/Date\s+d'offre\s*:\s*(.+)/i);
          if (match) dateOffre = match[1].trim();
        }
        if (lineText.includes('Date export:') || lineText.includes('Date export :')) {
          const match = lineText.match(/Date export\s*:\s*(.+)/);
          if (match) dateExport = match[1].trim();
        }
        if (lineText.includes('ID EMP :')) {
          idEmp = lineText.split('ID EMP :')[1]?.trim().split(/\s+/)[0] || '';
        }
        if (lineText.includes('Total enveloppes électroniques')) {
          const match = lineText.match(/Total enveloppes électroniques(?:\s+offre)?\s*:\s*(\d+)/i);
          if (match) totalEnveloppesElectroniques = parseInt(match[1]);
        }
        if (lineText.includes('Total enveloppes papier')) {
          const match = lineText.match(/Total enveloppes papier(?:\s+offre)?\s*:\s*(\d+)/i);
          if (match) totalEnveloppesPapier = parseInt(match[1]);
        }
      });
    }

    // Rechercher les entrées du tableau en identifiant le pattern clé:
    // "N Electronique/Papier fichier.crypt" où N est le numéro d'ordre
    // Exemple: "1 Electronique 1067020_offre_1069220_354205.crypt"
    
    const entryIndices: { index: number; ordre: string; mode: string; fichier: string }[] = [];
    
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim();
      // Pattern: numéro + mode + fichier.crypt
      const match = line.match(/^(\d+)\s+(Electronique|Électronique|Papier)\s+(.+\.crypt)/i);
      if (match) {
        entryIndices.push({
          index: i,
          ordre: match[1],
          mode: match[2],
          fichier: match[3]
        });
      }
    }

    // Pour chaque entrée, collecter les données autour
    for (let entryIdx = 0; entryIdx < entryIndices.length; entryIdx++) {
      const entry = entryIndices[entryIdx];
      const currentLineIdx = entry.index;
      
      // Déterminer les bornes de recherche
      const prevEntryIdx = entryIdx > 0 ? entryIndices[entryIdx - 1].index : 0;
      const nextEntryIdx = entryIdx < entryIndices.length - 1 
        ? entryIndices[entryIdx + 1].index 
        : allLines.length;

      const entreprise: EntrepriseDepot = {
        ordre: entry.ordre,
        dateReception: '',
        modeReception: entry.mode,
        societe: '',
        contact: '',
        adresse: '',
        cp: '',
        ville: '',
        telephone: '',
        fax: '',
        email: '',
        observations: '',
        lot: '',
        nomFichier: entry.fichier,
        tailleFichier: ''
      };

      // Chercher dans les lignes AVANT la ligne principale (société, contact, adresse, lot)
      // et les lignes APRÈS (heure, taille, téléphone, fax, email)
      
      // Lignes avant (entre l'entrée précédente et celle-ci)
      const linesBefore = allLines.slice(Math.max(prevEntryIdx + 1, currentLineIdx - 10), currentLineIdx);
      // Lignes après (jusqu'à la prochaine entrée)
      const linesAfter = allLines.slice(currentLineIdx + 1, Math.min(currentLineIdx + 8, nextEntryIdx));

      // Collecter les lignes candidates pour société et contact
      const candidateLines: string[] = [];

      // Parser les lignes AVANT pour société, contact, adresse, lot, date+ville
      for (const line of linesBefore) {
        const trimmed = line.trim();
        
        // Date avec CP/ville mélangés: "12/02/2025 à 02100 - SAINT-QUENTIN"
        const dateVilleMatch = trimmed.match(/^(\d{2}\/\d{2}\/\d{4})\s*à?\s*(\d{5})\s*-\s*(.+)/);
        if (dateVilleMatch) {
          entreprise.dateReception = dateVilleMatch[1];
          entreprise.cp = dateVilleMatch[2];
          entreprise.ville = dateVilleMatch[3].trim();
          continue;
        }

        // Lot: "- Lot unique :" ou "- Lot N :"
        if (trimmed.startsWith('- Lot')) {
          entreprise.lot = trimmed.replace(/^-\s*/, '').replace(/:$/, '').trim();
          continue;
        }

        // Adresse (commence par un numéro, suivi de rue/boulevard/etc)
        if (!entreprise.adresse && trimmed.match(/^\d+[\s,]/) && 
            !trimmed.match(/^\d{5}/) && !trimmed.match(/^\d{2}\/\d{2}/)) {
          entreprise.adresse = trimmed;
          continue;
        }

        // Ignorer les en-têtes de tableau et lignes parasites
        if (trimmed.match(/^Date|^Ordre|^Mode|^Société|^Observations|^Plis|^d'arrivée|^réception|^OFFRE/i)) {
          continue;
        }
        
        // Ignorer les lignes contenant "Total" ou "enveloppes" (lignes de stats)
        if (trimmed.match(/Total|enveloppes|offre:/i)) {
          continue;
        }
        
        // Ignorer les lignes entre parenthèses (tailles de fichiers)
        if (trimmed.match(/^\(.+\)$/)) {
          continue;
        }
        
        // Ignorer les lignes de téléphone/fax/email (appartiennent à l'entrée précédente)
        if (trimmed.match(/^Tél|^Fax|@/i)) {
          continue;
        }
        
        // Ignorer les lignes d'heure seule
        if (trimmed.match(/^\d{2}h\d{2}$/)) {
          continue;
        }

        // Collecter les lignes candidates (nom société ou contact)
        if (trimmed.length > 2 && trimmed.length < 80 && !trimmed.match(/^\d/) && !trimmed.startsWith('-')) {
          candidateLines.push(trimmed);
        }
      }

      // Analyser les candidats pour distinguer société et contact
      // Contact = format "Prénom NOM" (prénom commence par majuscule, reste minuscule, NOM tout en majuscules)
      // Société = tout le reste (acronymes, noms avec points, backslash, etc.)
      
      for (const candidate of candidateLines) {
        // Pattern contact: "Prénom NOM" ou "Prénom NOM NOM"
        // Prénom: commence par majuscule, suivi de minuscules (avec accents possibles)
        // NOM: tout en majuscules (au moins 2 caractères)
        const isContact = /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ]{2,}/.test(candidate) &&
                          !candidate.includes('.') && 
                          !candidate.includes('\\') &&
                          !candidate.includes("'") &&
                          candidate.split(' ').length <= 3;

        if (isContact && !entreprise.contact) {
          entreprise.contact = candidate;
        } else if (!entreprise.societe) {
          entreprise.societe = candidate;
        }
      }

      // Parser les lignes APRÈS pour heure, taille, téléphone, fax, email
      for (const line of linesAfter) {
        const trimmed = line.trim();

        // Heure seule: "12h15"
        if (!entreprise.dateReception.includes('h') && trimmed.match(/^\d{2}h\d{2}$/)) {
          entreprise.dateReception += ` à ${trimmed}`;
          continue;
        }

        // Taille fichier: "(98.2 Mo)"
        const tailleMatch = trimmed.match(/^\((\d+\.?\d*\s*Mo)\)$/);
        if (tailleMatch) {
          entreprise.tailleFichier = tailleMatch[1];
          continue;
        }

        // Téléphone: "Tél.: 0323647230"
        const telMatch = trimmed.match(/^Tél\.?\s*:?\s*([\d\s.]+)/i);
        if (telMatch && telMatch[1].trim()) {
          entreprise.telephone = telMatch[1].replace(/[\s.]/g, '');
          continue;
        }

        // Fax: "Fax: 0372390692" ou "Fax:"
        const faxMatch = trimmed.match(/^Fax\s*:?\s*([\d\s.]*)/i);
        if (faxMatch) {
          entreprise.fax = faxMatch[1] ? faxMatch[1].replace(/[\s.]/g, '') : '';
          continue;
        }

        // Email
        if (trimmed.includes('@')) {
          const emailMatch = trimmed.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) {
            entreprise.email = emailMatch[1].toLowerCase();
          }
        }
      }

      entreprises.push(entreprise);
    }

    const procedureInfo: DepotsProcedureInfo = {
      auteur,
      objet,
      datePublication,
      dateCandidature,
      dateOffre,
      reference,
      idEmp,
      dateExport,
    };

    const stats: DepotsStats = {
      totalEnveloppesElectroniques,
      totalEnveloppesPapier,
    };

    return {
      procedureInfo,
      stats,
      entreprises,
    };
  } catch (error) {
    console.error('Erreur parsing PDF dépôts:', error);
    throw new Error('Erreur lors du parsing du PDF des dépôts');
  }
};

/**
 * Point d'entrée principal pour parser un fichier de dépôts
 */
export const parseDepotsFile = async (file: File): Promise<DepotsData> => {
  const fileName = file.name.toLowerCase();
  
  if (fileName.endsWith('.pdf')) {
    return parsePdfDepots(file);
  }
  
  throw new Error('Format de fichier non supporté. Veuillez fournir un fichier PDF.');
};
