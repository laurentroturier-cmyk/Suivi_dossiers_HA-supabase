// ============================================
// Export CCAP vers Word (DOCX)
// ============================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ShadingType,
  convertInchesToTwip,
} from 'docx';
import { saveAs } from 'file-saver';
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
 * Convertit un niveau (1-4) en HeadingLevel de docx
 */
function getHeadingLevel(niveau: number = 1) {
  switch (niveau) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    case 4: return HeadingLevel.HEADING_4;
    default: return HeadingLevel.HEADING_1;
  }
}

/**
 * Convertit base64 en buffer pour docx
 */
function base64ToBuffer(base64: string): Uint8Array {
  // Enlever le préfixe data:image/...;base64,
  const base64Data = base64.split(',')[1] || base64;
  const binaryString = atob(base64Data);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Convertit du HTML simple en paragraphes Word
 * Supporte: <p>, <strong>, <em>, <s>, <u>, <ul>, <ol>, <li>, <h1>-<h6>, <img>, <table>
 */
function htmlToParagraphs(html: string): (Paragraph | Table)[] {
  const paragraphs: (Paragraph | Table)[] = [];
  
  // Si pas de HTML (texte brut), traiter comme avant
  if (!html.includes('<')) {
    const lines = html.split('\n').filter(p => p.trim());
    lines.forEach(line => {
      paragraphs.push(
        new Paragraph({
          text: line,
          spacing: { after: 100 },
        })
      );
    });
    return paragraphs;
  }

  // Parser basique HTML
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  const processNode = (node: ChildNode, listLevel: number = 0): void => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(text)],
            spacing: { after: 100 },
          })
        );
      }
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const element = node as Element;
    const tagName = element.tagName.toLowerCase();

    switch (tagName) {
      case 'p':
        const pContent = extractTextRuns(element);
        if (pContent.length > 0) {
          paragraphs.push(
            new Paragraph({
              children: pContent,
              spacing: { after: 100 },
            })
          );
        }
        break;

      case 'h2':
        paragraphs.push(
          new Paragraph({
            text: element.textContent || '',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 200, after: 100 },
          })
        );
        break;

      case 'h3':
        paragraphs.push(
          new Paragraph({
            text: element.textContent || '',
            heading: HeadingLevel.HEADING_3,
            spacing: { before: 150, after: 100 },
          })
        );
        break;

      case 'ul':
      case 'ol':
        element.childNodes.forEach(child => {
          if (child.nodeName.toLowerCase() === 'li') {
            const liContent = extractTextRuns(child as Element);
            paragraphs.push(
              new Paragraph({
                children: liContent,
                bullet: tagName === 'ul' ? { level: listLevel } : undefined,
                numbering: tagName === 'ol' ? { reference: 'default-numbering', level: listLevel } : undefined,
                spacing: { after: 50 },
              })
            );
          }
        });
        break;

      case 'img':
        try {
          const src = (element as HTMLImageElement).src;
          if (src) {
            const imageData = base64ToBuffer(src);
            paragraphs.push(
              new Paragraph({
                children: [
                  new ImageRun({
                    data: imageData,
                    transformation: {
                      width: 400,
                      height: 300,
                    },
                  }),
                ],
                spacing: { before: 100, after: 100 },
              })
            );
          }
        } catch (error) {
          console.warn('Erreur lors de l\'ajout de l\'image:', error);
        }
        break;

      default:
        // Traiter les enfants
        element.childNodes.forEach(child => processNode(child, listLevel));
    }
  };

  // Extraire les TextRuns et ImageRuns avec formatage (gras, italique, etc.)
  const extractTextRuns = (element: Element): (TextRun | ImageRun)[] => {
    const runs: (TextRun | ImageRun)[] = [];

    const processTextNode = (node: ChildNode, bold = false, italic = false, strike = false): void => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (text.trim() || text === ' ') {
          runs.push(new TextRun({
            text,
            bold,
            italics: italic,
            strike,
          }));
        }
        return;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return;

      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      switch (tag) {
        case 'img':
          try {
            const src = (el as HTMLImageElement).src;
            if (src) {
              const imageData = base64ToBuffer(src);
              runs.push(
                new ImageRun({
                  data: imageData,
                  transformation: {
                    width: 200,
                    height: 150,
                  },
                })
              );
            }
          } catch (error) {
            console.warn('Erreur lors de l\'ajout de l\'image inline:', error);
          }
          break;
        case 'strong':
        case 'b':
          el.childNodes.forEach(child => processTextNode(child, true, italic, strike));
          break;
        case 'em':
        case 'i':
          el.childNodes.forEach(child => processTextNode(child, bold, true, strike));
          break;
        case 's':
        case 'strike':
          el.childNodes.forEach(child => processTextNode(child, bold, italic, true));
          break;
        default:
          el.childNodes.forEach(child => processTextNode(child, bold, italic, strike));
      }
    };

    element.childNodes.forEach(child => processTextNode(child));
    return runs;
  };

  body.childNodes.forEach(child => processNode(child));

  return paragraphs;
}

