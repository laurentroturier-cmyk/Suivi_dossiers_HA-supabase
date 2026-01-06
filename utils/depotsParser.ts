import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { DepotsData, EntrepriseDepot, DepotsProcedureInfo, DepotsStats } from '../types/depots';

// Configuration du worker PDF.js depuis node_modules
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Parse un fichier texte tabulé (TSV/TXT)
 */
const parseTextDepots = (text: string): DepotsData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 11) {
    throw new Error('Fichier texte invalide : pas assez de lignes');
  }

  // Extraire les métadonnées des premières lignes
  const prenomAuteur = lines[0].replace('Prenom : ', '').replace('Prénom : ', '').trim();
  const nomAuteur = lines[1].replace('Nom : ', '').trim();
  const objet = lines[2].replace('Objet : ', '').trim();
  const reference = lines[3].replace('Référence : ', '').replace('Reference : ', '').trim();
  const datePublication = lines[4].replace('Date de publication :', '').replace('Date de publication : ', '').trim();
  const dateCandidature = lines[5].replace('Date de candidature :', '').replace('Date de candidature : ', '').trim();
  const dateOffre = lines[6].replace('Date offre :', '').replace('Date offre : ', '').trim();
  const dateExport = lines[7].replace('Date export:', '').replace('Date export : ', '').trim();

  // Ligne 9 (index 8) est vide
  // Ligne 10 (index 9) contient les en-têtes - on peut la sauter
  // Les données commencent à la ligne 11 (index 10)
  
  const entreprises: EntrepriseDepot[] = [];
  
  for (let i = 10; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 19) {
      entreprises.push({
        ordre: String(i - 9),
        prenom: parts[0] || '',
        nom: parts[1] || '',
        societe: parts[2] || '',
        siret: parts[3] || '',
        email: parts[4] || '',
        adresse: parts[5] || '',
        cp: parts[6] || '',
        ville: parts[7] || '',
        telephone: parts[8] || '',
        fax: parts[9] || '',
        dateReception: parts[10] || '',
        modeReception: parts[11] || '',
        naturePli: parts[12] || '',
        nomFichier: parts[13] || '',
        taille: parts[14] || '',
        lot: parts[15] || '',
        observations: parts[16] || '',
        copieSauvegarde: parts[17] || '',
        horsDelai: parts[18] || '',
      });
    }
  }

  // Calculer les statistiques
  const totalEnveloppesElectroniques = entreprises.filter(e => 
    e.modeReception.toLowerCase().includes('electronique')
  ).length;
  const totalEnveloppesPapier = entreprises.filter(e => 
    e.modeReception.toLowerCase().includes('papier')
  ).length;

  // Informations de procédure extraites du fichier
  const procedureInfo: DepotsProcedureInfo = {
    auteur: prenomAuteur && nomAuteur ? `${prenomAuteur} ${nomAuteur}` : '',
    objet: objet || '',
    reference: reference || '',
    datePublication: datePublication,
    dateCandidature: dateCandidature,
    dateOffre: dateOffre || '',
    dateExport: dateExport || new Date().toLocaleDateString('fr-FR'),
    idEmp: '',
  };

  console.log('Dépôts texte chargés:', entreprises.length);
  console.log('Procédure info:', procedureInfo);

  return {
    procedureInfo,
    stats: {
      totalEnveloppesElectroniques,
      totalEnveloppesPapier,
    },
    entreprises,
  };
};

/**
 * Parse un fichier Excel de dépôts
 */
