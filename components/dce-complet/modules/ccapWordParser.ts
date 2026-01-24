/**
 * Parser intelligent pour fichiers Word (.docx) → Sections CCAP
 * Détecte automatiquement les articles, chapitres et sections
 */

import mammoth from 'mammoth';

export interface ParsedSection {
  titre: string;
  contenu: string;
}

export interface ParseResult {
  sections: ParsedSection[];
  totalSections: number;
}

/**
 * Parse un fichier Word et extrait les sections
 */
export async function parseWordToCCAP(file: File): Promise<ParseResult> {
  try {
    // Convertir le fichier en ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();

    // 1) Tenter extraction via HTML (préserve les titres Word)
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const htmlSections = extractSectionsFromHtml(htmlResult.value);

    // 2) Fallback : texte brut + détection regex
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    const textSections = detectSections(textResult.value);

    const sections = htmlSections.length >= 2 ? htmlSections : textSections;
    
    return {
      sections,
      totalSections: sections.length,
    };
  } catch (error) {
    console.error('Erreur lors du parsing Word:', error);
    throw new Error('Impossible de lire le fichier Word. Assurez-vous qu\'il s\'agit d\'un fichier .docx valide.');
  }
}

/**
 * Extrait les sections à partir du HTML Mammoth (titres h1..h6)
 */
function extractSectionsFromHtml(html: string): ParsedSection[] {
  if (!html || typeof DOMParser === 'undefined') return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) return [];

  const sections: ParsedSection[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];

  const flush = () => {
    if (currentTitle && currentContent.length > 0) {
      sections.push({
        titre: currentTitle.trim(),
        contenu: currentContent.join('\n').trim(),
      });
    }
    currentContent = [];
  };

  const nodes = Array.from(body.childNodes);
  for (const node of nodes) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        flush();
        currentTitle = el.textContent?.trim() || '';
        continue;
      }
    }

    const text = node.textContent?.trim();
    if (text) {
      currentContent.push(text);
    }
  }

  flush();
  return sections;
}

/**
 * Détecte automatiquement les sections dans le texte
 * Supporte plusieurs formats :
 * - "Article 1", "ARTICLE 1", "Article 1 -", "Article 1 :"
 * - "1.", "1 -", "1)"
 * - "CHAPITRE 1", "Chapitre I"
 * - "Section A", "SECTION A"
 */
function detectSections(text: string): ParsedSection[] {
  const lines = text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const isUpperLike = (value: string) => {
    const letters = value.replace(/[^A-ZÀ-ÖØ-Ý]/g, '');
    const totalLetters = value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ]/g, '');
    if (totalLetters.length === 0) return false;
    return letters.length / totalLetters.length >= 0.7;
  };

  const isHeadingCandidate = (line: string) => {
    if (line.length > 140) return false;
    if (line.endsWith(':') || line.endsWith(';')) return false;
    if (/^\d+[.)]\s+/.test(line)) return false; // évite listes numérotées
    return isUpperLike(line);
  };

  const matchArticle = (line: string) => line.match(/^(ARTICLE|Article)\s+(\d+|[IVXLCDM]+)\b\s*[-:]?\s*(.*)$/);
  const matchChapitre = (line: string) => line.match(/^(CHAPITRE|Chapitre)\s+(\d+|[IVXLCDM]+)\b\s*[-:]?\s*(.*)$/);
  const matchSection = (line: string) => line.match(/^(SECTION|Section)\s+([A-Z]|\d+)\b\s*[-:]?\s*(.*)$/);

  const buildSectionsFromIndices = (indices: Array<{ index: number; title: string }>) => {
    const sections: ParsedSection[] = [];
    indices.forEach((item, idx) => {
      const start = item.index + 1;
      const end = idx + 1 < indices.length ? indices[idx + 1].index : lines.length;
      const contenu = lines.slice(start, end).join('\n').trim();
      sections.push({ titre: item.title, contenu });
    });
    return sections;
  };

  const collectByPattern = (matcher: (line: string) => RegExpMatchArray | null, formatter: (match: RegExpMatchArray) => string) => {
    const indices: Array<{ index: number; title: string }> = [];
    lines.forEach((line, idx) => {
      const match = matcher(line);
      if (match) {
        indices.push({ index: idx, title: formatter(match) });
      }
    });
    return indices;
  };

  // 1) Articles uniquement (priorité pour éviter la sur-segmentation)
  let indices = collectByPattern(matchArticle, (match) => {
    const suffix = match[3]?.trim();
    return suffix ? `${match[1]} ${match[2]} - ${suffix}` : `${match[1]} ${match[2]}`;
  });

  if (indices.length >= 3) {
    return buildSectionsFromIndices(indices);
  }

  // 2) Articles + Chapitres + Sections
  const indicesCombined: Array<{ index: number; title: string }> = [];
  indicesCombined.push(
    ...collectByPattern(matchChapitre, (match) => {
      const suffix = match[3]?.trim();
      return suffix ? `${match[1]} ${match[2]} - ${suffix}` : `${match[1]} ${match[2]}`;
    })
  );
  indicesCombined.push(
    ...collectByPattern(matchSection, (match) => {
      const suffix = match[3]?.trim();
      return suffix ? `${match[1]} ${match[2]} - ${suffix}` : `${match[1]} ${match[2]}`;
    })
  );
  indicesCombined.push(...indices);
  indicesCombined.sort((a, b) => a.index - b.index);

  if (indicesCombined.length >= 3 && indicesCombined.length <= 120) {
    return buildSectionsFromIndices(indicesCombined);
  }

  // 3) Garde-fou : si trop de sections, on revient à des sections "ARTICLE" seulement
  if (indicesCombined.length > 120 && indices.length > 0) {
    return buildSectionsFromIndices(indices);
  }

  // 4) Fallback minimal : une seule section pour éviter la sur-segmentation
  const contenu = text.trim();
  return [{ titre: 'CCAP', contenu }];
}

/**
 * Nettoie le texte extrait (supprime formatage superflu)
 */
function cleanText(text: string): string {
  return text
    // Supprime espaces multiples
    .replace(/\s+/g, ' ')
    // Supprime lignes vides multiples
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * Prévisualisation des sections détectées (pour debug)
 */
export function previewSections(sections: ParsedSection[]): string {
  return sections
    .map((section, index) => 
      `[${index + 1}] ${section.titre}\n   Contenu: ${section.contenu.substring(0, 50)}...`
    )
    .join('\n\n');
}
