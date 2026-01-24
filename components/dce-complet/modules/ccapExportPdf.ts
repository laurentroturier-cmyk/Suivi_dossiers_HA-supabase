// ============================================
// Export CCAP vers PDF
// ============================================

import { jsPDF } from 'jspdf';
import type { CCAPData } from '../types';
import { getCCAPTypeLabel } from './ccapTemplates';

/**
 * Exporte un CCAP au format PDF
 * @param ccapData Données du CCAP à exporter
 * @param numeroProcedure Numéro de la procédure (optionnel, pour le nom de fichier)
 */
export async function exportCCAPToPdf(ccapData: CCAPData, numeroProcedure?: string): Promise<void> {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let y = margin;

  const addTextBlock = (text: string, options?: { size?: number; bold?: boolean; spacing?: number }) => {
    const size = options?.size ?? 11;
    const bold = options?.bold ?? false;
    const spacing = options?.spacing ?? 5;

    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);

    const lines = doc.splitTextToSize(text, pageWidth - margin * 2);
    lines.forEach((line: string) => {
      if (y > pageHeight - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += spacing;
    });
  };

  const addHeading = (text: string, level: 1 | 2 = 1) => {
    const size = level === 1 ? 14 : 12;
    addTextBlock(text, { size, bold: true, spacing: 6 });
    y += 2;
  };

  // Titre
  addHeading('CAHIER DES CLAUSES ADMINISTRATIVES PARTICULIÈRES', 1);

  if (ccapData.typeCCAP) {
    addTextBlock(`Type de marché : ${getCCAPTypeLabel(ccapData.typeCCAP)}`, { size: 11, spacing: 5 });
  }

  if (ccapData.dispositionsGenerales?.objet) {
    addTextBlock(ccapData.dispositionsGenerales.objet, { size: 11, bold: true, spacing: 6 });
  }

  // Export basé sur les sections importées
  if (ccapData.sections && ccapData.sections.length > 0) {
    ccapData.sections.forEach((section) => {
      addHeading(section.titre || 'Section', 2);
      if (section.contenu) {
        addTextBlock(section.contenu, { size: 11, spacing: 5 });
      }
      y += 2;
    });
  }

  const filename = numeroProcedure
    ? `CCAP_${numeroProcedure}_${new Date().toISOString().split('T')[0]}.pdf`
    : `CCAP_${new Date().toISOString().split('T')[0]}.pdf`;

  doc.save(filename);
}
