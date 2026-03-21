/**
 * crtUtils.ts
 * Utilitaires pour le Cadre de Réponse Technique (CRT)
 *
 * - DEFAULT_CRT_TEMPLATE  : structure vide prête à l'emploi
 * - exportCRTPDF          : génère un PDF A4 stylisé (jsPDF)
 * - importCRTFromWord     : importe un .docx et détecte la structure (mammoth)
 * - importCRTFromPDF      : importe un .pdf et extrait le texte brut (pdfjs-dist)
 */

import jsPDF from 'jspdf';
import { saveAs } from 'file-saver';
import type { CRTData, CRTSection, CRTSousSection } from '../../types';

// ─── Palette ──────────────────────────────────────────────────────────────────

const C = {
  tealDark:  [26,  51,  48]  as [number,number,number],
  teal:      [47,  91,  88]  as [number,number,number],
  tealMid:   [61, 122, 117]  as [number,number,number],
  tealLight: [232,242,241]   as [number,number,number],
  white:     [255,255,255]   as [number,number,number],
  black:     [30,  41,  59]  as [number,number,number],
  gray:      [107,114,128]   as [number,number,number],
  grayLight:  [249,250,251]  as [number,number,number],
  grayBorder: [209,213,219]  as [number,number,number],
  red:       [198, 40,  40]  as [number,number,number],
  redLight:  [255,235,238]   as [number,number,number],
  yellow:    [255,253,231]   as [number,number,number],
  amber:     [230, 81,   0]  as [number,number,number],
};

// ─── Template par défaut ──────────────────────────────────────────────────────

const INTRO_DEFAULT = `L'objet de ce document est de présenter la structure de réponse que le candidat doit impérativement respecter pour exposer l'offre qu'il propose en réponse à la présente consultation.

Le candidat peut, s'il le souhaite, ajouter des chapitres ou sous-chapitres. Cependant, le document ne devra pas dépasser les 30 pages hors annexe.

Le candidat peut annexer tout document de son choix à son offre cependant, les renvois ne seront pris en compte seulement s'ils indiquent précisément l'objet, les numéros de page et de paragraphe. Chaque point fait l'objet d'une réponse distincte en évitant tout renvoi à une autre réponse. Le candidat doit veiller à faire des réponses concises et précises.

Les éléments du CCATP ou du CCAP et du CCTP et de ses annexes sont à prendre en compte dans leur intégralité.`;

function ss(id: string, ref: string, titre: string): CRTSousSection {
  return { id, ref, titre, reponse: '' };
}

function sec(id: string, ref: string, titre: string, points: number, subs: CRTSousSection[]): CRTSection {
  return { id, ref, titre, points, sousSections: subs };
}

export const DEFAULT_CRT_TEMPLATE: CRTData = {
  reference: 'AAXXX_XX_XX-XX_XXX',
  objetMarche: 'Marché de Prestation d\'assistance à maîtrise d\'ouvrage pour la réalisation de xxxx et de xxxxx',
  nomSoumissionnaire: '',
  introduction: INTRO_DEFAULT,
  partFinanciere: 0,
  partTechnique: 0,
  nbPagesMax: 30,
  notes: '',
  sections: [
    sec('1', '1', 'XXXX', 0, [
      ss('1.1', '1.1', 'XXXX'),
      ss('1.2', '1.2', 'XXXX'),
    ]),
    sec('2', '2', 'XXXX', 0, [
      ss('2.1', '2.1', 'XXXX'),
      ss('2.2', '2.2', 'XXXX'),
    ]),
    sec('3', '3', 'XXXX', 0, [
      ss('3.1', '3.1', 'XXXX'),
      ss('3.2', '3.2', 'XXXX'),
    ]),
    sec('4', '4', 'XXXX', 0, [
      ss('4.1', '4.1', 'XXXX'),
      ss('4.2', '4.2', 'XXXX'),
    ]),
  ],
};

// ─── Helpers PDF ──────────────────────────────────────────────────────────────

const PW  = 210;
const PH  = 297;
const ML  = 20;
const MR  = 20;
const MT  = 20;
const MB  = 18;
const CW  = PW - ML - MR; // 170mm

function setFill(doc: jsPDF, rgb: [number,number,number]) {
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
}
function setTextColor(doc: jsPDF, rgb: [number,number,number]) {
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
}
function setDrawColor(doc: jsPDF, rgb: [number,number,number]) {
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
}

// ─── Chargement du logo AFPA ─────────────────────────────────────────────────