/**
 * Exporte un CCAP au format Word (.docx)
 * @param ccapData Données du CCAP à exporter
 * @param numeroProcedure Numéro de la procédure (optionnel, pour le nom de fichier)
 */
export async function exportCCAPToWord(ccapData: CCAPData, numeroProcedure?: string): Promise<void> {
  const children: (Paragraph | Table)[] = [];

  const hasImportedSections = Array.isArray(ccapData.sections) && ccapData.sections.length > 0;

  // En-tête du document
  children.push(
    new Paragraph({
      text: 'CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES',
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  );

  if (ccapData.typeCCAP) {
    children.push(
      new Paragraph({
        text: `Type de marché : ${getCCAPTypeLabel(ccapData.typeCCAP)}`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: ccapData.dispositionsGenerales.objet || 'Objet du marché',
          bold: true,
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
    })
  );

  // ============================================
  // SECTION D'EN-TÊTE STANDARD (non numérotée)
  // ============================================
  children.push(
    new Paragraph({
      text: CCAP_HEADER_TITLE,
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  children.push(
    new Paragraph({
      text: CCAP_HEADER_TEXT,
      spacing: { after: 400 },
      alignment: AlignmentType.JUSTIFIED,
    })
  );

  // Table des matières (optionnelle - à implémenter si nécessaire)
  
  // ============================================
  // EXPORT DU CONTENU IMPORTÉ (SECTIONS)
  // ============================================
  if (hasImportedSections) {
    const sectionNumbers = calculateSectionNumbers(ccapData.sections);
    
    ccapData.sections.forEach((section, index) => {
      const niveau = section.niveau || 1;
      const sectionNumber = sectionNumbers[index];
      
      children.push(
        new Paragraph({
          text: `${sectionNumber} ${section.titre}`,
          heading: getHeadingLevel(niveau),
          spacing: { before: 300, after: 150 },
        })
      );

      // Convertir le HTML du contenu en paragraphes Word
      const contentParagraphs = htmlToParagraphs(section.contenu);
      children.push(...contentParagraphs);
    });
  }

  // ============================================
  // Création du document Word
  // ============================================
  const doc = new Document({
    creator: 'AFPA - Application Suivi Dossiers',
    description: 'Cahier des Clauses Administratives Particulières',
    title: ccapData.dispositionsGenerales.objet || 'CCAP',
    sections: [
      {
        properties: {},
        children,
      },
    ],
  });

  // Génération et téléchargement
  const blob = await Packer.toBlob(doc);
  const filename = numeroProcedure
    ? `CCAP_${numeroProcedure}_${new Date().toISOString().split('T')[0]}.docx`
    : `CCAP_${new Date().toISOString().split('T')[0]}.docx`;
  
  saveAs(blob, filename);
}

/**
 * Ajoute un paragraphe avec label et valeur
 */
function addLabelValueParagraph(children: (Paragraph | Table)[], label: string, value: string) {
  if (!value) return;

  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text: `${label} : `,
          bold: true,
        }),
        new TextRun({
          text: value,
        }),
      ],
      spacing: { after: 150 },
    })
  );
}
