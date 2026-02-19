import * as XLSX from 'xlsx';
import * as pdfjsLib from 'pdfjs-dist';
import { RetraitsData, EntrepriseRetrait, ProcedureInfo, RetraitsStats } from '../types/retraits';

// Configuration du worker PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

// ─── Types internes ────────────────────────────────────────────────────────────

interface TextItem {
  str: string;
  x: number;
  y: number; // coordonnée "page" : 0 = haut de page, croissant vers le bas
}

// ─── Définition des colonnes du tableau e-marchespublics ──────────────────────
// Plages X par défaut (fallback). En pratique, les colonnes sont détectées
// dynamiquement depuis la ligne d'en-tête du tableau (voir detectCols).
const DEBUG_COORDS = false; // passer à true pour voir les coordonnées brutes dans la console

const COLS_DEFAULT = {
  contact:     { min: 0,   max: 115 },
  societe:     { min: 115, max: 235 },
  coordonnees: { min: 235, max: 355 },
  typeRetrait: { min: 355, max: 415 },
  email:       { min: 415, max: 535 },
  lots:        { min: 535, max: 600 },
  intention:   { min: 600, max: 645 },
  visites:     { min: 645, max: 820 },
};

type ColMap = typeof COLS_DEFAULT;

/**
 * Détecte dynamiquement les positions des colonnes depuis la ligne d'en-tête.
 * Cherche les mots-clés des headers et utilise leurs X comme bornes.
 */
function detectCols(headerLine: TextItem[]): ColMap {
  if (!headerLine.length) return COLS_DEFAULT;

  // Mots-clés attendus dans l'en-tête (on cherche la correspondance la plus proche)
  const keywords: { key: keyof ColMap; patterns: RegExp[] }[] = [
    { key: 'contact',     patterns: [/^contact$/i] },
    { key: 'societe',     patterns: [/^soci[eé]t[eé]$/i, /^entreprise$/i] },
    { key: 'coordonnees', patterns: [/^coordonn[eé]e/i, /^adresse$/i] },
    { key: 'typeRetrait', patterns: [/^type/i, /retrait/i, /^dce$/i] },
    { key: 'email',       patterns: [/^e.?mail/i, /^courriel$/i, /^mail$/i] },
    { key: 'lots',        patterns: [/^lots?$/i] },
    { key: 'intention',   patterns: [/^intention/i] },
    { key: 'visites',     patterns: [/^visite/i, /^date/i] },
  ];

  // Map clé → X du header
  const headerX: Partial<Record<keyof ColMap, number>> = {};
  for (const item of headerLine) {
    const str = item.str.trim();
    for (const { key, patterns } of keywords) {
      if (headerX[key] === undefined && patterns.some(p => p.test(str))) {
        headerX[key] = item.x;
      }
    }
  }

  // Si moins de 4 colonnes détectées, utiliser les valeurs par défaut
  const detected = Object.keys(headerX).length;
  if (detected < 4) {
    if (DEBUG_COORDS) console.log('[retraitsParser] Détection colonnes insuffisante, utilisation valeurs par défaut');
    return COLS_DEFAULT;
  }

  if (DEBUG_COORDS) console.log('[retraitsParser] Colonnes détectées:', headerX);

  // Construire les plages à partir des positions X détectées + mid-points
  const order: (keyof ColMap)[] = ['contact', 'societe', 'coordonnees', 'typeRetrait', 'email', 'lots', 'intention', 'visites'];
  const xs = order.map(k => headerX[k] ?? null);

  // Interpoler les colonnes manquantes par la moyenne des voisins connus
  for (let i = 0; i < xs.length; i++) {
    if (xs[i] === null) {
      const prev = xs.slice(0, i).reverse().find(v => v !== null) ?? 0;
      const next = xs.slice(i + 1).find(v => v !== null);
      xs[i] = next !== undefined ? (prev + next) / 2 : prev + 60;
    }
  }

  // Construire les plages [x_i, x_{i+1}) avec un petit gap de 5px à gauche de chaque borne
  const result: ColMap = {} as ColMap;
  for (let i = 0; i < order.length; i++) {
    const minX = i === 0 ? 0 : (xs[i]! - 5);
    const maxX = i < order.length - 1 ? (xs[i + 1]! - 5) : (xs[i]! + 200);
    result[order[i]] = { min: minX, max: maxX };
  }

  if (DEBUG_COORDS) console.log('[retraitsParser] ColMap construite:', result);
  return result;
}

const Y_TOLERANCE = 3.5; // px : deux items à moins de 3.5px de Y = même ligne visuelle

// ─── Helpers ──────────────────────────────────────────────────────────────────

function inCol(x: number, col: { min: number; max: number }): boolean {
  return x >= col.min && x < col.max;
}