async function loadAfpaLogo(): Promise<string | null> {
  try {
    const response = await fetch('/Image1.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror  = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

// En-tête pages courantes : texte à gauche, logo à droite, filet bas
function addPageHeader(doc: jsPDF, data: CRTData, logoData: string | null) {
  const H = 18;
  // fond blanc
  setFill(doc, C.white);
  doc.rect(0, 0, PW, H, 'F');
  // Gauche : "Cadre de Réponse Technique"
  setTextColor(doc, C.tealDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cadre de Réponse Technique', ML, 11);
  // Droite : logo AFPA
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', PW - MR - 28, 2, 28, 12); } catch { /* ignoré */ }
  }
  // Filet bas
  setDrawColor(doc, C.tealMid);
  doc.setLineWidth(0.4);
  doc.line(ML, H, PW - MR, H);
}

function addPageFooter(doc: jsPDF, pageNum: number, totalPages: number, numeroProcedure?: string) {
  const y = PH - 8;
  setDrawColor(doc, C.grayBorder);
  doc.setLineWidth(0.3);
  doc.line(ML, y - 2, PW - MR, y - 2);
  setTextColor(doc, C.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  // Gauche : nom du document + référence procédure
  const leftLabel = numeroProcedure
    ? `Afpa — ${numeroProcedure}`
    : 'Afpa';
  doc.text(leftLabel, ML, y);
  // Droite : numérotation
  doc.text(`Page ${pageNum} / ${totalPages}`, PW - MR, y, { align: 'right' });
}

// ─── Export PDF ───────────────────────────────────────────────────────────────

export async function exportCRTPDF(data: CRTData, filename?: string, numeroProcedure?: string): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const totalPoints = data.sections.reduce((s, sec) => s + (sec.points || 0), 0);

  // ── Chargement du logo ──
  const logoData = await loadAfpaLogo();

  // ── Page de garde — fond blanc épuré ──
  let y = ML;

  // En-tête page de garde : texte gauche + logo droite
  setTextColor(doc, C.tealDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Cadre de Réponse Technique', ML, y + 10);
  if (logoData) {
    try { doc.addImage(logoData, 'PNG', PW - MR - 38, y, 38, 16); } catch { /* ignoré */ }
  }
  y += 26;

  // Filet de séparation fin
  setDrawColor(doc, C.tealMid);
  doc.setLineWidth(0.5);
  doc.line(ML, y, PW - MR, y);
  y += 10;

  // Titre principal
  setTextColor(doc, C.tealDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CADRE DE RÉPONSE TECHNIQUE', PW / 2, y, { align: 'center' });
  y += 9;

  // Objet du marché
  setTextColor(doc, C.black);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const objLines = doc.splitTextToSize(data.objetMarche, CW);
  doc.text(objLines, ML, y);
  y += objLines.length * 6 + 4;

  // Référence — centrée
  setTextColor(doc, C.gray);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const refLine = totalPoints > 0 ? `${data.reference}   |   ${totalPoints} points` : data.reference;
  doc.text(refLine, PW / 2, y, { align: 'center' });
  y += 10;

  // Filet séparateur
  setDrawColor(doc, C.grayBorder);
  doc.setLineWidth(0.3);
  doc.line(ML, y, PW - MR, y);
  y += 8;

  // Soumissionnaire — encadré sobre
  setDrawColor(doc, C.tealMid);
  doc.setLineWidth(0.5);
  doc.rect(ML, y, CW, 12, 'S');
  setTextColor(doc, data.nomSoumissionnaire ? C.black : C.gray);
  doc.setFont('helvetica', data.nomSoumissionnaire ? 'bold' : 'italic');
  doc.setFontSize(10);
  doc.text(
    data.nomSoumissionnaire || 'Nom du soumissionnaire',
    ML + 5, y + 7.5,
  );
  y += 18;

  // Répartition critères
  if (data.partFinanciere > 0 || data.partTechnique > 0) {
    setTextColor(doc, C.gray);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      `Répartition : Proposition financière ${data.partFinanciere} %  —  Valeur technique ${data.partTechnique} %`,
      ML, y,
    );
    y += 8;
  }

  // Sommaire simplifié
  y += 4;
  setTextColor(doc, C.tealDark);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('SOMMAIRE', ML, y);
  y += 6;
  setDrawColor(doc, C.tealMid);
  doc.setLineWidth(0.4);
  doc.line(ML, y, PW - MR, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  setTextColor(doc, C.black);
  doc.text('Introduction', ML + 4, y);
  y += 5;
  for (const s of data.sections) {
    doc.setFont('helvetica', 'bold');
    doc.text(`${s.ref}. ${s.titre}${s.points > 0 ? ` (${s.points} pts)` : ''}`, ML + 4, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    for (const sub of s.sousSections) {
      setTextColor(doc, C.gray);
      doc.setFontSize(8.5);
      doc.text(`${sub.ref}   ${sub.titre}`, ML + 12, y);
      y += 4;
      setTextColor(doc, C.black);
      doc.setFontSize(9.5);
      if (y > PH - 40) { doc.addPage(); y = MT + 5; }
    }
  }

  // ── Pages de contenu ──
  const addSection = (
    title: string,
    content: string,
    isSectionHeader = false,
    isSubHeader = false,
  ) => {
    const lineH = isSectionHeader ? 7 : isSubHeader ? 6 : 5;
    const needed = isSectionHeader ? 16 : isSubHeader ? 12 : 8;
    if (y + needed > PH - MB - 12) {
      doc.addPage();
      addPageHeader(doc, data, logoData);
      y = 22;
    }
    if (isSectionHeader) {
      setFill(doc, C.teal);
      doc.rect(ML, y, CW, lineH + 3, 'F');
      setTextColor(doc, C.white);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, ML + 4, y + lineH - 0.5);
      y += lineH + 6;
    } else if (isSubHeader) {
      setFill(doc, C.tealLight);
      doc.rect(ML, y, CW, lineH + 2, 'F');
      setTextColor(doc, C.tealDark);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text(title, ML + 3, y + lineH - 0.5);
      y += lineH + 4;
    }
    if (content) {
      setTextColor(doc, C.black);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(content, CW - 6);
      lines.forEach((line: string) => {
        if (y + 5 > PH - MB - 12) {
          doc.addPage();
          addPageHeader(doc, data, logoData);
          y = 22;
        }
        doc.text(line, ML + 3, y);
        y += 4.5;
      });
      y += 3;
    }
  };

  // Nouvelle page pour le contenu
  doc.addPage();
  addPageHeader(doc, data, logoData);
  y = 22;

  // Introduction
  addSection('Introduction', '', true);
  if (data.introduction) {
    addSection('', data.introduction);
  }

  // Sections
  for (const section of data.sections) {
    const secTitle = `${section.ref}. ${section.titre}${section.points > 0 ? `  (${section.points} points)` : ''}`;
    addSection(secTitle, '', true);
    for (const sub of section.sousSections) {
      const subTitle = `${sub.ref}   ${sub.titre}`;
      addSection(subTitle, '', false, true);
      if (sub.reponse) {
        addSection('', sub.reponse);
      } else {
        // Zone blanche vide — le candidat est libre de répondre ou non
        const boxH = 18;
        if (y + boxH > PH - MB - 12) { doc.addPage(); addPageHeader(doc, data, logoData); y = 22; }
        setFill(doc, C.white);
        doc.rect(ML, y, CW, boxH, 'F');
        setDrawColor(doc, C.tealLight);
        doc.setLineWidth(0.2);
        doc.rect(ML, y, CW, boxH, 'S');
        y += boxH + 4;
      }
    }
    y += 3;
  }

  // ── Numérotation des pages ──
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    addPageFooter(doc, p, totalPages, numeroProcedure);
  }

  // ── Sauvegarde ──
  const numCourt = numeroProcedure
    ? numeroProcedure.substring(0, 5)
    : (data.reference ? data.reference.substring(0, 5) : 'AAXXX');
  const fname = filename ?? `${numCourt}_05_CRT.pdf`;
  doc.save(fname);
}

// ─── Import Word (.docx) via mammoth ─────────────────────────────────────────

/**
 * Importe un fichier .docx et tente de reconstruire la structure CRT.
 * Retourne un CRTData partiel — les sections non détectées restent vides.
 */
export async function importCRTFromWord(file: File): Promise<Partial<CRTData>> {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Parseur HTML léger via DOMParser (disponible dans le navigateur)
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(html, 'text/html');

  const partial: Partial<CRTData> = {
    reference: '',
    objetMarche: '',
    introduction: '',
    sections: [],
  };

  const sections: CRTSection[] = [];
  let currentSection: CRTSection | null = null;
  let currentSub: CRTSousSection | null = null;
  let introLines: string[] = [];
  let inIntro = false;
  let afterIntro = false;

  const allNodes = Array.from(domDoc.body.childNodes);

  allNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as Element;
    const tag = el.tagName.toLowerCase();
    const text = el.textContent?.trim() ?? '';
    if (!text) return;

    // En-tête principal H1 → titre/référence
    if (tag === 'h1') {
      if (!partial.reference) partial.reference = text;
      else if (!partial.objetMarche) partial.objetMarche = text;
      return;
    }

    // Sous-titre H2 → objet ou section principale
    if (tag === 'h2') {
      // "Introduction"
      if (/^introduction/i.test(text)) {
        inIntro = true;
        afterIntro = false;
        return;
      }
      // Numérotée ex: "1 XXXX", "1. XXXX", "2. XXXX (XX points)"
      const secMatch = text.match(/^(\d+)[.\s]\s*(.+?)(?:\s*[(\[](\d+)\s*points?[)\]])?$/i);
      if (secMatch) {
        inIntro = false;
        afterIntro = true;
        const pts = secMatch[3] ? parseInt(secMatch[3]) : 0;
        currentSection = {
          id: secMatch[1],
          ref: secMatch[1],
          titre: secMatch[2].trim(),
          points: pts,
          sousSections: [],
        };
        currentSub = null;
        sections.push(currentSection);
        return;
      }
      // Objet du marché
      if (!partial.objetMarche) partial.objetMarche = text;
      return;
    }

    // H3 → sous-section
    if (tag === 'h3') {
      const subMatch = text.match(/^(\d+\.\d+)[.\s]*\s*(.*)$/);
      if (subMatch && currentSection) {
        currentSub = {
          id: subMatch[1],
          ref: subMatch[1],
          titre: subMatch[2].trim() || text,
          reponse: '',
        };
        currentSection.sousSections.push(currentSub);
        return;
      }
    }

    // Paragraphes
    if (tag === 'p' || tag === 'li') {
      if (inIntro) {
        introLines.push(text);
        return;
      }
      // Référence en premier paragraphe
      if (!partial.reference && /^[A-Z]{2}[A-Z0-9_\-]{4,}$/.test(text)) {
        partial.reference = text;
        return;
      }
      // Contenu dans une sous-section → réponse
      if (currentSub && afterIntro && text.length > 2) {
        currentSub.reponse += (currentSub.reponse ? '\n' : '') + text;
      }
    }

    // Tables → extraction basique
    if (tag === 'table' && currentSub) {
      const rows = Array.from(el.querySelectorAll('tr'));
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        const rowText = cells.map(c => c.textContent?.trim()).filter(Boolean).join(' | ');
        if (rowText) currentSub!.reponse += (currentSub!.reponse ? '\n' : '') + rowText;
      });
    }
  });

  partial.introduction = introLines.join('\n\n');
  partial.sections = sections.length > 0 ? sections : undefined;

  return partial;
}

