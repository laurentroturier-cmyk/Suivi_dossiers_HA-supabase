import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { RetraitsData, EntrepriseRetrait, ProcedureInfo, RetraitsStats } from '../types/retraits';

// Configuration du worker PDF.js depuis node_modules
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Parse un fichier texte tabulé (TSV/TXT) de retraits
 */
const parseTextRetraits = (text: string): RetraitsData => {
  const lines = text.split('\n').map(line => line.trim()).filter(line => line);
  
  if (lines.length < 11) {
    throw new Error('Fichier texte invalide : pas assez de lignes');
  }

  // Extraire les métadonnées des premières lignes (si présentes)
  let objet = '';
  let reference = '';
  let dateLimit = '';
  let idEmp = '';
  let startDataIndex = 0;

  // Chercher l'en-tête du tableau
  for (let i = 0; i < Math.min(15, lines.length); i++) {
    const line = lines[i];
    
    if (line.includes('Objet :') || line.includes('Objet du marché') || line.includes('Objet du marche')) {
      objet = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('Référence :') || line.includes('Reference :') || line.includes('Votre référence')) {
      reference = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('Date offre') || line.includes('Date limite') || line.includes("Date d'offre")) {
      dateLimit = line.split(':')[1]?.trim() || '';
    }
    if (line.includes('ID EMP')) {
      idEmp = line.split(':')[1]?.trim() || '';
    }
    
    // Détecter la ligne d'en-tête (contient "Prénom" ou "Prenom" et "Société")
    if ((line.includes('Prénom') || line.includes('Prenom')) && line.includes('Société')) {
      startDataIndex = i + 1;
      break;
    }
  }

  if (startDataIndex === 0) {
    // Pas d'en-tête trouvé, supposer format simple avec données dès le début
    startDataIndex = 0;
  }

  const entreprises: EntrepriseRetrait[] = [];
  
  for (let i = startDataIndex; i < lines.length; i++) {
    const parts = lines[i].split('\t');
    if (parts.length >= 10) {
      entreprises.push({
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
        typeRetrait: parts[10] || '',
        lots: parts[11] || '',
        intention: parts[12] || '',
        premiereVisite: parts[13] || '',
        derniereVisite: parts[14] || '',
      });
    }
  }

  // Calculer les statistiques
  const totalTelecharges = entreprises.length;
  const totalReprographies = 0; // Non disponible dans format texte
  const anonymes = entreprises.filter(e => 
    !e.email || e.email.trim() === '' || 
    e.societe.toLowerCase().includes('anonyme')
  ).length;

  const procedureInfo: ProcedureInfo = {
    objet: objet || '',
    reference: reference || '',
    datePublication: '',
    dateCandidature: '',
    dateOffre: dateLimit || '',
    idEmp: idEmp || '',
    dateImpression: '',
  };

  console.log('Retraits texte chargés:', entreprises.length);
  console.log('Procédure info:', procedureInfo);

  return {
    procedureInfo,
    stats: {
      totalTelecharges,
      totalReprographies,
      anonymes,
    },
    entreprises,
  };
};

/**
 * Parse un fichier Excel de retraits
 */