/** Regroupe les TextItem par lignes (Y proches) et trie chaque ligne par X. */
function groupByLines(items: TextItem[]): TextItem[][] {
  if (!items.length) return [];
  const sorted = [...items].sort((a, b) => a.y - b.y);
  const lines: TextItem[][] = [];
  let cur: TextItem[] = [sorted[0]];
  let refY = sorted[0].y;

  for (let i = 1; i < sorted.length; i++) {
    if (Math.abs(sorted[i].y - refY) <= Y_TOLERANCE) {
      cur.push(sorted[i]);
    } else {
      lines.push(cur.sort((a, b) => a.x - b.x));
      cur = [sorted[i]];
      refY = sorted[i].y;
    }
  }
  lines.push(cur.sort((a, b) => a.x - b.x));
  return lines;
}

/** Concatène le texte des items dans une colonne donnée sur une ligne. */
function colText(line: TextItem[], col: { min: number; max: number }): string {
  return line
    .filter(i => inCol(i.x, col))
    .map(i => i.str.trim())
    .filter(Boolean)
    .join(' ')
    .trim();
}

/** Extrait tous les TextItem d'une page avec leurs vraies coordonnées. */
async function extractItems(page: any): Promise<TextItem[]> {
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const items = (content.items as any[])
    .filter(item => item.str?.trim())
    .map(item => ({
      str: item.str,
      x: item.transform[4],
      // Convertit Y pdf (0=bas) en Y page (0=haut)
      y: viewport.height - item.transform[5],
    }));

  if (DEBUG_COORDS) {
    console.log('[DEBUG] Items page (x, y, str):');
    items.slice(0, 40).forEach(i => console.log(`  x=${i.x.toFixed(1)} y=${i.y.toFixed(1)} "${i.str}"`));
  }

  return items;
}

// ─── Parser de l'entête ────────────────────────────────────────────────────────

function parseHeader(lines: TextItem[][]): {
  procedureInfo: ProcedureInfo;
  stats: RetraitsStats;
} {
  // Concaténation des 35 premières lignes pour regex
  const raw = lines
    .slice(0, 35)
    .map(l => l.map(i => i.str).join(' '))
    .join('\n');

  const g = (pattern: RegExp): string => {
    const m = raw.match(pattern);
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
  };

  const objet          = g(/Objet\s+du\s+march[eé]\s*:?\s*(.+?)(?=Date\s+de\s+publication|Votre\s+r[eé]f|Date\s+d[''e]|$)/si);
  const reference      = g(/Votre\s+r[eé]f[eé]rence\s*:?\s*([^\n]+)/i);
  const idEmp          = g(/ID\s*EMP\s*:?\s*(\d+)/i);
  const dateOffre      = g(/Date\s+d[''e]offre\s*:?\s*([^\n]+)/i);
  const datePublication = g(/Date\s+de\s+publication\s*:?\s*([^\n]+)/i);
  const dateCandidature = g(/Date\s+de\s+candidature\s*:?\s*([^\n]+)/i);
  const dateImpression = g(/Date\s+impression\s*:?\s*([^\n]+)/i);

  const totalTelecharges  = parseInt(g(/Total\s+dce\s+[eé]lectroniques\s+t[eé]l[eé]charg[eé]s\s*:\s*(\d+)/i) || '0', 10);
  const totalReprographies = parseInt(g(/Total\s+dce\s+reprographi[eé]s\s+retir[eé]s\s*:\s*(\d+)/i) || '0', 10);
  const anonymes           = parseInt(g(/Total\s+dce\s+[eé]lectroniques\s+t[eé]l[eé]charg[eé]s\s+anonymement\s+(\d+)/i) || '0', 10);

  return {
    procedureInfo: { objet, reference, idEmp, dateOffre, datePublication, dateCandidature, dateImpression },
    stats: { totalTelecharges, totalReprographies, anonymes },
  };
}

// ─── Parser d'un bloc entreprise ─────────────────────────────────────────────

