// ============================================
// Export CCAP vers PDF Professionnel
// ============================================

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { CCAPData } from '../../types';
import { getCCAPTypeLabel } from './ccapTemplates';
import { CCAP_HEADER_TEXT, CCAP_HEADER_TITLE } from './ccapConstants';

/**
 * Calcule les numéros de section hiérarchiques (1, 1.1, 1.2.1, etc.)
 */
function calculateSectionNumbers(sections: Array<{ titre: string; contenu: string; niveau?: number }>): string[] {
  const counters: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
  
  return sections.map(section => {
    const niveau = section.niveau || 1;
    counters[niveau]++;
    
    // Réinitialiser les compteurs des niveaux inférieurs
    for (let i = niveau + 1; i <= 4; i++) {
      counters[i] = 0;
    }
    
    // Construire le numéro
    const parts: number[] = [];
    for (let i = 1; i <= niveau; i++) {
      parts.push(counters[i]);
    }
    
    return parts.join('.');
  });
}

/**
 * Structure pour le sommaire
 */
interface TocEntry {
  number: string;
  title: string;
  page: number;
  level: number;
}

/**
 * Charge le logo AFPA en base64
 */
async function loadAfpaLogo(): Promise<string | null> {
  try {
    const response = await fetch('/logo-afpa.png');
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.warn('Logo AFPA non disponible:', error);
    return null;
  }
}

/**
 * Bloc de contenu extrait du HTML : paragraphe, image ou tableau
 */
type ContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'image'; src: string }
  | { type: 'table'; head: string[][]; body: string[][] };

/**
 * Parse le HTML et retourne une liste de blocs typés (paragraphes, images, tableaux).
 * Utilisé par le rendu PDF pour distinguer les tableaux du texte brut.
 */
function htmlToContentBlocks(html: string): ContentBlock[] {
  if (!html.includes('<')) {
    return html.split('\n').filter(p => p.trim()).map(text => ({ type: 'paragraph' as const, text }));
  }

  const blocks: ContentBlock[] = [];
  const parser = new DOMParser();
  const domDoc = parser.parseFromString(html, 'text/html');

  const processNode = (node: Element) => {
    const tag = node.tagName.toLowerCase();

    if (tag === 'table') {
      const head: string[][] = [];
      const body: string[][] = [];

      // En-têtes depuis <thead> ou première ligne avec <th>
      const theadRows = node.querySelectorAll('thead tr');
      if (theadRows.length > 0) {
        theadRows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('th, td')).map(c => c.textContent?.trim() || '');
          if (cells.length) head.push(cells);
        });
      } else {
        const firstRow = node.querySelector('tr');
        if (firstRow && firstRow.querySelector('th')) {
          const cells = Array.from(firstRow.querySelectorAll('th')).map(c => c.textContent?.trim() || '');
          if (cells.length) head.push(cells);
        }
      }

      // Lignes de données depuis <tbody> ou toutes les <tr>
      const tbodyRows = node.querySelectorAll('tbody tr');
      const dataRows = tbodyRows.length > 0 ? tbodyRows : node.querySelectorAll('tr');
      dataRows.forEach((row, i) => {
        // Ignorer la première ligne si elle a servi d'en-tête
        if (i === 0 && head.length > 0 && theadRows.length === 0) return;
        const cells = Array.from(row.querySelectorAll('td, th')).map(c => c.textContent?.trim() || '');
        if (cells.length) body.push(cells);
      });

      blocks.push({ type: 'table', head, body });
    } else if (tag === 'img') {
      const src = (node as HTMLImageElement).src;
      if (src) blocks.push({ type: 'image', src });
    } else if (tag === 'p') {
      const imgs = node.querySelectorAll('img');
      if (imgs.length > 0) {
        const text = Array.from(node.childNodes)
          .filter(n => n.nodeType === Node.TEXT_NODE)
          .map(n => n.textContent?.trim())
          .filter(Boolean)
          .join(' ');
        if (text) blocks.push({ type: 'paragraph', text });
        imgs.forEach(img => {
          const src = (img as HTMLImageElement).src;
          if (src) blocks.push({ type: 'image', src });
        });
      } else {
        const text = node.textContent?.trim();
        if (text) blocks.push({ type: 'paragraph', text });
      }
    } else if (tag === 'ul' || tag === 'ol') {
      let counter = 1;
      node.querySelectorAll('li').forEach(li => {
        const text = li.textContent?.trim();
        if (text) {
          const bullet = tag === 'ul' ? '• ' : `${counter}. `;
          blocks.push({ type: 'paragraph', text: bullet + text });
          counter++;
        }
      });
    } else if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const text = node.textContent?.trim();
      if (text) blocks.push({ type: 'paragraph', text });
    } else if (tag === 'blockquote') {
      const text = node.textContent?.trim();
      if (text) blocks.push({ type: 'paragraph', text: '» ' + text });
    } else {
      Array.from(node.children).forEach(child => processNode(child as Element));
    }
  };

  Array.from(domDoc.body.children).forEach(child => processNode(child as Element));
  return blocks;
}