// ─── Import PDF via pdfjs-dist ────────────────────────────────────────────────

/**
 * Extrait le texte d'un PDF page par page puis tente de détecter
 * la structure (Introduction + sections numérotées).
 * L'import PDF est moins précis que l'import Word — la structure
 * peut nécessiter un ajustement manuel.
 */
export async function importCRTFromPDF(file: File): Promise<Partial<CRTData>> {
  const pdfjsLib = await import('pdfjs-dist');
  // Évite le worker pour compatibilité Next.js (moins performant mais fonctionnel)
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = pdfDoc.numPages;

  const allLines: string[] = [];
  for (let p = 1; p <= numPages; p++) {
    const page = await pdfDoc.getPage(p);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter((item: any) => 'str' in item)
      .map((item: any) => (item as any).str)
      .join(' ')
      .replace(/\s{2,}/g, '\n')
      .trim();
    allLines.push(...pageText.split('\n').map((l: string) => l.trim()).filter(Boolean));
  }

  // Reconstruction de la structure à partir des lignes
  const partial: Partial<CRTData> = {
    reference: '',
    objetMarche: '',
    introduction: '',
    sections: [],
  };

  const sections: CRTSection[] = [];
  let currentSection: CRTSection | null = null;
  let currentSub: CRTSousSection | null = null;
  let introLines: string[] = [];
  let inIntro = false;

  for (const line of allLines) {
    // Référence type AAXXX
    if (!partial.reference && /^[A-Z]{2}[A-Z0-9_\-]{4,}/.test(line)) {
      partial.reference = line;
      continue;
    }
    if (/^introduction$/i.test(line)) { inIntro = true; continue; }

    // Détection section numérotée "1 " ou "1. "
    const secMatch = line.match(/^(\d+)[.\s]\s+(.+?)(?:\s+\((\d+)\s*points?\))?$/i);
    if (secMatch && !line.includes('|')) {
      inIntro = false;
      const pts = secMatch[3] ? parseInt(secMatch[3]) : 0;
      currentSection = { id: secMatch[1], ref: secMatch[1], titre: secMatch[2].trim(), points: pts, sousSections: [] };
      currentSub = null;
      sections.push(currentSection);
      continue;
    }

    // Sous-section "1.1 " ou "1.1. "
    const subMatch = line.match(/^(\d+\.\d+)[.\s]+(.+)$/);
    if (subMatch && currentSection) {
      currentSub = { id: subMatch[1], ref: subMatch[1], titre: subMatch[2].trim(), reponse: '' };
      currentSection.sousSections.push(currentSub);
      continue;
    }

    if (inIntro) { introLines.push(line); continue; }
    if (currentSub && line.length > 3) {
      currentSub.reponse += (currentSub.reponse ? '\n' : '') + line;
    }
  }

  partial.introduction = introLines.join('\n');
  partial.sections = sections.length > 0 ? sections : undefined;
  return partial;
}