function parseEntrepriseBloc(bloc: TextItem[][], cols: ColMap): EntrepriseRetrait | null {
  const all = bloc.flat();

  // Email : chercher d'abord dans la colonne email, puis partout dans le bloc
  let emailStr = all
    .filter(i => inCol(i.x, cols.email))
    .map(i => i.str.trim())
    .join('')
    .trim();

  // Fallback : chercher un email dans n'importe quelle cellule du bloc
  if (!emailStr.includes('@')) {
    const fallbackEmail = all.map(i => i.str.trim()).find(s => s.includes('@'));
    if (fallbackEmail) emailStr = fallbackEmail;
  }

  if (!emailStr.includes('@')) return null;

  // ── Contact
  const contactFull = bloc
    .map(l => colText(l, cols.contact))
    .filter(Boolean)
    .join(' ')
    .trim();
  // Dans le PDF, le contact est souvent "Prénom\nNom" ou "Prénom Nom"
  const contactParts = contactFull.split(/\s{2,}|\n/).map(s => s.trim()).filter(Boolean);
  const prenom = contactParts[0] ?? '';
  const nom    = contactParts.slice(1).join(' ') ?? '';

  // ── Société
  const societe = bloc
    .map(l => colText(l, cols.societe))
    .filter(Boolean)
    .join(' ')
    .trim();

  // ── Coordonnées
  const coordLines = bloc
    .map(l => colText(l, cols.coordonnees))
    .filter(Boolean);

  let adresse = '';
  let cp = '';
  let ville = '';
  let telephone = '';
  let fax = '';
  let pays = 'France';

  for (const line of coordLines) {
    if (/Tel\s*:?/i.test(line)) {
      const m = line.match(/Tel\s*:?\s*([+\d()\s./\\-]{6,})/i);
      if (m) { telephone = m[1].replace(/\s+/g, '').trim(); continue; }
    }
    if (/Fax\s*:?/i.test(line)) {
      const m = line.match(/Fax\s*:?\s*([+\d()\s./\\-]{6,})/i);
      if (m) { fax = m[1].replace(/\s+/g, '').trim(); continue; }
    }
    const cpMatch = line.match(/^(\d{5})\s*[-–]?\s*(.+)$/);
    if (cpMatch) { cp = cpMatch[1]; ville = cpMatch[2].trim(); continue; }
    if (/Portugal|Tunisie|Espagne|Belgique|Suisse|Maroc|Italie/i.test(line)) {
      pays = line.trim(); continue;
    }
    if (!adresse) adresse = line;
    else adresse += ' ' + line;
  }

  // ── Type retrait
  const typeRaw = bloc.map(l => colText(l, cols.typeRetrait)).filter(Boolean).join(' ');
  const typeRetrait = /electron/i.test(typeRaw) ? 'Electronique'
    : /repro/i.test(typeRaw) ? 'Reprographié'
    : 'Electronique';

  // ── Lots
  const lots = bloc.map(l => colText(l, cols.lots)).filter(Boolean).join(' ').trim()
    || '- Pièces communes';

  // ── Intention
  const intentionRaw = bloc.map(l => colText(l, cols.intention)).filter(Boolean).join(' ');
  const intention = /oui/i.test(intentionRaw) ? 'Oui'
    : /\bno[n]?\b/i.test(intentionRaw) ? 'Non'
    : 'NC';

  // ── Visites : extraire toutes les dates "dd/mm/yyyy à HHhMM"
  const visitesRaw = bloc.map(l => colText(l, cols.visites)).filter(Boolean).join(' ');
  const datePattern = /(\d{2}\/\d{2}\/\d{4}\s*[àa]\s*\d{1,2}h\d{2})/gi;
  const dates = [...visitesRaw.matchAll(datePattern)].map(m => m[1].trim());
  const premiereVisite = dates[0] ?? '';
  const derniereVisite = dates[dates.length - 1] ?? '';

  return {
    prenom,
    nom,
    societe,
    siret: '',
    adresse: adresse.trim(),
    cp,
    ville,
    telephone,
    fax,
    email: emailStr,
    typeRetrait,
    lots,
    intention,
    premiereVisite,
    derniereVisite,
    pays,
  } as EntrepriseRetrait;
}

// ─── Parser PDF principal ─────────────────────────────────────────────────────

