// ============================================
// Export CCAP vers PDF Professionnel
// ============================================

import { jsPDF } from 'jspdf';
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
   * Si titreCouleur ou titreTaille sont fournis, ils remplacent les valeurs par défaut (niveau).
   */
  const addHeading = (
    number: string,
    text: string,
    level: 1 | 2 | 3 | 4 = 1,
    recordInToc: boolean = true,
    titreCouleur?: string,
    titreTaille?: number
  ) => {
    const defaultSize = level === 1 ? 16 : level === 2 ? 14 : level === 3 ? 12 : 11;
    const size = titreTaille ?? defaultSize;
    const leftMargin = (level - 1) * 5;
    const fullTitle = `${number} ${text}`;

    checkPageBreak(15);

    if (recordInToc) {
      tocEntries.push({
        number,
        title: text,
        page: currentPage,
        level
      });
    }

    const defaultColors: Record<number, [number, number, number]> = {
      1: [0, 102, 204],
      2: [16, 185, 129],
      3: [147, 51, 234],
      4: [249, 115, 22]
    };
    const rgb = titreCouleur ? hexToRgb(titreCouleur) : null;
    const color = rgb ?? (defaultColors[level] || [0, 0, 0]);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const actualMargin = margin + leftMargin;
    doc.text(fullTitle, actualMargin, y);

    y += size * 0.5 + 3;
    doc.setTextColor(0, 0, 0);
  };
  
  // ============================================
  // PAGE DE GARDE
  // ============================================
  
  // Logo AFPA
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, margin, 50, 15);
    } catch (error) {
      console.warn('Erreur lors de l\'ajout du logo:', error);
    }
  }
  
  y = 60;
  
  // Titre principal
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.setTextColor(0, 102, 204);
  const titleLines = doc.splitTextToSize('CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES', pageWidth - margin * 2);
  titleLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 12;
  });
  
  y += 10;
  
  // Type de CCAP
  if (ccapData.typeCCAP) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`Type de marché : ${getCCAPTypeLabel(ccapData.typeCCAP)}`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }
  
  // Objet du marché
  if (ccapData.dispositionsGenerales?.objet) {
    y += 10;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    const objetLines = doc.splitTextToSize(ccapData.dispositionsGenerales.objet, pageWidth - margin * 4);
    objetLines.forEach((line: string) => {
      doc.text(line, pageWidth / 2, y, { align: 'center' });
      y += 8;
    });
  }
  
  // Numéro de procédure
  if (numeroProcedure) {
    y += 20;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    doc.text(`Procédure n° ${numeroProcedure}`, pageWidth / 2, y, { align: 'center' });
  }
  
  // Date
  y += 10;
  doc.setFontSize(11);
  const dateStr = new Date().toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  doc.text(dateStr, pageWidth / 2, y, { align: 'center' });
  
  // Ligne de séparation décorative
  y += 20;
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.line(margin + 30, y, pageWidth - margin - 30, y);
  
  doc.setTextColor(0, 0, 0);
  
  // ============================================
  // SECTION D'EN-TÊTE STANDARD (non numérotée)
  // ============================================
  
  doc.addPage();
  currentPage++;
  y = margin;
  
  // Titre de la section d'en-tête
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 102, 204);
  doc.text(CCAP_HEADER_TITLE, margin, y);
  y += 10;
  
  // Ligne de séparation
  doc.setDrawColor(0, 102, 204);
  doc.setLineWidth(0.5);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;
  
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
      
      // Ajouter le contenu (convertir HTML en texte)
      if (section.contenu) {
        const paragraphs = htmlToPlainText(section.contenu);
        paragraphs.forEach(para => {
          // Détecter les images
          if (para.startsWith('[IMAGE:') && para.endsWith(']')) {
            const src = para.substring(7, para.length - 1);
            console.log('🖼️ Image détectée pour export PDF:', src.substring(0, 50) + '...');
            
            try {
              checkPageBreak(110); // Espace nécessaire pour l'image
              
              // Dimensions optimales pour A4 : largeur max ~160mm, hauteur adaptée
              const maxWidth = pageWidth - (2 * margin) - leftMargin - 4;
              const imgWidth = Math.min(maxWidth, 150); // Max 150mm de large
              const imgHeight = imgWidth * 0.75; // Ratio 4:3
              const imgX = margin + leftMargin + 2;
              
              // Détecter le format de l'image depuis le data URI
              // jsPDF supporte: JPEG, PNG, GIF, BMP, WEBP
              let format = 'JPEG';
              if (src.includes('data:image/png') || src.includes('.png')) {
                format = 'PNG';
              } else if (src.includes('data:image/gif') || src.includes('.gif')) {
                format = 'GIF';
              } else if (src.includes('data:image/webp') || src.includes('.webp')) {
                format = 'WEBP';
              } else if (src.includes('data:image/bmp') || src.includes('.bmp')) {
                format = 'BMP';
              } else if (src.includes('data:image/jpeg') || src.includes('data:image/jpg') || src.includes('.jpg') || src.includes('.jpeg')) {
                format = 'JPEG';
              }
              
              console.log('📄 Format détecté:', format);
              console.log('📐 Dimensions:', imgWidth + 'mm x ' + imgHeight + 'mm');
              
              doc.addImage(src, format, imgX, y, imgWidth, imgHeight);
              y += imgHeight + 8;
              console.log('✅ Image ajoutée avec succès au PDF');
            } catch (error) {
              console.error('❌ Erreur lors de l\'ajout de l\'image PDF:', error);
              // En cas d'erreur, afficher un texte de remplacement
              addTextBlock('[Image non disponible]', { 
                size: 9, 
                spacing: 5,
                leftMargin: leftMargin + 2,
                color: [150, 150, 150]
              });
            }
          } else {
            addTextBlock(para, { 
              size: 10, 
              spacing: 5,
              leftMargin: leftMargin + 2
            });
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
