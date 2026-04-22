import * as pdfjsLib from 'pdfjs-dist';
import * as XLSX from 'xlsx';
import { DepotsData, EntrepriseDepot, DepotsProcedureInfo, DepotsStats } from '../types/depots';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

/**
 * Parse un fichier Excel de registre des dépôts
 */
export const parseExcelDepots = async (file: File): Promise<DepotsData> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Prendre la première feuille
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convertir en JSON avec les cellules brutes
    const rawData: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
    
    // Variables pour les informations de procédure (en-tête)
    let auteur = '';
    let prenom = '';
    let nom = '';
    let objet = '';
    let reference = '';
    let datePublication = '';
    let dateCandidature = '';
    let dateOffre = '';
    let dateExport = '';
    
    // Extraire les informations d'en-tête (premières lignes avant le tableau)
    // Format attendu : "Label : Valeur" ou ligne avec 2 colonnes ["Label", "Valeur"]
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;
      
      // Cas 1: Ligne avec une seule cellule contenant "Label : Valeur"
      if (row.length === 1 || (row.length > 1 && !row[1])) {
        const cellContent = String(row[0] || '').trim();
        if (cellContent.includes(':')) {
          const [label, ...valueParts] = cellContent.split(':');
          const labelLower = label.trim().toLowerCase();
          const value = valueParts.join(':').trim();
          
          if (labelLower.includes('prenom') || labelLower.includes('prénom')) {
            prenom = value;
          } else if (labelLower === 'nom') {
            nom = value;
          } else if (labelLower.includes('objet')) {
            objet = value;
          } else if (labelLower.includes('référence') || labelLower.includes('reference')) {
            reference = value;
          } else if (labelLower.includes('date de publication')) {
            datePublication = value;
          } else if (labelLower.includes('date de candidature')) {
            dateCandidature = value;
          } else if (labelLower.includes('date offre') || labelLower.includes("date d'offre")) {
            dateOffre = value;
          } else if (labelLower.includes('date export')) {
            dateExport = value;
          }
        }
        continue;
      }
      
      // Cas 2: Ligne avec 2 colonnes ou plus ["Label", "Valeur"]
      const firstCell = String(row[0] || '').trim();
      const secondCell = String(row[1] || '').trim();
      
      if (!firstCell) continue;
      
      // Nettoyer le label (enlever les : en fin)
      const labelClean = firstCell.replace(/\s*:\s*$/, '').toLowerCase();
      
      if (labelClean.includes('prenom') || labelClean.includes('prénom')) {
        prenom = secondCell;
      } else if (labelClean === 'nom') {
        nom = secondCell;
      } else if (labelClean.includes('objet')) {
        objet = secondCell;
      } else if (labelClean.includes('référence') || labelClean.includes('reference') || labelClean.includes('réf')) {
        reference = secondCell;
      } else if (labelClean.includes('date de publication')) {
        datePublication = secondCell;
      } else if (labelClean.includes('date de candidature')) {
        dateCandidature = secondCell;
      } else if (labelClean.includes('date offre') || labelClean.includes("date d'offre") || labelClean.includes('date de remise')) {
        dateOffre = secondCell;
      } else if (labelClean.includes('date export')) {
        dateExport = secondCell;
      }
    }
    
    // Construire le nom de l'auteur
    if (prenom && nom) {
      auteur = `${prenom} ${nom}`;
    } else if (nom) {
      auteur = nom;
    } else if (prenom) {
      auteur = prenom;
    }
    
    // Trouver l'index de la ligne d'en-tête du tableau (avec les colonnes)
    // Chercher la ligne qui contient "Prénom" ENTRE GUILLEMETS ou comme première cellule d'un tableau
    let headerIndex = -1;
    for (let i = 0; i < rawData.length; i++) {
      const row = rawData[i];
      if (row && row.length > 5) {
        // Chercher si la ligne contient les en-têtes typiques entre guillemets
        const firstCellStr = String(row[0] || '').trim();
        const secondCellStr = String(row[1] || '').trim();
        
        console.log(`Ligne ${i}: [0]="${firstCellStr}" [1]="${secondCellStr}"`);
        
        // Cas 1: "Prénom" ou Prénom (avec ou sans guillemets)
        if (firstCellStr.toLowerCase().replace(/["']/g, '') === 'prénom' || 
            firstCellStr.toLowerCase().replace(/["']/g, '') === 'prenom') {
          headerIndex = i;
          console.log(`Header trouvé à la ligne ${i}`);
          break;
        }
      }
    }
    
    if (headerIndex === -1) {
      throw new Error('En-tête du tableau non trouvée dans le fichier Excel');
    }
    
    // Extraire les colonnes
    const headers = rawData[headerIndex].map((h: any) => String(h || '').trim());
    
    // Debug: vérifier les en-têtes
    console.log('Headers bruts:', headers);
    
    // Nettoyer les en-têtes (enlever guillemets, accents)
    const cleanHeaders = headers.map(h => 
      h.replace(/^["']|["']$/g, '') // Enlever guillemets au début/fin
       .normalize('NFD')
       .replace(/[\u0300-\u036f]/g, '') // Enlever accents
       .toLowerCase()
       .trim()
    );
    
    console.log('Headers nettoyés:', cleanHeaders);
    
    // Mapper les index des colonnes - ordre standard des exports e-marchespublics
    const colIndexes = {
      prenom: 0,
      nom: 1,
      societe: 2,
      siret: 3,
      email: 4,
      adresse: 5,
      cp: 6,
      ville: 7,
      telephone: 8,
      fax: 9,
      dateReception: 10,
      modeReception: 11,
      naturePli: 12,
      nomFichier: 13,
      taille: 14,
      lot: 15,
      observations: 16,
      horsDelai: 18, // Index 17 est "Copie de sauvegarde", 18 est "Hors délai"
    };
    
    console.log('Column indexes (positions fixes):', colIndexes);
    
    // Parser les entreprises
    const entreprises: EntrepriseDepot[] = [];
    let totalEnveloppesElectroniques = 0;
    let totalEnveloppesPapier = 0;
    
    for (let i = headerIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length < 3) continue;
      
      // Fonction utilitaire pour récupérer la valeur d'une cellule
      const getCell = (index: number): string => {
        if (index < 0 || index >= row.length) return '';
        const val = row[index];
        if (val === null || val === undefined) return '';
        return String(val).trim();
      };
      
      // Récupérer les champs principaux
      const prenomVal = getCell(colIndexes.prenom);
      const nomVal = getCell(colIndexes.nom);
      const societeVal = getCell(colIndexes.societe);
      
      // Debug première ligne seulement
      if (i === headerIndex + 1) {
        console.log('Première ligne de données:');
        console.log('  Prénom (index', colIndexes.prenom, '):', prenomVal);
        console.log('  Nom (index', colIndexes.nom, '):', nomVal);
        console.log('  Société (index', colIndexes.societe, '):', societeVal);
      }
      
      // Vérifier si la ligne contient des données valides
      if (!prenomVal && !nomVal && !societeVal) continue;
      
      // Construire le contact
      const contact = [prenomVal, nomVal].filter(Boolean).join(' ');
      
      // Récupérer tous les autres champs
      const siret = getCell(colIndexes.siret);
      const email = getCell(colIndexes.email).toLowerCase();
      const adresse = getCell(colIndexes.adresse);
      const codePostal = getCell(colIndexes.cp);
      const ville = getCell(colIndexes.ville);
      const telephoneRaw = getCell(colIndexes.telephone);
      const faxRaw = getCell(colIndexes.fax);
      let dateReceptionRaw = getCell(colIndexes.dateReception);
      const modeReception = getCell(colIndexes.modeReception);
      const naturePli = getCell(colIndexes.naturePli);
      const nomFichier = getCell(colIndexes.nomFichier);
      let taille = getCell(colIndexes.taille);
      const lot = getCell(colIndexes.lot);
      const observations = getCell(colIndexes.observations);
      const horsDelaiStr = getCell(colIndexes.horsDelai).toLowerCase();
      
      // Nettoyer les téléphones
      const telephone = telephoneRaw.replace(/[\s.]/g, '');
      const fax = faxRaw.replace(/[\s.]/g, '');
      
      // Extraire date et heure de réception
      let dateReception = dateReceptionRaw;
      let heureReception = '';
      
      if (dateReceptionRaw.includes('à')) {
        const parts = dateReceptionRaw.split('à');
        dateReception = parts[0].trim();
        heureReception = parts.slice(1).join('à').trim();
      } else if (dateReceptionRaw.includes(' ')) {
        // Format alternatif : "19/09/2025 15h51"
        const parts = dateReceptionRaw.split(' ');
        if (parts.length >= 2 && /\d+h\d+/.test(parts[1])) {
          dateReception = parts[0].trim();
          heureReception = parts.slice(1).join(' ').trim();
        }
      }
      
      // Formater la taille si besoin
      if (taille && !taille.toLowerCase().includes('ko') && !taille.toLowerCase().includes('mo')) {
        const tailleNum = parseFloat(taille.replace(',', '.'));
        if (!isNaN(tailleNum)) {
          taille = `${Math.round(tailleNum)}Ko`;
        }
      }
      
      // Créer l'objet entreprise
      const entreprise: EntrepriseDepot = {
        contact: contact || 'Non renseigné',
        societe: societeVal || 'Non renseigné',
        siret,
        email,
        adresse,
        codePostal,
        ville,
        telephone,
        fax,
        dateReception,
        heureReception,
        modeReception: modeReception || 'Électronique',
        naturePli: naturePli || 'Offre',
        nomFichier,
        tailleFichier: taille,
        lot: lot || 'Lot unique',
        observations,
        horsDelai: horsDelaiStr === 'oui' || horsDelaiStr === 'true' || horsDelaiStr === '1',
      };
      
      // Compter les enveloppes selon le mode de réception
      const modeLower = modeReception.toLowerCase();
      if (modeLower.includes('électronique') || modeLower.includes('electronique') || modeLower === 'electronique') {
        totalEnveloppesElectroniques++;
      } else if (modeLower.includes('papier')) {
        totalEnveloppesPapier++;
      } else {
        // Par défaut, considérer comme électronique
        totalEnveloppesElectroniques++;
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
      idEmp: '',
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
    console.error('Erreur parsing Excel dépôts:', error);
    throw new Error('Erreur lors du parsing du fichier Excel des dépôts: ' + (error instanceof Error ? error.message : 'Erreur inconnue'));
  }
};

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

    // ─── Identifier les entrées par fichier .crypt ─────────────────────────────
    const entryIndices: { index: number; ordre: string; mode: string; fichier: string }[] = [];

    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i].trim();

      // Toute ligne contenant un .crypt est une entrée candidate
      const cryptMatch = line.match(/(\S+\.crypt\b)/i);
      if (!cryptMatch) continue;

      const fichier = cryptMatch[1];
      let ordre = '';
      let mode = '';

      // Chercher ordre et mode sur la ligne courante d'abord (format le plus courant)
      // Accepte du contenu quelconque entre le mode et le fichier (ex: "CEDEX 1")
      const lineOrdreMode = line.match(/^(\d{1,2})\s+(Electronique|Électronique|Papier)\b/i);
      if (lineOrdreMode) {
        ordre = lineOrdreMode[1];
        mode  = lineOrdreMode[2];
      }

      // Sinon chercher dans les lignes adjacentes (±3)
      if (!ordre || !mode) {
        const wStart = Math.max(0, i - 3);
        const wEnd   = Math.min(allLines.length - 1, i + 3);
        for (let j = wStart; j <= wEnd; j++) {
          const adj = allLines[j].trim();
          if (!ordre) {
            if (/^\d{1,2}$/.test(adj)) {
              ordre = adj;
            } else {
              const m = adj.match(/^(\d{1,2})\s+(Electronique|Électronique|Papier)\b/i);
              if (m) { ordre = m[1]; mode = mode || m[2]; }
            }
          }
          if (!mode) {
            if (/(^|\s)(Electronique|Électronique)(\s|$)/i.test(adj)) mode = 'Electronique';
            else if (/(^|\s)Papier(\s|$)/i.test(adj)) mode = 'Papier';
          }
        }
      }

      if (!ordre && !mode) continue;

      entryIndices.push({
        index: i,
        ordre: ordre || String(entryIndices.length + 1),
        mode:  mode  || 'Electronique',
        fichier,
      });
    }

    // ─── Extraire les données autour de chaque entrée ──────────────────────────
    for (let entryIdx = 0; entryIdx < entryIndices.length; entryIdx++) {
      const entry          = entryIndices[entryIdx];
      const currentLineIdx = entry.index;
      const prevAnchor     = entryIdx > 0 ? entryIndices[entryIdx - 1].index : 0;
      const nextAnchor     = entryIdx < entryIndices.length - 1
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
        tailleFichier: '',
      };

      const linesBefore = allLines.slice(Math.max(prevAnchor + 1, currentLineIdx - 20), currentLineIdx);
      const linesAfter  = allLines.slice(currentLineIdx + 1, Math.min(currentLineIdx + 15, nextAnchor));

      const candidateLines: string[] = [];

      for (const line of linesBefore) {
        const t = line.trim();

        // ── 1. Date + CP + ville sur la même ligne: "30/03/2026 à 63200 - MOZAC"
        const dateVilleMatch = t.match(/^(\d{2}\/\d{2}\/\d{4})\s*(?:à\s+)?(\d{5})\s*[-–]\s*(.+)/);
        if (dateVilleMatch && !entreprise.dateReception) {
          entreprise.dateReception = dateVilleMatch[1];
          if (!entreprise.cp)   entreprise.cp   = dateVilleMatch[2];
          if (!entreprise.ville) entreprise.ville = dateVilleMatch[3].trim();
          continue;
        }

        // ── 2. Date seule ou partielle: "27/03/2026 à" ou "27/03/2026 à 10h35"
        const dateOnlyMatch = t.match(/^(\d{2}\/\d{2}\/\d{4})(?:\s+à\s*(\d{2}h\d{2})?)?$/);
        if (dateOnlyMatch && !entreprise.dateReception) {
          entreprise.dateReception = dateOnlyMatch[1];
          if (dateOnlyMatch[2]) entreprise.dateReception += ` à ${dateOnlyMatch[2]}`;
          continue;
        }

        // ── 3. CP + ville + lot: "63037 - CLERMONT FERRAND - Lot unique :"
        //    (layout PDF: colonne Société et colonne Observations fusionnées sur la même ligne)
        const cpCityLotMatch = t.match(/^(\d{5})\s*[-–]\s*(.+?)\s+[-–]\s+(Lot\s+.+?)(?:\s*:)?\s*$/i);
        if (cpCityLotMatch && !entreprise.cp) {
          entreprise.cp   = cpCityLotMatch[1];
          entreprise.ville = cpCityLotMatch[2].trim();
          if (!entreprise.lot) entreprise.lot = cpCityLotMatch[3].trim();
          continue;
        }

        // ── 4. CP + ville seuls: "63200 - MOZAC" ou "63037 - CLERMONT FERRAND CEDEX 1"
        const cpCityMatch = t.match(/^(\d{5})\s*[-–]\s*(.+)$/);
        if (cpCityMatch && !entreprise.cp) {
          entreprise.cp    = cpCityMatch[1];
          entreprise.ville = cpCityMatch[2].trim();
          continue;
        }

        // ── 5. Lot seul: "- Lot unique :" ou "– Lot 2 :"
        if (/^[-–]\s*Lot\s+/i.test(t)) {
          if (!entreprise.lot)
            entreprise.lot = t.replace(/^[-–]\s*/, '').replace(/\s*:$/, '').trim();
          continue;
        }

        // ── 6. Adresse (commence par numéro, pas un CP, pas une date)
        if (!entreprise.adresse &&
            /^\d+[\s,]/.test(t) &&
            !/^\d{5}/.test(t) &&
            !/^\d{2}\/\d{2}/.test(t)) {
          entreprise.adresse = t;
          continue;
        }

        // ── 7. Filtres négatifs — lignes parasites à ignorer
        if (/^(Date|Ordre|Mode|Société|Observations|Plis|d'arrivée|réception|OFFRE|REGISTRE)/i.test(t)) continue;
        if (/^(Auteur|Objet|Votre|ID\s+EMP)/i.test(t)) continue;
        if (/Total|enveloppes/i.test(t)) continue;
        if (/^\(.+\)$/.test(t)) continue;
        if (/^(Tél|Fax)/i.test(t) || t.includes('@')) continue;
        if (/^\d{2}h\d{2}$/.test(t)) continue;

        // ── 8. Candidat société / contact
        if (t.length > 2 && t.length < 80 && !/^\d/.test(t) && !t.startsWith('-')) {
          candidateLines.push(t);
        }
      }

      // ── Distinguer société et contact ────────────────────────────────────────
      // Contact = "Prénom NOM" (prénom mixed-case, nom tout en majuscules)
      // Société = tout le reste
      for (const candidate of candidateLines) {
        // Supprimer le préfixe "Entreprise" avant le test
        const stripped = candidate.replace(/^Entreprise\s+/i, '').trim();

        // Pattern: "Prénom NOM" ou "Prénom-Prénom NOM" (avec traits d'union possibles)
        const isContact =
          /^[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+(?:[-\s][A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ][a-zàâäéèêëïîôùûüç]+)?\s+[A-ZÀÂÄÉÈÊËÏÎÔÙÛÜÇ\-]{2,}/.test(stripped) &&
          !stripped.includes('.') &&
          !stripped.includes('\\') &&
          stripped.split(/\s+/).length <= 4;

        if (isContact && !entreprise.contact) {
          entreprise.contact = stripped;
        } else if (!entreprise.societe) {
          entreprise.societe = stripped;
        }
      }

      // ── Parser les lignes APRÈS (heure, taille, tel, fax, email) ─────────────
      for (const line of linesAfter) {
        const t = line.trim();

        // Heure seule "10h35" — compléter la date seulement si elle existe déjà
        if (/^\d{2}h\d{2}$/.test(t) && entreprise.dateReception && !entreprise.dateReception.includes('h')) {
          entreprise.dateReception += ` à ${t}`;
          continue;
        }

        // Taille fichier: "(6.6 Mo)" ou "(98 Ko)"
        const tailleMatch = t.match(/^\((\d+\.?\d*\s*(?:Mo|Ko|MB|KB|GB))\)$/i);
        if (tailleMatch) {
          entreprise.tailleFichier = tailleMatch[1];
          continue;
        }

        // Téléphone: "Tél.: 0473983250"
        const telMatch = t.match(/^Tél\.?\s*:?\s*([\d\s.+()\-]+)/i);
        if (telMatch && telMatch[1].trim()) {
          entreprise.telephone = telMatch[1].replace(/[\s.]/g, '').trim();
          continue;
        }

        // Fax: "Fax: 0473983251" ou "Fax:"
        const faxMatch = t.match(/^Fax\s*:?\s*([\d\s.]*)/i);
        if (faxMatch) {
          entreprise.fax = (faxMatch[1] || '').replace(/[\s.]/g, '').trim();
          continue;
        }

        // Email
        if (t.includes('@')) {
          const emailMatch = t.match(/([a-zA-Z0-9._+\-]+@[a-zA-Z0-9._\-]+\.[a-zA-Z]{2,})/);
          if (emailMatch) entreprise.email = emailMatch[1].toLowerCase();
        }
      }

      entreprises.push(entreprise);
    }

    // Fallback : si l'en-tête n'a pas fourni les totaux, compter depuis les entrées
    if (totalEnveloppesElectroniques === 0 && totalEnveloppesPapier === 0) {
      entreprises.forEach(e => {
        if (/electronique|électronique/i.test(e.modeReception)) totalEnveloppesElectroniques++;
        else totalEnveloppesPapier++;
      });
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
  
  if (fileName.endsWith('.xls') || fileName.endsWith('.xlsx')) {
    return parseExcelDepots(file);
  }
  
  throw new Error('Format de fichier non supporté. Veuillez fournir un fichier PDF, XLS ou XLSX.');
};
