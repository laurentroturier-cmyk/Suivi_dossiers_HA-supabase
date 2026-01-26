// ============================================
// Export CCAP vers Word (DOCX)
// ============================================

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
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

  // Table des matières (optionnelle - à implémenter si nécessaire)
  
  // ============================================
  // EXPORT DU CONTENU IMPORTÉ (SECTIONS)
  // ============================================
  if (hasImportedSections) {
    ccapData.sections.forEach((section) => {
      children.push(
        new Paragraph({
          text: section.titre,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150 },
        })
      );

      const paragraphs = section.contenu.split('\n').filter(p => p.trim());
      paragraphs.forEach(para => {
        children.push(
          new Paragraph({
            text: para,
            spacing: { after: 100 },
          })
        );
      });
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
