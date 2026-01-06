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
  const anonymes = entreprises.filter(e => 
    !e.email || e.email.trim() === '' || 
    e.societe.toLowerCase().includes('anonyme')
  ).length;

  const procedureInfo: ProcedureInfo = {
    objet: objet || 'Registre des retraits',
    reference: reference || '',
    dateLimit: dateLimit || '',
    idEmp: idEmp || '',
  };

  console.log('Retraits texte chargés:', entreprises.length);
  console.log('Procédure info:', procedureInfo);

  return {
    procedureInfo,
    stats: {
      totalTelecharges,
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
        const anonymes = entreprises.filter(e => 
          e.lots.toLowerCase().includes('pièces communes') || 
          e.lots.toLowerCase().includes('pieces communes')
        ).length;

        // Informations de procédure (à extraire du nom de fichier ou laisser vide)
        const procedureInfo: ProcedureInfo = {
          objet: 'Accord cadre pour la réalisation de travaux d\'entretien et de réparation',
          reference: '25001_ACO_TX-ENTRET-NAT_LMD',
          dateLimit: '11/08/2025 à 18 h 00',
          idEmp: '1100458',
        };

        resolve({
          procedureInfo,
          stats: {
            totalTelecharges,
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
    let dateLimit = '';
    let idEmp = '';
    let totalTelecharges = 0;
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
          reference = lineText.split('Votre référence :')[1]?.split(' ')[0]?.trim() || '';
        }
        if (lineText.includes('Date d\'offre :') || lineText.includes("Date d'offre :")) {
          const match = lineText.match(/(\d{2}\/\d{2}\/\d{4}\s+à\s+\d{2}h\d{2})/);
          if (match) dateLimit = match[1];
        }
        if (lineText.includes('ID EMP :')) {
          idEmp = lineText.split('ID EMP :')[1]?.trim().split(' ')[0] || '';
        }
        if (lineText.includes('Total dce électroniques téléchargés :')) {
          const match = lineText.match(/Total dce électroniques téléchargés\s*:\s*(\d+)/);
          if (match) totalTelecharges = parseInt(match[1]);
        }
        if (lineText.includes('Total dce électroniques téléchargés anonymement')) {
          const match = lineText.match(/Total dce électroniques téléchargés anonymement\s*(\d+)/);
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
    console.log('Stats extraites - Total:', totalTelecharges, 'Anonymes:', anonymes);

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
      objet: objet || 'Mission de MOE pour des travaux de mise en conformité d\'optimisation des postes de livraison HT-BT pour le centre Afpa de Saint-Dizier',
      reference: reference || '25001_MAPA_MOE-CONFORM-HT-BT',
      dateLimit: dateLimit || '13/02/2025 à 12h00',
      idEmp: idEmp || '1067020',
    };

    return {
      procedureInfo,
      stats: {
        totalTelecharges,
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