export const parsePdfRetraits = async (file: File): Promise<RetraitsData> => {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Extraire tous les items de toutes les pages, Y décalé par page
  let allItems: TextItem[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const items = await extractItems(page);
    const pageH = page.getViewport({ scale: 1 }).height;
    for (const item of items) {
      allItems.push({ ...item, y: item.y + (p - 1) * pageH });
    }
  }

  allItems.sort((a, b) => a.y - b.y);
  const allLines = groupByLines(allItems);

  // ── Entête
  const { procedureInfo, stats } = parseHeader(allLines);

  // ── Trouver le début du tableau (ligne contenant "Contact" + "Société")
  let tableStart = allLines.findIndex(line => {
    const txt = line.map(i => i.str).join(' ');
    return /Contact/i.test(txt) && /Soci[eé]t[eé]/i.test(txt);
  });
  if (tableStart === -1) {
    console.warn('[retraitsParser] En-tête tableau non trouvé, tentative depuis ligne 15');
    tableStart = 15;
  }

  // ── Détecter les colonnes dynamiquement depuis la ligne d'en-tête
  const headerLine = tableStart >= 0 ? allLines[tableStart] : [];
  const cols = detectCols(headerLine);
  if (DEBUG_COORDS) {
    console.log('[retraitsParser] Colonnes utilisées:', cols);
    console.log('[retraitsParser] Ligne header:', headerLine.map(i => `x=${i.x.toFixed(1)} "${i.str}"`).join(', '));
  }

  const tableLines = allLines.slice(tableStart + 1);

  // ── Découper en blocs : nouveau bloc quand une ligne contient un "@"
  // On cherche d'abord dans la colonne email détectée, puis partout en fallback
  const entreprises: EntrepriseRetrait[] = [];
  let currentBloc: TextItem[][] = [];

  const flush = () => {
    if (currentBloc.length > 0) {
      const e = parseEntrepriseBloc(currentBloc, cols);
      if (e) entreprises.push(e);
      currentBloc = [];
    }
  };

  for (const line of tableLines) {
    // Chercher @ dans la colonne email détectée
    let emailInLine = line
      .filter(i => inCol(i.x, cols.email))
      .map(i => i.str)
      .join('');

    // Fallback : chercher @ n'importe où dans la ligne si colonne email vide
    if (!emailInLine.includes('@')) {
      emailInLine = line.map(i => i.str).join('');
    }

    if (emailInLine.includes('@') && currentBloc.length > 0) flush();
    currentBloc.push(line);
  }
  flush();

  if (entreprises.length === 0) {
    throw new Error(
      'Aucune entreprise détectée dans le PDF.\n' +
      'Conseil : activez DEBUG_COORDS dans retraitsParser.ts pour vérifier les coordonnées X et ajustez les constantes COLS si nécessaire.'
    );
  }

  const finalStats: RetraitsStats = {
    totalTelecharges:   stats.totalTelecharges  || entreprises.filter(e => e.typeRetrait === 'Electronique').length,
    totalReprographies: stats.totalReprographies || entreprises.filter(e => e.typeRetrait === 'Reprographié').length,
    anonymes:           stats.anonymes,
  };

  console.log(`[retraitsParser] ${entreprises.length} entreprises extraites`);
  console.log('[retraitsParser] procedureInfo:', procedureInfo);
  console.log('[retraitsParser] stats:', finalStats);

  return { procedureInfo, stats: finalStats, entreprises };
};

// ─── Parser Excel ─────────────────────────────────────────────────────────────

export const parseExcelRetraits = async (file: File): Promise<RetraitsData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) { reject(new Error('Fichier vide')); return; }

        const workbook = XLSX.read(data, { type: 'binary' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: false });
        if (!rows.length) { reject(new Error('Feuille Excel vide')); return; }

        const col = (row: any, ...keys: string[]): string => {
          for (const k of keys) if (row[k]) return String(row[k]).trim();
          return '';
        };

        const entreprises: EntrepriseRetrait[] = rows.map(row => ({
          prenom:         col(row, 'Prénom', 'Prenom', 'PRENOM'),
          nom:            col(row, 'Nom', 'NOM'),
          societe:        col(row, 'Société', 'Societe', 'SOCIETE'),
          siret:          col(row, 'SIRET', 'Siret'),
          adresse:        col(row, 'Adresse', 'ADRESSE'),
          cp:             col(row, 'CP', 'Code postal', 'CodePostal'),
          ville:          col(row, 'Ville', 'VILLE'),
          telephone:      col(row, 'Téléphone', 'Telephone', 'Tel'),
          fax:            col(row, 'Fax', 'FAX'),
          email:          col(row, 'E-mail', 'Email', 'EMAIL'),
          typeRetrait:    col(row, 'Type retrait', 'TypeRetrait') || 'Electronique',
          lots:           col(row, 'Lots', 'LOTS') || '- Pièces communes',
          intention:      col(row, 'Intention de réponse', 'Intention') || 'NC',
          premiereVisite: col(row, 'Première visite', 'Premiere visite'),
          derniereVisite: col(row, 'Dernière visite', 'Derniere visite'),
          pays:           col(row, 'Pays') || 'France',
        }));

        const procedureInfo: ProcedureInfo = {
          objet: '', reference: '', datePublication: '', dateCandidature: '',
          dateOffre: '', idEmp: '', dateImpression: '',
        };

        resolve({
          procedureInfo,
          stats: {
            totalTelecharges:   entreprises.filter(e => e.typeRetrait === 'Electronique').length,
            totalReprographies: entreprises.filter(e => e.typeRetrait === 'Reprographié').length,
            anonymes: 0,
          },
          entreprises,
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = () => reject(new Error('Erreur lecture fichier Excel'));
    reader.readAsBinaryString(file);
  });
};

// ─── Parser universel ─────────────────────────────────────────────────────────

export const parseRetraitsFile = async (file: File): Promise<RetraitsData> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf')                   return parsePdfRetraits(file);
  if (ext === 'xls' || ext === 'xlsx') return parseExcelRetraits(file);
  throw new Error('Format non supporté. Utilisez un fichier .pdf, .xls ou .xlsx');
};