export const parseExcelRetraits = async (file: File): Promise<RetraitsData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        
        // Détecter si c'est un fichier texte ou un vrai Excel
        if (typeof data === 'string') {
          // C'est un fichier texte
          const result = parseTextRetraits(data);
          resolve(result);
          return;
        }

        // Sinon, parser comme Excel binaire
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet, { raw: false });

        if (!jsonData || jsonData.length === 0) {
          reject(new Error('Le fichier Excel est vide'));
          return;
        }

        // Parser les entreprises
        const entreprises: EntrepriseRetrait[] = jsonData.map((row) => ({
          prenom: row['Prénom'] || row['Prenom'] || '',
          nom: row['Nom'] || '',
          societe: row['Société'] || row['Societe'] || '',
          siret: row['SIRET'] || '',
          adresse: row['Adresse'] || '',
          cp: row['CP'] || '',
          ville: row['Ville'] || '',
          telephone: row['Téléphone'] || row['Telephone'] || '',
          fax: row['Fax'] || '',
          email: row['E-mail'] || row['Email'] || '',
          typeRetrait: row['Type retrait'] || '',
          lots: row['Lots'] || '',
          intention: row['Intention de réponse'] || row['Intention de reponse'] || '',
          premiereVisite: row['Première visite'] || row['Premiere visite'] || '',
          derniereVisite: row['Dernière visite'] || row['Derniere visite'] || '',
        }));

        // Calculer les statistiques
        const totalTelecharges = entreprises.length;
        const totalReprographies = 0; // Non disponible dans format Excel
        const anonymes = entreprises.filter(e => 
          e.lots.toLowerCase().includes('pièces communes') || 
          e.lots.toLowerCase().includes('pieces communes')
        ).length;

        // Informations de procédure (vides par défaut, à compléter manuellement)
        const procedureInfo: ProcedureInfo = {
          objet: '',
          reference: '',
          datePublication: '',
          dateCandidature: '',
          dateOffre: '',
          idEmp: '',
          dateImpression: '',
        };

        resolve({
          procedureInfo,
          stats: {
            totalTelecharges,
            totalReprographies,
            anonymes,
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
 * Parse un fichier PDF de retraits
 */
export const parsePdfRetraits = async (file: File): Promise<RetraitsData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    const entreprises: EntrepriseRetrait[] = [];
    let fullText = '';
    
    // Variables pour les informations de procédure
    let objet = '';
    let reference = '';
    let datePublication = '';
    let dateCandidature = '';
    let dateOffre = '';
    let idEmp = '';
    let dateImpression = '';
    let totalTelecharges = 0;
    let totalReprographies = 0;
    let anonymes = 0;
    
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
      
      // Parser chaque ligne
      for (const [y, items] of sortedLines) {
        // Trier les items par X (gauche à droite)
        const sortedItems = items.sort((a, b) => a.transform[4] - b.transform[4]);
        const lineText = sortedItems.map(item => item.str).join(' ');
        fullText += lineText + '\n';
        
        // Extraire les informations de l'en-tête
        if (lineText.includes('Objet du marché :')) {
          objet = lineText.replace('Objet du marché :', '').replace('Objet du marché:', '').trim();
        }
        if (lineText.includes('Votre référence :')) {
          reference = lineText.split('Votre référence :')[1]?.trim().split(/\s+/)[0] || '';
        }
        if (lineText.includes('Date de publication :')) {
          datePublication = lineText.split('Date de publication :')[1]?.trim() || '';
        }
        if (lineText.includes('Date de candidature :')) {
          dateCandidature = lineText.split('Date de candidature :')[1]?.trim() || '';
        }
        if (lineText.includes('Date d\'offre :') || lineText.includes("Date d'offre :")) {
          const match = lineText.match(/Date d['']offre\s*:\s*(.+)/);
          if (match) dateOffre = match[1].trim();
        }
        if (lineText.includes('ID EMP :')) {
          idEmp = lineText.split('ID EMP :')[1]?.trim().split(/\s+/)[0] || '';
        }
        if (lineText.includes('Date impression:') || lineText.includes('Date impression :')) {
          const match = lineText.match(/Date impression\s*:\s*(.+)/);
          if (match) dateImpression = match[1].trim();
        }
        if (lineText.includes('Total dce électroniques téléchargés') && lineText.includes(':')) {
          const match = lineText.match(/Total dce électroniques téléchargés\s*:\s*(\d+)/);
          if (match) totalTelecharges = parseInt(match[1]);
        }
        if (lineText.includes('Total dce reprographiés retirés')) {
          const match = lineText.match(/Total dce reprographiés retirés\s*:\s*(\d+)/);
          if (match) totalReprographies = parseInt(match[1]);
        }
        if (lineText.includes('Total dce électroniques téléchargés anonymement')) {
          const match = lineText.match(/Total dce électroniques téléchargés anonymement\s+(\d+)/);
          if (match) anonymes = parseInt(match[1]);
        }
        
        // Détecter si c'est une ligne de données (contient un email)
        const emailMatch = lineText.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
        
        if (emailMatch) {
          const email = emailMatch[0];
          
          // Extraire les données de la ligne
          const parts = lineText.split(/\s{2,}/); // Split sur 2+ espaces
          
          entreprises.push({
            prenom: '',
            nom: parts[0] || '',
            societe: parts[1] || '',
            siret: '',
            adresse: parts[2] || '',
            cp: '',
            ville: '',
            telephone: parts[3] || '',
            fax: '',
            email: email,
            typeRetrait: lineText.includes('Electronique') ? 'Electronique' : 'Papier',
            lots: lineText.includes('Pièces communes') ? 'Pièces communes' : 
                  lineText.includes('Dossier complet') ? 'Dossier complet téléchargé' : 
                  'Pièces communes',
            intention: lineText.includes('NC') ? 'NC' : 
                      lineText.includes('Oui') ? 'Oui' : 
                      lineText.includes('Non') ? 'Non' : 'NC',
            premiereVisite: parts[parts.length - 2] || '',
            derniereVisite: parts[parts.length - 1] || '',
          });
        }
      }
    }

    console.log('Entreprises extraites du PDF:', entreprises.length);
    console.log('Stats extraites - Total téléchargés:', totalTelecharges, 'Reprographiés:', totalReprographies, 'Anonymes:', anonymes);

    if (entreprises.length === 0) {
      throw new Error('Aucune donnée d\'entreprise détectée dans le PDF. Veuillez utiliser un fichier Excel.');
    }

    // Si les stats n'ont pas été extraites, les calculer
    if (totalTelecharges === 0) {
      totalTelecharges = entreprises.length;
    }
    if (anonymes === 0) {
      anonymes = entreprises.filter(e => 
        e.lots.toLowerCase().includes('pièces communes') || 
        e.lots.toLowerCase().includes('pieces communes')
      ).length;
    }

    // Informations de procédure
    const procedureInfo: ProcedureInfo = {
      objet: objet || '',
      reference: reference || '',
      datePublication: datePublication || '',
      dateCandidature: dateCandidature || '',
      dateOffre: dateOffre || '',
      idEmp: idEmp || '',
      dateImpression: dateImpression || '',
    };

    console.log('Informations extraites du PDF Retraits:');
    console.log('- Objet:', objet || '(non trouvé)');
    console.log('- Référence:', reference || '(non trouvé)');
    console.log('- Date publication:', datePublication || '(non trouvé)');
    console.log('- Date candidature:', dateCandidature || '(non trouvé)');
    console.log('- Date offre:', dateOffre || '(non trouvé)');
    console.log('- ID EMP:', idEmp || '(non trouvé)');
    console.log('- Date impression:', dateImpression || '(non trouvé)');

    return {
      procedureInfo,
      stats: {
        totalTelecharges,
        totalReprographies,
        anonymes,
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
export const parseRetraitsFile = async (file: File): Promise<RetraitsData> => {
  const extension = file.name.split('.').pop()?.toLowerCase();

  if (extension === 'pdf') {
    return parsePdfRetraits(file);
  } else if (extension === 'xls' || extension === 'xlsx') {
    return parseExcelRetraits(file);
  } else {
    throw new Error('Format de fichier non supporté. Utilisez .pdf, .xls ou .xlsx');
  }
};