/**
 * Convertit du HTML en texte brut avec préservation de la structure pour PDF
 * Retourne un tableau d'objets (texte ou image)
 */
interface HtmlContent {
  type: 'text' | 'image';
  content?: string;
  src?: string;
  indent?: string;
}

function htmlToPlainText(html: string): string[] {
  // Si pas de HTML, traiter comme texte brut
  if (!html.includes('<')) {
    return html.split('\n').filter(p => p.trim());
  }

  const paragraphs: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const processNode = (node: Element, indent: string = '') => {
    const tag = node.tagName.toLowerCase();
    
    switch (tag) {
      case 'p':
        // Vérifier s'il y a des images dans le paragraphe
        const imgs = node.querySelectorAll('img');
        if (imgs.length > 0) {
          // D'abord ajouter le texte avant l'image s'il existe
          const textBefore = Array.from(node.childNodes)
            .filter(n => n.nodeType === Node.TEXT_NODE)
            .map(n => n.textContent?.trim())
            .filter(t => t)
            .join(' ');
          
          if (textBefore) {
            paragraphs.push(indent + textBefore);
          }
          
          // Ajouter les images
          imgs.forEach(img => {
            const src = (img as HTMLImageElement).src;
            if (src) {
              paragraphs.push(`[IMAGE:${src}]`);
            }
          });
        } else {
          // Pas d'image, traiter normalement
          const text = node.textContent?.trim();
          if (text) paragraphs.push(indent + text);
        }
        break;
      
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        const heading = node.textContent?.trim();
        if (heading) paragraphs.push('\n' + indent + heading + '\n');
        break;
      
      case 'img':
        // Image au niveau racine
        const src = (node as HTMLImageElement).src;
        if (src) {
          paragraphs.push(`[IMAGE:${src}]`);
        }
        break;
      
      case 'ul':
      case 'ol':
        let counter = 1;
        node.querySelectorAll('li').forEach((li) => {
          const liText = li.textContent?.trim();
          if (liText) {
            const bullet = tag === 'ul' ? '• ' : `${counter}. `;
            paragraphs.push(indent + bullet + liText);
            counter++;
          }
        });
        break;
      
      case 'li':
        // Géré par ul/ol
        break;
      
      case 'blockquote':
        const quote = node.textContent?.trim();
        if (quote) {
          paragraphs.push(indent + '» ' + quote);
        }
        break;
      
      default:
        // Traiter les enfants récursivement
        Array.from(node.children).forEach(child => processNode(child as Element, indent));
    }
  };
  
  Array.from(doc.body.children).forEach(child => processNode(child as Element));
  
  return paragraphs.filter(p => p.trim());
}

/**
 * Exporte un CCAP au format PDF professionnel
 * @param ccapData Données du CCAP à exporter
 * @param numeroProcedure Numéro de la procédure (optionnel, pour le nom de fichier)
 */