export const parseExcelDepots = async (file: File): Promise<DepotsData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        // Détecter si c'est un fichier texte ou un vrai Excel
        if (typeof data === 'string') {
          // C'est un fichier texte
          const result = parseTextDepots(data);
          resolve(result);
          return;
        }

        // Sinon, parser comme Excel binaire
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Extraire les métadonnées des premières lignes
        const getCell = (cell: string) => {
          const cellValue = firstSheet[cell];
          return cellValue ? String(cellValue.v || cellValue.w || '') : '';
        };

        // Lire les informations d'en-tête (lignes 1-8)
        const prenomAuteur = getCell('A1').replace('Prenom : ', '').replace('Prénom : ', '').trim();
        const nomAuteur = getCell('A2').replace('Nom : ', '').trim();
        const objet = getCell('A3').replace('Objet : ', '').trim();
        const reference = getCell('A4').replace('Référence : ', '').replace('Reference : ', '').trim();
        const datePublication = getCell('A5').replace('Date de publication :', '').replace('Date de publication : ', '').trim();
        const dateCandidature = getCell('A6').replace('Date de candidature :', '').replace('Date de candidature : ', '').trim();
        const dateOffre = getCell('A7').replace('Date offre :', '').replace('Date offre : ', '').trim();
        const dateExport = getCell('A8').replace('Date export:', '').replace('Date export : ', '').trim();

        // Parser les données du tableau (à partir de la ligne 10)
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { 
          raw: false,
          range: 9 // Commence à la ligne 10 (index 9)
        });

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Le fichier Excel est vide'));
          return;
        }

        // Parser les entreprises
        const entreprises: EntrepriseDepot[] = jsonData.map((row, index) => ({
          ordre: String(index + 1),
          prenom: row['Prénom'] || row['Prenom'] || '',
          nom: row['Nom'] || '',
          societe: row['Société'] || row['Societe'] || '',
          siret: row['SIRET'] || '',
          email: row['E-mail'] || row['Email'] || '',
          adresse: row['Adresse'] || '',
          cp: row['CP'] || '',
          ville: row['Ville'] || '',
          telephone: row['Téléphone'] || row['Telephone'] || '',
          fax: row['Fax'] || '',
          dateReception: row['Date de réception du pli'] || row['Date de reception du pli'] || row['Date de réce'] || '',
          modeReception: row['Mode de réception du pli'] || row['Mode de reception du pli'] || row['Mode de réce'] || '',
          naturePli: row['Nature du pli'] || row['Nature du pl'] || '',
          nomFichier: row['Nom du fichier'] || row['Nom du fichi'] || '',
          taille: row['Taille'] || '',
          lot: row['Lot'] || '',
          observations: row['Observations'] || row['Observation'] || '',
          copieSauvegarde: row['Copie de sauvegarde'] || row['Copie de sau'] || '',
          horsDelai: row['Hors délai'] || row['Hors delai'] || row['Hors délai'] || '',
        }));

        // Calculer les statistiques
        const totalEnveloppesElectroniques = entreprises.filter(e => 
          e.modeReception.toLowerCase().includes('electronique')
        ).length;
        const totalEnveloppesPapier = entreprises.filter(e => 
          e.modeReception.toLowerCase().includes('papier')
        ).length;

        // Informations de procédure extraites du fichier
        const procedureInfo: DepotsProcedureInfo = {
          auteur: prenomAuteur && nomAuteur ? `${prenomAuteur} ${nomAuteur}` : '',
          objet: objet || '',
          reference: reference || '',
          datePublication: datePublication,
          dateCandidature: dateCandidature,
          dateOffre: dateOffre || '',
          dateExport: dateExport || new Date().toLocaleDateString('fr-FR'),
          idEmp: '',
        };

        console.log('Dépôts Excel chargés:', entreprises.length);
        console.log('Procédure info:', procedureInfo);

        resolve({
          procedureInfo,
          stats: {
            totalEnveloppesElectroniques,
            totalEnveloppesPapier,
          },
          entreprises,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Erreur lors de la lecture du fichier'));
    
    // Essayer de lire comme texte d'abord
    reader.readAsText(file, 'UTF-8');
  });
};

/**
 * Parse un fichier PDF de dépôts
 */
