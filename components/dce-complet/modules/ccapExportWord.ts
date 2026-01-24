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
import type { CCAPData } from '../types';
import { getCCAPTypeLabel } from './ccapTemplates';

/**
 * Exporte un CCAP au format Word (.docx)
 * @param ccapData Données du CCAP à exporter
 * @param numeroProcedure Numéro de la procédure (optionnel, pour le nom de fichier)
 */
export async function exportCCAPToWord(ccapData: CCAPData, numeroProcedure?: string): Promise<void> {
  const children: (Paragraph | Table)[] = [];

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
  // 1. DISPOSITIONS GÉNÉRALES
  // ============================================
  children.push(
    new Paragraph({
      text: 'ARTICLE 1 - DISPOSITIONS GÉNÉRALES',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  addLabelValueParagraph(children, '1.1 Objet du marché', ccapData.dispositionsGenerales.objet);
  addLabelValueParagraph(children, '1.2 CCAG applicable', ccapData.dispositionsGenerales.ccagApplicable);
  addLabelValueParagraph(children, '1.3 Durée', ccapData.dispositionsGenerales.duree);
  
  if (ccapData.dispositionsGenerales.reconduction) {
    addLabelValueParagraph(
      children,
      '1.4 Reconduction',
      `Oui - ${ccapData.dispositionsGenerales.nbReconductions || 'Reconduction tacite'}`
    );
  } else {
    addLabelValueParagraph(children, '1.4 Reconduction', 'Non');
  }

  if (ccapData.dispositionsGenerales.periodeTransitoire) {
    addLabelValueParagraph(children, '1.5 Période transitoire', ccapData.dispositionsGenerales.periodeTransitoire);
  }

  // ============================================
  // 2. PRIX ET PAIEMENT
  // ============================================
  children.push(
    new Paragraph({
      text: 'ARTICLE 2 - PRIX ET MODALITÉS DE PAIEMENT',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  addLabelValueParagraph(children, '2.1 Type de prix', ccapData.prixPaiement.typePrix);
  addLabelValueParagraph(
    children,
    '2.2 Révision des prix',
    ccapData.prixPaiement.revision ? 'Oui' : 'Non'
  );

  if (ccapData.prixPaiement.revision && ccapData.prixPaiement.formuleRevision) {
    addLabelValueParagraph(children, '2.3 Formule de révision', ccapData.prixPaiement.formuleRevision);
  }

  addLabelValueParagraph(children, '2.4 Modalités de paiement', ccapData.prixPaiement.modalitesPaiement);
  addLabelValueParagraph(children, '2.5 Délai de paiement', ccapData.prixPaiement.delaiPaiement);
  addLabelValueParagraph(children, '2.6 Avance', ccapData.prixPaiement.avance ? 'Oui' : 'Non');
  addLabelValueParagraph(children, '2.7 Retenue de garantie', ccapData.prixPaiement.retenuGarantie ? 'Oui' : 'Non');

  // ============================================
  // 3. EXÉCUTION
  // ============================================
  children.push(
    new Paragraph({
      text: 'ARTICLE 3 - CONDITIONS D\'EXÉCUTION',
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );

  addLabelValueParagraph(children, '3.1 Délai d\'exécution', ccapData.execution.delaiExecution);
  addLabelValueParagraph(children, '3.2 Pénalités de retard', ccapData.execution.penalitesRetard);
  addLabelValueParagraph(children, '3.3 Conditions de réception', ccapData.execution.conditionsReception);

  if (ccapData.execution.lieuxExecution) {
    addLabelValueParagraph(children, '3.4 Lieux d\'exécution', ccapData.execution.lieuxExecution);
  }

  // ============================================
  // 4. CLAUSES SPÉCIFIQUES
  // ============================================
  if (ccapData.clausesSpecifiques) {
    children.push(
      new Paragraph({
        text: 'ARTICLE 4 - CLAUSES SPÉCIFIQUES',
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    let sectionNumber = 1;

    if (ccapData.clausesSpecifiques.proprietéIntellectuelle) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Propriété intellectuelle`,
        ccapData.clausesSpecifiques.proprietéIntellectuelle
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.confidentialite) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Confidentialité`,
        ccapData.clausesSpecifiques.confidentialite
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.securite) {
      addLabelValueParagraph(children, `4.${sectionNumber} Sécurité`, ccapData.clausesSpecifiques.securite);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.reversibilite) {
      addLabelValueParagraph(children, `4.${sectionNumber} Réversibilité`, ccapData.clausesSpecifiques.reversibilite);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.garantieTechnique) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Garantie technique`,
        ccapData.clausesSpecifiques.garantieTechnique
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.bonCommande) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Bons de commande`,
        ccapData.clausesSpecifiques.bonCommande
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.sousTraitance) {
      addLabelValueParagraph(children, `4.${sectionNumber} Sous-traitance`, ccapData.clausesSpecifiques.sousTraitance);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.garantieDecennale) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Garantie décennale`,
        ccapData.clausesSpecifiques.garantieDecennale
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.garantieBiennale) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Garantie biennale`,
        ccapData.clausesSpecifiques.garantieBiennale
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.parfaitAchevement) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Parfait achèvement`,
        ccapData.clausesSpecifiques.parfaitAchevement
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.assurances) {
      addLabelValueParagraph(children, `4.${sectionNumber} Assurances`, ccapData.clausesSpecifiques.assurances);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.sla) {
      addLabelValueParagraph(children, `4.${sectionNumber} SLA (Service Level Agreement)`, ccapData.clausesSpecifiques.sla);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.astreinte) {
      addLabelValueParagraph(children, `4.${sectionNumber} Astreinte`, ccapData.clausesSpecifiques.astreinte);
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.maintenancePreventive) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Maintenance préventive`,
        ccapData.clausesSpecifiques.maintenancePreventive
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.maintenanceCurative) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Maintenance curative`,
        ccapData.clausesSpecifiques.maintenanceCurative
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.engagementsRSE) {
      addLabelValueParagraph(
        children,
        `4.${sectionNumber} Engagements RSE`,
        ccapData.clausesSpecifiques.engagementsRSE
      );
      sectionNumber++;
    }

    if (ccapData.clausesSpecifiques.ethique) {
      addLabelValueParagraph(children, `4.${sectionNumber} Éthique`, ccapData.clausesSpecifiques.ethique);
    }
  }

  // ============================================
  // 5. SECTIONS PERSONNALISÉES
  // ============================================
  if (ccapData.sections && ccapData.sections.length > 0) {
    let articleNumber = ccapData.clausesSpecifiques ? 5 : 4;
    
    children.push(
      new Paragraph({
        text: `ARTICLE ${articleNumber} - DISPOSITIONS COMPLÉMENTAIRES`,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 400, after: 200 },
      })
    );

    ccapData.sections.forEach((section, index) => {
      children.push(
        new Paragraph({
          text: section.titre,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 150 },
        })
      );

      // Convertir les retours à la ligne en paragraphes séparés
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