export async function exportCCAPToPdf(ccapData: CCAPData, numeroProcedure?: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;
  
  // Charger le logo AFPA
  const logoData = await loadAfpaLogo();
  
  const tocEntries: TocEntry[] = [];
  let currentPage = 1;
  
  // ============================================
  // FONCTIONS HELPER
  // ============================================
  
  /**
   * Ajoute le pied de page sur toutes les pages
   */
  const addFooter = (pageNum: number) => {
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    
    // Numéro de procédure à gauche
    if (numeroProcedure) {
      doc.text(`Procédure : ${numeroProcedure}`, margin, pageHeight - 10);
    }
    
    // Numérotation des pages à droite
    doc.text(`Page ${pageNum} / ${totalPages}`, pageWidth - margin - 30, pageHeight - 10);
    
    // Ligne de séparation
    doc.setDrawColor(200);
    doc.setLineWidth(0.3);
    doc.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);
    
    // Reset des couleurs
    doc.setTextColor(0);
  };
  
  /**
   * Vérifie si on doit ajouter une nouvelle page
   */
  const checkPageBreak = (neededSpace: number = 20): void => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      currentPage++;
      y = margin;
    }
  };
  
  /**
   * Ajoute un bloc de texte avec gestion des sauts de ligne
   */
  const addTextBlock = (
    text: string, 
    options?: { 
      size?: number; 
      bold?: boolean; 
      spacing?: number;
      leftMargin?: number;
      color?: [number, number, number];
    }
  ) => {
    const size = options?.size ?? 11;
    const bold = options?.bold ?? false;
    const spacing = options?.spacing ?? 5;
    const leftMargin = options?.leftMargin ?? 0;
    const color = options?.color ?? [0, 0, 0];

    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const actualMargin = margin + leftMargin;
    const lines = doc.splitTextToSize(text, pageWidth - actualMargin - margin);
    
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, actualMargin, y);
      y += spacing;
    });
    
    doc.setTextColor(0, 0, 0);
  };
  
  /**
   * Convertit une couleur hex en RGB pour jsPDF
   */
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const m = hex.replace(/^#/, '').match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (!m) return null;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  };

  /**
   * Ajoute un titre de section avec numérotation.
   * Tous les niveaux → bannière rectangulaire colorée (fidèle à l'aperçu).
   * Niveau 1 : pleine largeur, hauteur 9mm, texte 11pt.
   * Niveau 2 : indentée 5mm, hauteur 7.5mm, texte 10pt, opacité réduite.
   * Niveaux 3-4 : indentée davantage, hauteur 6.5mm, texte 9pt.
   * La couleur est issue de titreCouleur si fourni, sinon enteteRgb.
   */
  const addHeading = (
    number: string,
    text: string,
    level: 1 | 2 | 3 | 4 = 1,
    recordInToc: boolean = true,
    titreCouleur?: string,
    titreTaille?: number
  ) => {
    const defaultSize = level === 1 ? 11 : level === 2 ? 10 : 9;
    const size = titreTaille ?? defaultSize;
    // Indentation croissante selon le niveau
    const indent = (level - 1) * 5;
    // Hauteur de bannière décroissante selon le niveau
    const bh = level === 1 ? 9 : level === 2 ? 7.5 : 6.5;
    // Opacité de la bannière : niveau 1 = plein, niveaux inférieurs = légèrement plus clair
    const opacity = level === 1 ? 1 : level === 2 ? 0.82 : 0.68;

    checkPageBreak(bh + 6);

    if (recordInToc) {
      tocEntries.push({ number, title: text, page: currentPage, level });
    }

    const baseRgb = titreCouleur ? (hexToRgb(titreCouleur) ?? enteteRgb) : enteteRgb;
    // Mélange avec le blanc pour simuler l'opacité sur fond blanc
    const rgb: [number, number, number] = [
      Math.round(baseRgb[0] * opacity + 255 * (1 - opacity)),
      Math.round(baseRgb[1] * opacity + 255 * (1 - opacity)),
      Math.round(baseRgb[2] * opacity + 255 * (1 - opacity)),
    ];

    const bannerX = margin + indent;
    const bannerW = pageWidth - margin * 2 - indent;

    doc.setFillColor(...rgb);
    doc.roundedRect(bannerX, y, bannerW, bh, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(255, 255, 255);
    doc.text(`${number}  ${text.toUpperCase()}`, bannerX + 4, y + bh * 0.67);
    y += bh + 4;

    doc.setTextColor(0, 0, 0);
  };
  
  // ============================================
  // COULEUR D'EN-TÊTE (depuis les données ou teal par défaut)
  // ============================================
  const enteteRgb: [number, number, number] = hexToRgb(ccapData.couleurEntete || '#2F5B58') ?? [47, 91, 88];

  // ============================================
  // PAGE DE GARDE
  // ============================================

  // Logo AFPA + date
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, margin, 50, 15);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo:', error);
    }
  }
  const dateStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  doc.setFontSize(9);
  doc.setTextColor(150, 150, 150);
  doc.text(dateStr, pageWidth - margin, margin + 5, { align: 'right' });

  y = 50;

  // Bannière titre (rectangle coloré — fidèle à l'aperçu)
  const bannerH = 28;
  doc.setFillColor(...enteteRgb);
  doc.roundedRect(margin, y, pageWidth - margin * 2, bannerH, 3, 3, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  const titleText = 'CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES';
  const titleLines = doc.splitTextToSize(titleText, pageWidth - margin * 2 - 10);
  const titleStartY = y + (bannerH / 2) - ((titleLines.length - 1) * 5);
  titleLines.forEach((line: string, i: number) => {
    doc.text(line, pageWidth / 2, titleStartY + i * 7, { align: 'center' });
  });

  y += bannerH + 8;

  // Type de CCAP
  if (ccapData.typeCCAP) {
    doc.setFontSize(12);
    doc.setTextColor(...enteteRgb);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type : ${getCCAPTypeLabel(ccapData.typeCCAP)}`, pageWidth / 2, y, { align: 'center' });
    y += 8;
  }

  // Objet du marché
  if (ccapData.dispositionsGenerales?.objet) {
    y += 4;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const objetLines = doc.splitTextToSize(ccapData.dispositionsGenerales.objet, pageWidth - margin * 4);
    objetLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 7;
    });
  }

  // Numéro de procédure
  if (numeroProcedure) {
    y += 12;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Procédure n° ${numeroProcedure}`, pageWidth / 2, y, { align: 'center' });
  }

  // Ligne décorative
  y += 16;
  doc.setDrawColor(...enteteRgb);
  doc.setLineWidth(0.5);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);

  doc.setTextColor(0, 0, 0);

  // ============================================
  // SECTION D'EN-TÊTE STANDARD (non numérotée)
  // ============================================

  doc.addPage();
  currentPage++;
  y = margin;

  // Bannière "Dispositions générales" (fidèle à l'aperçu)
  const headerBannerH = 10;
  doc.setFillColor(...enteteRgb);
  doc.roundedRect(margin, y, pageWidth - margin * 2, headerBannerH, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`◆  ${CCAP_HEADER_TITLE.toUpperCase()}`, margin + 6, y + 7);
  y += headerBannerH + 6;

  // Texte standard
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  const headerLines = doc.splitTextToSize(CCAP_HEADER_TEXT, pageWidth - margin * 2);
  headerLines.forEach((line: string) => {
    checkPageBreak();
    doc.text(line, margin, y);
    y += 5;
  });

  y += 10;
  doc.setTextColor(0, 0, 0);
  
  // ============================================
  // COLLECTE DES SECTIONS POUR LE SOMMAIRE
  // ============================================
  
  // On va d'abord parcourir toutes les sections pour collecter le sommaire
  // avec les numéros de page estimés
  
  if (ccapData.sections && ccapData.sections.length > 0) {
    // Nouvelle page pour le contenu
    doc.addPage();
    currentPage++;
    y = margin;
    
    const sectionNumbers = calculateSectionNumbers(ccapData.sections);
    
    // Parcourir les sections et générer le contenu
    ccapData.sections.forEach((section, index) => {
      const niveau = (section.niveau || 1) as 1 | 2 | 3 | 4;
      const sectionNumber = sectionNumbers[index];
      const leftMargin = (niveau - 1) * 5;
      
      // Ajouter le titre de la section (couleur/taille personnalisées si définies)
      addHeading(
        sectionNumber,
        section.titre,
        niveau,
        true,
        section.titreCouleur,
        section.titreTaille
      );
      
      y += 2;
      
      // Ajouter le contenu (paragraphes, tableaux, images)
      if (section.contenu) {
        const blocks = htmlToContentBlocks(section.contenu);
        const contentMargin = margin + leftMargin + 2;
        const contentWidth = pageWidth - contentMargin - margin;

        blocks.forEach(block => {
          if (block.type === 'paragraph') {
            addTextBlock(block.text, { size: 10, spacing: 5, leftMargin: leftMargin + 2 });

          } else if (block.type === 'table') {
            checkPageBreak(20);
            autoTable(doc, {
              head: block.head.length > 0 ? block.head : undefined,
              body: block.body,
              startY: y,
              margin: { left: contentMargin, right: margin },
              tableWidth: contentWidth,
              styles: { fontSize: 9, cellPadding: 2, overflow: 'linebreak' },
              headStyles: { fillColor: enteteRgb, textColor: [255, 255, 255], fontStyle: 'bold' },
              alternateRowStyles: { fillColor: [249, 250, 251] },
              theme: 'grid',
            });
            y = (doc as any).lastAutoTable.finalY + 5;
            currentPage = doc.getNumberOfPages();

          } else if (block.type === 'image') {
            try {
              checkPageBreak(60);
              const maxWidth = contentWidth;
              const imgWidth = Math.min(maxWidth, 150);
              const imgHeight = imgWidth * 0.75;
              let format = 'JPEG';
              if (block.src.includes('data:image/png') || block.src.includes('.png')) format = 'PNG';
              else if (block.src.includes('data:image/gif') || block.src.includes('.gif')) format = 'GIF';
              else if (block.src.includes('data:image/webp') || block.src.includes('.webp')) format = 'WEBP';
              doc.addImage(block.src, format, contentMargin, y, imgWidth, imgHeight);
              y += imgHeight + 8;
            } catch {
              addTextBlock('[Image non disponible]', { size: 9, spacing: 5, leftMargin: leftMargin + 2, color: [150, 150, 150] });
            }
          }
        });
        y += 4;
      }
      
      y += 3;
    });
  }
  
  // ============================================
  // INSERTION DU SOMMAIRE EN PAGE 2
  // ============================================
  
  if (tocEntries.length > 0) {
    // Insérer une nouvelle page après la page de garde
    doc.insertPage(2);
    const tocPage = 2;
    
    // Se positionner sur la page du sommaire
    doc.setPage(tocPage);
    y = margin;
    
    // Titre du sommaire
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(0, 102, 204);
    doc.text('SOMMAIRE', pageWidth / 2, y, { align: 'center' });
    y += 15;
    
    // Ligne de séparation
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    y += 10;
    
    doc.setTextColor(0, 0, 0);
    
    // Entrées du sommaire
    tocEntries.forEach(entry => {
      checkPageBreak(10);
      
      const leftMargin = (entry.level - 1) * 5;
      const fontSize = entry.level === 1 ? 12 : entry.level === 2 ? 11 : 10;
      const isBold = entry.level <= 2;
      
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      
      // Numéro et titre
      const entryText = `${entry.number} ${entry.title}`;
      const textWidth = doc.getTextWidth(entryText);
      doc.text(entryText, margin + leftMargin, y);
      
      // Points de conduite
      const dotsStart = margin + leftMargin + textWidth + 3;
      const dotsEnd = pageWidth - margin - 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      let dotX = dotsStart;
      while (dotX < dotsEnd) {
        doc.text('.', dotX, y);
        dotX += 2;
      }
      
      // Numéro de page
      doc.setFont('helvetica', isBold ? 'bold' : 'normal');
      doc.setFontSize(fontSize);
      doc.text(entry.page.toString(), pageWidth - margin, y, { align: 'right' });
      
      y += fontSize * 0.5 + 2;
    });
  }
  
  // ============================================
  // AJOUT DES PIEDS DE PAGE
  // ============================================
  
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }
  
  // ============================================
  // SAUVEGARDE
  // ============================================
  
  const filename = numeroProcedure
    ? `CCAP_${numeroProcedure}_${new Date().toISOString().split('T')[0]}.pdf`
    : `CCAP_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
}