export const parsePdfDepots = async (file: File): Promise<DepotsData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const entreprises: EntrepriseDepot[] = [];
    let fullText = '';
    
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
    
    // Extraire le texte de toutes les pages avec positions
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Grouper les items par ligne (même Y)
      const lineMap = new Map<number, any[]>();
      
      textContent.items.forEach((item: any) => {
        const y = Math.round(item.transform[5]);
        if (!lineMap.has(y)) {
          lineMap.set(y, []);
        }
        lineMap.get(y)!.push(item);
      });
      
      // Trier les lignes par Y (haut en bas)
      const sortedLines = Array.from(lineMap.entries())
        .sort((a, b) => b[0] - a[0]);
      
      let ordre = 1;
      
      // Parser chaque ligne
      for (const [y, items] of sortedLines) {
        const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = sortedItems.map(item => item.str).join(' ');
        fullText += lineText + '\n';
        
        // Extraire les informations de l'en-tête
        if (lineText.includes('Auteur de la procédure :')) {
          auteur = lineText.split('Auteur de la procédure :')[1]?.trim() || '';
        }
        if (lineText.includes('Objet du marché :')) {
          objet = lineText.replace('Objet du marché :', '').replace('Objet du marche :', '').trim();
        }
        if (lineText.includes('Référence :') || lineText.includes('Reference :')) {
          reference = lineText.split(/Référence :|Reference :/)[1]?.trim().split(' ')[0] || '';
        }
        if (lineText.includes('Date de publication :')) {
          datePublication = lineText.split('Date de publication :')[1]?.trim() || '';
        }
        if (lineText.includes('Date de candidature :')) {
          dateCandidature = lineText.split('Date de candidature :')[1]?.trim() || '';
        }
        if (lineText.includes('Date offre :')) {
          const match = lineText.match(/Date offre\s*:\s*(.+)/);
          if (match) dateOffre = match[1].trim();
        }
        if (lineText.includes('Date export:')) {
          dateExport = lineText.split('Date export:')[1]?.trim() || '';
        }
        if (lineText.includes('ID EMP :')) {
          idEmp = lineText.split('ID EMP :')[1]?.trim().split(' ')[0] || '';
        }
        if (lineText.includes('Total enveloppes électroniques offre :')) {
          const match = lineText.match(/Total enveloppes électroniques offre\s*:\s*(\d+)/);
          if (match) totalEnveloppesElectroniques = parseInt(match[1]);
        }
        if (lineText.includes('Total enveloppes papier offre :')) {
          const match = lineText.match(/Total enveloppes papier offre\s*:\s*(\d+)/);
          if (match) totalEnveloppesPapier = parseInt(match[1]);
        }
        
        // Détecter si c'est une ligne de données (contient un email ou SIRET)
        const emailMatch = lineText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
        
        if (emailMatch) {
          const email = emailMatch[0];
          const parts = lineText.split(/\s{2,}/);
          
          entreprises.push({
            ordre: String(ordre++),
            prenom: '',
            nom: parts[0] || '',
            societe: parts[1] || '',
            siret: parts[2] || '',
            email: email,
            adresse: parts[3] || '',
            cp: parts[4] || '',
            ville: parts[5] || '',
            telephone: parts[6] || '',
            fax: parts[7] || '',
            dateReception: '',
            modeReception: lineText.includes('Electronique') ? 'Electronique' : 'Papier',
            naturePli: lineText.includes('Offre') ? 'Offre' : '',
            nomFichier: '',
            taille: '',
            lot: '',
            observations: '',
            copieSauvegarde: '',
            horsDelai: lineText.toLowerCase().includes('non') ? 'non' : '',
          });
        }
      }
    }

    console.log('Dépôts extraits du PDF:', entreprises.length);
    console.log('Stats extraites - Électroniques:', totalEnveloppesElectroniques, 'Papier:', totalEnveloppesPapier);

    if (entreprises.length === 0) {
      throw new Error('Aucune donnée de dépôt détectée dans le PDF. Veuillez utiliser un fichier Excel.');
    }

    // Si les stats n'ont pas été extraites, les calculer
    if (totalEnveloppesElectroniques === 0 && totalEnveloppesPapier === 0) {
      totalEnveloppesElectroniques = entreprises.filter(e => 
        e.modeReception.toLowerCase().includes('electronique')
      ).length;
      totalEnveloppesPapier = entreprises.filter(e => 
        e.modeReception.toLowerCase().includes('papier')
      ).length;
    }

    const procedureInfo: DepotsProcedureInfo = {
      auteur: auteur || '',
      objet: objet || '',
      reference: reference || '',
      datePublication: datePublication,
      dateCandidature: dateCandidature,
      dateOffre: dateOffre || '',
      dateExport: dateExport || new Date().toLocaleDateString('fr-FR'),
      idEmp: idEmp || '',
    };

    console.log('Informations extraites du PDF Dépôts:');
    console.log('- Auteur:', auteur || '(non trouvé)');
    console.log('- Objet:', objet || '(non trouvé)');
    console.log('- Référence:', reference || '(non trouvé)');
    console.log('- Date offre:', dateOffre || '(non trouvé)');
    console.log('- ID EMP:', idEmp || '(non trouvé)');

    return {
      procedureInfo,
      stats: {
        totalEnveloppesElectroniques,
        totalEnveloppesPapier,
      },
      entreprises,
    };
  } catch (error) {
    console.error('Erreur PDF:', error);
    throw new Error(`Erreur lors de la lecture du PDF: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};

/**
 * Parser universel : détecte automatiquement le type de fichier et utilise le bon parser
 */
export const parseDepotsFile = async (file: File): Promise<DepotsData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return parsePdfDepots(file);
  } else if (extension === 'xls' || extension === 'xlsx' || extension === 'txt') {
    return parseExcelDepots(file);
  } else {
    throw new Error('Format de fichier non supporté. Utilisez .pdf, .xls, .xlsx ou .txt');
  }
};
